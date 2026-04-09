import { parse, format } from "date-fns";
import type { BookingRepository } from "@/domain/booking";
import type {
  CustomerRepository,
  CreateCustomerInput,
} from "@/domain/customer";
import type {
  PaymentGateway,
  PaymentRepository,
} from "@/domain/payment";
import { PaymentStatus } from "@/domain/payment";
import { BookingStatus } from "@/domain/booking";

/**
 * Customer fields (camelCase) consumed by the use case.
 * Mirrors the shape produced by the booking form (Zod schema).
 */
export interface CheckoutCustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string; // "JJ/MM/AAAA"
  birthPlace?: string | null;
  address: string;
  address2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  driverLicenseNumber?: string | null;
  driverLicenseIssuedAt?: string | null; // "JJ/MM/AAAA"
  driverLicenseCountry?: string | null;
}

export interface StartCheckoutInput {
  customerData: CheckoutCustomerData;
  vehicleId: string;
  vehicleBrand: string;
  vehicleModel: string;
  agencyId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
  /** Booking id from the `initiated` step (optional). */
  bookingId?: string;
  /** Origin URL used to build success/cancel redirect URLs. */
  origin: string;
}

export interface StartCheckoutOutput {
  success: boolean;
  customerId?: string;
  bookingId?: string;
  checkoutUrl?: string;
  error?: string;
}

interface StartCheckoutDeps {
  customerRepository: CustomerRepository;
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
  paymentGateway: PaymentGateway;
}

const PENDING_PAYMENT_TTL_MS = 10 * 60 * 1000;

/**
 * Converts a French date "JJ/MM/AAAA" into the SQL "YYYY-MM-DD" format.
 * Returns null when the input is empty/invalid.
 */
const frenchDateToISODate = (
  value: string | undefined | null
): string | null => {
  if (!value) return null;
  try {
    const parsed = parse(value, "dd/MM/yyyy", new Date());
    return format(parsed, "yyyy-MM-dd");
  } catch {
    return null;
  }
};

const toCreateCustomerInput = (
  data: CheckoutCustomerData
): CreateCustomerInput => ({
  firstName: data.firstName,
  lastName: data.lastName,
  email: data.email,
  phone: data.phone,
  birthDate: frenchDateToISODate(data.birthDate) ?? "",
  birthPlace: data.birthPlace ?? null,
  address: data.address,
  address2: data.address2 ?? null,
  postalCode: data.postalCode,
  city: data.city,
  country: data.country,
  driverLicenseNumber: data.driverLicenseNumber ?? null,
  driverLicenseIssuedAt: frenchDateToISODate(data.driverLicenseIssuedAt),
  driverLicenseCountry: data.driverLicenseCountry ?? null,
});

/**
 * Orchestrates the move from `initiated` to `pending_payment`:
 *  1. Find or create the customer
 *  2. Create or update the booking (with the 10-minute expiry)
 *  3. Drop stale `created`-status payments for that booking
 *  4. Create a fresh payment record
 *  5. Create a Stripe Checkout session via the PaymentGateway port
 *  6. Persist the session id on the payment row
 *
 * Replaces the old `actions/create-booking.ts` (~308 lines, mixing Supabase
 * calls, Stripe SDK calls, business rules, and security guards).
 */
export const createStartCheckoutUseCase = (deps: StartCheckoutDeps) => {
  const execute = async (
    input: StartCheckoutInput
  ): Promise<StartCheckoutOutput> => {
    try {
      // 1. Customer
      let customer = await deps.customerRepository.findByEmail(
        input.customerData.email
      );
      if (!customer) {
        try {
          customer = await deps.customerRepository.create(
            toCreateCustomerInput(input.customerData)
          );
        } catch (e) {
          return {
            success: false,
            error: `Impossible de créer le client: ${
              e instanceof Error ? e.message : "Erreur inconnue"
            }`,
          };
        }
      }

      // 2. Booking
      const expiresAt = new Date(
        Date.now() + PENDING_PAYMENT_TTL_MS
      ).toISOString();
      const startISO = input.startDate.toISOString();
      const endISO = input.endDate.toISOString();

      let booking;

      if (input.bookingId) {
        // Guard: existing booking must still be modifiable.
        const existing = await deps.bookingRepository.findById(input.bookingId);
        if (!existing) {
          return {
            success: false,
            error: "Réservation introuvable. Veuillez réessayer.",
          };
        }
        if (existing.status === BookingStatus.Paid) {
          return {
            success: false,
            error:
              "Cette réservation a déjà été payée et ne peut plus être modifiée.",
          };
        }
        if (
          existing.status === BookingStatus.Cancelled ||
          existing.status === BookingStatus.Expired
        ) {
          return {
            success: false,
            error:
              "Cette réservation n'est plus valide. Veuillez créer une nouvelle réservation.",
          };
        }

        booking = await deps.bookingRepository.update(
          input.bookingId,
          {
            customerId: customer.id,
            vehicleId: input.vehicleId,
            agencyId: input.agencyId,
            startDate: startISO,
            endDate: endISO,
            totalPrice: input.totalPrice,
            status: BookingStatus.PendingPayment,
            expiresAt,
          },
          {
            expectedStatuses: [
              BookingStatus.Initiated,
              BookingStatus.PendingPayment,
            ],
          }
        );

        if (!booking) {
          return {
            success: false,
            error: "Impossible de mettre à jour la réservation.",
          };
        }
      } else {
        booking = await deps.bookingRepository.create({
          customerId: customer.id,
          vehicleId: input.vehicleId,
          agencyId: input.agencyId,
          startDate: startISO,
          endDate: endISO,
          totalPrice: input.totalPrice,
          status: BookingStatus.PendingPayment,
          expiresAt,
        });
      }

      // 3. Drop stale payments for this booking
      if (input.bookingId) {
        await deps.paymentRepository.deleteCreatedByBookingId(booking.id);
      }

      // 4. Create new payment row
      const payment = await deps.paymentRepository.create({
        bookingId: booking.id,
        amount: input.totalPrice,
        currency: "EUR",
        status: PaymentStatus.Created,
        provider: "stripe",
      });

      // 5. Stripe Checkout session
      const session = await deps.paymentGateway.createCheckoutSession({
        bookingId: booking.id,
        paymentId: payment.id,
        customerId: customer.id,
        customerEmail: customer.email,
        amount: input.totalPrice,
        currency: "EUR",
        productName: `Location ${input.vehicleBrand} ${input.vehicleModel}`,
        productDescription: `Réservation du ${format(
          input.startDate,
          "dd/MM/yyyy"
        )} au ${format(input.endDate, "dd/MM/yyyy")}`,
        successUrl: `${input.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${input.origin}/booking/${input.vehicleId}?start=${startISO}&end=${endISO}&bookingId=${booking.id}`,
      });

      // 6. Persist session id on payment
      await deps.paymentRepository.update(payment.id, {
        stripeCheckoutSessionId: session.id,
      });

      return {
        success: true,
        customerId: customer.id,
        bookingId: booking.id,
        checkoutUrl: session.url ?? undefined,
      };
    } catch (e) {
      return {
        success: false,
        error:
          e instanceof Error
            ? e.message
            : "Une erreur inattendue s'est produite. Veuillez réessayer.",
      };
    }
  };

  return { execute };
};

export type StartCheckoutUseCase = ReturnType<typeof createStartCheckoutUseCase>;

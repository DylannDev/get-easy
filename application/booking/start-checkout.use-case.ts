import { format } from "date-fns";
import type { BookingRepository } from "@/domain/booking";
import type { CustomerRepository } from "@/domain/customer";
import type { PaymentGateway, PaymentRepository } from "@/domain/payment";
import type { OptionRepository } from "@/domain/option";
import { PaymentStatus } from "@/domain/payment";
import type {
  StartCheckoutInput,
  StartCheckoutOutput,
} from "./start-checkout/types";
import { upsertCustomer } from "./start-checkout/upsert-customer";
import { upsertBooking } from "./start-checkout/upsert-booking";
import { attachOptions } from "./start-checkout/attach-options";

// Re-exports pour les callers externes (server actions, etc.).
export type {
  CheckoutCustomerData,
  SelectedOptionInput,
  StartCheckoutInput,
  StartCheckoutOutput,
} from "./start-checkout/types";

interface StartCheckoutDeps {
  customerRepository: CustomerRepository;
  bookingRepository: BookingRepository;
  paymentRepository: PaymentRepository;
  paymentGateway: PaymentGateway;
  optionRepository: OptionRepository;
}

/**
 * Orchestrates the move from `initiated` to `pending_payment`:
 *  1. Find or create the customer (B2B fields applied if checked)
 *  2. Create or update the booking (with the 10-minute expiry + status guards)
 *  3. Attach selected options with price snapshots
 *  4. Drop stale `created`-status payments for that booking
 *  5. Create a fresh payment record
 *  6. Create a Stripe Checkout session via the PaymentGateway port
 *  7. Persist the session id on the payment row
 *
 * Replaces the old `actions/create-booking.ts` (~308 lines, mixing Supabase
 * calls, Stripe SDK calls, business rules, and security guards).
 */
export const createStartCheckoutUseCase = (deps: StartCheckoutDeps) => {
  const execute = async (
    input: StartCheckoutInput,
  ): Promise<StartCheckoutOutput> => {
    try {
      const customerResult = await upsertCustomer(
        deps.customerRepository,
        input.customerData,
      );
      if (!customerResult.ok) {
        return { success: false, error: customerResult.error };
      }
      const customer = customerResult.customer;

      const bookingResult = await upsertBooking({
        bookingRepository: deps.bookingRepository,
        input,
        customerId: customer.id,
      });
      if (!bookingResult.ok) {
        return { success: false, error: bookingResult.error };
      }
      const booking = bookingResult.booking;

      const optionsResult = await attachOptions({
        optionRepository: deps.optionRepository,
        bookingId: booking.id,
        agencyId: input.agencyId,
        selectedOptions: input.selectedOptions ?? [],
      });
      if (!optionsResult.ok) {
        return { success: false, error: optionsResult.error };
      }

      // Nettoyage des paiements stale (cas re-checkout).
      if (input.bookingId) {
        await deps.paymentRepository.deleteCreatedByBookingId(booking.id);
      }

      const payment = await deps.paymentRepository.create({
        bookingId: booking.id,
        amount: input.totalPrice,
        currency: "EUR",
        status: PaymentStatus.Created,
        provider: "stripe",
      });

      const startISO = input.startDate.toISOString();
      const endISO = input.endDate.toISOString();
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
          "dd/MM/yyyy",
        )} au ${format(input.endDate, "dd/MM/yyyy")}`,
        successUrl: `${input.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${input.origin}/booking/${input.vehicleId}?start=${startISO}&end=${endISO}&bookingId=${booking.id}`,
      });

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

import { createAdminClient } from "../client";
import { toDomainPayment } from "../mappers";
import type {
  Payment,
  PaymentRepository,
  CreatePaymentInput,
  UpdatePaymentInput,
} from "@/domain/payment";

export const createSupabasePaymentRepository = (): PaymentRepository => {
  const findById = async (paymentId: string): Promise<Payment | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();
    if (error || !data) return null;
    return toDomainPayment(data);
  };

  const findByStripePaymentIntentId = async (
    stripePaymentIntentId: string
  ): Promise<Payment | null> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("stripe_payment_intent_id", stripePaymentIntentId)
      .maybeSingle();
    if (error || !data) return null;
    return toDomainPayment(data);
  };

  const create = async (input: CreatePaymentInput): Promise<Payment> => {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("payments")
      .insert({
        booking_id: input.bookingId,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        provider: input.provider,
        stripe_checkout_session_id: input.stripeCheckoutSessionId ?? null,
        stripe_payment_intent_id: input.stripePaymentIntentId ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      throw new Error(
        `Failed to create payment: ${error?.message ?? "unknown error"}`
      );
    }
    return toDomainPayment(data);
  };

  const update = async (
    paymentId: string,
    input: UpdatePaymentInput
  ): Promise<Payment | null> => {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (input.status !== undefined) patch.status = input.status;
    if (input.stripeCheckoutSessionId !== undefined) {
      patch.stripe_checkout_session_id = input.stripeCheckoutSessionId;
    }
    if (input.stripePaymentIntentId !== undefined) {
      patch.stripe_payment_intent_id = input.stripePaymentIntentId;
    }

    const { data, error } = await supabase
      .from("payments")
      .update(patch)
      .eq("id", paymentId)
      .select()
      .single();
    if (error || !data) return null;
    return toDomainPayment(data);
  };

  const deleteCreatedByBookingId = async (bookingId: string): Promise<void> => {
    const supabase = createAdminClient();
    await supabase
      .from("payments")
      .delete()
      .eq("booking_id", bookingId)
      .eq("status", "created");
  };

  return {
    findById,
    findByStripePaymentIntentId,
    create,
    update,
    deleteCreatedByBookingId,
  };
};

import { createAdminClient } from "../client";
import { toDomainContractFields } from "../mappers";
import type {
  BookingContractFields,
  ContractFieldsRepository,
  SaveContractFieldsInput,
} from "@/domain/contract";

export const createSupabaseContractFieldsRepository =
  (): ContractFieldsRepository => {
    const findByBooking = async (
      bookingId: string
    ): Promise<BookingContractFields | null> => {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("booking_contract_fields")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();
      if (error || !data) return null;
      return toDomainContractFields(data);
    };

    const save = async (
      input: SaveContractFieldsInput
    ): Promise<BookingContractFields> => {
      const supabase = createAdminClient();
      const existing = await findByBooking(input.bookingId);

      const customerSignature =
        input.customerSignature !== undefined
          ? input.customerSignature
          : existing?.customerSignature ?? null;
      const loueurSignature =
        input.loueurSignature !== undefined
          ? input.loueurSignature
          : existing?.loueurSignature ?? null;

      // `signed_at` est posé au premier moment où les deux signatures sont
      // présentes, et préservé par la suite (tant que l'une n'est pas
      // effacée).
      let signedAt: string | null = existing?.signedAt ?? null;
      if (customerSignature && loueurSignature) {
        if (!signedAt) signedAt = new Date().toISOString();
      } else {
        // Si une signature est retirée, on annule la signature globale.
        signedAt = null;
      }

      const { data, error } = await supabase
        .from("booking_contract_fields")
        .upsert(
          {
            booking_id: input.bookingId,
            fields: input.fields,
            customer_signature: customerSignature,
            loueur_signature: loueurSignature,
            signed_at: signedAt,
          },
          { onConflict: "booking_id" }
        )
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          `Impossible d'enregistrer le contrat : ${error?.message ?? "inconnu"}`
        );
      }
      return toDomainContractFields(data);
    };

    const deleteByBooking = async (bookingId: string): Promise<void> => {
      const supabase = createAdminClient();
      await supabase
        .from("booking_contract_fields")
        .delete()
        .eq("booking_id", bookingId);
    };

    return { findByBooking, save, deleteByBooking };
  };

import type { Database } from "../database.types";
import type {
  BookingContractFields,
  ContractEditableFields,
} from "@/domain/contract";

type Row = Database["public"]["Tables"]["booking_contract_fields"]["Row"];

export function toDomainContractFields(row: Row): BookingContractFields {
  return {
    bookingId: row.booking_id,
    fields: (row.fields as ContractEditableFields) ?? {},
    customerSignature: row.customer_signature,
    loueurSignature: row.loueur_signature,
    signedAt: row.signed_at,
    updatedAt: row.updated_at,
  };
}

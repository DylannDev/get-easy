import type {
  BookingContractFields,
  ContractEditableFields,
} from "./contract-fields.entity";

export interface SaveContractFieldsInput {
  bookingId: string;
  fields: ContractEditableFields;
  customerSignature?: string | null;
  loueurSignature?: string | null;
}

export interface ContractFieldsRepository {
  findByBooking(bookingId: string): Promise<BookingContractFields | null>;
  /**
   * Upsert : crée la ligne si elle n'existe pas, met à jour sinon.
   * Met à jour `signed_at` automatiquement si les deux signatures sont
   * fournies pour la première fois.
   */
  save(input: SaveContractFieldsInput): Promise<BookingContractFields>;
  /**
   * Supprime la ligne associée au booking — appelé quand on supprime le
   * PDF du contrat, pour repartir à zéro.
   */
  deleteByBooking(bookingId: string): Promise<void>;
}

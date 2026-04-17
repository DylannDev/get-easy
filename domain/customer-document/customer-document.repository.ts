import type {
  CustomerDocument,
  CustomerDocumentType,
} from "./customer-document.entity";

export interface UpsertCustomerDocumentInput {
  customerId: string;
  bookingId?: string | null;
  type: CustomerDocumentType;
  /** Fichier à stocker. Déjà compressé si pertinent. */
  content: Buffer | Uint8Array | ArrayBuffer;
  fileName: string;
  mimeType: string;
  /** ID de l'organisation (résolu via agence → organization). */
  organizationId: string;
}

export interface CustomerDocumentRepository {
  listByCustomer(customerId: string): Promise<CustomerDocument[]>;
  listByBooking(bookingId: string): Promise<CustomerDocument[]>;
  findById(id: string): Promise<CustomerDocument | null>;
  /**
   * Upsert atomique : si un document du même (customer, type) existe déjà,
   * l'ancien fichier Storage est supprimé et la ligne DB remplacée.
   */
  upsert(input: UpsertCustomerDocumentInput): Promise<CustomerDocument>;
  /**
   * Finalise un upload en staging (fichier temporaire à
   * `staging/{stagingKey}`) en le déplaçant vers le chemin final et en
   * créant/mettant à jour la ligne `customer_documents`.
   */
  finalizeFromStaging(input: {
    stagingKey: string;
    customerId: string;
    bookingId: string | null;
    type: CustomerDocumentType;
    organizationId: string;
    fileName: string;
    mimeType: string;
    size: number;
  }): Promise<CustomerDocument>;
  delete(id: string): Promise<void>;
  getSignedUrl(
    id: string,
    options?: { forceDownload?: boolean; expiresInSeconds?: number }
  ): Promise<string | null>;
}

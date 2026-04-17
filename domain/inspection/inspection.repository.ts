import type {
  InspectionReport,
  InspectionPhoto,
  InspectionType,
  FuelLevel,
} from "./inspection.entity";

export interface UpsertInspectionReportInput {
  bookingId: string;
  type: InspectionType;
  mileage?: number | null;
  fuelLevel?: FuelLevel | null;
  notes?: string | null;
}

export interface SignInspectionReportInput {
  reportId: string;
  customerSignature: string;
}

export interface AddInspectionPhotoInput {
  reportId: string;
  /** Buffer compressé de la photo. */
  content: Buffer | Uint8Array | ArrayBuffer;
  fileName: string;
  mimeType: string;
  note?: string | null;
  sortOrder: number;
  /** Chemin storage complet — construit côté caller pour rester
   *  cohérent avec l'arborescence org/agency/inspection/... */
  filePath: string;
}

export interface UpdateInspectionPhotoInput {
  note?: string | null;
  sortOrder?: number;
}

export interface InspectionRepository {
  /** Trouve un rapport par (booking, type). Null si inexistant. */
  findByBookingAndType(
    bookingId: string,
    type: InspectionType
  ): Promise<InspectionReport | null>;

  findById(id: string): Promise<InspectionReport | null>;

  /** Crée ou met à jour un rapport (upsert sur booking_id + type). */
  upsert(input: UpsertInspectionReportInput): Promise<InspectionReport>;

  /** Enregistre la signature client et marque `signed_at`. */
  sign(input: SignInspectionReportInput): Promise<InspectionReport>;

  /** Liste les photos d'un rapport, triées par sort_order. */
  listPhotos(reportId: string): Promise<InspectionPhoto[]>;

  /** Upload la photo vers Storage puis insère la ligne en BDD. */
  addPhoto(input: AddInspectionPhotoInput): Promise<InspectionPhoto>;

  /** Met à jour la note ou l'ordre d'une photo existante. */
  updatePhoto(
    photoId: string,
    input: UpdateInspectionPhotoInput
  ): Promise<InspectionPhoto | null>;

  /** Supprime la photo du Storage puis de la BDD. */
  deletePhoto(photoId: string): Promise<void>;

  /** URL signée pour afficher une photo (~1h). */
  getPhotoSignedUrl(photoId: string): Promise<string | null>;
}

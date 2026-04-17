import type { Database } from "../database.types";
import type {
  InspectionReport,
  InspectionPhoto,
  InspectionType,
  FuelLevel,
} from "@/domain/inspection";

type ReportRow = Database["public"]["Tables"]["inspection_reports"]["Row"];
type PhotoRow = Database["public"]["Tables"]["inspection_photos"]["Row"];

export function toDomainInspectionReport(row: ReportRow): InspectionReport {
  return {
    id: row.id,
    bookingId: row.booking_id,
    type: row.type as InspectionType,
    mileage: row.mileage ?? null,
    fuelLevel: (row.fuel_level as FuelLevel | null) ?? null,
    notes: row.notes ?? null,
    customerSignature: row.customer_signature ?? null,
    signedAt: row.signed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toDomainInspectionPhoto(row: PhotoRow): InspectionPhoto {
  return {
    id: row.id,
    reportId: row.report_id,
    filePath: row.file_path,
    fileName: row.file_name,
    mimeType: row.mime_type,
    size: Number(row.size),
    note: row.note ?? null,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

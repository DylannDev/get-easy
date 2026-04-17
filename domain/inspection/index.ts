export type {
  InspectionReport,
  InspectionPhoto,
  InspectionType,
  FuelLevel,
} from "./inspection.entity";
export {
  INSPECTION_TYPE_LABELS,
  FUEL_LEVEL_LABELS,
} from "./inspection.entity";
export type {
  InspectionRepository,
  UpsertInspectionReportInput,
  SignInspectionReportInput,
  AddInspectionPhotoInput,
  UpdateInspectionPhotoInput,
} from "./inspection.repository";

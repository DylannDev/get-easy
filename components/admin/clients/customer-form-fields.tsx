/**
 * Barrel re-export des composants et types de champs client. Conserve le
 * chemin d'import historique `@/components/admin/clients/customer-form-fields`
 * tout en éclatant le code en fichiers <100 lignes dans `./customer-fields/`.
 */
export { CustomerInfoFields } from "./customer-fields/info-fields";
export { CustomerAddressFields } from "./customer-fields/address-fields";
export { CustomerDriverLicenseFields } from "./customer-fields/driver-license-fields";
export { CustomerBusinessFields } from "./customer-fields/business-fields";
export { Field } from "./customer-fields/field";
export type {
  CustomerFieldsValue,
  BusinessFieldsValue,
} from "./customer-fields/types";

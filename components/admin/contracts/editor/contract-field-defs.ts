import type { FieldDef } from "./fields-card";

/** Définitions des champs éditables du contrat, regroupées par card et
 *  par sous-groupe. Le rendu est piloté par ces données via `<ContractFieldsCard />`. */
export const CUSTOMER_FIELDS: FieldDef[][] = [
  [
    { label: "Prénom", key: "customerFirstName" },
    { label: "Nom", key: "customerLastName" },
    { label: "Date de naissance", key: "customerBirthDate" },
    { label: "Lieu de naissance", key: "customerBirthPlace" },
    { label: "N° pièce d'identité", key: "customerIdNumber" },
    { label: "Pièce délivrée le", key: "customerIdIssuedAt" },
    { label: "N° permis de conduire", key: "customerLicenseNumber" },
    { label: "Permis délivré le", key: "customerLicenseIssuedAt" },
    { label: "Permis valable jusqu'au", key: "customerLicenseValidUntil" },
    { label: "Adresse", key: "customerAddress" },
    { label: "Code postal", key: "customerPostalCode" },
    { label: "Ville", key: "customerCity" },
    { label: "Pays", key: "customerCountry" },
    { label: "Téléphone", key: "customerPhone" },
    { label: "Email", key: "customerEmail" },
  ],
];

export const VEHICLE_FIELDS: FieldDef[][] = [
  [
    { label: "Marque", key: "vehicleBrand" },
    { label: "Modèle", key: "vehicleModel" },
    { label: "Puissance fiscale (CV)", key: "vehicleFiscalPower" },
    { label: "Couleur", key: "vehicleColor" },
    { label: "Immatriculation", key: "vehicleRegistrationPlate" },
  ],
  [
    {
      label: "Kilométrage (départ)",
      key: "vehicleMileageStart",
      placeholder: "Au moment de la remise",
    },
    {
      label: "Kilométrage (retour)",
      key: "vehicleMileageEnd",
      placeholder: "Au moment de la restitution",
    },
    {
      label: "Niveau carburant (départ)",
      key: "vehicleFuelStart",
      placeholder: "Ex. 3/4, Plein…",
    },
    { label: "Niveau carburant (retour)", key: "vehicleFuelEnd" },
  ],
];

export const DURATION_FIELDS: (FieldDef | null)[][] = [
  [
    { label: "Durée totale", key: "durationLabel" },
    // Cellule vide pour que "Durée totale" reste seule sur sa ligne dans la
    // grid 2-cols, sans introduire de séparateur visuel.
    null,
    { label: "Date & heure de départ", key: "rentalStart" },
    { label: "Date & heure de retour", key: "rentalEnd" },
    { label: "Prix / jour", key: "pricePerDay" },
    { label: "Total location", key: "priceTotal" },
  ],
];

export const MISC_FIELDS: FieldDef[][] = [
  [
    {
      label: "Adresse de restitution",
      key: "returnAddress",
      placeholder: "Par défaut : adresse de l'agence",
    },
    { label: "Date & heure de restitution", key: "returnDatetime" },
    {
      label: "Date du constat amiable",
      key: "constatDate",
      placeholder: "À remplir en cas d'incident",
    },
    { label: "Fait à", key: "contractCity" },
    { label: "Le", key: "contractDate" },
  ],
];

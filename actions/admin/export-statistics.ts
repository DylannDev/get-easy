"use server";

import { differenceInDays } from "date-fns";
import { getContainer } from "@/composition-root/container";

interface ExportInput {
  year: number;
  agencyId?: string;
}

interface ExportResult {
  ok: boolean;
  /** CSV string (UTF-8). Le client crée un Blob + déclenche le téléchargement. */
  csv?: string;
  /** Nom de fichier suggéré. */
  fileName?: string;
  error?: string;
}

/**
 * Export CSV des réservations payées d'une année. Champs :
 * référence, dates, client, véhicule, durée, total. Export généré côté
 * serveur pour profiter du repo + de l'agence active.
 *
 * Encodage : UTF-8 BOM ajouté pour qu'Excel ouvre les caractères français
 * correctement (sans le BOM, Excel utilise Windows-1252 par défaut).
 */
export async function exportStatisticsCsv(
  input: ExportInput
): Promise<ExportResult> {
  const { bookingRepository } = getContainer();
  const winStart = new Date(input.year, 0, 1).toISOString();
  const winEnd = new Date(input.year, 11, 31, 23, 59, 59).toISOString();

  const { data: bookings } = await bookingRepository.findAllWithDetails({
    page: 1,
    pageSize: 10000,
    agencyId: input.agencyId,
    statuses: ["paid"],
    startDate: winStart,
    endDate: winEnd,
    sort: { field: "start_date", direction: "asc" },
  });

  const headers = [
    "Référence",
    "Date début",
    "Date fin",
    "Durée (jours)",
    "Client",
    "Email",
    "Téléphone",
    "Véhicule",
    "Immatriculation",
    "Total (€)",
  ];
  const rows = bookings.map((b) => {
    const days = Math.max(
      differenceInDays(new Date(b.endDate), new Date(b.startDate)),
      1
    );
    return [
      b.id,
      new Date(b.startDate).toLocaleDateString("fr-FR"),
      new Date(b.endDate).toLocaleDateString("fr-FR"),
      String(days),
      `${b.customerFirstName} ${b.customerLastName}`,
      b.customerEmail,
      b.customerPhone,
      `${b.vehicleBrand} ${b.vehicleModel}`,
      b.vehicleRegistrationPlate,
      b.totalPrice.toFixed(2).replace(".", ","),
    ];
  });

  // Échappe chaque champ : entoure de "..." si le contenu a une virgule,
  // un guillemet ou un saut de ligne ; double les guillemets internes.
  const escape = (value: string): string => {
    if (/[",\n\r]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  const csvLines = [headers, ...rows].map((row) =>
    row.map(escape).join(",")
  );
  // BOM UTF-8 (﻿) pour Excel.
  const csv = "﻿" + csvLines.join("\n");

  return {
    ok: true,
    csv,
    fileName: `statistiques-${input.year}.csv`,
  };
}

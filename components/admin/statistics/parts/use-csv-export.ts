"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { exportStatisticsCsv } from "@/actions/admin/export-statistics";

/** Encapsule l'export CSV des stats pour une année donnée : appelle la
 *  server action, crée un Blob `text/csv;charset=utf-8;`, déclenche le
 *  téléchargement via une balise `<a>` éphémère, gère un toast d'erreur. */
export function useCsvExport(year: number) {
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const result = await exportStatisticsCsv({ year });
      if (!result.ok || !result.csv) {
        toast.error(result.error ?? "Échec de l'export.");
        return;
      }
      const blob = new Blob([result.csv], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName ?? `statistiques-${year}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export téléchargé.");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Une erreur inattendue est survenue.",
      );
    } finally {
      setExporting(false);
    }
  };

  return { exporting, exportCsv };
}

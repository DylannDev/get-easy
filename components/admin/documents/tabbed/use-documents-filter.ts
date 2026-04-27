"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { EnrichedDocument } from "../documents-content";
import { isValidTab, type TabKey } from "./types";

/**
 * Encapsule l'état de filtrage de la vue documents : onglet courant
 * (initialisé depuis l'URL `?tab=`), recherche texte, filtre année. Renvoie
 * également les groupes par type, les années disponibles dans l'onglet
 * actif, et les lignes filtrées.
 */
export function useDocumentsFilter(documents: EnrichedDocument[]) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab");
  const [tab, setTab] = useState<TabKey>(
    isValidTab(urlTab) ? urlTab : "invoice",
  );
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<"all" | number>("all");

  const docsByTab = useMemo(() => {
    const groups: Record<TabKey, EnrichedDocument[]> = {
      invoice: [],
      quote: [],
      contract: [],
      inspection: [],
    };
    for (const d of documents) {
      if (d.type === "invoice") groups.invoice.push(d);
      else if (d.type === "quote") groups.quote.push(d);
      else if (d.type === "contract") groups.contract.push(d);
      else if (d.type === "inspection") groups.inspection.push(d);
    }
    return groups;
  }, [documents]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const d of docsByTab[tab])
      years.add(new Date(d.createdAt).getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [docsByTab, tab]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docsByTab[tab].filter((d) => {
      if (
        yearFilter !== "all" &&
        new Date(d.createdAt).getFullYear() !== yearFilter
      ) {
        return false;
      }
      if (!q) return true;
      const haystacks = [
        d.fileName,
        d.invoiceNumber ?? "",
        d.quoteNumber ?? "",
        d.customer ? `${d.customer.firstName} ${d.customer.lastName}` : "",
      ].map((s) => s.toLowerCase());
      return haystacks.some((s) => s.includes(q));
    });
  }, [docsByTab, tab, search, yearFilter]);

  return {
    tab,
    setTab,
    search,
    setSearch,
    yearFilter,
    setYearFilter,
    availableYears,
    rows,
  };
}

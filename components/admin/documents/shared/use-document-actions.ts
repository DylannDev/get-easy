"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  getDocumentInlineUrl,
} from "@/actions/admin/documents";

/** Forme minimale requise pour les actions document — accepte aussi bien
 *  `Document` (vue liste) que `EnrichedDocument` (vue tabbée). */
interface DocLite {
  id: string;
  bookingId: string | null;
}

/** Encapsule les actions sur un document (visualiser/télécharger/supprimer)
 *  avec un état de loading partagé et `deleteId` pour piloter l'AlertDialog
 *  de confirmation. Générique sur la forme du document — fonctionne pour
 *  tout array dont les items ont `id` + `bookingId`. */
export function useDocumentActions<T extends DocLite>(documents: T[]) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleView = async (id: string) => {
    setLoading(true);
    const url = await getDocumentInlineUrl(id);
    setLoading(false);
    if (url) window.open(url, "_blank");
  };

  const handleDownload = async (id: string) => {
    setLoading(true);
    const url = await getDocumentDownloadUrl(id);
    setLoading(false);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    const doc = documents.find((d) => d.id === deleteId);
    await deleteDocument(deleteId, doc?.bookingId ?? null);
    setDeleteId(null);
    setLoading(false);
    router.refresh();
  };

  return {
    loading,
    setLoading,
    deleteId,
    setDeleteId,
    handleView,
    handleDownload,
    handleDelete,
  };
}

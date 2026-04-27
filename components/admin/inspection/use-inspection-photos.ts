"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  uploadInspectionPhoto,
  deleteInspectionPhoto,
} from "@/actions/admin/inspection";

export interface PendingUpload {
  id: string;
  fileName: string;
  previewUrl: string;
  done: boolean;
}

interface Args {
  bookingId: string;
  agencyId: string;
  /** Nombre de photos déjà persistées côté serveur — utilisé pour calculer
   *  un sort_order qui ne collisionne pas. */
  serverPhotoCount: number;
  /** Crée le report parent en BDD si nécessaire et renvoie son ID.
   *  Appelé avant le 1er upload tant qu'aucun report n'existe. */
  ensureReport: () => Promise<string | undefined>;
}

/**
 * Encapsule l'upload multi-fichiers (placeholders pendant le transfert),
 * la suppression sélective (mode "sélection" + checkboxes) et l'état de
 * loading/refresh pour la grille de photos d'un état des lieux. Le caller
 * fournit `ensureReport` car la création du report initial est couplée
 * au state du formulaire (km, carburant, notes).
 */
export function useInspectionPhotos({
  bookingId,
  agencyId,
  serverPhotoCount,
  ensureReport,
}: Args) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefreshTransition] = useTransition();
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);

  // Sélection multi-suppression.
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitDeleteMode = () => {
    setDeleteMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setLoading(true);
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        deleteInspectionPhoto(id, bookingId),
      ),
    );
    exitDeleteMode();
    setLoading(false);
    router.refresh();
  };

  const handleUploadMultiple = async (files: File[]) => {
    if (files.length === 0) return;

    setLoading(true);
    const reportId = await ensureReport();
    if (!reportId) {
      setLoading(false);
      return;
    }
    setLoading(false);

    const placeholders = files.map((file, i) => ({
      id: `pending-${Date.now()}-${i}`,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      done: false,
    }));
    setPendingUploads(placeholders);

    await Promise.all(
      files.map(async (file, i) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("reportId", reportId);
        fd.append("bookingId", bookingId);
        fd.append("agencyId", agencyId);
        fd.append("sortOrder", String(serverPhotoCount + i));
        const result = await uploadInspectionPhoto(fd);
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.id === placeholders[i].id ? { ...p, done: true } : p,
          ),
        );
        if (result.ok) URL.revokeObjectURL(placeholders[i].previewUrl);
      }),
    );

    // Refresh dans une transition : les placeholders restent visibles tant
    // que `refreshing` est true ; quand les vraies photos arrivent du
    // serveur, React swap automatiquement (pas de flash).
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  return {
    loading,
    setLoading,
    refreshing,
    pendingUploads,
    deleteMode,
    setDeleteMode,
    selectedIds,
    toggleSelect,
    exitDeleteMode,
    handleDeleteSelected,
    handleUploadMultiple,
  };
}

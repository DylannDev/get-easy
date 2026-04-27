"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { VehicleGrid } from "@/components/admin/vehicles/vehicle-grid";
import { Button, buttonVariants } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PiPlus, PiX } from "react-icons/pi";
import { DeleteButton } from "@/components/ui/delete-button";
import { deleteMultipleVehicles } from "@/actions/admin/vehicles";
import type { Vehicle } from "@/domain/vehicle";

interface Props {
  vehicles: Vehicle[];
}

export function VehiclesPageContent({ vehicles }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteClick = () => {
    if (selectMode && selectedIds.size > 0) {
      setShowDeleteDialog(true);
    } else if (selectMode) {
      // Exit select mode
      setSelectMode(false);
      setSelectedIds(new Set());
    } else {
      // Enter select mode
      setSelectMode(true);
    }
  };

  const handleConfirmDelete = async () => {
    setShowDeleteDialog(false);
    setLoading(true);
    await deleteMultipleVehicles(Array.from(selectedIds));
    setSelectMode(false);
    setSelectedIds(new Set());
    setLoading(false);
    router.refresh();
  };

  const cancelSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 overflow-y-auto">
      {loading && <ContentOverlay />}
      <PageHeader
        title="Véhicules"
        description={`${vehicles.length} véhicule${vehicles.length > 1 ? "s" : ""}`}
        action={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {!selectMode && (
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => {
                  setLoading(true);
                  router.push("/admin/vehicules/nouveau");
                }}
              >
                <PiPlus className="size-4" />
                Ajouter un véhicule
              </Button>
            )}
            {selectMode && (
              <Button
                variant="default"
                size="sm"
                onClick={cancelSelectMode}
                className="w-full sm:w-auto bg-transparent text-black border-2 border-black hover:bg-gray-100"
              >
                <PiX className="size-4" />
                Annuler
              </Button>
            )}
            <DeleteButton
              onClick={handleDeleteClick}
              className={`w-full sm:w-auto ${
                selectMode && selectedIds.size > 0 ? "" : selectMode ? "opacity-50" : ""
              }`}
              disabled={selectMode && selectedIds.size === 0}
              label={
                selectMode && selectedIds.size > 0
                  ? `Confirmer la suppression (${selectedIds.size})`
                  : "Supprimer"
              }
            />
          </div>
        }
      />
      <VehicleGrid
        vehicles={vehicles}
        onNavigate={() => setLoading(true)}
        selectMode={selectMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer {selectedIds.size} véhicule{selectedIds.size > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Les véhicules sélectionnés seront
              définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className={buttonVariants({ variant: "red" })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

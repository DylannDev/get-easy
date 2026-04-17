"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { BlockedPeriodDialog } from "./blocked-period-dialog";
import { deleteBlockedPeriod } from "@/actions/admin/blocked-periods";
import { formatDateCayenne } from "@/lib/format-date";
import { PiPlus, PiPencil, PiTrash } from "react-icons/pi";
import type { BlockedPeriodWithVehicle } from "@/actions/admin/blocked-periods";
import type { Vehicle } from "@/domain/vehicle";

interface Props {
  periods: BlockedPeriodWithVehicle[];
  vehicles: Vehicle[];
}

export function BlockedPeriodsContent({ periods, vehicles }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BlockedPeriodWithVehicle | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingPeriod(null);
    setDialogOpen(true);
  };

  const handleEdit = (period: BlockedPeriodWithVehicle) => {
    setEditingPeriod(period);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingPeriod(null);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditingPeriod(null);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    await deleteBlockedPeriod(deleteId);
    setDeleteId(null);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      {loading && <ContentOverlay />}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <span className="text-base font-semibold">Périodes bloquées</span>
          <Button variant="default" size="sm" onClick={handleCreate}>
            <PiPlus className="size-4" />
            Ajouter une indisponibilité
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {periods.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6">
              Aucune indisponibilité enregistrée.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Véhicule</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Commentaire</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow key={period.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {period.vehicleImg && (
                          <div className="shrink-0 rounded overflow-hidden" style={{ width: 40, height: 28 }}>
                            <Image
                              src={period.vehicleImg}
                              alt=""
                              width={40}
                              height={28}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium">
                            {period.vehicleBrand} {period.vehicleModel}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {period.vehicleRegistrationPlate}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateCayenne(period.start, "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateCayenne(period.end, "dd MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {period.comment || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(period)}
                          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        >
                          <PiPencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(period.id)}
                          className="p-2 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                        >
                          <PiTrash className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <BlockedPeriodDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        period={editingPeriod}
        vehicles={vehicles}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette indisponibilité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le véhicule sera à nouveau disponible pour cette période.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "red" })}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

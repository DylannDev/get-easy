"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
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
import { OptionDialog } from "./option-dialog";
import { deleteOption, toggleOption } from "@/actions/admin/options";
import { PiPlus, PiPencil, PiTrash } from "react-icons/pi";
import type { Option } from "@/domain/option";
import { formatMoney } from "@/lib/format-money";

interface Props {
  options: Option[];
}

export function OptionsContent({ options }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Option | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (option: Option) => {
    setEditing(option);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const handleSaved = () => {
    setDialogOpen(false);
    setEditing(null);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    await deleteOption(deleteId);
    setDeleteId(null);
    setLoading(false);
    router.refresh();
  };

  const handleToggle = async (option: Option) => {
    setLoading(true);
    await toggleOption(option.id, !option.active);
    setLoading(false);
    router.refresh();
  };

  const formatPrice = (option: Option) => {
    const suffix = option.priceType === "per_day" ? "/ jour" : "forfait";
    return `${formatMoney(option.price)} ${suffix}`;
  };

  const formatCap = (option: Option): string => {
    if (
      option.priceType === "per_day" &&
      option.capEnabled &&
      option.monthlyCap != null
    ) {
      return `${formatMoney(option.monthlyCap)}/mois`;
    }
    return "—";
  };

  return (
    <>
      {loading && <ContentOverlay />}

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-base font-semibold">Options disponibles</span>
          <Button
            variant="default"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleCreate}
          >
            <PiPlus className="size-4" />
            Ajouter une option
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 sm:p-6">
              Aucune option. Créez-en une pour la proposer à vos clients lors
              de la réservation.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ordre</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tarif</TableHead>
                  <TableHead>Plafond</TableHead>
                  <TableHead className="text-center">Qté max</TableHead>
                  <TableHead className="text-center">Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((option) => (
                  <TableRow key={option.id}>
                    <TableCell className="text-sm text-muted-foreground w-16">
                      {option.sortOrder}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {option.name}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate">
                      {option.description || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatPrice(option)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatCap(option)}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      {option.maxQuantity}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={option.active}
                        onCheckedChange={() => handleToggle(option)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(option)}
                          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors"
                        >
                          <PiPencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(option.id)}
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

      <OptionDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        onSaved={handleSaved}
        option={editing}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette option ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette option ne sera plus proposée aux clients. Les réservations
              existantes qui l&apos;utilisent conservent leur historique.
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

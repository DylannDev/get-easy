"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgencySettings } from "./agency-settings";
import { RentalTermsSettings } from "./rental-terms-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createAgency } from "@/actions/admin/create-agency";
import { deleteAgency } from "@/actions/admin/delete-agency";
import { PiPlus, PiCaretDown, PiTrash } from "react-icons/pi";
import type { Agency, RichTextDocument } from "@/domain/agency";

interface Props {
  agencies: Agency[];
  defaultRentalTerms: RichTextDocument;
}

type Tab = "general" | "terms";

export function ParametresContent({ agencies, defaultRentalTerms }: Props) {
  const router = useRouter();
  const [selectedAgencyId, setSelectedAgencyId] = useState(agencies[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>("general");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAgency, setNewAgency] = useState({
    name: "",
    address: "",
    city: "",
  });

  const selectedAgency = agencies.find((a) => a.id === selectedAgencyId);
  const isFirstAgency = agencies.length > 0 && selectedAgencyId === agencies[0].id;

  const handleCreate = async () => {
    if (!newAgency.name || !newAgency.address || !newAgency.city) return;
    setSaving(true);
    await createAgency(newAgency);
    setDialogOpen(false);
    setNewAgency({ name: "", address: "", city: "" });
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setSaving(true);
    setDeleteDialogOpen(false);
    await deleteAgency(selectedAgencyId);
    setSelectedAgencyId(agencies[0]?.id ?? "");
    setSaving(false);
    router.refresh();
  };

  return (
    <>
      {saving && <ContentOverlay />}

      <div className="flex-1 min-h-0 flex flex-col gap-6">
        {/* Agency selector + actions — only shown when there are multiple agencies */}
        {agencies.length > 1 && (
          <div className="flex items-center justify-between gap-3">
            <div className="relative">
              <select
                value={selectedAgencyId}
                onChange={(e) => setSelectedAgencyId(e.target.value)}
                className="h-10 appearance-none rounded-md border border-gray-300 pl-3 pr-9 text-sm font-medium cursor-pointer hover:border-gray-400 transition-colors"
              >
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.city}
                  </option>
                ))}
              </select>
              <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>

            {!isFirstAgency && (
              <Button
                variant="default"
                size="sm"
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <PiTrash className="size-4" />
                Supprimer l&apos;agence
              </Button>
            )}
          </div>
        )}

        {/* Tabs */}
        {selectedAgency && (
          <>
            <div className="border-b border-gray-200 flex gap-1">
              <TabButton
                active={tab === "general"}
                onClick={() => setTab("general")}
              >
                Général
              </TabButton>
              <TabButton
                active={tab === "terms"}
                onClick={() => setTab("terms")}
              >
                Conditions de location
              </TabButton>
            </div>

            {tab === "general" && (
              <div className="flex-1 min-h-0 overflow-y-auto">
                <AgencySettings
                  key={selectedAgency.id}
                  agency={selectedAgency}
                  onOpenCreateDialog={() => setDialogOpen(true)}
                />
              </div>
            )}
            {tab === "terms" && (
              <RentalTermsSettings
                key={selectedAgency.id}
                agency={selectedAgency}
                defaultRentalTerms={defaultRentalTerms}
              />
            )}
          </>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle agence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nom de l'agence">
              <Input
                value={newAgency.name}
                onChange={(e) =>
                  setNewAgency((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Mon agence"
                required
              />
            </Field>
            <Field label="Adresse">
              <Input
                value={newAgency.address}
                onChange={(e) =>
                  setNewAgency((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="123 rue de la Paix"
                required
              />
            </Field>
            <Field label="Ville">
              <Input
                value={newAgency.city}
                onChange={(e) =>
                  setNewAgency((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="Cayenne"
                required
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={
                  saving ||
                  !newAgency.name ||
                  !newAgency.address ||
                  !newAgency.city
                }
                onClick={handleCreate}
              >
                {saving ? "Création..." : "Créer l'agence"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer l&apos;agence {selectedAgency?.name} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données liées à cette
              agence seront supprimées (véhicules, réservations, clients, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="border-2 border-red-500 bg-red-500 text-white hover:bg-red-600"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 ${
        active
          ? "border-black text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

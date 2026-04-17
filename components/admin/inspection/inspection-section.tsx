"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ContentOverlay } from "@/components/admin/shared/content-overlay";
import { SignaturePad } from "@/components/admin/contracts/signature-pad";
import {
  PiUpload,
  PiTrash,
  PiCheck,
  PiPencilSimple,
  PiImage,
  PiMagnifyingGlassPlus,
  PiX,
  PiFilePdf,
  PiCamera,
} from "react-icons/pi";
import {
  saveInspectionReport,
  uploadInspectionPhoto,
  deleteInspectionPhoto,
  updateInspectionPhotoNote,
  signInspectionReport,
  regenerateInspectionPdf,
} from "@/actions/admin/inspection";
import type {
  InspectionReport,
  InspectionPhoto,
  InspectionType,
  FuelLevel,
} from "@/domain/inspection";
import { FUEL_LEVEL_LABELS, INSPECTION_TYPE_LABELS } from "@/domain/inspection";

// ─── Types ─────────────────────────────────────────────────────────

interface PhotoWithUrl extends InspectionPhoto {
  signedUrl: string;
}

interface InspectionTabData {
  type: InspectionType;
  report: InspectionReport | null;
  photos: PhotoWithUrl[];
}

interface Props {
  bookingId: string;
  agencyId: string;
  departure: InspectionTabData;
  returnInspection: InspectionTabData;
}

const FUEL_LEVELS: FuelLevel[] = ["empty", "1/4", "1/2", "3/4", "full"];

// ─── Main component ────────────────────────────────────────────────

export function InspectionSection({
  bookingId,
  agencyId,
  departure,
  returnInspection,
}: Props) {
  const [activeTab, setActiveTab] = useState<InspectionType>("departure");
  const data = activeTab === "departure" ? departure : returnInspection;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">État des lieux</CardTitle>
        <div className="border-b border-gray-200 flex gap-1 mt-2">
          {(["departure", "return"] as const).map((t) => {
            const tabData = t === "departure" ? departure : returnInspection;
            const isSigned = !!tabData.report?.signedAt;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors -mb-px border-b-2 flex items-center gap-2 ${
                  activeTab === t
                    ? "border-black text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {INSPECTION_TYPE_LABELS[t]}
                {isSigned && (
                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 border-emerald-200">
                    Signé
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        <InspectionTab
          key={activeTab}
          bookingId={bookingId}
          agencyId={agencyId}
          data={data}
        />
      </CardContent>
    </Card>
  );
}

// ─── Per-tab content ───────────────────────────────────────────────

function InspectionTab({
  bookingId,
  agencyId,
  data,
}: {
  bookingId: string;
  agencyId: string;
  data: InspectionTabData;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [refreshing, startRefreshTransition] = useTransition();
  const isSigned = !!data.report?.signedAt;

  const [pendingUploads, setPendingUploads] = useState<
    { id: string; fileName: string; previewUrl: string; done: boolean }[]
  >([]);

  // Mode suppression — les checkboxes n'apparaissent qu'au clic sur
  // "Supprimer", comme dans la section véhicules.
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Zoom (lightbox).
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

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
      Array.from(selectedIds).map((id) => deleteInspectionPhoto(id, bookingId)),
    );
    exitDeleteMode();
    setLoading(false);
    router.refresh();
  };

  const [mileage, setMileage] = useState(
    data.report?.mileage?.toString() ?? "",
  );
  const [fuelLevel, setFuelLevel] = useState<FuelLevel | "">(
    data.report?.fuelLevel ?? "",
  );
  const [notes, setNotes] = useState(data.report?.notes ?? "");
  const [signature, setSignature] = useState<string | null>(
    data.report?.customerSignature ?? null,
  );

  const ensureReport = async (): Promise<string | undefined> => {
    if (data.report?.id) return data.report.id;
    const result = await saveInspectionReport({
      bookingId,
      type: data.type,
      mileage: mileage ? Number(mileage) : null,
      fuelLevel: fuelLevel || null,
      notes: notes || null,
    });
    return result.reportId;
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

    // sort_order part de la longueur actuelle des photos serveur pour
    // éviter les collisions.
    const startOrder = data.photos.length;

    await Promise.all(
      files.map(async (file, i) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("reportId", reportId);
        fd.append("bookingId", bookingId);
        fd.append("agencyId", agencyId);
        fd.append("sortOrder", String(startOrder + i));
        const result = await uploadInspectionPhoto(fd);
        setPendingUploads((prev) =>
          prev.map((p) =>
            p.id === placeholders[i].id ? { ...p, done: true } : p,
          ),
        );
        if (result.ok) URL.revokeObjectURL(placeholders[i].previewUrl);
      }),
    );

    // On lance le refresh dans une transition React : les placeholders
    // restent visibles tant que `refreshing` est true. Quand la transition
    // se termine (données serveur arrivées), React re-render avec les
    // vraies photos et on vide les placeholders — pas de flash.
    startRefreshTransition(() => {
      router.refresh();
    });
  };

  const handleSave = async () => {
    setLoading(true);
    await saveInspectionReport({
      bookingId,
      type: data.type,
      mileage: mileage ? Number(mileage) : null,
      fuelLevel: fuelLevel || null,
      notes: notes || null,
    });
    setLoading(false);
    router.refresh();
  };

  const handleSign = async () => {
    if (!data.report?.id || !signature) return;
    setLoading(true);
    await saveInspectionReport({
      bookingId,
      type: data.type,
      mileage: mileage ? Number(mileage) : null,
      fuelLevel: fuelLevel || null,
      notes: notes || null,
    });
    await signInspectionReport(data.report.id, signature, bookingId);
    setLoading(false);
    router.refresh();
  };

  const totalPhotos = data.photos.length;

  return (
    <>
      {loading && <ContentOverlay />}

      {/* Lightbox — zoom photo plein écran */}
      {zoomedUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomedUrl(null)}
        >
          <button
            type="button"
            onClick={() => setZoomedUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 cursor-pointer transition-colors"
          >
            <PiX className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomedUrl}
            alt="Zoom"
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="space-y-6">
        {/* Statut signé OU bouton sauvegarder */}
        {isSigned && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm bg-emerald-100 text-emerald-700 border-emerald-200 border rounded-lg px-4 py-2 w-fit">
              <PiCheck className="size-4" />
              <span>
                Signé le{" "}
                {new Date(data.report!.signedAt!).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                await regenerateInspectionPdf(data.report!.id, bookingId);
                setLoading(false);
                router.refresh();
              }}
            >
              <PiFilePdf className="size-4" />
              Régénérer l&apos;état des lieux
            </Button>
          </div>
        )}

        {/* Formulaire km / carburant / notes */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kilométrage">
            <Input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="Ex. 45230"
              disabled={isSigned}
            />
          </Field>
          <Field label="Niveau de carburant">
            <select
              value={fuelLevel}
              onChange={(e) => setFuelLevel(e.target.value as FuelLevel | "")}
              disabled={isSigned}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm disabled:bg-gray-50 disabled:text-muted-foreground"
            >
              <option value="">— Non renseigné —</option>
              {FUEL_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {FUEL_LEVEL_LABELS[l]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Commentaire général">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observations, dégâts constatés…"
              rows={1}
              disabled={isSigned}
            />
          </Field>
        </div>

        {/* Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold">Photos ({totalPhotos})</h4>
            {!isSigned && (
              <div className="flex items-center gap-2">
                {deleteMode ? (
                  <>
                    <Button
                      type="button"
                      variant="red"
                      size="sm"
                      onClick={handleDeleteSelected}
                      disabled={loading || selectedIds.size === 0}
                    >
                      <PiTrash className="size-4" />
                      {selectedIds.size > 0
                        ? `Confirmer (${selectedIds.size})`
                        : "Supprimer"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={exitDeleteMode}
                    >
                      Annuler
                    </Button>
                  </>
                ) : (
                  <>
                    <Button type="button" variant="default" size="sm" asChild>
                      <label className="cursor-pointer">
                        <PiCamera className="size-4" />
                        Prendre une photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            e.target.value = "";
                            handleUploadMultiple(files);
                          }}
                        />
                      </label>
                    </Button>
                    <Button type="button" variant="default" size="sm" asChild>
                      <label className="cursor-pointer">
                        <PiUpload className="size-4" />
                        Importer des photos
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          className="hidden"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? []);
                            e.target.value = "";
                            handleUploadMultiple(files);
                          }}
                        />
                      </label>
                    </Button>
                    {totalPhotos > 0 && (
                      <Button
                        type="button"
                        variant="red"
                        size="sm"
                        onClick={() => setDeleteMode(true)}
                      >
                        <PiTrash className="size-4" />
                        Supprimer
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {totalPhotos === 0 && pendingUploads.length === 0 && !refreshing ? (
            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 text-muted-foreground">
              <PiImage className="size-6 mb-2" />
              <p className="text-sm">
                Aucune photo. Vous pouvez importez plusieurs photos du véhicule
                en même temps.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {data.photos.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  isSigned={isSigned}
                  deleteMode={deleteMode}
                  selected={selectedIds.has(photo.id)}
                  onToggleSelect={() => toggleSelect(photo.id)}
                  onZoom={() => setZoomedUrl(photo.signedUrl)}
                  onNoteBlur={(note) => {
                    const existing = data.photos.find((p) => p.id === photo.id);
                    if (existing && existing.note === note) return;
                    updateInspectionPhotoNote(
                      photo.id,
                      note || null,
                      bookingId,
                    );
                  }}
                />
              ))}
              {/* Placeholders visibles uniquement pendant le refresh
                  serveur — dès que les vraies photos arrivent, ils
                  disparaissent automatiquement. */}
              {(refreshing || pendingUploads.some((p) => !p.done)) &&
                pendingUploads.map((p) => (
                  <PendingPhotoCard key={p.id} item={p} />
                ))}
            </div>
          )}
        </div>

        {/* Signature */}
        {!isSigned && (
          <div className="space-y-4 border-t pt-6">
            <SignaturePad
              label="Signature du client"
              initialValue={signature}
              onChange={setSignature}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={loading}
              >
                Sauvegarder le brouillon
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                disabled={loading || !signature || totalPhotos === 0}
                onClick={handleSign}
              >
                <PiPencilSimple className="size-4" />
                Finaliser et signer
              </Button>
            </div>
            {!signature && totalPhotos > 0 && (
              <p className="text-xs text-muted-foreground text-right">
                Le client doit signer avant de finaliser.
              </p>
            )}
            {totalPhotos === 0 && (
              <p className="text-xs text-muted-foreground text-right">
                Ajoutez au moins une photo pour pouvoir finaliser.
              </p>
            )}
          </div>
        )}

        {isSigned && data.report?.customerSignature && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Signature du client
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.report.customerSignature}
              alt="Signature client"
              className="h-20 border border-gray-200 rounded bg-white p-2"
            />
          </div>
        )}
      </div>
    </>
  );
}

// ─── Photo card ────────────────────────────────────────────────────

function PhotoCard({
  photo,
  isSigned,
  deleteMode,
  selected,
  onToggleSelect,
  onZoom,
  onNoteBlur,
}: {
  photo: PhotoWithUrl;
  isSigned: boolean;
  deleteMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onZoom: () => void;
  onNoteBlur: (note: string) => void;
}) {
  const [note, setNote] = useState(photo.note ?? "");

  return (
    <div
      className={`rounded-lg overflow-hidden bg-white transition-all ${
        deleteMode && selected
          ? "border-2 border-green ring-2 ring-green/20"
          : deleteMode
            ? "border-2 border-transparent hover:border-gray-300"
            : "border border-gray-200"
      }`}
    >
      <div
        className="relative aspect-[4/3] bg-gray-100 cursor-pointer"
        onClick={deleteMode ? onToggleSelect : onZoom}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.signedUrl}
          alt={photo.fileName}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Checkbox ronde — visible uniquement en mode suppression */}
        {deleteMode && !isSigned && (
          <div
            className={`absolute top-2 right-2 z-10 size-6 rounded-full flex items-center justify-center ${
              selected
                ? "bg-green text-black"
                : "bg-white border-2 border-gray-300"
            }`}
          >
            {selected && <PiCheck className="size-4" />}
          </div>
        )}
        {/* Bouton zoom — visible hors mode suppression */}
        {!deleteMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onZoom();
            }}
            className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-black/50 text-white hover:bg-black/70 cursor-pointer transition-colors"
            title="Agrandir"
          >
            <PiMagnifyingGlassPlus className="size-3.5" />
          </button>
        )}
      </div>
      <div className="p-2">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => onNoteBlur(note)}
          placeholder="Commentaire…"
          disabled={isSigned}
          className="w-full text-xs border-0 border-b border-gray-200 bg-transparent px-0 py-1 focus:outline-none focus:border-black placeholder:text-gray-400 disabled:text-muted-foreground"
        />
      </div>
    </div>
  );
}

// ─── Pending photo (upload en cours) ───────────────────────────────

function PendingPhotoCard({
  item,
}: {
  item: { fileName: string; previewUrl: string; done: boolean };
}) {
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white">
      <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <PiImage className="size-8 text-gray-400" />
          {!item.done && (
            <div className="size-6 border-3 border-black/20 border-t-black rounded-full animate-spin" />
          )}
        </div>
      </div>
      <div className="p-2">
        <span className="text-xs text-muted-foreground truncate block">
          {item.done ? "Importé" : "Envoi en cours…"}
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

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

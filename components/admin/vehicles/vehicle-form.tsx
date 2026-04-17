"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PiUpload, PiCopy, PiTrash, PiPlus, PiX, PiImages } from "react-icons/pi";
import {
  updateVehicle,
  deleteVehicle,
  createVehicle,
  createMultipleVehicles,
  duplicateVehicle,
} from "@/actions/admin/vehicles";
import { uploadVehicleImage } from "@/actions/admin/upload-image";
import { savePricingTiers } from "@/actions/admin/pricing-tiers";
import type { Vehicle } from "@/domain/vehicle";

const vehicleSchema = z.object({
  agencyId: z.string().min(1, "L'agence est requise"),
  brand: z.string().min(1, "La marque est requise"),
  model: z.string().min(1, "Le modèle est requis"),
  color: z.string().min(1, "La couleur est requise"),
  pricePerDay: z.coerce.number().min(1, "Le prix est requis"),
  transmission: z.enum(["manuelle", "automatique"]),
  fuelType: z.enum(["essence", "diesel", "électrique", "hybride"]),
  numberOfSeats: z.coerce.number().min(1, "Min. 1 place"),
  numberOfDoors: z.coerce.number().min(1, "Min. 1 porte"),
  trunkSize: z.string().min(1, "La taille du coffre est requise"),
  year: z.coerce.number().min(2000, "Année invalide").max(2035, "Année invalide"),
  registrationPlate: z.string().min(1, "L'immatriculation est requise"),
  quantity: z.coerce.number().min(1, "Min. 1"),
  img: z.string().min(1, "L'image est requise"),
  fiscalPower: z.coerce.number().min(0).max(99).optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
  agencyId: string;
  existingImages?: string[];
  onSaving?: () => void;
}

export function VehicleForm({ vehicle, agencyId, existingImages = [], onSaving }: VehicleFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isNew = !vehicle;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      agencyId: vehicle?.agencyId ?? agencyId,
      brand: vehicle?.brand ?? "",
      model: vehicle?.model ?? "",
      color: vehicle?.color ?? "",
      pricePerDay: vehicle?.pricePerDay ?? undefined,
      transmission: vehicle?.transmission ?? "manuelle",
      fuelType: vehicle?.fuelType ?? "essence",
      numberOfSeats: vehicle?.numberOfSeats ?? 5,
      numberOfDoors: vehicle?.numberOfDoors ?? 5,
      trunkSize: vehicle?.trunkSize ?? "",
      year: vehicle?.year ?? new Date().getFullYear(),
      registrationPlate: vehicle?.registrationPlate ?? "",
      quantity: vehicle?.quantity ?? 1,
      img: vehicle?.img ?? "",
      fiscalPower: vehicle?.fiscalPower ?? undefined,
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const imgValue = watch("img");
  const quantityValue = watch("quantity");
  const qty = Number(quantityValue) || 1;

  const [extraPlates, setExtraPlates] = useState<string[]>(
    qty > 1 ? Array(qty - 1).fill("") : []
  );
  const [extraPlateErrors, setExtraPlateErrors] = useState<string[]>([]);

  const quantityRegister = register("quantity");

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    quantityRegister.onChange(e); // sync react-hook-form
    const newQty = Number(e.target.value) || 1;
    if (isNew && newQty > 1) {
      setExtraPlates((prev) => {
        const needed = newQty - 1;
        if (prev.length < needed) {
          return [...prev, ...Array(needed - prev.length).fill("")];
        }
        return prev.slice(0, needed);
      });
    } else {
      setExtraPlates([]);
    }
  };

  const [tiers, setTiers] = useState<{ minDays: string; pricePerDay: string }[]>(
    vehicle?.pricingTiers?.map((t) => ({
      minDays: String(t.minDays),
      pricePerDay: String(t.pricePerDay),
    })) ?? []
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("L'image ne doit pas dépasser 2 Mo");
      return;
    }
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadVehicleImage(formData);
    if (result.error) {
      setUploadError(result.error);
    } else if (result.url) {
      setValue("img", result.url);
    }
    setUploading(false);
  };

  const selectExistingImage = (url: string) => {
    setValue("img", url);
    setImageDialogOpen(false);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    const parsed = data as VehicleFormValues;
    setSaving(true);
    onSaving?.();

    if (isNew) {
      if (qty > 1) {
        const plateErrors = extraPlates.map((p) =>
          p.trim() ? "" : "L'immatriculation est requise"
        );
        if (plateErrors.some(Boolean)) {
          setExtraPlateErrors(plateErrors);
          setSaving(false);
          return;
        }
        setExtraPlateErrors([]);
        const allPlates = [parsed.registrationPlate, ...extraPlates];
        const base = {
          agencyId: parsed.agencyId,
          brand: parsed.brand,
          model: parsed.model,
          color: parsed.color,
          pricePerDay: parsed.pricePerDay,
          transmission: parsed.transmission,
          fuelType: parsed.fuelType,
          numberOfSeats: parsed.numberOfSeats,
          numberOfDoors: parsed.numberOfDoors,
          trunkSize: parsed.trunkSize,
          year: parsed.year,
          img: parsed.img,
          fiscalPower: parsed.fiscalPower ?? null,
        };
        await createMultipleVehicles(base, allPlates);
      } else {
        await createVehicle(parsed);
      }
    } else {
      await updateVehicle(vehicle.id, parsed);
      await savePricingTiers(
        vehicle.id,
        tiers.map((t) => ({
          minDays: Number(t.minDays) || 1,
          pricePerDay: Number(t.pricePerDay) || 0,
        }))
      );
      router.push("/admin/vehicules");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    onSaving?.();
    await deleteVehicle(vehicle!.id);
  };

  const handleDuplicate = async () => {
    onSaving?.();
    await duplicateVehicle(vehicle!.id);
  };

  const addTier = () => {
    const lastMin = tiers.length > 0 ? Number(tiers[tiers.length - 1].minDays) + 1 : 1;
    setTiers([...tiers, { minDays: String(lastMin), pricePerDay: "" }]);
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const updateTier = (index: number, field: "minDays" | "pricePerDay", value: string) => {
    setTiers(tiers.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  // Unique existing images (deduplicated)
  const uniqueImages = [...new Set(existingImages.filter(Boolean))];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Infos générales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Marque" error={errors.brand?.message}>
                <Input {...register("brand")} placeholder="Renault" />
              </Field>
              <Field label="Modèle" error={errors.model?.message}>
                <Input {...register("model")} placeholder="Clio 5" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Couleur" error={errors.color?.message}>
                <Input {...register("color")} placeholder="Grise" />
              </Field>
              <Field label="Année" error={errors.year?.message}>
                <Input {...register("year")} type="number" placeholder="2024" />
              </Field>
            </div>
            <Field label={qty > 1 ? "Immatriculation (véhicule 1)" : "Immatriculation"} error={errors.registrationPlate?.message}>
              <Input {...register("registrationPlate")} placeholder="FZ-123-AC" />
            </Field>
            {/* Extra plates for quantity > 1 */}
            {isNew && qty > 1 && extraPlates.map((plate, i) => (
              <Field key={i} label={`Immatriculation (véhicule ${i + 2})`} error={extraPlateErrors[i]}>
                <Input
                  value={plate}
                  onChange={(e) => {
                    const updated = [...extraPlates];
                    updated[i] = e.target.value;
                    setExtraPlates(updated);
                    if (extraPlateErrors[i]) {
                      const updatedErrors = [...extraPlateErrors];
                      updatedErrors[i] = "";
                      setExtraPlateErrors(updatedErrors);
                    }
                  }}
                  placeholder={`FZ-123-A${String.fromCharCode(68 + i)}`}
                />
              </Field>
            ))}
          </CardContent>
        </Card>

        {/* Caractéristiques */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caractéristiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Transmission">
                <select {...register("transmission")} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                  <option value="manuelle">Manuelle</option>
                  <option value="automatique">Automatique</option>
                </select>
              </Field>
              <Field label="Carburant">
                <select {...register("fuelType")} className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm">
                  <option value="essence">Essence</option>
                  <option value="diesel">Diesel</option>
                  <option value="électrique">Électrique</option>
                  <option value="hybride">Hybride</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Places" error={errors.numberOfSeats?.message}>
                <Input {...register("numberOfSeats")} type="number" placeholder="5" />
              </Field>
              <Field label="Portes" error={errors.numberOfDoors?.message}>
                <Input {...register("numberOfDoors")} type="number" placeholder="5" />
              </Field>
              <Field label="Quantité" error={errors.quantity?.message}>
                <Input
                  {...quantityRegister}
                  type="number"
                  placeholder="1"
                  onChange={handleQuantityChange}
                />
              </Field>
            </div>
            <Field label="Taille du coffre" error={errors.trunkSize?.message}>
              <Input {...register("trunkSize")} placeholder="5 Bagages" />
            </Field>
            <Field
              label="Puissance fiscale (CV)"
              error={errors.fiscalPower?.message}
            >
              <Input
                {...register("fiscalPower")}
                type="number"
                min="0"
                max="99"
                placeholder="5"
              />
            </Field>
            <Field label="Prix de base / jour (€)" error={errors.pricePerDay?.message}>
              <Input {...register("pricePerDay")} type="number" placeholder="45" />
            </Field>
          </CardContent>
        </Card>

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photo du véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex items-center gap-4">
              {imgValue && (
                <div className="relative h-24 w-36 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                  <Image src={imgValue as string} alt="Aperçu" fill className="object-contain p-2" />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <PiUpload className="size-4" />
                    {uploading ? "Upload..." : imgValue ? "Changer" : "Uploader"}
                  </Button>
                  {uniqueImages.length > 0 && (
                    <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="default" size="sm">
                          <PiImages className="size-4" />
                          Bibliothèque
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Sélectionner une image existante</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto py-2">
                          {uniqueImages.map((url, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectExistingImage(url)}
                              className={`relative h-40 rounded-lg overflow-hidden bg-gray-50 border-2 cursor-pointer transition-colors ${
                                imgValue === url ? "border-green" : "border-transparent hover:border-gray-300"
                              }`}
                            >
                              <Image src={url} alt="" fill className="object-contain p-2" />
                            </button>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP. 2 Mo maximum.
                </p>
                {uploadError && (
                  <p className="text-xs text-red-500">{uploadError}</p>
                )}
                {errors.img?.message && !uploadError && (
                  <p className="text-xs text-red-500">{errors.img.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tarifs dégressifs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Tarifs dégressifs</CardTitle>
            <Button type="button" variant="default" size="xs" onClick={addTier}>
              <PiPlus className="size-3" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent>
            {tiers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun tarif dégressif. Le prix de base sera utilisé.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-[1fr_1fr_40px] gap-3 text-xs text-muted-foreground font-medium">
                  <span>À partir de (jours)</span>
                  <span>Prix / jour (€)</span>
                  <span />
                </div>
                {tiers.map((tier, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-3 items-center">
                    <Input
                      type="number"
                      min={1}
                      value={tier.minDays}
                      onChange={(e) => updateTier(i, "minDays", e.target.value)}
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={tier.pricePerDay}
                      onChange={(e) => updateTier(i, "pricePerDay", e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeTier(i)}
                      className="flex items-center justify-center h-10 w-10 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                    >
                      <PiX className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="red" size="sm" disabled={deleting}>
                    <PiTrash className="size-4" />
                    {deleting ? "Suppression..." : "Supprimer"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer ce véhicule ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Le véhicule sera définitivement supprimé.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-2 border-black text-black hover:text-green bg-transparent shadow-none">Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "red" })}>
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button type="button" variant="default" size="sm" onClick={handleDuplicate}>
                <PiCopy className="size-4" />
                Dupliquer
              </Button>
            </>
          )}
        </div>
        <Button type="submit" disabled={saving} size="sm">
          {saving
            ? "Enregistrement..."
            : isNew
              ? qty > 1
                ? `Créer ${qty} véhicules`
                : "Créer le véhicule"
              : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

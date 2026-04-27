"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateVehicle,
  deleteVehicle,
  createVehicle,
  createMultipleVehicles,
  duplicateVehicle,
} from "@/actions/admin/vehicles";
import { savePricingTiers } from "@/actions/admin/pricing-tiers";
import type { Vehicle } from "@/domain/vehicle";
import { vehicleSchema, type VehicleFormValues } from "./form/vehicle-schema";
import { useExtraPlates } from "./form/use-extra-plates";
import { usePricingTiers } from "./form/use-pricing-tiers";
import { VehicleInfoCard } from "./form/info-card";
import { VehicleFeaturesCard } from "./form/features-card";
import { VehicleImageCard } from "./form/image-card";
import { VehiclePricingTiersCard } from "./form/pricing-tiers-card";
import { VehicleFormActions } from "./form/form-actions";

interface Props {
  vehicle?: Vehicle;
  agencyId: string;
  existingImages?: string[];
  onSaving?: () => void;
}

/**
 * Container du formulaire véhicule (création/édition). Gère la soumission
 * vers les server actions (`createVehicle`, `createMultipleVehicles` si
 * `quantity > 1`, `updateVehicle` + `savePricingTiers`). Le rendu est
 * délégué à 5 cards présentationnelles + 3 hooks pour les états complexes
 * (image upload, paliers tarifaires, immatriculations additionnelles).
 */
export function VehicleForm({
  vehicle,
  agencyId,
  existingImages = [],
  onSaving,
}: Props) {
  const router = useRouter();
  const isNew = !vehicle;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
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

  const plates = useExtraPlates(qty);
  const pricingTiers = usePricingTiers(vehicle?.pricingTiers);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const quantityRegister = register("quantity");
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    quantityRegister.onChange(e); // sync react-hook-form
    if (isNew) {
      plates.handleQuantityChange(Number(e.target.value) || 1);
    }
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    const parsed = data as VehicleFormValues;
    setSaving(true);
    onSaving?.();

    if (isNew) {
      if (qty > 1) {
        if (!plates.validate()) {
          setSaving(false);
          return;
        }
        const allPlates = [parsed.registrationPlate, ...plates.extraPlates];
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
      await savePricingTiers(vehicle.id, pricingTiers.toPersistable());
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

  // Dédup pour la bibliothèque d'images.
  const uniqueImages = [...new Set(existingImages.filter(Boolean))];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <VehicleInfoCard
          register={register}
          errors={errors}
          isNew={isNew}
          qty={qty}
          extraPlates={plates.extraPlates}
          extraPlateErrors={plates.extraPlateErrors}
          onUpdatePlate={plates.updatePlate}
        />
        <VehicleFeaturesCard
          register={register}
          control={control}
          errors={errors}
          onQuantityChange={handleQuantityChange}
        />
        <VehicleImageCard
          imgValue={imgValue ?? ""}
          onChangeImg={(url) => setValue("img", url)}
          uniqueImages={uniqueImages}
          imgError={errors.img?.message}
        />
        <VehiclePricingTiersCard
          tiers={pricingTiers.tiers}
          onAdd={pricingTiers.addTier}
          onRemove={pricingTiers.removeTier}
          onUpdate={pricingTiers.updateTier}
        />
      </div>

      <VehicleFormActions
        isNew={isNew}
        qty={qty}
        saving={saving}
        deleting={deleting}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />
    </form>
  );
}

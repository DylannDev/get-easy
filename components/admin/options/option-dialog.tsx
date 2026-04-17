"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createOption, updateOption } from "@/actions/admin/options";
import type { Option } from "@/domain/option";

const schema = z.object({
  name: z.string().min(1, "Le nom est requis").max(120),
  description: z.string().max(500),
  priceType: z.enum(["per_day", "flat"]),
  price: z.number().min(0, "Prix invalide"),
  maxQuantity: z.number().int().min(1).max(99),
  sortOrder: z.number().int().min(0),
  active: z.boolean(),
  capEnabled: z.boolean(),
  monthlyCap: z.number().min(0).nullable(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  option: Option | null;
}

export function OptionDialog({
  open,
  onClose,
  onSaved,
  option,
}: Props) {
  const isEdit = !!option;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      priceType: "per_day",
      price: 0,
      maxQuantity: 1,
      sortOrder: 0,
      active: true,
      capEnabled: false,
      monthlyCap: null,
    },
  });

  // Observe priceType + capEnabled pour n'afficher le bloc plafond qu'en
  // mode per_day ET uniquement si l'option est activée par le toggle.
  const priceType = useWatch({ control, name: "priceType" });
  const capEnabled = useWatch({ control, name: "capEnabled" });

  useEffect(() => {
    if (open) {
      reset({
        name: option?.name ?? "",
        description: option?.description ?? "",
        priceType: option?.priceType ?? "per_day",
        price: option?.price ?? 0,
        maxQuantity: option?.maxQuantity ?? 1,
        sortOrder: option?.sortOrder ?? 0,
        active: option?.active ?? true,
        capEnabled: option?.capEnabled ?? false,
        monthlyCap: option?.monthlyCap ?? null,
      });
    }
  }, [open, option, reset]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    // Le plafond ne fait sens qu'en per_day : on force reset sinon.
    const capPayload =
      data.priceType === "per_day" && data.capEnabled && data.monthlyCap != null
        ? { capEnabled: true, monthlyCap: data.monthlyCap }
        : { capEnabled: false, monthlyCap: null };
    if (isEdit && option) {
      await updateOption(option.id, {
        name: data.name,
        description: data.description || null,
        priceType: data.priceType,
        price: data.price,
        maxQuantity: data.maxQuantity,
        sortOrder: data.sortOrder,
        active: data.active,
        ...capPayload,
      });
    } else {
      await createOption({
        name: data.name,
        description: data.description || null,
        priceType: data.priceType,
        price: data.price,
        maxQuantity: data.maxQuantity,
        sortOrder: data.sortOrder,
        active: data.active,
        ...capPayload,
      });
    }
    setSaving(false);
    reset();
    onSaved();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      key={option?.id ?? "new"}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'option" : "Nouvelle option"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nom" error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="Ex: Siège bébé, GPS, Conducteur supplémentaire…"
            />
          </Field>

          <Field label="Description (optionnelle)" error={errors.description?.message}>
            <Textarea
              {...register("description")}
              rows={2}
              placeholder="Courte description visible par le client"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Type de tarif" error={errors.priceType?.message}>
              <select
                {...register("priceType")}
                className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
              >
                <option value="per_day">Par jour</option>
                <option value="flat">Forfait (unique)</option>
              </select>
            </Field>
            <Field label="Prix (€)" error={errors.price?.message}>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("price", { valueAsNumber: true })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantité max" error={errors.maxQuantity?.message}>
              <Input
                type="number"
                min="1"
                max="99"
                {...register("maxQuantity", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Ordre d'affichage" error={errors.sortOrder?.message}>
              <Input
                type="number"
                min="0"
                {...register("sortOrder", { valueAsNumber: true })}
              />
            </Field>
          </div>

          {priceType === "per_day" && (
            <div className="space-y-2 rounded-md border border-gray-200 p-3 bg-gray-50">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("capEnabled")}
                  className="size-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium">
                  Plafonner le prix mensuel
                </span>
              </label>
              {capEnabled && (
                <>
                  <Field
                    label="Plafond mensuel (€)"
                    error={errors.monthlyCap?.message}
                  >
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex : 50,00"
                      {...register("monthlyCap", {
                        setValueAs: (v) =>
                          v === "" || v === null ? null : Number(v),
                      })}
                    />
                  </Field>
                  <p className="text-[11px] text-muted-foreground">
                    Appliqué par tranche de 30 jours entamée. Exemple : 35 jours
                    de location = 2 mois entamés → montant max 2 × plafond.
                  </p>
                </>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("active")}
              className="size-4 rounded border-gray-300"
            />
            <span className="text-sm">Option active (proposée aux clients)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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

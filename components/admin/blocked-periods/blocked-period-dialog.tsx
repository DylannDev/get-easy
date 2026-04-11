"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PiCalendarBlank } from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
import {
  createBlockedPeriod,
  updateBlockedPeriod,
} from "@/actions/admin/blocked-periods";
import type { BlockedPeriodWithVehicle } from "@/actions/admin/blocked-periods";
import type { Vehicle } from "@/domain/vehicle";

const schema = z
  .object({
    vehicleId: z.string().min(1, "Le véhicule est requis"),
    start: z.date({ error: "La date de début est requise" }),
    end: z.date({ error: "La date de fin est requise" }),
    comment: z.string(),
  })
  .refine((data) => data.end >= data.start, {
    message: "La date de fin doit être après la date de début",
    path: ["end"],
  });

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  period: BlockedPeriodWithVehicle | null;
  vehicles: Vehicle[];
}

export function BlockedPeriodDialog({
  open,
  onClose,
  onSaved,
  period,
  vehicles,
}: Props) {
  const isEdit = !!period;
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicleId: "",
      start: new Date(),
      end: undefined,
      comment: "",
    },
  });

  // Reset form when dialog opens with new/edit values
  useEffect(() => {
    if (open) {
      reset({
        vehicleId: period?.vehicle_id ?? "",
        start: period?.start ? new Date(period.start) : new Date(),
        end: period?.end ? new Date(period.end) : undefined,
        comment: period?.comment ?? "",
      });
    }
  }, [open, period, reset]);

  const onSubmit = async (data: FormValues) => {
    setSaving(true);

    if (isEdit && period) {
      await updateBlockedPeriod(period.id, {
        vehicleId: data.vehicleId,
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        comment: data.comment,
      });
    } else {
      await createBlockedPeriod({
        vehicleId: data.vehicleId,
        start: data.start.toISOString(),
        end: data.end.toISOString(),
        comment: data.comment,
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
      key={period?.id ?? "new"}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'indisponibilité" : "Nouvelle indisponibilité"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Véhicule" error={errors.vehicleId?.message}>
            <select
              {...register("vehicleId")}
              className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm"
            >
              <option value="">Sélectionner un véhicule</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.registrationPlate}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={control}
              name="start"
              render={({ field }) => (
                <Field label="Début" error={errors.start?.message}>
                  <DatePickerButton
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sélectionner"
                  />
                </Field>
              )}
            />
            <Controller
              control={control}
              name="end"
              render={({ field }) => (
                <Field label="Fin" error={errors.end?.message}>
                  <DatePickerButton
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Sélectionner"
                  />
                </Field>
              )}
            />
          </div>

          <Field label="Commentaire (optionnel)">
            <Textarea
              {...register("comment")}
              placeholder="Ex: Maintenance, contrôle technique..."
              rows={3}
            />
          </Field>

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
              {saving
                ? "Enregistrement..."
                : isEdit
                  ? "Enregistrer"
                  : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DatePickerButton({
  value,
  onChange,
  placeholder,
}: {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm flex items-center gap-2 cursor-pointer hover:border-gray-400 transition-colors text-left"
        >
          <PiCalendarBlank className="size-4 text-muted-foreground shrink-0" />
          <span className={value ? "text-foreground" : "text-muted-foreground"}>
            {value
              ? formatDateCayenne(value.toISOString(), "dd MMM yyyy")
              : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          locale={fr}
          initialFocus
        />
      </PopoverContent>
    </Popover>
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

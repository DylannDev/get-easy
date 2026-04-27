"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/admin/clients/customer-form-fields";
import { PiCaretRight } from "react-icons/pi";
import type { Agency } from "@/domain/agency";
import type { Vehicle } from "@/domain/vehicle";
import { DatePickerButton } from "@/components/admin/shared/date-picker-button";

interface Props {
  agencies: Agency[];
  agencyId: string;
  setAgencyId: (id: string) => void;
  isEdit: boolean;

  startDate: Date | undefined;
  setStartDate: (d: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (d: Date | undefined) => void;
  startTime: string;
  setStartTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  timeSlots: string[];

  datesOrderValid: boolean;
  availableVehicles: Vehicle[];
  selectedVehicleId: string;
  setSelectedVehicleId: (id: string) => void;
  selectedVehicle: Vehicle | undefined;

  totalDays: number;
  totalPrice: number;
  autoPricePerDay: number;
  customPricePerDay: number | null;
  setCustomPricePerDay: (v: number | null) => void;

  canGoNext: boolean;
  onNext: () => void;
}

export function StepDatesVehicle({
  agencies,
  agencyId,
  setAgencyId,
  isEdit,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  timeSlots,
  datesOrderValid,
  availableVehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  selectedVehicle,
  totalDays,
  totalPrice,
  autoPricePerDay,
  customPricePerDay,
  setCustomPricePerDay,
  canGoNext,
  onNext,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dates et véhicule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {agencies.length > 1 && (
          <Field label={isEdit ? "Agence (non modifiable)" : "Agence"}>
            <NativeSelect
              value={agencyId}
              onValueChange={setAgencyId}
              disabled={isEdit}
              options={agencies.map((a) => ({
                value: a.id,
                label: a.name,
              }))}
            />
          </Field>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date de départ">
            <DatePickerButton
              value={startDate}
              onChange={(d) => {
                setStartDate(d);
                if (d && endDate && endDate.getTime() < d.getTime()) {
                  setEndDate(undefined);
                }
              }}
              placeholder="Sélectionner"
            />
          </Field>
          <Field label="Date de retour">
            <DatePickerButton
              value={endDate}
              onChange={setEndDate}
              placeholder="Sélectionner"
              disabledBefore={startDate}
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Heure de départ">
            <NativeSelect
              value={startTime}
              onValueChange={setStartTime}
              placeholder="Heure"
              options={timeSlots.map((t) => ({ value: t, label: t }))}
            />
          </Field>
          <Field label="Heure de retour">
            <NativeSelect
              value={endTime}
              onValueChange={setEndTime}
              placeholder="Heure"
              options={timeSlots.map((t) => ({ value: t, label: t }))}
            />
          </Field>
        </div>

        {startDate && endDate && !datesOrderValid && (
          <p className="text-xs text-red-500">
            La date de retour doit être postérieure ou égale à la date de
            départ.
          </p>
        )}

        <Field label="Véhicule">
          {startDate && endDate && availableVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
              Aucun véhicule disponible sur ces dates. Modifiez la période ou
              ajustez un blocage.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {availableVehicles.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVehicleId(v.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                    selectedVehicleId === v.id
                      ? "border-green bg-green/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className="shrink-0 rounded overflow-hidden"
                    style={{ width: 50, height: 35 }}
                  >
                    <Image
                      src={v.img}
                      alt={`${v.brand} ${v.model}`}
                      width={50}
                      height={35}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {v.brand} {v.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {v.registrationPlate} · {v.pricePerDay}€/j
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Field>

        {totalDays > 0 && selectedVehicle && (
          <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Prix / jour</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    customPricePerDay !== null
                      ? customPricePerDay
                      : Math.round(autoPricePerDay * 100) / 100
                  }
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setCustomPricePerDay(null);
                    } else {
                      setCustomPricePerDay(Number(v));
                    }
                  }}
                  className="w-24 h-8 rounded-md border border-gray-300 px-2 text-sm text-right font-semibold"
                />
                <span className="text-muted-foreground">€</span>
                {customPricePerDay !== null && (
                  <button
                    type="button"
                    onClick={() => setCustomPricePerDay(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
                  >
                    Auto
                  </button>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {totalDays} jour{totalDays > 1 ? "s" : ""}
              </span>
              <span className="font-semibold">{Math.round(totalPrice)} €</span>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" size="sm" disabled={!canGoNext} onClick={onNext}>
            Suivant
            <PiCaretRight className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

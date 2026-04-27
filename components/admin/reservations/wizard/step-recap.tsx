"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiCaretLeft } from "react-icons/pi";
import { formatDateCayenne } from "@/lib/format-date";
import { computeOptionLineTotal } from "@/domain/option";
import type { Vehicle } from "@/domain/vehicle";
import type { Option } from "@/domain/option";
import type {
  CustomerFieldsValue,
  BusinessFieldsValue,
} from "@/components/admin/clients/customer-form-fields";
import { RecapRow } from "./recap-row";

interface SelectedOption {
  optionId: string;
  quantity: number;
}

interface Props {
  selectedVehicle: Vehicle | undefined;
  startDateWithTime: Date | undefined;
  endDateWithTime: Date | undefined;
  totalDays: number;
  vehiclePrice: number;
  optionsTotal: number;
  totalPrice: number;
  selectedOptionsPayload: SelectedOption[];
  agencyOptions: Option[];

  isBusiness: boolean;
  businessFields: BusinessFieldsValue;
  customer: CustomerFieldsValue;

  errorMessage: string | null;
  saving: boolean;
  isEdit: boolean;
  isQuote: boolean;

  onPrev: () => void;
  onSubmit: () => void;
}

export function StepRecap({
  selectedVehicle,
  startDateWithTime,
  endDateWithTime,
  totalDays,
  vehiclePrice,
  optionsTotal,
  totalPrice,
  selectedOptionsPayload,
  agencyOptions,
  isBusiness,
  businessFields,
  customer,
  errorMessage,
  saving,
  isEdit,
  isQuote,
  onPrev,
  onSubmit,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Récapitulatif</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Réservation
          </h4>
          <RecapRow
            label="Véhicule"
            value={
              selectedVehicle
                ? `${selectedVehicle.brand} ${selectedVehicle.model}`
                : ""
            }
          />
          <RecapRow
            label="Plaque"
            value={selectedVehicle?.registrationPlate ?? ""}
          />
          {startDateWithTime && (
            <RecapRow
              label="Départ"
              value={formatDateCayenne(
                startDateWithTime.toISOString(),
                "dd MMMM yyyy 'à' HH'h'mm",
              )}
            />
          )}
          {endDateWithTime && (
            <RecapRow
              label="Retour"
              value={formatDateCayenne(
                endDateWithTime.toISOString(),
                "dd MMMM yyyy 'à' HH'h'mm",
              )}
            />
          )}
          <RecapRow
            label="Durée"
            value={`${totalDays} jour${totalDays > 1 ? "s" : ""}`}
          />
          <RecapRow label="Véhicule" value={`${Math.round(vehiclePrice)} €`} />
          {optionsTotal > 0 && (
            <RecapRow label="Options" value={`${optionsTotal.toFixed(2)} €`} />
          )}
          <RecapRow label="Total" value={`${Math.round(totalPrice)} €`} bold />
        </div>

        {selectedOptionsPayload.length > 0 && (
          <div className="border-t pt-3 space-y-3 text-sm">
            <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Options sélectionnées
            </h4>
            {selectedOptionsPayload.map((sel) => {
              const opt = agencyOptions.find((o) => o.id === sel.optionId);
              if (!opt) return null;
              return (
                <RecapRow
                  key={sel.optionId}
                  label={`${opt.name}${sel.quantity > 1 ? ` ×${sel.quantity}` : ""}`}
                  value={`${computeOptionLineTotal(
                    {
                      unitPrice: opt.price,
                      priceType: opt.priceType,
                      quantity: sel.quantity,
                      monthlyCap: opt.capEnabled ? opt.monthlyCap : null,
                    },
                    totalDays,
                  ).toFixed(2)} €`}
                />
              );
            })}
          </div>
        )}

        <div className="border-t pt-3 space-y-3 text-sm">
          <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
            Client
          </h4>
          {isBusiness && businessFields.companyName && (
            <>
              <RecapRow label="Entreprise" value={businessFields.companyName} />
              {businessFields.siret && (
                <RecapRow label="SIRET" value={businessFields.siret} />
              )}
              {businessFields.vatNumber && (
                <RecapRow label="N° TVA" value={businessFields.vatNumber} />
              )}
            </>
          )}
          <RecapRow
            label={
              isBusiness && businessFields.companyName ? "Conducteur" : "Nom"
            }
            value={`${customer.firstName} ${customer.lastName}`}
          />
          <RecapRow label="Email" value={customer.email} />
          <RecapRow label="Téléphone" value={customer.phone} />
          <RecapRow
            label="Adresse"
            value={`${customer.address}, ${customer.postalCode} ${customer.city}`}
          />
        </div>

        {errorMessage && (
          <p className="text-xs text-red-500 pt-2">{errorMessage}</p>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onPrev}
          >
            <PiCaretLeft className="size-4" />
            Précédent
          </Button>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={onSubmit}
          >
            {saving
              ? isQuote
                ? "Génération…"
                : isEdit
                  ? "Enregistrement…"
                  : "Création..."
              : isQuote
                ? "Générer le devis"
                : isEdit
                  ? "Enregistrer les modifications"
                  : "Confirmer la réservation"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { INSPECTION_TYPE_LABELS } from "@/domain/inspection";
import type { InspectionType } from "@/domain/inspection";
import { InspectionTab, type InspectionTabData } from "./inspection-tab";

interface Props {
  bookingId: string;
  agencyId: string;
  departure: InspectionTabData;
  returnInspection: InspectionTabData;
}

/** Card "État des lieux" avec onglets départ/retour. Chaque onglet est un
 *  composant indépendant remonté à chaque switch (`key={activeTab}`) pour
 *  réinitialiser l'état du formulaire. */
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

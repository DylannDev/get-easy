"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  PiCalendarCheck,
  PiChartBar,
  PiClock,
  PiCurrencyEur,
} from "react-icons/pi";
import type { StatisticsData } from "@/application/admin/get-statistics.use-case";
import { fmtEur } from "./format";

interface Props {
  stats: StatisticsData;
}

/** 4 cards KPI haut de page : nb de réservations, prix moyen, CA cumulé,
 *  durée moyenne. */
export function KpisGrid({ stats }: Props) {
  const kpis = [
    {
      label: "Réservations",
      value: stats.totalBookings.toString(),
      icon: PiCalendarCheck,
    },
    {
      label: "Prix moyen",
      value: fmtEur(stats.averagePrice),
      icon: PiCurrencyEur,
    },
    {
      label: "CA cumulé",
      value: fmtEur(stats.totalRevenue),
      icon: PiChartBar,
    },
    {
      label: "Durée moyenne",
      value: `${Math.round(stats.averageDuration)} j`,
      icon: PiClock,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
              <div className="rounded-lg bg-black p-2">
                <kpi.icon className="size-4 text-green" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-2">{kpi.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

"use client";

import type { StatisticsData } from "@/application/admin/get-statistics.use-case";
import { StatsHeader } from "./parts/stats-header";
import { KpisGrid } from "./parts/kpis-grid";
import { MonthlyRevenueChart } from "./parts/monthly-revenue-chart";
import { OccupancyChart } from "./parts/occupancy-chart";
import { TopClientsList } from "./parts/top-clients-list";

interface Props {
  stats: StatisticsData;
  availableYears: number[];
}

/**
 * Page Statistiques admin : header (sélecteur d'année + export CSV) + 4 KPI
 * + 3 cards (CA mensuel N/N-1, taux d'occupation par véhicule, top clients).
 * Chaque section est un sous-composant présentational dans `./parts/`.
 */
export function StatisticsContent({ stats, availableYears }: Props) {
  return (
    <div className="space-y-6">
      <StatsHeader year={stats.year} availableYears={availableYears} />
      <KpisGrid stats={stats} />
      <MonthlyRevenueChart stats={stats} />
      <OccupancyChart stats={stats} />
      <TopClientsList stats={stats} />
    </div>
  );
}

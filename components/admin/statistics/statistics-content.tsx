"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  PiCalendarCheck,
  PiCurrencyEur,
  PiChartBar,
  PiClock,
  PiProhibit,
} from "react-icons/pi";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { StatisticsData } from "@/application/admin/get-statistics.use-case";

interface Props {
  stats: StatisticsData;
}

const CHART_COLORS = [
  "#ccff33",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#10b981",
  "#f97316",
  "#06b6d4",
];

export function StatisticsContent({ stats }: Props) {
  const kpis = [
    {
      label: "Réservations",
      value: stats.totalBookings.toString(),
      icon: PiCalendarCheck,
    },
    {
      label: "Prix moyen",
      value: `${Math.round(stats.averagePrice)} €`,
      icon: PiCurrencyEur,
    },
    {
      label: "CA cumulé",
      value: `${Math.round(stats.totalRevenue)} €`,
      icon: PiChartBar,
    },
    {
      label: "Durée moyenne",
      value: `${Math.round(stats.averageDuration)} jours`,
      icon: PiClock,
    },
    {
      label: "Indisponibilités",
      value: stats.blockedPeriodsCount.toString(),
      icon: PiProhibit,
    },
  ];

  const bookingsData = stats.vehicleStats.map((v) => ({
    name: v.name,
    value: v.bookings,
  }));

  const revenueData = stats.vehicleStats.map((v) => ({
    name: v.name,
    value: Math.round(v.revenue),
  }));

  const daysData = stats.vehicleStats.map((v) => ({
    name: v.name,
    value: v.days,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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

      {/* Charts */}
      {stats.vehicleStats.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <ChartCard title="Réservations par véhicule" data={bookingsData} unit="" />
          <ChartCard title="CA par véhicule" data={revenueData} unit=" €" />
          <ChartCard title="Jours de location par véhicule" data={daysData} unit=" j" />
        </div>
      )}
    </div>
  );
}

function ChartCard({
  title,
  data,
  unit,
}: {
  title: string;
  data: { name: string; value: number }[];
  unit: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell
                  key={i}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `${value}${unit}`}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

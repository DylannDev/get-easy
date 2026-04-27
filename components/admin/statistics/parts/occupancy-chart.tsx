"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatisticsData } from "@/application/admin/get-statistics.use-case";

interface Props {
  stats: StatisticsData;
}

/** Bar chart horizontal du taux d'occupation par véhicule (incluant les
 *  véhicules à 0 % pour identifier ceux sous-loués). */
export function OccupancyChart({ stats }: Props) {
  const data = stats.vehicleOccupancy.map((v) => ({
    name: `${v.name} (${v.plate})`,
    pct: v.occupancyPct,
  }));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">
          Taux d&apos;occupation par véhicule ({stats.year})
        </h3>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun véhicule enregistré.
          </p>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(220, data.length * 40 + 40)}
          >
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 24, left: 8, bottom: 10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                horizontal={false}
              />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={160}
              />
              <Tooltip
                formatter={(value) => `${value}%`}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill="#ccff33" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

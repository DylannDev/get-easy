"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { StatisticsData } from "@/application/admin/get-statistics.use-case";
import { MONTH_LABELS, fmtAxisY, fmtEur } from "./format";

interface Props {
  stats: StatisticsData;
}

/** Line chart du CA mensuel avec comparaison N vs N-1. Année courante en
 *  noir plein, N-1 en gris pointillé. */
export function MonthlyRevenueChart({ stats }: Props) {
  const data = stats.monthlyRevenue.map((p) => ({
    month: MONTH_LABELS[p.month],
    [`${stats.year}`]: p.current,
    [`${stats.year - 1}`]: p.previous,
  }));

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">
          CA par mois — {stats.year} vs {stats.year - 1}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => fmtAxisY(Number(v))}
            />
            <Tooltip
              formatter={(value) => fmtEur(Number(value))}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            />
            <Legend
              verticalAlign="top"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey={`${stats.year}`}
              stroke="#000000"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey={`${stats.year - 1}`}
              stroke="#9ca3af"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

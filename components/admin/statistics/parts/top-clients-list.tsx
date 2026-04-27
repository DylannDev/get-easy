"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { StatisticsData } from "@/application/admin/get-statistics.use-case";
import { fmtEur } from "./format";

interface Props {
  stats: StatisticsData;
}

/** Liste rang/nom/email/CA/nb réservations des meilleurs clients de l'année. */
export function TopClientsList({ stats }: Props) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Top clients ({stats.year})</h3>
        {stats.topClients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune réservation sur cette période.
          </p>
        ) : (
          <ul className="divide-y">
            {stats.topClients.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">
                    {i + 1}.
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize truncate">
                      {c.firstName} {c.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.email}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{fmtEur(c.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.bookings} réservation{c.bookings > 1 ? "s" : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

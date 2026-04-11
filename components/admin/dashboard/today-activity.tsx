import { formatDateCayenne } from "@/lib/format-date";
import { ArrowRightCircle, ArrowLeftCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BookingWithDetails } from "@/domain/booking";

interface TodayActivityProps {
  departures: BookingWithDetails[];
  returns: BookingWithDetails[];
}

function ActivityItem({
  booking,
  type,
}: {
  booking: BookingWithDetails;
  type: "departure" | "return";
}) {
  const time = formatDateCayenne(
    type === "departure" ? booking.startDate : booking.endDate,
    "HH'h'mm"
  );

  return (
    <div className="flex items-center gap-3 py-2">
      <div
        className={`rounded-full p-1.5 ${type === "departure" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}
      >
        {type === "departure" ? (
          <ArrowRightCircle className="size-4" />
        ) : (
          <ArrowLeftCircle className="size-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {booking.customerFirstName} {booking.customerLastName}
        </p>
        <p className="text-xs text-muted-foreground">
          {booking.vehicleBrand} {booking.vehicleModel}
        </p>
      </div>
      <span className="text-sm font-medium text-muted-foreground">{time}</span>
    </div>
  );
}

export function TodayActivity({ departures, returns }: TodayActivityProps) {
  const hasActivity = departures.length > 0 || returns.length > 0;

  if (!hasActivity) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {departures.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowRightCircle className="size-4 text-emerald-600" />
              Départs du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {departures.map((b) => (
                <ActivityItem key={b.id} booking={b} type="departure" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {returns.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ArrowLeftCircle className="size-4 text-blue-600" />
              Retours du jour
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y">
              {returns.map((b) => (
                <ActivityItem key={b.id} booking={b} type="return" />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

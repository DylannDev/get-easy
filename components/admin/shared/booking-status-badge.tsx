import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@/domain/booking";

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  paid: { label: "Confirmée", variant: "default" },
  pending_payment: { label: "En attente", variant: "secondary" },
  initiated: { label: "Initiée", variant: "outline" },
  payment_failed: { label: "Échec paiement", variant: "destructive" },
  expired: { label: "Expirée", variant: "outline" },
  cancelled: { label: "Annulée", variant: "outline" },
  refunded: { label: "Remboursée", variant: "secondary" },
};

const statusColors: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending_payment: "bg-amber-100 text-amber-700 border-amber-200",
  initiated: "bg-gray-100 text-gray-600 border-gray-200",
  payment_failed: "bg-red-100 text-red-700 border-red-200",
  expired: "bg-gray-100 text-gray-400 border-gray-200",
  cancelled: "bg-gray-100 text-gray-400 border-gray-200 line-through",
  refunded: "bg-purple-100 text-purple-700 border-purple-200",
};

interface BookingStatusBadgeProps {
  status: BookingStatus | string;
}

export function BookingStatusBadge({ status }: BookingStatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "outline" as const,
  };

  return (
    <Badge variant={config.variant} className={statusColors[status] ?? ""}>
      {config.label}
    </Badge>
  );
}

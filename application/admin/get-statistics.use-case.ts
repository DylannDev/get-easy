import { differenceInDays, getMonth, getYear } from "date-fns";
import type { BookingRepository } from "@/domain/booking";
import type { VehicleRepository } from "@/domain/vehicle";

export interface MonthlyRevenuePoint {
  /** 0 = janvier … 11 = décembre. */
  month: number;
  /** CA de l'année courante. */
  current: number;
  /** CA de l'année précédente (N-1) — pour la comparaison. */
  previous: number;
}

export interface VehicleOccupancy {
  vehicleId: string;
  name: string;
  plate: string;
  daysBooked: number;
  totalDays: number;
  /** Pourcentage 0-100. */
  occupancyPct: number;
}

export interface TopClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bookings: number;
  revenue: number;
}

export interface StatisticsData {
  year: number;
  // KPIs sur l'année sélectionnée
  totalBookings: number;
  averagePrice: number;
  totalRevenue: number;
  /** Durée moyenne en jours. */
  averageDuration: number;

  // CA / mois (12 points, année N + N-1)
  monthlyRevenue: MonthlyRevenuePoint[];

  // Taux d'occupation par véhicule (sur l'année sélectionnée)
  vehicleOccupancy: VehicleOccupancy[];

  // Top clients de l'année sélectionnée (max 10 par CA)
  topClients: TopClient[];
}

interface Deps {
  bookingRepository: BookingRepository;
  vehicleRepository: VehicleRepository;
}

const dayCountInYear = (year: number): number =>
  // Année bissextile : divisible par 4, sauf si centaine non divisible par 400.
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

/**
 * Recoupe une période [bookingStart, bookingEnd] avec [winStart, winEnd]
 * et renvoie le nombre de jours qui retombent dans la fenêtre. Utilisé
 * pour calculer le taux d'occupation : un booking de 5 jours qui chevauche
 * la fin d'année compte pour `min(end, dec31) - max(start, jan1) + 1` dans
 * la fenêtre de cette année.
 */
function clampedDays(
  bookingStart: Date,
  bookingEnd: Date,
  winStart: Date,
  winEnd: Date
): number {
  const start = bookingStart > winStart ? bookingStart : winStart;
  const end = bookingEnd < winEnd ? bookingEnd : winEnd;
  if (end < start) return 0;
  return Math.max(differenceInDays(end, start), 1);
}

export const createGetStatisticsUseCase = (deps: Deps) => {
  const execute = async (params?: {
    year?: number;
    agencyId?: string;
  }): Promise<StatisticsData> => {
    const year = params?.year ?? new Date().getFullYear();
    const previousYear = year - 1;

    const winStart = new Date(year, 0, 1);
    const winEnd = new Date(year, 11, 31, 23, 59, 59);
    const prevStart = new Date(previousYear, 0, 1);
    const prevEnd = new Date(previousYear, 11, 31, 23, 59, 59);

    // On charge tous les bookings payés des 2 années en parallèle.
    const [{ data: bookingsCurrent }, { data: bookingsPrevious }, vehicles] =
      await Promise.all([
        deps.bookingRepository.findAllWithDetails({
          page: 1,
          pageSize: 10000,
          agencyId: params?.agencyId,
          statuses: ["paid"],
          startDate: winStart.toISOString(),
          endDate: winEnd.toISOString(),
          sort: { field: "created_at", direction: "desc" },
        }),
        deps.bookingRepository.findAllWithDetails({
          page: 1,
          pageSize: 10000,
          agencyId: params?.agencyId,
          statuses: ["paid"],
          startDate: prevStart.toISOString(),
          endDate: prevEnd.toISOString(),
          sort: { field: "created_at", direction: "desc" },
        }),
        params?.agencyId
          ? deps.vehicleRepository.findByAgencyId(params.agencyId)
          : deps.vehicleRepository.findAll(),
      ]);

    // KPIs (année courante uniquement)
    const totalBookings = bookingsCurrent.length;
    const totalRevenue = bookingsCurrent.reduce(
      (sum, b) => sum + b.totalPrice,
      0
    );
    const averagePrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const totalDays = bookingsCurrent.reduce((sum, b) => {
      const days = differenceInDays(new Date(b.endDate), new Date(b.startDate));
      return sum + Math.max(days, 1);
    }, 0);
    const averageDuration = totalBookings > 0 ? totalDays / totalBookings : 0;

    // CA par mois — agrégation année N et N-1 avec rattachement à
    // `startDate` (mois de début de location).
    const monthlyRevenue: MonthlyRevenuePoint[] = Array.from(
      { length: 12 },
      (_, i) => ({ month: i, current: 0, previous: 0 })
    );
    for (const b of bookingsCurrent) {
      const m = getMonth(new Date(b.startDate));
      if (getYear(new Date(b.startDate)) === year) {
        monthlyRevenue[m].current += b.totalPrice;
      }
    }
    for (const b of bookingsPrevious) {
      const m = getMonth(new Date(b.startDate));
      if (getYear(new Date(b.startDate)) === previousYear) {
        monthlyRevenue[m].previous += b.totalPrice;
      }
    }

    // Taux d'occupation par véhicule (année courante)
    const totalDaysInYear = dayCountInYear(year);
    const occupancyMap = new Map<
      string,
      { vehicleId: string; name: string; plate: string; daysBooked: number }
    >();
    for (const v of vehicles) {
      occupancyMap.set(v.id, {
        vehicleId: v.id,
        name: `${v.brand} ${v.model}`,
        plate: v.registrationPlate,
        daysBooked: 0,
      });
    }
    for (const b of bookingsCurrent) {
      const stat = occupancyMap.get(b.vehicleId);
      if (!stat) continue;
      stat.daysBooked += clampedDays(
        new Date(b.startDate),
        new Date(b.endDate),
        winStart,
        winEnd
      );
    }
    const vehicleOccupancy: VehicleOccupancy[] = Array.from(
      occupancyMap.values()
    )
      .map((s) => ({
        ...s,
        totalDays: totalDaysInYear,
        occupancyPct: Math.round((s.daysBooked / totalDaysInYear) * 100),
      }))
      .sort((a, b) => b.occupancyPct - a.occupancyPct);

    // Top clients (max 10) — agrégation par customerId
    const clientMap = new Map<
      string,
      {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        bookings: number;
        revenue: number;
      }
    >();
    for (const b of bookingsCurrent) {
      const existing = clientMap.get(b.customerId);
      if (existing) {
        existing.bookings++;
        existing.revenue += b.totalPrice;
      } else {
        clientMap.set(b.customerId, {
          id: b.customerId,
          firstName: b.customerFirstName,
          lastName: b.customerLastName,
          email: b.customerEmail,
          bookings: 1,
          revenue: b.totalPrice,
        });
      }
    }
    const topClients = Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      year,
      totalBookings,
      averagePrice,
      totalRevenue,
      averageDuration,
      monthlyRevenue,
      vehicleOccupancy,
      topClients,
    };
  };

  return { execute };
};

export type GetStatisticsUseCase = ReturnType<typeof createGetStatisticsUseCase>;

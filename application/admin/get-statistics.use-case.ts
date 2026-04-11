import { differenceInDays } from "date-fns";
import type { BookingRepository, BookingWithDetails } from "@/domain/booking";
import type { VehicleRepository } from "@/domain/vehicle";

export interface VehicleStat {
  name: string;
  bookings: number;
  revenue: number;
  days: number;
}

export interface StatisticsData {
  totalBookings: number;
  averagePrice: number;
  totalRevenue: number;
  averageDuration: number;
  blockedPeriodsCount: number;
  vehicleStats: VehicleStat[];
}

interface Deps {
  bookingRepository: BookingRepository;
  vehicleRepository: VehicleRepository;
}

export const createGetStatisticsUseCase = (deps: Deps) => {
  const execute = async (params?: {
    startDate?: string;
    endDate?: string;
    agencyId?: string;
  }): Promise<StatisticsData> => {
    const { data: bookings } = await deps.bookingRepository.findAllWithDetails({
      page: 1,
      pageSize: 10000,
      agencyId: params?.agencyId,
      statuses: ["paid"],
      startDate: params?.startDate,
      endDate: params?.endDate,
      sort: { field: "created_at", direction: "desc" },
    });

    const vehicles = params?.agencyId
      ? await deps.vehicleRepository.findByAgencyId(params.agencyId)
      : await deps.vehicleRepository.findAll();

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const averagePrice = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const totalDays = bookings.reduce((sum, b) => {
      const days = differenceInDays(new Date(b.endDate), new Date(b.startDate));
      return sum + Math.max(days, 1);
    }, 0);
    const averageDuration = totalBookings > 0 ? totalDays / totalBookings : 0;

    // Count blocked periods across all vehicles
    const blockedPeriodsCount = vehicles.reduce(
      (sum, v) => sum + v.blockedPeriods.length,
      0
    );

    // Per-vehicle stats
    const vehicleMap = new Map<
      string,
      { name: string; bookings: number; revenue: number; days: number }
    >();
    for (const v of vehicles) {
      vehicleMap.set(v.id, {
        name: `${v.brand} ${v.model}`,
        bookings: 0,
        revenue: 0,
        days: 0,
      });
    }
    for (const b of bookings) {
      const stat = vehicleMap.get(b.vehicleId);
      if (stat) {
        stat.bookings++;
        stat.revenue += b.totalPrice;
        stat.days += Math.max(
          differenceInDays(new Date(b.endDate), new Date(b.startDate)),
          1
        );
      }
    }

    const vehicleStats = Array.from(vehicleMap.values()).filter(
      (s) => s.bookings > 0
    );

    return {
      totalBookings,
      averagePrice,
      totalRevenue,
      averageDuration,
      blockedPeriodsCount,
      vehicleStats,
    };
  };

  return { execute };
};

export type GetStatisticsUseCase = ReturnType<typeof createGetStatisticsUseCase>;

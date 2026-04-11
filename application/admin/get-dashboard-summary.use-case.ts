import { format } from "date-fns";
import type {
  BookingRepository,
  BookingWithDetails,
  BookingStatus,
} from "@/domain/booking";

export interface DashboardSummary {
  todayDepartures: BookingWithDetails[];
  todayReturns: BookingWithDetails[];
  activeRentalsCount: number;
  recentBookings: BookingWithDetails[];
  totalBookings: number;
}

interface Deps {
  bookingRepository: BookingRepository;
}

export const createGetDashboardSummaryUseCase = (deps: Deps) => {
  const execute = async (params?: {
    page?: number;
    search?: string;
    statuses?: BookingStatus[];
    agencyId?: string;
  }): Promise<DashboardSummary> => {
    const today = format(new Date(), "yyyy-MM-dd");
    const page = params?.page ?? 1;
    const agencyId = params?.agencyId;

    const [
      todayDepartures,
      todayReturns,
      activeRentalsCount,
      recentBookingsResult,
    ] = await Promise.all([
      deps.bookingRepository.findDeparturesByDate(today, agencyId),
      deps.bookingRepository.findReturnsByDate(today, agencyId),
      deps.bookingRepository.countActiveRentals(agencyId),
      deps.bookingRepository.findAllWithDetails({
        page,
        pageSize: 10,
        agencyId,
        search: params?.search,
        statuses: params?.statuses,
        sort: { field: "created_at", direction: "desc" },
      }),
    ]);

    return {
      todayDepartures,
      todayReturns,
      activeRentalsCount,
      recentBookings: recentBookingsResult.data,
      totalBookings: recentBookingsResult.count,
    };
  };

  return { execute };
};

export type GetDashboardSummaryUseCase = ReturnType<
  typeof createGetDashboardSummaryUseCase
>;

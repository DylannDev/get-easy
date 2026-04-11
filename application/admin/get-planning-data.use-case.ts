import type { BookingRepository, BookingWithDetails } from "@/domain/booking";
import type { VehicleRepository, Vehicle } from "@/domain/vehicle";

export interface PlanningVehicleRow {
  vehicle: Vehicle;
  bookings: BookingWithDetails[];
}

export interface PlanningData {
  rows: PlanningVehicleRow[];
}

interface Deps {
  vehicleRepository: VehicleRepository;
  bookingRepository: BookingRepository;
}

export const createGetPlanningDataUseCase = (deps: Deps) => {
  const execute = async (params: {
    startDate: string;
    endDate: string;
    agencyId?: string;
  }): Promise<PlanningData> => {
    const vehicles = params.agencyId
      ? await deps.vehicleRepository.findByAgencyId(params.agencyId)
      : await deps.vehicleRepository.findAll();

    const { data: bookings } = await deps.bookingRepository.findAllWithDetails({
      page: 1,
      pageSize: 1000,
      agencyId: params.agencyId,
      startDate: params.startDate,
      endDate: params.endDate,
      statuses: ["paid", "pending_payment"],
      sort: { field: "start_date", direction: "asc" },
    });

    // Group bookings by vehicle
    const bookingsByVehicle = new Map<string, BookingWithDetails[]>();
    for (const b of bookings) {
      const list = bookingsByVehicle.get(b.vehicleId) ?? [];
      list.push(b);
      bookingsByVehicle.set(b.vehicleId, list);
    }

    const rows: PlanningVehicleRow[] = vehicles.map((vehicle) => ({
      vehicle,
      bookings: bookingsByVehicle.get(vehicle.id) ?? [],
    }));

    return { rows };
  };

  return { execute };
};

export type GetPlanningDataUseCase = ReturnType<
  typeof createGetPlanningDataUseCase
>;

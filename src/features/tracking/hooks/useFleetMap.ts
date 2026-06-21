import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  ShipmentRow,
  DriverRow,
  ProfileRow,
  DriverLocationRow,
  VehicleRow,
} from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

export const FLEET_ACTIVE_STATUSES: ShipmentStatus[] = [
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
];

export type FleetShipment = ShipmentRow & {
  driver:
    | (DriverRow & {
        profile: Pick<ProfileRow, "id" | "name" | "phone">;
        vehicle: Pick<VehicleRow, "id" | "plate"> | null;
      })
    | null;
  lastLocation: DriverLocationRow | null;
};

export function useFleetMap() {
  // Active shipments
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["fleet_map_shipments"],
    refetchInterval: 20_000,
    queryFn: async (): Promise<FleetShipment[]> => {
      const { data, error } = await supabase
        .from("shipments")
        .select(
          "*, driver:drivers(*, profile:profiles(id, name, phone), vehicle:vehicles(id, plate))",
        )
        .in("status", FLEET_ACTIVE_STATUSES)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      const rows = data as unknown as FleetShipment[];

      // Fetch last location for each driver
      const driverIds = rows.map((s) => s.driver_id).filter(Boolean) as string[];

      if (driverIds.length === 0) return rows.map((r) => ({ ...r, lastLocation: null }));

      // Get latest location per driver (one query)
      const { data: locs } = await supabase
        .from("driver_locations")
        .select("*")
        .in(
          "shipment_id",
          rows.map((r) => r.id),
        );

      const locByShipment: Record<string, DriverLocationRow> = {};
      if (locs) {
        for (const loc of locs as DriverLocationRow[]) {
          if (!loc.shipment_id) continue;
          const existing = locByShipment[loc.shipment_id];
          if (!existing || loc.recorded_at > existing.recorded_at) {
            locByShipment[loc.shipment_id] = loc;
          }
        }
      }

      return rows.map((r) => ({
        ...r,
        lastLocation: locByShipment[r.id] ?? null,
      }));
    },
  });

  return { shipments, isLoading };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { updateShipmentStatus } from "@/lib/shipmentEvents";
import { useAuthStore } from "@/stores/authStore";
import { useOfflineQueue } from "@/features/shipments/hooks/useOfflineQueue";
import type { ShipmentRow, ShipmentEventRow, CargoTypeRow, VehicleTypeRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

export const ACTIVE_TRIP_STATUSES: ShipmentStatus[] = [
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
];

export type TripShipment = ShipmentRow & {
  cargo_type: Pick<CargoTypeRow, "id" | "name"> | null;
  vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null;
};

export const TRIP_STEPS: { status: ShipmentStatus; label: string; action: string }[] = [
  { status: "ACCEPTED", label: "Job accepted", action: "Start driving to pickup" },
  { status: "EN_ROUTE_TO_PICKUP", label: "En route to pickup", action: "I've arrived at pickup" },
  { status: "ARRIVED_AT_PICKUP", label: "At pickup", action: "Cargo picked up" },
  { status: "PICKED_UP", label: "Cargo picked up", action: "Start transit" },
  { status: "IN_TRANSIT", label: "In transit", action: "Arrived at destination" },
  { status: "ARRIVED_AT_DESTINATION", label: "At destination", action: "Confirm delivery" },
  { status: "DELIVERED", label: "Delivered", action: "" },
];

export const NEXT_STATUS: Partial<Record<ShipmentStatus, ShipmentStatus>> = {
  ACCEPTED: "EN_ROUTE_TO_PICKUP",
  EN_ROUTE_TO_PICKUP: "ARRIVED_AT_PICKUP",
  ARRIVED_AT_PICKUP: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "ARRIVED_AT_DESTINATION",
  ARRIVED_AT_DESTINATION: "DELIVERED",
};

export function useDriverTrip(shipmentId?: string) {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const { enqueue, isOffline } = useOfflineQueue();

  const { data: driver } = useQuery({
    queryKey: ["my_driver_record", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("drivers")
        .select("*")
        .eq("profile_id", user!.id)
        .single();
      return data;
    },
  });

  // Active trips for the driver
  const { data: activeTrips = [], isLoading: tripsLoading } = useQuery({
    queryKey: ["driver_trip", "list", driver?.id],
    enabled: !!driver?.id && !shipmentId,
    refetchInterval: 20000,
    queryFn: async (): Promise<TripShipment[]> => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, cargo_type:cargo_types(id, name), vehicle_type:vehicle_types(id, name)")
        .eq("driver_id", driver!.id)
        .in("status", ACTIVE_TRIP_STATUSES)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as TripShipment[];
    },
  });

  // Single shipment detail
  const { data: trip, isLoading: tripLoading } = useQuery({
    queryKey: ["driver_trip", shipmentId],
    enabled: !!shipmentId,
    refetchInterval: 15000,
    queryFn: async (): Promise<TripShipment> => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, cargo_type:cargo_types(id, name), vehicle_type:vehicle_types(id, name)")
        .eq("id", shipmentId!)
        .single();
      if (error) throw error;
      return data as unknown as TripShipment;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["shipment_events", shipmentId],
    enabled: !!shipmentId,
    queryFn: async (): Promise<ShipmentEventRow[]> => {
      const { data, error } = await supabase
        .from("shipment_events")
        .select("*")
        .eq("shipment_id", shipmentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ShipmentEventRow[];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["driver_trip"] });
    void qc.invalidateQueries({ queryKey: ["driver_jobs"] });
  };

  const { mutateAsync: advanceStatus } = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
      geo,
      note,
    }: {
      id: string;
      nextStatus: ShipmentStatus;
      geo?: { lat: number; lng: number };
      note?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (isOffline) {
        enqueue({ shipment_id: id, status: nextStatus, actor_id: user.id, note, geo });
        return;
      }
      await updateShipmentStatus(id, nextStatus, user.id, undefined, note, geo);
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: markFailed } = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error("Not authenticated");
      await updateShipmentStatus(id, "FAILED", user.id, undefined, reason);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Marked as failed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    driver,
    trip,
    activeTrips,
    events,
    isLoading: tripLoading || tripsLoading,
    advanceStatus,
    markFailed,
    isOffline,
  };
}

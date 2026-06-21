import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { updateShipmentStatus, writeShipmentEvent } from "@/lib/shipmentEvents";
import { useAuthStore } from "@/stores/authStore";
import type {
  ShipmentRow,
  ShipmentEventRow,
  OrderRow,
  OrderItemRow,
  DriverRow,
  ProfileRow,
  VehicleRow,
  CargoTypeRow,
  VehicleTypeRow,
  CustomerRow,
} from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

export type ShipmentDetail = ShipmentRow & {
  cargo_type: Pick<CargoTypeRow, "id" | "name"> | null;
  vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null;
  customer: (CustomerRow & { profile: Pick<ProfileRow, "id" | "name" | "phone"> }) | null;
  driver: (DriverRow & { profile: Pick<ProfileRow, "id" | "name" | "phone"> }) | null;
  vehicle: Pick<VehicleRow, "id" | "plate" | "capacity_kg"> | null;
  order: (OrderRow & { items: OrderItemRow[] }) | null;
  events: ShipmentEventRow[];
};

export function useShipmentDetail(id: string | undefined) {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["shipment_detail", id],
    enabled: !!id,
    queryFn: async (): Promise<ShipmentDetail> => {
      const { data: shipment, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      const s = shipment as ShipmentRow;

      const [eventsRes, cargoRes, vehicleTypeRes, customerRes, driverRes, vehicleRes, orderRes] =
        await Promise.all([
          supabase.from("shipment_events").select("*").eq("shipment_id", id!).order("created_at"),
          s.cargo_type_id
            ? supabase.from("cargo_types").select("id, name").eq("id", s.cargo_type_id).single()
            : Promise.resolve({ data: null }),
          s.vehicle_type_id
            ? supabase.from("vehicle_types").select("id, name").eq("id", s.vehicle_type_id).single()
            : Promise.resolve({ data: null }),
          supabase
            .from("customers")
            .select("*, profile:profiles(id, name, phone)")
            .eq("id", s.customer_id)
            .single(),
          s.driver_id
            ? supabase
                .from("drivers")
                .select("*, profile:profiles(id, name, phone)")
                .eq("id", s.driver_id)
                .single()
            : Promise.resolve({ data: null }),
          s.vehicle_id
            ? supabase
                .from("vehicles")
                .select("id, plate, capacity_kg")
                .eq("id", s.vehicle_id)
                .single()
            : Promise.resolve({ data: null }),
          s.order_id
            ? supabase.from("orders").select("*").eq("id", s.order_id).single()
            : Promise.resolve({ data: null }),
        ]);

      let orderWithItems: (OrderRow & { items: OrderItemRow[] }) | null = null;
      if (orderRes.data) {
        const { data: items } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", orderRes.data.id);
        orderWithItems = { ...(orderRes.data as OrderRow), items: (items ?? []) as OrderItemRow[] };
      }

      return {
        ...s,
        cargo_type: cargoRes.data as Pick<CargoTypeRow, "id" | "name"> | null,
        vehicle_type: vehicleTypeRes.data as Pick<VehicleTypeRow, "id" | "name"> | null,
        customer: customerRes.data as unknown as ShipmentDetail["customer"],
        driver: driverRes.data as unknown as ShipmentDetail["driver"],
        vehicle: vehicleRes.data as Pick<VehicleRow, "id" | "plate" | "capacity_kg"> | null,
        order: orderWithItems,
        events: (eventsRes.data ?? []) as ShipmentEventRow[],
      };
    },
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["shipment_detail", id] });

  const { mutateAsync: setStatus } = useMutation({
    mutationFn: async ({ status, note }: { status: ShipmentStatus; note?: string }) => {
      if (!user) throw new Error("Not authenticated");
      await updateShipmentStatus(id!, status, user.id, undefined, note);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: assign } = useMutation({
    mutationFn: async ({ driverId, vehicleId }: { driverId: string; vehicleId: string | null }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("shipments")
        .update({ driver_id: driverId, vehicle_id: vehicleId, status: "ASSIGNED" })
        .eq("id", id!);
      if (error) throw error;
      await writeShipmentEvent(id!, "ASSIGNED", user.id, "Driver assigned by admin");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Driver assigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { shipment: data, isLoading, error, setStatus, assign, invalidate };
}

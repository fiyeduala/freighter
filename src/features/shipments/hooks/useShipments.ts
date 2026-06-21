import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { ShipmentRow, CustomerRow, ProfileRow, VehicleTypeRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

export type ShipmentWithDetail = ShipmentRow & {
  customer: (CustomerRow & { profile: Pick<ProfileRow, "name" | "phone"> }) | null;
  vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null;
};

const QK = (filter?: { status?: string }) => ["shipments", filter] as const;

export function useShipments(filter?: { status?: ShipmentStatus | "all" }) {
  const { data = [], isLoading } = useQuery({
    queryKey: QK(filter),
    queryFn: async () => {
      let query = supabase.from("shipments").select("*").order("created_at", { ascending: false });

      if (filter?.status && filter.status !== "all") {
        query = query.eq("status", filter.status);
      }

      const { data: shipments, error } = await query;
      if (error) throw error;
      if (!shipments?.length) return [];

      const customerIds = [...new Set(shipments.map((s) => s.customer_id))];
      const vtIds = [
        ...new Set(shipments.map((s) => s.vehicle_type_id).filter(Boolean)),
      ] as string[];

      const [{ data: customers }, { data: vts }] = await Promise.all([
        supabase.from("customers").select("*, profile:profiles(name, phone)").in("id", customerIds),
        vtIds.length
          ? supabase.from("vehicle_types").select("id, name").in("id", vtIds)
          : Promise.resolve({
              data: [] as Pick<VehicleTypeRow, "id" | "name">[],
            }),
      ]);

      const custMap = new Map(
        (customers as unknown as ShipmentWithDetail["customer"][])
          ?.filter(Boolean)
          .map((c) => [c!.id, c]) ?? [],
      );
      const vtMap = new Map((vts ?? []).map((v) => [v.id, v]));

      return shipments.map((s) => ({
        ...s,
        customer: custMap.get(s.customer_id) ?? null,
        vehicle_type: s.vehicle_type_id ? (vtMap.get(s.vehicle_type_id) ?? null) : null,
      })) as ShipmentWithDetail[];
    },
  });

  const queryClient = useQueryClient();

  const { mutate: updateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShipmentStatus }) => {
      const { error } = await supabase.from("shipments").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { shipments: data, isLoading, updateStatus };
}

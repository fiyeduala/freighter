import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OrderRow, CustomerRow, ProfileRow, ShipmentRow } from "@/types/supabase";

export type OrderWithDetail = OrderRow & {
  customer: (CustomerRow & { profile: Pick<ProfileRow, "id" | "name" | "phone"> }) | null;
  shipment: Pick<ShipmentRow, "id" | "status" | "pickup" | "destination"> | null;
};

export function useOrders(filter?: { payment_status?: string }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["orders", filter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filter?.payment_status && filter.payment_status !== "all") {
        query = query.eq(
          "payment_status",
          filter.payment_status as OrderRow["payment_status"],
        );
      }

      const { data: orders, error } = await query;
      if (error) throw error;
      if (!orders?.length) return [];

      const customerIds = [...new Set(orders.map((o) => o.customer_id))];
      const shipmentIds = orders.map((o) => o.shipment_id).filter(Boolean) as string[];

      const [{ data: customers }, { data: shipments }] = await Promise.all([
        supabase
          .from("customers")
          .select("*, profile:profiles(id, name, phone)")
          .in("id", customerIds),
        shipmentIds.length
          ? supabase
              .from("shipments")
              .select("id, status, pickup, destination")
              .in("id", shipmentIds)
          : Promise.resolve({ data: [] as { id: string; status: string; pickup: unknown; destination: unknown }[] }),
      ]);

      const custMap = new Map(
        (customers as unknown as OrderWithDetail["customer"][])
          ?.filter(Boolean)
          .map((c) => [c!.id, c]) ?? [],
      );
      const shipMap = new Map(
        (shipments ?? []).map((s) => [s.id, s as unknown as OrderWithDetail["shipment"]]),
      );

      return orders.map((o) => ({
        ...o,
        customer: custMap.get(o.customer_id) ?? null,
        shipment: o.shipment_id ? (shipMap.get(o.shipment_id) ?? null) : null,
      })) as OrderWithDetail[];
    },
  });

  return { orders: data, isLoading };
}

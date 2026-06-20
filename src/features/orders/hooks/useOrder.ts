import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { OrderRow, OrderItemRow, CustomerRow, ProfileRow, ShipmentRow } from "@/types/supabase";

export type OrderDetail = OrderRow & {
  items: OrderItemRow[];
  customer: (CustomerRow & { profile: ProfileRow }) | null;
  shipment: ShipmentRow | null;
};

export function useOrder(id?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const [{ data: items }, { data: customer }, shipmentResult] = await Promise.all([
        supabase.from("order_items").select("*").eq("order_id", id!).order("created_at"),
        supabase
          .from("customers")
          .select("*, profile:profiles(*)")
          .eq("id", order.customer_id)
          .single(),
        order.shipment_id
          ? supabase.from("shipments").select("*").eq("id", order.shipment_id).single()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...order,
        items: items ?? [],
        customer: customer as unknown as OrderDetail["customer"],
        shipment: shipmentResult.data as ShipmentRow | null,
      } as OrderDetail;
    },
  });

  return { order: data, isLoading };
}

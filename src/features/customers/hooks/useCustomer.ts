import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type {
  CustomerRow,
  ProfileRow,
  CustomerAddressRow,
  ShipmentRow,
  OrderRow,
} from "@/types/supabase";

export type CustomerDetail = CustomerRow & {
  profile: ProfileRow;
  addresses: CustomerAddressRow[];
  recent_shipments: Pick<ShipmentRow, "id" | "status" | "created_at" | "pickup" | "destination">[];
  recent_orders: Pick<OrderRow, "id" | "total" | "payment_status" | "created_at">[];
};

export function useCustomer(id?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["customer", id],
    enabled: !!id,
    queryFn: async () => {
      const [
        { data: customer, error },
        { data: addresses },
        { data: shipments },
        { data: orders },
      ] = await Promise.all([
        supabase.from("customers").select("*, profile:profiles(*)").eq("id", id!).single(),
        supabase
          .from("customer_addresses")
          .select("*")
          .eq("customer_id", id!)
          .order("created_at"),
        supabase
          .from("shipments")
          .select("id, status, created_at, pickup, destination")
          .eq("customer_id", id!)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("orders")
          .select("id, total, payment_status, created_at")
          .eq("customer_id", id!)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);
      if (error) throw error;
      return {
        ...(customer as unknown as CustomerDetail),
        addresses: addresses ?? [],
        recent_shipments: (shipments ?? []) as CustomerDetail["recent_shipments"],
        recent_orders: (orders ?? []) as CustomerDetail["recent_orders"],
      };
    },
  });

  const queryClient = useQueryClient();

  const { mutate: setStatus } = useMutation({
    mutationFn: async ({ status }: { status: "active" | "suspended" }) => {
      if (!data?.profile_id) throw new Error("No profile");
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", data.profile_id);
      if (error) throw error;
      await writeAuditLog(`customer_${status}`, "profiles", data.profile_id, {
        status,
      } as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customer", id] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { customer: data, isLoading, setStatus };
}

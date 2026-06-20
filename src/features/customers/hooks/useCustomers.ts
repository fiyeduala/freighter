import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { CustomerRow, ProfileRow } from "@/types/supabase";

export type CustomerWithProfile = CustomerRow & {
  profile: ProfileRow;
  shipment_count: number;
};

const QK = ["customers"] as const;

export function useCustomers() {
  const { data = [], isLoading } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const [{ data: customers, error }, { data: shipments }] = await Promise.all([
        supabase
          .from("customers")
          .select("*, profile:profiles(*)")
          .order("created_at", { ascending: false }),
        supabase.from("shipments").select("customer_id"),
      ]);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const s of shipments ?? []) {
        counts.set(s.customer_id, (counts.get(s.customer_id) ?? 0) + 1);
      }

      return (customers as unknown as CustomerWithProfile[]).map((c) => ({
        ...c,
        shipment_count: counts.get(c.id) ?? 0,
      }));
    },
  });

  const queryClient = useQueryClient();

  const { mutate: setStatus } = useMutation({
    mutationFn: async ({
      profileId,
      status,
    }: {
      profileId: string;
      status: "active" | "suspended";
    }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", profileId);
      if (error) throw error;
      await writeAuditLog(`customer_${status}`, "profiles", profileId, { status } as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Customer status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { customers: data, isLoading, setStatus };
}

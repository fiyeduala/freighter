import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { PricingRulesRow } from "@/types/supabase";

const QK = ["pricing_rules"] as const;

export function usePricingRules() {
  const { data, isLoading, error } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("is_active", true)
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return (data ?? null) as PricingRulesRow | null;
    },
  });

  const queryClient = useQueryClient();

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async (values: Omit<PricingRulesRow, "id" | "created_at" | "updated_at">) => {
      if (data?.id) {
        const { error } = await supabase.from("pricing_rules").update(values).eq("id", data.id);
        if (error) throw error;
        await writeAuditLog("update", "pricing_rules", data.id, values as never);
      } else {
        const { data: created, error } = await supabase
          .from("pricing_rules")
          .insert(values)
          .select()
          .single();
        if (error) throw error;
        await writeAuditLog("create", "pricing_rules", created.id);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Pricing saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { rules: data, isLoading, error, save, isSaving };
}

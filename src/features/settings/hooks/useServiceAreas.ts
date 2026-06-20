import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { ServiceAreaRow } from "@/types/supabase";

const QK = ["service_areas"] as const;

export function useServiceAreas() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_areas")
        .select("*")
        .order("state")
        .order("city");
      if (error) throw error;
      return data as ServiceAreaRow[];
    },
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const { mutate: add, isPending: isAdding } = useMutation({
    mutationFn: async (values: { state: string; city?: string; surcharge?: number }) => {
      const { data: created, error } = await supabase
        .from("service_areas")
        .insert({
          state: values.state,
          city: values.city ?? null,
          surcharge: values.surcharge ?? 0,
          enabled: true,
        })
        .select()
        .single();
      if (error) throw error;
      await writeAuditLog("create", "service_areas", created.id);
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Area added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: toggle, isPending: isToggling } = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("service_areas").update({ enabled }).eq("id", id);
      if (error) throw error;
      await writeAuditLog("update", "service_areas", id, { enabled } as never);
    },
    onSuccess: () => {
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove, isPending: isRemoving } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_areas").delete().eq("id", id);
      if (error) throw error;
      await writeAuditLog("delete", "service_areas", id);
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Area removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { areas: data, isLoading, error, add, isAdding, toggle, isToggling, remove, isRemoving };
}

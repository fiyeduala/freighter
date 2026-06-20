import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { VehicleTypeRow } from "@/types/supabase";

const QK = ["vehicle_types"] as const;

type VehicleTypeInput = Omit<VehicleTypeRow, "id" | "created_at" | "updated_at">;

export function useVehicleTypes() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicle_types").select("*").order("name");
      if (error) throw error;
      return data as VehicleTypeRow[];
    },
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({ id, ...values }: VehicleTypeInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from("vehicle_types").update(values).eq("id", id);
        if (error) throw error;
        await writeAuditLog("update", "vehicle_types", id, values as never);
      } else {
        const { data: created, error } = await supabase
          .from("vehicle_types")
          .insert(values)
          .select()
          .single();
        if (error) throw error;
        await writeAuditLog("create", "vehicle_types", created.id);
      }
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: remove, isPending: isRemoving } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicle_types").delete().eq("id", id);
      if (error) throw error;
      await writeAuditLog("delete", "vehicle_types", id);
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { vehicleTypes: data, isLoading, error, save, isSaving, remove, isRemoving };
}

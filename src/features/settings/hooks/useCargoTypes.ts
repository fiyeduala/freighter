import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { CargoTypeRow } from "@/types/supabase";

const QK = ["cargo_types"] as const;

type CargoTypeInput = Omit<CargoTypeRow, "id" | "created_at" | "updated_at">;

export function useCargoTypes() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase.from("cargo_types").select("*").order("name");
      if (error) throw error;
      return data as CargoTypeRow[];
    },
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({ id, ...values }: CargoTypeInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from("cargo_types").update(values).eq("id", id);
        if (error) throw error;
        await writeAuditLog("update", "cargo_types", id, values as never);
      } else {
        const { data: created, error } = await supabase
          .from("cargo_types")
          .insert(values)
          .select()
          .single();
        if (error) throw error;
        await writeAuditLog("create", "cargo_types", created.id);
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
      const { error } = await supabase.from("cargo_types").delete().eq("id", id);
      if (error) throw error;
      await writeAuditLog("delete", "cargo_types", id);
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { cargoTypes: data, isLoading, error, save, isSaving, remove, isRemoving };
}

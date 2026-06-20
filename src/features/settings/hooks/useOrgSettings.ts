import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { OrgSettingsRow } from "@/types/supabase";

const QK = ["org_settings"] as const;

export function useOrgSettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase.from("org_settings").select("*").single();
      if (error) throw error;
      return data as OrgSettingsRow;
    },
  });

  const queryClient = useQueryClient();

  const { mutate: update, isPending: isSaving } = useMutation({
    mutationFn: async (
      updates: Partial<Omit<OrgSettingsRow, "id" | "_singleton" | "created_at" | "updated_at">>,
    ) => {
      const { error } = await supabase.from("org_settings").update(updates).eq("_singleton", true);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    settings: data,
    isLoading,
    error,
    update: update as (
      updates: Partial<Omit<OrgSettingsRow, "id" | "_singleton" | "created_at" | "updated_at">>,
    ) => void,
    isSaving,
  };
}

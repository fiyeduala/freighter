import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { NotificationSettingRow } from "@/types/supabase";

const QK = ["notification_settings"] as const;

export function useNotificationSettings() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .order("event_name");
      if (error) throw error;
      return data as NotificationSettingRow[];
    },
  });

  const queryClient = useQueryClient();

  const { mutate: updateRow, isPending: isSaving } = useMutation<
    void,
    Error,
    Partial<Omit<NotificationSettingRow, "id" | "created_at" | "updated_at">> & { id: string }
  >({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<NotificationSettingRow, "id" | "created_at" | "updated_at">> & {
      id: string;
    }) => {
      const { error } = await supabase.from("notification_settings").update(updates).eq("id", id);
      if (error) throw error;
      await writeAuditLog("update", "notification_settings", id, updates as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QK });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { settings: data, isLoading, error, updateRow, isSaving };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { MaintenanceLogRow, VehicleRow } from "@/types/supabase";

export type MaintenanceLogWithVehicle = MaintenanceLogRow & {
  vehicle: Pick<VehicleRow, "id" | "plate"> | null;
};

export function useMaintenance(vehicleId?: string) {
  const queryKey = vehicleId ? ["maintenance_logs", vehicleId] : ["maintenance_logs"];
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["maintenance_logs"] });

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("maintenance_logs")
        .select("*, vehicle:vehicles(id, plate)")
        .order("date", { ascending: false });
      if (vehicleId) q = q.eq("vehicle_id", vehicleId);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as MaintenanceLogWithVehicle[];
    },
  });

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: async (
      values: Omit<MaintenanceLogRow, "id" | "created_at" | "updated_at"> & {
        setVehicleMaintenance?: boolean;
      },
    ) => {
      const { setVehicleMaintenance, ...log } = values;
      const { data: created, error } = await supabase
        .from("maintenance_logs")
        .insert(log)
        .select()
        .single();
      if (error) throw error;

      if (setVehicleMaintenance) {
        await supabase.from("vehicles").update({ status: "maintenance" }).eq("id", log.vehicle_id);
      }
      await writeAuditLog("create_maintenance_log", "maintenance_logs", created.id);
    },
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Maintenance log created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: markComplete } = useMutation({
    mutationFn: async (logId: string) => {
      const log = data.find((l) => l.id === logId);
      const { error } = await supabase
        .from("maintenance_logs")
        .update({ status: "completed" })
        .eq("id", logId);
      if (error) throw error;

      // Set vehicle back to available when maintenance completes
      if (log?.vehicle_id) {
        await supabase
          .from("vehicles")
          .update({ status: "available" })
          .eq("id", log.vehicle_id)
          .eq("status", "maintenance");
      }
      await writeAuditLog("complete_maintenance_log", "maintenance_logs", logId);
    },
    onSuccess: () => {
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Marked as complete");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { logs: data, isLoading, error, create, isCreating, markComplete };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type {
  DriverRow,
  MaintenanceLogRow,
  ProfileRow,
  VehicleRow,
  VehicleTypeRow,
} from "@/types/supabase";

export type VehicleDetail = VehicleRow & {
  vehicle_type: VehicleTypeRow | null;
};

export type AssignedDriver = DriverRow & { profile: Pick<ProfileRow, "id" | "name" | "phone"> };

export function useVehicle(id: string | undefined) {
  const queryKey = ["vehicles", id] as const;
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["vehicles"] });

  const {
    data: vehicle,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*, vehicle_type:vehicle_types(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as VehicleDetail;
    },
  });

  const { data: assignedDriver } = useQuery({
    queryKey: ["vehicles", id, "driver"],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*, profile:profiles(id, name, phone)")
        .eq("current_vehicle_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as AssignedDriver | null;
    },
  });

  const { data: maintenanceLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["maintenance_logs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("vehicle_id", id!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as MaintenanceLogRow[];
    },
  });

  const { mutate: setStatus } = useMutation({
    mutationFn: async (status: VehicleRow["status"]) => {
      const { error } = await supabase.from("vehicles").update({ status }).eq("id", id!);
      if (error) throw error;
      await writeAuditLog("set_vehicle_status", "vehicles", id!, { status } as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void invalidate();
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: assignDriver, isPending: isAssigning } = useMutation({
    mutationFn: async ({
      driverId,
      previousDriverId,
    }: {
      driverId: string | null;
      previousDriverId?: string | null;
    }) => {
      // Clear previous driver's assignment if different driver
      if (previousDriverId && previousDriverId !== driverId) {
        await supabase
          .from("drivers")
          .update({ current_vehicle_id: null })
          .eq("id", previousDriverId);
      }
      // Set new driver's current vehicle
      if (driverId) {
        const { error } = await supabase
          .from("drivers")
          .update({ current_vehicle_id: id })
          .eq("id", driverId);
        if (error) throw error;
        await writeAuditLog("assign_vehicle_driver", "vehicles", id!, { driverId } as never);
      } else if (previousDriverId) {
        // Unassigning
        const { error } = await supabase
          .from("drivers")
          .update({ current_vehicle_id: null })
          .eq("id", previousDriverId);
        if (error) throw error;
        await writeAuditLog("unassign_vehicle_driver", "vehicles", id!);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void queryClient.invalidateQueries({ queryKey: ["vehicles", id, "driver"] });
      void invalidate();
      void queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast.success("Assignment updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    vehicle,
    assignedDriver,
    maintenanceLogs,
    isLoading,
    logsLoading,
    error,
    setStatus,
    assignDriver,
    isAssigning,
  };
}

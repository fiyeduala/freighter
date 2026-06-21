import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { updateShipmentStatus } from "@/lib/shipmentEvents";
import { useAuthStore } from "@/stores/authStore";
import type { ShipmentRow, DriverRow, CargoTypeRow, VehicleTypeRow } from "@/types/supabase";

export type JobShipment = ShipmentRow & {
  cargo_type: Pick<CargoTypeRow, "id" | "name"> | null;
  vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null;
};

async function getDriverRecord(profileId: string): Promise<DriverRow | null> {
  const { data } = await supabase.from("drivers").select("*").eq("profile_id", profileId).single();
  return data as DriverRow | null;
}

export function useDriverJobs() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Resolve driver.id from profile_id
  const { data: driver } = useQuery({
    queryKey: ["my_driver_record", user?.id],
    enabled: !!user?.id,
    queryFn: () => getDriverRecord(user!.id),
  });

  // Jobs = shipments in ASSIGNED status for this driver
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["driver_jobs", driver?.id],
    enabled: !!driver?.id,
    refetchInterval: 15000,
    queryFn: async (): Promise<JobShipment[]> => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, cargo_type:cargo_types(id, name), vehicle_type:vehicle_types(id, name)")
        .eq("driver_id", driver!.id)
        .eq("status", "ASSIGNED")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as JobShipment[];
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["driver_jobs"] });
    void qc.invalidateQueries({ queryKey: ["driver_trip"] });
  };

  const { mutateAsync: acceptJob } = useMutation({
    mutationFn: async (shipmentId: string) => {
      if (!driver || !user) throw new Error("Driver not loaded");
      await updateShipmentStatus(shipmentId, "ACCEPTED", user.id, undefined, "Driver accepted job");
    },
    onSuccess: () => {
      invalidate();
      toast.success("Job accepted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: declineJob } = useMutation({
    mutationFn: async ({ shipmentId, reason }: { shipmentId: string; reason?: string }) => {
      if (!user) throw new Error("Not authenticated");
      // Return to REQUESTED so admin can re-assign
      const { error } = await supabase
        .from("shipments")
        .update({ status: "REQUESTED", driver_id: null, vehicle_id: null })
        .eq("id", shipmentId);
      if (error) throw error;
      await import("@/lib/shipmentEvents").then(({ writeShipmentEvent }) =>
        writeShipmentEvent(shipmentId, "DECLINED", user.id, reason),
      );
    },
    onSuccess: () => {
      invalidate();
      toast.success("Job declined");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutateAsync: toggleOnline } = useMutation({
    mutationFn: async (online: boolean) => {
      if (!driver) throw new Error("Driver not loaded");
      const { error } = await supabase.from("drivers").update({ online }).eq("id", driver.id);
      if (error) throw error;
    },
    onSuccess: (_, online) => {
      void qc.invalidateQueries({ queryKey: ["my_driver_record"] });
      toast.success(online ? "You are now online" : "You are now offline");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { driver, jobs, isLoading, acceptJob, declineJob, toggleOnline };
}

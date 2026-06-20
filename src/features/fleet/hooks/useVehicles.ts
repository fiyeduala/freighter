import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { DriverRow, ProfileRow, VehicleRow, VehicleTypeRow } from "@/types/supabase";

export type VehicleWithType = VehicleRow & {
  vehicle_type: Pick<VehicleTypeRow, "id" | "name" | "icon"> | null;
  assigned_driver:
    | (Pick<DriverRow, "id" | "profile_id"> & { profile: Pick<ProfileRow, "name"> | null })
    | null;
};

const QK = ["vehicles"] as const;

export function useVehicles() {
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      // Get vehicles with type
      const { data: vehicles, error: vErr } = await supabase
        .from("vehicles")
        .select("*, vehicle_type:vehicle_types(id, name, icon)")
        .order("created_at", { ascending: false });
      if (vErr) throw vErr;

      // Get drivers with their assigned vehicle id + profile name
      const { data: drivers, error: dErr } = await supabase
        .from("drivers")
        .select("id, profile_id, current_vehicle_id, profile:profiles(name)")
        .not("current_vehicle_id", "is", null);
      if (dErr) throw dErr;

      const driversByVehicle = new Map<string, (typeof drivers)[number]>();
      for (const d of drivers ?? []) {
        if (d.current_vehicle_id) driversByVehicle.set(d.current_vehicle_id, d);
      }

      return (vehicles ?? []).map((v) => ({
        ...v,
        assigned_driver: driversByVehicle.get(v.id) ?? null,
      })) as unknown as VehicleWithType[];
    },
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const { mutate: setStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VehicleRow["status"] }) => {
      const { error } = await supabase.from("vehicles").update({ status }).eq("id", id);
      if (error) throw error;
      await writeAuditLog("set_vehicle_status", "vehicles", id, { status } as never);
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Vehicle status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { vehicles: data, isLoading, error, setStatus };
}

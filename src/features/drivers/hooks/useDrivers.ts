import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";
import type { DriverRow, ProfileRow, VehicleRow } from "@/types/supabase";

export type DriverWithProfile = DriverRow & {
  profile: ProfileRow;
  vehicle: Pick<VehicleRow, "id" | "plate" | "capacity_kg" | "status"> | null;
};

const QK = ["drivers"] as const;

export function useDrivers() {
  const {
    data = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*, profile:profiles(*), vehicle:vehicles(id, plate, capacity_kg, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as DriverWithProfile[];
    },
  });

  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QK });

  const { mutate: setProfileStatus } = useMutation({
    mutationFn: async ({
      profileId,
      status,
      driverId,
    }: {
      profileId: string;
      driverId: string;
      status: "active" | "suspended";
    }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", profileId);
      if (error) throw error;
      await writeAuditLog(
        status === "active" ? "activate_driver" : "suspend_driver",
        "drivers",
        driverId,
      );
    },
    onSuccess: () => {
      void invalidate();
      toast.success("Driver status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { drivers: data, isLoading, error, refetch, setProfileStatus };
}

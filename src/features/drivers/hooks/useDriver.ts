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

export type DriverDocuments = {
  licence?: { url?: string | null; number?: string | null; expiry?: string | null };
  id_card?: { url?: string | null; number?: string | null; expiry?: string | null };
  vehicle_papers?: { url?: string | null; expiry?: string | null };
  insurance?: { url?: string | null; expiry?: string | null };
  _verification_note?: string;
};

export type DriverDetail = DriverRow & {
  profile: ProfileRow;
  vehicle: (VehicleRow & { vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null }) | null;
};

export function useDriver(id: string | undefined) {
  const queryKey = ["drivers", id] as const;
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["drivers"] });

  const {
    data: driver,
    isLoading,
    error,
  } = useQuery({
    queryKey,
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*, profile:profiles(*), vehicle:vehicles(*, vehicle_type:vehicle_types(id, name))")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as DriverDetail;
    },
  });

  const { mutate: setVerification } = useMutation({
    mutationFn: async ({
      status,
      note,
    }: {
      status: "pending" | "under_review" | "approved" | "rejected";
      note?: string;
    }) => {
      const docs = (driver?.documents ?? {}) as DriverDocuments;
      const updatedDocs: DriverDocuments = {
        ...docs,
        ...(note !== undefined ? { _verification_note: note } : {}),
      };
      const { error } = await supabase
        .from("drivers")
        .update({ verification_status: status, documents: updatedDocs as never })
        .eq("id", id!);
      if (error) throw error;

      // If approved, activate the profile too
      if (status === "approved" && driver?.profile) {
        await supabase.from("profiles").update({ status: "active" }).eq("id", driver.profile.id);
      }

      await writeAuditLog("set_verification_status", "drivers", id!, {
        status,
        note,
      } as never);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void invalidate();
      toast.success("Verification updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: setProfileStatus } = useMutation({
    mutationFn: async (status: "active" | "suspended") => {
      if (!driver?.profile) throw new Error("Driver not loaded");
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", driver.profile.id);
      if (error) throw error;
      await writeAuditLog(
        status === "active" ? "activate_driver" : "suspend_driver",
        "drivers",
        id!,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      void invalidate();
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { mutate: updateDocuments } = useMutation({
    mutationFn: async (docs: DriverDocuments) => {
      const { error } = await supabase
        .from("drivers")
        .update({ documents: docs as unknown as never })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
      toast.success("Documents saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: maintenanceLogs = [] } = useQuery({
    queryKey: ["maintenance_logs", "driver_vehicle", driver?.current_vehicle_id],
    enabled: !!driver?.current_vehicle_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_logs")
        .select("*")
        .eq("vehicle_id", driver!.current_vehicle_id!)
        .order("date", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as MaintenanceLogRow[];
    },
  });

  return {
    driver,
    isLoading,
    error,
    maintenanceLogs,
    setVerification,
    setProfileStatus,
    updateDocuments,
  };
}

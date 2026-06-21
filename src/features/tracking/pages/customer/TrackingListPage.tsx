import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Navigation, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { format, parseISO } from "date-fns";
import type { ShipmentRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

const TRACKABLE: ShipmentStatus[] = [
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
];

function locCity(loc: Json): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

export function TrackingListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["customer_trackable", user?.id],
    enabled: !!user?.id,
    refetchInterval: 30_000,
    queryFn: async (): Promise<ShipmentRow[]> => {
      // Resolve customer id
      const { data: cust } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user!.id)
        .single();
      if (!cust) return [];

      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("customer_id", cust.id)
        .in("status", TRACKABLE)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as ShipmentRow[];
    },
  });

  return (
    <div>
      <PageHeader
        title="Track Shipments"
        description={
          shipments.length > 0
            ? `${shipments.length} active shipment${shipments.length === 1 ? "" : "s"}`
            : "No active shipments"
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="No active shipments"
          description="Shipments you've placed that are in transit will appear here."
        />
      ) : (
        <div className="space-y-3">
          {shipments.map((s) => (
            <div
              key={s.id}
              className="cursor-pointer rounded-md border p-4 transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/app/tracking/${s.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {locCity(s.pickup)} → {locCity(s.destination)}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {s.eta && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ETA {format(parseISO(s.eta), "dd MMM, HH:mm")}
                      </span>
                    )}
                    <span>{format(parseISO(s.updated_at), "dd MMM, HH:mm")}</span>
                  </div>
                </div>
                <ShipmentStatusBadge status={s.status as ShipmentStatus} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

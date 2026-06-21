import { useNavigate } from "react-router-dom";
import { Navigation } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useDriverTrip } from "@/features/drivers/hooks/useDriverTrip";
import { format, parseISO } from "date-fns";
import type { Json } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

function locCity(loc: Json): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

export function TripsListPage() {
  const navigate = useNavigate();
  const { activeTrips, isLoading } = useDriverTrip();

  return (
    <div>
      <PageHeader
        title="Active Trips"
        description={activeTrips.length > 0 ? `${activeTrips.length} active` : "No active trips"}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : activeTrips.length === 0 ? (
        <EmptyState
          icon={Navigation}
          title="No active trips"
          description="Accept a job from the Jobs tab to start a trip."
        />
      ) : (
        <div className="space-y-3">
          {activeTrips.map((t) => (
            <div
              key={t.id}
              className="cursor-pointer rounded-md border p-4 transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/driver/trips/${t.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {locCity(t.pickup)} → {locCity(t.destination)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t.cargo_type?.name ?? "Cargo"}
                    {t.weight && ` · ${t.weight} kg`}
                    {t.distance_km && ` · ${t.distance_km} km`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {format(parseISO(t.updated_at), "dd MMM, HH:mm")}
                  </p>
                </div>
                <ShipmentStatusBadge status={t.status as ShipmentStatus} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

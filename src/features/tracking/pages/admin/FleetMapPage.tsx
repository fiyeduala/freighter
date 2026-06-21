import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Truck, RefreshCw, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useFleetMap } from "@/features/tracking/hooks/useFleetMap";
import { format, parseISO, differenceInSeconds } from "date-fns";
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

function locationAge(recorded_at: string): string {
  const secs = differenceInSeconds(new Date(), parseISO(recorded_at));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

function locationFreshness(recorded_at: string): "live" | "stale" | "lost" {
  const secs = differenceInSeconds(new Date(), parseISO(recorded_at));
  if (secs < 60) return "live";
  if (secs < 300) return "stale";
  return "lost";
}

const FRESHNESS_BADGE: Record<string, string> = {
  live: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  stale: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function FleetMapPage() {
  const navigate = useNavigate();
  const { shipments, isLoading } = useFleetMap();
  const [search, setSearch] = useState("");

  const filtered = shipments.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const pickup = locCity(s.pickup).toLowerCase();
    const dest = locCity(s.destination).toLowerCase();
    const name = (s.driver?.profile.name ?? "").toLowerCase();
    return pickup.includes(q) || dest.includes(q) || name.includes(q) || s.id.startsWith(q);
  });

  // Active drivers with GPS
  const withLocation = filtered.filter((s) => s.lastLocation);
  const withoutLocation = filtered.filter((s) => !s.lastLocation);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fleet Tracking"
        description={`${shipments.length} active shipment${shipments.length === 1 ? "" : "s"}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              {withLocation.length} live
            </Badge>
          </div>
        }
      />

      {/* Static Mapbox overview (when token present) */}
      {mapboxToken && withLocation.length > 0 && (
        <Card>
          <CardContent className="overflow-hidden rounded-lg p-0">
            {(() => {
              const markers = withLocation
                .slice(0, 10)
                .map((s) => `pin-s+e74c3c(${s.lastLocation!.lng},${s.lastLocation!.lat})`)
                .join(",");
              const center = withLocation[0].lastLocation!;
              return (
                <img
                  src={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/${center.lng},${center.lat},8,0/800x300@2x?access_token=${mapboxToken}`}
                  alt="Fleet overview map"
                  className="w-full object-cover"
                  style={{ height: 280 }}
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Search by city, driver, shipment ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="icon" onClick={() => setSearch("")}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No active shipments"
          description="In-transit shipments will appear here."
        />
      ) : (
        <div className="space-y-3">
          {/* With location first */}
          {[...withLocation, ...withoutLocation].map((s) => {
            const fresh = s.lastLocation ? locationFreshness(s.lastLocation.recorded_at) : null;
            return (
              <div
                key={s.id}
                className="cursor-pointer rounded-md border p-4 transition-colors hover:bg-muted/50"
                onClick={() => navigate(`/admin/tracking/${s.id}`)}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {locCity(s.pickup)} → {locCity(s.destination)}
                      </p>
                      <ShipmentStatusBadge status={s.status as ShipmentStatus} />
                    </div>
                    {s.driver && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Truck className="h-3 w-3" />
                        {s.driver.profile.name}
                        {s.driver.vehicle && ` · ${s.driver.vehicle.plate}`}
                      </p>
                    )}
                    {s.eta && (
                      <p className="text-xs text-muted-foreground">
                        ETA {format(parseISO(s.eta), "HH:mm")}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    {s.lastLocation ? (
                      <>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${FRESHNESS_BADGE[fresh!]}`}
                        >
                          {fresh === "live" ? "● Live" : fresh === "stale" ? "◐ Stale" : "○ Lost"}
                        </span>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {s.lastLocation.lat.toFixed(4)}, {s.lastLocation.lng.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {locationAge(s.lastLocation.recorded_at)}
                        </p>
                      </>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        No GPS
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  Truck,
  Clock,
  Navigation,
  Wifi,
  WifiOff,
  AlertTriangle,
  ExternalLink,
  History,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import {
  useTrackingChannel,
  TRACKING_STATE_LABELS,
  TRACKING_STATE_COLORS,
} from "@/features/tracking/hooks/useTrackingChannel";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import type { DriverLocationRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

function locFull(loc: Json): { line1: string; city: string; contact: string } {
  try {
    const l = loc as {
      address?: { line1?: string; city?: string; state?: string };
      contact?: { name?: string; phone?: string };
    };
    return {
      line1: [l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(", "),
      city: l.address?.city ?? "",
      contact: [l.contact?.name, l.contact?.phone].filter(Boolean).join(" · "),
    };
  } catch {
    return { line1: "—", city: "—", contact: "—" };
  }
}

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

function staticMapUrl(lat: number, lng: number): string {
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e74c3c(${lng},${lat})/${lng},${lat},13,0/700x280@2x?access_token=${mapboxToken}`;
}

function TrackingStateBadge({ state }: { state: string }) {
  const label = TRACKING_STATE_LABELS[state as keyof typeof TRACKING_STATE_LABELS] ?? state;
  const cls = TRACKING_STATE_COLORS[state as keyof typeof TRACKING_STATE_COLORS] ?? "";
  const Icon =
    state === "live"
      ? Wifi
      : state === "offline" || state === "gps_lost"
        ? WifiOff
        : state === "stale"
          ? AlertTriangle
          : null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function TrackingDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>();
  const navigate = useNavigate();
  const { shipment, location, trackingState, eta, isLoading } = useTrackingChannel(shipmentId);

  // Location history (last 20 points)
  const { data: history = [] } = useQuery({
    queryKey: ["location_history", shipmentId],
    enabled: !!shipmentId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<DriverLocationRow[]> => {
      const { data } = await supabase
        .from("driver_locations")
        .select("*")
        .eq("shipment_id", shipmentId!)
        .order("recorded_at", { ascending: false })
        .limit(20);
      return (data ?? []) as DriverLocationRow[];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!shipment) return <p className="text-muted-foreground">Shipment not found.</p>;

  const pickup = locFull(shipment.pickup);
  const dest = locFull(shipment.destination);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Tracking — ${shipment.id.slice(0, 8)}`}
        breadcrumbs={[{ label: "Fleet Tracking", href: "/admin/tracking" }, { label: "Shipment" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/shipments/${shipmentId}`)}
          >
            View shipment
          </Button>
        }
      />

      {/* Status bar */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShipmentStatusBadge status={shipment.status as ShipmentStatus} />
              <TrackingStateBadge state={trackingState} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              {(eta?.eta_timestamp ?? shipment.eta) && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    ETA {format(parseISO((eta?.eta_timestamp ?? shipment.eta)!), "HH:mm")}
                  </span>
                  {eta?.distance_remaining_km && (
                    <span className="text-muted-foreground">· {eta.distance_remaining_km} km</span>
                  )}
                </span>
              )}
              {location && (
                <span className="text-xs text-muted-foreground">
                  Updated {format(location.receivedAt, "HH:mm:ss")}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4" />
            Live Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location ? (
            <div className="space-y-3">
              {mapboxToken ? (
                <img
                  src={staticMapUrl(location.lat, location.lng)}
                  alt="Driver location"
                  className="w-full rounded-md border object-cover"
                  style={{ height: 260 }}
                />
              ) : (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
                  <div>
                    <p className="text-sm font-medium">Driver coordinates</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                    {location.speed !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Speed: {Math.round((location.speed ?? 0) * 3.6)} km/h
                        {location.heading !== undefined &&
                          ` · Heading: ${Math.round(location.heading ?? 0)}°`}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/?q=${location.lat},${location.lng}`,
                        "_blank",
                      )
                    }
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Maps
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md border bg-muted/20 p-6 text-center">
              <Navigation className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No live location yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">Pickup — {pickup.city}</p>
                <p className="text-muted-foreground">{pickup.line1}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {pickup.contact}
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">Destination — {dest.city}</p>
                <p className="text-muted-foreground">{dest.line1}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {dest.contact}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {shipment.driver ? (
              <>
                <p className="font-medium">{shipment.driver.profile.name}</p>
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {shipment.driver.profile.phone}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant={shipment.driver.online ? "success" : "secondary"}>
                    {shipment.driver.online ? "Online" : "Offline"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ★ {shipment.driver.rating.toFixed(1)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-0 text-xs"
                  onClick={() => navigate(`/admin/drivers/${shipment.driver_id}`)}
                >
                  View driver →
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">No driver assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location history */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4" />
              Location History
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                last {history.length} pings
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {history.map((loc) => (
                <div key={loc.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">
                    {Number(loc.lat).toFixed(5)}, {Number(loc.lng).toFixed(5)}
                  </span>
                  <span className="text-muted-foreground">
                    {format(parseISO(loc.recorded_at), "HH:mm:ss")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

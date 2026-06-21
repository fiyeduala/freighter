import { useParams } from "react-router-dom";
import {
  MapPin,
  Phone,
  Truck,
  Clock,
  Navigation,
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import {
  useTrackingChannel,
  TRACKING_STATE_LABELS,
  TRACKING_STATE_COLORS,
} from "@/features/tracking/hooks/useTrackingChannel";
import { format, parseISO } from "date-fns";
import type { Json } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

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

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/?q=${lat},${lng}`;
}

function staticMapUrl(lat: number, lng: number, token: string): string {
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+e74c3c(${lng},${lat})/${lng},${lat},13,0/600x250@2x?access_token=${token}`;
}

const TRIP_STEPS: { status: ShipmentStatus; label: string }[] = [
  { status: "ACCEPTED", label: "Driver accepted" },
  { status: "EN_ROUTE_TO_PICKUP", label: "En route to pickup" },
  { status: "ARRIVED_AT_PICKUP", label: "At pickup" },
  { status: "PICKED_UP", label: "Cargo collected" },
  { status: "IN_TRANSIT", label: "In transit" },
  { status: "ARRIVED_AT_DESTINATION", label: "At destination" },
  { status: "DELIVERED", label: "Delivered" },
];

const STEP_ORDER: ShipmentStatus[] = TRIP_STEPS.map((s) => s.status);

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

export function CustomerTrackingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { shipment, location, trackingState, eta, isLoading } = useTrackingChannel(id);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!shipment) return <p className="text-muted-foreground">Shipment not found.</p>;

  const pickup = locFull(shipment.pickup);
  const dest = locFull(shipment.destination);
  const currentIdx = STEP_ORDER.indexOf(shipment.status as ShipmentStatus);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Track Shipment"
        breadcrumbs={[{ label: "Track", href: "/app/tracking" }, { label: "Detail" }]}
      />

      {/* Tracking state + ETA */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShipmentStatusBadge status={shipment.status as ShipmentStatus} />
              <TrackingStateBadge state={trackingState} />
            </div>
            {eta?.eta_timestamp && (
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  ETA {format(parseISO(eta.eta_timestamp), "HH:mm")}
                </span>
                {eta.distance_remaining_km && (
                  <span className="text-muted-foreground">· {eta.distance_remaining_km} km</span>
                )}
              </div>
            )}
            {!eta && shipment.eta && (
              <div className="flex items-center gap-1.5 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ETA {format(parseISO(shipment.eta), "HH:mm")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map / Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4" />
            Driver Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location ? (
            <div className="space-y-3">
              {mapboxToken ? (
                <img
                  src={staticMapUrl(location.lat, location.lng, mapboxToken)}
                  alt="Driver location map"
                  className="w-full rounded-md border object-cover"
                  style={{ height: 220 }}
                />
              ) : (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3">
                  <div className="text-sm">
                    <p className="font-medium">Driver position</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
                    </p>
                    {location.speed && (
                      <p className="text-xs text-muted-foreground">
                        Speed: {Math.round(location.speed * 3.6)} km/h
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(mapsUrl(location.lat, location.lng), "_blank")}
                  >
                    View on map
                  </Button>
                </div>
              )}
              <p className="text-center text-xs text-muted-foreground">
                Last updated {format(location.receivedAt, "HH:mm:ss")}
              </p>
            </div>
          ) : (
            <div className="rounded-md border bg-muted/20 p-6 text-center">
              <Navigation className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {trackingState === "not_started"
                  ? "Location sharing will begin once the driver starts navigating."
                  : "No location data yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress stepper */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {TRIP_STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const active = i === currentIdx;
              return (
                <div key={step.status} className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : "border border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-sm ${active ? "font-semibold" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Route */}
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">Pickup — {pickup.city}</p>
              <p className="text-muted-foreground">{pickup.line1}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">Destination — {dest.city}</p>
              <p className="text-muted-foreground">{dest.line1}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver card */}
      {shipment.driver && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="h-4 w-4" />
              Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{shipment.driver.profile.name}</p>
            <p className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-3 w-3" />
              {shipment.driver.profile.phone}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Badge variant={shipment.driver.online ? "success" : "secondary"}>
                {shipment.driver.online ? "Online" : "Offline"}
              </Badge>
              {shipment.driver.rating && (
                <span className="text-xs text-muted-foreground">
                  ★ {shipment.driver.rating.toFixed(1)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

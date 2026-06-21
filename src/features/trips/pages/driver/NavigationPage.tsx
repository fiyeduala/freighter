import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Navigation, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useDriverTrip } from "@/features/drivers/hooks/useDriverTrip";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

function extractGeo(loc: Json): { lat: number; lng: number; label: string } | null {
  try {
    const l = loc as {
      address?: { line1?: string; city?: string; geo?: { lat?: number; lng?: number } };
    };
    const lat = l.address?.geo?.lat ?? 0;
    const lng = l.address?.geo?.lng ?? 0;
    if (lat === 0 && lng === 0) return null;
    return { lat, lng, label: [l.address?.line1, l.address?.city].filter(Boolean).join(", ") };
  } catch {
    return null;
  }
}

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

const EMIT_INTERVAL_MS = 15_000;
const DB_INSERT_INTERVAL = 4; // insert to DB every 4th emit (~60 s)
const ETA_CALL_INTERVAL = 8; // call compute-eta every 8th emit (~2 min)

export function NavigationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { trip, isLoading } = useDriverTrip(id);
  const [locationError, setLocationError] = useState<string | null>(null);
  const emitCount = useRef(0);
  const driverIdRef = useRef<string | null>(null);

  // Resolve driver.id once
  useEffect(() => {
    if (!user?.id) return;
    void supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) driverIdRef.current = data.id;
      });
  }, [user?.id]);

  // Broadcast + persist location while this page is mounted
  useEffect(() => {
    if (!id) return;
    let stopped = false;

    const channel = supabase.channel(`tracking:${id}`, {
      config: { broadcast: { ack: false } },
    });
    void channel.subscribe();

    const emit = () => {
      if (stopped) return;
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          void (async () => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const heading = pos.coords.heading ?? undefined;
            const speed = pos.coords.speed ?? undefined;
            const timestamp = new Date().toISOString();

            // Broadcast to all subscribers
            await channel.send({
              type: "broadcast",
              event: "location",
              payload: { lat, lng, heading, speed, timestamp },
            });

            emitCount.current += 1;

            // Insert to DB periodically for persistence
            if (emitCount.current % DB_INSERT_INTERVAL === 0 && driverIdRef.current) {
              await supabase.from("driver_locations").insert({
                driver_id: driverIdRef.current,
                shipment_id: id,
                lat,
                lng,
                heading: heading ?? null,
                speed: speed ?? null,
                recorded_at: timestamp,
              });
            }

            // Compute ETA periodically and broadcast it
            if (emitCount.current % ETA_CALL_INTERVAL === 0) {
              const { data: etaData } = await supabase.functions.invoke<{
                eta_minutes: number | null;
                distance_remaining_km: number | null;
                eta_timestamp: string | null;
                via_mapbox: boolean;
              }>("compute-eta", { body: { shipment_id: id, driver_lat: lat, driver_lng: lng } });

              if (etaData) {
                await channel.send({
                  type: "broadcast",
                  event: "eta",
                  payload: etaData,
                });
              }
            }
          })();
        },
        (err) => setLocationError(err.message),
        { enableHighAccuracy: true, timeout: 10_000 },
      );
    };

    emit();
    const interval = setInterval(emit, EMIT_INTERVAL_MS);

    return () => {
      stopped = true;
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [id]);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (!trip) return <p className="text-muted-foreground">Trip not found.</p>;

  const status = trip.status as ShipmentStatus;
  const isBeforePickup = ["ACCEPTED", "EN_ROUTE_TO_PICKUP", "ARRIVED_AT_PICKUP"].includes(status);
  const targetLoc = isBeforePickup ? trip.pickup : trip.destination;
  const target = extractGeo(targetLoc);
  const targetLabel = isBeforePickup ? "Pickup" : "Destination";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Navigation"
        breadcrumbs={[
          { label: "Trips", href: "/driver/trips" },
          { label: "Detail", href: `/driver/trips/${id}` },
          { label: "Navigate" },
        ]}
      />

      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <ShipmentStatusBadge status={status} />
            <span className="text-xs text-muted-foreground">
              Navigating to {targetLabel.toLowerCase()}
            </span>
          </div>

          {target ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <div className="text-sm">
                  <p className="font-medium">{targetLabel}</p>
                  <p className="text-muted-foreground">{target.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {target.lat.toFixed(5)}, {target.lng.toFixed(5)}
                  </p>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => window.open(mapsUrl(target.lat, target.lng), "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open in Google Maps
              </Button>

              {import.meta.env.VITE_MAPBOX_TOKEN && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(mapsUrl(target.lat, target.lng), "_blank")}
                >
                  <Navigation className="h-4 w-4" />
                  Turn-by-turn directions
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border bg-amber-50 p-3 text-sm text-amber-800">
              No GPS coordinates for this {targetLabel.toLowerCase()}. Use the route details page
              for the address.
            </div>
          )}

          {locationError && (
            <p className="text-xs text-destructive">Location error: {locationError}</p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Broadcasting location every {EMIT_INTERVAL_MS / 1000} s · saving to DB every ~
            {(EMIT_INTERVAL_MS * DB_INSERT_INTERVAL) / 1000} s
          </p>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full" onClick={() => navigate(`/driver/trips/${id}`)}>
        <ArrowLeft className="h-4 w-4" />
        Back to trip
      </Button>
    </div>
  );
}

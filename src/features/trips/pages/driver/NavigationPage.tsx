import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Navigation, ExternalLink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useDriverTrip } from "@/features/drivers/hooks/useDriverTrip";
import { supabase } from "@/lib/supabase";
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

export function NavigationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trip, isLoading } = useDriverTrip(id);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Emit driver location to Supabase every 15 s while on this page
  useEffect(() => {
    if (!id) return;
    let stopped = false;

    const emit = () => {
      if (stopped) return;
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          void (async () => {
            const geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            const { data: ship } = await supabase
              .from("shipments")
              .select("driver_id")
              .eq("id", id)
              .single();
            if (ship?.driver_id) {
              await supabase
                .from("drivers")
                .update({ current_location: geo as never })
                .eq("id", ship.driver_id);
            }
          })();
        },
        (err) => setLocationError(err.message),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };

    emit();
    const interval = setInterval(emit, 15000);
    return () => {
      stopped = true;
      clearInterval(interval);
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
                  onClick={() =>
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${target.lat},${target.lng}&travelmode=driving`,
                      "_blank",
                    )
                  }
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
            Your location is being shared with dispatch every 15 seconds.
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

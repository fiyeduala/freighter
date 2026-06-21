import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDriverTrip } from "@/features/drivers/hooks/useDriverTrip";
import type { Json } from "@/types/supabase";

function locFull(loc: Json): {
  line1: string;
  city: string;
  state: string;
  contact: string;
  notes: string;
  lat: number;
  lng: number;
} {
  try {
    const l = loc as {
      address?: {
        line1?: string;
        city?: string;
        state?: string;
        geo?: { lat?: number; lng?: number };
      };
      contact?: { name?: string; phone?: string };
      notes?: string;
    };
    return {
      line1: l.address?.line1 ?? "",
      city: l.address?.city ?? "",
      state: l.address?.state ?? "",
      contact: [l.contact?.name, l.contact?.phone].filter(Boolean).join(" · "),
      notes: l.notes ?? "",
      lat: l.address?.geo?.lat ?? 0,
      lng: l.address?.geo?.lng ?? 0,
    };
  } catch {
    return { line1: "—", city: "—", state: "—", contact: "—", notes: "", lat: 0, lng: 0 };
  }
}

function mapsUrl(lat: number, lng: number): string {
  // Opens in Google Maps (universal) or Apple Maps on iOS
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function RouteDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trip, isLoading } = useDriverTrip(id);

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!trip) return <p className="text-muted-foreground">Trip not found.</p>;

  const pickup = locFull(trip.pickup);
  const dest = locFull(trip.destination);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Route Details"
        breadcrumbs={[
          { label: "Trips", href: "/driver/trips" },
          { label: "Detail", href: `/driver/trips/${id}` },
          { label: "Route" },
        ]}
      />

      <Card>
        <CardContent className="space-y-5 pt-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <p className="text-sm font-medium">Pickup</p>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <p>{pickup.line1}</p>
              <p className="text-muted-foreground">
                {[pickup.city, pickup.state].filter(Boolean).join(", ")}
              </p>
              {pickup.contact && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {pickup.contact}
                </p>
              )}
              {pickup.notes && (
                <p className="text-xs italic text-muted-foreground">{pickup.notes}</p>
              )}
              {pickup.lat !== 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-xs"
                  onClick={() => window.open(mapsUrl(pickup.lat, pickup.lng), "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  Navigate to pickup
                </Button>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium">Destination</p>
            </div>
            <div className="ml-6 space-y-1 text-sm">
              <p>{dest.line1}</p>
              <p className="text-muted-foreground">
                {[dest.city, dest.state].filter(Boolean).join(", ")}
              </p>
              {dest.contact && (
                <p className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {dest.contact}
                </p>
              )}
              {dest.notes && <p className="text-xs italic text-muted-foreground">{dest.notes}</p>}
              {dest.lat !== 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 h-7 text-xs"
                  onClick={() => window.open(mapsUrl(dest.lat, dest.lng), "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  Navigate to destination
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {trip.distance_km && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-sm">
          <span className="text-muted-foreground">Estimated distance</span>
          <span className="font-medium">{trip.distance_km} km</span>
        </div>
      )}

      <Button variant="outline" className="w-full" onClick={() => navigate(`/driver/trips/${id}`)}>
        Back to trip
      </Button>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Phone, Navigation, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useDriverTrip, TRIP_STEPS, NEXT_STATUS } from "@/features/drivers/hooks/useDriverTrip";
import { format, parseISO } from "date-fns";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

function locDetail(loc: Json): { line1: string; contact: string } {
  try {
    const l = loc as {
      address?: { line1?: string; city?: string; state?: string };
      contact?: { name?: string; phone?: string };
    };
    return {
      line1: [l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(", "),
      contact: [l.contact?.name, l.contact?.phone].filter(Boolean).join(" · "),
    };
  } catch {
    return { line1: "—", contact: "—" };
  }
}

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trip, events, isLoading, advanceStatus, markFailed } = useDriverTrip(id);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [isFailing, setIsFailing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!trip) return <p className="text-muted-foreground">Trip not found.</p>;

  const currentStatus = trip.status as ShipmentStatus;
  const nextStatus = NEXT_STATUS[currentStatus];
  const currentStep = TRIP_STEPS.find((s) => s.status === currentStatus);
  const isDelivered = currentStatus === "DELIVERED";

  const pickup = locDetail(trip.pickup);
  const dest = locDetail(trip.destination);

  const handleAdvance = async () => {
    if (!nextStatus || !id) return;
    setIsAdvancing(true);
    try {
      let geo: { lat: number; lng: number } | undefined;
      if (navigator.geolocation) {
        await new Promise<void>((res) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              res();
            },
            () => res(),
            { timeout: 5000 },
          );
        });
      }
      await advanceStatus({ id, nextStatus, geo });
      if (nextStatus === "DELIVERED") navigate(`/driver/trips/${id}/confirm`);
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleFail = async () => {
    if (!id) return;
    setIsFailing(true);
    try {
      await markFailed({ id, reason: failReason || "Delivery failed" });
      setFailOpen(false);
      navigate("/driver/trips");
    } finally {
      setIsFailing(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trip"
        breadcrumbs={[{ label: "Trips", href: "/driver/trips" }, { label: "Detail" }]}
      />

      {/* Status stepper */}
      <Card>
        <CardContent className="pt-4">
          <div className="mb-4 flex items-center justify-between">
            <ShipmentStatusBadge status={currentStatus} />
            <span className="text-xs text-muted-foreground">
              {format(parseISO(trip.updated_at), "dd MMM, HH:mm")}
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max items-center gap-1">
              {TRIP_STEPS.slice(0, -1).map((step, i) => {
                const stepIdx = TRIP_STEPS.findIndex((s) => s.status === currentStatus);
                const done = i < stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={step.status} className="flex items-center">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                        done
                          ? "bg-primary text-primary-foreground"
                          : active
                            ? "border-2 border-primary text-primary"
                            : "border border-muted-foreground/30 text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    {i < TRIP_STEPS.length - 2 && (
                      <div
                        className={`mx-1 h-px w-5 ${done ? "bg-primary" : "bg-muted-foreground/20"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isDelivered && currentStep && nextStatus && (
            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
                onClick={() => void handleAdvance()}
                disabled={isAdvancing}
              >
                {isAdvancing && <Loader2 className="animate-spin" />}
                {nextStatus === "DELIVERED" ? "Confirm delivery" : currentStep.action}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/driver/trips/${id}/route`)}
              >
                <Navigation className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isDelivered && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Delivered</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Route */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Navigation className="h-4 w-4" />
            Route
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">Pickup</p>
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
              <p className="font-medium">Destination</p>
              <p className="text-muted-foreground">{dest.line1}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {dest.contact}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cargo */}
      <Card>
        <CardContent className="space-y-2 pt-4 text-sm">
          {trip.cargo_type && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cargo</span>
              <span>{trip.cargo_type.name}</span>
            </div>
          )}
          {trip.weight && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span>{trip.weight} kg</span>
            </div>
          )}
          {trip.distance_km && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance</span>
              <span>{trip.distance_km} km</span>
            </div>
          )}
          {trip.special_instructions && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">{trip.special_instructions}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {events.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {events
                .slice()
                .reverse()
                .map((ev) => (
                  <div key={ev.id} className="flex items-start gap-2 text-xs">
                    <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <div>
                      <span className="font-medium">{ev.event.replace(/_/g, " ")}</span>
                      {ev.note && <span className="text-muted-foreground"> · {ev.note}</span>}
                      <span className="ml-1 text-muted-foreground">
                        {format(parseISO(ev.created_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mark failed */}
      {!isDelivered && (
        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/5 hover:text-destructive"
          onClick={() => setFailOpen(true)}
        >
          <AlertTriangle className="h-4 w-4" />
          Mark delivery as failed
        </Button>
      )}

      <Dialog open={failOpen} onOpenChange={setFailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as failed</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason</Label>
            <Textarea
              placeholder="Customer not available, access denied…"
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFailOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleFail()} disabled={isFailing}>
              {isFailing && <Loader2 className="animate-spin" />}
              Confirm failed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

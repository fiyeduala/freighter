import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Package, Phone, Truck, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { useDriverJobs } from "@/features/drivers/hooks/useDriverJobs";
import { supabase } from "@/lib/supabase";
import type { ShipmentRow, CargoTypeRow, VehicleTypeRow } from "@/types/supabase";
import type { Json } from "@/types/supabase";

function locDetail(loc: Json): { line1: string; contact: string; notes: string } {
  try {
    const l = loc as {
      address?: { line1?: string; city?: string; state?: string };
      contact?: { name?: string; phone?: string };
      notes?: string;
    };
    return {
      line1: [l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(", "),
      contact: [l.contact?.name, l.contact?.phone].filter(Boolean).join(" · "),
      notes: l.notes ?? "",
    };
  } catch {
    return { line1: "—", contact: "—", notes: "" };
  }
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { acceptJob, declineJob } = useDriverJobs();
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [isActing, setIsActing] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ["job_detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, cargo_type:cargo_types(id, name), vehicle_type:vehicle_types(id, name)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as unknown as ShipmentRow & {
        cargo_type: Pick<CargoTypeRow, "id" | "name"> | null;
        vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null;
      };
    },
  });

  const handleAccept = async () => {
    if (!id) return;
    setIsActing(true);
    try {
      await acceptJob(id);
      navigate(`/driver/trips/${id}`);
    } finally {
      setIsActing(false);
    }
  };

  const handleDecline = async () => {
    if (!id) return;
    setIsActing(true);
    try {
      await declineJob({ shipmentId: id, reason: declineReason });
      setDeclineOpen(false);
      navigate("/driver/jobs");
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!job) return <p className="text-muted-foreground">Job not found.</p>;

  const pickup = locDetail(job.pickup);
  const dest = locDetail(job.destination);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job Details"
        breadcrumbs={[{ label: "Jobs", href: "/driver/jobs" }, { label: "Detail" }]}
      />

      {/* Route */}
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="flex gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <div className="space-y-0.5 text-sm">
              <p className="font-medium">Pickup</p>
              <p className="text-muted-foreground">{pickup.line1}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {pickup.contact}
              </p>
              {pickup.notes && (
                <p className="text-xs italic text-muted-foreground">{pickup.notes}</p>
              )}
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
              {dest.notes && <p className="text-xs italic text-muted-foreground">{dest.notes}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cargo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            Cargo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {job.cargo_type && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{job.cargo_type.name}</span>
            </div>
          )}
          {job.weight && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight</span>
              <span>{job.weight} kg</span>
            </div>
          )}
          {job.distance_km && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance</span>
              <span>{job.distance_km} km</span>
            </div>
          )}
          {job.vehicle_type && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                <Truck className="mr-1 inline h-3 w-3" />
                Vehicle
              </span>
              <span>{job.vehicle_type.name}</span>
            </div>
          )}
          {job.special_instructions && (
            <>
              <Separator />
              <p className="text-xs text-muted-foreground">{job.special_instructions}</p>
            </>
          )}
          {job.scheduled_at && (
            <>
              <Separator />
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Scheduled pickup</span>
                <span>{new Date(job.scheduled_at).toLocaleString()}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payout */}
      {job.quote_amount && (
        <div className="flex items-center justify-between rounded-md border bg-muted/30 p-4">
          <span className="text-sm font-medium">Estimated payout</span>
          <span className="text-xl font-bold">₦{(job.quote_amount / 100).toLocaleString()}</span>
        </div>
      )}

      {/* Actions */}
      {job.status === "ASSIGNED" && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-destructive text-destructive hover:bg-destructive/5"
            onClick={() => setDeclineOpen(true)}
          >
            <XCircle className="h-4 w-4" />
            Decline
          </Button>
          <Button className="flex-1" onClick={() => void handleAccept()} disabled={isActing}>
            {isActing ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Accept job
          </Button>
        </div>
      )}

      {job.status !== "ASSIGNED" && (
        <p className="text-center text-sm text-muted-foreground">
          This job is no longer available (status: {job.status})
        </p>
      )}

      {/* Decline dialog */}
      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="E.g. Vehicle issue, out of area…"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDecline()} disabled={isActing}>
              {isActing && <Loader2 className="animate-spin" />}
              Confirm decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

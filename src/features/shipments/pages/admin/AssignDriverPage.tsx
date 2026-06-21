import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Truck, User, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useShipmentDetail } from "@/features/shipments/hooks/useShipmentDetail";
import { supabase } from "@/lib/supabase";
import type { DriverRow, ProfileRow, VehicleRow, VehicleTypeRow, Json } from "@/types/supabase";

type AvailableDriver = DriverRow & {
  profile: Pick<ProfileRow, "id" | "name" | "phone">;
  vehicle: (VehicleRow & { vehicle_type: Pick<VehicleTypeRow, "id" | "name"> | null }) | null;
};

function locCity(loc: Json): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

export function AssignDriverPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipment: s, isLoading: shipmentLoading, assign } = useShipmentDetail(id);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(s?.driver_id ?? null);
  const [isAssigning, setIsAssigning] = useState(false);

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["available_drivers"],
    queryFn: async (): Promise<AvailableDriver[]> => {
      const { data, error } = await supabase
        .from("drivers")
        .select(
          "*, profile:profiles(id, name, phone), vehicle:vehicles(*, vehicle_type:vehicle_types(id, name))",
        )
        .eq("verification_status", "approved")
        .eq("online", true);
      if (error) throw error;
      return data as unknown as AvailableDriver[];
    },
  });

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId);

  const handleAssign = async () => {
    if (!selectedDriverId) {
      toast.error("Select a driver first");
      return;
    }
    setIsAssigning(true);
    try {
      await assign({
        driverId: selectedDriverId,
        vehicleId: selectedDriver?.current_vehicle_id ?? null,
      });
      navigate(`/admin/shipments/${id}`);
    } finally {
      setIsAssigning(false);
    }
  };

  if (shipmentLoading || driversLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assign Driver"
        breadcrumbs={[
          { label: "Shipments", href: "/admin/shipments" },
          { label: s?.id.slice(0, 8) ?? "Detail", href: `/admin/shipments/${id}` },
          { label: "Assign" },
        ]}
      />

      {s && (
        <div className="rounded-md border bg-muted/30 p-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <ShipmentStatusBadge status={s.status} />
            <span className="text-muted-foreground">
              {locCity(s.pickup)} → {locCity(s.destination)}
            </span>
            {s.weight && <span className="text-muted-foreground">{s.weight} kg</span>}
            {s.vehicle_type && (
              <Badge variant="outline" className="text-xs">
                {s.vehicle_type.name}
              </Badge>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-3 text-sm font-medium">
          {drivers.length === 0
            ? "No approved online drivers available right now"
            : `${drivers.length} driver${drivers.length === 1 ? "" : "s"} available`}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {drivers.map((d) => {
            const isSelected = selectedDriverId === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDriverId(d.id)}
                className={`rounded-md border p-4 text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{d.profile.name}</p>
                      <p className="text-xs text-muted-foreground">{d.profile.phone}</p>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </div>

                <Separator className="my-3" />

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    {d.vehicle
                      ? `${d.vehicle.plate} · ${d.vehicle.vehicle_type?.name ?? "—"} · ${d.vehicle.capacity_kg} kg`
                      : "No vehicle assigned"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                    Online · Rating {d.rating.toFixed(1)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={() => void handleAssign()} disabled={!selectedDriverId || isAssigning}>
          {isAssigning && <Loader2 className="animate-spin" />}
          Assign {selectedDriver ? selectedDriver.profile.name : "driver"}
        </Button>
      </div>
    </div>
  );
}

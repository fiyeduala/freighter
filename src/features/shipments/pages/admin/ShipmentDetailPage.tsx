import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin, Package, User, Truck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useShipmentDetail } from "@/features/shipments/hooks/useShipmentDetail";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

const ADMIN_STATUSES: ShipmentStatus[] = [
  "REQUESTED",
  "REVIEWED",
  "ASSIGNED",
  "CANCELLED",
  "DECLINED",
];

function locAddr(loc: Json): { line1: string; contact: string } {
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

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

const EVENT_LABELS: Record<string, string> = {
  REQUESTED: "Order placed",
  REVIEWED: "Reviewed by admin",
  ASSIGNED: "Driver assigned",
  ACCEPTED: "Driver accepted",
  EN_ROUTE_TO_PICKUP: "Driver en route",
  ARRIVED_AT_PICKUP: "Driver at pickup",
  PICKED_UP: "Cargo picked up",
  IN_TRANSIT: "In transit",
  ARRIVED_AT_DESTINATION: "At destination",
  DELIVERED: "Delivered",
  VERIFIED: "Delivery verified",
  PAID: "Payment received",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  DECLINED: "Declined",
  FAILED: "Failed",
};

export function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shipment: s, isLoading, setStatus } = useShipmentDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-20" />
            <Skeleton className="h-40" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!s) return <p className="text-muted-foreground">Shipment not found.</p>;

  const pickup = locAddr(s.pickup);
  const dest = locAddr(s.destination);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Shipment ${s.id.slice(0, 8)}`}
        breadcrumbs={[{ label: "Shipments", href: "/admin/shipments" }, { label: "Detail" }]}
        actions={
          <div className="flex items-center gap-2">
            {(["REQUESTED", "REVIEWED"] as ShipmentStatus[]).includes(s.status) && (
              <Button size="sm" onClick={() => navigate(`/admin/shipments/${s.id}/assign`)}>
                <Truck className="h-4 w-4" />
                Assign driver
              </Button>
            )}
            <Select
              value={s.status}
              onValueChange={(v) => void setStatus({ status: v as ShipmentStatus })}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_STATUSES.map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {st.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <ShipmentStatusBadge status={s.status} />
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Created {format(parseISO(s.created_at), "dd MMM yyyy, HH:mm")}</span>
                  {s.scheduled_at && (
                    <span>Pickup {format(parseISO(s.scheduled_at), "dd MMM yyyy, HH:mm")}</span>
                  )}
                  {s.eta && <span>ETA {format(parseISO(s.eta), "dd MMM, HH:mm")}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Route</CardTitle>
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
              {s.distance_km && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{s.distance_km} km</p>
                </>
              )}
            </CardContent>
          </Card>

          {s.order && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Order #{s.order.invoice_no ?? s.order.id.slice(0, 8)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {s.order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>{fmt(item.qty * item.unit_price)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{fmt(s.order.total)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Payment</span>
                  <Badge
                    variant={
                      s.order.payment_status === "paid"
                        ? "success"
                        : s.order.payment_status === "failed"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {s.order.payment_status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {s.events.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {s.events.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">{EVENT_LABELS[ev.event] ?? ev.event}</p>
                        {ev.note && <p className="text-xs text-muted-foreground">{ev.note}</p>}
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(ev.created_at), "dd MMM yyyy, HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {s.customer ? (
                <>
                  <p className="font-medium">{s.customer.profile.name}</p>
                  <p className="text-muted-foreground">{s.customer.profile.phone}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-0 text-xs"
                    onClick={() => navigate(`/admin/customers/${s.customer_id}`)}
                  >
                    View profile →
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {s.driver ? (
                <>
                  <p className="font-medium">{s.driver.profile.name}</p>
                  <p className="text-muted-foreground">{s.driver.profile.phone}</p>
                  {s.vehicle && (
                    <p className="text-xs text-muted-foreground">Vehicle: {s.vehicle.plate}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-0 text-xs"
                    onClick={() => navigate(`/admin/drivers/${s.driver_id}`)}
                  >
                    View driver →
                  </Button>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">No driver assigned</p>
                  {(["REQUESTED", "REVIEWED"] as ShipmentStatus[]).includes(s.status) && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/admin/shipments/${s.id}/assign`)}
                    >
                      Assign driver
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {s.cargo_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span>{s.cargo_type.name}</span>
                </div>
              )}
              {s.vehicle_type && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span>{s.vehicle_type.name}</span>
                </div>
              )}
              {s.weight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span>{s.weight} kg</span>
                </div>
              )}
              {s.quote_amount && (
                <>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Quote</span>
                    <span>{fmt(s.quote_amount)}</span>
                  </div>
                </>
              )}
              {s.special_instructions && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{s.special_instructions}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

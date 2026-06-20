import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, Package, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { supabase } from "@/lib/supabase";
import { format, parseISO } from "date-fns";
import type { ShipmentRow, OrderRow, OrderItemRow, ShipmentEventRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

type DetailData = {
  shipment: ShipmentRow;
  order: OrderRow | null;
  items: OrderItemRow[];
  events: ShipmentEventRow[];
};

function locationCard(loc: unknown, title: string) {
  try {
    const l = loc as {
      address?: { line1?: string; city?: string; state?: string };
      contact?: { name?: string; phone?: string };
      notes?: string;
    };
    return (
      <div className="space-y-1 text-sm">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">
          {[l.address?.line1, l.address?.city, l.address?.state].filter(Boolean).join(", ")}
        </p>
        {l.contact?.name && (
          <p className="flex items-center gap-1 text-muted-foreground">
            <Phone className="h-3 w-3" />
            {l.contact.name} · {l.contact.phone}
          </p>
        )}
        {l.notes && <p className="text-xs italic text-muted-foreground">{l.notes}</p>}
      </div>
    );
  } catch {
    return null;
  }
}

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

const EVENT_LABELS: Partial<Record<string, string>> = {
  REQUESTED: "Order placed",
  REVIEWED: "Under review",
  ASSIGNED: "Driver assigned",
  ACCEPTED: "Driver accepted",
  EN_ROUTE_TO_PICKUP: "Driver en route to pickup",
  ARRIVED_AT_PICKUP: "Driver at pickup",
  PICKED_UP: "Cargo picked up",
  IN_TRANSIT: "In transit",
  ARRIVED_AT_DESTINATION: "Arrived at destination",
  DELIVERED: "Delivered",
  VERIFIED: "Delivery verified",
  PAID: "Payment received",
  CLOSED: "Shipment closed",
  CANCELLED: "Cancelled",
};

export function ShipmentHistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["my_shipment_detail", id],
    enabled: !!id,
    queryFn: async (): Promise<DetailData> => {
      const { data: shipment, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      const [orderResult, eventsResult] = await Promise.all([
        shipment.order_id
          ? supabase.from("orders").select("*").eq("id", shipment.order_id).single()
          : Promise.resolve({ data: null }),
        supabase
          .from("shipment_events")
          .select("*")
          .eq("shipment_id", id!)
          .order("created_at", { ascending: false }),
      ]);

      const items =
        orderResult.data?.id
          ? await supabase
              .from("order_items")
              .select("*")
              .eq("order_id", orderResult.data.id)
              .then((r) => r.data ?? [])
          : [];

      return {
        shipment: shipment as ShipmentRow,
        order: orderResult.data as OrderRow | null,
        items: items as OrderItemRow[],
        events: (eventsResult.data ?? []) as ShipmentEventRow[],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground">Shipment not found.</p>;

  const { shipment, order, items, events } = data;
  const isTerminal = (["DELIVERED", "VERIFIED", "PAID", "CLOSED"] as ShipmentStatus[]).includes(
    shipment.status as ShipmentStatus,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shipment detail"
        breadcrumbs={[{ label: "History", href: "/app/history" }, { label: "Detail" }]}
        actions={
          isTerminal ? (
            <Button variant="outline" size="sm" onClick={() => navigate("/app/shipments/new")}>
              <RefreshCw className="h-4 w-4" />
              Rebook
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {/* Status */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <ShipmentStatusBadge status={shipment.status as ShipmentStatus} />
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(shipment.created_at), "dd MMM yyyy, HH:mm")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                {locationCard(shipment.pickup, "Pickup")}
              </div>
              <Separator />
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                {locationCard(shipment.destination, "Destination")}
              </div>
              {shipment.distance_km && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">
                    Distance: {shipment.distance_km} km
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order line items */}
          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Cost breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>{fmt(item.qty * item.unit_price)}</span>
                  </div>
                ))}
                {order && (
                  <>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{fmt(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Payment</span>
                      <Badge
                        variant={
                          order.payment_status === "paid"
                            ? "success"
                            : order.payment_status === "failed"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {order.payment_status}
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Events timeline */}
          {events.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((ev) => (
                    <div key={ev.id} className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div>
                        <p className="text-sm font-medium">
                          {EVENT_LABELS[ev.event] ?? ev.event}
                        </p>
                        {ev.note && (
                          <p className="text-xs text-muted-foreground">{ev.note}</p>
                        )}
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

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {shipment.weight && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Weight</span>
                  <span>{shipment.weight} kg</span>
                </div>
              )}
              {shipment.distance_km && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance</span>
                  <span>{shipment.distance_km} km</span>
                </div>
              )}
              {shipment.special_instructions && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{shipment.special_instructions}</p>
                </>
              )}
              {shipment.quote_amount && (
                <>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Quote</span>
                    <span>₦{(shipment.quote_amount / 100).toLocaleString()}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {order && (
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs">{order.id.slice(0, 8)}</span>
                </div>
                {order.invoice_no && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-mono">{order.invoice_no}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {shipment.eta && (
            <Card>
              <CardContent className="pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETA</span>
                  <span>{format(parseISO(shipment.eta), "dd MMM, HH:mm")}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Button variant="outline" size="sm" className="w-full" asChild>
            <Link to="/app/history">← Back to history</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

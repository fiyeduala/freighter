import { useParams, useNavigate, Link } from "react-router-dom";
import { ExternalLink, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { format, parseISO } from "date-fns";
import type { ShipmentStatus } from "@/types";

const PAYMENT_VARIANT = {
  pending: "warning" as const,
  paid: "success" as const,
  failed: "destructive" as const,
  refunded: "secondary" as const,
};

function fmt(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading } = useOrder(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found.</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.invoice_no ? `Invoice ${order.invoice_no}` : `Order ${order.id.slice(0, 8)}`}
        breadcrumbs={[
          { label: "Orders", href: "/admin/orders" },
          { label: order.invoice_no ?? order.id.slice(0, 8) },
        ]}
        actions={
          <div className="flex gap-2">
            {order.shipment && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/shipments/${order.shipment!.id}`)}
              >
                <Package className="h-4 w-4" />
                View shipment
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/orders/${id}/invoice`)}
            >
              <ExternalLink className="h-4 w-4" />
              Invoice
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Order items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                        No line items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-sm">{item.label}</TableCell>
                        <TableCell className="text-right text-sm">{item.qty}</TableCell>
                        <TableCell className="text-right text-sm">{fmt(item.unit_price)}</TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          {fmt(item.qty * item.unit_price)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Linked shipment */}
          {order.shipment && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Linked Shipment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <ShipmentStatusBadge status={order.shipment.status as ShipmentStatus} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipment ID</span>
                  <Link
                    to={`/admin/shipments/${order.shipment.id}`}
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {order.shipment.id.slice(0, 12)}…
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Totals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(order.subtotal)}</span>
              </div>
              {order.surcharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Surcharges</span>
                  <span>{fmt(order.surcharges)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{fmt(order.tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{fmt(order.total)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant={PAYMENT_VARIANT[order.payment_status]}>
                  {order.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          {order.customer && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{order.customer.profile.name}</p>
                <p className="text-muted-foreground">{order.customer.profile.phone ?? "—"}</p>
                <Link
                  to={`/admin/customers/${order.customer.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  View profile
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Meta */}
          <Card>
            <CardContent className="space-y-2 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{format(parseISO(order.created_at), "dd MMM yyyy HH:mm")}</span>
              </div>
              {order.invoice_no && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice #</span>
                    <span className="font-mono">{order.invoice_no}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { useParams, useNavigate, Link } from "react-router-dom";
import { UserCheck, UserX, MapPin, Package, CreditCard, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { useCustomer } from "@/features/customers/hooks/useCustomer";
import { format, parseISO } from "date-fns";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function addressLabel(pickup: Json): string {
  try {
    const p = pickup as { address?: { city?: string; state?: string } };
    return [p.address?.city, p.address?.state].filter(Boolean).join(", ") || "—";
  } catch {
    return "—";
  }
}

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { customer, isLoading, setStatus } = useCustomer(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!customer) {
    return <p className="text-muted-foreground">Customer not found.</p>;
  }

  const { profile } = customer;

  return (
    <div className="space-y-6">
      <PageHeader
        title={profile.name}
        breadcrumbs={[{ label: "Customers", href: "/admin/customers" }, { label: profile.name }]}
        actions={
          <div className="flex items-center gap-2">
            {profile.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatus({ status: "suspended" })}
              >
                <UserX className="h-4 w-4" />
                Suspend
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setStatus({ status: "active" })}>
                <UserCheck className="h-4 w-4" />
                Activate
              </Button>
            )}
            <Button size="sm" onClick={() => navigate(`/admin/customers/${id}/edit`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Profile card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{profile.name}</h2>
                <Badge
                  variant={
                    profile.status === "active"
                      ? "success"
                      : profile.status === "suspended"
                        ? "destructive"
                        : "warning"
                  }
                >
                  {profile.status}
                </Badge>
              </div>
              {customer.company && (
                <p className="text-sm text-muted-foreground">{customer.company}</p>
              )}
              <p className="text-sm text-muted-foreground">{profile.phone ?? "No phone"}</p>
              <p className="text-xs text-muted-foreground">
                Customer since {format(parseISO(customer.created_at), "MMMM yyyy")}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-2xl font-bold">{customer.recent_shipments.length}</p>
                <p className="text-xs text-muted-foreground">Recent shipments</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{customer.addresses.length}</p>
                <p className="text-xs text-muted-foreground">Addresses</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ₦
                  {(customer.recent_orders.reduce((s, o) => s + o.total, 0) / 100).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Recent spend</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Recent shipments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                Recent Shipments
              </CardTitle>
              <Link
                to={`/admin/shipments?customer=${id}`}
                className="text-xs text-primary hover:underline"
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {customer.recent_shipments.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No shipments yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.recent_shipments.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/shipments/${s.id}`)}
                      >
                        <TableCell className="text-sm">{addressLabel(s.pickup)}</TableCell>
                        <TableCell className="text-sm">{addressLabel(s.destination)}</TableCell>
                        <TableCell>
                          <ShipmentStatusBadge status={s.status as ShipmentStatus} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(parseISO(s.created_at), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Recent orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customer.recent_orders.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No orders yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.recent_orders.map((o) => (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm font-medium">
                          ₦{(o.total / 100).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              o.payment_status === "paid"
                                ? "success"
                                : o.payment_status === "failed"
                                  ? "destructive"
                                  : "warning"
                            }
                          >
                            {o.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(parseISO(o.created_at), "dd MMM yyyy")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Saved Addresses ({customer.addresses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {customer.addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses.</p>
              ) : (
                customer.addresses.map((addr) => (
                  <div key={addr.id} className="rounded-md border p-2.5 text-xs">
                    <p className="font-medium">{addr.label}</p>
                    <p className="mt-0.5 text-muted-foreground">{addr.address}</p>
                    {addr.city && (
                      <p className="text-muted-foreground">
                        {addr.city}
                        {addr.state ? `, ${addr.state}` : ""}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>Customer</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Profile ID</span>
                <span className="font-mono text-xs">{profile.id.slice(0, 8)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Onboarding</span>
                <Badge variant={profile.onboarding_complete ? "success" : "warning"}>
                  {profile.onboarding_complete ? "Complete" : "Pending"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

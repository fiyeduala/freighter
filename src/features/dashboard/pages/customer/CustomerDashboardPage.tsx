import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Package, Clock, CheckCircle2, Truck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { format, parseISO } from "date-fns";
import type { ShipmentRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

const ACTIVE_STATUSES: ShipmentStatus[] = [
  "REQUESTED",
  "REVIEWED",
  "ASSIGNED",
  "ACCEPTED",
  "EN_ROUTE_TO_PICKUP",
  "ARRIVED_AT_PICKUP",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_AT_DESTINATION",
];

function cityFrom(loc: unknown): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

export function CustomerDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["my_shipments_dashboard", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user!.id)
        .single();
      if (!customer) return [];

      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ShipmentRow[];
    },
  });

  const activeShipments = useMemo(
    () => shipments.filter((s) => ACTIVE_STATUSES.includes(s.status as ShipmentStatus)),
    [shipments],
  );

  const stats = useMemo(
    () => ({
      total: shipments.length,
      active: activeShipments.length,
      delivered: shipments.filter((s) =>
        (["DELIVERED", "VERIFIED", "PAID", "CLOSED"] as ShipmentStatus[]).includes(
          s.status as ShipmentStatus,
        ),
      ).length,
      pending: shipments.filter((s) =>
        (["REQUESTED", "REVIEWED"] as ShipmentStatus[]).includes(s.status as ShipmentStatus),
      ).length,
    }),
    [shipments, activeShipments],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back${user ? `, ${user.name.split(" ")[0]}` : ""}!`}
        description="Track your shipments and manage your logistics."
        actions={
          <Button asChild>
            <Link to="/app/shipments/new">
              <Plus className="h-4 w-4" />
              New Shipment
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total shipments", value: stats.total, icon: Package, color: "text-blue-500" },
          { label: "Active", value: stats.active, icon: Truck, color: "text-amber-500" },
          { label: "Pending review", value: stats.pending, icon: Clock, color: "text-orange-500" },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle2,
            color: "text-green-500",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{s.value}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color} opacity-80`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active shipments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Active Shipments</CardTitle>
          {activeShipments.length > 0 && (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/history">View all</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : activeShipments.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No active shipments"
              description="Book a shipment and it will appear here."
              action={{
                label: "New Shipment",
                onClick: () => navigate("/app/shipments/new"),
              }}
            />
          ) : (
            <div className="space-y-2">
              {activeShipments.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                  onClick={() => navigate(`/app/history/${s.id}`)}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {cityFrom(s.pickup)} → {cityFrom(s.destination)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(s.created_at), "dd MMM yyyy")}
                      {s.quote_amount && ` · ₦${(s.quote_amount / 100).toLocaleString()}`}
                    </p>
                  </div>
                  <ShipmentStatusBadge status={s.status as ShipmentStatus} />
                </div>
              ))}
              {activeShipments.length > 5 && (
                <Button variant="ghost" size="sm" className="w-full" asChild>
                  <Link to="/app/history">View {activeShipments.length - 5} more</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent history */}
      {!isLoading && shipments.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent History</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {shipments.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                  onClick={() => navigate(`/app/history/${s.id}`)}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {cityFrom(s.pickup)} → {cityFrom(s.destination)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(s.created_at), "dd MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.quote_amount && (
                      <span className="text-xs font-medium">
                        ₦{(s.quote_amount / 100).toLocaleString()}
                      </span>
                    )}
                    <ShipmentStatusBadge status={s.status as ShipmentStatus} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

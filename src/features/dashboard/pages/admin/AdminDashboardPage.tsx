import { AlertTriangle, Package, Truck, TrendingUp, Users, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function AdminDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good day${user ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's what's happening across your logistics network."
        actions={
          <Button asChild>
            <Link to="/admin/shipments/new">New Shipment</Link>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Active Shipments"
          value="—"
          icon={Package}
          accent="default"
          loading={false}
        />
        <StatCard title="In Transit" value="—" icon={Truck} accent="default" loading={false} />
        <StatCard
          title="Delivered Today"
          value="—"
          icon={CheckCircle2}
          accent="success"
          loading={false}
        />
        <StatCard
          title="Revenue (MTD)"
          value="—"
          icon={TrendingUp}
          accent="success"
          loading={false}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mini fleet map placeholder */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Live Fleet
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/tracking">View all</Link>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 items-center justify-center rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground">
              Map preview — set VITE_MAPBOX_TOKEN to enable
            </div>
          </CardContent>
        </Card>

        {/* Needs attention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Unassigned shipments</span>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to="/admin/shipments">View</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Pending driver verifications</span>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to="/admin/drivers">View</Link>
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <span className="text-muted-foreground">Maintenance due</span>
                <Button variant="link" size="sm" className="h-auto p-0" asChild>
                  <Link to="/admin/fleet/maintenance">View</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent shipments table placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            Recent Shipments
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/shipments">View all</Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            Connect Supabase to see live shipment data
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

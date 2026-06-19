import { Plus, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuthStore } from "@/stores/authStore";

export function CustomerDashboardPage() {
  const { user } = useAuthStore();

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

      {/* Active shipments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Package}
            title="No active shipments"
            description="Book your first shipment to get started."
            action={{
              label: "New Shipment",
              onClick: () => {
                window.location.href = "/app/shipments/new";
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

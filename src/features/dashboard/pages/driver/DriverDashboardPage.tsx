import { Briefcase, Navigation, DollarSign, WifiOff } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";

export function DriverDashboardPage() {
  const { user } = useAuthStore();
  const { driverOnline } = useUiStore();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? "Driver"}`}
        description={driverOnline ? "You're online and available for jobs." : "You're offline."}
      />

      {!driverOnline && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400">
          <WifiOff className="h-5 w-5 shrink-0" />
          <p className="text-sm">You&apos;re offline. Toggle online in the top bar to receive new jobs.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Briefcase className="h-4 w-4" />
              Assigned Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Briefcase}
              title="No assigned jobs"
              description="New jobs will appear here when dispatched."
            />
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/driver/jobs">View Jobs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Navigation className="h-4 w-4" />
              Active Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Navigation}
              title="No active trip"
              description="Accept a job to start a trip."
            />
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link to="/driver/trips">View Trips</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            Today&apos;s Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">—</p>
          <Button variant="link" size="sm" className="p-0 text-xs" asChild>
            <Link to="/driver/earnings">View full earnings</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

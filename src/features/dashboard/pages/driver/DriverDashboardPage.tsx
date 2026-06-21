import { useNavigate, Link } from "react-router-dom";
import { Briefcase, Navigation, DollarSign, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useAuthStore } from "@/stores/authStore";
import { useDriverJobs } from "@/features/drivers/hooks/useDriverJobs";
import { useDriverTrip } from "@/features/drivers/hooks/useDriverTrip";
import { useOfflineQueue } from "@/features/shipments/hooks/useOfflineQueue";
import { format, parseISO } from "date-fns";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

function locCity(loc: Json): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

export function DriverDashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { driver, jobs, isLoading: jobsLoading, toggleOnline } = useDriverJobs();
  const { activeTrips, isLoading: tripsLoading } = useDriverTrip();
  const { queue, isOffline } = useOfflineQueue();

  const isOnline = driver?.online ?? false;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.name.split(" ")[0] ?? "Driver"}`}
        description={isOnline ? "You're online and available for jobs." : "You're offline."}
        actions={
          <div className="flex items-center gap-2">
            <Label htmlFor="online-toggle" className="text-sm">
              {isOnline ? "Online" : "Offline"}
            </Label>
            <Switch
              id="online-toggle"
              checked={isOnline}
              onCheckedChange={(v) => void toggleOnline(v)}
              className={isOnline ? "data-[state=checked]:bg-green-500" : ""}
            />
          </div>
        }
      />

      {isOffline && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800/30 dark:bg-amber-900/20 dark:text-amber-400">
          <WifiOff className="h-5 w-5 shrink-0" />
          <p className="text-sm">
            No internet. Status updates will sync when you're back online.
            {queue.length > 0 && ` (${queue.length} update${queue.length === 1 ? "" : "s"} queued)`}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending jobs", value: jobs.length, color: "text-blue-500" },
          { label: "Active trips", value: activeTrips.length, color: "text-green-500" },
          { label: "Queued updates", value: queue.length, color: "text-amber-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            Pending Jobs
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/driver/jobs">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No pending jobs"
              description={
                isOnline
                  ? "New jobs will appear here when dispatched."
                  : "Go online to receive jobs."
              }
            />
          ) : (
            <div className="space-y-2">
              {jobs.slice(0, 3).map((j) => (
                <div
                  key={j.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                  onClick={() => navigate(`/driver/jobs/${j.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {locCity(j.pickup)} → {locCity(j.destination)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {j.weight && `${j.weight} kg`}
                      {j.distance_km && ` · ${j.distance_km} km`}
                    </p>
                  </div>
                  <ShipmentStatusBadge status={j.status as ShipmentStatus} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Navigation className="h-4 w-4" />
            Active Trips
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/driver/trips">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {tripsLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : activeTrips.length === 0 ? (
            <EmptyState
              icon={Navigation}
              title="No active trips"
              description="Accept a job to start a trip."
            />
          ) : (
            <div className="space-y-2">
              {activeTrips.map((t) => (
                <div
                  key={t.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border p-3 hover:bg-muted/50"
                  onClick={() => navigate(`/driver/trips/${t.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {locCity(t.pickup)} → {locCity(t.destination)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(t.updated_at), "dd MMM, HH:mm")}
                    </p>
                  </div>
                  <ShipmentStatusBadge status={t.status as ShipmentStatus} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-4 w-4" />
            Today's Earnings
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

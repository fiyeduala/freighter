import { useNavigate } from "react-router-dom";
import { Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useDriverJobs } from "@/features/drivers/hooks/useDriverJobs";
import { format, parseISO } from "date-fns";
import type { Json } from "@/types/supabase";

function locCity(loc: Json): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

export function JobsListPage() {
  const navigate = useNavigate();
  const { driver, jobs, isLoading } = useDriverJobs();

  return (
    <div>
      <PageHeader
        title="Pending Jobs"
        description={
          driver?.online
            ? `${jobs.length} job${jobs.length === 1 ? "" : "s"} waiting`
            : "You're offline — go online to receive jobs"
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No pending jobs"
          description={
            driver?.online
              ? "You'll be notified when a new job is dispatched."
              : "Toggle online from the dashboard to receive jobs."
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="cursor-pointer rounded-md border p-4 transition-colors hover:bg-muted/50"
              onClick={() => navigate(`/driver/jobs/${j.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">
                    {locCity(j.pickup)} → {locCity(j.destination)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {j.cargo_type?.name ?? "Cargo"}
                    {j.weight && ` · ${j.weight} kg`}
                    {j.distance_km && ` · ${j.distance_km} km`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(j.created_at), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {j.quote_amount && (
                    <p className="text-sm font-semibold">
                      ₦{(j.quote_amount / 100).toLocaleString()}
                    </p>
                  )}
                  <Badge variant="warning" className="text-xs">
                    Assigned
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { Plus, AlertTriangle } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { useMaintenance } from "@/features/fleet/hooks/useMaintenance";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  completed: "default",
  in_progress: "outline",
  scheduled: "secondary",
};

export function MaintenanceLogsPage() {
  const navigate = useNavigate();
  const { logs, isLoading, markComplete } = useMaintenance();

  const overdue = logs.filter(
    (l) => l.next_due && isBefore(parseISO(l.next_due), new Date()) && l.status !== "completed",
  );
  const active = logs.filter((l) => l.status !== "completed");
  const completed = logs.filter((l) => l.status === "completed");

  const renderTable = (items: typeof logs, showComplete: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vehicle</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Cost</TableHead>
          <TableHead>Next due</TableHead>
          <TableHead>Status</TableHead>
          {showComplete && <TableHead />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: showComplete ? 7 : 6 }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={showComplete ? 7 : 6}
              className="py-8 text-center text-muted-foreground"
            >
              No records found.
            </TableCell>
          </TableRow>
        ) : (
          items.map((log) => {
            const isOverdue =
              log.next_due &&
              isBefore(parseISO(log.next_due), new Date()) &&
              log.status !== "completed";
            return (
              <TableRow
                key={log.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/admin/fleet/${log.vehicle_id}`)}
              >
                <TableCell className="font-medium">
                  {log.vehicle?.plate ?? log.vehicle_id.slice(0, 8)}
                </TableCell>
                <TableCell>{log.type}</TableCell>
                <TableCell className="text-sm">
                  {format(parseISO(log.date), "dd MMM yyyy")}
                </TableCell>
                <TableCell className="text-sm">₦{(log.cost / 100).toLocaleString()}</TableCell>
                <TableCell className="text-sm">
                  {log.next_due ? (
                    <span className={isOverdue ? "font-medium text-destructive" : ""}>
                      {isOverdue && "⚠ "}
                      {format(parseISO(log.next_due), "dd MMM yyyy")}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[log.status] ?? "secondary"}>
                    {log.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                {showComplete && (
                  <TableCell>
                    {log.status !== "completed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          markComplete(log.id);
                        }}
                      >
                        Mark complete
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <PageHeader
        title="Maintenance logs"
        breadcrumbs={[{ label: "Fleet", href: "/admin/fleet" }, { label: "Maintenance" }]}
        actions={
          <Button onClick={() => navigate("/admin/fleet/maintenance/new")}>
            <Plus className="h-4 w-4" />
            Add log
          </Button>
        }
      />

      {overdue.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {overdue.length} maintenance task{overdue.length > 1 ? "s" : ""} past their due date.
          Click a row to view the vehicle.
        </div>
      )}

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
          <TabsTrigger value="all">All ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {!isLoading && active.length === 0 ? (
            <EmptyState
              title="No active maintenance"
              description="All maintenance tasks are complete."
            />
          ) : (
            renderTable(active, true)
          )}
        </TabsContent>
        <TabsContent value="overdue">{renderTable(overdue, true)}</TabsContent>
        <TabsContent value="completed">{renderTable(completed, false)}</TabsContent>
        <TabsContent value="all">{renderTable(logs, true)}</TabsContent>
      </Tabs>
    </div>
  );
}

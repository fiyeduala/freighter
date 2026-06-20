import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Pencil,
  Wrench,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  User,
} from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useVehicle } from "@/features/fleet/hooks/useVehicle";
import { useDrivers } from "@/features/drivers/hooks/useDrivers";
import { checkVehicleCompatibility } from "@/lib/compatibility";
import type { VehicleRow } from "@/types/supabase";

const STATUS_VARIANT: Record<
  VehicleRow["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  available: "default",
  in_use: "outline",
  maintenance: "destructive",
  retired: "secondary",
};

const LOG_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  completed: "default",
  in_progress: "outline",
  scheduled: "secondary",
};

function AssignDriverDialog({
  open,
  onClose,
  vehicleId,
  currentDriverId,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  currentDriverId: string | undefined;
}) {
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const { drivers, isLoading } = useDrivers();
  const { assignDriver, isAssigning } = useVehicle(vehicleId);

  const eligibleDrivers = drivers.filter(
    (d) => d.verification_status === "approved" && d.profile.status === "active",
  );

  const handleAssign = () => {
    if (!selectedDriverId) return;
    assignDriver(
      { driverId: selectedDriverId, previousDriverId: currentDriverId },
      { onSuccess: onClose },
    );
  };

  const handleUnassign = () => {
    if (!currentDriverId) return;
    assignDriver({ driverId: null, previousDriverId: currentDriverId }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign driver</DialogTitle>
          <DialogDescription>
            Select an approved driver to assign as the primary driver for this vehicle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Select value={selectedDriverId} onValueChange={setSelectedDriverId} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? "Loading drivers…" : "Select driver…"} />
            </SelectTrigger>
            <SelectContent>
              {eligibleDrivers.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.profile.name}
                  {d.current_vehicle_id && d.current_vehicle_id !== vehicleId
                    ? " (has another vehicle)"
                    : ""}
                </SelectItem>
              ))}
              {eligibleDrivers.length === 0 && (
                <SelectItem value="__none" disabled>
                  No eligible drivers available
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button onClick={handleAssign} disabled={!selectedDriverId || isAssigning}>
              {isAssigning && <Loader2 className="animate-spin" />}
              Assign driver
            </Button>
            {currentDriverId && (
              <Button variant="outline" onClick={handleUnassign} disabled={isAssigning}>
                Remove current driver
              </Button>
            )}
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignOpen, setAssignOpen] = useState(false);

  const { vehicle, assignedDriver, maintenanceLogs, isLoading, logsLoading, setStatus } =
    useVehicle(id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vehicle) return <p className="text-muted-foreground">Vehicle not found.</p>;

  const compatibility = checkVehicleCompatibility(vehicle);
  const overduelogs = maintenanceLogs.filter(
    (l) => l.next_due && isBefore(parseISO(l.next_due), new Date()) && l.status !== "completed",
  );

  return (
    <div>
      <PageHeader
        title={vehicle.plate}
        breadcrumbs={[{ label: "Fleet", href: "/admin/fleet" }, { label: vehicle.plate }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/fleet/maintenance/new?vehicleId=${id}`)}
            >
              <Wrench className="h-4 w-4" />
              Log maintenance
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/fleet/${id}/edit`)}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {/* Status alerts */}
      {overduelogs.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {overduelogs.length} maintenance task{overduelogs.length > 1 ? "s" : ""} overdue
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Specs */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Specifications</CardTitle>
                <Badge variant={STATUS_VARIANT[vehicle.status]}>
                  {vehicle.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium">{vehicle.vehicle_type?.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Year</dt>
                  <dd className="font-medium">{vehicle.year ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Capacity (weight)</dt>
                  <dd className="font-medium">{vehicle.capacity_kg.toLocaleString()} kg</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Capacity (volume)</dt>
                  <dd className="font-medium">
                    {vehicle.capacity_m3 ? `${vehicle.capacity_m3} m³` : "—"}
                  </dd>
                </div>
              </dl>
              <Separator className="my-4" />
              <div className="flex flex-wrap gap-2">
                {vehicle.status !== "maintenance" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus("maintenance")}>
                    Send to maintenance
                  </Button>
                )}
                {vehicle.status === "maintenance" && (
                  <Button size="sm" variant="outline" onClick={() => setStatus("available")}>
                    <CheckCircle2 className="h-4 w-4" />
                    Mark available
                  </Button>
                )}
                {vehicle.status !== "retired" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={() => setStatus("retired")}
                  >
                    Retire vehicle
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance log */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Maintenance history</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/fleet/maintenance/new?vehicleId=${id}`)}
                >
                  <Wrench className="h-4 w-4" />
                  Add log
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : maintenanceLogs.length === 0 ? (
                <EmptyState title="No maintenance logs" description="Add the first log entry." />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Next due</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceLogs.map((log) => {
                      const overdue =
                        log.next_due &&
                        isBefore(parseISO(log.next_due), new Date()) &&
                        log.status !== "completed";
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">{log.type}</TableCell>
                          <TableCell className="text-sm">
                            {format(parseISO(log.date), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="text-sm">
                            ₦{(log.cost / 100).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.next_due ? (
                              <span className={overdue ? "font-medium text-destructive" : ""}>
                                {overdue && "⚠ "}
                                {format(parseISO(log.next_due), "dd MMM yyyy")}
                              </span>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={LOG_STATUS_VARIANT[log.status] ?? "secondary"}>
                              {log.status.replace("_", " ")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Assigned driver</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setAssignOpen(true)}>
                  <UserCheck className="h-4 w-4" />
                  {assignedDriver ? "Change" : "Assign"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {assignedDriver ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <Link
                      to={`/admin/drivers/${assignedDriver.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {assignedDriver.profile.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {assignedDriver.profile.phone ?? "No phone"}
                    </p>
                    <Badge
                      variant={assignedDriver.online ? "default" : "secondary"}
                      className="mt-1 text-xs"
                    >
                      {assignedDriver.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">No driver assigned</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => setAssignOpen(true)}
                  >
                    Assign driver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compatibility</CardTitle>
              <CardDescription>Is this vehicle assignment-ready?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {compatibility.ok ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready for assignment
                </div>
              ) : (
                <div className="space-y-1">
                  {compatibility.reasons.map((r) => (
                    <div key={r} className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AssignDriverDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        vehicleId={id!}
        currentDriverId={assignedDriver?.id}
      />
    </div>
  );
}

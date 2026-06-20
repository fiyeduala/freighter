import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useVehicles, type VehicleWithType } from "@/features/fleet/hooks/useVehicles";
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

function VehicleRowItem({
  vehicle,
  onStatusChange,
}: {
  vehicle: VehicleWithType;
  onStatusChange: (id: string, status: VehicleRow["status"]) => void;
}) {
  const navigate = useNavigate();
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/admin/fleet/${vehicle.id}`)}
    >
      <TableCell className="font-medium">{vehicle.plate}</TableCell>
      <TableCell>{vehicle.vehicle_type?.name ?? "—"}</TableCell>
      <TableCell className="text-sm">{vehicle.capacity_kg.toLocaleString()} kg</TableCell>
      <TableCell>
        <Badge variant={STATUS_VARIANT[vehicle.status]}>{vehicle.status.replace("_", " ")}</Badge>
      </TableCell>
      <TableCell className="text-sm">
        {vehicle.assigned_driver?.profile?.name ?? (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{vehicle.year ?? "—"}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => navigate(`/admin/fleet/${vehicle.id}/edit`)}
          >
            Edit
          </Button>
          {vehicle.status !== "retired" && (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() =>
                onStatusChange(
                  vehicle.id,
                  vehicle.status === "available" ? "maintenance" : "available",
                )
              }
            >
              {vehicle.status === "maintenance" ? "Mark available" : "Send to maintenance"}
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function VehiclesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { vehicles, isLoading, setStatus } = useVehicles();

  const filtered = vehicles.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.plate.toLowerCase().includes(q) ||
      (v.vehicle_type?.name ?? "").toLowerCase().includes(q) ||
      (v.assigned_driver?.profile?.name ?? "").toLowerCase().includes(q)
    );
  });

  const byStatus = (status: string) => {
    if (status === "all") return filtered;
    return filtered.filter((v) => v.status === status);
  };

  return (
    <div>
      <PageHeader
        title="Fleet"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/fleet/maintenance")}>
              <Wrench className="h-4 w-4" />
              Maintenance logs
            </Button>
            <Button onClick={() => navigate("/admin/fleet/new")}>
              <Plus className="h-4 w-4" />
              Add vehicle
            </Button>
          </div>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search plate, type, driver…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="available">Available ({byStatus("available").length})</TabsTrigger>
          <TabsTrigger value="in_use">In use ({byStatus("in_use").length})</TabsTrigger>
          <TabsTrigger value="maintenance">
            Maintenance ({byStatus("maintenance").length})
          </TabsTrigger>
          <TabsTrigger value="retired">Retired ({byStatus("retired").length})</TabsTrigger>
        </TabsList>

        {(["all", "available", "in_use", "maintenance", "retired"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned driver</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton className="h-5 w-full" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </>
                ) : byStatus(tab).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                      No vehicles here.
                    </TableCell>
                  </TableRow>
                ) : (
                  byStatus(tab).map((v) => (
                    <VehicleRowItem
                      key={v.id}
                      vehicle={v}
                      onStatusChange={(id, status) => setStatus({ id, status })}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            {!isLoading && byStatus("all").length === 0 && tab === "all" && (
              <EmptyState
                title="No vehicles yet"
                description="Add your first vehicle to start managing your fleet."
                action={{ label: "Add vehicle", onClick: () => navigate("/admin/fleet/new") }}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

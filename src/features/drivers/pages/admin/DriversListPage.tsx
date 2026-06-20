import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useDrivers, type DriverWithProfile } from "@/features/drivers/hooks/useDrivers";
import { getInitials } from "@/lib/utils";

const VERIFICATION_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  approved: "default",
  pending: "secondary",
  under_review: "outline",
  rejected: "destructive",
};

function DriverRow({
  driver,
  onSuspend,
}: {
  driver: DriverWithProfile;
  onSuspend: (d: DriverWithProfile) => void;
}) {
  const navigate = useNavigate();
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/admin/drivers/${driver.id}`)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(driver.profile.name)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                driver.online ? "bg-green-500" : "bg-muted-foreground"
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium">{driver.profile.name}</p>
            <p className="text-xs text-muted-foreground">{driver.profile.phone ?? "—"}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={VERIFICATION_VARIANT[driver.verification_status] ?? "secondary"}>
          {driver.verification_status.replace("_", " ")}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={driver.profile.status === "active" ? "default" : "secondary"}>
          {driver.profile.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {driver.vehicle ? (
          <div className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
            {driver.vehicle.plate}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-sm">
        {"★".repeat(Math.round(driver.rating))}
        {"☆".repeat(5 - Math.round(driver.rating))} {driver.rating.toFixed(1)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate(`/admin/drivers/${driver.id}/verify`)}
          >
            Verify
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => onSuspend(driver)}>
            {driver.profile.status === "active" ? "Suspend" : "Activate"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function DriverTableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-5 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function DriversListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { drivers, isLoading, setProfileStatus } = useDrivers();

  const filtered = drivers.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.profile.name.toLowerCase().includes(q) ||
      (d.profile.phone ?? "").toLowerCase().includes(q) ||
      (d.vehicle?.plate ?? "").toLowerCase().includes(q)
    );
  });

  const byTab = (tab: string) => {
    if (tab === "pending") return filtered.filter((d) => d.verification_status === "pending");
    if (tab === "online") return filtered.filter((d) => d.online);
    if (tab === "suspended") return filtered.filter((d) => d.profile.status === "suspended");
    return filtered;
  };

  const handleSuspend = (driver: DriverWithProfile) => {
    const newStatus = driver.profile.status === "active" ? "suspended" : "active";
    setProfileStatus({ profileId: driver.profile.id, driverId: driver.id, status: newStatus });
  };

  return (
    <div>
      <PageHeader
        title="Drivers"
        actions={
          <Button onClick={() => navigate("/admin/drivers/new")}>
            <UserPlus className="h-4 w-4" />
            Invite driver
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, plate…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending verification ({byTab("pending").length})
          </TabsTrigger>
          <TabsTrigger value="online">Online ({byTab("online").length})</TabsTrigger>
          <TabsTrigger value="suspended">Suspended ({byTab("suspended").length})</TabsTrigger>
        </TabsList>

        {["all", "pending", "online", "suspended"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <DriverTableSkeleton />
                ) : byTab(tab).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      {tab === "all" && search
                        ? "No drivers match your search."
                        : "No drivers here."}
                    </TableCell>
                  </TableRow>
                ) : (
                  byTab(tab).map((d) => (
                    <DriverRow key={d.id} driver={d} onSuspend={handleSuspend} />
                  ))
                )}
              </TableBody>
            </Table>
            {!isLoading && byTab(tab).length === 0 && tab === "all" && !search && (
              <EmptyState
                title="No drivers yet"
                description="Invite a driver to get started."
                action={{ label: "Invite driver", onClick: () => navigate("/admin/drivers/new") }}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

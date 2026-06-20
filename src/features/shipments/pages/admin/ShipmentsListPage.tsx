import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useShipments, type ShipmentWithDetail } from "@/features/shipments/hooks/useShipments";
import { format, parseISO } from "date-fns";
import type { ShipmentStatus } from "@/types";
import type { Json } from "@/types/supabase";

function cityLabel(loc: Json): string {
  try {
    const l = loc as { address?: { city?: string; state?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

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

const TABS = [
  { value: "all", label: "All" },
  { value: "REQUESTED", label: "Requested" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "IN_TRANSIT", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export function ShipmentsListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { shipments, isLoading } = useShipments(
    tab === "all" ? undefined : { status: tab as ShipmentStatus },
  );

  const filtered = shipments.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.id.toLowerCase().includes(q) ||
      (s.customer?.profile.name ?? "").toLowerCase().includes(q) ||
      (s.vehicle_type?.name ?? "").toLowerCase().includes(q)
    );
  });

  const activeCount = shipments.filter((s) =>
    ACTIVE_STATUSES.includes(s.status as ShipmentStatus),
  ).length;

  const renderRow = (s: ShipmentWithDetail) => (
    <TableRow
      key={s.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/admin/shipments/${s.id}`)}
    >
      <TableCell className="font-mono text-xs">{s.id.slice(0, 8)}</TableCell>
      <TableCell className="text-sm">{s.customer?.profile.name ?? "—"}</TableCell>
      <TableCell className="text-sm">{cityLabel(s.pickup)}</TableCell>
      <TableCell className="text-sm">{cityLabel(s.destination)}</TableCell>
      <TableCell className="text-sm">{s.vehicle_type?.name ?? "—"}</TableCell>
      <TableCell>
        <ShipmentStatusBadge status={s.status as ShipmentStatus} />
      </TableCell>
      {s.quote_amount && (
        <TableCell className="text-sm font-medium">
          ₦{(s.quote_amount / 100).toLocaleString()}
        </TableCell>
      )}
      {!s.quote_amount && <TableCell className="text-muted-foreground">—</TableCell>}
      <TableCell className="text-xs text-muted-foreground">
        {format(parseISO(s.created_at), "dd MMM yyyy")}
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      <PageHeader
        title="Shipments"
        description={activeCount > 0 ? `${activeCount} active` : undefined}
        actions={
          <Button onClick={() => navigate("/admin/shipments/new")}>
            <Plus className="h-4 w-4" />
            New shipment
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search ID, customer, vehicle type…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quote</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                      No shipments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(renderRow)
                )}
              </TableBody>
            </Table>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

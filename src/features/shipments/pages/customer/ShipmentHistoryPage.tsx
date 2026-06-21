import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { format, parseISO } from "date-fns";
import type { ShipmentRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

function cityFrom(loc: unknown): string {
  try {
    const l = loc as { address?: { city?: string } };
    return l.address?.city ?? "—";
  } catch {
    return "—";
  }
}

const ACTIVE: ShipmentStatus[] = [
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

export function ShipmentHistoryPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["my_shipments_history", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user!.id)
        .single();
      if (!customer) return [];

      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShipmentRow[];
    },
  });

  const filtered = shipments.filter((s) => {
    const matchesSearch =
      !search.trim() ||
      cityFrom(s.pickup).toLowerCase().includes(search.toLowerCase()) ||
      cityFrom(s.destination).toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      tab === "all" ||
      (tab === "active" && ACTIVE.includes(s.status as ShipmentStatus)) ||
      (tab === "completed" &&
        (["DELIVERED", "VERIFIED", "PAID", "CLOSED"] as ShipmentStatus[]).includes(
          s.status as ShipmentStatus,
        )) ||
      (tab === "cancelled" &&
        (["CANCELLED", "FAILED", "RETURNED"] as ShipmentStatus[]).includes(
          s.status as ShipmentStatus,
        ));

    return matchesSearch && matchesTab;
  });

  const counts = {
    all: shipments.length,
    active: shipments.filter((s) => ACTIVE.includes(s.status as ShipmentStatus)).length,
    completed: shipments.filter((s) =>
      (["DELIVERED", "VERIFIED", "PAID", "CLOSED"] as ShipmentStatus[]).includes(
        s.status as ShipmentStatus,
      ),
    ).length,
    cancelled: shipments.filter((s) =>
      (["CANCELLED", "FAILED", "RETURNED"] as ShipmentStatus[]).includes(
        s.status as ShipmentStatus,
      ),
    ).length,
  };

  const renderList = (list: ShipmentRow[]) => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <EmptyState
          title="No shipments"
          description="Shipments in this category will appear here."
        />
      );
    }
    return (
      <div className="space-y-2">
        {list.map((s) => (
          <div
            key={s.id}
            className="flex cursor-pointer items-center justify-between rounded-md border p-4 hover:bg-muted/50"
            onClick={() => navigate(`/app/history/${s.id}`)}
          >
            <div className="space-y-1">
              <p className="font-medium">
                {cityFrom(s.pickup)} → {cityFrom(s.destination)}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(s.created_at), "dd MMM yyyy")}
                {s.distance_km && ` · ${s.distance_km} km`}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <ShipmentStatusBadge status={s.status as ShipmentStatus} />
              {s.quote_amount && (
                <span className="text-sm font-medium">
                  ₦{(s.quote_amount / 100).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Shipment History" description="All your past and current shipments." />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search city, ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({counts.completed})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({counts.cancelled})</TabsTrigger>
        </TabsList>
        {(["all", "active", "completed", "cancelled"] as const).map((t) => (
          <TabsContent key={t} value={t}>
            {renderList(filtered)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

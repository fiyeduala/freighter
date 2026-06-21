import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
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
import { ShipmentStatusBadge } from "@/components/shared/ShipmentStatusBadge";
import { useOrders, type OrderWithDetail } from "@/features/orders/hooks/useOrders";
import { format, parseISO } from "date-fns";
import type { ShipmentStatus } from "@/types";

const PAYMENT_VARIANT = {
  pending: "warning" as const,
  paid: "success" as const,
  failed: "destructive" as const,
  refunded: "secondary" as const,
};

const TABS = ["all", "pending", "paid", "failed", "refunded"] as const;

export function OrdersListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { orders, isLoading } = useOrders({ payment_status: tab });

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      (o.invoice_no ?? "").toLowerCase().includes(q) ||
      (o.customer?.profile.name ?? "").toLowerCase().includes(q)
    );
  });

  const renderRow = (o: OrderWithDetail) => (
    <TableRow
      key={o.id}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/admin/orders/${o.id}`)}
    >
      <TableCell className="font-mono text-xs">{o.invoice_no ?? o.id.slice(0, 8)}</TableCell>
      <TableCell className="text-sm">{o.customer?.profile.name ?? "—"}</TableCell>
      <TableCell className="text-sm font-medium">₦{(o.total / 100).toLocaleString()}</TableCell>
      <TableCell>
        <Badge variant={PAYMENT_VARIANT[o.payment_status]}>{o.payment_status}</Badge>
      </TableCell>
      <TableCell>
        {o.shipment ? (
          <ShipmentStatusBadge status={o.shipment.status as ShipmentStatus} />
        ) : (
          <span className="text-xs text-muted-foreground">No shipment</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {format(parseISO(o.created_at), "dd MMM yyyy")}
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      <PageHeader title="Orders" description="Commercial billing view of all customer orders." />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order #, invoice, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="capitalize">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((t) => (
          <TabsContent key={t} value={t}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Shipment</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                      No orders found.
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

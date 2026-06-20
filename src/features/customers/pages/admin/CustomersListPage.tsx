import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, UserCheck, UserX } from "lucide-react";
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
import { useCustomers, type CustomerWithProfile } from "@/features/customers/hooks/useCustomers";
import { format, parseISO } from "date-fns";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CustomerRow({
  customer,
  onSuspend,
  onActivate,
}: {
  customer: CustomerWithProfile;
  onSuspend: (profileId: string) => void;
  onActivate: (profileId: string) => void;
}) {
  const navigate = useNavigate();
  const { profile } = customer;

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => navigate(`/admin/customers/${customer.id}`)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials(profile.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{profile.name}</p>
            {customer.company && (
              <p className="text-xs text-muted-foreground">{customer.company}</p>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{profile.phone ?? "—"}</TableCell>
      <TableCell>
        <Badge
          variant={
            profile.status === "active"
              ? "success"
              : profile.status === "suspended"
                ? "destructive"
                : "warning"
          }
        >
          {profile.status}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{customer.shipment_count}</TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {format(parseISO(customer.created_at), "dd MMM yyyy")}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs"
            onClick={() => navigate(`/admin/customers/${customer.id}/edit`)}
          >
            Edit
          </Button>
          {profile.status === "active" ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-destructive hover:text-destructive"
              onClick={() => onSuspend(profile.id)}
            >
              <UserX className="h-3.5 w-3.5" />
              Suspend
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-green-600 hover:text-green-700"
              onClick={() => onActivate(profile.id)}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Activate
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function CustomersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { customers, isLoading, setStatus } = useCustomers();

  const filtered = customers.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.profile.name.toLowerCase().includes(q) ||
      (c.profile.phone ?? "").toLowerCase().includes(q) ||
      (c.company ?? "").toLowerCase().includes(q)
    );
  });

  const byStatus = (tab: string) => {
    if (tab === "all") return filtered;
    if (tab === "suspended") return filtered.filter((c) => c.profile.status === "suspended");
    return filtered.filter((c) => c.profile.status === "active");
  };

  const renderTable = (list: CustomerWithProfile[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Shipments</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead />
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
        ) : list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
              No customers found.
            </TableCell>
          </TableRow>
        ) : (
          list.map((c) => (
            <CustomerRow
              key={c.id}
              customer={c}
              onSuspend={(pid) => setStatus({ profileId: pid, status: "suspended" })}
              onActivate={(pid) => setStatus({ profileId: pid, status: "active" })}
            />
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        actions={
          <Button onClick={() => navigate("/admin/customers/new")}>
            <Plus className="h-4 w-4" />
            Add customer
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, company…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({byStatus("active").length})</TabsTrigger>
          <TabsTrigger value="suspended">Suspended ({byStatus("suspended").length})</TabsTrigger>
        </TabsList>
        {(["all", "active", "suspended"] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            {renderTable(byStatus(tab))}
            {!isLoading && byStatus("all").length === 0 && tab === "all" && (
              <EmptyState
                title="No customers yet"
                description="Add your first customer or wait for registrations."
                action={{ label: "Add customer", onClick: () => navigate("/admin/customers/new") }}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

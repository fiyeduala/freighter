import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { supabase } from "@/lib/supabase";
import { getInitials } from "@/lib/utils";
import type { ProfileRow } from "@/types/supabase";

export function TeamUsersSection() {
  const navigate = useNavigate();
  const [suspending, setSuspending] = useState<string | null>(null);

  const {
    data: admins = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin")
        .order("name");
      if (error) throw error;
      return data as ProfileRow[];
    },
  });

  const toggleStatus = async (admin: ProfileRow) => {
    setSuspending(admin.id);
    const newStatus = admin.status === "active" ? "suspended" : "active";
    await supabase.from("profiles").update({ status: newStatus }).eq("id", admin.id);
    void refetch();
    setSuspending(null);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Team & users</CardTitle>
          <CardDescription>Admin accounts with platform access.</CardDescription>
        </div>
        <Button size="sm" onClick={() => navigate("/admin/drivers/new?role=admin")}>
          <UserPlus className="h-4 w-4" />
          Invite admin
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : admins.length === 0 ? (
          <EmptyState title="No admin accounts" description="Invite your first team member." />
        ) : (
          <div className="divide-y">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center gap-3 py-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{getInitials(admin.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{admin.name}</p>
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">{admin.phone ?? "No phone"}</p>
                </div>
                <Badge
                  variant={admin.status === "active" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {admin.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={suspending === admin.id}
                  onClick={() => toggleStatus(admin)}
                  className="shrink-0 text-xs"
                >
                  {admin.status === "active" ? "Suspend" : "Activate"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

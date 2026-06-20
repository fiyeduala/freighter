import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import type { RoleRow, PermissionRow } from "@/types/supabase";

const MODULES = [
  "shipments",
  "orders",
  "customers",
  "drivers",
  "fleet",
  "payments",
  "reports",
  "settings",
];

export function RolesPermissionsSection() {
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("roles").select("*").order("name");
      if (error) throw error;
      return data as RoleRow[];
    },
  });

  const { data: perms = [], isLoading: permsLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("permissions").select("*");
      if (error) throw error;
      return data as PermissionRow[];
    },
  });

  const isLoading = rolesLoading || permsLoading;

  const getPerms = (roleId: string, module: string) =>
    perms.find((p) => p.role_id === roleId && p.module === module);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & permissions</CardTitle>
        <CardDescription>
          View what each staff role can do. Super admins always have full access. Fine-grained
          editing coming in a future release.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">
                Module
              </th>
              {roles.map((r) => (
                <th key={r.id} className="px-3 py-2 text-center text-xs font-medium">
                  <div className="flex flex-col items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                    {r.name.replace("_", " ")}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <tr key={mod} className="border-b last:border-0">
                <td className="py-2 pr-4 font-medium capitalize">{mod}</td>
                {roles.map((r) => {
                  const p = getPerms(r.id, mod);
                  const isSuperAdmin = r.name === "super_admin";
                  return (
                    <td key={r.id} className="px-3 py-2 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {(isSuperAdmin || p?.can_view) && (
                          <Badge variant="outline" className="text-[10px]">
                            view
                          </Badge>
                        )}
                        {(isSuperAdmin || p?.can_create) && (
                          <Badge variant="outline" className="text-[10px]">
                            create
                          </Badge>
                        )}
                        {(isSuperAdmin || p?.can_edit) && (
                          <Badge variant="outline" className="text-[10px]">
                            edit
                          </Badge>
                        )}
                        {(isSuperAdmin || p?.can_delete) && (
                          <Badge variant="outline" className="text-[10px]">
                            delete
                          </Badge>
                        )}
                        {!isSuperAdmin && !p && (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

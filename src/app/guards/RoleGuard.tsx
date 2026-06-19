import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { Skeleton } from "@/components/ui/skeleton";

type RoleGuardProps = {
  allowedRole: "admin" | "driver" | "customer";
  redirectTo?: string;
};

export function RoleGuard({ allowedRole, redirectTo = "/login" }: RoleGuardProps) {
  const { user, isLoading } = useAuthStore();

  const isWrongRole = !isLoading && user !== null && user.role !== allowedRole;

  useEffect(() => {
    if (isWrongRole) {
      toast.error("You don't have access to that page");
    }
  }, [isWrongRole]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-3 p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (user.role !== allowedRole) {
    const dashboardPath =
      user.role === "admin" ? "/admin" : user.role === "customer" ? "/app" : "/driver";
    return <Navigate to={dashboardPath} replace />;
  }

  return <Outlet />;
}

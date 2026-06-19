import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Cog,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Map,
  MessageSquare,
  Package,
  Search,
  ShoppingBag,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/shipments", label: "Shipments", icon: Package },
  { to: "/admin/tracking", label: "Fleet Tracking", icon: Map },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/drivers", label: "Drivers", icon: Truck },
  { to: "/admin/fleet", label: "Fleet", icon: Wrench },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/messages", label: "Messages", icon: MessageSquare },
  { to: "/admin/settings", label: "Settings", icon: Cog },
] as const;

export function AdminLayout() {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex h-full flex-col border-r bg-card transition-all duration-300",
          sidebarCollapsed ? "w-sidebar-collapsed" : "w-sidebar",
        )}
      >
        {/* Logo */}
        <div className="flex h-top-bar items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Truck className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">Freighter</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 shrink-0"
            onClick={toggleSidebar}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={"end" in item ? item.end : false}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      sidebarCollapsed && "justify-center px-2",
                    )
                  }
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User */}
        {user && (
          <div className="border-t p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-muted",
                    sidebarCollapsed && "justify-center",
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                  <Cog className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-top-bar items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link to="/admin/notifications">
                <Bell className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
              <Link to="/admin/messages">
                <MessageSquare className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

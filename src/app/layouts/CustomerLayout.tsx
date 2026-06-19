import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  Clock,
  CreditCard,
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Truck,
  User,
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
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getInitials } from "@/lib/utils";

const BOTTOM_NAV = [
  { to: "/app", label: "Home", icon: Home, end: true },
  { to: "/app/tracking", label: "Track", icon: MapPin },
  { to: "/app/history", label: "History", icon: Clock },
  { to: "/app/messages", label: "Messages", icon: MessageSquare },
  { to: "/app/profile", label: "Profile", icon: User },
] as const;

export function CustomerLayout() {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <Link to="/app" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Freighter</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/app/tracking"
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
            }
          >
            Track
          </NavLink>
          <NavLink
            to="/app/history"
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
            }
          >
            History
          </NavLink>
          <NavLink
            to="/app/payments"
            className={({ isActive }) =>
              `text-sm font-medium ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
            }
          >
            Payments
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Button size="sm" asChild className="hidden md:flex">
            <Link to="/app/shipments/new">
              <Plus className="h-4 w-4" />
              New Shipment
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/app/notifications">
              <Bell className="h-4 w-4" />
            </Link>
          </Button>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/payments")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Payments
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void signOut()} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-bottom-tab border-t bg-card md:hidden">
        {BOTTOM_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={"end" in item ? item.end : false}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-xs ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

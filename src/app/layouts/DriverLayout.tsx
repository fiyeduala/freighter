import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell,
  Briefcase,
  DollarSign,
  LogOut,
  MessageSquare,
  Navigation,
  Truck,
  User,
  WifiOff,
  Wifi,
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
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { getInitials } from "@/lib/utils";

const BOTTOM_NAV = [
  { to: "/driver", label: "Dashboard", icon: Truck, end: true },
  { to: "/driver/jobs", label: "Jobs", icon: Briefcase },
  { to: "/driver/trips", label: "Trips", icon: Navigation },
  { to: "/driver/messages", label: "Messages", icon: MessageSquare },
  { to: "/driver/earnings", label: "Earnings", icon: DollarSign },
] as const;

export function DriverLayout() {
  const { user } = useAuthStore();
  const { driverOnline, setDriverOnline } = useUiStore();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4">
        <Link to="/driver" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Truck className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Freighter</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Online/offline toggle */}
          <button
            onClick={() => setDriverOnline(!driverOnline)}
            className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
          >
            {driverOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-700 dark:text-green-400">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Offline</span>
              </>
            )}
          </button>

          <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
            <Link to="/driver/notifications">
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
                <DropdownMenuLabel>
                  <div>
                    <p>{user.name}</p>
                    <Badge variant="secondary" className="mt-1 text-2xs">
                      Driver
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/driver/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/driver/earnings")}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Earnings
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
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-bottom-tab border-t bg-card">
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

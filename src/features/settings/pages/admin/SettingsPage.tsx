import { NavLink, useParams } from "react-router-dom";
import {
  User,
  Building2,
  Users,
  ShieldAlert,
  Tag,
  MapPin,
  Truck,
  Package,
  CreditCard,
  Bell,
  MessageSquare,
  Navigation,
  ClipboardCheck,
  Plug,
  Lock,
  ScrollText,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

import { AccountSection } from "./sections/AccountSection";
import { OrganisationSection } from "./sections/OrganisationSection";
import { TeamUsersSection } from "./sections/TeamUsersSection";
import { RolesPermissionsSection } from "./sections/RolesPermissionsSection";
import { PricingRatesSection } from "./sections/PricingRatesSection";
import { ServiceAreasSection } from "./sections/ServiceAreasSection";
import { VehicleTypesSection } from "./sections/VehicleTypesSection";
import { CargoTypesSection } from "./sections/CargoTypesSection";
import { PaymentsSection } from "./sections/PaymentsSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { MessagingSection } from "./sections/MessagingSection";
import { TrackingSection } from "./sections/TrackingSection";
import { DeliveryVerificationSection } from "./sections/DeliveryVerificationSection";
import { IntegrationsSection } from "./sections/IntegrationsSection";
import { SecuritySection } from "./sections/SecuritySection";
import { AuditLogSection } from "./sections/AuditLogSection";
import { AppearanceSection } from "./sections/AppearanceSection";

type NavGroup = {
  label: string;
  items: { section: string; label: string; icon: React.ElementType; screenId: string }[];
};

const NAV: NavGroup[] = [
  {
    label: "Account",
    items: [
      { section: "account", label: "My Account", icon: User, screenId: "A-34a" },
      { section: "organisation", label: "Organisation", icon: Building2, screenId: "A-34b" },
      { section: "team", label: "Team & Users", icon: Users, screenId: "A-34c" },
      { section: "roles", label: "Roles & Permissions", icon: ShieldAlert, screenId: "A-34d" },
    ],
  },
  {
    label: "Operations",
    items: [
      { section: "pricing", label: "Pricing & Rates", icon: Tag, screenId: "A-34e" },
      { section: "service-areas", label: "Service Areas", icon: MapPin, screenId: "A-34f" },
      { section: "vehicle-types", label: "Vehicle Types", icon: Truck, screenId: "A-34g" },
      { section: "cargo-types", label: "Cargo Types", icon: Package, screenId: "A-34h" },
    ],
  },
  {
    label: "Platform",
    items: [
      { section: "payments", label: "Payments", icon: CreditCard, screenId: "A-34i" },
      { section: "notifications", label: "Notifications", icon: Bell, screenId: "A-34j" },
      { section: "messaging", label: "Messaging", icon: MessageSquare, screenId: "A-34k" },
      { section: "tracking", label: "Tracking", icon: Navigation, screenId: "A-34l" },
      {
        section: "delivery-verification",
        label: "Delivery Verification",
        icon: ClipboardCheck,
        screenId: "A-34m",
      },
    ],
  },
  {
    label: "System",
    items: [
      { section: "integrations", label: "Integrations", icon: Plug, screenId: "A-34n" },
      { section: "security", label: "Security", icon: Lock, screenId: "A-34o" },
      { section: "audit-log", label: "Audit Log", icon: ScrollText, screenId: "A-34p" },
      { section: "appearance", label: "Appearance", icon: Palette, screenId: "A-34q" },
    ],
  },
];

function SectionContent({ section }: { section: string }) {
  switch (section) {
    case "account":
      return <AccountSection />;
    case "organisation":
      return <OrganisationSection />;
    case "team":
      return <TeamUsersSection />;
    case "roles":
      return <RolesPermissionsSection />;
    case "pricing":
      return <PricingRatesSection />;
    case "service-areas":
      return <ServiceAreasSection />;
    case "vehicle-types":
      return <VehicleTypesSection />;
    case "cargo-types":
      return <CargoTypesSection />;
    case "payments":
      return <PaymentsSection />;
    case "notifications":
      return <NotificationsSection />;
    case "messaging":
      return <MessagingSection />;
    case "tracking":
      return <TrackingSection />;
    case "delivery-verification":
      return <DeliveryVerificationSection />;
    case "integrations":
      return <IntegrationsSection />;
    case "security":
      return <SecuritySection />;
    case "audit-log":
      return <AuditLogSection />;
    case "appearance":
      return <AppearanceSection />;
    default:
      return <AccountSection />;
  }
}

export function SettingsPage() {
  const { section = "account" } = useParams<{ section: string }>();

  const activeItem = NAV.flatMap((g) => g.items).find((i) => i.section === section);

  return (
    <div className="flex h-full gap-0">
      {/* Left sub-nav */}
      <aside className="w-56 shrink-0 border-r pr-0">
        <nav className="space-y-1 py-1">
          {NAV.map((group, gi) => (
            <div key={group.label}>
              {gi > 0 && <Separator className="my-2" />}
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.section}
                  to={`/admin/settings/${item.section}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Section content */}
      <main className="flex-1 overflow-y-auto pl-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">{activeItem?.label ?? "Settings"}</h1>
          <p className="font-mono text-xs text-muted-foreground">{activeItem?.screenId}</p>
        </div>
        <SectionContent section={section} />
      </main>
    </div>
  );
}

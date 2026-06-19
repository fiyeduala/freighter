import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DriverVehiclePage() {
  return (
    <PlaceholderPage
      screenId="D-14"
      title="My Vehicle"
      description="Assigned vehicle details. Report issue → triggers maintenance log."
      breadcrumbs={[{ label: "Profile", href: "/driver/profile" }, { label: "Vehicle" }]}
    />
  );
}

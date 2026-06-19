import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function AvailabilityPage() {
  return (
    <PlaceholderPage
      screenId="D-15"
      title="Availability"
      description="Working hours/days and online schedule."
      breadcrumbs={[{ label: "Profile", href: "/driver/profile" }, { label: "Availability" }]}
    />
  );
}

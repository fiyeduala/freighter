import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function TripDetailPage() {
  return (
    <PlaceholderPage
      screenId="D-05"
      title="Trip Detail"
      description="Status stepper with primary action per stage, route summary, customer contact, cargo, nav/delivery links."
      breadcrumbs={[{ label: "Trips", href: "/driver/trips" }, { label: "Detail" }]}
    />
  );
}

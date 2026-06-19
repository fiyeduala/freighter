import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function RouteDetailsPage() {
  return (
    <PlaceholderPage
      screenId="D-06"
      title="Route Details"
      description="Pickup/dropoff full addresses, contacts, distance, ETA, cargo handling notes."
      breadcrumbs={[
        { label: "Trips", href: "/driver/trips" },
        { label: "Trip", href: "/driver/trips/:id" },
        { label: "Route" },
      ]}
    />
  );
}

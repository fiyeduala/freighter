import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function NavigationPage() {
  return (
    <PlaceholderPage
      screenId="D-07"
      title="Navigation"
      description="In-app Mapbox turn-by-turn navigation; emits live location for tracking."
      breadcrumbs={[
        { label: "Trips", href: "/driver/trips" },
        { label: "Trip", href: "/driver/trips/:id" },
        { label: "Navigate" },
      ]}
    />
  );
}

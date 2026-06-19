import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function CustomerTrackingDetailPage() {
  return (
    <PlaceholderPage
      screenId="C-04"
      title="Track Shipment"
      description="Live map (driver marker, route, ETA), status timeline, driver card, OTP display, POD after delivery."
      breadcrumbs={[{ label: "Track", href: "/app/tracking" }, { label: "Detail" }]}
    />
  );
}

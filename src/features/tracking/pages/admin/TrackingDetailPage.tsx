import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function TrackingDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-07"
      title="Shipment Live Tracking"
      description="Full-screen map: live driver marker, planned route + traveled path, ETA, geofence events."
      breadcrumbs={[{ label: "Fleet Tracking", href: "/admin/tracking" }, { label: "Shipment" }]}
    />
  );
}

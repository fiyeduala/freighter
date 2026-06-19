import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function VehicleDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-19"
      title="Vehicle Detail"
      description="Specs, status, driver, current shipment, maintenance history, documents."
      breadcrumbs={[{ label: "Fleet", href: "/admin/fleet" }, { label: "Detail" }]}
    />
  );
}

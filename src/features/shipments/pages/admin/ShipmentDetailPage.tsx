import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function ShipmentDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-03"
      title="Shipment Detail"
      description="Single source of truth: timeline, cargo, route, assignment, order/payment, documents, message thread."
      breadcrumbs={[{ label: "Shipments", href: "/admin/shipments" }, { label: "Detail" }]}
    />
  );
}

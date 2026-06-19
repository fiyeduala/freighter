import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function CreateShipmentPage() {
  return (
    <PlaceholderPage
      screenId="A-04"
      title="Create Shipment"
      description="Admin books on a customer's behalf. Same wizard as C-02 plus a customer picker."
      breadcrumbs={[{ label: "Shipments", href: "/admin/shipments" }, { label: "New" }]}
    />
  );
}

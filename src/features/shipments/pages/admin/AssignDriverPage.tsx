import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function AssignDriverPage() {
  return (
    <PlaceholderPage
      screenId="A-05"
      title="Assign Driver & Vehicle"
      description="Match shipment to available driver and compatible vehicle."
      breadcrumbs={[
        { label: "Shipments", href: "/admin/shipments" },
        { label: "Detail", href: "/admin/shipments/:id" },
        { label: "Assign" },
      ]}
    />
  );
}

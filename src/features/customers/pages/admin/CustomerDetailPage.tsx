import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function CustomerDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-12"
      title="Customer Detail"
      description="Profile, saved addresses, shipment history, orders/payments, message thread, activity."
      breadcrumbs={[{ label: "Customers", href: "/admin/customers" }, { label: "Detail" }]}
    />
  );
}

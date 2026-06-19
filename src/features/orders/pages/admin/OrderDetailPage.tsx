import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function OrderDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-09"
      title="Order Detail"
      description="Line items, totals, payment status/method, linked shipment, invoice actions."
      breadcrumbs={[{ label: "Orders", href: "/admin/orders" }, { label: "Detail" }]}
    />
  );
}

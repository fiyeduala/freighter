import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function PaymentDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-25"
      title="Payment Detail"
      description="Gateway reference, order/shipment links, status timeline, method, fees, refunds."
      breadcrumbs={[{ label: "Payments", href: "/admin/payments" }, { label: "Detail" }]}
    />
  );
}

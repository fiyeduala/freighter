import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function CustomerPaymentDetailPage() {
  return (
    <PlaceholderPage
      screenId="C-08"
      title="Payment Detail"
      description="Transaction: amount, method, status, linked shipment, receipt, refund status."
      breadcrumbs={[{ label: "Payments", href: "/app/payments" }, { label: "Detail" }]}
    />
  );
}

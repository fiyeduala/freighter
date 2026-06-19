import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function RefundsPage() {
  return (
    <PlaceholderPage
      screenId="A-27"
      title="Refunds"
      description="Refund list and issue refund (full/partial, reason) tied to a payment."
      breadcrumbs={[{ label: "Payments", href: "/admin/payments" }, { label: "Refunds" }]}
    />
  );
}

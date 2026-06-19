import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function PayoutsPage() {
  return (
    <PlaceholderPage
      screenId="A-26"
      title="Driver Payouts"
      description="Per-driver accrued earnings, payout history, pending payouts."
      breadcrumbs={[{ label: "Payments", href: "/admin/payments" }, { label: "Payouts" }]}
    />
  );
}

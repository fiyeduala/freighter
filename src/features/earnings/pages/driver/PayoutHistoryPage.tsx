import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function PayoutHistoryPage() {
  return (
    <PlaceholderPage
      screenId="D-10"
      title="Payout History"
      description="Past payouts: status, method, amount, date."
      breadcrumbs={[{ label: "Earnings", href: "/driver/earnings" }, { label: "Payouts" }]}
    />
  );
}

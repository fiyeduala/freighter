import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function JobDetailPage() {
  return (
    <PlaceholderPage
      screenId="D-03"
      title="Job Detail"
      description="Full job before accepting: route, cargo, customer, schedule, payout, special instructions. Accept/Decline."
      breadcrumbs={[{ label: "Jobs", href: "/driver/jobs" }, { label: "Detail" }]}
    />
  );
}

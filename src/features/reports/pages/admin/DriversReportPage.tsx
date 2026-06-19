import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DriversReportPage() {
  return (
    <PlaceholderPage
      screenId="A-32"
      title="Driver Performance Report"
      description="Completed trips, on-time %, ratings, cancellations, earnings, leaderboard."
      breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Drivers" }]}
    />
  );
}

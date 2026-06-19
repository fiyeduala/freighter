import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function FleetReportPage() {
  return (
    <PlaceholderPage
      screenId="A-31"
      title="Fleet Performance Report"
      description="Utilisation, downtime, maintenance cost, cost-per-km per vehicle."
      breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Fleet" }]}
    />
  );
}

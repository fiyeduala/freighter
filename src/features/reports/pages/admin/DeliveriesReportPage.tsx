import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DeliveriesReportPage() {
  return (
    <PlaceholderPage
      screenId="A-30"
      title="Deliveries Report"
      description="Volume, on-time vs late, success/fail/return rates, by region."
      breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Deliveries" }]}
    />
  );
}

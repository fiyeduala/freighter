import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function CustomersReportPage() {
  return (
    <PlaceholderPage
      screenId="A-33"
      title="Customer Activity Report"
      description="New vs returning, top customers, LTV, frequency, churn signals."
      breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Customers" }]}
    />
  );
}

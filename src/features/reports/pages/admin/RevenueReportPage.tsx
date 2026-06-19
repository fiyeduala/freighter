import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function RevenueReportPage() {
  return (
    <PlaceholderPage
      screenId="A-29"
      title="Revenue Report"
      description="Gross/net revenue over time, by route/vehicle-type/customer. Recharts + table."
      breadcrumbs={[{ label: "Reports", href: "/admin/reports" }, { label: "Revenue" }]}
    />
  );
}

import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DriverDetailPage() {
  return (
    <PlaceholderPage
      screenId="A-15"
      title="Driver Detail"
      description="Profile, documents, vehicle, jobs, performance, earnings, trip history, messages."
      breadcrumbs={[{ label: "Drivers", href: "/admin/drivers" }, { label: "Detail" }]}
    />
  );
}

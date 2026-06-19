import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DriverVerificationPage() {
  return (
    <PlaceholderPage
      screenId="A-17"
      title="Driver Verification"
      description="Review licence, ID, vehicle papers, insurance. Approve or reject with reason."
      breadcrumbs={[
        { label: "Drivers", href: "/admin/drivers" },
        { label: "Detail", href: "/admin/drivers/:id" },
        { label: "Verify" },
      ]}
    />
  );
}

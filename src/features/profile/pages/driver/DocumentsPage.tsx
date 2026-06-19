import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DocumentsPage() {
  return (
    <PlaceholderPage
      screenId="D-13"
      title="Documents"
      description="Licence, ID, insurance with expiry. Re-upload when expiring/rejected. Status: approved/expiring/expired/rejected."
      breadcrumbs={[{ label: "Profile", href: "/driver/profile" }, { label: "Documents" }]}
    />
  );
}

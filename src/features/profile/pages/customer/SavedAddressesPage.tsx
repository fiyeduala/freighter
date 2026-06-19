import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function SavedAddressesPage() {
  return (
    <PlaceholderPage
      screenId="C-11"
      title="Saved Addresses"
      description="Manage frequent pickup/drop locations used in new shipment wizard."
      breadcrumbs={[{ label: "Profile", href: "/app/profile" }, { label: "Addresses" }]}
    />
  );
}

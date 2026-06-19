import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function AddEditVehiclePage() {
  return (
    <PlaceholderPage
      screenId="A-20"
      title="Add / Edit Vehicle"
      description="Form: type, plate, capacity, year, documents, photos."
      breadcrumbs={[{ label: "Fleet", href: "/admin/fleet" }, { label: "Add / Edit" }]}
    />
  );
}

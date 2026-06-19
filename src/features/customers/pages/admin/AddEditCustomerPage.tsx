import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function AddEditCustomerPage() {
  return (
    <PlaceholderPage
      screenId="A-13"
      title="Add / Edit Customer"
      description="Form: name, email, phone, company, default address."
      breadcrumbs={[{ label: "Customers", href: "/admin/customers" }, { label: "Add / Edit" }]}
    />
  );
}

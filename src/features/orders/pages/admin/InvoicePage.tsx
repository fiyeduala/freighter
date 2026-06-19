import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function InvoicePage() {
  return (
    <PlaceholderPage
      screenId="A-10"
      title="Invoice"
      description="Printable/downloadable invoice: org branding, line items, tax, payment status."
      breadcrumbs={[
        { label: "Orders", href: "/admin/orders" },
        { label: "Detail", href: "/admin/orders/:id" },
        { label: "Invoice" },
      ]}
    />
  );
}

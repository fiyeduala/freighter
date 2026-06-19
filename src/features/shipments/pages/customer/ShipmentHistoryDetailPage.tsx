import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function ShipmentHistoryDetailPage() {
  return (
    <PlaceholderPage
      screenId="C-06"
      title="History Detail"
      description="Read-only past shipment: timeline, POD, invoice/receipt, rating, rebook."
      breadcrumbs={[{ label: "History", href: "/app/history" }, { label: "Detail" }]}
    />
  );
}

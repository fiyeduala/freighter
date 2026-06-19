import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function DeliveryConfirmationPage() {
  return (
    <PlaceholderPage
      screenId="D-08"
      title="Delivery Confirmation (POD)"
      description="Capture photo(s), recipient name, signature pad, OTP entry. Submit → DELIVERED or mark failed."
      breadcrumbs={[
        { label: "Trips", href: "/driver/trips" },
        { label: "Trip", href: "/driver/trips/:id" },
        { label: "Confirm Delivery" },
      ]}
    />
  );
}

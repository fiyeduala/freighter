import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function NotificationPrefsPage() {
  return (
    <PlaceholderPage
      screenId="C-13"
      title="Notification Preferences"
      description="Per-event channel toggles (within admin-allowed limits)."
      breadcrumbs={[{ label: "Profile", href: "/app/profile" }, { label: "Notifications" }]}
    />
  );
}

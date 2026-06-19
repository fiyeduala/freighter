import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function SecurityPage() {
  return (
    <PlaceholderPage
      screenId="C-12"
      title="Security"
      description="Change password, 2FA setup, active sessions."
      breadcrumbs={[{ label: "Profile", href: "/app/profile" }, { label: "Security" }]}
    />
  );
}

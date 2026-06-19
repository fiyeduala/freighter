import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function AddInviteDriverPage() {
  return (
    <PlaceholderPage
      screenId="A-16"
      title="Add / Invite Driver"
      description="Send invite by email/phone → driver completes onboarding."
      breadcrumbs={[{ label: "Drivers", href: "/admin/drivers" }, { label: "Invite" }]}
    />
  );
}

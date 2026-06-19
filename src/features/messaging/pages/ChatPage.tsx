import { PlaceholderPage } from "@/components/shared/PlaceholderPage";

export function ChatPage() {
  return (
    <PlaceholderPage
      screenId="M-02"
      title="Chat"
      description="Message bubbles, timestamps, read receipts, attachments, system delivery-update messages."
      breadcrumbs={[{ label: "Messages", href: "messages" }, { label: "Conversation" }]}
    />
  );
}

import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useNotificationSettings } from "@/features/settings/hooks/useNotificationSettings";
import type { NotificationSettingRow } from "@/types/supabase";

function EventRow({
  setting,
  onUpdate,
  isSaving,
}: {
  setting: NotificationSettingRow;
  onUpdate: (updates: Partial<NotificationSettingRow> & { id: string }) => void;
  isSaving: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [templates, setTemplates] = useState({
    email_subject: setting.email_subject ?? "",
    email_template: setting.email_template ?? "",
    sms_template: setting.sms_template ?? "",
  });

  const toggle = (field: "email_enabled" | "sms_enabled" | "push_enabled", value: boolean) => {
    onUpdate({ id: setting.id, [field]: value });
  };

  const saveTemplates = () => {
    onUpdate({ id: setting.id, ...templates });
  };

  return (
    <div className="border-b last:border-0">
      <div className="flex items-center gap-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{setting.label}</p>
          <p className="font-mono text-xs text-muted-foreground">{setting.event_name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">Email</span>
            <Switch
              checked={setting.email_enabled}
              onCheckedChange={(v) => toggle("email_enabled", v)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">SMS</span>
            <Switch
              checked={setting.sms_enabled}
              onCheckedChange={(v) => toggle("sms_enabled", v)}
              disabled={isSaving}
            />
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-muted-foreground">Push</span>
            <Switch
              checked={setting.push_enabled}
              onCheckedChange={(v) => toggle("push_enabled", v)}
              disabled={isSaving}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 pb-4">
          <Separator />
          <div className="space-y-1.5">
            <Label className="text-xs">Email subject</Label>
            <input
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={templates.email_subject}
              onChange={(e) => setTemplates((t) => ({ ...t, email_subject: e.target.value }))}
              placeholder="Subject line…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email template</Label>
            <Textarea
              rows={3}
              value={templates.email_template}
              onChange={(e) => setTemplates((t) => ({ ...t, email_template: e.target.value }))}
              placeholder="Use {{name}}, {{shipment_id}} as variables…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">SMS template</Label>
            <Textarea
              rows={2}
              value={templates.sms_template}
              onChange={(e) => setTemplates((t) => ({ ...t, sms_template: e.target.value }))}
              placeholder="Short SMS text…"
            />
          </div>
          <Button size="sm" onClick={saveTemplates} disabled={isSaving}>
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
            Save templates
          </Button>
        </div>
      )}
    </div>
  );
}

export function NotificationsSection() {
  const { settings, isLoading, updateRow, isSaving } = useNotificationSettings();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification events</CardTitle>
        <CardDescription>
          Toggle channels per event and edit email/SMS templates. Changes save immediately on
          toggle; click the chevron to edit templates and save explicitly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {settings.map((s) => (
          <EventRow key={s.id} setting={s} onUpdate={updateRow} isSaving={isSaving} />
        ))}
      </CardContent>
    </Card>
  );
}

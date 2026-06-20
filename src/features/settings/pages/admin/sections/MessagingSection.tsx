import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";

const schema = z.object({
  messaging_enabled: z.boolean(),
  attachment_limit_mb: z.coerce.number().min(1).max(100),
  message_retention_days: z.coerce.number().min(7).max(3650),
});

type FormData = z.infer<typeof schema>;

export function MessagingSection() {
  const { settings, isLoading, update, isSaving } = useOrgSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      messaging_enabled: true,
      attachment_limit_mb: 10,
      message_retention_days: 90,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        messaging_enabled: settings.messaging_enabled,
        attachment_limit_mb: settings.attachment_limit_mb,
        message_retention_days: settings.message_retention_days,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormData) => update(data);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Messaging</CardTitle>
        <CardDescription>Configure in-app messaging channels.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex items-center justify-between rounded-md border p-4">
            <div>
              <p className="text-sm font-medium">Enable messaging</p>
              <p className="text-xs text-muted-foreground">
                Allow customers, drivers and admins to message each other.
              </p>
            </div>
            <Switch
              checked={watch("messaging_enabled")}
              onCheckedChange={(v) => setValue("messaging_enabled", v, { shouldDirty: true })}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Attachment size limit (MB)</Label>
            <Input type="number" {...register("attachment_limit_mb")} className="w-40" />
            {errors.attachment_limit_mb && (
              <p className="text-xs text-destructive">{errors.attachment_limit_mb.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Message retention (days)</Label>
            <Input type="number" {...register("message_retention_days")} className="w-40" />
            <p className="text-xs text-muted-foreground">
              Messages older than this are deleted. Min 7, max 3650.
            </p>
          </div>

          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

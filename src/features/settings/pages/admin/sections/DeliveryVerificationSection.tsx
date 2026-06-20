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
  require_photo: z.boolean(),
  require_signature: z.boolean(),
  require_otp: z.boolean(),
  require_recipient_name: z.boolean(),
  otp_length: z.coerce.number().min(4).max(8),
  otp_expiry_minutes: z.coerce.number().min(1).max(60),
});

type FormData = z.infer<typeof schema>;

export function DeliveryVerificationSection() {
  const { settings, isLoading, update, isSaving } = useOrgSettings();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      require_photo: true,
      require_signature: false,
      require_otp: true,
      require_recipient_name: true,
      otp_length: 4,
      otp_expiry_minutes: 10,
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        require_photo: settings.require_photo,
        require_signature: settings.require_signature,
        require_otp: settings.require_otp,
        require_recipient_name: settings.require_recipient_name,
        otp_length: settings.otp_length,
        otp_expiry_minutes: settings.otp_expiry_minutes,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormData) => update(data);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const proofToggles = [
    {
      field: "require_photo" as const,
      label: "Photo capture",
      description: "Driver must take a photo at delivery",
    },
    {
      field: "require_signature" as const,
      label: "Recipient signature",
      description: "Signature pad must be completed",
    },
    {
      field: "require_otp" as const,
      label: "OTP verification",
      description: "Customer receives an OTP via SMS to confirm",
    },
    {
      field: "require_recipient_name" as const,
      label: "Recipient name",
      description: "Driver must enter the name of the person who accepted",
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Proof of delivery</CardTitle>
          <CardDescription>
            Which proofs the driver must complete before marking a delivery as done.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {proofToggles.map(({ field, label, description }) => (
            <div key={field} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <Switch
                checked={watch(field)}
                onCheckedChange={(v) => setValue(field, v, { shouldDirty: true })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OTP settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>OTP length (digits)</Label>
            <Input type="number" min={4} max={8} {...register("otp_length")} className="w-32" />
          </div>
          <div className="space-y-1.5">
            <Label>OTP expiry (minutes)</Label>
            <Input
              type="number"
              min={1}
              max={60}
              {...register("otp_expiry_minutes")}
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSaving || !isDirty}>
        {isSaving && <Loader2 className="animate-spin" />}
        Save
      </Button>
    </form>
  );
}

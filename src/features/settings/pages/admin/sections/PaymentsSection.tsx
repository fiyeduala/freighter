import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgSettings } from "@/features/settings/hooks/useOrgSettings";

const schema = z.object({
  payment_gateway: z.enum(["paystack", "stripe"]),
  capture_mode: z.enum(["prepaid", "on_delivery"]),
  payout_schedule: z.enum(["daily", "weekly", "monthly"]),
});

type FormData = z.infer<typeof schema>;

export function PaymentsSection() {
  const { settings, isLoading, update, isSaving } = useOrgSettings();

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_gateway: "paystack",
      capture_mode: "prepaid",
      payout_schedule: "weekly",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        payment_gateway: settings.payment_gateway,
        capture_mode: settings.capture_mode,
        payout_schedule: settings.payout_schedule,
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Payment gateway</CardTitle>
          <CardDescription>
            Select your gateway. API keys must be set as environment variables in Vercel — never
            store secret keys in this form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Secret keys belong in <code>VITE_PAYSTACK_PUBLIC_KEY</code> (and server-side env vars
              for secret keys). Do not paste secret keys here.
            </span>
          </div>

          <div className="space-y-1.5">
            <Label>Gateway</Label>
            <Select
              value={watch("payment_gateway")}
              onValueChange={(v) =>
                setValue("payment_gateway", v as "paystack" | "stripe", { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paystack">Paystack (recommended for Nigeria)</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Capture mode</Label>
            <Select
              value={watch("capture_mode")}
              onValueChange={(v) =>
                setValue("capture_mode", v as "prepaid" | "on_delivery", { shouldDirty: true })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prepaid">Prepaid — customer pays at booking</SelectItem>
                <SelectItem value="on_delivery">On delivery — pay when goods arrive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Driver payout schedule</Label>
            <Select
              value={watch("payout_schedule")}
              onValueChange={(v) =>
                setValue("payout_schedule", v as "daily" | "weekly" | "monthly", {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
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

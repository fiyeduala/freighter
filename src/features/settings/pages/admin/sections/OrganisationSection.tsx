import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  name: z.string().min(1, "Required"),
  contact_email: z.string().email("Invalid email").or(z.literal("")),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  tax_id: z.string().optional(),
  reg_id: z.string().optional(),
  currency: z.string(),
  timezone: z.string(),
});

type FormData = z.infer<typeof schema>;

const TIMEZONES = [
  "Africa/Lagos",
  "Africa/Abidjan",
  "Africa/Accra",
  "Africa/Nairobi",
  "Europe/London",
  "UTC",
];

export function OrganisationSection() {
  const { settings, isLoading, update, isSaving } = useOrgSettings();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      tax_id: "",
      reg_id: "",
      currency: "NGN",
      timezone: "Africa/Lagos",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        name: settings.name,
        contact_email: settings.contact_email ?? "",
        contact_phone: settings.contact_phone ?? "",
        address: settings.address ?? "",
        tax_id: settings.tax_id ?? "",
        reg_id: settings.reg_id ?? "",
        currency: settings.currency,
        timezone: settings.timezone,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormData) => {
    update({
      name: data.name,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      address: data.address || null,
      tax_id: data.tax_id || null,
      reg_id: data.reg_id || null,
      currency: data.currency,
      timezone: data.timezone,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organisation</CardTitle>
        <CardDescription>
          Company details used on invoices and throughout the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Company name *</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_email">Contact email</Label>
              <Input id="contact_email" type="email" {...register("contact_email")} />
              {errors.contact_email && (
                <p className="text-xs text-destructive">{errors.contact_email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact_phone">Contact phone</Label>
              <Input id="contact_phone" {...register("contact_phone")} placeholder="+234…" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax_id">Tax ID (VAT)</Label>
              <Input id="tax_id" {...register("tax_id")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reg_id">Registration number</Label>
              <Input id="reg_id" {...register("reg_id")} />
            </div>

            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={watch("currency")}
                onValueChange={(v) => setValue("currency", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">NGN — Nigerian Naira</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="GBP">GBP — British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Timezone</Label>
              <Select
                value={watch("timezone")}
                onValueChange={(v) => setValue("timezone", v, { shouldDirty: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={isSaving || !isDirty}>
            {isSaving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { usePricingRules } from "@/features/settings/hooks/usePricingRules";

const schema = z.object({
  name: z.string().min(1),
  base_fare: z.coerce.number().min(0),
  per_km_rate: z.coerce.number().min(0),
  per_kg_rate: z.coerce.number().min(0),
  min_charge: z.coerce.number().min(0),
  tax_rate: z.coerce.number().min(0).max(1),
  night_surcharge: z.coerce.number().min(0).max(5),
  express_surcharge: z.coerce.number().min(0).max(5),
  fragile_surcharge: z.coerce.number().min(0).max(5),
  hazardous_surcharge: z.coerce.number().min(0).max(5),
});

type FormData = z.infer<typeof schema>;

function KoboHint() {
  return (
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Info className="h-3 w-3" />
      Amounts in kobo (100 kobo = ₦1). Surcharges are multipliers (e.g. 0.15 = 15%).
    </p>
  );
}

export function PricingRatesSection() {
  const { rules, isLoading, save, isSaving } = usePricingRules();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "Standard",
      base_fare: 0,
      per_km_rate: 0,
      per_kg_rate: 0,
      min_charge: 0,
      tax_rate: 0.075,
      night_surcharge: 0,
      express_surcharge: 0,
      fragile_surcharge: 0,
      hazardous_surcharge: 0,
    },
  });

  useEffect(() => {
    if (rules) {
      reset({
        name: rules.name,
        base_fare: rules.base_fare,
        per_km_rate: rules.per_km_rate,
        per_kg_rate: rules.per_kg_rate,
        min_charge: rules.min_charge,
        tax_rate: rules.tax_rate,
        night_surcharge: rules.night_surcharge,
        express_surcharge: rules.express_surcharge,
        fragile_surcharge: rules.fragile_surcharge,
        hazardous_surcharge: rules.hazardous_surcharge,
      });
    }
  }, [rules, reset]);

  const onSubmit = (data: FormData) => {
    save({
      ...data,
      vehicle_multipliers: rules?.vehicle_multipliers ?? {},
      is_active: true,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 6 }).map((_, i) => (
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
          <CardTitle>Base rates</CardTitle>
          <CardDescription>Core pricing fed into the quote engine.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <KoboHint />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Rule name</Label>
              <Input {...register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Base fare (kobo)</Label>
              <Input type="number" {...register("base_fare")} />
              {errors.base_fare && (
                <p className="text-xs text-destructive">{errors.base_fare.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Rate per km (kobo)</Label>
              <Input type="number" {...register("per_km_rate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Rate per kg (kobo)</Label>
              <Input type="number" {...register("per_kg_rate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Minimum charge (kobo)</Label>
              <Input type="number" {...register("min_charge")} />
            </div>
            <div className="space-y-1.5">
              <Label>Tax rate (e.g. 0.075 for 7.5%)</Label>
              <Input type="number" step="0.001" {...register("tax_rate")} />
              {errors.tax_rate && (
                <p className="text-xs text-destructive">{errors.tax_rate.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Surcharges</CardTitle>
          <CardDescription>Multipliers added on top of the base rate.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["night_surcharge", "Night surcharge"],
                ["express_surcharge", "Express surcharge"],
                ["fragile_surcharge", "Fragile cargo"],
                ["hazardous_surcharge", "Hazardous cargo"],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-1.5">
                <Label>{label}</Label>
                <Input type="number" step="0.01" {...register(field)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Button type="submit" disabled={isSaving || !isDirty}>
        {isSaving && <Loader2 className="animate-spin" />}
        Save pricing
      </Button>
    </form>
  );
}

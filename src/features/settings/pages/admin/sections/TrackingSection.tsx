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
  gps_interval_seconds: z.coerce.number().min(5).max(300),
  geofence_radius_m: z.coerce.number().min(50).max(5000),
  stale_location_minutes: z.coerce.number().min(1).max(60),
  map_provider: z.enum(["mapbox", "google"]),
});

type FormData = z.infer<typeof schema>;

export function TrackingSection() {
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
      gps_interval_seconds: 10,
      geofence_radius_m: 200,
      stale_location_minutes: 5,
      map_provider: "mapbox",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        gps_interval_seconds: settings.gps_interval_seconds,
        geofence_radius_m: settings.geofence_radius_m,
        stale_location_minutes: settings.stale_location_minutes,
        map_provider: settings.map_provider,
      });
    }
  }, [settings, reset]);

  const onSubmit = (data: FormData) => update(data);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live tracking</CardTitle>
        <CardDescription>GPS sampling and geofence settings for driver tracking.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>GPS ping interval (seconds)</Label>
              <Input type="number" {...register("gps_interval_seconds")} className="w-full" />
              {errors.gps_interval_seconds && (
                <p className="text-xs text-destructive">{errors.gps_interval_seconds.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Geofence radius (metres)</Label>
              <Input type="number" {...register("geofence_radius_m")} className="w-full" />
              <p className="text-xs text-muted-foreground">
                Distance to trigger &quot;arrived&quot; at pickup/dropoff.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Stale location threshold (minutes)</Label>
              <Input type="number" {...register("stale_location_minutes")} className="w-full" />
              <p className="text-xs text-muted-foreground">
                No ping beyond this → amber "stale" indicator.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Map provider</Label>
              <Select
                value={watch("map_provider")}
                onValueChange={(v) =>
                  setValue("map_provider", v as "mapbox" | "google", { shouldDirty: true })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mapbox">Mapbox</SelectItem>
                  <SelectItem value="google">Google Maps</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

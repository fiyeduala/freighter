import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { useVehicle } from "@/features/fleet/hooks/useVehicle";
import { useVehicleTypes } from "@/features/settings/hooks/useVehicleTypes";
import { supabase } from "@/lib/supabase";
import { writeAuditLog } from "@/lib/auditLog";

const schema = z.object({
  plate: z.string().min(2, "Plate required").toUpperCase(),
  vehicle_type_id: z.string().min(1, "Vehicle type required"),
  capacity_kg: z.coerce.number().min(1, "Capacity required"),
  capacity_m3: z.coerce.number().min(0).optional(),
  year: z.coerce
    .number()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),
  status: z.enum(["available", "in_use", "maintenance", "retired"]),
});

type FormData = z.infer<typeof schema>;

export function AddEditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { vehicle, isLoading: vehicleLoading } = useVehicle(id);
  const { vehicleTypes, isLoading: typesLoading } = useVehicleTypes();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "available" },
  });

  useEffect(() => {
    if (vehicle && isEdit) {
      reset({
        plate: vehicle.plate,
        vehicle_type_id: vehicle.vehicle_type_id,
        capacity_kg: vehicle.capacity_kg,
        capacity_m3: vehicle.capacity_m3 ?? undefined,
        year: vehicle.year ?? undefined,
        status: vehicle.status,
      });
    }
  }, [vehicle, isEdit, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      plate: data.plate,
      vehicle_type_id: data.vehicle_type_id,
      capacity_kg: data.capacity_kg,
      capacity_m3: data.capacity_m3 ?? null,
      year: data.year ?? null,
      status: data.status,
    };

    if (isEdit) {
      const { error } = await supabase.from("vehicles").update(payload).eq("id", id);
      if (error) {
        toast.error(
          error.message.includes("unique") ? "Plate number already registered" : error.message,
        );
        return;
      }
      await writeAuditLog("update_vehicle", "vehicles", id, payload as never);
      toast.success("Vehicle updated");
    } else {
      const { data: created, error } = await supabase
        .from("vehicles")
        .insert({ ...payload, documents: null })
        .select()
        .single();
      if (error) {
        toast.error(
          error.message.includes("unique") ? "Plate number already registered" : error.message,
        );
        return;
      }
      await writeAuditLog("create_vehicle", "vehicles", created.id);
      toast.success("Vehicle added");
    }
    navigate("/admin/fleet");
  };

  if (isEdit && vehicleLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit vehicle" : "Add vehicle"}
        breadcrumbs={[{ label: "Fleet", href: "/admin/fleet" }, { label: isEdit ? "Edit" : "Add" }]}
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>{isEdit ? "Edit vehicle details" : "Register a new vehicle"}</CardTitle>
          {!isEdit && (
            <CardDescription>
              Once added, you can assign a driver and log maintenance.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Plate number *</Label>
              <Input {...register("plate")} placeholder="e.g. ABC-123-DE" className="uppercase" />
              {errors.plate && <p className="text-xs text-destructive">{errors.plate.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Vehicle type *</Label>
              <Select
                value={watch("vehicle_type_id")}
                onValueChange={(v) => setValue("vehicle_type_id", v)}
                disabled={typesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vt) => (
                    <SelectItem key={vt.id} value={vt.id}>
                      {vt.name} ({vt.min_capacity_kg}–{vt.max_capacity_kg} kg)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_type_id && (
                <p className="text-xs text-destructive">{errors.vehicle_type_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Capacity (kg) *</Label>
                <Input type="number" {...register("capacity_kg")} min={1} />
                {errors.capacity_kg && (
                  <p className="text-xs text-destructive">{errors.capacity_kg.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Capacity (m³)</Label>
                <Input type="number" step="0.1" {...register("capacity_m3")} min={0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Year</Label>
                <Input type="number" {...register("year")} placeholder="e.g. 2021" />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as FormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="in_use">In use</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isEdit ? "Save changes" : "Add vehicle"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/fleet")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

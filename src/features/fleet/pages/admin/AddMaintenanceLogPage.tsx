import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { useMaintenance } from "@/features/fleet/hooks/useMaintenance";
import { useVehicles } from "@/features/fleet/hooks/useVehicles";
import { format } from "date-fns";

const LOG_TYPES = [
  "Oil Change",
  "Tyre Rotation / Replacement",
  "Brake Service",
  "Engine Service",
  "Transmission Service",
  "Battery Replacement",
  "Air Filter",
  "Suspension",
  "Electrical",
  "Body & Paintwork",
  "Annual Inspection",
  "Other",
];

const schema = z.object({
  vehicle_id: z.string().min(1, "Vehicle required"),
  type: z.string().min(1, "Type required"),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, "Cost required"),
  date: z.string().min(1, "Date required"),
  next_due: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed"]),
  setVehicleMaintenance: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export function AddMaintenanceLogPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedVehicleId = searchParams.get("vehicleId") ?? "";

  const { vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { create, isCreating } = useMaintenance();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehicle_id: preselectedVehicleId,
      status: "scheduled",
      date: format(new Date(), "yyyy-MM-dd"),
      setVehicleMaintenance: false,
    },
  });

  const watchVehicleId = watch("vehicle_id");
  const watchSetMaintenance = watch("setVehicleMaintenance");
  const watchStatus = watch("status");

  const selectedVehicle = vehicles.find((v) => v.id === watchVehicleId);

  const onSubmit = (data: FormData) => {
    create(
      {
        vehicle_id: data.vehicle_id,
        type: data.type,
        description: data.description || null,
        cost: Math.round(data.cost * 100), // store in kobo
        date: data.date,
        next_due: data.next_due || null,
        status: data.status,
        setVehicleMaintenance: data.setVehicleMaintenance && data.status !== "completed",
      },
      {
        onSuccess: () =>
          navigate(
            preselectedVehicleId
              ? `/admin/fleet/${preselectedVehicleId}`
              : "/admin/fleet/maintenance",
          ),
      },
    );
  };

  return (
    <div>
      <PageHeader
        title="Add maintenance log"
        breadcrumbs={[
          { label: "Fleet", href: "/admin/fleet" },
          { label: "Maintenance", href: "/admin/fleet/maintenance" },
          { label: "New log" },
        ]}
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Log a maintenance task</CardTitle>
          <CardDescription>
            Costs should be entered in Naira (₦). They are stored in kobo internally.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Vehicle *</Label>
              <Select
                value={watchVehicleId}
                onValueChange={(v) => setValue("vehicle_id", v)}
                disabled={vehiclesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={vehiclesLoading ? "Loading…" : "Select vehicle…"} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.plate} — {v.vehicle_type?.name ?? "?"} ({v.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicle_id && (
                <p className="text-xs text-destructive">{errors.vehicle_id.message}</p>
              )}
            </div>

            {selectedVehicle?.status === "in_use" && (
              <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                This vehicle is currently in use. It cannot be set to maintenance while on an active
                job.
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Maintenance type *</Label>
              <Select value={watch("type") ?? ""} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {LOG_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                {...register("description")}
                placeholder="Details of what was done or needs doing…"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Cost (₦) *</Label>
                <Input type="number" step="0.01" min={0} {...register("cost")} />
                {errors.cost && <p className="text-xs text-destructive">{errors.cost.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={watchStatus}
                  onValueChange={(v) => setValue("status", v as FormData["status"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Service date *</Label>
                <Input type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Next due date</Label>
                <Input type="date" {...register("next_due")} />
              </div>
            </div>

            {watchStatus !== "completed" && selectedVehicle?.status !== "in_use" && (
              <div className="flex items-center gap-2 rounded-md border p-3">
                <Checkbox
                  id="set-maintenance"
                  checked={!!watchSetMaintenance}
                  onCheckedChange={(v) => setValue("setVehicleMaintenance", !!v)}
                />
                <label htmlFor="set-maintenance" className="cursor-pointer text-sm">
                  Set vehicle status to <strong>maintenance</strong> (makes it unavailable for jobs)
                </label>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={isCreating}>
                {isCreating && <Loader2 className="animate-spin" />}
                Save log
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  navigate(
                    preselectedVehicleId
                      ? `/admin/fleet/${preselectedVehicleId}`
                      : "/admin/fleet/maintenance",
                  )
                }
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

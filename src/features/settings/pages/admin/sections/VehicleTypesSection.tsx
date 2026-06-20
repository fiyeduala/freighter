import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useVehicleTypes } from "@/features/settings/hooks/useVehicleTypes";
import type { VehicleTypeRow } from "@/types/supabase";

const schema = z.object({
  name: z.string().min(1, "Required"),
  icon: z.string().optional(),
  min_capacity_kg: z.coerce.number().min(0),
  max_capacity_kg: z.coerce.number().min(0),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function VehicleTypesSection() {
  const { vehicleTypes, isLoading, save, isSaving, remove } = useVehicleTypes();
  const [editing, setEditing] = useState<VehicleTypeRow | null | "new">(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", icon: "", min_capacity_kg: 0, max_capacity_kg: 0, description: "" },
  });

  const openNew = () => {
    setEditing("new");
    reset({ name: "", icon: "", min_capacity_kg: 0, max_capacity_kg: 0, description: "" });
  };

  const openEdit = (vt: VehicleTypeRow) => {
    setEditing(vt);
    reset({
      name: vt.name,
      icon: vt.icon ?? "",
      min_capacity_kg: vt.min_capacity_kg,
      max_capacity_kg: vt.max_capacity_kg,
      description: vt.description ?? "",
    });
  };

  const onSubmit = (data: FormData) => {
    save(
      {
        id: editing && editing !== "new" ? editing.id : undefined,
        name: data.name,
        icon: data.icon || null,
        min_capacity_kg: data.min_capacity_kg,
        max_capacity_kg: data.max_capacity_kg,
        description: data.description || null,
      },
      {
        onSuccess: () => {
          setEditing(null);
          reset();
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Vehicle types</CardTitle>
          <CardDescription>Define the types of vehicles available for hire.</CardDescription>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add type
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : vehicleTypes.length === 0 ? (
          <EmptyState
            title="No vehicle types"
            description="Add your first vehicle type to start adding fleet vehicles."
          />
        ) : (
          <div className="divide-y">
            {vehicleTypes.map((vt) => (
              <div key={vt.id} className="flex items-center gap-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{vt.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {vt.min_capacity_kg}–{vt.max_capacity_kg} kg
                    {vt.description && ` · ${vt.description}`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(vt)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(vt.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? "Add vehicle type" : "Edit vehicle type"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register("name")} placeholder="e.g. Flatbed Truck" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min capacity (kg)</Label>
                <Input type="number" {...register("min_capacity_kg")} />
              </div>
              <div className="space-y-1.5">
                <Label>Max capacity (kg)</Label>
                <Input type="number" {...register("max_capacity_kg")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input {...register("description")} placeholder="Optional notes" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="animate-spin" />}
                Save
              </Button>
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

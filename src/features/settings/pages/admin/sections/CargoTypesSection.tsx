import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCargoTypes } from "@/features/settings/hooks/useCargoTypes";
import type { CargoTypeRow } from "@/types/supabase";

const schema = z.object({
  name: z.string().min(1, "Required"),
  handling_rules: z.string().optional(),
  surcharge: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export function CargoTypesSection() {
  const { cargoTypes, isLoading, save, isSaving, remove } = useCargoTypes();
  const [editing, setEditing] = useState<CargoTypeRow | null | "new">(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", handling_rules: "", surcharge: 0 },
  });

  const openNew = () => {
    setEditing("new");
    reset({ name: "", handling_rules: "", surcharge: 0 });
  };

  const openEdit = (ct: CargoTypeRow) => {
    setEditing(ct);
    reset({ name: ct.name, handling_rules: ct.handling_rules ?? "", surcharge: ct.surcharge });
  };

  const onSubmit = (data: FormData) => {
    save(
      {
        id: editing && editing !== "new" ? editing.id : undefined,
        name: data.name,
        handling_rules: data.handling_rules || null,
        surcharge: data.surcharge,
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
          <CardTitle>Cargo types</CardTitle>
          <CardDescription>
            Categories with handling rules and surcharges. Feeds the booking wizard.
          </CardDescription>
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
        ) : cargoTypes.length === 0 ? (
          <EmptyState
            title="No cargo types"
            description="Add cargo categories to populate the booking wizard."
          />
        ) : (
          <div className="divide-y">
            {cargoTypes.map((ct) => (
              <div key={ct.id} className="flex items-start gap-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{ct.name}</p>
                    {ct.surcharge > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        +{ct.surcharge / 100} ₦
                      </Badge>
                    )}
                  </div>
                  {ct.handling_rules && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {ct.handling_rules}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(ct)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(ct.id)}
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
            <DialogTitle>{editing === "new" ? "Add cargo type" : "Edit cargo type"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register("name")} placeholder="e.g. Fragile goods" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Handling rules</Label>
              <Textarea
                {...register("handling_rules")}
                placeholder="Special handling instructions…"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Surcharge (kobo)</Label>
              <Input type="number" {...register("surcharge")} />
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

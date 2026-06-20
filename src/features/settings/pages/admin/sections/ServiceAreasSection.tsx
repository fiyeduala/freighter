import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useServiceAreas } from "@/features/settings/hooks/useServiceAreas";

const schema = z.object({
  state: z.string().min(1, "Required"),
  city: z.string().optional(),
  surcharge: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof schema>;

export function ServiceAreasSection() {
  const { areas, isLoading, add, isAdding, toggle, remove } = useServiceAreas();
  const [showAdd, setShowAdd] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { state: "", city: "", surcharge: 0 },
  });

  const onAdd = (data: FormData) => {
    add(
      { state: data.state, city: data.city || undefined, surcharge: data.surcharge },
      {
        onSuccess: () => {
          setShowAdd(false);
          reset();
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Service areas</CardTitle>
          <CardDescription>States and cities where bookings are accepted.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4" />
          Add area
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <EmptyState
            title="No service areas"
            description="Add your first state or city to start accepting bookings."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>State</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Surcharge (kobo)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {areas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.state}</TableCell>
                  <TableCell>
                    {area.city ?? <span className="text-muted-foreground">All cities</span>}
                  </TableCell>
                  <TableCell>
                    {area.surcharge > 0 ? (
                      <Badge variant="outline">+{area.surcharge / 100} ₦</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={area.enabled}
                      onCheckedChange={(enabled) => toggle({ id: area.id, enabled })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(area.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add service area</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAdd)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>State *</Label>
              <Input {...register("state")} placeholder="e.g. Lagos" />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>City (optional — leave blank for whole state)</Label>
              <Input {...register("city")} placeholder="e.g. Ikeja" />
            </div>
            <div className="space-y-1.5">
              <Label>Surcharge (kobo)</Label>
              <Input type="number" {...register("surcharge")} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isAdding}>
                {isAdding && <Loader2 className="animate-spin" />}
                Add
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

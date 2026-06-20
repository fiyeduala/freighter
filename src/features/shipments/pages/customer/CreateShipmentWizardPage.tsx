import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Package,
  Truck,
  Calendar,
  Eye,
  ReceiptText,
  CreditCard,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { useCargoTypes } from "@/features/settings/hooks/useCargoTypes";
import { useVehicleTypes } from "@/features/settings/hooks/useVehicleTypes";

// ── Types ──────────────────────────────────────────────────────────────────────

type WizardLocation = {
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  contact_name: string;
  contact_phone: string;
  notes: string;
};

type WizardCargo = {
  cargo_type_id: string;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  special_instructions: string;
  is_fragile: boolean;
  is_hazardous: boolean;
  is_express: boolean;
};

type QuoteBreakdown = {
  distance_km: number;
  distance_source: string;
  base_fare: number;
  distance_charge: number;
  weight_charge: number;
  cargo_surcharge: number;
  area_surcharge: number;
  night_surcharge: number;
  express_surcharge: number;
  fragile_surcharge: number;
  hazardous_surcharge: number;
  subtotal: number;
  tax: number;
  total: number;
  rule_id: string;
  tax_rate: number;
};

type WizardState = {
  step: number;
  pickup: WizardLocation | null;
  destination: WizardLocation | null;
  cargo: WizardCargo | null;
  vehicle_type_id: string | null;
  scheduled_at: string | null;
  quote: QuoteBreakdown | null;
  payment_method: "cod" | "online" | null;
  result: { shipment_id: string; order_id: string } | null;
};

type Action =
  | { type: "SET_PICKUP"; payload: WizardLocation }
  | { type: "SET_DESTINATION"; payload: WizardLocation }
  | { type: "SET_CARGO"; payload: WizardCargo }
  | { type: "SET_VEHICLE"; payload: string }
  | { type: "SET_SCHEDULE"; payload: string | null }
  | { type: "SET_QUOTE"; payload: QuoteBreakdown }
  | { type: "SET_PAYMENT"; payload: "cod" | "online" }
  | { type: "SET_RESULT"; payload: { shipment_id: string; order_id: string } }
  | { type: "GOTO"; payload: number };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_PICKUP":
      return { ...state, pickup: action.payload, step: 2 };
    case "SET_DESTINATION":
      return { ...state, destination: action.payload, step: 3 };
    case "SET_CARGO":
      return { ...state, cargo: action.payload, step: 4 };
    case "SET_VEHICLE":
      return { ...state, vehicle_type_id: action.payload, step: 5 };
    case "SET_SCHEDULE":
      return { ...state, scheduled_at: action.payload, step: 6 };
    case "SET_QUOTE":
      return { ...state, quote: action.payload, step: 8 };
    case "SET_PAYMENT":
      return { ...state, payment_method: action.payload };
    case "SET_RESULT":
      return { ...state, result: action.payload, step: 9 };
    case "GOTO":
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

const INITIAL: WizardState = {
  step: 1,
  pickup: null,
  destination: null,
  cargo: null,
  vehicle_type_id: null,
  scheduled_at: null,
  quote: null,
  payment_method: null,
  result: null,
};

// ── Geocoding autocomplete ─────────────────────────────────────────────────────

type GeoSuggestion = {
  place_name: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
};

function useGeocoder(query: string) {
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.length < 3) { setSuggestions([]); return; }

    timerRef.current = setTimeout(() => { void (async () => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
            `?country=NG&types=address,place,locality,neighborhood&limit=5&access_token=${token}`,
        );
        const json = (await res.json()) as {
          features: {
            place_name: string;
            center: [number, number];
            context?: { id: string; text: string }[];
          }[];
        };
        setSuggestions(
          json.features.map((f) => ({
            place_name: f.place_name,
            lat: f.center[1],
            lng: f.center[0],
            city:
              f.context?.find((c) => c.id.startsWith("place") || c.id.startsWith("locality"))
                ?.text ?? "",
            state: f.context?.find((c) => c.id.startsWith("region"))?.text ?? "",
          })),
        );
      } finally {
        setLoading(false);
      }
    })(); }, 400);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return { suggestions, loading };
}

// ── Location step ──────────────────────────────────────────────────────────────

const locationSchema = z.object({
  contact_name: z.string().min(2, "Name required"),
  contact_phone: z.string().min(7, "Phone required"),
  notes: z.string().optional(),
});
type LocationForm = z.infer<typeof locationSchema>;

function LocationStep({
  title,
  description,
  initial,
  onNext,
  onBack,
}: {
  title: string;
  description: string;
  initial: WizardLocation | null;
  onNext: (loc: WizardLocation) => void;
  onBack?: () => void;
}) {
  const [query, setQuery] = useState(initial?.address ?? "");
  const [selected, setSelected] = useState<Omit<WizardLocation, "contact_name" | "contact_phone" | "notes"> | null>(
    initial ? { address: initial.address, city: initial.city, state: initial.state, lat: initial.lat, lng: initial.lng } : null,
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useGeocoder(query);

  const { register, handleSubmit, formState: { errors } } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      contact_name: initial?.contact_name ?? "",
      contact_phone: initial?.contact_phone ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const onSubmit = (data: LocationForm) => {
    if (!selected) { toast.error("Please search and select an address"); return; }
    onNext({ ...selected, contact_name: data.contact_name, contact_phone: data.contact_phone, notes: data.notes ?? "" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="space-y-1.5">
        <Label>Search address *</Label>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Start typing a Nigerian address…"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setQuery(s.place_name);
                    setSelected({ address: s.place_name, city: s.city, state: s.state, lat: s.lat, lng: s.lng });
                    setShowSuggestions(false);
                  }}
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span>{s.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {selected && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {selected.city}{selected.state ? `, ${selected.state}` : ""}
          </p>
        )}
        {!import.meta.env.VITE_MAPBOX_TOKEN && (
          <p className="text-xs text-amber-600">Geocoding unavailable (no Mapbox token). Type your full address and fill lat/lng manually.</p>
        )}
      </div>

      {!import.meta.env.VITE_MAPBOX_TOKEN && (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">City</Label>
            <Input
              value={selected?.city ?? ""}
              onChange={(e) => setSelected((p) => p ? { ...p, city: e.target.value } : { address: query, city: e.target.value, state: "", lat: 6.5244, lng: 3.3792 })}
              placeholder="Lagos"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">State</Label>
            <Input
              value={selected?.state ?? ""}
              onChange={(e) => setSelected((p) => p ? { ...p, state: e.target.value } : { address: query, city: "", state: e.target.value, lat: 6.5244, lng: 3.3792 })}
              placeholder="Lagos"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Contact name *</Label>
          <Input {...register("contact_name")} placeholder="Person at location" />
          {errors.contact_name && <p className="text-xs text-destructive">{errors.contact_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Contact phone *</Label>
          <Input type="tel" {...register("contact_phone")} placeholder="+234 800 000 0000" />
          {errors.contact_phone && <p className="text-xs text-destructive">{errors.contact_phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea {...register("notes")} placeholder="Access instructions, landmark, etc." rows={2} />
      </div>

      <WizardNav onBack={onBack} />
    </form>
  );
}

// ── Cargo step ─────────────────────────────────────────────────────────────────

const cargoSchema = z.object({
  cargo_type_id: z.string().min(1, "Select a cargo type"),
  weight_kg: z.coerce.number().min(0.1, "Weight required"),
  length_cm: z.coerce.number().optional(),
  width_cm: z.coerce.number().optional(),
  height_cm: z.coerce.number().optional(),
  special_instructions: z.string().optional(),
  is_fragile: z.boolean().default(false),
  is_hazardous: z.boolean().default(false),
  is_express: z.boolean().default(false),
});
type CargoForm = z.infer<typeof cargoSchema>;

function CargoStep({ initial, onNext, onBack }: { initial: WizardCargo | null; onNext: (c: WizardCargo) => void; onBack: () => void }) {
  const { cargoTypes, isLoading } = useCargoTypes();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CargoForm>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      cargo_type_id: initial?.cargo_type_id ?? "",
      weight_kg: initial?.weight_kg ?? 0,
      length_cm: initial?.length_cm ?? undefined,
      width_cm: initial?.width_cm ?? undefined,
      height_cm: initial?.height_cm ?? undefined,
      special_instructions: initial?.special_instructions ?? "",
      is_fragile: initial?.is_fragile ?? false,
      is_hazardous: initial?.is_hazardous ?? false,
      is_express: initial?.is_express ?? false,
    },
  });

  const isFragile = watch("is_fragile");
  const isHazardous = watch("is_hazardous");
  const isExpress = watch("is_express");

  const onSubmit = (data: CargoForm) => {
    onNext({
      cargo_type_id: data.cargo_type_id,
      weight_kg: data.weight_kg,
      length_cm: data.length_cm ?? null,
      width_cm: data.width_cm ?? null,
      height_cm: data.height_cm ?? null,
      special_instructions: data.special_instructions ?? "",
      is_fragile: data.is_fragile,
      is_hazardous: data.is_hazardous,
      is_express: data.is_express,
    });
  };

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Cargo details</h2>
        <p className="text-sm text-muted-foreground">Tell us what you're shipping.</p>
      </div>

      <div className="space-y-1.5">
        <Label>Cargo type *</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {cargoTypes.map((ct) => {
            const selected = watch("cargo_type_id") === ct.id;
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => setValue("cargo_type_id", ct.id)}
                className={`rounded-md border p-3 text-left text-sm transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
              >
                <p className="font-medium">{ct.name}</p>
                {ct.handling_rules && <p className="mt-0.5 text-xs text-muted-foreground">{ct.handling_rules}</p>}
              </button>
            );
          })}
          {cargoTypes.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">No cargo types configured. Ask an admin to add them in Settings.</p>}
        </div>
        {errors.cargo_type_id && <p className="text-xs text-destructive">{errors.cargo_type_id.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Total weight (kg) *</Label>
        <Input type="number" step="0.1" {...register("weight_kg")} />
        {errors.weight_kg && <p className="text-xs text-destructive">{errors.weight_kg.message}</p>}
      </div>

      <div>
        <Label className="mb-1.5 block">Dimensions (optional)</Label>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Input type="number" placeholder="L (cm)" {...register("length_cm")} />
          </div>
          <div>
            <Input type="number" placeholder="W (cm)" {...register("width_cm")} />
          </div>
          <div>
            <Input type="number" placeholder="H (cm)" {...register("height_cm")} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {([["is_fragile", "Fragile"], ["is_hazardous", "Hazardous"], ["is_express", "Express delivery"]] as const).map(([field, label]) => (
          <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={field === "is_fragile" ? isFragile : field === "is_hazardous" ? isHazardous : isExpress}
              onCheckedChange={(v) => setValue(field, !!v)}
            />
            {label}
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>Special instructions (optional)</Label>
        <Textarea {...register("special_instructions")} placeholder="Handling notes, hazards, etc." rows={2} />
      </div>

      <WizardNav onBack={onBack} />
    </form>
  );
}

// ── Vehicle type step ──────────────────────────────────────────────────────────

function VehicleStep({ initial, onNext, onBack }: { initial: string | null; onNext: (id: string) => void; onBack: () => void }) {
  const { vehicleTypes, isLoading } = useVehicleTypes();
  const [selected, setSelected] = useState<string | null>(initial);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Vehicle type</h2>
        <p className="text-sm text-muted-foreground">Choose the vehicle that fits your cargo.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {vehicleTypes.map((vt) => (
          <button
            key={vt.id}
            type="button"
            onClick={() => setSelected(vt.id)}
            className={`rounded-md border p-4 text-left transition-colors ${selected === vt.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <div className="flex items-center gap-2">
              {vt.icon && <span className="text-2xl">{vt.icon}</span>}
              <div>
                <p className="font-medium">{vt.name}</p>
                <p className="text-xs text-muted-foreground">
                  {vt.min_capacity_kg.toLocaleString()}–{vt.max_capacity_kg.toLocaleString()} kg
                </p>
              </div>
            </div>
          </button>
        ))}
        {vehicleTypes.length === 0 && <p className="col-span-2 text-sm text-muted-foreground">No vehicle types configured.</p>}
      </div>

      <WizardNav
        onBack={onBack}
        onNext={selected ? () => onNext(selected) : undefined}
        nextDisabled={!selected}
        nextLabel="Continue"
      />
    </div>
  );
}

// ── Schedule step ──────────────────────────────────────────────────────────────

function ScheduleStep({ initial, onNext, onBack }: { initial: string | null; onNext: (at: string | null) => void; onBack: () => void }) {
  const [type, setType] = useState<"asap" | "scheduled">(initial ? "scheduled" : "asap");
  const [dateTime, setDateTime] = useState(initial ?? "");

  const handleNext = () => {
    if (type === "asap") { onNext(null); return; }
    if (!dateTime) { toast.error("Select a date and time"); return; }
    onNext(dateTime);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Schedule</h2>
        <p className="text-sm text-muted-foreground">When do you need this picked up?</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { value: "asap" as const, label: "As soon as possible", sub: "We'll assign a driver shortly" },
          { value: "scheduled" as const, label: "Specific date & time", sub: "Plan ahead" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`rounded-md border p-4 text-left transition-colors ${type === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <p className="font-medium">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.sub}</p>
          </button>
        ))}
      </div>

      {type === "scheduled" && (
        <div className="space-y-1.5">
          <Label>Pickup date & time</Label>
          <Input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
      )}

      <WizardNav onBack={onBack} onNext={handleNext} nextLabel="Continue" />
    </div>
  );
}

// ── Review step ────────────────────────────────────────────────────────────────

function ReviewStep({
  state,
  onNext,
  onBack,
  onEdit,
}: {
  state: WizardState;
  onNext: () => void;
  onBack: () => void;
  onEdit: (step: number) => void;
}) {
  const { cargoTypes } = useCargoTypes();
  const { vehicleTypes } = useVehicleTypes();
  const cargoName = cargoTypes.find((c) => c.id === state.cargo?.cargo_type_id)?.name ?? "—";
  const vehicleName = vehicleTypes.find((v) => v.id === state.vehicle_type_id)?.name ?? "—";

  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        <Button type="button" variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => onEdit(step)}>Edit</Button>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Review your shipment</h2>
        <p className="text-sm text-muted-foreground">Check everything before we calculate your quote.</p>
      </div>

      <Section title="Pickup" step={1}>
        <p>{state.pickup?.address}</p>
        <p>Contact: {state.pickup?.contact_name} · {state.pickup?.contact_phone}</p>
      </Section>

      <Section title="Destination" step={2}>
        <p>{state.destination?.address}</p>
        <p>Contact: {state.destination?.contact_name} · {state.destination?.contact_phone}</p>
      </Section>

      <Section title="Cargo" step={3}>
        <p>{cargoName} · {state.cargo?.weight_kg} kg</p>
        <div className="flex flex-wrap gap-1">
          {state.cargo?.is_fragile && <Badge variant="warning" className="text-xs">Fragile</Badge>}
          {state.cargo?.is_hazardous && <Badge variant="destructive" className="text-xs">Hazardous</Badge>}
          {state.cargo?.is_express && <Badge className="text-xs">Express</Badge>}
        </div>
      </Section>

      <Section title="Vehicle" step={4}>
        <p>{vehicleName}</p>
      </Section>

      <Section title="Schedule" step={5}>
        <p>{state.scheduled_at ? new Date(state.scheduled_at).toLocaleString() : "As soon as possible"}</p>
      </Section>

      <WizardNav onBack={onBack} onNext={onNext} nextLabel="Get Quote" />
    </div>
  );
}

// ── Quote step ─────────────────────────────────────────────────────────────────

function QuoteStep({
  state,
  onNext,
  onBack,
  dispatch,
}: {
  state: WizardState;
  onNext: () => void;
  onBack: () => void;
  dispatch: React.Dispatch<Action>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNight = state.scheduled_at
    ? new Date(state.scheduled_at).getHours() >= 20 || new Date(state.scheduled_at).getHours() < 6
    : false;

  const fetchQuote = useCallback(async () => {
    if (!state.pickup || !state.destination || !state.cargo) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke<QuoteBreakdown>(
        "calculate-quote",
        {
          body: {
            pickup_lat: state.pickup.lat,
            pickup_lng: state.pickup.lng,
            pickup_state: state.pickup.state,
            pickup_city: state.pickup.city,
            dest_lat: state.destination.lat,
            dest_lng: state.destination.lng,
            dest_state: state.destination.state,
            dest_city: state.destination.city,
            weight_kg: state.cargo.weight_kg,
            cargo_type_id: state.cargo.cargo_type_id || null,
            vehicle_type_id: state.vehicle_type_id || null,
            is_express: state.cargo.is_express,
            is_night: isNight,
            is_fragile: state.cargo.is_fragile,
            is_hazardous: state.cargo.is_hazardous,
          },
        },
      );
      if (fnErr) throw new Error(fnErr.message);
      if (!data) throw new Error("No quote returned");
      dispatch({ type: "SET_QUOTE", payload: data });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [state, isNight, dispatch]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!state.quote) void fetchQuote(); }, []);

  const q = state.quote;

  const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
    <div className={`flex justify-between text-sm ${bold ? "font-semibold" : ""}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );

  const fmt = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Your quote</h2>
        <p className="text-sm text-muted-foreground">Estimated cost for this shipment.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => void fetchQuote()}>Retry</Button>
        </div>
      )}

      {q && !loading && (
        <Card>
          <CardContent className="pt-4 space-y-2">
            <Row label="Base fare" value={fmt(q.base_fare)} />
            <Row label={`Distance (${q.distance_km} km)`} value={fmt(q.distance_charge)} />
            <Row label={`Weight (${state.cargo?.weight_kg ?? 0} kg)`} value={fmt(q.weight_charge)} />
            {q.cargo_surcharge > 0 && <Row label="Cargo surcharge" value={fmt(q.cargo_surcharge)} />}
            {q.area_surcharge > 0 && <Row label="Area surcharge" value={fmt(q.area_surcharge)} />}
            {q.express_surcharge > 0 && <Row label="Express surcharge" value={fmt(q.express_surcharge)} />}
            {q.night_surcharge > 0 && <Row label="Night surcharge" value={fmt(q.night_surcharge)} />}
            {q.fragile_surcharge > 0 && <Row label="Fragile handling" value={fmt(q.fragile_surcharge)} />}
            {q.hazardous_surcharge > 0 && <Row label="Hazardous handling" value={fmt(q.hazardous_surcharge)} />}
            <Separator />
            <Row label="Subtotal" value={fmt(q.subtotal)} />
            <Row label={`Tax (${(q.tax_rate * 100).toFixed(1)}%)`} value={fmt(q.tax)} />
            <Separator />
            <Row label="Total" value={fmt(q.total)} bold />
            {q.distance_source === "haversine" && (
              <p className="text-xs text-muted-foreground">* Distance estimated (straight-line). Actual road distance may vary.</p>
            )}
          </CardContent>
        </Card>
      )}

      <WizardNav
        onBack={onBack}
        onNext={q && !loading ? onNext : undefined}
        nextDisabled={!q || loading}
        nextLabel="Proceed to payment"
      />
    </div>
  );
}

// ── Payment step ───────────────────────────────────────────────────────────────

function PaymentStep({
  state,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  state: WizardState;
  onSubmit: (method: "cod" | "online") => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const [method, setMethod] = useState<"cod" | "online">("cod");
  const fmt = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Payment</h2>
        <p className="text-sm text-muted-foreground">How would you like to pay?</p>
      </div>

      {state.quote && (
        <div className="rounded-md border bg-muted/50 p-3 flex items-center justify-between">
          <span className="text-sm font-medium">Total due</span>
          <span className="text-lg font-bold">{fmt(state.quote.total)}</span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { value: "cod" as const, title: "Pay on Delivery", sub: "Pay when your shipment arrives" },
          { value: "online" as const, title: "Pay Online", sub: "Paystack (coming soon)" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={opt.value === "online"}
            onClick={() => setMethod(opt.value)}
            className={`rounded-md border p-4 text-left transition-colors disabled:opacity-50 ${method === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <p className="font-medium">{opt.title}</p>
            <p className="text-xs text-muted-foreground">{opt.sub}</p>
          </button>
        ))}
      </div>

      <WizardNav
        onBack={onBack}
        onNext={() => onSubmit(method)}
        nextLabel={isSubmitting ? "Submitting…" : "Submit order"}
        nextDisabled={isSubmitting}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ── Confirmation step ──────────────────────────────────────────────────────────

function ConfirmationStep({ result }: { result: { shipment_id: string; order_id: string } }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center py-8 text-center space-y-4">
      <div className="rounded-full bg-green-100 p-4">
        <PartyPopper className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold">Order placed!</h2>
      <p className="text-muted-foreground max-w-sm">
        Your shipment request has been submitted. Our team will review it and assign a driver
        shortly. You'll receive a notification when it's confirmed.
      </p>
      <div className="rounded-md border bg-muted/50 px-4 py-2 font-mono text-sm">
        Order #{result.order_id.slice(0, 8)}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={() => navigate(`/app/history/${result.shipment_id}`)}>
          <Package className="h-4 w-4" />
          Track shipment
        </Button>
        <Button variant="outline" onClick={() => navigate("/app")}>
          Go to dashboard
        </Button>
        <Button variant="ghost" onClick={() => navigate("/app/shipments/new")}>
          Book another
        </Button>
      </div>
    </div>
  );
}

// ── Wizard nav ─────────────────────────────────────────────────────────────────

function WizardNav({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled,
  isSubmitting,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isSubmitting?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      {onBack ? (
        <Button type="button" variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      ) : (
        <div />
      )}
      <Button
        type={onNext ? "button" : "submit"}
        onClick={onNext}
        disabled={nextDisabled || isSubmitting}
      >
        {isSubmitting && <Loader2 className="animate-spin" />}
        {nextLabel}
        {!isSubmitting && !nextDisabled && <ArrowRight className="h-4 w-4" />}
      </Button>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────

const STEPS = [
  { icon: MapPin, label: "Pickup" },
  { icon: MapPin, label: "Destination" },
  { icon: Package, label: "Cargo" },
  { icon: Truck, label: "Vehicle" },
  { icon: Calendar, label: "Schedule" },
  { icon: Eye, label: "Review" },
  { icon: ReceiptText, label: "Quote" },
  { icon: CreditCard, label: "Payment" },
  { icon: CheckCircle2, label: "Done" },
];

function StepProgress({ current }: { current: number }) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex min-w-max items-center gap-1">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = n < current;
          const active = n === current;
          const Icon = s.icon;
          return (
            <div key={n} className="flex items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  done
                    ? "bg-primary text-primary-foreground"
                    : active
                      ? "border-2 border-primary text-primary"
                      : "border border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span
                className={`hidden sm:inline ml-1 text-xs ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-px w-6 ${done ? "bg-primary" : "bg-muted-foreground/20"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main wizard ────────────────────────────────────────────────────────────────

export function CreateShipmentWizardPage() {
  const { user } = useAuthStore();
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = async (method: "cod" | "online") => {
    if (!state.pickup || !state.destination || !state.cargo || !state.quote || !user) return;
    setIsSubmitting(true);
    dispatch({ type: "SET_PAYMENT", payload: method });

    try {
      // 1. Get customer record
      const { data: customer, error: custErr } = await supabase
        .from("customers")
        .select("id")
        .eq("profile_id", user.id)
        .single();
      if (custErr) throw custErr;

      const pickupJson = {
        address: {
          label: "Pickup",
          line1: state.pickup.address,
          city: state.pickup.city,
          state: state.pickup.state,
          geo: { lat: state.pickup.lat, lng: state.pickup.lng },
        },
        contact: { name: state.pickup.contact_name, phone: state.pickup.contact_phone },
        notes: state.pickup.notes || undefined,
      };
      const destJson = {
        address: {
          label: "Destination",
          line1: state.destination.address,
          city: state.destination.city,
          state: state.destination.state,
          geo: { lat: state.destination.lat, lng: state.destination.lng },
        },
        contact: { name: state.destination.contact_name, phone: state.destination.contact_phone },
        notes: state.destination.notes || undefined,
      };

      // 2. Create shipment
      const { data: shipment, error: shipErr } = await supabase
        .from("shipments")
        .insert({
          customer_id: customer.id,
          pickup: pickupJson as never,
          destination: destJson as never,
          cargo_type_id: state.cargo.cargo_type_id || null,
          vehicle_type_id: state.vehicle_type_id || null,
          weight: state.cargo.weight_kg,
          dimensions: state.cargo.length_cm
            ? { length_cm: state.cargo.length_cm, width_cm: state.cargo.width_cm, height_cm: state.cargo.height_cm }
            : null,
          distance_km: state.quote.distance_km,
          quote_amount: state.quote.total,
          scheduled_at: state.scheduled_at,
          special_instructions: state.cargo.special_instructions || null,
          status: "REQUESTED" as const,
          order_id: null,
          driver_id: null,
          vehicle_id: null,
          eta: null,
          photos: [],
        })
        .select()
        .single();
      if (shipErr) throw shipErr;

      // 3. Create order
      const surcharges =
        state.quote.cargo_surcharge +
        state.quote.area_surcharge +
        state.quote.night_surcharge +
        state.quote.express_surcharge +
        state.quote.fragile_surcharge +
        state.quote.hazardous_surcharge;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          shipment_id: shipment.id,
          subtotal: state.quote.subtotal - surcharges,
          surcharges,
          tax: state.quote.tax,
          total: state.quote.total,
          payment_status: "pending" as const,
          invoice_no: null,
        })
        .select()
        .single();
      if (orderErr) throw orderErr;

      // 4. Order items
      const items = [
        { order_id: order.id, label: "Base fare", qty: 1, unit_price: state.quote.base_fare },
        {
          order_id: order.id,
          label: `Distance charge (${state.quote.distance_km} km)`,
          qty: 1,
          unit_price: state.quote.distance_charge,
        },
        {
          order_id: order.id,
          label: `Weight charge (${state.cargo.weight_kg} kg)`,
          qty: 1,
          unit_price: state.quote.weight_charge,
        },
      ];
      if (state.quote.cargo_surcharge > 0)
        items.push({ order_id: order.id, label: "Cargo surcharge", qty: 1, unit_price: state.quote.cargo_surcharge });
      if (state.quote.area_surcharge > 0)
        items.push({ order_id: order.id, label: "Area surcharge", qty: 1, unit_price: state.quote.area_surcharge });
      if (state.quote.express_surcharge > 0)
        items.push({ order_id: order.id, label: "Express surcharge", qty: 1, unit_price: state.quote.express_surcharge });
      if (state.quote.night_surcharge > 0)
        items.push({ order_id: order.id, label: "Night surcharge", qty: 1, unit_price: state.quote.night_surcharge });
      if (state.quote.fragile_surcharge > 0)
        items.push({ order_id: order.id, label: "Fragile handling", qty: 1, unit_price: state.quote.fragile_surcharge });
      if (state.quote.hazardous_surcharge > 0)
        items.push({ order_id: order.id, label: "Hazardous handling", qty: 1, unit_price: state.quote.hazardous_surcharge });
      items.push({ order_id: order.id, label: "Tax", qty: 1, unit_price: state.quote.tax });

      await supabase.from("order_items").insert(items);

      // 5. Notify admins
      const { data: adminProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");
      if (adminProfiles?.length) {
        await supabase.from("notifications").insert(
          adminProfiles.map((p) => ({
            recipient_id: p.id,
            type: "new_shipment_request",
            payload: {
              shipment_id: shipment.id,
              order_id: order.id,
              customer_name: user.name,
            } as never,
            channels: ["push"] as never,
            read: false,
            target_url: `/admin/orders/${order.id}`,
          })),
        );
      }

      dispatch({ type: "SET_RESULT", payload: { shipment_id: shipment.id, order_id: order.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Book a Shipment</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Fill in the details below to get a quote and submit your order.
      </p>

      {state.step < 9 && <StepProgress current={state.step} />}

      <Card>
        <CardContent className="pt-6">
          {state.step === 1 && (
            <LocationStep
              title="Pickup location"
              description="Where should we collect the cargo from?"
              initial={state.pickup}
              onNext={(loc) => dispatch({ type: "SET_PICKUP", payload: loc })}
            />
          )}
          {state.step === 2 && (
            <LocationStep
              title="Destination"
              description="Where is the cargo going?"
              initial={state.destination}
              onNext={(loc) => dispatch({ type: "SET_DESTINATION", payload: loc })}
              onBack={() => dispatch({ type: "GOTO", payload: 1 })}
            />
          )}
          {state.step === 3 && (
            <CargoStep
              initial={state.cargo}
              onNext={(c) => dispatch({ type: "SET_CARGO", payload: c })}
              onBack={() => dispatch({ type: "GOTO", payload: 2 })}
            />
          )}
          {state.step === 4 && (
            <VehicleStep
              initial={state.vehicle_type_id}
              onNext={(id) => dispatch({ type: "SET_VEHICLE", payload: id })}
              onBack={() => dispatch({ type: "GOTO", payload: 3 })}
            />
          )}
          {state.step === 5 && (
            <ScheduleStep
              initial={state.scheduled_at}
              onNext={(at) => dispatch({ type: "SET_SCHEDULE", payload: at })}
              onBack={() => dispatch({ type: "GOTO", payload: 4 })}
            />
          )}
          {state.step === 6 && (
            <ReviewStep
              state={state}
              onNext={() => dispatch({ type: "GOTO", payload: 7 })}
              onBack={() => dispatch({ type: "GOTO", payload: 5 })}
              onEdit={(step) => dispatch({ type: "GOTO", payload: step })}
            />
          )}
          {state.step === 7 && (
            <QuoteStep
              state={state}
              onNext={() => dispatch({ type: "GOTO", payload: 8 })}
              onBack={() => dispatch({ type: "GOTO", payload: 6 })}
              dispatch={dispatch}
            />
          )}
          {state.step === 8 && (
            <PaymentStep
              state={state}
              onSubmit={handleSubmitOrder}
              onBack={() => dispatch({ type: "GOTO", payload: 7 })}
              isSubmitting={isSubmitting}
            />
          )}
          {state.step === 9 && state.result && <ConfirmationStep result={state.result} />}
        </CardContent>
      </Card>
    </div>
  );
}

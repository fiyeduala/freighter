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
  Search,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { supabase } from "@/lib/supabase";
import { useCargoTypes } from "@/features/settings/hooks/useCargoTypes";
import { useVehicleTypes } from "@/features/settings/hooks/useVehicleTypes";
import type { CustomerRow, ProfileRow } from "@/types/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

type SelectedCustomer = { customer_id: string; name: string; phone: string };

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
  customer: SelectedCustomer | null;
  pickup: WizardLocation | null;
  destination: WizardLocation | null;
  cargo: WizardCargo | null;
  vehicle_type_id: string | null;
  scheduled_at: string | null;
  quote: QuoteBreakdown | null;
};

type Action =
  | { type: "SET_CUSTOMER"; payload: SelectedCustomer }
  | { type: "SET_PICKUP"; payload: WizardLocation }
  | { type: "SET_DESTINATION"; payload: WizardLocation }
  | { type: "SET_CARGO"; payload: WizardCargo }
  | { type: "SET_VEHICLE"; payload: string }
  | { type: "SET_SCHEDULE"; payload: string | null }
  | { type: "SET_QUOTE"; payload: QuoteBreakdown }
  | { type: "GOTO"; payload: number };

function reducer(state: WizardState, action: Action): WizardState {
  switch (action.type) {
    case "SET_CUSTOMER":
      return { ...state, customer: action.payload, step: 2 };
    case "SET_PICKUP":
      return { ...state, pickup: action.payload, step: 3 };
    case "SET_DESTINATION":
      return { ...state, destination: action.payload, step: 4 };
    case "SET_CARGO":
      return { ...state, cargo: action.payload, step: 5 };
    case "SET_VEHICLE":
      return { ...state, vehicle_type_id: action.payload, step: 6 };
    case "SET_SCHEDULE":
      return { ...state, scheduled_at: action.payload, step: 7 };
    case "SET_QUOTE":
      return { ...state, quote: action.payload };
    case "GOTO":
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

const INITIAL: WizardState = {
  step: 1,
  customer: null,
  pickup: null,
  destination: null,
  cargo: null,
  vehicle_type_id: null,
  scheduled_at: null,
  quote: null,
};

// ── Customer picker ────────────────────────────────────────────────────────────

type CustomerResult = CustomerRow & { profile: Pick<ProfileRow, "id" | "name" | "phone"> };

function CustomerStep({ onNext }: { onNext: (c: SelectedCustomer) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(() => {
      void (async () => {
        setLoading(true);
        try {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, phone")
            .eq("role", "customer")
            .ilike("name", `%${query}%`)
            .limit(10);
          if (!profiles?.length) {
            setResults([]);
            return;
          }
          const profileIds = profiles.map((p) => p.id);
          const { data: customers } = await supabase
            .from("customers")
            .select("*")
            .in("profile_id", profileIds);
          if (!customers) {
            setResults([]);
            return;
          }
          const profileMap = new Map(profiles.map((p) => [p.id, p]));
          setResults(
            customers
              .filter((c) => profileMap.has(c.profile_id))
              .map((c) => ({ ...c, profile: profileMap.get(c.profile_id)! })) as CustomerResult[],
          );
        } finally {
          setLoading(false);
        }
      })();
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Select customer</h2>
        <p className="text-sm text-muted-foreground">
          Search by name to find the customer this shipment is for.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search customer name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors hover:bg-muted"
              onClick={() =>
                onNext({ customer_id: c.id, name: c.profile.name, phone: c.profile.phone ?? "" })
              }
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">{c.profile.name}</p>
                <p className="text-xs text-muted-foreground">{c.profile.phone}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && !loading && results.length === 0 && (
        <p className="text-sm text-muted-foreground">No customers found for "{query}"</p>
      )}
    </div>
  );
}

// ── Geocoding ──────────────────────────────────────────────────────────────────

type GeoSuggestion = { place_name: string; lat: number; lng: number; city: string; state: string };

function useGeocoder(query: string) {
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    timer.current = setTimeout(() => {
      void (async () => {
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
      })();
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  return { suggestions, loading };
}

// ── Location step ──────────────────────────────────────────────────────────────

const locSchema = z.object({
  contact_name: z.string().min(2, "Name required"),
  contact_phone: z.string().min(7, "Phone required"),
  notes: z.string().optional(),
});
type LocForm = z.infer<typeof locSchema>;

function LocationStep({
  title,
  initial,
  onNext,
  onBack,
}: {
  title: string;
  initial: WizardLocation | null;
  onNext: (loc: WizardLocation) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState(initial?.address ?? "");
  const [selected, setSelected] = useState<Omit<
    WizardLocation,
    "contact_name" | "contact_phone" | "notes"
  > | null>(
    initial
      ? {
          address: initial.address,
          city: initial.city,
          state: initial.state,
          lat: initial.lat,
          lng: initial.lng,
        }
      : null,
  );
  const [showSugg, setShowSugg] = useState(false);
  const { suggestions, loading } = useGeocoder(query);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LocForm>({
    resolver: zodResolver(locSchema),
    defaultValues: {
      contact_name: initial?.contact_name ?? "",
      contact_phone: initial?.contact_phone ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const onSubmit = (data: LocForm) => {
    if (!selected) {
      toast.error("Select an address from the list");
      return;
    }
    onNext({
      ...selected,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      notes: data.notes ?? "",
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="space-y-1.5">
        <Label>Address *</Label>
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
              setShowSugg(true);
            }}
            onFocus={() => setShowSugg(true)}
            placeholder="Search Nigerian address…"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showSugg && suggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => {
                    setQuery(s.place_name);
                    setSelected({
                      address: s.place_name,
                      city: s.city,
                      state: s.state,
                      lat: s.lat,
                      lng: s.lng,
                    });
                    setShowSugg(false);
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
          <p className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {selected.city}
            {selected.state ? `, ${selected.state}` : ""}
          </p>
        )}
        {!import.meta.env.VITE_MAPBOX_TOKEN && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Input
              placeholder="City"
              value={selected?.city ?? ""}
              onChange={(e) =>
                setSelected((p) =>
                  p
                    ? { ...p, city: e.target.value }
                    : { address: query, city: e.target.value, state: "", lat: 6.5, lng: 3.4 },
                )
              }
            />
            <Input
              placeholder="State"
              value={selected?.state ?? ""}
              onChange={(e) =>
                setSelected((p) =>
                  p
                    ? { ...p, state: e.target.value }
                    : { address: query, city: "", state: e.target.value, lat: 6.5, lng: 3.4 },
                )
              }
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Contact name *</Label>
          <Input {...register("contact_name")} />
          {errors.contact_name && (
            <p className="text-xs text-destructive">{errors.contact_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Contact phone *</Label>
          <Input type="tel" {...register("contact_phone")} />
          {errors.contact_phone && (
            <p className="text-xs text-destructive">{errors.contact_phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea {...register("notes")} rows={2} />
      </div>

      <Nav onBack={onBack} />
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

function CargoStep({
  initial,
  onNext,
  onBack,
}: {
  initial: WizardCargo | null;
  onNext: (c: WizardCargo) => void;
  onBack: () => void;
}) {
  const { cargoTypes, isLoading } = useCargoTypes();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CargoForm>({
    resolver: zodResolver(cargoSchema),
    defaultValues: {
      cargo_type_id: initial?.cargo_type_id ?? "",
      weight_kg: initial?.weight_kg ?? 0,
      is_fragile: initial?.is_fragile ?? false,
      is_hazardous: initial?.is_hazardous ?? false,
      is_express: initial?.is_express ?? false,
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <form
      onSubmit={handleSubmit((d) =>
        onNext({
          cargo_type_id: d.cargo_type_id,
          weight_kg: d.weight_kg,
          length_cm: d.length_cm ?? null,
          width_cm: d.width_cm ?? null,
          height_cm: d.height_cm ?? null,
          special_instructions: d.special_instructions ?? "",
          is_fragile: d.is_fragile,
          is_hazardous: d.is_hazardous,
          is_express: d.is_express,
        }),
      )}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">Cargo details</h2>

      <div className="space-y-1.5">
        <Label>Cargo type *</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {cargoTypes.map((ct) => (
            <button
              key={ct.id}
              type="button"
              onClick={() => setValue("cargo_type_id", ct.id)}
              className={`rounded-md border p-3 text-left text-sm transition-colors ${watch("cargo_type_id") === ct.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
            >
              <p className="font-medium">{ct.name}</p>
            </button>
          ))}
        </div>
        {errors.cargo_type_id && (
          <p className="text-xs text-destructive">{errors.cargo_type_id.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Weight (kg) *</Label>
        <Input type="number" step="0.1" {...register("weight_kg")} />
        {errors.weight_kg && <p className="text-xs text-destructive">{errors.weight_kg.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Input type="number" placeholder="L (cm)" {...register("length_cm")} />
        <Input type="number" placeholder="W (cm)" {...register("width_cm")} />
        <Input type="number" placeholder="H (cm)" {...register("height_cm")} />
      </div>

      <div className="flex flex-wrap gap-4">
        {(["is_fragile", "is_hazardous", "is_express"] as const).map((f) => (
          <label key={f} className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={watch(f)} onCheckedChange={(v) => setValue(f, !!v)} />
            {f === "is_fragile" ? "Fragile" : f === "is_hazardous" ? "Hazardous" : "Express"}
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label>Special instructions</Label>
        <Textarea {...register("special_instructions")} rows={2} />
      </div>

      <Nav onBack={onBack} />
    </form>
  );
}

// ── Vehicle step ───────────────────────────────────────────────────────────────

function VehicleStep({
  initial,
  onNext,
  onBack,
}: {
  initial: string | null;
  onNext: (id: string) => void;
  onBack: () => void;
}) {
  const { vehicleTypes, isLoading } = useVehicleTypes();
  const [sel, setSel] = useState<string | null>(initial);

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Vehicle type</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {vehicleTypes.map((vt) => (
          <button
            key={vt.id}
            type="button"
            onClick={() => setSel(vt.id)}
            className={`rounded-md border p-4 text-left transition-colors ${sel === vt.id ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            {vt.icon && <span className="text-xl">{vt.icon}</span>}
            <p className="font-medium">{vt.name}</p>
            <p className="text-xs text-muted-foreground">
              {vt.min_capacity_kg}–{vt.max_capacity_kg} kg
            </p>
          </button>
        ))}
      </div>
      <Nav onBack={onBack} onNext={sel ? () => onNext(sel) : undefined} nextDisabled={!sel} />
    </div>
  );
}

// ── Schedule step ──────────────────────────────────────────────────────────────

function ScheduleStep({
  initial,
  onNext,
  onBack,
}: {
  initial: string | null;
  onNext: (at: string | null) => void;
  onBack: () => void;
}) {
  const [type, setType] = useState<"asap" | "scheduled">(initial ? "scheduled" : "asap");
  const [dt, setDt] = useState(initial ?? "");

  const go = () => {
    if (type === "asap") {
      onNext(null);
      return;
    }
    if (!dt) {
      toast.error("Select a date and time");
      return;
    }
    onNext(dt);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Schedule</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { v: "asap" as const, label: "As soon as possible" },
          { v: "scheduled" as const, label: "Specific date & time" },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setType(o.v)}
            className={`rounded-md border p-4 text-left transition-colors ${type === o.v ? "border-primary bg-primary/5" : "hover:bg-muted"}`}
          >
            <p className="font-medium">{o.label}</p>
          </button>
        ))}
      </div>
      {type === "scheduled" && (
        <Input
          type="datetime-local"
          value={dt}
          onChange={(e) => setDt(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
        />
      )}
      <Nav onBack={onBack} onNext={go} />
    </div>
  );
}

// ── Review + Quote + Submit ────────────────────────────────────────────────────

function ReviewSubmitStep({
  state,
  onBack,
  onEdit,
}: {
  state: WizardState;
  onBack: () => void;
  onEdit: (step: number) => void;
}) {
  const navigate = useNavigate();
  const { cargoTypes } = useCargoTypes();
  const { vehicleTypes } = useVehicleTypes();
  const [quote, setQuote] = useState<QuoteBreakdown | null>(state.quote);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cargoName = cargoTypes.find((c) => c.id === state.cargo?.cargo_type_id)?.name ?? "—";
  const vehicleName = vehicleTypes.find((v) => v.id === state.vehicle_type_id)?.name ?? "—";
  const fmt = (k: number) => `₦${(k / 100).toLocaleString()}`;

  const fetchQuote = useCallback(async () => {
    if (!state.pickup || !state.destination || !state.cargo) return;
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const isNight = state.scheduled_at
        ? new Date(state.scheduled_at).getHours() >= 20 ||
          new Date(state.scheduled_at).getHours() < 6
        : false;
      const { data, error } = await supabase.functions.invoke<QuoteBreakdown>("calculate-quote", {
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
      });
      if (error) throw new Error(error.message);
      if (!data) throw new Error("No quote returned");
      setQuote(data);
    } catch (e) {
      setQuoteError((e as Error).message);
    } finally {
      setQuoteLoading(false);
    }
  }, [state]);

  useEffect(() => {
    if (!quote) void fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    if (!state.customer || !state.pickup || !state.destination || !state.cargo || !quote) return;
    setIsSubmitting(true);
    try {
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

      const { data: shipment, error: shipErr } = await supabase
        .from("shipments")
        .insert({
          customer_id: state.customer.customer_id,
          pickup: pickupJson as never,
          destination: destJson as never,
          cargo_type_id: state.cargo.cargo_type_id || null,
          vehicle_type_id: state.vehicle_type_id || null,
          weight: state.cargo.weight_kg,
          dimensions: null,
          distance_km: quote.distance_km,
          quote_amount: quote.total,
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

      const surcharges =
        quote.cargo_surcharge +
        quote.area_surcharge +
        quote.night_surcharge +
        quote.express_surcharge +
        quote.fragile_surcharge +
        quote.hazardous_surcharge;

      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_id: state.customer.customer_id,
          shipment_id: shipment.id,
          subtotal: quote.subtotal - surcharges,
          surcharges,
          tax: quote.tax,
          total: quote.total,
          payment_status: "pending" as const,
          invoice_no: null,
        })
        .select()
        .single();
      if (orderErr) throw orderErr;

      const items = [
        { order_id: order.id, label: "Base fare", qty: 1, unit_price: quote.base_fare },
        {
          order_id: order.id,
          label: `Distance charge (${quote.distance_km} km)`,
          qty: 1,
          unit_price: quote.distance_charge,
        },
        {
          order_id: order.id,
          label: `Weight charge (${state.cargo.weight_kg} kg)`,
          qty: 1,
          unit_price: quote.weight_charge,
        },
      ];
      if (quote.cargo_surcharge > 0)
        items.push({
          order_id: order.id,
          label: "Cargo surcharge",
          qty: 1,
          unit_price: quote.cargo_surcharge,
        });
      if (quote.area_surcharge > 0)
        items.push({
          order_id: order.id,
          label: "Area surcharge",
          qty: 1,
          unit_price: quote.area_surcharge,
        });
      if (quote.express_surcharge > 0)
        items.push({
          order_id: order.id,
          label: "Express surcharge",
          qty: 1,
          unit_price: quote.express_surcharge,
        });
      if (quote.night_surcharge > 0)
        items.push({
          order_id: order.id,
          label: "Night surcharge",
          qty: 1,
          unit_price: quote.night_surcharge,
        });
      if (quote.fragile_surcharge > 0)
        items.push({
          order_id: order.id,
          label: "Fragile handling",
          qty: 1,
          unit_price: quote.fragile_surcharge,
        });
      if (quote.hazardous_surcharge > 0)
        items.push({
          order_id: order.id,
          label: "Hazardous handling",
          qty: 1,
          unit_price: quote.hazardous_surcharge,
        });
      items.push({ order_id: order.id, label: "Tax", qty: 1, unit_price: quote.tax });
      await supabase.from("order_items").insert(items);

      toast.success("Shipment created successfully");
      navigate(`/admin/shipments/${shipment.id}`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const EditBtn = ({ step }: { step: number }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-xs"
      onClick={() => onEdit(step)}
    >
      Edit
    </Button>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Review & submit</h2>

      {/* Customer */}
      <div className="space-y-1 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Customer</p>
          <EditBtn step={1} />
        </div>
        <p className="text-sm text-muted-foreground">
          {state.customer?.name} · {state.customer?.phone}
        </p>
      </div>

      {/* Pickup */}
      <div className="space-y-1 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Pickup</p>
          <EditBtn step={2} />
        </div>
        <p className="text-sm text-muted-foreground">{state.pickup?.address}</p>
        <p className="text-xs text-muted-foreground">
          Contact: {state.pickup?.contact_name} · {state.pickup?.contact_phone}
        </p>
      </div>

      {/* Destination */}
      <div className="space-y-1 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Destination</p>
          <EditBtn step={3} />
        </div>
        <p className="text-sm text-muted-foreground">{state.destination?.address}</p>
        <p className="text-xs text-muted-foreground">
          Contact: {state.destination?.contact_name} · {state.destination?.contact_phone}
        </p>
      </div>

      {/* Cargo */}
      <div className="space-y-1 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Cargo</p>
          <EditBtn step={4} />
        </div>
        <p className="text-sm text-muted-foreground">
          {cargoName} · {state.cargo?.weight_kg} kg
        </p>
        <div className="flex flex-wrap gap-1">
          {state.cargo?.is_fragile && (
            <Badge variant="warning" className="text-xs">
              Fragile
            </Badge>
          )}
          {state.cargo?.is_hazardous && (
            <Badge variant="destructive" className="text-xs">
              Hazardous
            </Badge>
          )}
          {state.cargo?.is_express && <Badge className="text-xs">Express</Badge>}
        </div>
      </div>

      {/* Vehicle + schedule */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Vehicle</p>
            <EditBtn step={5} />
          </div>
          <p className="text-sm text-muted-foreground">{vehicleName}</p>
        </div>
        <div className="space-y-1 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Schedule</p>
            <EditBtn step={6} />
          </div>
          <p className="text-sm text-muted-foreground">
            {state.scheduled_at ? new Date(state.scheduled_at).toLocaleString() : "ASAP"}
          </p>
        </div>
      </div>

      {/* Quote */}
      {quoteLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Calculating quote…</span>
        </div>
      )}
      {quoteError && (
        <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p>{quoteError}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchQuote()}>
            Retry
          </Button>
        </div>
      )}
      {quote && !quoteLoading && (
        <Card>
          <CardContent className="space-y-1.5 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base fare</span>
              <span>{fmt(quote.base_fare)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distance ({quote.distance_km} km)</span>
              <span>{fmt(quote.distance_charge)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weight ({state.cargo?.weight_kg} kg)</span>
              <span>{fmt(quote.weight_charge)}</span>
            </div>
            {quote.cargo_surcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cargo surcharge</span>
                <span>{fmt(quote.cargo_surcharge)}</span>
              </div>
            )}
            {quote.area_surcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area surcharge</span>
                <span>{fmt(quote.area_surcharge)}</span>
              </div>
            )}
            {quote.express_surcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Express</span>
                <span>{fmt(quote.express_surcharge)}</span>
              </div>
            )}
            {quote.night_surcharge > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Night</span>
                <span>{fmt(quote.night_surcharge)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt(quote.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Tax ({(quote.tax_rate * 100).toFixed(1)}%)
              </span>
              <span>{fmt(quote.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{fmt(quote.total)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Nav
        onBack={onBack}
        onNext={quote && !quoteLoading ? handleSubmit : undefined}
        nextLabel={isSubmitting ? "Creating…" : "Create shipment"}
        nextDisabled={!quote || quoteLoading || isSubmitting}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

function Nav({
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

// ── Progress ───────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: User, label: "Customer" },
  { icon: MapPin, label: "Pickup" },
  { icon: MapPin, label: "Destination" },
  { icon: Package, label: "Cargo" },
  { icon: Truck, label: "Vehicle" },
  { icon: Calendar, label: "Schedule" },
  { icon: Eye, label: "Review" },
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
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${done ? "bg-primary text-primary-foreground" : active ? "border-2 border-primary text-primary" : "border border-muted-foreground/30 text-muted-foreground"}`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <span
                className={`ml-1 hidden text-xs sm:inline ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-px w-5 ${done ? "bg-primary" : "bg-muted-foreground/20"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

export function CreateShipmentPage() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Create Shipment"
        description="Book a shipment on behalf of a customer."
        breadcrumbs={[{ label: "Shipments", href: "/admin/shipments" }, { label: "New" }]}
      />

      <StepProgress current={state.step} />

      <Card>
        <CardContent className="pt-6">
          {state.step === 1 && (
            <CustomerStep onNext={(c) => dispatch({ type: "SET_CUSTOMER", payload: c })} />
          )}
          {state.step === 2 && (
            <LocationStep
              title="Pickup location"
              initial={state.pickup}
              onNext={(l) => dispatch({ type: "SET_PICKUP", payload: l })}
              onBack={() => dispatch({ type: "GOTO", payload: 1 })}
            />
          )}
          {state.step === 3 && (
            <LocationStep
              title="Destination"
              initial={state.destination}
              onNext={(l) => dispatch({ type: "SET_DESTINATION", payload: l })}
              onBack={() => dispatch({ type: "GOTO", payload: 2 })}
            />
          )}
          {state.step === 4 && (
            <CargoStep
              initial={state.cargo}
              onNext={(c) => dispatch({ type: "SET_CARGO", payload: c })}
              onBack={() => dispatch({ type: "GOTO", payload: 3 })}
            />
          )}
          {state.step === 5 && (
            <VehicleStep
              initial={state.vehicle_type_id}
              onNext={(id) => dispatch({ type: "SET_VEHICLE", payload: id })}
              onBack={() => dispatch({ type: "GOTO", payload: 4 })}
            />
          )}
          {state.step === 6 && (
            <ScheduleStep
              initial={state.scheduled_at}
              onNext={(at) => dispatch({ type: "SET_SCHEDULE", payload: at })}
              onBack={() => dispatch({ type: "GOTO", payload: 5 })}
            />
          )}
          {state.step === 7 && (
            <ReviewSubmitStep
              state={state}
              onBack={() => dispatch({ type: "GOTO", payload: 6 })}
              onEdit={(step) => dispatch({ type: "GOTO", payload: step })}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

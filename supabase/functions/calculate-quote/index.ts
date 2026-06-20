import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface QuoteRequest {
  pickup_lat: number;
  pickup_lng: number;
  pickup_state: string;
  pickup_city?: string;
  dest_lat: number;
  dest_lng: number;
  dest_state: string;
  dest_city?: string;
  weight_kg: number;
  cargo_type_id?: string | null;
  vehicle_type_id?: string | null;
  is_express?: boolean;
  is_night?: boolean;
  is_fragile?: boolean;
  is_hazardous?: boolean;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

async function getDrivingDistanceKm(
  pickupLng: number,
  pickupLat: number,
  destLng: number,
  destLat: number,
): Promise<{ km: number; source: "mapbox" | "haversine" }> {
  if (!MAPBOX_TOKEN) {
    return { km: haversineKm(pickupLat, pickupLng, destLat, destLng), source: "haversine" };
  }
  try {
    const url =
      `https://api.mapbox.com/directions/v5/mapbox/driving/` +
      `${pickupLng},${pickupLat};${destLng},${destLat}` +
      `?overview=false&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox ${res.status}`);
    const json = await res.json() as { routes?: { distance: number }[] };
    const meters = json.routes?.[0]?.distance;
    if (!meters) throw new Error("No route returned");
    return { km: Math.round((meters / 1000) * 10) / 10, source: "mapbox" };
  } catch {
    return { km: haversineKm(pickupLat, pickupLng, destLat, destLng), source: "haversine" };
  }
}

function normaliseState(s: string): string {
  return s.toLowerCase().replace(/\s+state$/i, "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = (await req.json()) as QuoteRequest;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch active pricing rule
    const { data: rule, error: ruleErr } = await supabase
      .from("pricing_rules")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (ruleErr || !rule) {
      return new Response(JSON.stringify({ error: "No active pricing rule configured" }), {
        status: 422,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Fetch enabled service areas
    const { data: areas } = await supabase
      .from("service_areas")
      .select("state, city, surcharge")
      .eq("enabled", true);

    const getAreaSurcharge = (state: string, city?: string): number => {
      const norm = normaliseState(state);
      const cityHit = areas?.find(
        (a) =>
          normaliseState(a.state) === norm &&
          a.city != null &&
          city != null &&
          a.city.toLowerCase() === city.toLowerCase(),
      );
      const stateHit = areas?.find(
        (a) => normaliseState(a.state) === norm && !a.city,
      );
      return cityHit?.surcharge ?? stateHit?.surcharge ?? 0;
    };

    // Fetch cargo type surcharge (kobo absolute)
    let cargo_surcharge = 0;
    if (body.cargo_type_id) {
      const { data: ct } = await supabase
        .from("cargo_types")
        .select("surcharge")
        .eq("id", body.cargo_type_id)
        .single();
      cargo_surcharge = ct?.surcharge ?? 0;
    }

    // Vehicle multiplier from rule.vehicle_multipliers JSON
    let vehicleMultiplier = 1.0;
    if (body.vehicle_type_id) {
      const mults = rule.vehicle_multipliers as Record<string, number> | null;
      vehicleMultiplier = mults?.[body.vehicle_type_id] ?? 1.0;
    }

    // Driving distance
    const { km: distance_km, source: distance_source } = await getDrivingDistanceKm(
      body.pickup_lng,
      body.pickup_lat,
      body.dest_lng,
      body.dest_lat,
    );

    // Base components in kobo
    const base_fare = rule.base_fare as number;
    const distance_charge = Math.round((rule.per_km_rate as number) * distance_km);
    const weight_charge = Math.round((rule.per_kg_rate as number) * body.weight_kg);
    const pre_base = base_fare + distance_charge + weight_charge;

    // Rule surcharges are multipliers (e.g. 0.15 = 15% added)
    const night_surcharge = body.is_night ? Math.round(pre_base * (rule.night_surcharge as number)) : 0;
    const express_surcharge = body.is_express ? Math.round(pre_base * (rule.express_surcharge as number)) : 0;
    const fragile_surcharge = body.is_fragile ? Math.round(pre_base * (rule.fragile_surcharge as number)) : 0;
    const hazardous_surcharge = body.is_hazardous ? Math.round(pre_base * (rule.hazardous_surcharge as number)) : 0;

    const area_surcharge =
      getAreaSurcharge(body.pickup_state, body.pickup_city) +
      getAreaSurcharge(body.dest_state, body.dest_city);

    const pre_tax = Math.round(
      (pre_base + night_surcharge + express_surcharge + fragile_surcharge + hazardous_surcharge) *
        vehicleMultiplier,
    ) + cargo_surcharge + area_surcharge;

    const subtotal = Math.max(pre_tax, rule.min_charge as number);
    const tax = Math.round(subtotal * (rule.tax_rate as number));
    const total = subtotal + tax;

    return new Response(
      JSON.stringify({
        distance_km,
        distance_source,
        base_fare,
        distance_charge,
        weight_charge,
        cargo_surcharge,
        area_surcharge,
        night_surcharge,
        express_surcharge,
        fragile_surcharge,
        hazardous_surcharge,
        subtotal,
        tax,
        total,
        rule_id: rule.id as string,
        tax_rate: rule.tax_rate as number,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

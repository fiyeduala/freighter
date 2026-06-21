import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAPBOX_TOKEN = Deno.env.get("MAPBOX_TOKEN");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { shipment_id, driver_lat, driver_lng } = (await req.json()) as {
      shipment_id: string;
      driver_lat: number;
      driver_lng: number;
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: shipment } = await supabase
      .from("shipments")
      .select("destination")
      .eq("id", shipment_id)
      .single();

    if (!shipment) throw new Error("Shipment not found");

    const dest = shipment.destination as {
      address?: { geo?: { lat?: number; lng?: number } };
    };
    const destLat = dest.address?.geo?.lat;
    const destLng = dest.address?.geo?.lng;

    if (!destLat || !destLng) {
      return new Response(
        JSON.stringify({ eta_minutes: null, distance_remaining_km: null, eta_timestamp: null, via_mapbox: false }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    let distanceKm: number;
    let etaMinutes: number;
    let viaMapbox = false;

    if (MAPBOX_TOKEN) {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${driver_lng},${driver_lat};${destLng},${destLat}?access_token=${MAPBOX_TOKEN}`;
        const res = await fetch(url);
        const data = (await res.json()) as { routes?: { distance: number; duration: number }[] };
        const route = data.routes?.[0];
        if (route) {
          distanceKm = route.distance / 1000;
          etaMinutes = Math.ceil(route.duration / 60);
          viaMapbox = true;
        } else {
          throw new Error("No route");
        }
      } catch {
        distanceKm = haversineKm(driver_lat, driver_lng, destLat, destLng);
        etaMinutes = Math.ceil((distanceKm / 40) * 60);
      }
    } else {
      distanceKm = haversineKm(driver_lat, driver_lng, destLat, destLng);
      etaMinutes = Math.ceil((distanceKm / 40) * 60);
    }

    const etaTimestamp = new Date(Date.now() + etaMinutes * 60 * 1000).toISOString();

    // Persist ETA on shipment
    await supabase.from("shipments").update({ eta: etaTimestamp }).eq("id", shipment_id);

    return new Response(
      JSON.stringify({
        eta_minutes: etaMinutes,
        distance_remaining_km: Math.round(distanceKm * 10) / 10,
        eta_timestamp: etaTimestamp,
        via_mapbox: viaMapbox,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      headers: { ...CORS, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

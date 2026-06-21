import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { DriverRow, DriverLocationRow, ProfileRow, ShipmentRow } from "@/types/supabase";
import type { ShipmentStatus } from "@/types";

export type TrackingState =
  | "not_started" // pre-ACCEPTED (ASSIGNED, REVIEWED, etc.)
  | "live" // location received < 60 s ago
  | "stale" // 60–300 s since last update
  | "gps_lost" // > 300 s, driver still assigned
  | "arrived" // ARRIVED_AT_DESTINATION
  | "completed" // DELIVERED+
  | "offline"; // driver.online = false

export type LiveLocation = {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  receivedAt: Date;
};

export type EtaInfo = {
  eta_minutes: number | null;
  distance_remaining_km: number | null;
  eta_timestamp: string | null;
  via_mapbox: boolean;
};

export type TrackingShipment = ShipmentRow & {
  driver: (DriverRow & { profile: Pick<ProfileRow, "id" | "name" | "phone"> }) | null;
};

const COMPLETED: ShipmentStatus[] = ["DELIVERED", "VERIFIED", "PAID", "CLOSED"];
const PRE_ACTIVE: ShipmentStatus[] = ["DRAFT", "REQUESTED", "REVIEWED", "ASSIGNED"];

function deriveState(
  status: ShipmentStatus,
  online: boolean,
  loc: LiveLocation | null,
): TrackingState {
  if (COMPLETED.includes(status)) return "completed";
  if (status === "ARRIVED_AT_DESTINATION") return "arrived";
  if (PRE_ACTIVE.includes(status)) return "not_started";
  if (!online) return "offline";
  if (!loc) return "gps_lost";
  const age = Date.now() - loc.receivedAt.getTime();
  if (age < 60_000) return "live";
  if (age < 300_000) return "stale";
  return "gps_lost";
}

export function useTrackingChannel(shipmentId: string | undefined) {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [eta, setEta] = useState<EtaInfo | null>(null);
  const [trackingState, setTrackingState] = useState<TrackingState>("not_started");
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Shipment + driver (re-polls every 30 s for status changes)
  const { data: shipment, isLoading } = useQuery({
    queryKey: ["tracking_shipment", shipmentId],
    enabled: !!shipmentId,
    refetchInterval: 30_000,
    queryFn: async (): Promise<TrackingShipment | null> => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*, driver:drivers(*, profile:profiles(id, name, phone))")
        .eq("id", shipmentId!)
        .single();
      if (error) return null;
      return data as unknown as TrackingShipment;
    },
  });

  // Last persisted location from DB (seed + fallback)
  const { data: lastDbLoc } = useQuery({
    queryKey: ["last_driver_location", shipmentId],
    enabled: !!shipmentId,
    refetchInterval: 60_000,
    queryFn: async (): Promise<DriverLocationRow | null> => {
      const { data } = await supabase
        .from("driver_locations")
        .select("*")
        .eq("shipment_id", shipmentId!)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as DriverLocationRow | null) ?? null;
    },
  });

  // Seed from DB on first load
  useEffect(() => {
    if (!lastDbLoc) return;
    setLocation((prev) => {
      if (prev && prev.receivedAt >= new Date(lastDbLoc.recorded_at)) return prev;
      return {
        lat: Number(lastDbLoc.lat),
        lng: Number(lastDbLoc.lng),
        heading: lastDbLoc.heading ?? undefined,
        speed: lastDbLoc.speed ?? undefined,
        receivedAt: new Date(lastDbLoc.recorded_at),
      };
    });
  }, [lastDbLoc]);

  // Subscribe to Realtime broadcast channel
  useEffect(() => {
    if (!shipmentId) return;

    const ch = supabase.channel(`tracking:${shipmentId}`, {
      config: { broadcast: { ack: false } },
    });

    ch.on(
      "broadcast",
      { event: "location" },
      (msg: {
        payload: {
          lat: number;
          lng: number;
          heading?: number;
          speed?: number;
          timestamp: string;
        };
      }) => {
        const p = msg.payload;
        setLocation({
          lat: p.lat,
          lng: p.lng,
          heading: p.heading,
          speed: p.speed,
          receivedAt: new Date(p.timestamp),
        });
      },
    );

    ch.on("broadcast", { event: "eta" }, (msg: { payload: EtaInfo }) => {
      setEta(msg.payload);
    });

    void ch.subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [shipmentId]);

  // Recompute tracking state every 30 s
  useEffect(() => {
    const tick = () => {
      if (!shipment) return;
      setTrackingState(
        deriveState(shipment.status as ShipmentStatus, shipment.driver?.online ?? false, location),
      );
    };
    tick();
    tickRef.current = setInterval(tick, 30_000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [shipment, location]);

  return { shipment, location, trackingState, eta, isLoading };
}

export const TRACKING_STATE_LABELS: Record<TrackingState, string> = {
  not_started: "Awaiting pickup",
  live: "Live",
  stale: "Signal weak",
  gps_lost: "GPS lost",
  arrived: "Arrived",
  completed: "Delivered",
  offline: "Driver offline",
};

export const TRACKING_STATE_COLORS: Record<TrackingState, string> = {
  not_started: "bg-muted text-muted-foreground",
  live: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  stale: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  gps_lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  arrived: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  offline: "bg-muted text-muted-foreground",
};

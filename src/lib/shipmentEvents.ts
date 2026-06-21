import { supabase } from "./supabase";
import type { ShipmentStatus } from "@/types";

export async function writeShipmentEvent(
  shipmentId: string,
  event: ShipmentStatus | string,
  actorId: string,
  note?: string,
  geo?: { lat: number; lng: number },
): Promise<void> {
  const { error } = await supabase.from("shipment_events").insert({
    shipment_id: shipmentId,
    event,
    actor_id: actorId,
    note: note ?? null,
    geo: geo ? (geo as never) : null,
  });
  if (error) console.error("[shipment_event]", error.message);
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: ShipmentStatus,
  actorId: string,
  extra?: { driver_id?: string; vehicle_id?: string; eta?: string },
  note?: string,
  geo?: { lat: number; lng: number },
): Promise<void> {
  const { error } = await supabase
    .from("shipments")
    .update({ status, ...(extra ?? {}) })
    .eq("id", shipmentId);
  if (error) throw error;
  await writeShipmentEvent(shipmentId, status, actorId, note, geo);
}

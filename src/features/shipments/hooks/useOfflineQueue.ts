import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { writeShipmentEvent } from "@/lib/shipmentEvents";
import type { ShipmentStatus } from "@/types";

const QUEUE_KEY = "freighter_offline_queue";

type QueuedUpdate = {
  id: string;
  shipment_id: string;
  status: ShipmentStatus;
  actor_id: string;
  note?: string;
  geo?: { lat: number; lng: number };
  queued_at: string;
};

function loadQueue(): QueuedUpdate[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedUpdate[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(queue: QueuedUpdate[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<QueuedUpdate[]>(loadQueue);
  const [isFlushing, setIsFlushing] = useState(false);
  const queueRef = useRef(queue);
  queueRef.current = queue;

  const enqueue = useCallback((update: Omit<QueuedUpdate, "id" | "queued_at">) => {
    const item: QueuedUpdate = {
      ...update,
      id: crypto.randomUUID(),
      queued_at: new Date().toISOString(),
    };
    setQueue((prev) => {
      const next = [...prev, item];
      saveQueue(next);
      return next;
    });
    toast.info("Status queued — will sync when online");
  }, []);

  const flush = useCallback(async () => {
    const current = queueRef.current;
    if (current.length === 0) return;
    setIsFlushing(true);
    const failed: QueuedUpdate[] = [];
    for (const item of current) {
      try {
        const { error } = await supabase
          .from("shipments")
          .update({ status: item.status })
          .eq("id", item.shipment_id);
        if (error) throw error;
        await writeShipmentEvent(item.shipment_id, item.status, item.actor_id, item.note, item.geo);
      } catch {
        failed.push(item);
      }
    }
    setQueue(failed);
    saveQueue(failed);
    setIsFlushing(false);
    if (failed.length === 0 && current.length > 0) {
      toast.success(`${current.length} queued update(s) synced`);
    } else if (failed.length > 0) {
      toast.error(`${failed.length} update(s) failed to sync`);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => void flush();
    window.addEventListener("online", handleOnline);
    // Attempt flush on mount in case we're already online with queued items
    if (navigator.onLine && queue.length > 0) void flush();
    return () => window.removeEventListener("online", handleOnline);
  }, [flush, queue.length]);

  return { queue, enqueue, flush, isFlushing, isOffline: !navigator.onLine };
}

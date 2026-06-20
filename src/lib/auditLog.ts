import { supabase } from "./supabase";
import type { Json } from "@/types/supabase";

export async function writeAuditLog(
  action: string,
  entity: string,
  entityId?: string,
  diff?: Json,
): Promise<void> {
  const { error } = await supabase.rpc("write_audit_log", {
    p_action: action,
    p_entity: entity,
    ...(entityId !== undefined && { p_entity_id: entityId }),
    ...(diff !== undefined && { p_diff: diff }),
  });
  if (error) {
    console.error("[audit]", error.message);
  }
}

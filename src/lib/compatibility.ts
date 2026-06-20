import type { DriverRow, ProfileRow, VehicleRow } from "@/types/supabase";

export type CompatibilityResult = {
  ok: boolean;
  reasons: string[];
};

export function checkVehicleCompatibility(
  vehicle: VehicleRow,
  opts: { weightKg?: number | null; vehicleTypeId?: string | null } = {},
): CompatibilityResult {
  const reasons: string[] = [];

  if (vehicle.status !== "available") {
    reasons.push(`Vehicle is ${vehicle.status}`);
  }
  if (opts.weightKg && vehicle.capacity_kg < opts.weightKg) {
    reasons.push(`Capacity ${vehicle.capacity_kg} kg < cargo ${opts.weightKg} kg`);
  }
  if (opts.vehicleTypeId && vehicle.vehicle_type_id !== opts.vehicleTypeId) {
    reasons.push("Vehicle type does not match requested type");
  }

  return { ok: reasons.length === 0, reasons };
}

export function checkDriverCompatibility(
  driver: DriverRow,
  profile: ProfileRow,
): CompatibilityResult {
  const reasons: string[] = [];

  if (driver.verification_status !== "approved") {
    reasons.push(`Driver verification is ${driver.verification_status}`);
  }
  if (profile.status !== "active") {
    reasons.push(`Driver account is ${profile.status}`);
  }
  if (!driver.online) {
    reasons.push("Driver is offline");
  }

  return { ok: reasons.length === 0, reasons };
}

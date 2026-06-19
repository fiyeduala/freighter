export type { Database, ShipmentStatus } from "./supabase";

/** Authenticated user with role */
export type AppUser = {
  id: string;
  email: string;
  role: "admin" | "driver" | "customer";
  name: string;
  phone: string | null;
  avatar_url: string | null;
};

/** Geo point */
export type GeoPoint = {
  lat: number;
  lng: number;
};

/** Address with geo */
export type Address = {
  label?: string;
  line1: string;
  city: string;
  state: string;
  geo: GeoPoint;
};

/** Contact at a location */
export type LocationContact = {
  name: string;
  phone: string;
};

/** Shipment location (pickup or destination) */
export type ShipmentLocation = {
  address: Address;
  contact: LocationContact;
  window_start?: string;
  window_end?: string;
  notes?: string;
};

/** Cargo dimensions */
export type Dimensions = {
  length_cm: number;
  width_cm: number;
  height_cm: number;
};

/** Pagination */
export type PaginatedResult<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
};

/** Async state convention (loading / empty / error / success) */
export type AsyncState<T> =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

/** Filter option */
export type FilterOption = {
  label: string;
  value: string;
};

/** Tracking state */
export type TrackingState =
  | "not_started"
  | "live"
  | "stale"
  | "gps_lost"
  | "arrived"
  | "completed"
  | "offline";

/**
 * Supabase database type stubs.
 * Replace with `supabase gen types typescript --local` once migrations are applied.
 * The Database type is used by the typed Supabase client.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Row shapes (declared separately to avoid circular references) ─────────────

export type ProfileRow = {
  id: string;
  created_at: string;
  updated_at: string;
  role: "admin" | "driver" | "customer";
  name: string;
  phone: string | null;
  avatar_url: string | null;
  status: "active" | "suspended" | "pending";
  onboarding_complete: boolean;
};

export type InviteTokenRow = {
  id: string;
  created_at: string;
  email: string;
  role: "admin" | "driver";
  token: string;
  created_by: string | null;
  used_at: string | null;
  expires_at: string;
};

export type CustomerRow = {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  company: string | null;
  default_address_id: string | null;
};

export type DriverRow = {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  verification_status: "pending" | "under_review" | "approved" | "rejected";
  rating: number;
  current_vehicle_id: string | null;
  availability: Json | null;
  online: boolean;
  current_location: Json | null;
};

export type ShipmentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  order_id: string | null;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  pickup: Json;
  destination: Json;
  cargo_type_id: string | null;
  weight: number | null;
  dimensions: Json | null;
  vehicle_type_id: string | null;
  status: ShipmentStatus;
  distance_km: number | null;
  eta: string | null;
  quote_amount: number | null;
  scheduled_at: string | null;
};

export type OrderRow = {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  shipment_id: string | null;
  subtotal: number;
  surcharges: number;
  tax: number;
  total: number;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  invoice_no: string | null;
};

export type VehicleRow = {
  id: string;
  created_at: string;
  updated_at: string;
  plate: string;
  vehicle_type_id: string;
  capacity_kg: number;
  capacity_m3: number | null;
  year: number | null;
  status: "available" | "in_use" | "maintenance" | "retired";
  documents: Json | null;
};

export type PaymentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  order_id: string;
  gateway: string;
  reference: string;
  amount: number;
  method: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  fees: number;
};

export type MessageRow = {
  id: string;
  created_at: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  type: "text" | "system" | "attachment";
  read_by: string[];
};

export type NotificationRow = {
  id: string;
  created_at: string;
  recipient_id: string;
  type: string;
  payload: Json;
  channels: string[];
  read: boolean;
  target_url: string | null;
};

// ── Database type (required shape for createClient<Database>) ────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at">;
        Update: Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      invite_tokens: {
        Row: InviteTokenRow;
        Insert: Omit<InviteTokenRow, "created_at" | "id" | "token">;
        Update: Partial<Omit<InviteTokenRow, "id" | "created_at">>;
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: Omit<CustomerRow, "created_at" | "updated_at">;
        Update: Partial<Omit<CustomerRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      drivers: {
        Row: DriverRow;
        Insert: Omit<DriverRow, "created_at" | "updated_at">;
        Update: Partial<Omit<DriverRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      shipments: {
        Row: ShipmentRow;
        Insert: Omit<ShipmentRow, "created_at" | "updated_at">;
        Update: Partial<Omit<ShipmentRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Omit<OrderRow, "created_at" | "updated_at">;
        Update: Partial<Omit<OrderRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      vehicles: {
        Row: VehicleRow;
        Insert: Omit<VehicleRow, "created_at" | "updated_at">;
        Update: Partial<Omit<VehicleRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, "created_at" | "updated_at">;
        Update: Partial<Omit<PaymentRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, "created_at">;
        Update: Partial<Omit<MessageRow, "id" | "created_at">>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "created_at">;
        Update: Partial<Omit<NotificationRow, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: "admin" | "driver" | "customer";
      shipment_status: ShipmentStatus;
      vehicle_status: "available" | "in_use" | "maintenance" | "retired";
      payment_status: "pending" | "paid" | "failed" | "refunded";
      driver_verification_status: "pending" | "under_review" | "approved" | "rejected";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type ShipmentStatus =
  | "DRAFT"
  | "REQUESTED"
  | "REVIEWED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE_TO_PICKUP"
  | "ARRIVED_AT_PICKUP"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "ARRIVED_AT_DESTINATION"
  | "DELIVERED"
  | "VERIFIED"
  | "PAID"
  | "CLOSED"
  | "CANCELLED"
  | "DECLINED"
  | "FAILED"
  | "RETURNED";

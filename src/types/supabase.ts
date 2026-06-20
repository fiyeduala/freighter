/**
 * Hand-authored Supabase types matching Phase 3 migrations.
 * Replace with `supabase gen types typescript --local` once migrations are applied.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ── Enums ─────────────────────────────────────────────────────────────────────

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

// ── Row types ─────────────────────────────────────────────────────────────────

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
  documents: Json | null;
};

export type VehicleTypeRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  icon: string | null;
  min_capacity_kg: number;
  max_capacity_kg: number;
  description: string | null;
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

export type MaintenanceLogRow = {
  id: string;
  created_at: string;
  updated_at: string;
  vehicle_id: string;
  type: string;
  description: string | null;
  cost: number;
  date: string;
  next_due: string | null;
  status: "scheduled" | "in_progress" | "completed";
};

export type CargoTypeRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  handling_rules: string | null;
  surcharge: number;
};

export type CustomerAddressRow = {
  id: string;
  created_at: string;
  updated_at: string;
  customer_id: string;
  label: string;
  address: string;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
};

export type ShipmentRow = {
  id: string;
  created_at: string;
  updated_at: string;
  order_id: string | null;
  customer_id: string;
  driver_id: string | null;
  vehicle_id: string | null;
  cargo_type_id: string | null;
  vehicle_type_id: string | null;
  pickup: Json;
  destination: Json;
  weight: number | null;
  dimensions: Json | null;
  status: ShipmentStatus;
  distance_km: number | null;
  eta: string | null;
  quote_amount: number | null;
  scheduled_at: string | null;
  special_instructions: string | null;
  photos: string[];
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

export type OrderItemRow = {
  id: string;
  created_at: string;
  order_id: string;
  label: string;
  qty: number;
  unit_price: number;
};

export type ShipmentEventRow = {
  id: string;
  created_at: string;
  shipment_id: string;
  event: string;
  actor_id: string | null;
  note: string | null;
  geo: Json | null;
};

export type DeliveryProofRow = {
  id: string;
  created_at: string;
  shipment_id: string;
  photo_urls: string[];
  signature_url: string | null;
  recipient_name: string | null;
  otp_verified: boolean;
  notes: string | null;
  failed_reason: string | null;
};

export type DriverLocationRow = {
  id: string;
  created_at: string;
  driver_id: string;
  shipment_id: string | null;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
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

export type RefundRow = {
  id: string;
  created_at: string;
  updated_at: string;
  payment_id: string;
  amount: number;
  reason: string | null;
  status: "pending" | "processing" | "completed" | "failed";
};

export type DriverEarningRow = {
  id: string;
  created_at: string;
  updated_at: string;
  driver_id: string;
  shipment_id: string;
  amount: number;
  status: "accrued" | "paid";
};

export type PayoutRow = {
  id: string;
  created_at: string;
  updated_at: string;
  driver_id: string;
  amount: number;
  method: string | null;
  status: "pending" | "processing" | "paid" | "failed";
  paid_at: string | null;
};

export type ConversationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  shipment_id: string | null;
  type: "customer_admin" | "customer_driver" | "admin_driver";
};

export type ConversationParticipantRow = {
  id: string;
  created_at: string;
  conversation_id: string;
  profile_id: string;
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

export type MessageAttachmentRow = {
  id: string;
  created_at: string;
  message_id: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
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

export type OrgSettingsRow = {
  id: string;
  _singleton: boolean;
  name: string;
  logo_url: string | null;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tax_id: string | null;
  reg_id: string | null;
  currency: string;
  timezone: string;
  payment_gateway: "paystack" | "stripe";
  capture_mode: "prepaid" | "on_delivery";
  payout_schedule: "daily" | "weekly" | "monthly";
  messaging_enabled: boolean;
  attachment_limit_mb: number;
  message_retention_days: number;
  gps_interval_seconds: number;
  geofence_radius_m: number;
  stale_location_minutes: number;
  map_provider: "mapbox" | "google";
  require_photo: boolean;
  require_signature: boolean;
  require_otp: boolean;
  require_recipient_name: boolean;
  otp_length: number;
  otp_expiry_minutes: number;
  created_at: string;
  updated_at: string;
};

export type PricingRulesRow = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  base_fare: number;
  per_km_rate: number;
  per_kg_rate: number;
  vehicle_multipliers: Json;
  night_surcharge: number;
  express_surcharge: number;
  fragile_surcharge: number;
  hazardous_surcharge: number;
  min_charge: number;
  tax_rate: number;
  is_active: boolean;
};

export type ServiceAreaRow = {
  id: string;
  created_at: string;
  updated_at: string;
  state: string;
  city: string | null;
  enabled: boolean;
  surcharge: number;
};

export type NotificationSettingRow = {
  id: string;
  created_at: string;
  updated_at: string;
  event_name: string;
  label: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  email_subject: string | null;
  email_template: string | null;
  sms_template: string | null;
};

export type AuditLogRow = {
  id: string;
  created_at: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  diff: Json | null;
};

export type RoleRow = {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
};

export type PermissionRow = {
  id: string;
  created_at: string;
  role_id: string;
  module: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_assign: boolean;
};

export type AdminUserRow = {
  id: string;
  created_at: string;
  updated_at: string;
  profile_id: string;
  role_id: string | null;
};

// ── Database type (typed Supabase client) ─────────────────────────────────────

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
      vehicle_types: {
        Row: VehicleTypeRow;
        Insert: Omit<VehicleTypeRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VehicleTypeRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      vehicles: {
        Row: VehicleRow;
        Insert: Omit<VehicleRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<VehicleRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      maintenance_logs: {
        Row: MaintenanceLogRow;
        Insert: Omit<MaintenanceLogRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<MaintenanceLogRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      cargo_types: {
        Row: CargoTypeRow;
        Insert: Omit<CargoTypeRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CargoTypeRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      customer_addresses: {
        Row: CustomerAddressRow;
        Insert: Omit<CustomerAddressRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<CustomerAddressRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      shipments: {
        Row: ShipmentRow;
        Insert: Omit<ShipmentRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ShipmentRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Omit<OrderRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<OrderRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Omit<OrderItemRow, "id" | "created_at">;
        Update: Partial<Omit<OrderItemRow, "id" | "created_at">>;
        Relationships: [];
      };
      shipment_events: {
        Row: ShipmentEventRow;
        Insert: Omit<ShipmentEventRow, "id" | "created_at">;
        Update: Partial<Omit<ShipmentEventRow, "id" | "created_at">>;
        Relationships: [];
      };
      delivery_proofs: {
        Row: DeliveryProofRow;
        Insert: Omit<DeliveryProofRow, "id" | "created_at">;
        Update: Partial<Omit<DeliveryProofRow, "id" | "created_at">>;
        Relationships: [];
      };
      driver_locations: {
        Row: DriverLocationRow;
        Insert: Omit<DriverLocationRow, "id" | "created_at">;
        Update: Partial<Omit<DriverLocationRow, "id" | "created_at">>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Omit<PaymentRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PaymentRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      refunds: {
        Row: RefundRow;
        Insert: Omit<RefundRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<RefundRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      driver_earnings: {
        Row: DriverEarningRow;
        Insert: Omit<DriverEarningRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<DriverEarningRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      payouts: {
        Row: PayoutRow;
        Insert: Omit<PayoutRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PayoutRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      conversations: {
        Row: ConversationRow;
        Insert: Omit<ConversationRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ConversationRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      conversation_participants: {
        Row: ConversationParticipantRow;
        Insert: Omit<ConversationParticipantRow, "id" | "created_at">;
        Update: Partial<Omit<ConversationParticipantRow, "id" | "created_at">>;
        Relationships: [];
      };
      messages: {
        Row: MessageRow;
        Insert: Omit<MessageRow, "id" | "created_at">;
        Update: Partial<Omit<MessageRow, "id" | "created_at">>;
        Relationships: [];
      };
      message_attachments: {
        Row: MessageAttachmentRow;
        Insert: Omit<MessageAttachmentRow, "id" | "created_at">;
        Update: Partial<Omit<MessageAttachmentRow, "id" | "created_at">>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Omit<NotificationRow, "id" | "created_at">;
        Update: Partial<Omit<NotificationRow, "id" | "created_at">>;
        Relationships: [];
      };
      org_settings: {
        Row: OrgSettingsRow;
        Insert: Partial<Omit<OrgSettingsRow, "id" | "created_at" | "updated_at">>;
        Update: Partial<Omit<OrgSettingsRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      pricing_rules: {
        Row: PricingRulesRow;
        Insert: Omit<PricingRulesRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<PricingRulesRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      service_areas: {
        Row: ServiceAreaRow;
        Insert: Omit<ServiceAreaRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ServiceAreaRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      notification_settings: {
        Row: NotificationSettingRow;
        Insert: Omit<NotificationSettingRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<NotificationSettingRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Omit<AuditLogRow, "id" | "created_at">;
        Update: Partial<Omit<AuditLogRow, "id" | "created_at">>;
        Relationships: [];
      };
      roles: {
        Row: RoleRow;
        Insert: Omit<RoleRow, "id" | "created_at">;
        Update: Partial<Omit<RoleRow, "id" | "created_at">>;
        Relationships: [];
      };
      permissions: {
        Row: PermissionRow;
        Insert: Omit<PermissionRow, "id" | "created_at">;
        Update: Partial<Omit<PermissionRow, "id" | "created_at">>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Omit<AdminUserRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AdminUserRow, "id" | "created_at" | "updated_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      auth_customer_id: { Args: Record<string, never>; Returns: string | null };
      auth_driver_id: { Args: Record<string, never>; Returns: string | null };
      write_audit_log: {
        Args: {
          p_action: string;
          p_entity: string;
          p_entity_id?: string;
          p_diff?: Json;
        };
        Returns: void;
      };
    };
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

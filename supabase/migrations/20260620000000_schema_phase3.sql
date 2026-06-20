-- Phase 3: Full schema — all §9 tables not created in Phase 2
-- Phase 2 already created: profiles, customers, drivers, invite_tokens
-- Functions already created: set_updated_at(), handle_new_user(), is_admin()

-- ── 1. vehicle_types (A-34g) ─────────────────────────────────────────────────

create table if not exists public.vehicle_types (
  id              uuid         primary key default gen_random_uuid(),
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  name            text         not null,
  icon            text,
  min_capacity_kg integer      not null default 0,
  max_capacity_kg integer      not null default 0,
  description     text
);

-- ── 2. vehicles ───────────────────────────────────────────────────────────────

create table if not exists public.vehicles (
  id              uuid         primary key default gen_random_uuid(),
  created_at      timestamptz  not null default now(),
  updated_at      timestamptz  not null default now(),
  plate           text         not null unique,
  vehicle_type_id uuid         not null references public.vehicle_types on delete restrict,
  capacity_kg     integer      not null,
  capacity_m3     numeric(8,2),
  year            integer,
  status          text         not null default 'available'
                               check (status in ('available','in_use','maintenance','retired')),
  documents       jsonb
);

-- Add deferred FK on drivers (created in Phase 2 without this FK)
alter table public.drivers
  add constraint drivers_current_vehicle_id_fkey
  foreign key (current_vehicle_id) references public.vehicles on delete set null;

-- ── 3. maintenance_logs ───────────────────────────────────────────────────────

create table if not exists public.maintenance_logs (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  vehicle_id  uuid         not null references public.vehicles on delete cascade,
  type        text         not null,
  description text,
  cost        integer      not null default 0,
  date        date         not null,
  next_due    date,
  status      text         not null default 'scheduled'
                           check (status in ('scheduled','in_progress','completed'))
);

-- ── 4. cargo_types (A-34h) ────────────────────────────────────────────────────

create table if not exists public.cargo_types (
  id             uuid         primary key default gen_random_uuid(),
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now(),
  name           text         not null,
  handling_rules text,
  surcharge      integer      not null default 0
);

-- ── 5. customer_addresses ─────────────────────────────────────────────────────

create table if not exists public.customer_addresses (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  customer_id uuid         not null references public.customers on delete cascade,
  label       text         not null,
  address     text         not null,
  city        text,
  state       text,
  lat         numeric(10,7),
  lng         numeric(10,7)
);

-- Add deferred FK on customers (created in Phase 2 without this FK)
alter table public.customers
  add constraint customers_default_address_id_fkey
  foreign key (default_address_id) references public.customer_addresses on delete set null;

-- ── 6. shipments (order_id FK added after orders table) ──────────────────────

create table if not exists public.shipments (
  id                   uuid         primary key default gen_random_uuid(),
  created_at           timestamptz  not null default now(),
  updated_at           timestamptz  not null default now(),
  order_id             uuid,        -- FK to orders added below
  customer_id          uuid         not null references public.customers on delete restrict,
  driver_id            uuid         references public.drivers on delete set null,
  vehicle_id           uuid         references public.vehicles on delete set null,
  cargo_type_id        uuid         references public.cargo_types on delete set null,
  vehicle_type_id      uuid         references public.vehicle_types on delete set null,
  pickup               jsonb        not null default '{}',
  destination          jsonb        not null default '{}',
  weight               numeric(10,2),
  dimensions           jsonb,
  status               text         not null default 'DRAFT'
                                    check (status in (
                                      'DRAFT','REQUESTED','REVIEWED','ASSIGNED','ACCEPTED',
                                      'EN_ROUTE_TO_PICKUP','ARRIVED_AT_PICKUP','PICKED_UP',
                                      'IN_TRANSIT','ARRIVED_AT_DESTINATION','DELIVERED',
                                      'VERIFIED','PAID','CLOSED','CANCELLED','DECLINED',
                                      'FAILED','RETURNED'
                                    )),
  distance_km          numeric(10,2),
  eta                  timestamptz,
  quote_amount         integer,
  scheduled_at         timestamptz,
  special_instructions text,
  photos               text[]       not null default '{}'
);

-- ── 7. orders ─────────────────────────────────────────────────────────────────

create table if not exists public.orders (
  id             uuid         primary key default gen_random_uuid(),
  created_at     timestamptz  not null default now(),
  updated_at     timestamptz  not null default now(),
  customer_id    uuid         not null references public.customers on delete restrict,
  shipment_id    uuid         unique references public.shipments on delete set null,
  subtotal       integer      not null default 0,
  surcharges     integer      not null default 0,
  tax            integer      not null default 0,
  total          integer      not null default 0,
  payment_status text         not null default 'pending'
                              check (payment_status in ('pending','paid','failed','refunded')),
  invoice_no     text         unique
);

-- Now add the circular FK on shipments
alter table public.shipments
  add constraint shipments_order_id_fkey
  foreign key (order_id) references public.orders on delete set null;

-- ── 8. order_items ────────────────────────────────────────────────────────────

create table if not exists public.order_items (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  order_id    uuid         not null references public.orders on delete cascade,
  label       text         not null,
  qty         integer      not null default 1,
  unit_price  integer      not null default 0
);

-- ── 9. shipment_events ────────────────────────────────────────────────────────

create table if not exists public.shipment_events (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  shipment_id uuid         not null references public.shipments on delete cascade,
  event       text         not null,
  actor_id    uuid         references public.profiles on delete set null,
  note        text,
  geo         jsonb
);

-- ── 10. delivery_proofs ───────────────────────────────────────────────────────

create table if not exists public.delivery_proofs (
  id             uuid         primary key default gen_random_uuid(),
  created_at     timestamptz  not null default now(),
  shipment_id    uuid         not null unique references public.shipments on delete cascade,
  photo_urls     text[]       not null default '{}',
  signature_url  text,
  recipient_name text,
  otp_verified   boolean      not null default false,
  notes          text,
  failed_reason  text
);

-- ── 11. driver_locations ──────────────────────────────────────────────────────

create table if not exists public.driver_locations (
  id          uuid          primary key default gen_random_uuid(),
  created_at  timestamptz   not null default now(),
  driver_id   uuid          not null references public.drivers on delete cascade,
  shipment_id uuid          references public.shipments on delete set null,
  lat         numeric(10,7) not null,
  lng         numeric(10,7) not null,
  heading     numeric(5,2),
  speed       numeric(6,2),
  recorded_at timestamptz   not null default now()
);

create index if not exists driver_locations_driver_shipment_idx
  on public.driver_locations (driver_id, shipment_id, recorded_at desc);

-- ── 12. payments ──────────────────────────────────────────────────────────────

create table if not exists public.payments (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  order_id    uuid         not null references public.orders on delete restrict,
  gateway     text         not null default 'paystack',
  reference   text         not null unique,
  amount      integer      not null,
  method      text,
  status      text         not null default 'pending'
                           check (status in ('pending','paid','failed','refunded')),
  fees        integer      not null default 0
);

-- ── 13. refunds ───────────────────────────────────────────────────────────────

create table if not exists public.refunds (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  payment_id  uuid         not null references public.payments on delete restrict,
  amount      integer      not null,
  reason      text,
  status      text         not null default 'pending'
                           check (status in ('pending','processing','completed','failed'))
);

-- ── 14. driver_earnings ───────────────────────────────────────────────────────

create table if not exists public.driver_earnings (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  driver_id   uuid         not null references public.drivers on delete cascade,
  shipment_id uuid         not null references public.shipments on delete restrict,
  amount      integer      not null,
  status      text         not null default 'accrued'
                           check (status in ('accrued','paid'))
);

-- ── 15. payouts ───────────────────────────────────────────────────────────────

create table if not exists public.payouts (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  driver_id   uuid         not null references public.drivers on delete cascade,
  amount      integer      not null,
  method      text,
  status      text         not null default 'pending'
                           check (status in ('pending','processing','paid','failed')),
  paid_at     timestamptz
);

-- ── 16. conversations ─────────────────────────────────────────────────────────

create table if not exists public.conversations (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  shipment_id uuid         references public.shipments on delete cascade,
  type        text         not null
                           check (type in ('customer_admin','customer_driver','admin_driver'))
);

-- ── 17. conversation_participants ─────────────────────────────────────────────

create table if not exists public.conversation_participants (
  id              uuid         primary key default gen_random_uuid(),
  created_at      timestamptz  not null default now(),
  conversation_id uuid         not null references public.conversations on delete cascade,
  profile_id      uuid         not null references public.profiles on delete cascade,
  unique (conversation_id, profile_id)
);

-- ── 18. messages ──────────────────────────────────────────────────────────────

create table if not exists public.messages (
  id              uuid         primary key default gen_random_uuid(),
  created_at      timestamptz  not null default now(),
  conversation_id uuid         not null references public.conversations on delete cascade,
  sender_id       uuid         not null references public.profiles on delete cascade,
  body            text         not null,
  type            text         not null default 'text'
                               check (type in ('text','system','attachment')),
  read_by         uuid[]       not null default '{}'
);

-- ── 19. message_attachments ───────────────────────────────────────────────────

create table if not exists public.message_attachments (
  id           uuid         primary key default gen_random_uuid(),
  created_at   timestamptz  not null default now(),
  message_id   uuid         not null references public.messages on delete cascade,
  storage_path text         not null,
  mime_type    text,
  size_bytes   integer
);

-- ── 20. notifications ─────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id           uuid         primary key default gen_random_uuid(),
  created_at   timestamptz  not null default now(),
  recipient_id uuid         not null references public.profiles on delete cascade,
  type         text         not null,
  payload      jsonb        not null default '{}',
  channels     text[]       not null default '{}',
  read         boolean      not null default false,
  target_url   text
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, read, created_at desc);

-- ── 21. org_settings (singleton) ─────────────────────────────────────────────

create table if not exists public.org_settings (
  id                      uuid         primary key default gen_random_uuid(),
  _singleton              boolean      not null default true unique check (_singleton),
  -- A-34b Organisation
  name                    text         not null default 'Freighter',
  logo_url                text,
  address                 text,
  contact_email           text,
  contact_phone           text,
  tax_id                  text,
  reg_id                  text,
  currency                text         not null default 'NGN',
  timezone                text         not null default 'Africa/Lagos',
  -- A-34i Payments
  payment_gateway         text         not null default 'paystack'
                                       check (payment_gateway in ('paystack','stripe')),
  capture_mode            text         not null default 'prepaid'
                                       check (capture_mode in ('prepaid','on_delivery')),
  payout_schedule         text         not null default 'weekly'
                                       check (payout_schedule in ('daily','weekly','monthly')),
  -- A-34k Messaging
  messaging_enabled       boolean      not null default true,
  attachment_limit_mb     integer      not null default 10,
  message_retention_days  integer      not null default 90,
  -- A-34l Tracking
  gps_interval_seconds    integer      not null default 10,
  geofence_radius_m       integer      not null default 200,
  stale_location_minutes  integer      not null default 5,
  map_provider            text         not null default 'mapbox'
                                       check (map_provider in ('mapbox','google')),
  -- A-34m Delivery verification
  require_photo           boolean      not null default true,
  require_signature       boolean      not null default false,
  require_otp             boolean      not null default true,
  require_recipient_name  boolean      not null default true,
  otp_length              integer      not null default 4,
  otp_expiry_minutes      integer      not null default 10,
  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now()
);

insert into public.org_settings (_singleton) values (true)
  on conflict (_singleton) do nothing;

-- ── 22. pricing_rules (A-34e) ────────────────────────────────────────────────

create table if not exists public.pricing_rules (
  id                   uuid          primary key default gen_random_uuid(),
  created_at           timestamptz   not null default now(),
  updated_at           timestamptz   not null default now(),
  name                 text          not null default 'Standard',
  base_fare            integer       not null default 0,
  per_km_rate          integer       not null default 0,
  per_kg_rate          integer       not null default 0,
  vehicle_multipliers  jsonb         not null default '{}',
  night_surcharge      numeric(4,3)  not null default 0,
  express_surcharge    numeric(4,3)  not null default 0,
  fragile_surcharge    numeric(4,3)  not null default 0,
  hazardous_surcharge  numeric(4,3)  not null default 0,
  min_charge           integer       not null default 0,
  tax_rate             numeric(5,4)  not null default 0.075,
  is_active            boolean       not null default true
);

-- ── 23. service_areas (A-34f) ────────────────────────────────────────────────

create table if not exists public.service_areas (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  state       text         not null,
  city        text,
  enabled     boolean      not null default true,
  surcharge   integer      not null default 0,
  unique (state, city)
);

-- ── 24. notification_settings (A-34j) ────────────────────────────────────────

create table if not exists public.notification_settings (
  id               uuid         primary key default gen_random_uuid(),
  created_at       timestamptz  not null default now(),
  updated_at       timestamptz  not null default now(),
  event_name       text         not null unique,
  label            text         not null,
  email_enabled    boolean      not null default true,
  sms_enabled      boolean      not null default false,
  push_enabled     boolean      not null default true,
  email_subject    text,
  email_template   text,
  sms_template     text
);

insert into public.notification_settings (event_name, label, email_enabled, sms_enabled, push_enabled) values
  ('booking_confirmed',      'Booking Confirmed',          true,  false, true),
  ('driver_assigned',        'Driver Assigned',            true,  true,  true),
  ('pickup_en_route',        'Driver En Route to Pickup',  false, true,  true),
  ('arrived_at_pickup',      'Driver Arrived at Pickup',   false, true,  true),
  ('picked_up',              'Shipment Picked Up',         true,  false, true),
  ('in_transit',             'Shipment In Transit',        false, false, false),
  ('arrived_at_destination', 'Arrived at Destination',     false, true,  true),
  ('delivery_otp',           'Delivery OTP Sent',          false, true,  false),
  ('delivered',              'Shipment Delivered',         true,  false, true),
  ('payment_received',       'Payment Received',           true,  false, false),
  ('payment_failed',         'Payment Failed',             true,  true,  false)
on conflict (event_name) do nothing;

-- ── 25. audit_logs (A-34p) ───────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  actor_id    uuid         references public.profiles on delete set null,
  action      text         not null,
  entity      text         not null,
  entity_id   uuid,
  diff        jsonb
);

create index if not exists audit_logs_actor_idx   on public.audit_logs (actor_id);
create index if not exists audit_logs_entity_idx  on public.audit_logs (entity, entity_id);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ── 26. Staff roles & permissions (A-34c/d) ───────────────────────────────────

create table if not exists public.roles (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  name        text         not null unique,
  description text
);

create table if not exists public.permissions (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  role_id     uuid         not null references public.roles on delete cascade,
  module      text         not null,
  can_view    boolean      not null default false,
  can_create  boolean      not null default false,
  can_edit    boolean      not null default false,
  can_delete  boolean      not null default false,
  can_assign  boolean      not null default false,
  unique (role_id, module)
);

create table if not exists public.admin_users (
  id          uuid         primary key default gen_random_uuid(),
  created_at  timestamptz  not null default now(),
  updated_at  timestamptz  not null default now(),
  profile_id  uuid         not null unique references public.profiles on delete cascade,
  role_id     uuid         references public.roles on delete set null
);

insert into public.roles (name, description) values
  ('super_admin', 'Full access to all modules'),
  ('dispatcher',  'Create and assign shipments'),
  ('finance',     'View orders, payments and reports'),
  ('support',     'View customers and shipments, send messages')
on conflict (name) do nothing;

-- ── updated_at triggers ───────────────────────────────────────────────────────

create trigger vehicle_types_updated_at before update on public.vehicle_types
  for each row execute function public.set_updated_at();

create trigger vehicles_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();

create trigger maintenance_logs_updated_at before update on public.maintenance_logs
  for each row execute function public.set_updated_at();

create trigger cargo_types_updated_at before update on public.cargo_types
  for each row execute function public.set_updated_at();

create trigger customer_addresses_updated_at before update on public.customer_addresses
  for each row execute function public.set_updated_at();

create trigger shipments_updated_at before update on public.shipments
  for each row execute function public.set_updated_at();

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

create trigger refunds_updated_at before update on public.refunds
  for each row execute function public.set_updated_at();

create trigger driver_earnings_updated_at before update on public.driver_earnings
  for each row execute function public.set_updated_at();

create trigger payouts_updated_at before update on public.payouts
  for each row execute function public.set_updated_at();

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

create trigger org_settings_updated_at before update on public.org_settings
  for each row execute function public.set_updated_at();

create trigger pricing_rules_updated_at before update on public.pricing_rules
  for each row execute function public.set_updated_at();

create trigger service_areas_updated_at before update on public.service_areas
  for each row execute function public.set_updated_at();

create trigger notification_settings_updated_at before update on public.notification_settings
  for each row execute function public.set_updated_at();

create trigger admin_users_updated_at before update on public.admin_users
  for each row execute function public.set_updated_at();

-- ── RLS: enable on all new tables ─────────────────────────────────────────────

alter table public.vehicle_types             enable row level security;
alter table public.vehicles                  enable row level security;
alter table public.maintenance_logs          enable row level security;
alter table public.cargo_types               enable row level security;
alter table public.customer_addresses        enable row level security;
alter table public.shipments                 enable row level security;
alter table public.orders                    enable row level security;
alter table public.order_items               enable row level security;
alter table public.shipment_events           enable row level security;
alter table public.delivery_proofs           enable row level security;
alter table public.driver_locations          enable row level security;
alter table public.payments                  enable row level security;
alter table public.refunds                   enable row level security;
alter table public.driver_earnings           enable row level security;
alter table public.payouts                   enable row level security;
alter table public.conversations             enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages                  enable row level security;
alter table public.message_attachments       enable row level security;
alter table public.notifications             enable row level security;
alter table public.org_settings              enable row level security;
alter table public.pricing_rules             enable row level security;
alter table public.service_areas             enable row level security;
alter table public.notification_settings     enable row level security;
alter table public.audit_logs                enable row level security;
alter table public.roles                     enable row level security;
alter table public.permissions               enable row level security;
alter table public.admin_users               enable row level security;

-- ── Helper functions ──────────────────────────────────────────────────────────

create or replace function public.auth_customer_id()
returns uuid language sql stable
security definer set search_path = public as $$
  select id from public.customers where profile_id = auth.uid();
$$;

create or replace function public.auth_driver_id()
returns uuid language sql stable
security definer set search_path = public as $$
  select id from public.drivers where profile_id = auth.uid();
$$;

-- SECURITY DEFINER function so any authenticated user can write audit logs
-- without needing a direct INSERT policy on audit_logs.
create or replace function public.write_audit_log(
  p_action    text,
  p_entity    text,
  p_entity_id uuid  default null,
  p_diff      jsonb default null
) returns void language plpgsql
security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, diff)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_diff);
end;
$$;

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- vehicle_types: any authenticated user reads; admin writes
create policy "vehicle_types_select" on public.vehicle_types
  for select to authenticated using (true);
create policy "vehicle_types_admin_all" on public.vehicle_types
  for all using (public.is_admin()) with check (public.is_admin());

-- cargo_types: same pattern
create policy "cargo_types_select" on public.cargo_types
  for select to authenticated using (true);
create policy "cargo_types_admin_all" on public.cargo_types
  for all using (public.is_admin()) with check (public.is_admin());

-- vehicles: admin full; driver reads their own assigned vehicle
create policy "vehicles_admin_all" on public.vehicles
  for all using (public.is_admin()) with check (public.is_admin());
create policy "vehicles_driver_read" on public.vehicles
  for select using (
    exists (
      select 1 from public.drivers
      where profile_id = auth.uid() and current_vehicle_id = vehicles.id
    )
  );

-- maintenance_logs: admin only
create policy "maintenance_logs_admin_all" on public.maintenance_logs
  for all using (public.is_admin()) with check (public.is_admin());

-- customer_addresses: own customer + admin
create policy "customer_addresses_own" on public.customer_addresses
  for all
  using (customer_id = public.auth_customer_id() or public.is_admin())
  with check (customer_id = public.auth_customer_id() or public.is_admin());

-- shipments: customer own, driver assigned, admin all
create policy "shipments_customer_select" on public.shipments
  for select using (customer_id = public.auth_customer_id());
create policy "shipments_customer_insert" on public.shipments
  for insert with check (customer_id = public.auth_customer_id());
create policy "shipments_driver_select" on public.shipments
  for select using (driver_id = public.auth_driver_id());
create policy "shipments_driver_update" on public.shipments
  for update
  using (driver_id = public.auth_driver_id())
  with check (driver_id = public.auth_driver_id());
create policy "shipments_admin_all" on public.shipments
  for all using (public.is_admin()) with check (public.is_admin());

-- orders: customer own, admin all
create policy "orders_customer_select" on public.orders
  for select using (customer_id = public.auth_customer_id());
create policy "orders_customer_insert" on public.orders
  for insert with check (customer_id = public.auth_customer_id());
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

-- order_items: via order access
create policy "order_items_customer_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and orders.customer_id = public.auth_customer_id()
    )
  );
create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

-- shipment_events: customer/driver read; driver insert for their shipments; admin all
create policy "shipment_events_customer_select" on public.shipment_events
  for select using (
    exists (
      select 1 from public.shipments
      where shipments.id = shipment_events.shipment_id
        and shipments.customer_id = public.auth_customer_id()
    )
  );
create policy "shipment_events_driver_select" on public.shipment_events
  for select using (
    exists (
      select 1 from public.shipments
      where shipments.id = shipment_events.shipment_id
        and shipments.driver_id = public.auth_driver_id()
    )
  );
create policy "shipment_events_driver_insert" on public.shipment_events
  for insert with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.shipments
      where shipments.id = shipment_events.shipment_id
        and shipments.driver_id = public.auth_driver_id()
    )
  );
create policy "shipment_events_admin_all" on public.shipment_events
  for all using (public.is_admin()) with check (public.is_admin());

-- delivery_proofs: customer read, driver all for their shipments, admin all
create policy "delivery_proofs_customer_select" on public.delivery_proofs
  for select using (
    exists (
      select 1 from public.shipments
      where shipments.id = delivery_proofs.shipment_id
        and shipments.customer_id = public.auth_customer_id()
    )
  );
create policy "delivery_proofs_driver_all" on public.delivery_proofs
  for all
  using (
    exists (
      select 1 from public.shipments
      where shipments.id = delivery_proofs.shipment_id
        and shipments.driver_id = public.auth_driver_id()
    )
  )
  with check (
    exists (
      select 1 from public.shipments
      where shipments.id = delivery_proofs.shipment_id
        and shipments.driver_id = public.auth_driver_id()
    )
  );
create policy "delivery_proofs_admin_all" on public.delivery_proofs
  for all using (public.is_admin()) with check (public.is_admin());

-- driver_locations: driver inserts own; customer reads on their active shipment; admin all
create policy "driver_locations_driver_insert" on public.driver_locations
  for insert with check (driver_id = public.auth_driver_id());
create policy "driver_locations_driver_select" on public.driver_locations
  for select using (driver_id = public.auth_driver_id());
create policy "driver_locations_customer_select" on public.driver_locations
  for select using (
    exists (
      select 1 from public.shipments
      where shipments.id = driver_locations.shipment_id
        and shipments.customer_id = public.auth_customer_id()
    )
  );
create policy "driver_locations_admin_all" on public.driver_locations
  for all using (public.is_admin()) with check (public.is_admin());

-- payments: customer read own; admin all
create policy "payments_customer_select" on public.payments
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = payments.order_id
        and orders.customer_id = public.auth_customer_id()
    )
  );
create policy "payments_admin_all" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- refunds: customer read own; admin all
create policy "refunds_customer_select" on public.refunds
  for select using (
    exists (
      select 1 from public.payments
      join public.orders on orders.id = payments.order_id
      where payments.id = refunds.payment_id
        and orders.customer_id = public.auth_customer_id()
    )
  );
create policy "refunds_admin_all" on public.refunds
  for all using (public.is_admin()) with check (public.is_admin());

-- driver_earnings: driver reads own; admin all
create policy "driver_earnings_driver_select" on public.driver_earnings
  for select using (driver_id = public.auth_driver_id());
create policy "driver_earnings_admin_all" on public.driver_earnings
  for all using (public.is_admin()) with check (public.is_admin());

-- payouts: driver reads own; admin all
create policy "payouts_driver_select" on public.payouts
  for select using (driver_id = public.auth_driver_id());
create policy "payouts_admin_all" on public.payouts
  for all using (public.is_admin()) with check (public.is_admin());

-- conversations: participants read; admin all
create policy "conversations_participant_select" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = conversations.id
        and conversation_participants.profile_id = auth.uid()
    )
    or public.is_admin()
  );
create policy "conversations_admin_all" on public.conversations
  for all using (public.is_admin()) with check (public.is_admin());

-- conversation_participants: own membership visible to co-participants; admin all
create policy "conv_participants_select" on public.conversation_participants
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.conversation_participants cp
      where cp.conversation_id = conversation_participants.conversation_id
        and cp.profile_id = auth.uid()
    )
    or public.is_admin()
  );

-- messages: participants read/insert; admin all
create policy "messages_participant_select" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
        and conversation_participants.profile_id = auth.uid()
    )
    or public.is_admin()
  );
create policy "messages_sender_insert" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_participants
      where conversation_participants.conversation_id = messages.conversation_id
        and conversation_participants.profile_id = auth.uid()
    )
  );
create policy "messages_sender_update" on public.messages
  for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy "messages_admin_all" on public.messages
  for all using (public.is_admin()) with check (public.is_admin());

-- message_attachments: via message participant access; admin all
create policy "msg_attachments_select" on public.message_attachments
  for select using (
    exists (
      select 1 from public.messages
      join public.conversation_participants on
        conversation_participants.conversation_id = messages.conversation_id
        and conversation_participants.profile_id = auth.uid()
      where messages.id = message_attachments.message_id
    )
    or public.is_admin()
  );
create policy "msg_attachments_insert" on public.message_attachments
  for insert with check (
    exists (
      select 1 from public.messages
      where messages.id = message_attachments.message_id
        and messages.sender_id = auth.uid()
    )
  );

-- notifications: own read/update; admin all
create policy "notifications_own_read" on public.notifications
  for select using (recipient_id = auth.uid());
create policy "notifications_own_update" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "notifications_admin_all" on public.notifications
  for all using (public.is_admin()) with check (public.is_admin());

-- org_settings: admin only
create policy "org_settings_admin_all" on public.org_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- pricing_rules: authenticated read; admin write
create policy "pricing_rules_select" on public.pricing_rules
  for select to authenticated using (true);
create policy "pricing_rules_admin_all" on public.pricing_rules
  for all using (public.is_admin()) with check (public.is_admin());

-- service_areas: authenticated read; admin write
create policy "service_areas_select" on public.service_areas
  for select to authenticated using (true);
create policy "service_areas_admin_all" on public.service_areas
  for all using (public.is_admin()) with check (public.is_admin());

-- notification_settings: admin only
create policy "notification_settings_admin_all" on public.notification_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- audit_logs: admin read; no direct insert (use write_audit_log RPC)
create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.is_admin());

-- roles: admin read/write
create policy "roles_admin_all" on public.roles
  for all using (public.is_admin()) with check (public.is_admin());

-- permissions: admin all
create policy "permissions_admin_all" on public.permissions
  for all using (public.is_admin()) with check (public.is_admin());

-- admin_users: own row readable; admin all
create policy "admin_users_own_select" on public.admin_users
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "admin_users_admin_all" on public.admin_users
  for all using (public.is_admin()) with check (public.is_admin());

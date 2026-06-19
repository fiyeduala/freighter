# Freighter — Product & UX Blueprint (MVP)

A logistics management platform for transporting heavy goods and cargo between states and cities.
Three roles: **Logistics Admin**, **Driver**, **Customer**.

> **Note on the dashboard image:** the source PDF references an uploaded dashboard design as the
> visual foundation. That image was not provided, so this document defines the *structural*
> architecture (every screen, its contents, interactions and states). When the dashboard image is
> available, the visual layer (exact layout, colour system, spacing) is applied on top — the
> screen architecture below does not change.

---

## 0. How to read this document

- **Screen IDs** are stable references used throughout: `S-` shared/auth, `A-` admin,
  `C-` customer, `D-` driver, `M-` messaging. Use these IDs when handing work to designers/devs.
- **States convention** (applies to every screen unless a screen lists its own):
  - *Loading* — skeletons for content regions; never block the whole shell.
  - *Empty* — friendly illustration + one-line explanation + primary CTA.
  - *Error* — inline error for a region; full-page error only for route-level failures; always a retry.
  - *Success* — toast for actions; inline confirmation for multi-step flows.
  - *Permission-denied* — role-gated routes redirect to that role's dashboard with a toast.
  - *Offline* (driver) — queued actions banner; sync on reconnect.
  Screen entries below only call out states that differ from or extend this convention.

---

## 1. Product Architecture

### 1.1 Roles & surfaces
| Role | Surface | Primary device | Auth entry |
|---|---|---|---|
| Logistics Admin | Admin Dashboard | Desktop web | Invited (no self-signup) |
| Customer | Customer Portal | Responsive web | Self sign-up |
| Driver | Driver App | Mobile-first (PWA) | Invited by admin, completes onboarding |

Single React codebase, **role-gated routing**. After auth, the user's `role` determines which
app shell loads. Shared modules (auth, messaging, notifications, profile) are written once and
reused across roles with role-aware data scoping.

### 1.2 Order vs Shipment (important distinction)
The PDF lists both "Orders" and "Shipments". They are **two views of one journey**:
- **Order** = the commercial record — the booking, the quote, pricing line items, invoice and
  payment status. It answers *"what was bought and is it paid for?"*
- **Shipment** = the operational record — the physical movement: pickup, driver, vehicle, route,
  tracking events, proof of delivery. It answers *"where is the cargo and what's its status?"*

In MVP, **one Order maps to one Shipment** (1:1). They share an ID prefix so staff can move
between them. Admin "Orders" module focuses on money/invoicing; "Shipments" focuses on operations.

### 1.3 Shipment lifecycle (the spine of the whole system)
```
DRAFT → REQUESTED → REVIEWED → ASSIGNED → ACCEPTED → EN_ROUTE_TO_PICKUP
→ ARRIVED_AT_PICKUP → PICKED_UP → IN_TRANSIT → ARRIVED_AT_DESTINATION
→ DELIVERED → VERIFIED → PAID → CLOSED
                                   �‖ (side states)
                          CANCELLED / DECLINED / FAILED / RETURNED
```
Every status change writes a `shipment_event` row (the audit + timeline + tracking feed).

---

## 2. Tech Stack & Integrations

Locked by you: **React + TypeScript**, fresh project, **Vercel** (deploy), **GitHub** (source),
**Supabase** (database). Recommended complete stack:

### 2.1 Frontend
- **React 18 + TypeScript + Vite** — fast fresh-project baseline (no Next.js needed since Supabase
  is the backend; Vite + Vercel SPA is simpler and cheaper to run).
- **React Router v6** — routing & role-gated layouts.
- **Tailwind CSS + shadcn/ui** (Radix primitives) — dashboard-grade components, accessible, themeable.
- **TanStack Query** — server state, caching, optimistic updates (pairs perfectly with Supabase).
- **Zustand** — light client/UI state (map view, filters, online toggle).
- **React Hook Form + Zod** — forms + schema validation (Zod schemas shared with Supabase types).
- **Recharts** — reporting charts.
- **Mapbox GL JS** (or Google Maps JS API) — maps, routing, ETA, geocoding. Mapbox recommended for
  cost + customisation; Google if you prefer its routing accuracy in Nigeria.
- **date-fns** — dates; **lucide-react** — icons.

### 2.2 Backend (Supabase)
- **Postgres** — primary DB.
- **Auth** — email/password + email verification; role stored in `profiles`.
- **Row Level Security (RLS)** — enforces that customers see only their data, drivers only their
  jobs, admins everything. Non-negotiable; defined per table in §9.
- **Storage** — cargo photos, proof-of-delivery, driver documents, message attachments, avatars.
- **Realtime** — live tracking channels + messaging + notifications.
- **Edge Functions** (Deno) — server-side logic that must not run on the client:
  quote calculation, driver auto-assignment, payment webhook handling, notification dispatch,
  ETA computation, invoice/receipt generation.

### 2.3 External integrations
- **Payments:** Stripe *or* **Paystack** (Paystack recommended for Nigeria — cards, bank transfer,
  USSD). *(Note: your voice note said "link it with test program" — if that meant a specific
  payment tool, swap it in here. Otherwise Paystack is the default.)*
- **Maps/Routing/ETA:** Mapbox or Google Maps.
- **SMS / OTP:** Termii (Nigeria) or Twilio — delivery OTP + driver alerts.
- **Push notifications:** Firebase Cloud Messaging / Web Push.
- **Transactional email:** Resend (or Supabase + SMTP).

### 2.4 Tooling, testing, CI/CD
- **Vitest + React Testing Library** (unit/component), **Playwright** (E2E critical flows).
- **ESLint + Prettier + Husky + lint-staged** — code quality gates.
- **GitHub Actions** — lint, type-check, test on PR; deploy to Vercel on merge to `main`.
- **Vercel** — preview deploys per PR; production on `main`. Env vars for Supabase + integration keys.
- **Supabase CLI** — migrations in version control (`/supabase/migrations`), local dev DB.

### 2.5 Driver mobile path
MVP ships the driver app as a **mobile-first responsive PWA** (installable, offline-capable for
queued status updates). Future: **React Native / Expo** native app reusing the same Supabase backend.

---

## 3. Information Architecture (sitemap per role)

### 3.1 Shared / Auth
```
/login  /register  /forgot-password  /reset-password  /verify-email  /onboarding  /* (404)
```

### 3.2 Admin (`/admin`)
```
/admin
├── /                      Dashboard Overview
├── /shipments             list → /shipments/:id  → /shipments/new  → /shipments/:id/assign
├── /tracking              fleet map → /tracking/:shipmentId
├── /orders                list → /orders/:id  → /orders/:id/invoice
├── /customers             list → /customers/:id  → /customers/new  → /customers/:id/edit
├── /drivers               list → /drivers/:id  → /drivers/new  → /drivers/:id/edit  → /drivers/:id/verify
├── /fleet                 vehicles list → /fleet/:id  → /fleet/new  → /fleet/:id/edit
│   └── /fleet/maintenance maintenance logs → /fleet/maintenance/new
├── /payments              list → /payments/:id  → /payments/payouts  → /payments/refunds
├── /reports               overview → /reports/revenue  /deliveries  /fleet  /drivers  /customers
├── /messages              inbox → /messages/:conversationId
├── /notifications
└── /settings              (fully expanded in §7.4)
```

### 3.3 Customer (`/app`)
```
/app
├── /                      Dashboard
├── /shipments/new         Create Shipment (wizard)
├── /tracking              Track Shipment → /tracking/:id
├── /history               Shipment History → /history/:id
├── /messages              inbox → /messages/:conversationId
├── /payments              methods + transactions → /payments/:id
├── /notifications
└── /profile               profile → /profile/addresses  /profile/security  /profile/notifications
```

### 3.4 Driver (`/driver`)
```
/driver
├── /                      Dashboard (online/offline)
├── /jobs                  Assigned Jobs → /jobs/:id (accept/decline)
├── /trips                 Active Trips → /trips/:id
│   ├── /trips/:id/route   Route Details
│   ├── /trips/:id/navigate Navigation
│   └── /trips/:id/confirm Delivery Confirmation (POD)
├── /messages              inbox → /messages/:conversationId
├── /notifications
├── /earnings              earnings → /earnings/payouts
└── /profile               profile → /profile/documents  /profile/vehicle  /profile/availability
```

---

## 4. Navigation Structure

- **Admin:** persistent left sidebar (the 10 modules) + top bar (global search, notifications bell,
  messages, admin avatar menu → profile/settings/logout). Detail screens open in-place with a
  breadcrumb back to their list. Assign/edit use side-drawers or modals so context is never lost.
- **Customer:** top nav (Dashboard, Track, History, Messages, Payments) + prominent **"New Shipment"**
  button + notifications bell + avatar menu. Mobile: bottom tab bar (Home, Track, +New, Messages, Profile).
- **Driver:** bottom tab bar (Dashboard, Jobs, Trips, Messages, Earnings) + top bar with online/offline
  toggle + notifications. Active-trip screens are full-screen with a sticky action bar.
- **Cross-cutting:** notifications and messages are reachable from every screen; clicking a
  notification deep-links to the relevant shipment/order/conversation.

---

## 5. Screen Inventory (master list)

**Shared / Auth**
- S-01 Login · S-02 Register · S-03 Forgot Password · S-04 Reset Password · S-05 Verify Email
- S-06 Onboarding (role-aware) · S-07 404 / Not Found · S-08 Global Error

**Admin**
- A-01 Dashboard Overview
- A-02 Shipments List · A-03 Shipment Detail · A-04 Create Shipment · A-05 Assign Driver/Vehicle
- A-06 Live Tracking — Fleet Map · A-07 Live Tracking — Shipment Detail
- A-08 Orders List · A-09 Order Detail · A-10 Invoice
- A-11 Customers List · A-12 Customer Detail · A-13 Add/Edit Customer
- A-14 Drivers List · A-15 Driver Detail · A-16 Add/Invite Driver · A-17 Driver Verification
- A-18 Fleet — Vehicles List · A-19 Vehicle Detail · A-20 Add/Edit Vehicle
- A-21 Vehicle Assignment · A-22 Maintenance Logs · A-23 Add Maintenance Log
- A-24 Payments List · A-25 Payment Detail · A-26 Payouts · A-27 Refunds
- A-28 Reports Overview · A-29 Revenue · A-30 Deliveries · A-31 Fleet Performance
- A-32 Driver Performance · A-33 Customer Activity
- A-34 Settings (hub) and all sub-pages A-34a … A-34q (see §7.4)

**Customer**
- C-01 Dashboard · C-02 Create Shipment (wizard) · C-03 Track — List · C-04 Track — Detail
- C-05 Shipment History · C-06 History Detail · C-07 Payments · C-08 Payment Detail
- C-09 Notifications · C-10 Profile · C-11 Saved Addresses · C-12 Security · C-13 Notification Prefs

**Driver**
- D-01 Dashboard · D-02 Assigned Jobs · D-03 Job Detail · D-04 Active Trips · D-05 Trip Detail
- D-06 Route Details · D-07 Navigation · D-08 Delivery Confirmation
- D-09 Earnings · D-10 Payout History · D-11 Notifications
- D-12 Profile · D-13 Documents · D-14 Vehicle · D-15 Availability

**Messaging (shared)**
- M-01 Inbox · M-02 Chat Screen

---

## 6. Core User Flows

### 6.1 Customer creates a shipment (happy path)
1. C-01 Dashboard → "New Shipment" → **C-02 wizard**:
   Pickup → Destination → Cargo (type, weight, dimensions, photos) → Vehicle type → Schedule
   → **Review** → **Quote** (edge function prices it) → **Pay** (Paystack) → **Confirmation**.
2. Order created (`REQUESTED`), Shipment created, Admin notified.
3. Customer lands on C-04 Track — Detail showing status `REQUESTED`.

### 6.2 Admin reviews & assigns
1. A-01 alert / A-02 list (Pending tab) → **A-03 Shipment Detail**.
2. Admin reviews cargo/route → **A-05 Assign** (pick available driver + compatible vehicle; system
   filters by capacity, location, status) → status `ASSIGNED` → Driver notified.

### 6.3 Driver executes
1. D-01 → **D-03 Job Detail** → Accept (`ACCEPTED`) or Decline (back to admin queue).
2. **D-05 Active Trip** drives status: En route to pickup → Arrived → **Picked up** (`PICKED_UP`/
   `IN_TRANSIT`, live tracking begins) → Navigation → Arrived at destination.
3. **D-08 Delivery Confirmation**: photo + recipient name + signature + **OTP** (sent to customer)
   → `DELIVERED` → `VERIFIED`.

### 6.4 Settlement & close
1. Payment captured at booking (prepaid) or on delivery (configurable) → `PAID`.
2. Driver earning recorded; admin payout later (A-26).
3. Customer prompted to **rate** delivery → Shipment `CLOSED`.

### 6.5 Live tracking (continuous, §7.6)
Driver app emits location → Supabase Realtime → customer (C-04) and admin (A-07) see live marker,
route progress, ETA, status. Tracking active only between `PICKED_UP` and `DELIVERED`.

### 6.6 Messaging (any time)
Customer↔Driver, Customer↔Admin, Admin↔Driver — threaded per shipment (M-01/M-02).

---

## 7. Screen-by-Screen Breakdown

Each entry: **Purpose · User goal · Contents · Actions · Connected screens · Notable states.**

### 7.0 Shared / Auth

**S-01 Login** — *Purpose:* authenticate. *Goal:* get into my workspace. *Contents:* email, password,
"remember me", forgot-password link, register link, role auto-detected post-login. *Actions:* submit,
recover, go to register. *Connected:* S-03, S-02, role dashboard. *States:* invalid credentials,
unverified-email (offer resend), locked-after-N-attempts.

**S-02 Register** — *Purpose:* customer self sign-up (drivers/admins are invited). *Goal:* create
account. *Contents:* name, email, phone, password, terms. *Actions:* submit → S-05. *Connected:*
S-01, S-05. *States:* email-already-exists, weak-password.

**S-03 Forgot Password** / **S-04 Reset Password** — request reset link / set new password.
*States:* expired/invalid token, success → S-01.

**S-05 Verify Email** — confirm via emailed link/code; resend with cooldown. *States:* expired code,
already-verified.

**S-06 Onboarding** — role-aware first-run. *Customer:* add a saved address (optional).
*Driver:* upload licence + documents, set vehicle/availability → goes to A-17 admin verification
queue. *Admin:* set org name/logo (first admin only). *States:* incomplete-required-docs blocks driver activation.

**S-07 404 / S-08 Global Error** — wrong route / route crash; CTA back to dashboard; retry.

---

### 7.1 Admin

**A-01 Dashboard Overview** — *Purpose:* operational command centre. *Goal:* see what needs action
now. *Contents:* KPI cards (active shipments, in-transit, delivered today, revenue today/MTD,
pending assignments, available drivers, available vehicles); mini live map; "Needs attention" queue
(unassigned shipments, failed payments, maintenance due); recent shipments table; alerts feed.
*Actions:* jump to any flagged item, quick-create shipment, filter by date range. *Connected:* A-02,
A-05, A-06, A-24. *States:* empty (new platform → setup checklist), partial-data.

**A-02 Shipments List** — *Purpose:* manage all shipments. *Contents:* status tabs (All, Pending,
Assigned, In-Transit, Delivered, Cancelled), search, filters (date, customer, driver, route, vehicle
type), sortable table (ID, customer, route, status, driver, vehicle, value, created), bulk select.
*Actions:* open detail, create, assign, export, bulk-cancel. *Connected:* A-03, A-04, A-05.
*States:* empty-per-tab, filter-no-results.

**A-03 Shipment Detail** — *Purpose:* single source of truth for one shipment. *Contents:* header
(ID, status badge, value); **timeline** (every `shipment_event`); cargo card (type, weight, dims,
photos); route card (pickup→dropoff, distance, ETA, mini map); assignment card (driver + vehicle);
customer card; **linked order/payment**; documents (POD when available); activity/audit; embedded
message thread. *Actions:* assign/reassign (A-05), edit (status-permitting), cancel, message customer
or driver, download invoice, open live tracking (A-07). *Connected:* A-05, A-07, A-09, M-02.
*States:* unassigned (prominent Assign CTA), cancelled (read-only + reason), delivered-unpaid (flag).

**A-04 Create Shipment** — admin books on a customer's behalf (phone orders). Same wizard as C-02 plus
a customer picker / quick-create customer. *States:* customer-not-found → inline create.

**A-05 Assign Driver/Vehicle** — *Purpose:* match shipment to resources. *Contents:* eligible drivers
(online, free, near pickup) with current load; compatible vehicles (capacity ≥ cargo, available,
maintenance-OK); estimated cost/payout. *Actions:* select driver, select vehicle, confirm → notifies
driver, status `ASSIGNED`. *Connected:* A-03, A-14, A-18. *States:* no-eligible-driver,
no-compatible-vehicle (suggest relax filters), reassign (warns/notifies current driver).

**A-06 Live Tracking — Fleet Map** — *Purpose:* see all active movement. *Contents:* map with all
in-transit shipments as markers; side list (driver, shipment, status, ETA); filters (status, region,
driver). *Actions:* click marker/row → A-07, search. *Connected:* A-07. *States:* no-active-shipments,
stale-location (>N min → amber marker), driver-offline.

**A-07 Live Tracking — Shipment Detail** — *Contents:* full-screen map, live driver marker, planned
route + traveled path, pickup/dropoff pins, ETA, current status, geofence arrival events, contact
buttons. *Actions:* message driver, call, view shipment (A-03). *States:* tracking-not-started
(before pickup), gps-lost (last-known + timestamp), arrived (geofence highlight).

**A-08 Orders List** — *Purpose:* commercial/billing view. *Contents:* orders (ID, customer, amount,
payment status: paid/pending/failed/refunded, linked shipment status, date), filters. *Actions:*
open A-09, export, filter by payment status. *Connected:* A-09. *States:* empty, payment-failed group.

**A-09 Order Detail** — *Contents:* line items (base + distance + weight + surcharges + tax),
totals, payment status/method/reference, linked shipment link, invoice. *Actions:* generate/resend
invoice (A-10), issue refund (A-27), mark paid (manual/bank transfer), open shipment. *States:*
unpaid, refunded, partially-refunded.

**A-10 Invoice** — printable/downloadable invoice (PDF via edge function); org branding, line items,
tax, payment status. *Actions:* download, email to customer, print.

**A-11 Customers List** — *Contents:* customers (name, contact, #shipments, lifetime value, status),
search, filters. *Actions:* open A-12, add (A-13), suspend/activate, export. *States:* empty.

**A-12 Customer Detail** — *Contents:* profile, saved addresses, shipment history, orders/payments,
message thread, activity. *Actions:* edit, message, suspend/activate, create shipment for them.
*Connected:* A-13, A-04, M-02. *States:* suspended (banner), no-shipments-yet.

**A-13 Add/Edit Customer** — form (name, email, phone, company, default address). *States:*
duplicate-email, validation errors.

**A-14 Drivers List** — *Contents:* drivers (name, status online/offline/on-trip, verification
status, assigned vehicle, rating, active job), search/filters. *Actions:* open A-15, invite (A-16),
verify (A-17), suspend/activate. *States:* pending-verification group, no-drivers.

**A-15 Driver Detail** — *Contents:* profile + documents/licence (with expiry), assigned vehicle,
current/upcoming jobs, performance (on-time %, completed, cancellations, rating), earnings & payouts,
trip history, message thread. *Actions:* assign vehicle, edit, verify/re-verify, suspend, message.
*Connected:* A-16, A-17, A-21, M-02. *States:* unverified, documents-expiring/expired (flag),
suspended.

**A-16 Add/Invite Driver** — send invite (email/phone) → driver completes S-06 onboarding. *Contents:*
name, contact, optionally pre-assign vehicle. *States:* invite-sent, invite-pending, resend.

**A-17 Driver Verification** — *Purpose:* approve docs before a driver can take jobs. *Contents:*
document viewer (licence, ID, vehicle papers, insurance), checklist, approve/reject with reason.
*Actions:* approve → driver active; reject → driver notified to re-upload. *States:* awaiting-docs,
under-review, rejected, approved.

**A-18 Fleet — Vehicles List** — *Contents:* vehicles (plate, type, capacity, status:
available/in-use/maintenance, assigned driver, next service), filters. *Actions:* open A-19, add
(A-20), assign (A-21), set status, export. *States:* maintenance-due group, no-vehicles.

**A-19 Vehicle Detail** — *Contents:* specs (type, capacity weight/volume, plate, year), status,
assigned driver, current shipment, **maintenance history**, document/insurance expiry, utilisation.
*Actions:* edit, assign driver (A-21), log maintenance (A-23), change status, retire. *Connected:*
A-21, A-22, A-23. *States:* in-maintenance (unavailable for assignment), docs-expiring.

**A-20 Add/Edit Vehicle** — form (type, plate, capacity, year, documents, photos). *States:*
duplicate-plate.

**A-21 Vehicle Assignment** — link a vehicle to a driver (default vehicle) and/or to a specific
shipment. *Contents:* eligible vehicles/drivers, conflict check. *States:* vehicle-busy,
driver-already-has-vehicle (confirm reassign).

**A-22 Maintenance Logs** — *Contents:* log list (vehicle, type, date, cost, status, next due),
filters. *Actions:* add (A-23), mark complete, filter by vehicle. *States:* overdue group, empty.

**A-23 Add Maintenance Log** — form (vehicle, type, description, cost, date, next-due, set
vehicle to maintenance?). *States:* sets vehicle unavailable while open.

**A-24 Payments List** — *Contents:* transactions (ref, order, customer, amount, method, status,
date), filters by status/method/date. *Actions:* open A-25, export, reconcile, go to payouts/refunds.
*States:* failed group, pending settlement.

**A-25 Payment Detail** — *Contents:* gateway reference, order/shipment links, status timeline,
method, fees, refunds against it. *Actions:* refund (A-27), retry, download receipt. *States:*
failed, refunded, disputed.

**A-26 Payouts** — *Purpose:* pay drivers their earnings. *Contents:* per-driver accrued earnings,
payout history, pending payouts. *Actions:* create payout, mark paid, export. *States:* nothing-due,
pending.

**A-27 Refunds** — list + issue refund (full/partial, reason) tied to a payment. *States:*
refund-pending, refund-failed.

**A-28 Reports Overview** — *Contents:* date-range picker + headline metrics + links to the five
report types + recent exports. *Actions:* set range, open a report, export all. *States:*
insufficient-data.

**A-29 Revenue** — gross/net revenue over time, by route/vehicle-type/customer; charts + table.
**A-30 Deliveries** — volume, on-time vs late, success/fail/return rates, by region.
**A-31 Fleet Performance** — utilisation, downtime, maintenance cost, cost-per-km per vehicle.
**A-32 Driver Performance** — completed, on-time %, ratings, cancellations, earnings, leaderboard.
**A-33 Customer Activity** — new vs returning, top customers, LTV, frequency, churn signals.
All five: *Actions:* filter, drill-down, export CSV/PDF. *States:* empty-range, export-generating.

#### 7.4 Settings (A-34) — fully expanded

Settings is a **hub (A-34)** with a left sub-nav; each item is its own screen:

- **A-34a My Account** — admin's own name, email, phone, avatar, language, change password.
- **A-34b Organisation** — company name, logo, address, contact, registration/tax IDs, currency,
  timezone. *Feeds:* invoices (A-10), branding everywhere.
- **A-34c Team & Users** — list admin/staff users, invite, deactivate, assign role. *Connected:* A-34d.
- **A-34d Roles & Permissions** — roles (Super Admin, Dispatcher, Finance, Support…) with granular
  permission toggles per module (view/create/edit/delete/assign). *Feeds:* what each admin can do.
- **A-34e Pricing & Rates** — base fare, per-km rate, per-kg rate, vehicle-type multipliers,
  surcharges (night/express/fragile), minimum charge, tax rate. *Feeds:* quote engine (C-02/A-04).
- **A-34f Service Areas / Zones** — states & cities served, lane/route enablement, zone surcharges.
  *Feeds:* which pickup/destination pairs are bookable.
- **A-34g Vehicle Types** — define types (e.g., flatbed, box truck, trailer) with capacity ranges &
  icons. *Feeds:* A-20 vehicles, C-02 vehicle selection, A-05 compatibility.
- **A-34h Cargo Types** — categories (general, fragile, perishable, hazardous) with handling rules.
  *Feeds:* C-02 cargo step, surcharges.
- **A-34i Payments** — gateway selection + keys (Paystack/Stripe), currency, capture mode
  (prepaid vs on-delivery), tax/fees, payout schedule. *Feeds:* all payment flows.
- **A-34j Notifications** — per-event channel matrix (email/SMS/push) and templates for: booking,
  assignment, pickup, in-transit, delivery OTP, delivered, payment, etc. *Feeds:* notification dispatch.
- **A-34k Messaging** — enable channels, auto-replies, attachment limits, retention.
- **A-34l Tracking** — GPS ping interval, geofence radius for pickup/dropoff arrival, stale-location
  threshold, map provider. *Feeds:* §7.6 tracking behaviour.
- **A-34m Delivery Verification** — which proofs are required (photo / signature / OTP / recipient
  name), OTP length & expiry. *Feeds:* D-08.
- **A-34n Integrations** — maps key, SMS provider, email provider, push (FCM), webhooks; connection
  status + test buttons.
- **A-34o Security** — 2FA enforcement, session management/active sessions, password policy,
  IP allowlist (optional).
- **A-34p Audit Log** — searchable record of every admin action (who/what/when) from `audit_logs`.
- **A-34q Appearance & Danger Zone** — theme/branding accents; data export; **danger zone**
  (deactivate org, delete with confirmation).

*Settings states:* unsaved-changes guard, save-success toast, key-validation (e.g., test gateway
keys before save), permission-gated items hidden for non-super-admins.

---

### 7.2 Customer

**C-01 Dashboard** — *Goal:* book or check on cargo fast. *Contents:* big "New Shipment" CTA,
active shipments cards (status + ETA + track button), recent history, outstanding payment banner,
notifications snapshot. *Actions:* create, track, pay, open messages. *Connected:* C-02, C-04, C-07.
*States:* first-time (onboarding nudge + how-it-works), no-active (history only).

**C-02 Create Shipment (wizard)** — *Goal:* book a delivery. *Steps:*
1) **Pickup** (address w/ map + autocomplete, contact, date/time window),
2) **Destination** (same),
3) **Cargo** (type from A-34h, weight, dimensions, quantity, photos, special instructions),
4) **Vehicle type** (from A-34g, filtered by cargo),
5) **Schedule** (now / scheduled),
6) **Review**,
7) **Quote** (live price from edge function using A-34e rates + distance),
8) **Payment** (Paystack; or pay-on-delivery if enabled),
9) **Confirmation** (shipment ID + track link).
*Actions:* next/back, save draft, edit any step, pay. *Connected:* C-04. *States:* per-step validation,
route-not-served (A-34f), quote-failed (retry), payment-failed (retry, draft preserved), draft-resume.

**C-03 Track — List** — active shipments with live status + ETA. *Actions:* open C-04. *States:*
none-active.

**C-04 Track — Detail** — *Contents:* live map (driver marker, route, ETA), status timeline, driver
card (name, vehicle, rating, call/message), cargo summary, delivery OTP display (when out for
delivery), POD after delivery. *Actions:* message/call driver, copy OTP, view receipt, rate (after
delivery). *Connected:* M-02, C-08. *States:* requested (no driver yet), assigned (driver shown,
tracking pending), in-transit (live), delivered (POD + rate prompt), cancelled.

**C-05 Shipment History** — completed/cancelled shipments, filters, search. *Actions:* open C-06,
reorder (prefill C-02), download receipt, rate. *States:* empty.

**C-06 History Detail** — read-only past shipment: full timeline, POD, invoice/receipt, rating given,
rebook. *Actions:* download, rebook, message (reopens thread).

**C-07 Payments** — *Contents:* saved methods, transaction history, outstanding balances, receipts.
*Actions:* add/remove method, pay outstanding, download receipt, open C-08. *States:* no-methods,
payment-due banner.

**C-08 Payment Detail** — one transaction: amount, method, status, linked shipment, receipt download,
refund status. *States:* failed (retry), refunded.

**C-09 Notifications** — chronological list, unread badges, deep-links. *Actions:* mark read,
open target, manage prefs (C-13). *States:* empty, all-read.

**C-10 Profile** — name, photo, contact, company. *Connected:* C-11, C-12, C-13.
**C-11 Saved Addresses** — manage frequent pickup/drop locations (used in C-02). *Actions:* add/edit/
delete, set default. *States:* none-saved.
**C-12 Security** — change password, 2FA, active sessions.
**C-13 Notification Prefs** — per-event channel toggles (within admin-allowed limits).

---

### 7.3 Driver

**D-01 Dashboard** — *Goal:* know what to do and stay available. *Contents:* **online/offline
toggle**, today's assigned jobs, active trip card (resume), earnings-today snapshot, assigned
vehicle, alerts (new assignment, document expiry). *Actions:* go online/offline, open job/trip, view
earnings. *Connected:* D-03, D-05, D-09. *States:* offline (muted, no new jobs), no-jobs,
unverified (cannot go online → finish S-06/A-17), vehicle-unassigned (blocked, contact admin).

**D-02 Assigned Jobs** — incoming/queued assignments (pickup, destination, cargo summary, distance,
payout, accept-by countdown). *Actions:* open D-03. *States:* none, new-assignment highlight.

**D-03 Job Detail** — full job before accepting: route, cargo, customer, schedule, payout, special
instructions. *Actions:* **Accept** (→ D-05, status `ACCEPTED`) / **Decline** (reason → back to admin
queue). *States:* expired (auto-returned to admin), already-taken.

**D-04 Active Trips** — current + upcoming accepted trips. *Actions:* open D-05. *States:* none.

**D-05 Trip Detail (Active)** — *Purpose:* drive the shipment through its states. *Contents:* sticky
status stepper with the **primary action button** per stage: "Start → Arrived at pickup → Confirm
pickup → Start delivery → Arrived → Confirm delivery"; route summary; customer contact; cargo;
links to Route (D-06), Navigation (D-07), Delivery Confirmation (D-08). *Actions:* advance status,
message/call customer, report issue (delay/breakdown/failed). *Connected:* D-06, D-07, D-08, M-02.
*States:* each lifecycle stage; **offline** (status updates queue, sync on reconnect); issue-reported.

**D-06 Route Details** — pickup/dropoff full addresses, contacts, distance, ETA, cargo handling notes,
sequence. *Actions:* open navigation, call contact.

**D-07 Navigation** — in-app map turn-by-turn (Mapbox) or hand-off to Google/Apple Maps; emits live
location for tracking. *States:* gps-permission-needed, rerouting, off-route.

**D-08 Delivery Confirmation (POD)** — *Purpose:* prove delivery per A-34m rules. *Contents:* capture
photo(s), recipient name, signature pad, **OTP entry** (customer's code), notes. *Actions:* submit →
`DELIVERED`/`VERIFIED`; or **mark failed** (reason: absent, refused, wrong address) → `FAILED`/
`RETURNED`. *States:* missing-required-proof (block submit), wrong-OTP (retry/limit),
offline (queue + sync), success.

**D-09 Earnings** — today/week/month totals, per-trip breakdown, pending vs paid. *Actions:* filter,
open D-10. *States:* no-earnings.
**D-10 Payout History** — past payouts, status, method. *States:* none-yet, pending.
**D-11 Notifications** — assignments, messages, payouts, document reminders. *Actions:* open target.

**D-12 Profile** — personal info, rating, status. *Connected:* D-13, D-14, D-15.
**D-13 Documents** — licence, ID, insurance with expiry; re-upload when expiring/rejected.
*States:* approved, expiring (warn), expired (blocks going online), rejected (reason + re-upload).
**D-14 Vehicle** — assigned vehicle details, report issue → triggers maintenance (A-22).
**D-15 Availability** — working hours/days, online schedule.

---

### 7.5 Messaging (M-01 / M-02)

**M-01 Inbox** — *Purpose:* all conversations in one place. *Contents:* threads list (counterpart
name, role badge, last message, unread count, linked shipment ID), search, filter by role/shipment.
*Actions:* open M-02, start new (admin/customer), mark read. *States:* empty, all-read.

**M-02 Chat Screen** — *Contents:* message bubbles, timestamps, **read receipts**, **attachments**
(images/docs from Supabase Storage), system **delivery-update** messages (auto-posted on status
changes), counterpart header with link to the shipment + call button. *Actions:* send text/attachment,
share location (driver), open linked shipment. *Connected:* A-03 / C-04 / D-05.
*States:* sending, sent, delivered, read, failed-resend, attachment-uploading, typing (realtime).

**Allowed pairings & scoping:** Customer↔Driver and Customer↔Admin and Admin↔Driver. Threads are
scoped to a shipment; RLS ensures only the three relevant parties can read a thread. Drivers and
customers cannot message each other outside a shared shipment.

---

### 7.6 Live Tracking architecture & states

**Data path:** Driver app (D-07) samples GPS at the interval set in A-34l → writes to
`driver_locations` (or broadcasts on a Realtime channel) → subscribers (customer C-04, admin A-06/
A-07) receive updates and re-render the marker + recompute route progress + ETA (edge function or
Mapbox directions). Active **only** during `PICKED_UP` … `DELIVERED`.

**What each role sees:**
- *Customer (C-04):* driver marker, planned route, ETA, status, delivery OTP, contact buttons.
- *Driver (D-07):* own navigation + next action; does not see other drivers.
- *Admin (A-06 fleet / A-07 single):* all active drivers, each shipment's marker/route/ETA/status,
  geofence arrival events, stale-GPS flags.

**Tracking states:** `not_started` (pre-pickup) · `live` (recent ping) · `stale` (no ping > threshold
→ amber, last-known + timestamp) · `gps_lost` (extended loss) · `arrived` (geofence hit at dropoff) ·
`completed` (delivered, map frozen at final point) · `offline` (driver app disconnected).

---

## 8. Wireframe Descriptions (key screens)

- **Admin shell:** fixed 240px left sidebar (logo, 10 nav items with icons + active state), top bar
  (search, notifications, messages, avatar). Content = page header (title + primary action) → filter
  bar → data region (table/cards/map).
- **A-01 Dashboard:** 4-up KPI card row; below, two-thirds live-map + one-third "needs attention"
  queue; full-width recent shipments table.
- **A-03 Shipment Detail:** two columns — left (timeline + cargo + route + map), right (status,
  assignment, customer, order/payment, documents); message thread as a bottom tab or right drawer.
- **A-06 Fleet Map:** full-bleed map with a collapsible right list panel; filter chips top-left.
- **C-02 Wizard:** centered card, top step indicator, content per step, sticky Back/Next footer;
  Quote step shows price breakdown; Payment step embeds gateway.
- **C-04 Track Detail:** map top (60% on mobile), status timeline + driver card + actions below.
- **D-05 Active Trip:** map/summary top, big sticky primary-action button bottom; secondary actions
  (call/message/issue) in a row above it.
- **D-08 POD:** stacked capture blocks (photo → recipient → signature → OTP), sticky Submit.
- **M-02 Chat:** standard messaging layout; header links to shipment; system updates centered/greyed.

---

## 9. Database Schema & Relationships (Supabase / Postgres)

> Every table has `id uuid pk`, `created_at`, `updated_at`. RLS enabled on all. `profiles.role`
> drives access. Money in minor units (kobo/cents) as integer.

**Core identity**
- `profiles` (1:1 with auth.users) — role(`admin|driver|customer`), name, phone, avatar_url, status.
- `admin_users` / `roles` / `permissions` — staff roles & granular permissions (A-34c/d).
- `customers` — profile_id fk, company, default_address_id.
- `drivers` — profile_id fk, verification_status, rating, current_vehicle_id, availability,
  online(bool), current_location.
- `customer_addresses` — customer_id fk, label, geo(lat/lng), address.

**Fleet**
- `vehicles` — plate, vehicle_type_id, capacity_kg, capacity_m3, year, status(`available|in_use|
  maintenance|retired`), documents.
- `vehicle_types` — name, icon, min/max capacity (A-34g).
- `maintenance_logs` — vehicle_id fk, type, description, cost, date, next_due, status.

**Commercial + operational**
- `orders` — customer_id fk, shipment_id fk, subtotal, surcharges, tax, total, payment_status,
  invoice_no.
- `order_items` — order_id fk, label, qty, unit_price (line items / breakdown).
- `shipments` — order_id fk, customer_id fk, driver_id fk(null), vehicle_id fk(null),
  pickup(geo+addr+contact+window), destination(geo+addr+contact+window), cargo_type_id, weight,
  dimensions, vehicle_type_id, status, distance_km, eta, quote_amount, scheduled_at.
- `cargo_types` — name, handling_rules, surcharge (A-34h).
- `shipment_events` — shipment_id fk, status/event, actor_id, note, geo, created_at  → timeline,
  audit, tracking feed. **(central table)**
- `delivery_proofs` — shipment_id fk, photo_urls, signature_url, recipient_name, otp_verified(bool),
  notes, failed_reason.

**Tracking**
- `driver_locations` — driver_id fk, shipment_id fk, geo, heading, speed, recorded_at (or Realtime
  broadcast; persist samples for replay).

**Money**
- `payments` — order_id fk, gateway, reference, amount, method, status(`pending|paid|failed|
  refunded`), fees.
- `refunds` — payment_id fk, amount, reason, status.
- `driver_earnings` — driver_id fk, shipment_id fk, amount, status(`accrued|paid`).
- `payouts` — driver_id fk, amount, method, status, paid_at, links to driver_earnings.

**Comms**
- `conversations` — shipment_id fk, participant role-pair; `conversation_participants` — profile_ids.
- `messages` — conversation_id fk, sender_id, body, type(`text|system|attachment`), read_by.
- `message_attachments` — message_id fk, storage_path, mime, size.
- `notifications` — recipient_id fk, type, payload(json), channels, read(bool), target_url.

**Config + governance**
- `org_settings` — single row: name, logo, currency, timezone, capture_mode, etc. (A-34b/i/l/m).
- `pricing_rules` — base, per_km, per_kg, vehicle multipliers, surcharges, tax, min_charge (A-34e).
- `service_areas` — state, city, enabled, surcharge (A-34f).
- `notification_settings` — per event: channels + template (A-34j).
- `audit_logs` — actor_id, action, entity, entity_id, diff(json), created_at (A-34p).

**Key relationships**
- `customer 1—* shipments`, `order 1—1 shipment`, `shipment *—1 driver`, `shipment *—1 vehicle`,
  `driver 1—* shipment_events` (as actor), `vehicle 1—* maintenance_logs`,
  `driver *—1 vehicle` (default) and `shipment *—1 vehicle` (per trip),
  `shipment 1—* conversations 1—* messages`, `order 1—1 payment 1—* refunds`,
  `driver 1—* earnings 1—* payouts`.

**RLS summary**
- Customer: rows where `customer_id = auth.uid()`'s customer (own shipments/orders/payments/messages).
- Driver: rows where `driver_id = me` (assigned jobs/trips/earnings/own location/messages).
- Admin: full access, gated further by `permissions` for staff sub-roles.

---

## 10. API / Backend Requirements

Supabase auto-generates REST + Realtime from the schema; business logic that must be trusted lives in
**Edge Functions**:

- `calculate-quote` — input cargo + route → distance (Maps) × pricing_rules → price breakdown. Used by
  C-02/A-04.
- `assign-driver` — eligibility + (optional) auto-match; writes assignment + event + notification.
- `payments-webhook` — verify gateway callback → mark `payments`/`orders` paid → event + notification.
- `create-invoice` — render invoice/receipt PDF → Storage → return URL (A-10, C-08).
- `dispatch-notification` — fan-out to email/SMS/push per `notification_settings`.
- `compute-eta` — route progress + ETA from latest location (tracking).
- `send-delivery-otp` — generate + SMS OTP at out-for-delivery; verify at D-08.

**Realtime channels:** `tracking:{shipmentId}` (location/status), `conversation:{id}` (messages/typing/
read), `notifications:{userId}`.

**External APIs:** Maps (geocode/directions/distance/ETA), Payment gateway (charge/verify/refund/
webhook), SMS (OTP/alerts), Push (FCM), Email (transactional).

---

## 11. MVP Scope vs Future Features

**In MVP**
- Auth (3 roles, email verification, driver invite + verification).
- Customer: create shipment (wizard + quote + pay), track, history, messages, payments, profile.
- Admin: dashboard, shipments + assignment, live tracking, orders, customers, drivers, fleet +
  maintenance, payments + payouts + refunds, reports (all five), full settings.
- Driver: dashboard + online toggle, jobs accept/decline, active trip status flow, navigation,
  delivery confirmation (photo/signature/OTP), earnings, messages, documents.
- Live GPS tracking, messaging (3 pairings), notifications (email + at least one of SMS/push),
  Paystack/Stripe payments, POD, audit log.

**Future (post-MVP)**
- Native driver app (React Native/Expo); driver auto-assignment & route optimisation; multi-stop
  shipments; partial loads/consolidation; in-app wallet; recurring/contract shipments; customer
  ratings → driver incentives; insurance/claims module; demand heatmaps & forecasting; public
  tracking link (no login); multi-currency/multi-org (white-label); SLA & penalty automation;
  advanced analytics/BI exports; marketing site + public quote calculator.

---

## 12. Build Phasing (recommended order for Claude Code)

1. **Foundation** — Vite+TS+Tailwind+shadcn, routing, Supabase client, env, CI/CD, role-gated layouts.
2. **Auth & profiles** — S-01…S-06, RLS, role redirects.
3. **Schema & settings** — migrations for all tables; admin Settings (esp. pricing, vehicle/cargo
   types, service areas) since they feed everything.
4. **Fleet & drivers** — A-14…A-23, driver onboarding/verification.
5. **Customers & booking** — A-11…A-13, C-02 wizard + `calculate-quote`, orders.
6. **Assignment & driver trip flow** — A-05, D-01…D-08, shipment_events.
7. **Live tracking** — locations + Realtime + C-04/A-06/A-07/D-07.
8. **Payments** — gateway + webhook + A-24…A-27 + C-07/08 + payouts/earnings.
9. **Messaging & notifications** — M-01/02, notifications, dispatch.
10. **Reports & polish** — A-28…A-33, empty/error/success states, tests, a11y.

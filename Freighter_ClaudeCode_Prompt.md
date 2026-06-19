# Freighter — Claude Code Build Prompts

How to use: put `Freighter_Blueprint.md` in the repo root, then paste **Prompt 0** first. After it
finishes and you've reviewed, paste the phase prompts (1→10) one at a time. This keeps each step
inside Claude Code's context window and lets you review before moving on (your plan-first workflow).

---

## PROMPT 0 — Project setup & ground rules (paste this first)

```
You are building "Freighter", a logistics management platform. The full product, UX, database and
API specification is in `Freighter_Blueprint.md` in the repo root. READ IT FULLY before writing
code, and treat it as the source of truth. Do not invent features outside it.

STACK (use exactly this):
- React 18 + TypeScript + Vite
- React Router v6 with role-gated layouts (admin / customer / driver)
- Tailwind CSS + shadcn/ui (Radix)
- TanStack Query (server state) + Zustand (UI state)
- React Hook Form + Zod for all forms/validation
- Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) — use @supabase/supabase-js
- Recharts for reports
- Mapbox GL JS for maps (wrap the provider so it can be swapped)
- date-fns, lucide-react

TARGETS: Vercel (deploy), GitHub (source), Supabase (backend).

DO IN THIS FIRST STEP ONLY:
1. Scaffold a Vite + React + TS project. Install all deps above.
2. Configure Tailwind + shadcn/ui; set up a clean design-token base (colors/spacing/typography) so
   the dashboard visual can be applied later.
3. Set up the folder structure:
   src/
     app/ (router, role layouts: AdminLayout, CustomerLayout, DriverLayout, AuthLayout)
     features/ (one folder per domain: auth, shipments, tracking, orders, customers, drivers,
                fleet, payments, reports, settings, messaging, notifications, profile)
     components/ui (shadcn), components/shared
     lib/ (supabase client, query client, maps provider, utils)
     types/ (generated Supabase types + shared types)
     hooks/, stores/ (zustand)
   supabase/ (migrations, functions)
4. Create the Supabase client + TanStack Query provider + env handling (.env.example with
   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN, payment + sms keys as placeholders).
5. Implement role-gated routing shells from the blueprint §3 sitemap with placeholder pages for every
   screen ID (S-/A-/C-/D-/M-), so the full navigation is walkable even before screens are built.
6. Add ESLint + Prettier + Husky + lint-staged, a GitHub Actions workflow (lint, type-check, test),
   and a README explaining setup, env vars, and the Vercel + Supabase connection steps.
7. Add Vitest + React Testing Library + Playwright config with one smoke test.

RULES:
- TypeScript strict mode. No `any`. Co-locate types with features.
- Every list/detail screen must implement the states convention in blueprint §0 (loading skeletons,
  empty, error+retry, success).
- Keep components small and reusable. Build a shared DataTable, PageHeader, FilterBar, StatCard,
  EmptyState, ErrorState, and Map wrapper early.
- Do NOT build feature logic yet beyond placeholders — stop after the foundation is walkable and
  give me a summary + how to run it. I will review, then send the next phase.
```

---

## PHASE PROMPTS (paste one at a time, after Prompt 0)

### PHASE 1 — Auth & profiles
```
Implement auth per blueprint §7.0 and §9 (profiles/RLS). Screens S-01…S-06 + S-07/S-08.
Supabase email/password + email verification. `profiles` table with role; redirect to the correct
role shell after login. Customer self-signup; driver/admin are invited (build the invite-accept path
for S-06). Enable RLS and write the profiles policies. Add the migration under supabase/migrations.
Include form validation (Zod) and all auth states. Stop and summarise.
```

### PHASE 2 — Database schema & Admin Settings
```
Create migrations for ALL tables in blueprint §9 with RLS policies per the RLS summary. Generate and
commit Supabase TypeScript types. Then build the Settings hub A-34 and every sub-page A-34a…A-34q
(§7.4), since pricing, vehicle types, cargo types and service areas feed the rest of the app. Wire
org_settings/pricing_rules/service_areas/vehicle_types/cargo_types/notification_settings to real
tables. Add the audit_logs writer used by admin actions. Stop and summarise.
```

### PHASE 3 — Fleet & Drivers
```
Build Fleet (A-18…A-23) and Drivers (A-14…A-17) plus driver onboarding/verification, against the
vehicles/vehicle_types/maintenance_logs/drivers tables. Include vehicle↔driver assignment and the
compatibility rules used later by shipment assignment. Implement all states. Stop and summarise.
```

### PHASE 4 — Customers & Booking
```
Build Customers (A-11…A-13). Build the customer Create Shipment wizard C-02 (all 9 steps) and admin
A-04, backed by orders/order_items/shipments/cargo_types. Implement the `calculate-quote` edge
function using pricing_rules + service_areas + Mapbox distance. Create order + shipment on submit
(status REQUESTED) and notify admin. Customer dashboard C-01, history C-05/06. Stop and summarise.
```

### PHASE 5 — Assignment & Driver trip flow
```
Build admin Shipments (A-02/A-03) and Assign (A-05). Build the driver flow D-01…D-08: dashboard +
online toggle, jobs accept/decline, active-trip status stepper, route, navigation, and Delivery
Confirmation (photo/signature/OTP per A-34m). Every status change writes a shipment_event. Implement
delivery_proofs + `send-delivery-otp`. Handle offline queueing for driver status updates. Summarise.
```

### PHASE 6 — Live tracking
```
Implement live tracking per §7.6: driver_locations + Supabase Realtime channel `tracking:{shipmentId}`,
`compute-eta` edge function, and the views C-04 (customer), A-06 fleet map + A-07 single (admin),
D-07 navigation emitting location. Implement all tracking states (not_started/live/stale/gps_lost/
arrived/completed/offline). Summarise.
```

### PHASE 7 — Payments
```
Integrate the payment gateway (Paystack by default; keep it abstracted so Stripe can swap in).
Implement charge at booking + `payments-webhook` edge function, `create-invoice` (PDF to Storage),
admin Payments A-24/25, Payouts A-26, Refunds A-27, driver_earnings, and customer C-07/C-08. Respect
capture_mode (prepaid vs on-delivery) from settings. Summarise.
```

### PHASE 8 — Messaging & Notifications
```
Build messaging M-01/M-02 (conversations/messages/attachments, read receipts, realtime typing,
system delivery-update messages) with the 3 allowed role pairings and RLS scoping per §7.5. Build
notifications (table + bell + C-09/D-11) and `dispatch-notification` fanning out to email/SMS/push per
notification_settings. Summarise.
```

### PHASE 9 — Reports
```
Build Reports A-28…A-33 (Revenue, Deliveries, Fleet Performance, Driver Performance, Customer
Activity) with Recharts, date-range filtering, drill-downs and CSV/PDF export, querying the real
tables/aggregations. Summarise.
```

### PHASE 10 — Polish, states, tests, a11y, deploy
```
Audit every screen for the states convention (§0). Add Playwright E2E for the critical flows in §6
(create→assign→deliver→pay→close, tracking, messaging). Accessibility pass (focus, labels, contrast).
Verify the GitHub Actions → Vercel deploy and document the Supabase production setup. Final summary +
launch checklist.
```

---

## Tips while running these
- After each phase, commit and push so Vercel makes a preview deploy you can click through.
- If Claude Code hits context limits, point it back to the relevant blueprint section by number
  (e.g. "rebuild A-05 per blueprint §7.1 and §10 assign-driver").
- Keep your Supabase migrations in version control; run them locally with the Supabase CLI first.
```
```

# Freighter

A logistics management platform for transporting heavy goods and cargo between states and cities.
Three roles: **Admin**, **Customer**, **Driver** — all in one React codebase with role-gated routing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Routing | React Router v6 |
| Styling | Tailwind CSS + shadcn/ui (Radix) |
| Server state | TanStack Query |
| UI state | Zustand |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Maps | Mapbox GL JS |
| Dates / Icons | date-fns, lucide-react |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) |
| Payments | Paystack (configurable) |
| SMS | Termii / Twilio |
| Email | Resend |
| Deploy | Vercel (frontend) + Supabase (backend) |
| Testing | Vitest + React Testing Library + Playwright |
| CI | GitHub Actions |

---

## Quick Start

### 1. Prerequisites

- Node 20+
- npm 10+
- A Supabase project (free tier works)
- A Mapbox account (free tier)
- Git

### 2. Clone & install

```bash
git clone https://github.com/your-org/freighter.git
cd freighter
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `VITE_MAPBOX_TOKEN` | mapbox.com → Account → Access tokens |
| `VITE_PAYSTACK_PUBLIC_KEY` | dashboard.paystack.com → Settings → API |

Other variables (SMS, FCM, Resend) are optional for initial dev.

### 4. Run locally

```bash
npm run dev
# → http://localhost:5173
```

### 5. Git hooks (first time)

```bash
git init       # if not already a git repo
npm run prepare  # installs Husky hooks
```

---

## Project Structure

```
src/
├── app/
│   ├── router.tsx              # createBrowserRouter — all routes
│   ├── layouts/                # AdminLayout, CustomerLayout, DriverLayout, AuthLayout
│   └── guards/                 # RoleGuard — protects routes by role
├── features/                   # One folder per domain
│   ├── auth/                   # Login, Register, ForgotPassword, etc.
│   ├── dashboard/              # Dashboard pages per role
│   ├── shipments/              # Admin & Customer shipment pages
│   ├── tracking/               # Fleet map + customer tracking
│   ├── orders/                 # Orders & invoices (admin)
│   ├── customers/              # Customer management (admin)
│   ├── drivers/                # Driver management (admin)
│   ├── fleet/                  # Vehicles + maintenance (admin)
│   ├── payments/               # Payments, payouts, refunds
│   ├── reports/                # 5 report screens (admin)
│   ├── settings/               # Settings hub + sub-pages (admin)
│   ├── messaging/              # M-01 Inbox, M-02 Chat (shared)
│   ├── notifications/          # Notifications list (shared)
│   ├── jobs/                   # Driver assigned jobs
│   ├── trips/                  # Driver active trips + navigation + POD
│   ├── earnings/               # Driver earnings + payouts
│   └── profile/                # Profile pages per role
├── components/
│   ├── ui/                     # shadcn/ui components (Radix-based)
│   └── shared/                 # DataTable, PageHeader, StatCard, EmptyState, ErrorState, MapWrapper, PlaceholderPage
├── lib/
│   ├── supabase.ts             # Supabase client (typed)
│   ├── queryClient.ts          # TanStack Query client
│   ├── maps.tsx                # Mapbox abstraction layer
│   └── utils.ts                # cn, formatMoney, formatDate, etc.
├── types/
│   ├── supabase.ts             # DB type stubs (replace with supabase gen types)
│   └── index.ts                # Shared app types (AppUser, Address, etc.)
├── hooks/                      # Shared hooks
├── stores/
│   ├── authStore.ts            # User + role (Zustand + persist)
│   └── uiStore.ts              # Sidebar collapsed, driver online toggle, map style
└── main.tsx                    # App entry point
supabase/
├── migrations/                 # SQL migrations (run via Supabase CLI)
└── functions/                  # Edge Functions (Deno)
e2e/
└── smoke.spec.ts               # Playwright smoke tests
```

---

## Routes (complete sitemap)

### Auth
| Path | Screen |
|---|---|
| `/login` | S-01 Login |
| `/register` | S-02 Register |
| `/forgot-password` | S-03 Forgot Password |
| `/reset-password` | S-04 Reset Password |
| `/verify-email` | S-05 Verify Email |
| `/onboarding` | S-06 Onboarding |

### Admin (`/admin/*`)
All routes protected by `role === "admin"`.

| Path | Screen ID |
|---|---|
| `/admin` | A-01 Dashboard |
| `/admin/shipments` | A-02 Shipments List |
| `/admin/shipments/:id` | A-03 Shipment Detail |
| `/admin/shipments/new` | A-04 Create Shipment |
| `/admin/shipments/:id/assign` | A-05 Assign Driver/Vehicle |
| `/admin/tracking` | A-06 Fleet Map |
| `/admin/tracking/:shipmentId` | A-07 Tracking Detail |
| `/admin/orders` | A-08 Orders List |
| `/admin/orders/:id` | A-09 Order Detail |
| `/admin/orders/:id/invoice` | A-10 Invoice |
| `/admin/customers` | A-11 Customers List |
| `/admin/customers/:id` | A-12 Customer Detail |
| `/admin/customers/new` | A-13 Add Customer |
| `/admin/drivers` | A-14 Drivers List |
| `/admin/drivers/:id` | A-15 Driver Detail |
| `/admin/drivers/new` | A-16 Add/Invite Driver |
| `/admin/drivers/:id/verify` | A-17 Verification |
| `/admin/fleet` | A-18 Vehicles List |
| `/admin/fleet/:id` | A-19 Vehicle Detail |
| `/admin/fleet/new` | A-20 Add Vehicle |
| `/admin/fleet/maintenance` | A-22 Maintenance Logs |
| `/admin/fleet/maintenance/new` | A-23 Add Log |
| `/admin/payments` | A-24 Payments List |
| `/admin/payments/:id` | A-25 Payment Detail |
| `/admin/payments/payouts` | A-26 Payouts |
| `/admin/payments/refunds` | A-27 Refunds |
| `/admin/reports` | A-28 Reports Overview |
| `/admin/reports/revenue` | A-29 Revenue |
| `/admin/reports/deliveries` | A-30 Deliveries |
| `/admin/reports/fleet` | A-31 Fleet Performance |
| `/admin/reports/drivers` | A-32 Driver Performance |
| `/admin/reports/customers` | A-33 Customer Activity |
| `/admin/messages` | M-01 Inbox |
| `/admin/settings` | A-34 Settings |

### Customer (`/app/*`)
All routes protected by `role === "customer"`.

| Path | Screen ID |
|---|---|
| `/app` | C-01 Dashboard |
| `/app/shipments/new` | C-02 Create Shipment Wizard |
| `/app/tracking` | C-03 Track List |
| `/app/tracking/:id` | C-04 Track Detail |
| `/app/history` | C-05 History |
| `/app/history/:id` | C-06 History Detail |
| `/app/payments` | C-07 Payments |
| `/app/payments/:id` | C-08 Payment Detail |
| `/app/messages` | M-01 Inbox |
| `/app/profile` | C-10 Profile |
| `/app/profile/addresses` | C-11 Saved Addresses |
| `/app/profile/security` | C-12 Security |
| `/app/profile/notifications` | C-13 Notification Prefs |

### Driver (`/driver/*`)
All routes protected by `role === "driver"`.

| Path | Screen ID |
|---|---|
| `/driver` | D-01 Dashboard |
| `/driver/jobs` | D-02 Assigned Jobs |
| `/driver/jobs/:id` | D-03 Job Detail |
| `/driver/trips` | D-04 Active Trips |
| `/driver/trips/:id` | D-05 Trip Detail |
| `/driver/trips/:id/route` | D-06 Route Details |
| `/driver/trips/:id/navigate` | D-07 Navigation |
| `/driver/trips/:id/confirm` | D-08 Delivery Confirmation |
| `/driver/messages` | M-01 Inbox |
| `/driver/earnings` | D-09 Earnings |
| `/driver/earnings/payouts` | D-10 Payout History |
| `/driver/profile` | D-12 Profile |
| `/driver/profile/documents` | D-13 Documents |
| `/driver/profile/vehicle` | D-14 Vehicle |
| `/driver/profile/availability` | D-15 Availability |

---

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Project Settings → API**
3. Run migrations (coming in Phase 3): `npx supabase db push`
4. Enable RLS on all tables (defined in migrations)

When ready to generate types from your live schema:
```bash
npx supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

---

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Set environment variables in Vercel dashboard (same as `.env`)
4. Deploy — Vercel auto-detects Vite and builds correctly

For preview deploys per PR, set the same env vars in **Settings → Environment Variables → Preview**.

---

## Development Commands

```bash
npm run dev           # Start dev server
npm run build         # Production build (type-check + vite build)
npm run lint          # ESLint (zero warnings)
npm run format        # Prettier write
npm run type-check    # tsc --noEmit
npm run test          # Vitest unit tests (once)
npm run test:watch    # Vitest watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E (needs dev server running or webServer config)
```

---

## Build Phases

Per the blueprint §12:
1. **Foundation** ← *you are here* (this PR)
2. Auth & profiles (S-01…S-06, RLS, role redirects)
3. Schema & settings (all migrations; admin Settings screens)
4. Fleet & drivers (A-14…A-23)
5. Customers & booking (A-11…A-13, C-02 wizard + calculate-quote)
6. Assignment & driver trip flow (A-05, D-01…D-08)
7. Live tracking (locations + Realtime)
8. Payments (Paystack webhook + A-24…A-27)
9. Messaging & notifications
10. Reports & polish

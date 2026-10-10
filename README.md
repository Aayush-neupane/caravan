# Hartley & Moor — Luxury Caravan Hire, Bath

A production-oriented caravan rental platform: editorial storefront, real availability +
pricing engines, 3-step booking with payments, customer accounts, and a full admin
operating system. Built with Next.js 14 (App Router), strict TypeScript, Tailwind,
Framer Motion, Prisma, Zod, Auth.js (next-auth) and Stripe (test mode / labelled demo mode).

Brand: **Hartley & Moor**, Lansdown Depot, Bath BA1 9BT — serving South West England,
the Cotswolds & Wales. Currency GBP, VAT 20%.

## Quick start (local demo, ~3 minutes)

```bash
npm install
cp .env.example .env
npx prisma migrate dev --name init   # creates + migrates SQLite dev DB
npm run seed                          # 3 caravans, extras, rules, demo bookings
npm run dev                           # http://localhost:3000
```

Demo logins (`/account/sign-in`): owner `owner@hartleyandmoor.example / owner1234`,
customer `customer@example.com / customer1234`. Coupon for testing: `SLOW10`
(10% off bookings over £200, max 100 uses).

Useful checks after seeding:

- Availability open: `/api/quote` Rowan far-future dates → `available: true` + itemised quote
- Availability blocked: Alder 2026-10-31 → 2026-11-04 → `available: false` + recovery message
- Booking hold expiry: Solace hold `hold_demo_expiring` (20 min, server-enforced)
- Failed payment: booking `HM-DEMO03` (`payment_review`)
- Awaiting document: booking `HM-DEMO02` (licence `uploaded`)
- Cancelled + refund: booking `HM-DEMO04`
- Manual booking: `HM-DEMO05`

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | run / production-build / serve |
| `npm run seed` | idempotent demo seed |
| `npm run test` | vitest unit tests (pricing, availability, state machine) |
| `npm run test:e2e` | Playwright journey (needs `npx playwright install`) |
| `npx prisma migrate dev` | local migrations (SQLite) |

## Payments

Stripe test mode activates when `STRIPE_SECRET_KEY` (+ `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) are set; webhooks at
`/api/webhooks/stripe` are signature-verified and idempotent (dedupe by provider ref).
Without keys the app uses an **unmistakably labelled DEMO mode** (`provider: "demo"`,
UI copy states no real money moves). Booking status advances only on verified
server-side events — never on a redirect alone.

## Email

Resend when `RESEND_API_KEY` is set, otherwise sends are logged and recorded as
`logged_demo`. Every notification has a delivery record (`sent` / `failed` /
`logged_demo`); duplicate webhook confirmations are never re-sent.

## Admin (`/admin`, staff role required)

Overview · Bookings (+ detail with confirm/ready/active/complete/cancel + deposit
refund, all transition-guarded + audit-logged) · Calendar · Fleet · Customers ·
Documents · Pricing · Coupons · Payments · Maintenance · Reviews · Content ·
Notifications · Reports · Settings · Staff & audit.

## Production notes

- Database: local dev uses **SQLite** for zero-config runs — no, Postgres is not
  currently used. The schema uses no provider-specific types, so switching is a
  two-line change. **Using PostgreSQL** (recommended for production):
  ```bash
  docker compose up -d db
  # in prisma/schema.prisma: provider = "sqlite" → "postgresql"
  # in .env: DATABASE_URL="postgresql://hartley:hartley@localhost:5432/caravan"
  npx prisma migrate deploy
  npm run seed
  ```
  Managed options that work the same way: Neon, Supabase, RDS. For true
  exclusion-constraint overlap protection on Postgres, add an
  `EXCLUDE USING gist` migration on active bookings (the app additionally
  guards in-transaction).
- Storage: local dev keeps document paths as `private://` references. Production
  should use S3-compatible private buckets + signed URLs (see `src/lib/email.ts`
  and `CustomerDocument`); add malware scanning at upload.
- Auth: demo uses credentials + JWT with two seeded accounts. Production should
  use email/OAuth via Auth.js with the Prisma adapter and hashed secrets.
- CMS: editorial content currently ships in `src/data/catalogue.ts` + DB tables
  (`Destination`, `JournalArticle`, `Faq`). A Sanity/Strapi CMS may own marketing
  copy; availability, pricing enforcement and payment state must stay in the app DB.
- Legal/insurance pages are **templates** until operator-approved. Reviews on the
  storefront are labelled demonstration content until real verified hires exist.

## Architecture

- `src/features/pricing/engine.ts` — the single pricing authority (per-night rates,
  weekend Fri/Sat rules, per-night seasonal × from each night's own date, weekly
  discount, fees, extras, coupons, VAT, deposit split, immutable quote snapshots).
- `src/features/pricing/coupons.ts` — server-side coupon + extras resolution
  (browser prices never trusted).
- `src/features/availability/engine.ts` — pickup-inclusive/return-exclusive
  intervals + 1-day prep buffer; overlap detection.
- `src/features/availability/blocked.ts` — effective blocked nights for the picker.
- `src/components/forms/DateRangePicker.tsx` — accessible range calendar with
  blocked nights, keyboard arrows, live announcements.
- `src/components/forms/Select.tsx` — accessible custom listbox dropdown.
- `src/features/availability/engine.ts` — pickup-inclusive/return-exclusive
  intervals + 1-day prep buffer; overlap detection.
- `src/features/bookings/stateMachine.ts` — 12-state reservation machine, only
  legal transitions, enforced in API + admin.
- `src/features/payments/provider.ts` — Stripe/Demo adapter.
- `src/lib/auth.ts`, `src/lib/email.ts`, `src/lib/db.ts`, `src/lib/format.ts`.
- Design tokens: `src/styles/tokens.css` (Forest #1A2B23, Sand #EDE6D6, Amber
  #C9A86A used sparingly; Cormorant Garamond display + Manrope interface; 3/6/10px
  radii; solid surfaces, hairline borders — no gradients, glass or glow).

## Honest limitations

- Concurrent holds rely on transactional check-then-create (SQLite has no exclusion
  constraints); Postgres exclusion constraint recommended for production.
- Document upload UI is a status tracker (seeded record + resubmission flow);
  binary upload to private storage + scanning is stubbed to `private://` refs.
- Rental-agreement e-signature is checkbox acceptance with version + timestamp
  (provider integration left to the operator).
- SMS notifications are not wired (email only); provider hook documented in settings.
- E2E suite is written but not executed here (no browser in this environment);
  unit (11) + live API smoke tests (quote/book/pay/conflict/lookup) pass.

# Zealthy — Mini-EMR & Patient Portal: Implementation Plan

## Phase status

| Phase | Title                                | Status         |
| ----- | ------------------------------------ | -------------- |
| 0     | Scaffold & tooling                   | ✅ Complete (2026-07-15) |
| 1     | Data layer                           | ⬜ Not started  |
| 2     | Shared domain logic                  | ⬜ Not started  |
| 3     | Services & Server Actions (CRUD)     | ⬜ Not started  |
| 4     | Mini-EMR (`/admin`)                  | ⬜ Not started  |
| 5     | Auth + Patient Portal (`/`)          | ⬜ Not started  |
| 6     | Design system & motion polish        | ⬜ Not started  |
| 7     | Deploy, docs, ship                   | ⬜ Not started  |

## Context

This is a greenfield full-stack take-home exercise (`Zealthy.md`). We build **two apps in one Next.js project**:

1. **Mini-EMR** at `/admin` (no auth) — a table of patients with at-a-glance data; drill into a patient to manage **appointments (CRUD)**, **prescriptions (CRUD)**, and **patient records (CRU + create new patient with password)**.
2. **Patient Portal** at `/` — email/password login, then a dashboard summarizing **appointments in the next 7 days** and **refills in the next 7 days** plus basic patient info; drill-downs show the **full upcoming schedule out to 3 months**.

Data lives in a real database seeded from the provided gist (nested `users → appointments/prescriptions`, plus reference `medications` and `dosages` lists). The deliverable is a **GitHub repo + a live deployed URL**.

**Stack decisions:** Next.js App Router (full-stack) + TypeScript + Prisma + **Neon Postgres**; **Auth.js (Credentials provider)** for portal sessions; **functional-first, design polish as a later phase**; deploy to **Vercel**. Passwords are stored/compared in **plaintext by design** (the brief explicitly requires settable patient passwords to ease testing) — called out in the README as a deliberate, non-production choice.

The premium design system in `Zealthy.md` (color tokens, Framer Motion timings/springs, card/button/form specs, a11y, reduced-motion) is the source of truth for Phase 6.

---

## Requirements coverage map

**Section 1 — Mini-EMR**

| Brief requirement | Where handled |
|---|---|
| Lives at `/admin`, **no auth** | `app/admin/*` route group (open access) — Phase 4 |
| Main page = **table of users w/ at-a-glance data** | Phase 4: `app/admin/page.tsx` (name, email, # upcoming appts, next appt, # active Rx) |
| Drill into a **patient record** → upcoming appts + prescribed meds | Phase 4: `app/admin/patients/[id]/page.tsx` |
| **Prescriptions CRUD** | Phase 3 services/actions + Phase 4 `PrescriptionForm` |
| **Appointments CRUD** (+ end recurring, schedule new) | Phase 3 + Phase 4 `AppointmentForm`; end-recurring via `endsAt` |
| **Patient data CRU + New patient form** (settable password) | Phase 4: `patients/new/page.tsx` + editable basic info |

**Section 2 — Patient Portal**

| Brief requirement | Where handled |
|---|---|
| Lives at root **`/`** | Phase 5: `app/(portal)/page.tsx` |
| **Login form** (email + password) | Phase 5: `signIn('credentials')` |
| Login with **sample creds OR EMR-created creds** | Phase 5 verification |
| Main page **summary**: appts next 7 days, refills next 7 days, basic info | Phase 5: `getPatientSummary()` |
| Drill down → **full upcoming appointment schedule** (3 mo) | Phase 5: `portal/appointments/page.tsx` |
| Drill down → **all prescriptions** (3 mo refills) | Phase 5: `portal/prescriptions/page.tsx` |
| Per-patient data isolation | Phase 5: queries keyed by `session.patientId` |

---

## Architecture at a glance

- **One Next.js app** serves both surfaces. Route groups isolate them:
  - `app/(portal)/` → `/`, `/portal/*` (patient-facing, auth-guarded)
  - `app/admin/` → `/admin`, `/admin/patients/[id]` (EMR, open access)
- **Data access via Server Actions + a thin service layer** (`lib/services/*`). Server Actions handle mutations from forms; read helpers are shared by both surfaces. No separate REST layer beyond the Auth.js callback route.
- **Recurrence is computed, not stored.** Appointments/prescriptions store a single anchor (`datetime`/`refillOn`) + `repeat`/`refillSchedule` + optional `endsAt`. A shared expander generates concrete occurrences within a window (next 7 days for summaries, next 3 months for drill-downs). This is the key piece of domain logic and is unit-tested.
- **Validation with Zod** shared between client and Server Actions.

### Data model (Prisma)

```
Patient        id, name, email @unique, password, createdAt, updatedAt
               appointments Appointment[]   prescriptions Prescription[]

Appointment    id, patientId → Patient, provider (String),
               datetime (DateTime), repeat (RepeatSchedule), endsAt (DateTime?), createdAt
               // endsAt = "way to end recurring appointments"

Prescription   id, patientId → Patient, medication (String), dosage (String),
               quantity (Int), refillOn (DateTime @db.Date),
               refillSchedule (RefillSchedule), endsAt (DateTime?), createdAt

Medication     id, name @unique          // reference list, seeded
Dosage         id, value @unique         // reference list, seeded (sorted numerically)

enum RepeatSchedule { NONE WEEKLY MONTHLY }     // extend to match seed values found
enum RefillSchedule { NONE WEEKLY MONTHLY }
```

`medication`/`dosage` are stored as strings on the prescription (denormalized snapshot), but the **create/edit form's selectable options come from the `Medication`/`Dosage` reference tables**, exactly as the brief requires.

---

## Phase 0 — Scaffold & tooling  ✅ COMPLETE (2026-07-15)

**Goal:** running skeleton, committed.

- [x] `npx create-next-app@latest` — TypeScript, App Router, Tailwind, ESLint (root `app/`). → **Next.js 16.2.10 + React 19**.
- [x] Add deps: `prisma`, `@prisma/client`, `zod`, `next-auth@beta` (Auth.js v5), `date-fns` (recurrence math + tz-safe date handling); Phase-6 deps deferred (`framer-motion`).
- [x] Config: `.env` (`DATABASE_URL`, `AUTH_SECRET`), `.env.example`, `.gitignore` (`node_modules`, `.next`, `.env` with a `!.env.example` exception), `prisma/schema.prisma` datasource = postgres.
- [x] `README.md` stub (setup, seed, run, deploy, and the plaintext-password disclaimer).

**Files:** `package.json`, `next.config.ts`, `prisma/schema.prisma`, `.env.example`, `.env`, `README.md`, `app/layout.tsx` (metadata).

**Decisions & deviations from original plan (as-built):**

- **Prisma pinned to 6.x, not 7.x.** Prisma 7 (7.8.0 was installed first) removed the
  classic `url = env("DATABASE_URL")` datasource model, requiring `prisma.config.ts` +
  a driver adapter. To keep the data layer simple and Neon-compatible with a plain
  connection string (matching this plan's design), the project pins to the stable
  **Prisma 6.19.3** line. Revisitable in a later hardening pass.
- **No `tailwind.config.ts`.** `create-next-app` now ships **Tailwind CSS v4**, whose
  config is CSS-first (`@import "tailwindcss"` + `@theme` in `app/globals.css`). There
  is no generated `tailwind.config.ts`; the Phase-6 design tokens will live in
  `globals.css` `@theme` instead. Original plan's file list is superseded here.
- **npm install-script approval.** npm 11 blocks package install scripts by default;
  `sharp`, `unrs-resolver`, and the Prisma packages are pinned-approved via an
  `allowScripts` block in `package.json` so `prisma generate` runs.
- Added `postinstall: prisma generate` and a `typecheck` script to `package.json`.

**Validation (all green):**

- `npm run lint` — clean.
- `npm run typecheck` (`tsc --noEmit`) — clean.
- `npm run build` — production build compiles; `/` and `/_not-found` prerender static.
- `npm run dev` — server Ready; `GET /` → HTTP 200.
- `npx prisma validate` — schema valid; `npx prisma generate` — client generated.

## Phase 1 — Data layer

**Goal:** schema, migration, idempotent seed from the gist.

- Write the Prisma models above; `prisma migrate dev --name init`.
- **Seed script** `prisma/seed.ts` (wired via `package.json` `prisma.seed`):
  - **Source gist:** https://gist.github.com/sbraford/73f63d75bb995b6597754c1707e40cc2
    (raw: https://gist.githubusercontent.com/sbraford/73f63d75bb995b6597754c1707e40cc2/raw).
    Download once and embed a local copy at `prisma/seed-data.json` so seeding is offline-deterministic and reproducible in CI/Vercel.
  - Upsert `Medication` (7 names: Diovan, Lexapro, Metformin, Ozempic, Prozac, Seroquel, Tegretol) and `Dosage` (1mg…1000mg, sorted numerically).
  - For each `users[]`: upsert `Patient` (by email) with nested `appointments`/`prescriptions`. Map JSON `repeat`→`RepeatSchedule`, `refill_schedule`→`RefillSchedule`, `refill_on`→`refillOn`, `datetime`→`datetime`.
  - Idempotent (upsert by natural keys) so re-seeding is safe.
- `lib/prisma.ts` — singleton `PrismaClient` (dev hot-reload guard).

**Verification:** `npx prisma studio` shows patients with nested rows; medications/dosages populated.

## Phase 2 — Shared domain logic (the hard part)

**Goal:** one well-tested module both surfaces rely on.

- `lib/recurrence.ts`:
  - `expandOccurrences(anchor, schedule, windowStart, windowEnd, endsAt?)` → `Date[]`. Steps by `addWeeks`/`addMonths` (date-fns), stops at `min(windowEnd, endsAt)`, handles past-anchor edge cases, caps iterations defensively.
  - `nextOccurrence(...)` helper for "next upcoming" in summaries.
- `lib/windows.ts`: `next7Days(now)`, `next3Months(now)` window builders (single `now()` seam so tests are deterministic).
- `lib/validation.ts`: Zod schemas — `patientSchema`, `appointmentSchema`, `prescriptionSchema` (medication ∈ reference list, dosage ∈ reference list, quantity ≥ 1, valid dates, repeat/refill enums). Reused by forms and Server Actions.
- `lib/types.ts`: shared DTOs (`OccurrenceView`, `PatientSummary`, etc.).
- **Unit tests** (Vitest) for `recurrence.ts` — weekly/monthly across month boundaries, `endsAt` truncation, none-schedule single occurrence, 3-month cap.

## Phase 3 — Services & Server Actions (CRUD)

**Goal:** all mutations + reads, framework-thin.

- `lib/services/{patients,appointments,prescriptions}.ts` — pure DB functions (`listPatientsWithCounts`, `getPatientDetail`, `createPatient`, `updatePatient`, `createAppointment`, `updateAppointment`, `deleteAppointment`, `endRecurrence`, and prescription equivalents).
- `app/admin/**/actions.ts` — Server Actions wrapping services, each: Zod-parse → service call → `revalidatePath`. Return typed `{ ok, errors }` for inline form validation.
- Portal read helpers: `getPatientSummary(patientId, now)` (7-day appointments + 7-day refills + basic info) and `getPatientSchedule(patientId, now)` (3-month expansions), both built on Phase 2 utilities.
- "**End recurring**" = Server Action setting `endsAt = now` (or a chosen date) — surfaced as a button on recurring items.

## Phase 4 — Mini-EMR (`/admin`)

**Goal:** full admin functionality, clean-but-basic styling (polish deferred to Phase 6).

- `app/admin/page.tsx` — **patients table** (name, email, # upcoming appts, next appt, # active Rx) with at-a-glance data; "New patient" button. Server Component reading `listPatientsWithCounts`.
- `app/admin/patients/new/page.tsx` — new-patient form (name, email, **password**), calls `createPatient` action.
- `app/admin/patients/[id]/page.tsx` — patient record: editable basic info (CRU), **Appointments** section (list + add/edit/delete + end-recurring), **Prescriptions** section (list + add/edit/delete).
- Form components: `PatientForm`, `AppointmentForm` (provider free-text, datetime picker, repeat select), `PrescriptionForm` (medication select ← reference table, dosage select ← reference table, quantity, refillOn, refillSchedule). Client components using Server Actions + Zod validation state.
- Delete/end use confirm; `useFormStatus`/optimistic pending states.

**Verification:** create a patient, add/edit/delete an appointment + prescription, end a recurring appointment — all persist across reload.

## Phase 5 — Auth + Patient Portal (`/`)

**Goal:** login and patient-facing views.

- **Auth.js v5** `auth.ts` with Credentials provider: look up `Patient` by email, compare plaintext password, return session `{ patientId, name, email }`. `app/api/auth/[...nextauth]/route.ts`; `middleware.ts` guards `/portal/*`.
- `app/(portal)/page.tsx` — if unauthenticated, render the **login form** (email/password) → `signIn('credentials')`; if authenticated, redirect to `/portal`.
- `app/(portal)/portal/page.tsx` — **dashboard**: personalized greeting, basic info, "Next 7 days" appointments, "Next 7 days" refills, drill-down links. Uses `getPatientSummary`.
- `app/(portal)/portal/appointments/page.tsx` — full upcoming schedule (3 months, expanded occurrences).
- `app/(portal)/portal/prescriptions/page.tsx` — all prescriptions with upcoming refill dates (3 months).
- Session-scoped: every query keyed by `session.patientId` (a patient can only see their own data). Sign-out action.

**Verification:** log in with a seeded credential and with a patient created via `/admin`; confirm 7-day summary and 3-month drill-downs are correct and isolated per patient.

## Phase 6 — Design system & motion polish

**Goal:** apply `Zealthy.md` design direction across both surfaces.

- **Tokens:** encode the color palette (`#184D3B`, `#267A58`, `#DCEFE5`, `#F8F4EC`, `#F2D8CA`, `#E8E2F2`, text/border tokens) as Tailwind theme + CSS vars; cream/white page backgrounds; green reserved for primary actions. Manrope/Geist font via `next/font`.
- **Components:** rounded cards (20–32px radius, soft shadows, minimal borders), pill buttons (press-scale 0.98), conversational large-field forms with progress/validation states, soft status chips, skeleton loaders (no full-screen spinners).
- **Motion (Framer Motion):** staggered entrances, scroll-reveal on sections, animated tabs/accordions/segmented controls, page route transitions (opacity + small translateY), card hover (lift ≤4px, image scale ≤1.03), spring `{stiffness:260, damping:24, mass:0.8}`, timings per brief.
- **Portal login as a mini editorial hero** (two-column, floating cards, organic shapes) — the one marketing moment.
- **Mobile:** recompose (not stack) — one-column, bottom nav/sheets, large touch targets.
- **A11y + reduced-motion:** WCAG 2.2 AA contrast, visible focus, semantic headings, `prefers-reduced-motion` disables parallax/floats/large scale and swaps slides for opacity. Gating requirement, not optional.

## Phase 7 — Deploy, docs, ship

**Goal:** live URL + repo.

- Provision **Neon Postgres** (via Vercel integration), set `DATABASE_URL` + `AUTH_SECRET` in Vercel env.
- Build: `prisma generate`; run `prisma migrate deploy` + seed against the hosted DB (one-time seed step documented).
- Deploy to **Vercel**; verify `/admin` and `/` on the live URL.
- Finalize `README.md`: architecture, local setup, seed command, **test credentials**, live URL, and the plaintext-password design note. Push to GitHub.

---

## Proposed file structure

```
app/
  layout.tsx  globals.css
  (portal)/page.tsx                     # login OR redirect
  (portal)/portal/page.tsx              # dashboard (7-day summary)
  (portal)/portal/appointments/page.tsx # 3-month schedule
  (portal)/portal/prescriptions/page.tsx
  admin/page.tsx                        # patients table
  admin/patients/new/page.tsx
  admin/patients/[id]/page.tsx
  admin/**/actions.ts                   # Server Actions
  api/auth/[...nextauth]/route.ts
auth.ts  middleware.ts
lib/prisma.ts  lib/recurrence.ts  lib/windows.ts  lib/validation.ts  lib/types.ts
lib/services/{patients,appointments,prescriptions}.ts
components/{ui, forms, portal, admin}/…
prisma/schema.prisma  prisma/seed.ts  prisma/seed-data.json
tests/recurrence.test.ts
```

## Verification (end-to-end)

1. `npm run db:reset && npm run seed` → Prisma Studio shows seeded patients/reference data.
2. `npm test` → recurrence unit tests green (weekly/monthly/endsAt/3-month cap).
3. `npm run dev`:
   - `/admin`: table renders at-a-glance data; create patient; CRUD an appointment + prescription; end a recurring appointment; reload persists.
   - `/`: log in with a seeded credential **and** a portal-created patient; dashboard shows correct next-7-day appts/refills; drill-downs show 3-month expansions; data isolated per patient; sign out.
4. Reduced-motion: toggle OS setting → animations degrade to opacity, content immediately visible.
5. Deployed Vercel URL passes the same `/admin` + `/` checks against Neon.

## Key risks / decisions to watch

- **Recurrence correctness across month/DST boundaries** — mitigated by date-fns + focused unit tests and a single injectable `now()`.
- **Timezone handling** — store UTC, format in a fixed locale/tz for display consistency; seed data carries `-07:00` offsets.
- **Seed enum coverage** — confirm all distinct `repeat`/`refill_schedule` values in the gist map to enum members before finalizing the schema (add `DAILY`/others if present).
- **Plaintext passwords** — intentional per brief; isolated to the Credentials compare and documented in README.

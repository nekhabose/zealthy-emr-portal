# Zealthy — Mini-EMR & Patient Portal: Implementation Plan

## Phase status

| Phase | Title                                | Status         |
| ----- | ------------------------------------ | -------------- |
| 0     | Scaffold & tooling                   | ✅ Complete (2026-07-15) |
| 1     | Data layer                           | ✅ Complete (2026-07-15) |
| 2     | Shared domain logic                  | ✅ Complete (2026-07-15) |
| 3     | Services & Server Actions (CRUD)     | ✅ Complete (2026-07-15) |
| 4     | Mini-EMR (`/admin`)                  | ✅ Complete (2026-07-15) |
| 5     | Auth + Patient Portal (`/`)          | ✅ Complete (2026-07-15) |
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
| Lives at `/admin`, **no auth** | ✅ `app/admin/*` route group (open access; `app/admin/layout.tsx`) |
| Main page = **table of users w/ at-a-glance data** | ✅ `app/admin/page.tsx` (name, email, # upcoming appts, next appt, # active Rx) |
| Drill into a **patient record** → upcoming appts + prescribed meds | ✅ `app/admin/patients/[id]/page.tsx` |
| **Prescriptions CRUD** | ✅ Phase 3 services/actions + `PrescriptionForm` / `PrescriptionRow` |
| **Appointments CRUD** (+ end recurring, schedule new) | ✅ Phase 3 + `AppointmentForm` / `AppointmentRow`; end-recurring button |
| **Patient data CRU + New patient form** (settable password) | ✅ `patients/new/page.tsx` + editable basic info (`PatientForm`) |

**Section 2 — Patient Portal**

| Brief requirement | Where handled |
|---|---|
| Lives at root **`/`** | ✅ `app/(portal)/page.tsx` (login or redirect) |
| **Login form** (email + password) | ✅ `LoginForm` → `loginAction` → `signIn('credentials')` |
| Login with **sample creds OR EMR-created creds** | ✅ Verified live for both (seeded + freshly created) |
| Main page **summary**: appts next 7 days, refills next 7 days, basic info | ✅ `app/(portal)/portal/page.tsx` via `getPatientSummary()` |
| Drill down → **full upcoming appointment schedule** (3 mo) | ✅ `app/(portal)/portal/appointments/page.tsx` |
| Drill down → **all prescriptions** (3 mo refills) | ✅ `app/(portal)/portal/prescriptions/page.tsx` |
| Per-patient data isolation | ✅ Reads keyed by `session.patientId` (`requirePatient()`); verified live |

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

## Phase 1 — Data layer  ✅ COMPLETE (2026-07-15)

**Goal:** schema, migration, idempotent seed from the gist.

- [x] Wrote the Prisma models above; `prisma migrate dev --name init` → migration `20260715212929_init` created + applied.
- [x] **Seed script** `prisma/seed.ts` (wired via `package.json` `prisma.seed`):
  - **Source gist:** https://gist.github.com/sbraford/73f63d75bb995b6597754c1707e40cc2
    (raw: https://gist.githubusercontent.com/sbraford/73f63d75bb995b6597754c1707e40cc2/raw).
    Downloaded once and embedded verbatim at `prisma/seed-data.json` so seeding is offline-deterministic and reproducible in CI/Vercel.
  - Upserts `Medication` (7 names: Diovan, Lexapro, Metformin, Ozempic, Prozac, Seroquel, Tegretol) and `Dosage` (1mg…1000mg) by unique natural key.
  - For each `users[]`: upsert `Patient` (by email), then fully replace nested `appointments`/`prescriptions`. Maps JSON `repeat`→`RepeatSchedule`, `refill_schedule`→`RefillSchedule`, `refill_on`→`refillOn`, `datetime`→`datetime`.
  - Idempotent so re-seeding is safe (verified: counts unchanged after a second run).
- [x] `lib/prisma.ts` — singleton `PrismaClient` (dev hot-reload guard).

**Files:** `prisma/schema.prisma`, `prisma/migrations/20260715212929_init/migration.sql`, `prisma/seed.ts`, `prisma/seed-data.json`, `lib/prisma.ts`, `package.json` (`prisma.seed` + `db:*` scripts), `.env` (local Postgres URL + real `AUTH_SECRET`).

**Decisions & deviations from original plan (as-built):**

- **Seed enum coverage confirmed.** The gist uses only `weekly`/`monthly` for appointment `repeat`
  and `monthly` for `refill_schedule` — all covered by `RepeatSchedule`/`RefillSchedule
  { NONE WEEKLY MONTHLY }`. No `DAILY` (or other) member is needed; the seed's enum mapper
  throws on any unknown value so future coverage gaps fail loudly rather than silently coercing.
- **`Dosage.sortOrder Int` added** (beyond the plan's bare `value @unique`). Lexical sorting
  breaks dosage strength ("10mg" < "5mg"); the seed derives `sortOrder` from the numeric prefix
  so the Phase-4 dosage dropdown can render in ascending strength. `Medication`/`Dosage`/all
  models use `cuid()` string ids.
- **`updatedAt` added to `Appointment`/`Prescription`** (plan listed only `createdAt`) — cheap
  edit-tracking that the Phase-3 update actions benefit from.
- **Idempotency strategy = upsert-parent + replace-children.** Appointments/prescriptions have no
  stable natural key, so rather than upserting nested rows the seed upserts each `Patient` by email
  then `deleteMany` + `createMany` its children inside one `$transaction`. Re-running converges to
  the same state (no duplicate rows) — the plan's "upsert by natural keys" intent, adapted to the
  keyless children.
- **Seed runs on Node's native TypeScript type-stripping** (`prisma.seed = "node prisma/seed.ts"`) —
  no `tsx`/`ts-node` dependency added (Node 26). Node emits a harmless
  `MODULE_TYPELESS_PACKAGE_JSON` reparse warning because the script is ESM (`import.meta.url`) in a
  package without `"type":"module"`; left as-is since flipping the whole Next app to ESM is an
  unnecessary Phase-1 risk.
- **`db:reset` is blocked by Prisma's AI-agent safety guard** when invoked by Claude Code (a
  deliberate guardrail against destructive resets). The script is correct for a human developer;
  Phase-1 validation instead exercised `migrate dev` + `db:seed` (twice) + direct SQL inspection.
- Added `db:migrate`, `db:reset`, `db:seed`, `db:studio` npm scripts.

**Validation (all green):**

- `prisma migrate dev --name init` — migration applied; Prisma Client regenerated.
- `npm run db:seed` — **2 patients, 4 appointments, 4 prescriptions, 7 medications, 11 dosages.**
- Re-ran `db:seed` — identical counts (idempotent).
- Direct SQL inspection: nested rows attach to the right patients; `datetime` stored UTC
  (`16:30-07:00` → `23:30Z`, timezone-correct); enum strings mapped (`weekly`→`WEEKLY`, etc.);
  `refillOn` stored as `DATE`; dosages ordered 1→1000 by `sortOrder`.
- `npm run typecheck`, `npm run lint`, `npm run build` — all clean (build still prerenders `/`).

**Verification:** `npm run db:studio` (or `npx prisma studio`) shows patients with nested rows; medications/dosages populated.

## Phase 2 — Shared domain logic (the hard part)  ✅ COMPLETE (2026-07-15)

**Goal:** one well-tested module both surfaces rely on.

- [x] `lib/datetime.ts` (**new, as-built**) — timezone-safe UTC arithmetic primitives
  (`addUTCDays`, `addUTCWeeks`, `addUTCMonths` with day-of-month clamping,
  `differenceInUTCMonths`). Isolates all tz-sensitive date math in one place.
- [x] `lib/recurrence.ts`:
  - `expandOccurrences(anchor, cadence, windowStart, windowEnd, endsAt?)` → `Date[]`.
    Steps by `addUTC{Weeks,Months}` from the original anchor, stops at
    `min(windowEnd, endsAt)`, fast-forwards past-anchor cases in O(1), caps iterations
    defensively (`MAX_ITERATIONS = 1000`).
  - `nextOccurrence(anchor, cadence, from, endsAt?)` helper for "next upcoming" in
    summaries / the admin table's next-appointment column.
- [x] `lib/windows.ts`: `next7Days(now)`, `next3Months(now)` window builders (single
  `now` seam passed by callers so services stay pure and tests are deterministic).
- [x] `lib/validation.ts`: Zod schemas — `patientSchema` / `patientUpdateSchema`,
  `appointmentSchema`, `prescriptionSchema` + `makePrescriptionSchema(meds, doses)`
  (medication ∈ reference list, dosage ∈ reference list, quantity ≥ 1, coerced
  dates, repeat/refill enums, `endsAt ≥ anchor`), and `credentialsSchema` for the
  Phase-5 login. Reused by forms and Server Actions.
- [x] `lib/types.ts`: shared DTOs (`OccurrenceView`, `AppointmentOccurrence`,
  `RefillOccurrence`, `PatientBasics`, `PatientSummary`, `PatientSchedule`,
  `PatientListItem`).
- [x] **Unit tests** (Vitest) `tests/recurrence.test.ts` — 17 cases: NONE single
  occurrence + inclusive bounds, weekly/monthly across month boundaries, Jan-31
  month-end clamp with no post-clamp drift, `endsAt` truncation (inside window +
  before window), 3-month cap, past-anchor fast-forward, and `nextOccurrence`
  (future/past one-off, past-anchor weekly, `endsAt` cutoff).

**Files:** `lib/datetime.ts`, `lib/recurrence.ts`, `lib/windows.ts`, `lib/validation.ts`,
`lib/types.ts`, `tests/recurrence.test.ts`, `vitest.config.ts`, `package.json`
(`test`/`test:watch` scripts + `vitest` devDependency).

**Decisions & deviations from original plan (as-built):**

- **Recurrence math is done in UTC, not via date-fns local arithmetic.** date-fns
  `addWeeks`/`addMonths` operate on *local wall-clock time*, so their output depends on
  the ambient `process.env.TZ` and shifts by the DST hour — a Pacific dev laptop and a
  UTC Vercel server would expand the *same* appointment to *different* instants (a
  latent production bug). Phase 2 therefore adds `lib/datetime.ts` (native UTC
  arithmetic; UTC has no DST) and the recurrence/window layers build on it. Determinism
  is proven by running the suite under `TZ=UTC`, `America/New_York`, `Asia/Kolkata`
  (:30 offset) and `Pacific/Chatham` (:45 offset) — all 17 tests pass identically.
  date-fns stays a dependency for later display-formatting use.
- **Every occurrence is computed relative to the ORIGINAL anchor** (`addUTCMonths(anchor,
  n)`), never by stepping the previous occurrence. This keeps month-end semantics stable
  — Jan 31 → Feb 28 → **Mar 31** (back to the 31st), not the Feb 28 → Mar 28 drift you
  get from re-anchoring off a clamped date. Covered by a dedicated test.
- **Reference-list membership is a schema factory, not a hardcoded enum.** Medications
  and dosages are seeded/dynamic, so `makePrescriptionSchema(medications, dosages)`
  refines the base `prescriptionSchema` against the sets fetched at request time. A base
  `prescriptionSchema` (non-empty strings) is also exported for callers without the list.
- **Zod v4 API.** Uses top-level `z.email()`, `z.coerce.{date,number}`, and
  `z.preprocess` (empty date input → `undefined` for optional `endsAt`), matching the
  installed `zod@4.4.3`.
- **Vitest 4** added as the test runner (`vitest.config.ts`, node environment, scoped to
  `tests/**`). No `@testing-library`/DOM env needed — Phase 2 is pure domain logic.

**Validation (all green):**

- `npm test` — **17/17 passing**; re-run under `TZ=UTC`, `America/New_York`,
  `Asia/Kolkata`, `Pacific/Chatham` — identical results (timezone-independent).
- **Seed-anchor smoke:** the real seed appointment `2026-04-16T16:30:00-07:00`
  (= `23:30Z`) expanded weekly from a fixed `now = 2026-07-15Z` → 1 occurrence in the
  next 7 days (Jul 16 23:30Z), **13** in the next 3 months (Jul 16 → Oct 8, every one
  exactly 7 days apart, no drift); `endsAt` before the window correctly yields `null`.
- `npm run typecheck`, `npm run lint`, `npm run build` — all clean.

**Verification:** `npm test` (optionally `TZ=<zone> npm test` to confirm determinism).

## Phase 3 — Services & Server Actions (CRUD)  ✅ COMPLETE (2026-07-15)

**Goal:** all mutations + reads, framework-thin.

- [x] **Pure mapper layer** `lib/services/mappers.ts` (**new, as-built**) — the row→DTO
  assembly split out as PURE functions (no DB, no wall-clock): `expandAppointments`,
  `expandRefills`, `toPatientListItem`, `toPatientSummary`, `toPatientSchedule`,
  `isActivePrescription`, and the raw-record projectors. Built on the Phase-2
  recurrence/window layer; unit-tested with fabricated rows.
- [x] `lib/services/{patients,appointments,prescriptions,reference,portal}.ts` — thin
  DB functions that query Prisma and delegate shaping to the mappers:
  - patients: `listPatientsWithCounts(now)`, `getPatientDetail(id)`, `createPatient`, `updatePatient`.
  - appointments: `createAppointment`, `updateAppointment`, `deleteAppointment`, `endAppointmentRecurrence`.
  - prescriptions: `createPrescription`, `updatePrescription`, `deletePrescription`, `endPrescriptionRecurrence`.
  - reference (**new, as-built**): `listMedications()`, `listDosages()` (ordered by seeded `sortOrder`) — the prescription form's option sources.
  - portal: `getPatientSummary(patientId, now)` (7-day appts + 7-day refills + basics) and `getPatientSchedule(patientId, now)` (3-month expansions).
- [x] `app/admin/actions.ts` — the admin Server Actions (matches the plan's
  `admin/**/actions.ts`). Each: Zod-parse `FormData` → service call → `revalidatePath("/admin", "layout")` → typed `FormState` (`{ ok, errors?, message? }`) for inline form validation. Covers patient create/update, appointment create/update/delete/end-recurrence, and prescription create/update/delete/end-recurrence.
- [x] "**End recurring**" = `endAppointmentRecurrenceAction` / `endPrescriptionRecurrenceAction`, setting `endsAt = now` by default (or a chosen date from the form) — to be surfaced as a button in Phase 4.
- [x] **Tests:** pure mapper + action-helper **unit tests** (DB-free, in the default
  `npm test` run) and a **live integration suite** (`npm run test:int`) that drives the
  real service layer against Postgres.

**Files:** `lib/services/mappers.ts`, `lib/services/patients.ts`, `lib/services/appointments.ts`, `lib/services/prescriptions.ts`, `lib/services/reference.ts`, `lib/services/portal.ts`, `lib/action-helpers.ts`, `app/admin/actions.ts`, `lib/types.ts` (added `AppointmentRecord`, `PrescriptionRecord`, `PatientDetail`, `FormState`), `tests/services-mappers.test.ts`, `tests/action-helpers.test.ts`, `tests/integration/services.test.ts`, `vitest.config.ts` (exclude integration), `vitest.integration.config.ts`, `package.json` (`test:int` script), `eslint.config.mjs` (`_`-prefix ignore).

**Decisions & deviations from original plan (as-built):**

- **Pure/impure split for testability.** The plan called the services "pure DB
  functions". As-built, the genuinely testable logic (occurrence expansion + the
  at-a-glance rollups) is extracted into `lib/services/mappers.ts` as pure functions;
  the service files are the thin DB edge that fetches rows and delegates. This lets the
  hard logic be unit-tested with fabricated rows (no DB) — matching Phase 2's
  single-`now`-seam philosophy — while a separate integration suite proves the DB
  wiring.
- **`now` is injected into reads, read from the clock only at the edge.** Read helpers
  (`listPatientsWithCounts`, `getPatientSummary`, `getPatientSchedule`) take an explicit
  `now` so expansion stays deterministic; the Server Component (Phase 4/5) or Server
  Action passes `new Date()`. Actions legitimately read the clock (e.g. end-recurrence
  default), since they are the impure request edge.
- **`FormState` return contract.** Actions return `{ ok, errors?, message? }` (typed in
  `lib/types.ts`), shaped for React 19's `useActionState`. Field errors are built by
  hand from `ZodError.issues` (`lib/action-helpers.fieldErrors`) so the mapping is
  stable across Zod minor versions; a top-level refine (empty path) buckets under
  `_form`. Duplicate-email inserts are caught (Prisma `P2002`) and returned as an inline
  `email` field error instead of a 500.
- **Action signatures lead with bound ids.** `updateXAction(id, prevState, formData)`,
  `createAppointmentAction(patientId, prevState, formData)`, etc. — so Phase-4 forms
  bind the id with `action.bind(null, id)` and hand the rest to `useActionState`.
- **Single `app/admin/actions.ts`.** One co-located admin actions module (glob-matches
  `admin/**/actions.ts`) rather than several; Phase 4 can split if a route needs it.
  Helpers and the `FormState` type live in non-`"use server"` modules (`lib/*`) because a
  `"use server"` file may only export async functions.
- **Revalidation is coarse (`/admin` layout).** After any admin mutation we
  `revalidatePath("/admin", "layout")`, refreshing the table and every patient-detail
  page without threading `patientId` through delete/update actions.
- **"Active prescription" = not discontinued.** For the admin "# active Rx" column, a
  prescription is active iff `endsAt` is null or `endsAt >= now` (the EMR "currently
  prescribed" meaning), deliberately independent of refill timing. Documented in the
  mapper.
- **"Upcoming appointments" counts records, not occurrences.** `upcomingAppointmentCount`
  counts appointment ROWS with any occurrence on/after `now` (a recurring row counts
  once), keeping the number bounded/intuitive; `nextAppointment` is the soonest
  occurrence across all rows.
- **Two Vitest projects.** `npm test` runs the pure unit suite (fast, DB-free,
  CI-safe); `npm run test:int` runs the DB-backed integration suite against the local
  Postgres (separate `vitest.integration.config.ts`, `fileParallelism` off). Integration
  tests create throwaway rows under unique emails and cascade-delete them in
  `afterAll`, never mutating the seeded sample patients.
- **ESLint `_`-prefix ignore.** Added `argsIgnorePattern/varsIgnorePattern: "^_"` so the
  `useActionState`-mandated but unused `_prev`/`_formData` params in delete actions don't
  warn — keeping lint clean.

**Validation (all green):**

- `npm test` — **34/34 passing** (recurrence 17 + mappers 12 + action-helpers 5).
- `npm run test:int` — **12/12 passing** against live Postgres: reference-list order,
  create/read patient, duplicate-email `P2002`, add appointment + prescription,
  at-a-glance rollups, 7-day summary + 3-month schedule expansion, edit, end-recurrence
  truncation, per-patient isolation, update, delete. Seed counts unchanged afterward
  (2 patients / 4 appts / 4 Rx).
- `npm run typecheck`, `npm run lint`, `npm run build` — all clean (build still
  prerenders `/`).

**Verification:** `npm test && npm run test:int` (the latter needs the local Postgres up).

## Phase 4 — Mini-EMR (`/admin`)  ✅ COMPLETE (2026-07-15)

**Goal:** full admin functionality, clean-but-basic styling (polish deferred to Phase 6).

- [x] `app/admin/layout.tsx` (**new, as-built**) — shared header + max-width container for
  the whole EMR surface; switches to the Geist sans font. Documents the "open by design,
  no auth" stance inline.
- [x] `app/admin/page.tsx` — **patients table** (name, email, # upcoming appts, next appt,
  # active Rx) with at-a-glance data; "New patient" button. Server Component reading
  `listPatientsWithCounts(new Date())`; empty-state card when there are no patients.
- [x] `app/admin/patients/new/page.tsx` — new-patient form (name, email, **password**),
  wired to `createPatientAction` (redirects to the new record on success).
- [x] `app/admin/patients/[id]/page.tsx` — patient record: editable basic info (CRU),
  **Appointments** section (list + add/edit/delete + end-recurring), **Prescriptions**
  section (list + add/edit/delete + end-refills). Async `params` (Next 16). `notFound()`
  on an unknown id.
- [x] Form components (`components/admin/*`): `PatientForm`, `AppointmentForm` (provider
  free-text, `datetime-local`, repeat select, optional end date), `PrescriptionForm`
  (medication select ← reference table, dosage select ← reference table, quantity,
  refillOn, refillSchedule, optional end date). Client components on `useActionState`
  reusing the Phase-2 Zod schemas for inline field errors + pending state.
- [x] `AppointmentRow` / `PrescriptionRow` — read-view ⇄ inline editor toggle;
  `Disclosure` gates the add forms; `ConfirmForm` runs delete / end-recurrence behind a
  native `confirm()`. Bound Server Actions (`action.bind(null, id)`) passed as props.
- [x] `components/ui/controls.tsx` — shared presentational primitives (class tokens,
  `Field`, `FieldError`, `FormNotice`, `Chip`); `lib/format.ts` — timezone-correct date
  formatting for both display and `<input>` default values.

**Files:** `app/admin/layout.tsx`, `app/admin/page.tsx`, `app/admin/patients/new/page.tsx`,
`app/admin/patients/[id]/page.tsx`, `components/ui/controls.tsx`, `lib/format.ts`,
`components/admin/{action.ts, cadence.ts, PatientForm.tsx, AppointmentForm.tsx,
PrescriptionForm.tsx, AppointmentRow.tsx, PrescriptionRow.tsx, ConfirmForm.tsx,
Disclosure.tsx}`. (No changes needed to the Phase-3 actions/services — the forms bind to
them as designed.)

**Decisions & deviations from original plan (as-built):**

- **Dates are formatted to strings on the SERVER, and only strings cross into client
  components.** `lib/format.ts` turns each stored `Date` into both its human display
  string and its `<input>` default-value string inside the Server Components; the client
  rows/forms receive plain strings, never `Date`s. This eliminates the client/server
  timezone-divergence class of hydration mismatch entirely. TZ handling is split by
  column kind: appointment `datetime` (a real timestamp) uses **local** getters so the
  wall-clock shown round-trips through `new Date(localString)` on the same server;
  date-only values (`refillOn @db.Date`, date-input `endsAt`) use **UTC** getters to
  avoid the classic off-by-one-day shift.
- **`useActionState`, not `useFormStatus`.** The plan mentioned `useFormStatus`; as-built,
  every form uses React 19's `useActionState` — its third return value is the `pending`
  flag, so a separate status child isn't needed, and it already carries the typed
  `FormState` for inline field errors. Delete / end-recurrence also go through
  `useActionState` (via `ConfirmForm`) so the bound actions' `(prevState, formData)`
  signature is satisfied — a plain `<form action>` would call them with only `formData`.
- **Forms are action-agnostic and reusable.** Each form takes its Server Action as a
  **prop** (`BoundAction`) rather than importing the action module, so one `PatientForm`
  serves both create (new-patient page) and edit (record page), and one `AppointmentForm`
  serves the add disclosure and every row's inline editor. The Server Component binds the
  id (`updateAppointmentAction.bind(null, a.id)`) and passes it down.
- **Passwords are a visible text input.** The brief wants admin-settable passwords to ease
  portal testing, so the operator must be able to read what they set — the field is
  `type="text"`. In edit mode it's optional (blank ⇒ keep current, per `patientUpdateSchema`).
- **"End recurring" ends as of now** behind a confirm (the action's default), shown only
  when a row is actually recurring and not already terminated (`repeat !== NONE && endsAt
  === null`). A chosen end-date is supported by the action but not surfaced as UI — a
  deliberate Phase-4 scope trim.
- **`export const dynamic = "force-dynamic"`** on `/admin` and the record page — an
  internal tool over mutable data should always render fresh, not be statically cached.
- **A touch of brand green** (`emerald-800` primary, soft chips) is used even though full
  design polish is Phase 6 — cheap, makes the surface look intentional, and low-risk to
  restyle later against the real tokens.

**Validation (all green):**

- `npm run typecheck` — clean. `npm run lint` — clean.
- `npm test` — **34/34** (Phase 0–3 suites unaffected). `npm run test:int` — **12/12**
  against live Postgres (seed counts unchanged: 2 patients / 4 appts / 4 Rx).
- `npm run build` — production build compiles; routes emitted: `/admin` (ƒ dynamic),
  `/admin/patients/[id]` (ƒ dynamic), `/admin/patients/new` (○ static).
- **Live smoke (`npm run dev`):** all three admin routes return **HTTP 200** with the
  expected content (table with both seeded patients + at-a-glance columns; new-patient
  form with the plaintext-password note; record page with Basic info / Appointments /
  Prescriptions sections and the seeded medication options populating the Rx dropdown).
- **Live end-to-end mutation:** replayed the create-patient Server Action against the
  running server (no-JS form encoding) → **303 redirect** to the new record; the new
  patient then rendered in the `/admin` table (read + rollup path over fresh data); a
  duplicate-email submit returned the inline **"already exists"** field error (P2002
  caught, **not** a 500). Test patient cleaned up afterward (count back to 2).

**Verification:** `npm run dev` → at `/admin`: create a patient, add/edit/delete an
appointment + prescription, end a recurring appointment — all persist across reload.

## Phase 5 — Auth + Patient Portal (`/`)  ✅ COMPLETE (2026-07-15)

**Goal:** login and patient-facing views.

- [x] **Auth.js v5 split-config.** `auth.config.ts` (**new, as-built** — edge-safe base:
  session strategy `jwt`, `pages.signIn = "/"`, and the `jwt` / `session` / `authorized`
  callbacks; **no** DB, **no** providers) + `auth.ts` (extends it with the Credentials
  provider that looks up `Patient` by email and compares the plaintext password, returning
  `{ id, name, email }`). Session carries `patientId` (promoted to the top level of the
  Session in the `session` callback). Exports `handlers`, `auth`, `signIn`, `signOut`.
- [x] `app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- [x] **`proxy.ts`** (**not `middleware.ts`** — see deviations) guards `/portal/*` using the
  edge-safe config only; unauthenticated hits redirect to `/`.
- [x] `lib/auth-helpers.ts` (**new, as-built**) — `requirePatient()`: the authoritative
  server-side check called by every portal page (redirects to `/` if unauthenticated),
  returning `{ patientId, session }`.
- [x] `app/(portal)/page.tsx` — if authenticated, `redirect('/portal')`; else render the
  **login form** (`LoginForm` → `loginAction` → `signIn('credentials')`). Surfaces the
  seeded sample credential inline (take-home reviewers need to log in immediately).
- [x] `app/(portal)/portal/layout.tsx` — authenticated shell: greeting + `PortalNav`
  (active-tab highlight) + **sign-out** (`<form action={signOutAction}>`).
- [x] `app/(portal)/portal/page.tsx` — **dashboard**: personalized greeting, basic info,
  "Appointments · next 7 days", "Refills · next 7 days", drill-down links. Uses
  `getPatientSummary(patientId, new Date())`.
- [x] `app/(portal)/portal/appointments/page.tsx` — full 3-month schedule (expanded
  occurrences) via `getPatientSchedule`.
- [x] `app/(portal)/portal/prescriptions/page.tsx` — all prescriptions with upcoming
  3-month refill dates via `getPatientSchedule`.
- [x] Session-scoped: every query keyed by `session.patientId` — a patient only sees their
  own data (verified live). Sign-out action clears the session and returns to `/`.

**Files:** `auth.config.ts`, `auth.ts`, `proxy.ts`, `types/next-auth.d.ts`,
`lib/auth-helpers.ts`, `app/api/auth/[...nextauth]/route.ts`, `app/(portal)/actions.ts`,
`app/(portal)/layout.tsx`, `app/(portal)/page.tsx`, `app/(portal)/portal/layout.tsx`,
`app/(portal)/portal/page.tsx`, `app/(portal)/portal/appointments/page.tsx`,
`app/(portal)/portal/prescriptions/page.tsx`, `components/portal/LoginForm.tsx`,
`components/portal/PortalNav.tsx`, `components/portal/schedule.tsx`. **Removed** the
`create-next-app` default `app/page.tsx` (it collided with the route-group `/`) and its
unused SVG assets.

**Decisions & deviations from original plan (as-built):**

- **`middleware.ts` → `proxy.ts` (Next.js 16 rename).** Per `AGENTS.md` ("this is NOT the
  Next.js you know") and confirmed in `node_modules/next/dist/docs/.../16-proxy.md`:
  *"Starting with Next.js 16, Middleware is now called Proxy."* The plan's `middleware.ts`
  is therefore implemented as `proxy.ts`. Next 16 also requires the proxy to be a **declared
  function export** — a destructured `export const { auth: proxy } = NextAuth(...)` builds
  but fails page-data collection ("must export a function"), so `proxy.ts` wraps Auth.js's
  `auth` runner in an explicit `export default function proxy(request, event)`.
- **Split-config (`auth.config.ts` + `auth.ts`), not one `auth.ts`.** The canonical Auth.js
  v5 pattern: session *verification* (decode the signed JWT) runs on every guarded request
  and must stay free of the Prisma import, so the callbacks + guard live in an edge-safe
  `auth.config.ts` that `proxy.ts` consumes; the Credentials provider + DB lookup live in
  `auth.ts` (Node runtime: route handlers, Server Components, Server Actions). Keeps the
  proxy bundle small and Node-dep-free.
- **Defense in depth: proxy guard AND `requirePatient()`.** The Next.js auth guidance is
  explicit that middleware/proxy is an *optimistic* check and the authoritative check
  belongs next to the data (a layout check alone doesn't re-run on client-side navigation).
  So `proxy.ts` gives the fast redirect, and **every portal page** additionally calls
  `requirePatient()` (a real `auth()` check) right before its data fetch. Both were verified
  live.
- **Stateless JWT sessions.** `session.strategy = "jwt"` — the `patientId` rides in the
  signed cookie, so there's no session table and the proxy can authorize from the cookie
  alone. `AUTH_SECRET` (already in `.env` from Phase 1) signs it; Auth.js v5 infers it.
- **Generic auth errors.** `authorize` returns `null` for BOTH unknown-email and
  wrong-password, and `loginAction` maps the resulting `AuthError` to a single "Invalid
  email or password." form error — never revealing which field was wrong. On success
  `signIn` throws the `NEXT_REDIRECT` to `/portal`, which the action rethrows (only
  `AuthError` is swallowed).
- **Dates formatted to strings on the server** (same discipline as Phase 4): the portal
  Server Components format every occurrence `Date` via `lib/format` and pass only strings
  into the presentational `components/portal/schedule.tsx` items — no `Date` crosses the
  client boundary, so no timezone-driven hydration mismatch. Appointment timestamps use
  `formatDateTime` (local), date-only refills use `formatDate` (UTC).
- **Type augmentation** (`types/next-auth.d.ts`) adds `patientId` to `Session`/`JWT`; the
  `session` callback uses a `typeof` narrow so the assignment is type-safe regardless of how
  the `next-auth/jwt` augmentation resolves.
- **`export const dynamic = "force-dynamic"`** on `/` and all `/portal/*` pages — every
  render depends on the current session, so nothing is statically cached.
- **No new dependencies.** `next-auth@5.0.0-beta.31` was already installed in Phase 0; Phase
  5 added zero packages.

**Validation (all green):**

- `npm run typecheck` — clean. `npm run lint` — clean.
- `npm test` — **34/34** (Phase 0–3 suites unaffected). `npm run test:int` — **12/12**
  against live Postgres (seed counts unchanged: 2 patients / 4 appts / 4 Rx).
- `npm run build` — production build compiles; routes emitted: `/` (ƒ dynamic), `/portal`,
  `/portal/appointments`, `/portal/prescriptions` (all ƒ dynamic),
  `/api/auth/[...nextauth]` (ƒ), and **ƒ Proxy (Middleware)**.
- **Live end-to-end (`npm run dev`, 16 automated assertions + follow-ups):**
  - Unauthenticated `/portal`, `/portal/appointments`, `/portal/prescriptions` → **307**
    redirect to `/?callbackUrl=…` (proxy guard).
  - Login as seeded **Mark** (`mark@some-email-provider.net` / `Password123!`) → **302** +
    session cookie; `/portal` renders his greeting + 7-day sections.
  - **Wrong password** → no session cookie set (rejected).
  - Login as **Lisa** → her dashboard renders; it does **not** contain Mark's email
    (**per-patient isolation** confirmed both directions).
  - A patient **created fresh** (EMR-style plaintext row) logs in and sees their dashboard.
  - Already-authenticated `GET /` → **307** redirect to `/portal`; anonymous `GET /` →
    **200** login form.
  - Mark's 3-month drill-downs render **16 appointment occurrences** and **12 refill rows**
    with real medication names and Weekly/Monthly recurrence chips (recurrence expansion
    genuinely rendering end-to-end).
  - Seed counts unchanged afterward (2 / 4 / 4).

**Verification:** `npm run dev` → at `/`: log in with `mark@some-email-provider.net` /
`Password123!` (or a patient created in `/admin`); confirm the 7-day summary and the
3-month drill-downs are correct and isolated per patient; sign out.

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
auth.config.ts  auth.ts  proxy.ts        # proxy.ts = Next 16's renamed middleware
types/next-auth.d.ts
lib/prisma.ts  lib/recurrence.ts  lib/windows.ts  lib/validation.ts  lib/types.ts
lib/auth-helpers.ts
lib/services/{patients,appointments,prescriptions,reference,portal}.ts
components/{ui, portal, admin}/…
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

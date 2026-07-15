# Zealthy — Mini-EMR & Patient Portal

A full-stack take-home built as **two apps in one Next.js project**:

1. **Mini-EMR** at `/admin` (no auth) — a table of patients with at-a-glance data;
   drill into a patient to manage **appointments (CRUD)**, **prescriptions (CRUD)**,
   and **patient records** (create/read/update, including creating a new patient
   with a settable password).
2. **Patient Portal** at `/` — email/password login, then a dashboard summarizing
   **appointments in the next 7 days** and **refills in the next 7 days** plus basic
   patient info; drill-downs show the **full upcoming schedule out to 3 months**.

The full implementation plan lives in [`plan.md`](./plan.md); the exercise brief and
design direction live in [`Zealthy.md`](./Zealthy.md).

---

## Tech stack

| Concern            | Choice                                                        |
| ------------------ | ------------------------------------------------------------- |
| Framework          | **Next.js 16** (App Router, full-stack) + **React 19**        |
| Language           | **TypeScript**                                                |
| Styling            | **Tailwind CSS v4** (CSS-first config)                        |
| Database           | **Postgres** (Neon in production) via **Prisma 6**            |
| Auth               | **Auth.js / NextAuth v5** (Credentials provider, JWT sessions) |
| Validation         | **Zod v4** — shared client/server schemas *(Phase 2)*         |
| Date / recurrence  | **UTC-native** helpers (`lib/datetime.ts`) *(Phase 2)*        |
| Data access        | **Service layer + Server Actions** (`lib/services/*`, `app/admin/actions.ts`) *(Phase 3)* |
| Tests              | **Vitest** — unit (recurrence, mappers) + live integration *(Phase 3)* |
| Deployment         | **Vercel** — *Phase 7*                                         |

### A note on Prisma versions

Prisma **7** removed the classic `url = env("DATABASE_URL")` datasource model in
favour of a `prisma.config.ts` + driver-adapter setup. To keep the data layer
simple and directly compatible with a Neon connection string, this project pins to
the mature **Prisma 6.x** line. This is a deliberate decision, revisitable later.

---

## Project status

This repository is being built in phases (see [`plan.md`](./plan.md)).

| Phase | Description                                | Status         |
| ----- | ------------------------------------------ | -------------- |
| **0** | **Scaffold & tooling**                     | ✅ **Complete** |
| **1** | **Data layer (schema, migration, seed)**   | ✅ **Complete** |
| **2** | **Shared domain logic (recurrence, windows, validation)** | ✅ **Complete** |
| **3** | **Services & Server Actions (CRUD)**       | ✅ **Complete** |
| **4** | **Mini-EMR (`/admin`)**                    | ✅ **Complete** |
| **5** | **Auth + Patient Portal (`/`)**            | ✅ **Complete** |
| 6     | Design system & motion polish              | ⬜ Not started  |
| 7     | Deploy, docs, ship                         | ⬜ Not started  |

**Phase 0 delivered:** a running Next.js + TypeScript + Tailwind skeleton, the
Phase-1+ dependencies installed (Prisma, Zod, NextAuth v5, date-fns), a Postgres
Prisma datasource, environment templates, and this README.

**Phase 1 delivered:** the full Prisma data model (`Patient`, `Appointment`,
`Prescription`, and the `Medication` / `Dosage` reference tables + `RepeatSchedule` /
`RefillSchedule` enums), the `init` migration, a Prisma-client singleton
(`lib/prisma.ts`), and an **idempotent seed** (`prisma/seed.ts`) that loads the sample
patients and reference lists from a local copy of the exercise gist
(`prisma/seed-data.json`). Recurrence is stored as an anchor + cadence + optional
`endsAt` and expanded at read time in Phase 2 — see the data-model section below.

**Phase 2 delivered:** the shared domain layer both surfaces rely on — recurrence
expansion (`lib/recurrence.ts`), time-window builders (`lib/windows.ts`), UTC-safe date
arithmetic (`lib/datetime.ts`), Zod validation schemas (`lib/validation.ts`), and shared
view-model DTOs (`lib/types.ts`) — plus a **Vitest** suite for the recurrence math. See
[Shared domain logic](#shared-domain-logic-phase-2) below.

**Phase 3 delivered:** the data-access layer both surfaces build on — a pure
row→DTO mapper module (`lib/services/mappers.ts`), the DB service functions
(`lib/services/{patients,appointments,prescriptions,reference,portal}.ts`), and the
admin **Server Actions** (`app/admin/actions.ts`) that Zod-validate form input, call a
service, revalidate, and return a typed `FormState`. Backed by DB-free unit tests **and**
a live integration suite. See [Service & action layer](#service--action-layer-phase-3)
below.

**Phase 4 delivered:** the full **mini-EMR at `/admin`** — a patients table with
at-a-glance data, a new-patient form, and a patient record page with editable basic info
plus **appointment** and **prescription** CRUD (add / inline-edit / delete / end-recurring).
Built as Server Components reading the Phase-3 services, with small client forms on
`useActionState` reusing the Phase-2 Zod schemas. See
[Mini-EMR admin surface](#mini-emr-admin-surface-phase-4) below.

**Phase 5 delivered:** the **patient portal at `/`** — **Auth.js / NextAuth v5** email +
password login (Credentials provider), a personalized dashboard (basic info + next-7-day
appointments + next-7-day refills), and 3-month drill-downs for appointments and
prescriptions. Every read is scoped to the signed-in `patientId`, guarded by both a
`proxy.ts` redirect and a `requirePatient()` check next to the data. See
[Patient portal](#patient-portal-phase-5) below.

---

## Data model

```
Patient        id, name, email @unique, password, createdAt, updatedAt
               → appointments[]  prescriptions[]
Appointment    id, patientId→Patient, provider, datetime,
               repeat (RepeatSchedule), endsAt?, createdAt, updatedAt
Prescription   id, patientId→Patient, medication, dosage, quantity,
               refillOn @db.Date, refillSchedule (RefillSchedule), endsAt?, …
Medication     id, name @unique                 // reference list, seeded
Dosage         id, value @unique, sortOrder      // reference list, seeded (numeric order)

enum RepeatSchedule { NONE WEEKLY MONTHLY }
enum RefillSchedule { NONE WEEKLY MONTHLY }
```

- **`medication` / `dosage` are denormalized string snapshots** on the prescription; the
  create/edit form's selectable options are driven by the `Medication` / `Dosage`
  reference tables.
- **Recurrence is computed, not stored.** An appointment/prescription persists one anchor
  (`datetime` / `refillOn`) + a cadence + an optional `endsAt` (the "end recurring" action).
  Concrete occurrences are expanded within a window at read time (Phase 2).
- **The seed is idempotent:** patients are upserted by `email` and their children fully
  replaced on each run, so re-seeding converges instead of duplicating.

---

## Shared domain logic (Phase 2)

The two surfaces share one small, well-tested domain layer under `lib/` rather than
duplicating date math or validation:

| Module              | Responsibility                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| `lib/datetime.ts`   | Timezone-safe **UTC** date arithmetic (`addUTCDays/Weeks/Months`, month diff).  |
| `lib/recurrence.ts` | `expandOccurrences(anchor, cadence, start, end, endsAt?)` and `nextOccurrence`. |
| `lib/windows.ts`    | `next7Days(now)` / `next3Months(now)` window builders (single injected `now`).  |
| `lib/validation.ts` | Zod schemas for patient/appointment/prescription/credentials, shared by forms + Server Actions. |
| `lib/types.ts`      | Serialisable view-model DTOs (`AppointmentOccurrence`, `PatientSummary`, …).    |

**Why recurrence math runs in UTC.** Appointments/prescriptions store a single anchor +
a cadence (`NONE`/`WEEKLY`/`MONTHLY`) + an optional `endsAt`; concrete occurrences are
never persisted — they're expanded within a window at read time. That expansion is done
with **native UTC arithmetic**, not date-fns' local-time helpers, because local-time
arithmetic depends on the machine's timezone and shifts by the DST hour — so the same
appointment would expand to different instants on a Pacific dev laptop vs. a UTC server.
UTC has no DST, so expansion is identical on every machine. Each occurrence is also
computed relative to the *original* anchor, so month-end recurrences don't drift
(Jan 31 → Feb 28 → **Mar 31**, not Mar 28).

**Tests.** `npm test` runs the Vitest suite (`tests/recurrence.test.ts`, 17 cases:
weekly/monthly across month boundaries, month-end clamping, `endsAt` truncation,
one-off/`NONE`, 3-month cap, past-anchor fast-forward). Timezone-independence is verified
by running it under several zones:

```bash
npm test                          # default
TZ=UTC npm test                   # identical results …
TZ=America/New_York npm test      # … under any timezone
```

---

## Service & action layer (Phase 3)

Both surfaces read and mutate data through a thin, framework-agnostic layer rather
than touching Prisma from components:

| Module                              | Responsibility                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/services/mappers.ts`           | **Pure** row→DTO assembly — occurrence expansion, at-a-glance rollups, active-Rx predicate. No DB, no clock. |
| `lib/services/patients.ts`          | `listPatientsWithCounts(now)`, `getPatientDetail(id)`, `createPatient`, `updatePatient`. |
| `lib/services/appointments.ts`      | `createAppointment`, `updateAppointment`, `deleteAppointment`, `endAppointmentRecurrence`. |
| `lib/services/prescriptions.ts`     | `createPrescription`, `updatePrescription`, `deletePrescription`, `endPrescriptionRecurrence`. |
| `lib/services/reference.ts`         | `listMedications()`, `listDosages()` — the prescription form's option sources.       |
| `lib/services/portal.ts`            | `getPatientSummary(patientId, now)` (7-day), `getPatientSchedule(patientId, now)` (3-month). |
| `app/admin/actions.ts`              | Admin **Server Actions**: Zod-parse → service → `revalidatePath` → typed `FormState`. |

**Design.** The genuinely testable logic (expanding stored anchors into occurrences,
computing the admin table's counts) is isolated as **pure functions** in `mappers.ts`;
the service files are the thin DB edge that fetches rows and delegates. Read helpers take
an explicit `now` (the same single-seam pattern as Phase 2), so expansion is
deterministic and unit-testable; the calling Server Component / Action supplies
`new Date()` at the edge.

**Server Actions** return a serialisable `{ ok, errors?, message? }` (`FormState`) shaped
for React 19's `useActionState`, so the Phase-4/5 forms get inline field errors. A
duplicate-email insert is caught (Prisma `P2002`) and returned as an `email` field error
rather than a 500. "**End recurring**" is an action that sets `endsAt` (defaulting to
now), truncating future occurrences.

**Tests.** Two suites:

```bash
npm test          # pure unit tests — recurrence + mappers + action helpers (no DB, CI-safe)
npm run test:int  # live integration — drives the service layer against a real Postgres
```

The integration suite creates throwaway rows under unique emails and cascade-deletes them
afterward, so it never disturbs the seeded sample patients.

---

## Mini-EMR admin surface (Phase 4)

The `/admin` surface is the operator-facing EMR — **open by design** (the brief specifies
no auth here; the Phase-5 portal is the guarded surface). It's built entirely on the
Phase-3 services and actions, with no changes to that layer.

### Routes

| Route                       | What it is                                                                                   |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `/admin`                    | **Patients table** — name, email, # upcoming appointments, next appointment, # active Rx; "New patient" button; empty-state when there are none. |
| `/admin/patients/new`       | **New-patient form** — name, email, and a settable password.                                 |
| `/admin/patients/[id]`      | **Patient record** — editable basic info + **Appointments** and **Prescriptions** sections (add / inline-edit / delete / end-recurring). |

### How it's built

- **Server Components read; client components mutate.** Each page is an async Server
  Component that reads a Phase-3 service (`listPatientsWithCounts`, `getPatientDetail`,
  `listMedications` / `listDosages`). The interactive pieces — forms, the row edit toggle,
  confirm-to-delete — are small client components under `components/admin/`.
- **Forms take their Server Action as a prop.** Instead of importing the action module,
  each form receives a bound action (`updateAppointmentAction.bind(null, id)`) as a prop,
  so a single `PatientForm` / `AppointmentForm` / `PrescriptionForm` serves both the
  create and edit cases. Forms use React 19's **`useActionState`** for inline field errors
  (from the shared Zod schemas, re-parsed server-side) and the pending state.
- **The prescription form's options come from the reference tables.** The medication and
  dosage `<select>`s are populated from the seeded `Medication` / `Dosage` tables and the
  action re-validates the submitted values against those same lists.
- **Dates are formatted on the server; only strings cross to the client.** `lib/format.ts`
  produces both the human display string and the `<input>` default-value string inside the
  Server Components, so there's no client/server timezone divergence (no hydration
  mismatch). Timestamps use local getters (so the wall-clock round-trips through
  `datetime-local`); date-only values use UTC getters (so `@db.Date` values don't shift a
  day).
- **Styling is clean-but-basic** (Tailwind utilities, a little brand green); the full
  design system and motion land in Phase 6.

### Try it

```bash
npm run dev            # → http://localhost:3000/admin
```

Create a patient, open their record, add an appointment and a prescription, edit and
delete them, and end a recurring appointment — every change persists across reload (the
actions `revalidatePath('/admin')` after each write).

---

## Patient portal (Phase 5)

The `/` surface is the patient-facing portal — **guarded by authentication** (unlike the
open `/admin` EMR). A patient logs in with the email + password set in the EMR and sees
only their own data.

### Routes

| Route                      | What it is                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `/`                        | **Login** (email + password). If already signed in, redirects to `/portal`.                |
| `/portal`                  | **Dashboard** — greeting, basic info, appointments in the next 7 days, refills in the next 7 days, and links into the drill-downs. |
| `/portal/appointments`     | **Full appointment schedule** — every expanded occurrence over the next 3 months.          |
| `/portal/prescriptions`    | **All prescriptions** — every upcoming refill over the next 3 months.                       |

### Auth architecture

Auth.js v5 is wired with the canonical **split-config** pattern so session *verification*
never drags the database import into the edge/proxy bundle:

| File                     | Role                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| `auth.config.ts`         | **Edge-safe** base: JWT session strategy, `pages.signIn`, and the `jwt` / `session` / `authorized` callbacks. No DB, no providers. |
| `auth.ts`                | Extends it with the **Credentials** provider (looks up `Patient` by email, compares the plaintext password) and exports `handlers`, `auth`, `signIn`, `signOut`. Node runtime. |
| `proxy.ts`               | Next 16's renamed **middleware**. Guards `/portal/*` using the edge-safe config only; unauthenticated hits redirect to `/`. |
| `lib/auth-helpers.ts`    | `requirePatient()` — the authoritative server-side check every portal page runs before its data fetch. |
| `app/api/auth/[...nextauth]/route.ts` | The Auth.js GET/POST endpoints.                                                  |

> **`middleware.ts` is `proxy.ts` here.** Next.js 16 renamed Middleware to **Proxy**
> (`node_modules/next/dist/docs/.../16-proxy.md`: *"Starting with Next.js 16, Middleware
> is now called Proxy."*). The guard lives in `proxy.ts` accordingly.

**Defense in depth.** Per the Next.js auth guidance, the proxy is an *optimistic* redirect
and the authoritative check lives next to the data: every `/portal/*` page also calls
`requirePatient()`, and every read (`getPatientSummary` / `getPatientSchedule`) is keyed by
`session.patientId`, so a patient can only ever see their own appointments and refills.
Failed logins return a single generic "Invalid email or password" — the portal never
reveals whether the email or the password was wrong.

### Try it

```bash
npm run dev            # → http://localhost:3000/
```

Sign in with a seeded credential (below) or a patient you created in `/admin`, review the
7-day dashboard, open the two drill-downs, then sign out.

---

## Getting started (local)

**Prerequisites:** Node.js 20+ (Node 22+/24 LTS recommended) and a Postgres database
(a local instance or a free [Neon](https://neon.tech) project).

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env:
#     DATABASE_URL  → your Postgres/Neon connection string
#     AUTH_SECRET   → generate one:  npx auth secret

# 3. Create the schema and seed sample data
npm run db:migrate      # applies migrations (prisma migrate dev)
npm run db:seed         # loads sample patients + reference lists

# 4. Run the dev server
npm run dev
#   → http://localhost:3000

# (optional) browse the data
npm run db:studio       # Prisma Studio
```

A successful seed prints:
`Seed complete: 2 patients, 4 appointments, 4 prescriptions, 7 medications, 11 dosages.`

### Seeded test credentials

Both sample patients share the same password — use either to log in at `/`:

| Name         | Email                          | Password       |
| ------------ | ------------------------------ | -------------- |
| Mark Johnson | `mark@some-email-provider.net` | `Password123!` |
| Lisa Smith   | `lisa@some-email-provider.net` | `Password123!` |

The mini-EMR is open at `/admin` (no login); the portal at `/` requires one of the above
(or any patient you create in the EMR).

### Useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server                        |
| `npm run build`     | Production build                                    |
| `npm run start`     | Serve the production build                          |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | TypeScript type-check (no emit)                     |
| `npm test`          | Run the Vitest unit suite (recurrence, mappers, helpers) |
| `npm run test:int`  | Run the live integration suite (needs a running Postgres) |
| `npm run test:watch`| Vitest in watch mode                                |
| `npm run db:migrate`| Create/apply migrations (`prisma migrate dev`)      |
| `npm run db:seed`   | Seed sample + reference data (idempotent)           |
| `npm run db:reset`  | Drop, re-migrate, and re-seed the database          |
| `npm run db:studio` | Open Prisma Studio                                  |

---

## Deployment (planned — Phase 7)

- Provision **Neon Postgres** and set `DATABASE_URL` + `AUTH_SECRET` in Vercel env.
- Build runs `prisma generate`; `prisma migrate deploy` + seed run against the
  hosted database (one-time).
- Deploy to **Vercel**; verify `/admin` and `/` on the live URL.

---

## ⚠️ Security disclaimer — plaintext passwords

Patient passwords are stored and compared **in plaintext, by deliberate design.**
The exercise brief explicitly requires the EMR to set patient passwords in order to
ease testing of the portal login. This is **not a production-safe practice** — a
real system would hash passwords (e.g. bcrypt/argon2) and never store them
recoverably. The choice is isolated to the Credentials `authorize` compare in
`auth.ts` (`patient.password !== password`) and the EMR create/update actions; hashing
on write plus a `bcrypt.compare` in that one spot is the single change that would
productionise it. It is called out here intentionally.

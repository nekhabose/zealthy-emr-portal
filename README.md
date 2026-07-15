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
| Auth               | **Auth.js / NextAuth v5** (Credentials provider) — *Phase 5*  |
| Validation         | **Zod v4** — shared client/server schemas *(Phase 2)*         |
| Date / recurrence  | **UTC-native** helpers (`lib/datetime.ts`) *(Phase 2)*        |
| Tests              | **Vitest** — recurrence unit tests *(Phase 2)*                |
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
| 3     | Services & Server Actions (CRUD)           | ⬜ Not started  |
| 4     | Mini-EMR (`/admin`)                        | ⬜ Not started  |
| 5     | Auth + Patient Portal (`/`)                | ⬜ Not started  |
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

Both sample patients share the same password (portal login lands in **Phase 5**):

| Name         | Email                          | Password       |
| ------------ | ------------------------------ | -------------- |
| Mark Johnson | `mark@some-email-provider.net` | `Password123!` |
| Lisa Smith   | `lisa@some-email-provider.net` | `Password123!` |

### Useful scripts

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the Next.js dev server                        |
| `npm run build`     | Production build                                    |
| `npm run start`     | Serve the production build                          |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | TypeScript type-check (no emit)                     |
| `npm test`          | Run the Vitest unit suite (recurrence math)         |
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
recoverably. The choice is isolated to the Credentials compare and is called out
here intentionally.

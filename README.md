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
| Validation         | **Zod** — *Phase 2*                                            |
| Date / recurrence  | **date-fns** — *Phase 2*                                       |
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
| 1     | Data layer (schema, migration, seed)       | ⬜ Not started  |
| 2     | Shared domain logic (recurrence, windows)  | ⬜ Not started  |
| 3     | Services & Server Actions (CRUD)           | ⬜ Not started  |
| 4     | Mini-EMR (`/admin`)                        | ⬜ Not started  |
| 5     | Auth + Patient Portal (`/`)                | ⬜ Not started  |
| 6     | Design system & motion polish              | ⬜ Not started  |
| 7     | Deploy, docs, ship                         | ⬜ Not started  |

**Phase 0 delivered:** a running Next.js + TypeScript + Tailwind skeleton, the
Phase-1+ dependencies installed (Prisma, Zod, NextAuth v5, date-fns), a Postgres
Prisma datasource, environment templates, and this README.

---

## Getting started (local)

**Prerequisites:** Node.js 20+ and a Postgres database (a local instance or a free
[Neon](https://neon.tech) project).

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env
#   then edit .env:
#     DATABASE_URL  → your Postgres/Neon connection string
#     AUTH_SECRET   → generate one:  npx auth secret

# 3. Run the dev server
npm run dev
#   → http://localhost:3000
```

> Database migrations and the seed script arrive in **Phase 1**. Until then the app
> boots against the placeholder `DATABASE_URL` without touching the database.

### Useful scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Next.js dev server          |
| `npm run build`     | Production build                      |
| `npm run start`     | Serve the production build            |
| `npm run lint`      | ESLint                                |
| `npm run typecheck` | TypeScript type-check (no emit)       |

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

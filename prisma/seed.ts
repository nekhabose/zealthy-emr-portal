// Zealthy — database seed.
//
// Seeds the reference tables (Medication, Dosage) and the sample patients (with their
// nested appointments + prescriptions) from prisma/seed-data.json — a local, verbatim
// copy of the exercise gist so seeding is offline-deterministic and reproducible in
// CI / on Vercel.
//
// Idempotent: patients are upserted by their natural key (email); each patient's
// appointments/prescriptions are fully replaced on every run. Re-seeding therefore
// converges to the same state instead of accumulating duplicates.
//
// Run with `npm run db:seed` (wired via package.json `prisma.seed`, so
// `npx prisma migrate reset` / `prisma db seed` also invoke it). Executed with Node's
// native TypeScript type-stripping — no ts-node/tsx required.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ---- Seed-data shape (mirrors the gist) --------------------------------------

type SeedAppointment = {
  provider: string;
  datetime: string; // ISO 8601 with offset, e.g. "2026-04-16T16:30:00.000-07:00"
  repeat: string; // "weekly" | "monthly" | (one-off omit)
};

type SeedPrescription = {
  medication: string;
  dosage: string;
  quantity: number;
  refill_on: string; // "YYYY-MM-DD"
  refill_schedule: string; // "weekly" | "monthly" | ...
};

type SeedUser = {
  name: string;
  email: string;
  password: string;
  appointments: SeedAppointment[];
  prescriptions: SeedPrescription[];
};

type SeedData = {
  users: SeedUser[];
  medications: string[];
  dosages: string[];
};

// ---- Enum mapping (with coverage enforcement) --------------------------------

const REPEAT: Record<string, "NONE" | "WEEKLY" | "MONTHLY"> = {
  none: "NONE",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
};

const REFILL: Record<string, "NONE" | "WEEKLY" | "MONTHLY"> = {
  none: "NONE",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
};

function mapRepeat(raw: string | undefined): "NONE" | "WEEKLY" | "MONTHLY" {
  const key = (raw ?? "none").toLowerCase();
  const val = REPEAT[key];
  if (!val) {
    throw new Error(
      `Unknown appointment repeat value "${raw}" in seed data — extend the RepeatSchedule enum + REPEAT map.`,
    );
  }
  return val;
}

function mapRefill(raw: string | undefined): "NONE" | "WEEKLY" | "MONTHLY" {
  const key = (raw ?? "none").toLowerCase();
  const val = REFILL[key];
  if (!val) {
    throw new Error(
      `Unknown prescription refill_schedule value "${raw}" in seed data — extend the RefillSchedule enum + REFILL map.`,
    );
  }
  return val;
}

// "5mg" -> 5, "1000mg" -> 1000. Used to derive a numeric sort order so dosage
// dropdowns render in ascending strength rather than lexical string order.
function dosageStrength(value: string): number {
  const n = parseFloat(value);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

function loadSeedData(): SeedData {
  const here = dirname(fileURLToPath(import.meta.url));
  const raw = readFileSync(join(here, "seed-data.json"), "utf8");
  return JSON.parse(raw) as SeedData;
}

async function main() {
  const data = loadSeedData();

  // Reference tables — upsert by unique natural key so re-seeding is a no-op.
  for (const name of data.medications) {
    await prisma.medication.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  for (const value of data.dosages) {
    const sortOrder = dosageStrength(value);
    await prisma.dosage.upsert({
      where: { value },
      update: { sortOrder },
      create: { value, sortOrder },
    });
  }

  // Patients + their nested clinical data. Upsert the patient by email, then fully
  // replace children inside one transaction so a re-run converges (no duplicates).
  for (const user of data.users) {
    const patient = await prisma.patient.upsert({
      where: { email: user.email },
      update: { name: user.name, password: user.password },
      create: { name: user.name, email: user.email, password: user.password },
    });

    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { patientId: patient.id } }),
      prisma.prescription.deleteMany({ where: { patientId: patient.id } }),
      prisma.appointment.createMany({
        data: user.appointments.map((a) => ({
          patientId: patient.id,
          provider: a.provider,
          datetime: new Date(a.datetime),
          repeat: mapRepeat(a.repeat),
        })),
      }),
      prisma.prescription.createMany({
        data: user.prescriptions.map((p) => ({
          patientId: patient.id,
          medication: p.medication,
          dosage: p.dosage,
          quantity: p.quantity,
          refillOn: new Date(p.refill_on),
          refillSchedule: mapRefill(p.refill_schedule),
        })),
      }),
    ]);
  }

  const [patients, appointments, prescriptions, medications, dosages] =
    await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count(),
      prisma.prescription.count(),
      prisma.medication.count(),
      prisma.dosage.count(),
    ]);

  console.log(
    `Seed complete: ${patients} patients, ${appointments} appointments, ` +
      `${prescriptions} prescriptions, ${medications} medications, ${dosages} dosages.`,
  );
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

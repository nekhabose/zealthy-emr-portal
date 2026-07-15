// Zealthy — pure row → DTO assembly.
//
// This is the deliberately PURE half of the Phase-3 service layer: it turns raw
// Prisma rows plus a `now`/window into the serialisable view-models both surfaces
// render (lib/types). It performs NO database access and reads NO wall-clock — the
// owning patient's rows and an explicit `now` are always passed in. That keeps this
// module unit-testable with fabricated rows (see tests/services-mappers.test.ts),
// exactly like the Phase-2 recurrence layer it builds on.
//
// The stored anchor → concrete occurrence expansion is delegated wholesale to
// lib/recurrence, so all recurrence rules stay in the one tested place.

import { expandOccurrences, nextOccurrence, type Cadence } from "../recurrence";
import { next3Months, next7Days, type TimeWindow } from "../windows";
import type {
  AppointmentOccurrence,
  AppointmentRecord,
  PatientBasics,
  PatientListItem,
  PatientSchedule,
  PatientSummary,
  PrescriptionRecord,
  RefillOccurrence,
} from "../types";

// Minimal structural shapes the mappers consume. Prisma's `Appointment` /
// `Prescription` rows are assignable to these (their enum columns are the same
// string unions as `Cadence`), so services pass Prisma rows straight through — but
// tests can build plain objects without importing the generated client.
export interface AppointmentRowLike {
  id: string;
  provider: string;
  datetime: Date;
  repeat: Cadence;
  endsAt: Date | null;
}

export interface PrescriptionRowLike {
  id: string;
  medication: string;
  dosage: string;
  quantity: number;
  refillOn: Date;
  refillSchedule: Cadence;
  endsAt: Date | null;
}

export interface PatientRowLike {
  id: string;
  name: string;
  email: string;
  appointments: AppointmentRowLike[];
  prescriptions: PrescriptionRowLike[];
}

/** Ascending chronological compare on the occurrence `date`. */
function byDate(a: { date: Date }, b: { date: Date }): number {
  return a.date.getTime() - b.date.getTime();
}

/** Strip a patient row down to the identity fields (never the password). */
export function toPatientBasics(patient: PatientRowLike): PatientBasics {
  return { id: patient.id, name: patient.name, email: patient.email };
}

// ---- Raw record mappers (for the admin edit forms) ---------------------------

/** Project a stored appointment row to the editable {@link AppointmentRecord}. */
export function toAppointmentRecord(a: AppointmentRowLike): AppointmentRecord {
  return {
    id: a.id,
    provider: a.provider,
    datetime: a.datetime,
    repeat: a.repeat,
    endsAt: a.endsAt,
  };
}

/** Project a stored prescription row to the editable {@link PrescriptionRecord}. */
export function toPrescriptionRecord(p: PrescriptionRowLike): PrescriptionRecord {
  return {
    id: p.id,
    medication: p.medication,
    dosage: p.dosage,
    quantity: p.quantity,
    refillOn: p.refillOn,
    refillSchedule: p.refillSchedule,
    endsAt: p.endsAt,
  };
}

// ---- Occurrence expansion (for schedule / refill views) ----------------------

/**
 * Expand every appointment row into its concrete occurrences within `window`,
 * flattened across all rows and sorted ascending. `sourceId` on each occurrence
 * points back at the owning row so "edit / delete / end recurring" can target it.
 */
export function expandAppointments(
  appointments: AppointmentRowLike[],
  window: TimeWindow,
): AppointmentOccurrence[] {
  const out: AppointmentOccurrence[] = [];
  for (const a of appointments) {
    const dates = expandOccurrences(
      a.datetime,
      a.repeat,
      window.start,
      window.end,
      a.endsAt,
    );
    for (const date of dates) {
      out.push({
        sourceId: a.id,
        date,
        isRecurring: a.repeat !== "NONE",
        cadence: a.repeat,
        provider: a.provider,
      });
    }
  }
  return out.sort(byDate);
}

/**
 * Expand every prescription row into its concrete refill occurrences within
 * `window`, flattened across all rows and sorted ascending.
 */
export function expandRefills(
  prescriptions: PrescriptionRowLike[],
  window: TimeWindow,
): RefillOccurrence[] {
  const out: RefillOccurrence[] = [];
  for (const p of prescriptions) {
    const dates = expandOccurrences(
      p.refillOn,
      p.refillSchedule,
      window.start,
      window.end,
      p.endsAt,
    );
    for (const date of dates) {
      out.push({
        sourceId: p.id,
        date,
        isRecurring: p.refillSchedule !== "NONE",
        cadence: p.refillSchedule,
        medication: p.medication,
        dosage: p.dosage,
        quantity: p.quantity,
      });
    }
  }
  return out.sort(byDate);
}

// ---- At-a-glance predicates & rollups ----------------------------------------

/**
 * A prescription is "active" if it has NOT been discontinued as of `now` — i.e. it
 * has no `endsAt`, or its `endsAt` is still in the future. This is the EMR "currently
 * prescribed" meaning and is deliberately independent of refill timing (a monthly Rx
 * whose next refill is weeks away is still active). Used for the admin table's
 * "# active Rx" column.
 */
export function isActivePrescription(
  p: Pick<PrescriptionRowLike, "endsAt">,
  now: Date,
): boolean {
  return p.endsAt === null || p.endsAt.getTime() >= now.getTime();
}

/**
 * Build one admin patients-table row: at-a-glance counts plus the soonest upcoming
 * appointment across all of the patient's appointments.
 *
 * - `upcomingAppointmentCount` counts appointment RECORDS that still have at least
 *   one occurrence on/after `now` (recurring rows count once, not per-occurrence, so
 *   the number stays bounded and intuitive).
 * - `nextAppointment` is the earliest such occurrence over every appointment.
 * - `activePrescriptionCount` counts non-discontinued prescriptions (see
 *   {@link isActivePrescription}).
 */
export function toPatientListItem(
  patient: PatientRowLike,
  now: Date,
): PatientListItem {
  let upcomingAppointmentCount = 0;
  let nextAppointment: AppointmentOccurrence | null = null;

  for (const a of patient.appointments) {
    const next = nextOccurrence(a.datetime, a.repeat, now, a.endsAt);
    if (!next) continue;
    upcomingAppointmentCount++;
    if (!nextAppointment || next.getTime() < nextAppointment.date.getTime()) {
      nextAppointment = {
        sourceId: a.id,
        date: next,
        isRecurring: a.repeat !== "NONE",
        cadence: a.repeat,
        provider: a.provider,
      };
    }
  }

  const activePrescriptionCount = patient.prescriptions.filter((p) =>
    isActivePrescription(p, now),
  ).length;

  return {
    id: patient.id,
    name: patient.name,
    email: patient.email,
    upcomingAppointmentCount,
    nextAppointment,
    activePrescriptionCount,
  };
}

// ---- Portal payloads ---------------------------------------------------------

/**
 * Patient portal dashboard payload: identity + the next-7-day appointment and refill
 * occurrences (the "summary" the brief asks for on the portal main page).
 */
export function toPatientSummary(
  patient: PatientRowLike,
  now: Date,
): PatientSummary {
  const window = next7Days(now);
  return {
    patient: toPatientBasics(patient),
    upcomingAppointments: expandAppointments(patient.appointments, window),
    upcomingRefills: expandRefills(patient.prescriptions, window),
  };
}

/**
 * Full 3-month drill-down payload: identity + every appointment and refill occurrence
 * across the next 3 months (the portal's "full upcoming schedule").
 */
export function toPatientSchedule(
  patient: PatientRowLike,
  now: Date,
): PatientSchedule {
  const window = next3Months(now);
  return {
    patient: toPatientBasics(patient),
    appointments: expandAppointments(patient.appointments, window),
    refills: expandRefills(patient.prescriptions, window),
  };
}

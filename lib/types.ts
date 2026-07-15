// Zealthy — shared domain DTOs.
//
// The view-model shapes both surfaces (mini-EMR + patient portal) speak in. The
// Phase-3 service layer maps raw Prisma rows + Phase-2 recurrence output into these,
// so React components never touch Prisma types directly. Kept intentionally small and
// serialisable (plain data) so they cross the Server Component boundary cleanly.

import type { Cadence } from "./recurrence";

/**
 * One concrete, expanded occurrence of a recurring (or one-off) item — the atom the
 * schedule/refill lists render. `sourceId` points back at the owning Appointment /
 * Prescription row so actions ("end recurring", edit, delete) can target it.
 */
export interface OccurrenceView {
  sourceId: string;
  /** The concrete date/time this occurrence lands on. */
  date: Date;
  /** Whether the source item recurs (cadence !== NONE) — drives "Recurring" chips. */
  isRecurring: boolean;
  cadence: Cadence;
}

/** An expanded appointment occurrence for schedule views. */
export interface AppointmentOccurrence extends OccurrenceView {
  provider: string;
}

/** An expanded prescription refill occurrence for refill/medication views. */
export interface RefillOccurrence extends OccurrenceView {
  medication: string;
  dosage: string;
  quantity: number;
}

/** Basic patient identity shared across summaries and headers (never the password). */
export interface PatientBasics {
  id: string;
  name: string;
  email: string;
}

/**
 * Patient portal dashboard payload: identity + the next-7-day appointment and refill
 * occurrences. Built by `getPatientSummary(patientId, now)` in Phase 3.
 */
export interface PatientSummary {
  patient: PatientBasics;
  upcomingAppointments: AppointmentOccurrence[];
  upcomingRefills: RefillOccurrence[];
}

/**
 * Full 3-month drill-down payload for a patient. Built by
 * `getPatientSchedule(patientId, now)` in Phase 3.
 */
export interface PatientSchedule {
  patient: PatientBasics;
  appointments: AppointmentOccurrence[];
  refills: RefillOccurrence[];
}

/**
 * A row in the admin patients table — at-a-glance counts + the next appointment,
 * as required by the mini-EMR brief. Built by `listPatientsWithCounts(now)`.
 */
export interface PatientListItem {
  id: string;
  name: string;
  email: string;
  upcomingAppointmentCount: number;
  nextAppointment: AppointmentOccurrence | null;
  activePrescriptionCount: number;
}

// Zealthy — patient portal read service.
//
// The two patient-facing reads the brief calls for, both keyed by `patientId` so a
// patient only ever sees their own data (Phase 5 passes `session.patientId`). Each
// takes an explicit `now`; the pure mappers (./mappers) do the window + expansion.

import { prisma } from "../prisma";
import type { PatientSchedule, PatientSummary } from "../types";
import { toPatientSchedule, toPatientSummary } from "./mappers";

/**
 * Portal dashboard payload for one patient: basic info + the next-7-day appointment
 * and refill occurrences. `null` if the patient id doesn't resolve.
 */
export async function getPatientSummary(
  patientId: string,
  now: Date,
): Promise<PatientSummary | null> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { appointments: true, prescriptions: true },
  });
  if (!patient) return null;
  return toPatientSummary(patient, now);
}

/**
 * Full 3-month drill-down for one patient: every appointment and refill occurrence
 * across the next 3 months. `null` if the patient id doesn't resolve.
 */
export async function getPatientSchedule(
  patientId: string,
  now: Date,
): Promise<PatientSchedule | null> {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { appointments: true, prescriptions: true },
  });
  if (!patient) return null;
  return toPatientSchedule(patient, now);
}

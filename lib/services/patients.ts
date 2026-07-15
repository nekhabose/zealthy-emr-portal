// Zealthy — patient service.
//
// The DB half of the patient slice: framework-thin functions that query Prisma and
// hand the rows to the pure mappers (./mappers). Server Actions (app/admin/actions)
// call these AFTER validating input; the read helpers take an explicit `now` so the
// domain stays deterministic (the Server Component passes `new Date()` at the edge).

import { prisma } from "../prisma";
import type { PatientDetail, PatientListItem } from "../types";
import type { PatientInput, PatientUpdateInput } from "../validation";
import {
  toAppointmentRecord,
  toPatientBasics,
  toPatientListItem,
  toPrescriptionRecord,
} from "./mappers";

/**
 * Every patient with the at-a-glance rollups the admin table needs (upcoming-appt
 * count, next appointment, active-Rx count). Ordered by name for a stable table.
 */
export async function listPatientsWithCounts(
  now: Date,
): Promise<PatientListItem[]> {
  const patients = await prisma.patient.findMany({
    orderBy: { name: "asc" },
    include: { appointments: true, prescriptions: true },
  });
  return patients.map((p) => toPatientListItem(p, now));
}

/**
 * One patient's full admin record: identity plus the raw (unexpanded) appointment and
 * prescription anchors the edit forms bind to. `null` when no such patient exists.
 * Children are ordered by their anchor date for a stable list.
 */
export async function getPatientDetail(
  id: string,
): Promise<PatientDetail | null> {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { datetime: "asc" } },
      prescriptions: { orderBy: { refillOn: "asc" } },
    },
  });
  if (!patient) return null;
  return {
    patient: toPatientBasics(patient),
    appointments: patient.appointments.map(toAppointmentRecord),
    prescriptions: patient.prescriptions.map(toPrescriptionRecord),
  };
}

/**
 * Create a patient. Input is assumed already Zod-validated by the caller. May throw
 * Prisma's P2002 on a duplicate email — the Server Action translates that into a
 * field error rather than a 500.
 */
export async function createPatient(input: PatientInput) {
  return prisma.patient.create({
    data: {
      name: input.name,
      email: input.email,
      password: input.password,
    },
  });
}

/**
 * Update a patient's basic info. Password is only written when a non-empty value is
 * supplied (the edit form leaves it blank to keep the current password) — see
 * `patientUpdateSchema`.
 */
export async function updatePatient(id: string, input: PatientUpdateInput) {
  return prisma.patient.update({
    where: { id },
    data: {
      name: input.name,
      email: input.email,
      ...(input.password ? { password: input.password } : {}),
    },
  });
}

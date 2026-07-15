"use server";

// Zealthy — admin (mini-EMR) Server Actions.
//
// The mutation edge for the `/admin` surface. Each action is intentionally thin:
//   1. re-parse the FormData with the shared Zod schema (never trust the client),
//   2. delegate the write to the pure-ish service layer (lib/services/*),
//   3. revalidate the `/admin` route tree so the table + detail pages refetch,
//   4. return a typed `FormState` for `useActionState` inline error rendering.
//
// The `/admin` surface is open by design (the brief: the mini-EMR has no auth), so
// these actions carry no session check — unlike the Phase-5 portal, which is guarded.
// Signatures lead with any bound id (`.bind(null, id)` in the Phase-4 forms) followed
// by the `(prevState, formData)` pair `useActionState` supplies.

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  fieldErrors,
  invalid,
  isUniqueConstraintError,
  ok,
} from "@/lib/action-helpers";
import {
  appointmentSchema,
  makePrescriptionSchema,
  patientSchema,
  patientUpdateSchema,
} from "@/lib/validation";
import type { FormState } from "@/lib/types";
import {
  createAppointment,
  deleteAppointment,
  endAppointmentRecurrence,
  updateAppointment,
} from "@/lib/services/appointments";
import { createPatient, updatePatient } from "@/lib/services/patients";
import {
  createPrescription,
  deletePrescription,
  endPrescriptionRecurrence,
  updatePrescription,
} from "@/lib/services/prescriptions";
import { listDosages, listMedications } from "@/lib/services/reference";

const ADMIN_EMAIL_TAKEN = { email: ["A patient with this email already exists"] };

/** Revalidate the whole `/admin` tree (table + every patient detail page). */
function revalidateAdmin() {
  revalidatePath("/admin", "layout");
}

/** Parse an optional "end on" date from a form field; `""`/absent → `now`. */
function parseEndsAt(raw: FormDataEntryValue | null): Date | null {
  if (typeof raw !== "string" || raw.trim() === "") return new Date();
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ---- Patients ----------------------------------------------------------------

/** Create a patient, then redirect to their new record. */
export async function createPatientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = patientSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  let patient;
  try {
    patient = await createPatient(parsed.data);
  } catch (e) {
    if (isUniqueConstraintError(e)) return invalid(ADMIN_EMAIL_TAKEN);
    throw e;
  }

  revalidateAdmin();
  // redirect() throws a control-flow signal, so nothing after it runs.
  redirect(`/admin/patients/${patient.id}`);
}

/** Update a patient's basic info (password left blank ⇒ unchanged). */
export async function updatePatientAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = patientUpdateSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  try {
    await updatePatient(id, parsed.data);
  } catch (e) {
    if (isUniqueConstraintError(e)) return invalid(ADMIN_EMAIL_TAKEN);
    throw e;
  }

  revalidateAdmin();
  return ok("Patient updated");
}

// ---- Appointments ------------------------------------------------------------

/** Add an appointment to a patient. */
export async function createAppointmentAction(
  patientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = appointmentSchema.safeParse({
    provider: formData.get("provider"),
    datetime: formData.get("datetime"),
    repeat: formData.get("repeat"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  await createAppointment(patientId, parsed.data);
  revalidateAdmin();
  return ok("Appointment added");
}

/** Edit an existing appointment. */
export async function updateAppointmentAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = appointmentSchema.safeParse({
    provider: formData.get("provider"),
    datetime: formData.get("datetime"),
    repeat: formData.get("repeat"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  await updateAppointment(id, parsed.data);
  revalidateAdmin();
  return ok("Appointment updated");
}

/** Delete an appointment. */
export async function deleteAppointmentAction(
  id: string,
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  await deleteAppointment(id);
  revalidateAdmin();
  return ok("Appointment deleted");
}

/** End a recurring appointment (defaults to ending now; optional `endsAt` field). */
export async function endAppointmentRecurrenceAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const endsAt = parseEndsAt(formData.get("endsAt"));
  if (!endsAt) return invalid({ endsAt: ["Enter a valid end date"] });

  await endAppointmentRecurrence(id, endsAt);
  revalidateAdmin();
  return ok("Recurrence ended");
}

// ---- Prescriptions -----------------------------------------------------------

/** Read the seeded reference lists that bound the prescription schema. */
async function prescriptionSchemaWithReference() {
  const [medications, dosages] = await Promise.all([
    listMedications(),
    listDosages(),
  ]);
  return makePrescriptionSchema(medications, dosages);
}

/** Add a prescription to a patient (medication/dosage validated ∈ reference lists). */
export async function createPrescriptionAction(
  patientId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const schema = await prescriptionSchemaWithReference();
  const parsed = schema.safeParse({
    medication: formData.get("medication"),
    dosage: formData.get("dosage"),
    quantity: formData.get("quantity"),
    refillOn: formData.get("refillOn"),
    refillSchedule: formData.get("refillSchedule"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  await createPrescription(patientId, parsed.data);
  revalidateAdmin();
  return ok("Prescription added");
}

/** Edit an existing prescription. */
export async function updatePrescriptionAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const schema = await prescriptionSchemaWithReference();
  const parsed = schema.safeParse({
    medication: formData.get("medication"),
    dosage: formData.get("dosage"),
    quantity: formData.get("quantity"),
    refillOn: formData.get("refillOn"),
    refillSchedule: formData.get("refillSchedule"),
    endsAt: formData.get("endsAt"),
  });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  await updatePrescription(id, parsed.data);
  revalidateAdmin();
  return ok("Prescription updated");
}

/** Delete a prescription. */
export async function deletePrescriptionAction(
  id: string,
  _prev: FormState,
  _formData: FormData,
): Promise<FormState> {
  await deletePrescription(id);
  revalidateAdmin();
  return ok("Prescription deleted");
}

/** End a recurring prescription (defaults to ending now; optional `endsAt` field). */
export async function endPrescriptionRecurrenceAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const endsAt = parseEndsAt(formData.get("endsAt"));
  if (!endsAt) return invalid({ endsAt: ["Enter a valid end date"] });

  await endPrescriptionRecurrence(id, endsAt);
  revalidateAdmin();
  return ok("Recurrence ended");
}

// Zealthy — Zod validation schemas.
//
// One source of truth for input shapes, shared by client forms (Phase 4/5) and the
// Server Actions that back them (Phase 3). Server Actions re-parse on the server so
// validation is never trust-the-client; forms reuse the same schemas for inline field
// errors.
//
// Inputs arrive as FORM STRINGS (`FormData`), so numbers/dates are coerced. Optional
// dates treat "" (an untouched date input) as "absent" rather than an invalid date.

import { z } from "zod";
import type { Cadence } from "./recurrence";

/** Cadence values, kept in lockstep with the Prisma `RepeatSchedule`/`RefillSchedule` enums. */
export const CADENCE_VALUES = ["NONE", "WEEKLY", "MONTHLY"] as const satisfies readonly Cadence[];

/** Enum schema for a recurrence cadence. */
export const cadenceSchema = z.enum(CADENCE_VALUES);

/**
 * An optional date coming from a form field: an empty/whitespace string means "not
 * set" (→ undefined); anything else must coerce to a valid Date. Used for `endsAt`.
 */
const optionalFormDate = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce.date().optional(),
);

// ---- Patient -----------------------------------------------------------------

/**
 * New/edit patient. Password is required and stored in plaintext BY DESIGN (the brief
 * requires settable patient passwords to ease portal testing) — see README. We only
 * enforce non-empty here; no strength policy, deliberately.
 */
export const patientSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
export type PatientInput = z.infer<typeof patientSchema>;

/** Edit-patient variant: password optional so an update can leave it unchanged. */
export const patientUpdateSchema = patientSchema.extend({
  password: z
    .string()
    .min(1, "Password is required")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

// ---- Appointment -------------------------------------------------------------

/**
 * Create/edit appointment. `datetime` is the anchor; `repeat` the cadence; `endsAt`
 * the optional "end recurring" terminator. `endsAt` must not precede the anchor.
 */
export const appointmentSchema = z
  .object({
    provider: z.string().trim().min(1, "Provider is required"),
    datetime: z.coerce.date({ error: "Enter a valid date and time" }),
    repeat: cadenceSchema,
    endsAt: optionalFormDate,
  })
  .refine((v) => !v.endsAt || v.endsAt.getTime() >= v.datetime.getTime(), {
    message: "End date must be on or after the appointment date",
    path: ["endsAt"],
  });
export type AppointmentInput = z.infer<typeof appointmentSchema>;

// ---- Prescription ------------------------------------------------------------

/**
 * Base prescription shape WITHOUT reference-list membership checks. `medication` and
 * `dosage` are validated as non-empty here; use {@link makePrescriptionSchema} when
 * the seeded reference lists are available (forms/actions) to also enforce that the
 * chosen values come from the `Medication`/`Dosage` tables, as the brief requires.
 */
export const prescriptionSchema = z
  .object({
    medication: z.string().trim().min(1, "Medication is required"),
    dosage: z.string().trim().min(1, "Dosage is required"),
    quantity: z.coerce
      .number({ error: "Quantity must be a number" })
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1"),
    refillOn: z.coerce.date({ error: "Enter a valid refill date" }),
    refillSchedule: cadenceSchema,
    endsAt: optionalFormDate,
  })
  .refine((v) => !v.endsAt || v.endsAt.getTime() >= v.refillOn.getTime(), {
    message: "End date must be on or after the refill date",
    path: ["endsAt"],
  });
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;

/**
 * Prescription schema bound to the seeded reference lists: `medication` must be one of
 * `medications`, `dosage` one of `dosages`. This is the schema forms and Server Actions
 * should use, so a prescription can only reference a real medication/dosage option.
 */
export function makePrescriptionSchema(
  medications: readonly string[],
  dosages: readonly string[],
) {
  const meds = new Set(medications);
  const dose = new Set(dosages);
  return prescriptionSchema
    .refine((v) => meds.has(v.medication), {
      message: "Choose a medication from the list",
      path: ["medication"],
    })
    .refine((v) => dose.has(v.dosage), {
      message: "Choose a dosage from the list",
      path: ["dosage"],
    });
}

// ---- Auth --------------------------------------------------------------------

/** Portal login credentials (Phase 5 Auth.js Credentials provider). */
export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});
export type CredentialsInput = z.infer<typeof credentialsSchema>;

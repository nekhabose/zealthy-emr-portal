// Zealthy — prescription service.
//
// Thin CRUD over the Prescription table. Input is assumed already Zod-validated (via
// `makePrescriptionSchema`, which also enforces medication/dosage ∈ the seeded
// reference lists). `medication`/`dosage` are stored as denormalized string snapshots;
// refills recur from `refillOn` + `refillSchedule` with an optional `endsAt`.

import { prisma } from "../prisma";
import type { PrescriptionInput } from "../validation";

/** Create a prescription for a patient. `endsAt` defaults to null (open-ended). */
export async function createPrescription(
  patientId: string,
  input: PrescriptionInput,
) {
  return prisma.prescription.create({
    data: {
      patientId,
      medication: input.medication,
      dosage: input.dosage,
      quantity: input.quantity,
      refillOn: input.refillOn,
      refillSchedule: input.refillSchedule,
      endsAt: input.endsAt ?? null,
    },
  });
}

/** Update a prescription's fields / cadence / terminator in place. */
export async function updatePrescription(
  id: string,
  input: PrescriptionInput,
) {
  return prisma.prescription.update({
    where: { id },
    data: {
      medication: input.medication,
      dosage: input.dosage,
      quantity: input.quantity,
      refillOn: input.refillOn,
      refillSchedule: input.refillSchedule,
      endsAt: input.endsAt ?? null,
    },
  });
}

/** Permanently delete a prescription. */
export async function deletePrescription(id: string) {
  return prisma.prescription.delete({ where: { id } });
}

/**
 * "End recurring prescription" — stops future refills by setting `endsAt`, the refill
 * analogue of {@link endAppointmentRecurrence}.
 */
export async function endPrescriptionRecurrence(id: string, endsAt: Date) {
  return prisma.prescription.update({
    where: { id },
    data: { endsAt },
  });
}

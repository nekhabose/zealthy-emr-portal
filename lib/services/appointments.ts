// Zealthy — appointment service.
//
// Thin CRUD over the Appointment table. Input is assumed already Zod-validated by the
// calling Server Action. Recurrence is stored as an anchor (`datetime`) + `repeat`
// cadence + optional `endsAt`; occurrences are never persisted (see lib/recurrence).

import { prisma } from "../prisma";
import type { AppointmentInput } from "../validation";

/** Create an appointment for a patient. `endsAt` defaults to null (open-ended). */
export async function createAppointment(
  patientId: string,
  input: AppointmentInput,
) {
  return prisma.appointment.create({
    data: {
      patientId,
      provider: input.provider,
      datetime: input.datetime,
      repeat: input.repeat,
      endsAt: input.endsAt ?? null,
    },
  });
}

/** Update an appointment's anchor / cadence / terminator in place. */
export async function updateAppointment(id: string, input: AppointmentInput) {
  return prisma.appointment.update({
    where: { id },
    data: {
      provider: input.provider,
      datetime: input.datetime,
      repeat: input.repeat,
      endsAt: input.endsAt ?? null,
    },
  });
}

/** Permanently delete an appointment. */
export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({ where: { id } });
}

/**
 * "End recurring appointment" — the brief's terminator action. Sets `endsAt` so no
 * occurrence after that instant is expanded. Defaults to ending as of the passed
 * `endsAt` (the Server Action supplies `now` or a chosen date).
 */
export async function endAppointmentRecurrence(id: string, endsAt: Date) {
  return prisma.appointment.update({
    where: { id },
    data: { endsAt },
  });
}

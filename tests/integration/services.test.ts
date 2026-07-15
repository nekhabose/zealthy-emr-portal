// Zealthy — service-layer integration tests (Phase 3, LIVE Postgres).
//
// These drive the real service functions against the real database to prove the
// wiring end-to-end: Prisma writes, the anchor→occurrence expansion at read time, the
// admin at-a-glance rollups, the "end recurring" terminator, and per-patient
// isolation of the portal reads. Run with `npm run test:int` (needs a live
// DATABASE_URL — the local Postgres from Phase 1).
//
// Isolation & safety: every row is created under a unique throwaway email and torn
// down (cascade) in afterAll, so the suite never mutates the seeded sample patients
// and re-runs cleanly. `now` is a fixed instant so expansions are deterministic.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../lib/prisma";
import {
  createPatient,
  getPatientDetail,
  listPatientsWithCounts,
  updatePatient,
} from "../../lib/services/patients";
import {
  createAppointment,
  deleteAppointment,
  endAppointmentRecurrence,
  updateAppointment,
} from "../../lib/services/appointments";
import {
  createPrescription,
  deletePrescription,
} from "../../lib/services/prescriptions";
import {
  getPatientSchedule,
  getPatientSummary,
} from "../../lib/services/portal";
import { listDosages, listMedications } from "../../lib/services/reference";
import { isUniqueConstraintError } from "../../lib/action-helpers";

const TEST_EMAIL = "phase3-int@zealthy.test";
const OTHER_EMAIL = "phase3-int-other@zealthy.test";
const NOW = new Date("2026-07-15T00:00:00.000Z");

let patientId = "";
let otherId = "";
let apptId = "";

async function purge() {
  await prisma.patient.deleteMany({
    where: { email: { in: [TEST_EMAIL, OTHER_EMAIL] } },
  });
}

beforeAll(purge);

afterAll(async () => {
  await purge();
  await prisma.$disconnect();
});

describe("reference lists", () => {
  it("returns seeded medications alphabetically and dosages by strength", async () => {
    const meds = await listMedications();
    const doses = await listDosages();
    expect(meds).toContain("Lexapro");
    expect([...meds]).toEqual([...meds].sort());
    // Ascending strength, NOT lexical ("5mg" before "10mg").
    expect(doses.indexOf("5mg")).toBeLessThan(doses.indexOf("10mg"));
    expect(doses[0]).toBe("1mg");
  });
});

describe("patient + appointment + prescription lifecycle", () => {
  it("creates a patient", async () => {
    const p = await createPatient({
      name: "Ada Test",
      email: TEST_EMAIL,
      password: "pw-123",
    });
    patientId = p.id;
    expect(p.email).toBe(TEST_EMAIL);
  });

  it("rejects a duplicate email with a P2002 the helper recognises", async () => {
    await expect(
      createPatient({ name: "Dup", email: TEST_EMAIL, password: "x" }),
    ).rejects.toSatisfy(isUniqueConstraintError);
  });

  it("adds a weekly appointment and a one-off refill", async () => {
    const a = await createAppointment(patientId, {
      provider: "Dr Integration",
      datetime: new Date("2026-07-20T15:00:00.000Z"),
      repeat: "WEEKLY",
      endsAt: undefined,
    });
    apptId = a.id;
    await createPrescription(patientId, {
      medication: "Lexapro",
      dosage: "5mg",
      quantity: 2,
      refillOn: new Date("2026-07-18T00:00:00.000Z"),
      refillSchedule: "NONE",
      endsAt: undefined,
    });

    const detail = await getPatientDetail(patientId);
    expect(detail).not.toBeNull();
    expect(detail!.appointments).toHaveLength(1);
    expect(detail!.appointments[0].provider).toBe("Dr Integration");
    expect(detail!.appointments[0].repeat).toBe("WEEKLY");
    expect(detail!.prescriptions).toHaveLength(1);
    expect(detail!.prescriptions[0].medication).toBe("Lexapro");
  });

  it("surfaces at-a-glance rollups in the admin list", async () => {
    const rows = await listPatientsWithCounts(NOW);
    const row = rows.find((r) => r.id === patientId);
    expect(row).toBeDefined();
    expect(row!.upcomingAppointmentCount).toBe(1);
    expect(row!.nextAppointment?.date.toISOString()).toBe(
      "2026-07-20T15:00:00.000Z",
    );
    expect(row!.activePrescriptionCount).toBe(1);
  });

  it("builds the 7-day portal summary from expanded occurrences", async () => {
    const summary = await getPatientSummary(patientId, NOW);
    expect(summary).not.toBeNull();
    // Weekly appt: Jul 20 is inside [Jul15, Jul22]; the next (Jul 27) is not.
    expect(summary!.upcomingAppointments).toHaveLength(1);
    // One-off refill Jul 18 is inside the window.
    expect(summary!.upcomingRefills).toHaveLength(1);
    expect(summary!.upcomingRefills[0].medication).toBe("Lexapro");
  });

  it("expands the weekly appt into many occurrences over 3 months", async () => {
    const schedule = await getPatientSchedule(patientId, NOW);
    expect(schedule!.appointments.length).toBeGreaterThan(1);
    // All 7 days apart, ascending.
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    for (let i = 1; i < schedule!.appointments.length; i++) {
      expect(
        schedule!.appointments[i].date.getTime() -
          schedule!.appointments[i - 1].date.getTime(),
      ).toBe(weekMs);
    }
  });

  it("edits an appointment in place", async () => {
    await updateAppointment(apptId, {
      provider: "Dr Renamed",
      datetime: new Date("2026-07-20T15:00:00.000Z"),
      repeat: "WEEKLY",
      endsAt: undefined,
    });
    const detail = await getPatientDetail(patientId);
    expect(detail!.appointments[0].provider).toBe("Dr Renamed");
  });

  it("ends the recurrence and truncates the expansion", async () => {
    // End on Jul 25 → only the Jul 20 occurrence survives (next would be Jul 27).
    await endAppointmentRecurrence(apptId, new Date("2026-07-25T00:00:00.000Z"));
    const schedule = await getPatientSchedule(patientId, NOW);
    expect(schedule!.appointments).toHaveLength(1);
    expect(schedule!.appointments[0].date.toISOString()).toBe(
      "2026-07-20T15:00:00.000Z",
    );
  });

  it("isolates portal reads per patient", async () => {
    const other = await createPatient({
      name: "Bob Other",
      email: OTHER_EMAIL,
      password: "pw",
    });
    otherId = other.id;
    const summary = await getPatientSummary(otherId, NOW);
    // Bob has no data — he never sees Ada's appointments/refills.
    expect(summary!.upcomingAppointments).toHaveLength(0);
    expect(summary!.upcomingRefills).toHaveLength(0);
    expect(summary!.patient.email).toBe(OTHER_EMAIL);
  });

  it("updates patient basic info", async () => {
    await updatePatient(patientId, {
      name: "Ada Renamed",
      email: TEST_EMAIL,
      password: undefined,
    });
    const detail = await getPatientDetail(patientId);
    expect(detail!.patient.name).toBe("Ada Renamed");
  });

  it("deletes children and reflects the empty record", async () => {
    const detail = await getPatientDetail(patientId);
    await deleteAppointment(apptId);
    await deletePrescription(detail!.prescriptions[0].id);
    const after = await getPatientDetail(patientId);
    expect(after!.appointments).toHaveLength(0);
    expect(after!.prescriptions).toHaveLength(0);
  });
});

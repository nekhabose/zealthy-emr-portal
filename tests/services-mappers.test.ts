// Zealthy — service mapper unit tests (Phase 3, DB-free).
//
// The mappers are the pure half of the service layer: raw rows + `now`/window → the
// DTOs both surfaces render. These tests fabricate rows and lock down the assembly
// rules (occurrence expansion, sorting, the at-a-glance rollups, the active-Rx
// predicate, and the 7-day vs 3-month window selection) without touching Postgres.
// All dates are explicit UTC (`Z`) so the suite is timezone-agnostic in CI.

import { describe, expect, it } from "vitest";
import {
  expandAppointments,
  expandRefills,
  isActivePrescription,
  toPatientListItem,
  toPatientSchedule,
  toPatientSummary,
  type AppointmentRowLike,
  type PatientRowLike,
  type PrescriptionRowLike,
} from "../lib/services/mappers";
import { next7Days } from "../lib/windows";

const d = (iso: string) => new Date(iso);
const NOW = d("2026-07-15T00:00:00.000Z");

// A weekly appointment anchored like the seed's Dr Kim West (23:30Z), still upcoming.
const weeklyAppt: AppointmentRowLike = {
  id: "appt-weekly",
  provider: "Dr Kim West",
  datetime: d("2026-04-16T23:30:00.000Z"),
  repeat: "WEEKLY",
  endsAt: null,
};

// A one-off appointment already in the past → no upcoming occurrence.
const pastOneOff: AppointmentRowLike = {
  id: "appt-past",
  provider: "Dr Gone",
  datetime: d("2026-06-01T10:00:00.000Z"),
  repeat: "NONE",
  endsAt: null,
};

// An active monthly refill (no endsAt).
const activeRx: PrescriptionRowLike = {
  id: "rx-active",
  medication: "Lexapro",
  dosage: "5mg",
  quantity: 2,
  refillOn: d("2026-04-05T00:00:00.000Z"),
  refillSchedule: "MONTHLY",
  endsAt: null,
};

// A discontinued monthly refill (endsAt in the past).
const endedRx: PrescriptionRowLike = {
  id: "rx-ended",
  medication: "Ozempic",
  dosage: "1mg",
  quantity: 1,
  refillOn: d("2026-04-10T00:00:00.000Z"),
  refillSchedule: "MONTHLY",
  endsAt: d("2026-05-01T00:00:00.000Z"),
};

const patient: PatientRowLike = {
  id: "pat-1",
  name: "Mark Johnson",
  email: "mark@example.test",
  appointments: [weeklyAppt, pastOneOff],
  prescriptions: [activeRx, endedRx],
};

describe("isActivePrescription", () => {
  it("treats a null endsAt as active", () => {
    expect(isActivePrescription({ endsAt: null }, NOW)).toBe(true);
  });
  it("treats a future endsAt as active (inclusive at now)", () => {
    expect(isActivePrescription({ endsAt: NOW }, NOW)).toBe(true);
    expect(
      isActivePrescription({ endsAt: d("2026-08-01T00:00:00.000Z") }, NOW),
    ).toBe(true);
  });
  it("treats a past endsAt as inactive", () => {
    expect(
      isActivePrescription({ endsAt: d("2026-05-01T00:00:00.000Z") }, NOW),
    ).toBe(false);
  });
});

describe("expandAppointments", () => {
  it("expands only occurrences inside the window and drops past one-offs", () => {
    const occ = expandAppointments([weeklyAppt, pastOneOff], next7Days(NOW));
    // In [Jul15, Jul22] the weekly anchor lands once (Jul 16 23:30Z); the past
    // one-off contributes nothing.
    expect(occ).toHaveLength(1);
    expect(occ[0].sourceId).toBe("appt-weekly");
    expect(occ[0].provider).toBe("Dr Kim West");
    expect(occ[0].isRecurring).toBe(true);
    expect(occ[0].date.toISOString()).toBe("2026-07-16T23:30:00.000Z");
  });

  it("returns occurrences sorted ascending across multiple sources", () => {
    const soon: AppointmentRowLike = {
      id: "appt-soon",
      provider: "Dr Soon",
      datetime: d("2026-07-15T09:00:00.000Z"),
      repeat: "NONE",
      endsAt: null,
    };
    const occ = expandAppointments([weeklyAppt, soon], next7Days(NOW));
    expect(occ.map((o) => o.sourceId)).toEqual(["appt-soon", "appt-weekly"]);
    for (let i = 1; i < occ.length; i++) {
      expect(occ[i].date.getTime()).toBeGreaterThanOrEqual(
        occ[i - 1].date.getTime(),
      );
    }
  });
});

describe("expandRefills", () => {
  it("expands monthly refills and carries medication details; honours endsAt", () => {
    const refills = expandRefills([activeRx, endedRx], next7Days(NOW));
    // The discontinued Rx (endsAt May 1) yields nothing in July. The active monthly
    // anchor (Apr 5) has its July occurrence on Jul 5 — before the window — and the
    // next on Aug 5 — after it — so the 7-day window is empty too.
    expect(refills).toHaveLength(0);
  });

  it("includes a refill that lands inside the window", () => {
    const soonRefill: PrescriptionRowLike = {
      ...activeRx,
      id: "rx-soon",
      refillOn: d("2026-07-18T00:00:00.000Z"),
      refillSchedule: "NONE",
    };
    const refills = expandRefills([soonRefill], next7Days(NOW));
    expect(refills).toHaveLength(1);
    expect(refills[0].medication).toBe("Lexapro");
    expect(refills[0].dosage).toBe("5mg");
    expect(refills[0].quantity).toBe(2);
    expect(refills[0].isRecurring).toBe(false);
  });
});

describe("toPatientListItem", () => {
  it("rolls up upcoming appts, next appt, and active Rx", () => {
    const row = toPatientListItem(patient, NOW);
    expect(row.id).toBe("pat-1");
    // Only the weekly appt still has a future occurrence; the past one-off does not.
    expect(row.upcomingAppointmentCount).toBe(1);
    expect(row.nextAppointment?.sourceId).toBe("appt-weekly");
    expect(row.nextAppointment?.date.toISOString()).toBe(
      "2026-07-16T23:30:00.000Z",
    );
    // activeRx counts, endedRx does not.
    expect(row.activePrescriptionCount).toBe(1);
  });

  it("picks the SOONEST occurrence as nextAppointment across sources", () => {
    const sooner: AppointmentRowLike = {
      id: "appt-sooner",
      provider: "Dr Early",
      datetime: d("2026-07-15T06:00:00.000Z"),
      repeat: "NONE",
      endsAt: null,
    };
    const row = toPatientListItem(
      { ...patient, appointments: [weeklyAppt, sooner] },
      NOW,
    );
    expect(row.upcomingAppointmentCount).toBe(2);
    expect(row.nextAppointment?.sourceId).toBe("appt-sooner");
  });

  it("reports no next appointment when everything is in the past", () => {
    const row = toPatientListItem(
      { ...patient, appointments: [pastOneOff], prescriptions: [] },
      NOW,
    );
    expect(row.upcomingAppointmentCount).toBe(0);
    expect(row.nextAppointment).toBeNull();
    expect(row.activePrescriptionCount).toBe(0);
  });
});

describe("toPatientSummary / toPatientSchedule window selection", () => {
  it("summary uses the 7-day window; schedule uses 3 months (⇒ more occurrences)", () => {
    const summary = toPatientSummary(patient, NOW);
    const schedule = toPatientSchedule(patient, NOW);

    // 7-day: exactly the one weekly occurrence proven above.
    expect(summary.upcomingAppointments).toHaveLength(1);
    expect(summary.patient.email).toBe("mark@example.test");

    // 3-month: the weekly anchor recurs every 7 days across ~3 months → several,
    // strictly more than the 7-day count, all spaced 7 days apart and in order.
    expect(schedule.appointments.length).toBeGreaterThan(
      summary.upcomingAppointments.length,
    );
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    for (let i = 1; i < schedule.appointments.length; i++) {
      expect(
        schedule.appointments[i].date.getTime() -
          schedule.appointments[i - 1].date.getTime(),
      ).toBe(weekMs);
    }
  });
});

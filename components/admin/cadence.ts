// Zealthy — cadence (recurrence) option lists + display labels.
//
// One source of truth for the repeat/refill `<select>` options and the short chip
// label shown in read views. Values match the Prisma `RepeatSchedule` /
// `RefillSchedule` enums (and `Cadence` in lib/recurrence). Plain TS so both the
// client forms and the Server Components can import it.

import type { Cadence } from "@/lib/recurrence";

/** Appointment repeat options for the create/edit form. */
export const REPEAT_OPTIONS: ReadonlyArray<{ value: Cadence; label: string }> = [
  { value: "NONE", label: "Does not repeat" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

/** Prescription refill-schedule options for the create/edit form. */
export const REFILL_OPTIONS: ReadonlyArray<{ value: Cadence; label: string }> = [
  { value: "NONE", label: "One-time (no refills)" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
];

/** Short label for a cadence, for read-view chips. */
export function cadenceLabel(cadence: Cadence): string {
  switch (cadence) {
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    default:
      return "One-time";
  }
}

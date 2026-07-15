// Zealthy — time-window builders.
//
// The brief needs two windows: "next 7 days" (portal + admin summaries) and
// "next 3 months" (portal drill-downs). Centralising them keeps a SINGLE `now` seam:
// callers pass `now` in explicitly, so services stay pure and tests are deterministic
// (no wall-clock reads buried in the domain layer).
//
// Bounds are computed with the UTC-safe helpers (see lib/datetime) so windows line up
// exactly with the recurrence expansion and don't wobble across DST.

import { addUTCDays, addUTCMonths } from "./datetime";

/** A closed time interval `[start, end]`, both bounds inclusive. */
export interface TimeWindow {
  start: Date;
  end: Date;
}

/** The window from `now` through 7 days later — used for dashboard summaries. */
export function next7Days(now: Date): TimeWindow {
  return { start: now, end: addUTCDays(now, 7) };
}

/** The window from `now` through 3 months later — used for full-schedule drill-downs. */
export function next3Months(now: Date): TimeWindow {
  return { start: now, end: addUTCMonths(now, 3) };
}

// Zealthy — recurrence expansion (the core shared domain logic).
//
// Appointments and prescriptions store a single ANCHOR (`datetime` / `refillOn`) plus
// a cadence and an optional `endsAt`; concrete occurrences are never persisted. Both
// surfaces (the mini-EMR and the patient portal) derive occurrences at read time from
// this module, so all recurrence rules live in exactly one, unit-tested place.
//
// Design notes:
//  - Arithmetic is done in UTC via lib/datetime (NOT date-fns local arithmetic), so
//    expansion is deterministic across environments and DST boundaries — a Pacific dev
//    laptop and a UTC Vercel server produce identical occurrences.
//  - Every occurrence is computed as `addUTC{Weeks,Months}(anchor, n)` — always
//    relative to the ORIGINAL anchor, never by stepping the previous occurrence. This
//    keeps month-end semantics stable (Jan 31 → Feb 28 → Mar 31, not the drift you'd
//    get from re-anchoring off the clamped Feb 28).
//  - `now` is never read here; callers pass explicit window bounds (see lib/windows.ts),
//    which is what makes the tests deterministic.

import { addUTCMonths, addUTCWeeks, differenceInUTCMonths } from "./datetime";

/**
 * Recurrence cadence shared by appointments (`RepeatSchedule`) and prescriptions
 * (`RefillSchedule`). Structurally identical to both Prisma enums.
 */
export type Cadence = "NONE" | "WEEKLY" | "MONTHLY";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Defensive upper bound on the expansion loop. Real windows are small (≤ 3 months →
// ≤ ~13 weekly occurrences), and `fastForwardSteps` lands us next to `windowStart`
// before we start collecting, so this cap is never reached in practice — it exists
// purely so a bad anchor/window can never spin forever.
const MAX_ITERATIONS = 1000;

function step(anchor: Date, cadence: "WEEKLY" | "MONTHLY", n: number): Date {
  return cadence === "WEEKLY" ? addUTCWeeks(anchor, n) : addUTCMonths(anchor, n);
}

/**
 * How many whole cadence periods fit between `anchor` and `target`, minus one for
 * safety. Lets a far-past anchor jump to just before the window in O(1) instead of a
 * long linear scan. Returns 0 when the anchor is already at/after the target.
 *
 * We deliberately return an integer STEP COUNT (not a date) so the caller re-derives
 * the actual occurrence via `step(anchor, cadence, n)` — preserving the
 * always-relative-to-anchor invariant above.
 */
function fastForwardSteps(
  anchor: Date,
  cadence: "WEEKLY" | "MONTHLY",
  target: Date,
): number {
  if (anchor.getTime() >= target.getTime()) return 0;
  const raw =
    cadence === "WEEKLY"
      ? Math.floor((target.getTime() - anchor.getTime()) / WEEK_MS)
      : differenceInUTCMonths(target, anchor);
  // Back off one period so we never skip *over* a valid occurrence that sits just
  // inside the window (month-length variation can make the estimate land early).
  return Math.max(0, raw - 1);
}

/**
 * Expand a recurring anchor into the concrete occurrences that fall within
 * `[windowStart, windowEnd]` (both inclusive).
 *
 * @param anchor       the first (or only) occurrence.
 * @param cadence      NONE → single occurrence; WEEKLY/MONTHLY → repeats.
 * @param windowStart  inclusive lower bound of the window of interest.
 * @param windowEnd    inclusive upper bound of the window of interest.
 * @param endsAt       optional recurrence terminator (the "end recurring" action);
 *                     occurrences after it are dropped. Inclusive.
 * @returns occurrences in ascending chronological order (possibly empty).
 */
export function expandOccurrences(
  anchor: Date,
  cadence: Cadence,
  windowStart: Date,
  windowEnd: Date,
  endsAt?: Date | null,
): Date[] {
  // The recurrence can't outlive `endsAt`, so clamp the effective window end.
  const effectiveEnd =
    endsAt && endsAt.getTime() < windowEnd.getTime() ? endsAt : windowEnd;
  if (effectiveEnd.getTime() < windowStart.getTime()) return [];

  if (cadence === "NONE") {
    const t = anchor.getTime();
    return t >= windowStart.getTime() && t <= effectiveEnd.getTime()
      ? [anchor]
      : [];
  }

  const occurrences: Date[] = [];
  let n = fastForwardSteps(anchor, cadence, windowStart);
  for (let i = 0; i < MAX_ITERATIONS; i++, n++) {
    const occ = step(anchor, cadence, n);
    if (occ.getTime() > effectiveEnd.getTime()) break;
    if (occ.getTime() >= windowStart.getTime()) occurrences.push(occ);
  }
  return occurrences;
}

/**
 * The first occurrence at or after `from` (inclusive), or `null` if the recurrence
 * has no such occurrence (e.g. a one-off already in the past, or one truncated away
 * by `endsAt`). Used for the admin table's "next appointment" at-a-glance column.
 */
export function nextOccurrence(
  anchor: Date,
  cadence: Cadence,
  from: Date,
  endsAt?: Date | null,
): Date | null {
  if (endsAt && from.getTime() > endsAt.getTime()) return null;

  if (cadence === "NONE") {
    const t = anchor.getTime();
    if (t < from.getTime()) return null;
    if (endsAt && t > endsAt.getTime()) return null;
    return anchor;
  }

  let n = fastForwardSteps(anchor, cadence, from);
  for (let i = 0; i < MAX_ITERATIONS; i++, n++) {
    const occ = step(anchor, cadence, n);
    if (endsAt && occ.getTime() > endsAt.getTime()) return null;
    if (occ.getTime() >= from.getTime()) return occ;
  }
  return null;
}

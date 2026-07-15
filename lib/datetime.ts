// Zealthy — timezone-safe date arithmetic primitives.
//
// WHY THIS EXISTS (and why not just date-fns `addWeeks`/`addMonths`):
// date-fns arithmetic operates on LOCAL wall-clock time. That makes its output depend
// on the ambient `process.env.TZ` and shift by an hour across a DST boundary — so the
// same recurring appointment would expand to different instants on a Pacific dev
// laptop vs. a UTC Vercel server. For a domain module both surfaces trust, that is a
// latent correctness bug.
//
// These helpers instead do arithmetic in UTC, which has no DST, so results are
// identical on every machine and every environment. We store instants as UTC (see the
// seed, which normalises the gist's `-07:00` offsets to UTC) and format them in a
// fixed display timezone at the edge — the math in between stays UTC and deterministic.
//
// Semantics intentionally mirror date-fns: weeks/days add a fixed span; months step by
// calendar month preserving the day-of-month and CLAMPING into shorter months
// (Jan 31 + 1mo → Feb 28), always relative to the value passed in.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Add `n` whole days (each exactly 24h) in UTC. `n` may be negative. */
export function addUTCDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * DAY_MS);
}

/** Add `n` whole weeks (each exactly 7×24h) in UTC. `n` may be negative. */
export function addUTCWeeks(date: Date, n: number): Date {
  return addUTCDays(date, n * 7);
}

/** Number of days in the given UTC month (0-indexed month). */
function daysInUTCMonth(year: number, monthIndex: number): number {
  // Day 0 of the *next* month is the last day of this month.
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/**
 * Add `n` calendar months in UTC, preserving the UTC time-of-day and clamping the
 * day-of-month into shorter target months. `n` may be negative.
 */
export function addUTCMonths(date: Date, n: number): Date {
  const absoluteMonth = date.getUTCFullYear() * 12 + date.getUTCMonth() + n;
  const year = Math.floor(absoluteMonth / 12);
  const monthIndex = ((absoluteMonth % 12) + 12) % 12; // normalise for negative n
  const day = Math.min(date.getUTCDate(), daysInUTCMonth(year, monthIndex));
  return new Date(
    Date.UTC(
      year,
      monthIndex,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

/**
 * Whole-calendar-month difference in UTC (`later - earlier`), ignoring day-of-month —
 * the UTC analogue of date-fns `differenceInCalendarMonths`. Used to fast-forward a
 * far-past monthly anchor close to a window without a long linear scan.
 */
export function differenceInUTCMonths(later: Date, earlier: Date): number {
  return (
    (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 +
    (later.getUTCMonth() - earlier.getUTCMonth())
  );
}

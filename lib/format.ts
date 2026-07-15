// Zealthy — display / input-value formatting (pure, dependency-free).
//
// Turns stored Date values into (a) the human STRINGS the admin UI shows and (b) the
// STRINGS that seed <input> default values. Formatting is done in Server Components
// and only strings cross into the client form components, so there is never a
// client/server timezone divergence (i.e. no hydration mismatch on dates).
//
// Timezone handling is split by COLUMN KIND, on purpose:
//   • Appointment `datetime` is a real timestamp → formatted with LOCAL getters, so
//     the wall-clock time shown matches what a `datetime-local` input round-trips
//     back through `new Date(localString)` on the same server (the actions parse it
//     the same way). Local formatting round-trips in whatever TZ the server runs in.
//   • Date-only values (`refillOn` @db.Date, and `endsAt` chosen via a date input)
//     are stored at UTC midnight → formatted with UTC getters to avoid the classic
//     "off-by-one day" shift in negative-offset zones.

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** "Apr 16, 2026 · 4:30 PM" — local wall-clock, matches the datetime-local input. */
export function formatDateTime(d: Date): string {
  const hours = d.getHours();
  const period = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${hour12}:${pad(d.getMinutes())} ${period}`;
}

/** "Apr 16, 2026" — for date-only values stored at UTC midnight. */
export function formatDate(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** "YYYY-MM-DDTHH:mm" for `<input type="datetime-local">` (local getters). */
export function toDateTimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DD" for `<input type="date">` (UTC getters — date-only values). */
export function toDateInputValue(d: Date): string {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

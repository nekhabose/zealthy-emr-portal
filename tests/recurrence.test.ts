// Zealthy — recurrence unit tests.
//
// These lock down the one piece of non-trivial domain math both surfaces depend on.
// All dates use explicit UTC (`Z`) so the suite is timezone-agnostic in CI.

import { describe, expect, it } from "vitest";
import { expandOccurrences, nextOccurrence } from "../lib/recurrence";

const d = (iso: string) => new Date(iso);
const iso = (dates: Date[]) => dates.map((x) => x.toISOString());

describe("expandOccurrences — NONE (one-off)", () => {
  it("returns the single anchor when it falls inside the window", () => {
    const anchor = d("2026-07-20T15:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "NONE",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-07-22T00:00:00.000Z"),
    );
    expect(iso(out)).toEqual([anchor.toISOString()]);
  });

  it("returns nothing when the anchor is before the window", () => {
    const out = expandOccurrences(
      d("2026-07-10T15:00:00.000Z"),
      "NONE",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-07-22T00:00:00.000Z"),
    );
    expect(out).toEqual([]);
  });

  it("returns nothing when the anchor is after the window", () => {
    const out = expandOccurrences(
      d("2026-08-10T15:00:00.000Z"),
      "NONE",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-07-22T00:00:00.000Z"),
    );
    expect(out).toEqual([]);
  });

  it("treats both window bounds as inclusive", () => {
    const start = d("2026-07-15T00:00:00.000Z");
    const end = d("2026-07-22T00:00:00.000Z");
    expect(iso(expandOccurrences(start, "NONE", start, end))).toEqual([
      start.toISOString(),
    ]);
    expect(iso(expandOccurrences(end, "NONE", start, end))).toEqual([
      end.toISOString(),
    ]);
  });
});

describe("expandOccurrences — WEEKLY", () => {
  it("expands weekly occurrences within the window (anchor at window start)", () => {
    const anchor = d("2026-07-15T09:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "WEEKLY",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-08-12T00:00:00.000Z"), // 4 weeks
    );
    expect(iso(out)).toEqual(
      iso([
        d("2026-07-15T09:00:00.000Z"),
        d("2026-07-22T09:00:00.000Z"),
        d("2026-07-29T09:00:00.000Z"),
        d("2026-08-05T09:00:00.000Z"),
      ]),
    );
  });

  it("includes only occurrences from a PAST anchor that land inside the window", () => {
    // Anchor months before the window; fast-forward must land us correctly.
    const anchor = d("2026-01-01T12:00:00.000Z"); // a Thursday
    const out = expandOccurrences(
      anchor,
      "WEEKLY",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-07-29T00:00:00.000Z"),
    );
    // Weekly from Jan 1 → the Thursdays in the window are Jul 16 and Jul 23.
    expect(iso(out)).toEqual(
      iso([d("2026-07-16T12:00:00.000Z"), d("2026-07-23T12:00:00.000Z")]),
    );
  });

  it("keeps a consistent 7-day step (no drift) over a long horizon", () => {
    const anchor = d("2026-07-15T09:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "WEEKLY",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-10-15T00:00:00.000Z"), // ~3 months
    );
    // Every consecutive pair is exactly 7 days apart.
    for (let i = 1; i < out.length; i++) {
      const deltaDays =
        (out[i].getTime() - out[i - 1].getTime()) / (24 * 60 * 60 * 1000);
      expect(deltaDays).toBe(7);
    }
    expect(out.length).toBeGreaterThan(10);
  });
});

describe("expandOccurrences — MONTHLY across month boundaries", () => {
  it("steps by calendar month preserving the day-of-month", () => {
    const anchor = d("2026-01-15T10:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "MONTHLY",
      d("2026-01-15T00:00:00.000Z"),
      d("2026-04-30T00:00:00.000Z"),
    );
    expect(iso(out)).toEqual(
      iso([
        d("2026-01-15T10:00:00.000Z"),
        d("2026-02-15T10:00:00.000Z"),
        d("2026-03-15T10:00:00.000Z"),
        d("2026-04-15T10:00:00.000Z"),
      ]),
    );
  });

  it("clamps a 31st anchor into short months WITHOUT drifting afterward", () => {
    // The classic bug: stepping off the clamped date makes Feb 28 → Mar 28.
    // Always computing from the anchor keeps March/May on the 31st.
    const anchor = d("2026-01-31T08:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "MONTHLY",
      d("2026-01-31T00:00:00.000Z"),
      d("2026-06-01T00:00:00.000Z"),
    );
    expect(iso(out)).toEqual(
      iso([
        d("2026-01-31T08:00:00.000Z"),
        d("2026-02-28T08:00:00.000Z"), // clamped (2026 is not a leap year)
        d("2026-03-31T08:00:00.000Z"), // back to the 31st — no drift
        d("2026-04-30T08:00:00.000Z"), // clamped
        d("2026-05-31T08:00:00.000Z"),
      ]),
    );
  });
});

describe("expandOccurrences — endsAt truncation", () => {
  it("drops occurrences after endsAt (endsAt inside the window)", () => {
    const anchor = d("2026-07-15T09:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "WEEKLY",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-08-19T00:00:00.000Z"),
      d("2026-07-29T09:00:00.000Z"), // ends on the 3rd occurrence (inclusive)
    );
    expect(iso(out)).toEqual(
      iso([
        d("2026-07-15T09:00:00.000Z"),
        d("2026-07-22T09:00:00.000Z"),
        d("2026-07-29T09:00:00.000Z"),
      ]),
    );
  });

  it("returns nothing when endsAt precedes the window", () => {
    const out = expandOccurrences(
      d("2026-01-01T09:00:00.000Z"),
      "WEEKLY",
      d("2026-07-15T00:00:00.000Z"),
      d("2026-08-19T00:00:00.000Z"),
      d("2026-07-01T09:00:00.000Z"), // already ended before the window opens
    );
    expect(out).toEqual([]);
  });
});

describe("expandOccurrences — 3-month cap / bounded output", () => {
  it("never emits an occurrence past windowEnd, even for dense weekly recurrence", () => {
    const anchor = d("2026-07-15T09:00:00.000Z");
    const windowEnd = d("2026-10-15T00:00:00.000Z");
    const out = expandOccurrences(
      anchor,
      "WEEKLY",
      d("2026-07-15T00:00:00.000Z"),
      windowEnd,
    );
    expect(out.length).toBeGreaterThan(0);
    expect(out.length).toBeLessThanOrEqual(14); // ~13 weeks in 3 months
    for (const occ of out) {
      expect(occ.getTime()).toBeLessThanOrEqual(windowEnd.getTime());
    }
  });
});

describe("nextOccurrence", () => {
  it("returns the anchor itself for a future one-off", () => {
    const anchor = d("2026-07-20T15:00:00.000Z");
    expect(
      nextOccurrence(anchor, "NONE", d("2026-07-15T00:00:00.000Z"))?.toISOString(),
    ).toBe(anchor.toISOString());
  });

  it("returns null for a past one-off", () => {
    expect(
      nextOccurrence(
        d("2026-07-10T15:00:00.000Z"),
        "NONE",
        d("2026-07-15T00:00:00.000Z"),
      ),
    ).toBeNull();
  });

  it("finds the next weekly occurrence from a past anchor", () => {
    const anchor = d("2026-01-01T12:00:00.000Z"); // Thursday
    const next = nextOccurrence(anchor, "WEEKLY", d("2026-07-15T00:00:00.000Z"));
    expect(next?.toISOString()).toBe(d("2026-07-16T12:00:00.000Z").toISOString());
  });

  it("returns null when the next occurrence would fall after endsAt", () => {
    const anchor = d("2026-07-15T09:00:00.000Z");
    const next = nextOccurrence(
      anchor,
      "WEEKLY",
      d("2026-08-01T00:00:00.000Z"),
      d("2026-07-29T09:00:00.000Z"), // recurrence already ended
    );
    expect(next).toBeNull();
  });

  it("respects endsAt when it still permits an occurrence", () => {
    const anchor = d("2026-07-15T09:00:00.000Z");
    const next = nextOccurrence(
      anchor,
      "MONTHLY",
      d("2026-08-01T00:00:00.000Z"),
      d("2026-09-30T00:00:00.000Z"),
    );
    expect(next?.toISOString()).toBe(d("2026-08-15T09:00:00.000Z").toISOString());
  });
});

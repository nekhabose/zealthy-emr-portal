// Zealthy — portal schedule presentational primitives (Phase 6).
//
// Pure, string-in components shared by the dashboard summary and the 3-month drill-downs.
// All dates are pre-formatted to strings in the Server Components (via lib/format), so
// these never touch a `Date` — no client/server timezone divergence, no hydration risk.
// Phase 6 dresses each occurrence as a warm list row with a soft leading icon; the
// recurrence chip still carries the cadence, and colour is never the only signal.

import type { ReactNode } from "react";
import { Chip } from "@/components/ui/controls";

/** One appointment occurrence line: when + provider (+ recurrence chip). */
export function AppointmentItem({
  when,
  provider,
  cadenceLabel,
  isRecurring,
}: {
  when: string;
  provider: string;
  cadenceLabel: string;
  isRecurring: boolean;
}) {
  return (
    <li className="flex items-center gap-4 py-3.5">
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-mint text-brand-dark"
      >
        <CalendarGlyph />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{when}</p>
        <p className="truncate text-sm text-muted">{provider}</p>
      </div>
      {isRecurring ? <Chip>{cadenceLabel}</Chip> : null}
    </li>
  );
}

/** One refill occurrence line: when + medication/dosage/qty (+ recurrence chip). */
export function RefillItem({
  when,
  medication,
  dosage,
  quantity,
  cadenceLabel,
  isRecurring,
}: {
  when: string;
  medication: string;
  dosage: string;
  quantity: number;
  cadenceLabel: string;
  isRecurring: boolean;
}) {
  return (
    <li className="flex items-center gap-4 py-3.5">
      <span
        aria-hidden
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lavender text-[#574a78]"
      >
        <PillGlyph />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">
          {medication} <span className="text-muted">·</span> {dosage}
        </p>
        <p className="truncate text-sm text-muted">
          Refill {when} · Qty {quantity}
        </p>
      </div>
      {isRecurring ? <Chip tone="lavender">{cadenceLabel}</Chip> : null}
    </li>
  );
}

/** Empty-state row for a section with no items in the window. */
export function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream text-muted"
      >
        <CheckGlyph />
      </span>
      <p className="text-sm text-muted">{children}</p>
    </div>
  );
}

// ---- Glyphs ------------------------------------------------------------------

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

function CalendarGlyph() {
  return (
    <Glyph>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </Glyph>
  );
}

function PillGlyph() {
  return (
    <Glyph>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M12 8v8" />
    </Glyph>
  );
}

function CheckGlyph() {
  return (
    <Glyph>
      <path d="m5 12 4.5 4.5L19 7" />
    </Glyph>
  );
}

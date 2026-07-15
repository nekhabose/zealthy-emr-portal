// Zealthy — portal schedule presentational primitives.
//
// Pure, string-in components shared by the dashboard summary and the 3-month drill-downs.
// All dates are pre-formatted to strings in the Server Components (via lib/format), so
// these never touch a `Date` — no client/server timezone divergence, no hydration risk.

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
    <li className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">{when}</p>
        <p className="text-xs text-zinc-500">{provider}</p>
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
    <li className="flex items-start justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">
          {medication} <span className="text-zinc-400">·</span> {dosage}
        </p>
        <p className="text-xs text-zinc-500">
          Refill {when} · Qty {quantity}
        </p>
      </div>
      {isRecurring ? <Chip>{cadenceLabel}</Chip> : null}
    </li>
  );
}

/** Empty-state row for a section with no items in the window. */
export function EmptyRow({ children }: { children: ReactNode }) {
  return <p className="py-3 text-sm text-zinc-500">{children}</p>;
}

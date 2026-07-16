"use client";

// Zealthy — end a recurring appointment / prescription, optionally on a chosen date.
//
// The brief asks for "a way to end recurring appointments" and "to provide a way to end
// recurring" refills. This replaces the old end-as-of-now button with a small disclosure:
// a toggle reveals an optional end-date field — leave it blank to end today (the default),
// or pick a date to let the remaining occurrences run until then. Posts to the bound
// end-recurrence Server Action, which reads the `endsAt` field (blank → now).

import { useActionState, useId, useState } from "react";
import { INITIAL_FORM_STATE } from "@/lib/types";
import { Field, btnGhost, btnPrimary, inputClass } from "@/components/ui/controls";
import type { BoundAction } from "./action";

export function EndRecurrenceForm({
  action,
  label,
  noun,
  minDate,
}: {
  action: BoundAction;
  /** Trigger label, e.g. "End recurring" / "End refills". */
  label: string;
  /** What's ending, for the hint copy, e.g. "appointment" / "prescription". */
  noun: string;
  /** Anchor date ("YYYY-MM-DD") — the series can't end before it begins. */
  minDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const uid = useId();

  // No "close on success" effect needed: ending the recurrence sets `endsAt`, the action
  // revalidates /admin, and the row re-renders with `canEndRecurrence === false`, so this
  // control unmounts on its own. A validation failure keeps it open with the error shown.

  if (!open) {
    return (
      <button type="button" className={btnGhost} onClick={() => setOpen(true)}>
        {label}
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full space-y-3 rounded-2xl border border-hairline bg-cream/60 p-3"
    >
      <Field
        label="End on"
        htmlFor={`${uid}-endsAt`}
        error={state.errors?.endsAt}
        hint={`Leave blank to end this ${noun} today. Occurrences after this date stop.`}
      >
        <input
          id={`${uid}-endsAt`}
          name="endsAt"
          type="date"
          min={minDate}
          className={inputClass}
        />
      </Field>
      <div className="flex items-center gap-2">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Ending…" : "End recurrence"}
        </button>
        <button
          type="button"
          className={btnGhost}
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

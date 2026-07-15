"use client";

// Zealthy — create / edit prescription form.
//
// The medication and dosage options come from the seeded reference tables (passed in
// as props, sourced from the Medication / Dosage tables) — exactly as the brief
// requires — and the Server Action re-validates the chosen values against those same
// lists. Refills recur from `refillOn` + `refillSchedule` with an optional `endsAt`.

import { useActionState, useEffect, useId, useRef } from "react";
import { INITIAL_FORM_STATE } from "@/lib/types";
import type { Cadence } from "@/lib/recurrence";
import {
  Field,
  FormNotice,
  btnGhost,
  btnPrimary,
  inputClass,
} from "@/components/ui/controls";
import { REFILL_OPTIONS } from "./cadence";
import type { BoundAction } from "./action";

export interface PrescriptionDefaults {
  medication: string;
  dosage: string;
  quantity: number;
  /** "YYYY-MM-DD" for the refill-date input. */
  refillOn: string;
  refillSchedule: Cadence;
  /** "YYYY-MM-DD" for the end-date input, or "" for open-ended. */
  endsAt: string;
}

export function PrescriptionForm({
  action,
  mode,
  medications,
  dosages,
  defaults,
  onDone,
  onCancel,
}: {
  action: BoundAction;
  mode: "create" | "edit";
  medications: readonly string[];
  dosages: readonly string[];
  defaults?: PrescriptionDefaults;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    if (mode === "create") formRef.current?.reset();
    onDone?.();
  }, [state, mode, onDone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Medication"
          htmlFor={`${uid}-medication`}
          error={state.errors?.medication}
        >
          <select
            id={`${uid}-medication`}
            name="medication"
            defaultValue={defaults?.medication ?? ""}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select a medication…
            </option>
            {medications.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dosage" htmlFor={`${uid}-dosage`} error={state.errors?.dosage}>
          <select
            id={`${uid}-dosage`}
            name="dosage"
            defaultValue={defaults?.dosage ?? ""}
            className={inputClass}
            required
          >
            <option value="" disabled>
              Select a dosage…
            </option>
            {dosages.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Quantity"
          htmlFor={`${uid}-quantity`}
          error={state.errors?.quantity}
        >
          <input
            id={`${uid}-quantity`}
            name="quantity"
            type="number"
            min={1}
            step={1}
            defaultValue={defaults?.quantity ?? 1}
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="First refill"
          htmlFor={`${uid}-refillOn`}
          error={state.errors?.refillOn}
        >
          <input
            id={`${uid}-refillOn`}
            name="refillOn"
            type="date"
            defaultValue={defaults?.refillOn}
            className={inputClass}
            required
          />
        </Field>

        <Field
          label="Refill schedule"
          htmlFor={`${uid}-refillSchedule`}
          error={state.errors?.refillSchedule}
        >
          <select
            id={`${uid}-refillSchedule`}
            name="refillSchedule"
            defaultValue={defaults?.refillSchedule ?? "NONE"}
            className={inputClass}
          >
            {REFILL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Ends on (optional)"
        htmlFor={`${uid}-endsAt`}
        error={state.errors?.endsAt}
        hint="Leave blank for an open-ended prescription."
      >
        <input
          id={`${uid}-endsAt`}
          name="endsAt"
          type="date"
          defaultValue={defaults?.endsAt}
          className={inputClass}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Add prescription" : "Save changes"}
        </button>
        {onCancel ? (
          <button type="button" className={btnGhost} onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        ) : null}
        <FormNotice state={state} />
      </div>
    </form>
  );
}

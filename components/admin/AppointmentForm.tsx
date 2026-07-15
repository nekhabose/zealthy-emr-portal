"use client";

// Zealthy — create / edit appointment form.
//
// Shared by the "Add appointment" disclosure (create) and each appointment row's
// inline editor (edit). `useActionState` gives inline field errors + pending; on
// success the create form resets itself, and an optional `onDone` lets the edit row
// collapse. Recurrence is stored as an anchor `datetime` + `repeat` cadence, with an
// optional `endsAt` terminator (the "end recurring" action is a separate control).

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
import { REPEAT_OPTIONS } from "./cadence";
import type { BoundAction } from "./action";

export interface AppointmentDefaults {
  provider: string;
  /** "YYYY-MM-DDTHH:mm" for the datetime-local input. */
  datetime: string;
  repeat: Cadence;
  /** "YYYY-MM-DD" for the end-date input, or "" for open-ended. */
  endsAt: string;
}

export function AppointmentForm({
  action,
  mode,
  defaults,
  onDone,
  onCancel,
}: {
  action: BoundAction;
  mode: "create" | "edit";
  defaults?: AppointmentDefaults;
  onDone?: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);

  // On a successful write the Server Action revalidates /admin, so the list updates
  // on its own. Here we just reset the create form for the next entry and let an
  // edit row collapse back to its read view.
  useEffect(() => {
    if (!state.ok) return;
    if (mode === "create") formRef.current?.reset();
    onDone?.();
  }, [state, mode, onDone]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="Provider" htmlFor={`${uid}-provider`} error={state.errors?.provider}>
        <input
          id={`${uid}-provider`}
          name="provider"
          type="text"
          defaultValue={defaults?.provider}
          className={inputClass}
          placeholder="Dr. Alex Rivera"
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Date & time"
          htmlFor={`${uid}-datetime`}
          error={state.errors?.datetime}
        >
          <input
            id={`${uid}-datetime`}
            name="datetime"
            type="datetime-local"
            defaultValue={defaults?.datetime}
            className={inputClass}
            required
          />
        </Field>

        <Field label="Repeat" htmlFor={`${uid}-repeat`} error={state.errors?.repeat}>
          <select
            id={`${uid}-repeat`}
            name="repeat"
            defaultValue={defaults?.repeat ?? "NONE"}
            className={inputClass}
          >
            {REPEAT_OPTIONS.map((o) => (
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
        hint="Leave blank for an open-ended recurring appointment."
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
          {pending ? "Saving…" : mode === "create" ? "Add appointment" : "Save changes"}
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

"use client";

// Zealthy — create / edit patient form (mini-EMR).
//
// One client form for both modes. `useActionState` drives inline Zod field errors
// (re-parsed on the server) and the pending state; the bound Server Action is passed
// in as a prop so this component stays reusable and never imports the action layer.
//
// Password is a *visible* text input by design: the brief requires admin-settable
// patient passwords to ease portal testing, so the operator must be able to read
// what they type/set. Stored in plaintext — documented in the README. In edit mode
// the field is optional (blank ⇒ keep the current password).

import { useActionState, useId } from "react";
import { INITIAL_FORM_STATE } from "@/lib/types";
import { Field, FormNotice, btnPrimary, inputClass } from "@/components/ui/controls";
import type { BoundAction } from "./action";

export function PatientForm({
  action,
  mode,
  defaults,
  submitLabel,
}: {
  action: BoundAction;
  mode: "create" | "edit";
  defaults?: { name: string; email: string };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const uid = useId();
  const isEdit = mode === "edit";

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Full name" htmlFor={`${uid}-name`} error={state.errors?.name}>
        <input
          id={`${uid}-name`}
          name="name"
          type="text"
          defaultValue={defaults?.name}
          className={inputClass}
          placeholder="Jane Doe"
          required
        />
      </Field>

      <Field label="Email" htmlFor={`${uid}-email`} error={state.errors?.email}>
        <input
          id={`${uid}-email`}
          name="email"
          type="email"
          defaultValue={defaults?.email}
          className={inputClass}
          placeholder="jane@example.com"
          required
        />
      </Field>

      <Field
        label="Password"
        htmlFor={`${uid}-password`}
        error={state.errors?.password}
        hint={
          isEdit
            ? "Leave blank to keep the current password."
            : "Used for the patient portal login. Stored in plaintext by design (see README)."
        }
      >
        <input
          id={`${uid}-password`}
          name="password"
          type="text"
          autoComplete="off"
          className={inputClass}
          placeholder={isEdit ? "••••••• (unchanged)" : "Set a password"}
          required={!isEdit}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button type="submit" className={btnPrimary} disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <FormNotice state={state} />
      </div>
    </form>
  );
}

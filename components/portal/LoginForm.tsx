"use client";

// Zealthy — patient portal login form.
//
// Client component on React 19's `useActionState`: the third tuple value is the pending
// flag (no separate `useFormStatus` child needed) and the first carries the typed
// `FormState` for inline field + form errors. Mirrors the admin forms' conventions, and
// reuses the shared UI primitives so both surfaces feel consistent ahead of Phase 6.

import { useActionState } from "react";
import { loginAction } from "@/app/(portal)/actions";
import { INITIAL_FORM_STATE } from "@/lib/types";
import {
  Field,
  FormNotice,
  btnPrimary,
  inputClass,
} from "@/components/ui/controls";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, INITIAL_FORM_STATE);

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Email" htmlFor="email" error={state.errors?.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>

      <Field label="Password" htmlFor="password" error={state.errors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={inputClass}
        />
      </Field>

      <FormNotice state={state} />

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

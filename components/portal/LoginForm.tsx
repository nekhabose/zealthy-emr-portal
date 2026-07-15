"use client";

// Zealthy — patient portal login form.
//
// Client component on React 19's `useActionState`: the third tuple value is the pending
// flag (no separate `useFormStatus` child needed) and the first carries the typed
// `FormState` for inline field + form errors. Phase 6 adds a small, restrained shake on
// a failed sign-in (disabled under reduced-motion) and the shared pill-button styling.

import { useActionState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  const reduce = useReducedMotion();
  const hasFormError = Boolean(state.errors?._form?.length);

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

      {/* Restrained shake on a rejected sign-in; a plain fade under reduced motion. */}
      <motion.div
        key={hasFormError ? "err" : "ok"}
        animate={
          hasFormError && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }
        }
        transition={{ duration: 0.35 }}
        role="status"
        aria-live="polite"
      >
        <FormNotice state={state} />
      </motion.div>

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

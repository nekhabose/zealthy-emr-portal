"use client";

// Zealthy — admin (mini-EMR) login form.
//
// Mirrors the portal LoginForm: a client component on React 19's `useActionState`
// (third tuple value = pending flag; first = the typed `FormState` for the inline form
// error), with the shared pill button + a restrained shake on a rejected password
// (disabled under reduced motion). One field only — the shared admin password.

import { useActionState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { adminLoginAction } from "@/app/admin/auth-actions";
import { INITIAL_FORM_STATE } from "@/lib/types";
import { Field, FormNotice, btnPrimary, inputClass } from "@/components/ui/controls";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLoginAction, INITIAL_FORM_STATE);
  const reduce = useReducedMotion();
  const hasFormError = Boolean(state.errors?._form?.length);

  return (
    <form action={action} className="space-y-4" noValidate>
      <Field label="Admin password" htmlFor="password" error={state.errors?.password}>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          placeholder="••••••••"
          className={inputClass}
        />
      </Field>

      {/* Restrained shake on a rejected password; a plain fade under reduced motion. */}
      <motion.div
        key={hasFormError ? "err" : "ok"}
        animate={hasFormError && !reduce ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
        role="status"
        aria-live="polite"
      >
        <FormNotice state={state} />
      </motion.div>

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Signing in…" : "Sign in to EMR"}
      </button>
    </form>
  );
}

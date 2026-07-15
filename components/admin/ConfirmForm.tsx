"use client";

// Zealthy — a one-button form that runs a bound Server Action behind a confirm().
//
// Used for the destructive / terminal admin controls (delete appointment, delete
// prescription, end recurrence). Goes through `useActionState` so the bound action's
// `(prevState, formData)` signature is satisfied and we get a pending state; the
// native confirm() gates submission (progressive-enhancement friendly — the form
// still posts if JS is slow, it just won't be gated until hydrated).

import { useActionState } from "react";
import { INITIAL_FORM_STATE } from "@/lib/types";
import type { BoundAction } from "./action";

export function ConfirmForm({
  action,
  confirmText,
  className,
  pendingLabel = "…",
  children,
}: {
  action: BoundAction;
  confirmText: string;
  className: string;
  pendingLabel?: string;
  children: React.ReactNode;
}) {
  const [, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <button type="submit" className={className} disabled={pending}>
        {pending ? pendingLabel : children}
      </button>
    </form>
  );
}

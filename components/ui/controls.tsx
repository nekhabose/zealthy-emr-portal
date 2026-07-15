// Zealthy — shared UI primitives for the admin (mini-EMR) surface.
//
// Deliberately small and presentational: className constants + a couple of layout
// helpers reused across the Phase-4 forms and lists. Full design-system polish
// (tokens, motion, brand palette) is Phase 6; these keep Phase 4 clean-but-basic
// and consistent. No "use client" directive — these are used inside client forms
// (bundled with them) and by Server Components alike.

import type { ReactNode } from "react";
import type { FormState } from "@/lib/types";

// ---- Class tokens ------------------------------------------------------------

export const cardClass =
  "rounded-xl border border-zinc-200 bg-white p-6 shadow-sm";
export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-60";
export const labelClass = "block text-sm font-medium text-zinc-700";

const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = `${btnBase} bg-emerald-800 text-white hover:bg-emerald-700`;
export const btnSecondary = `${btnBase} border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50`;
export const btnDanger = `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const btnGhost = `${btnBase} text-zinc-600 hover:bg-zinc-100`;

// ---- Small components --------------------------------------------------------

/** Labelled form control wrapper with an optional hint and inline field errors. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string[];
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      <FieldError messages={error} />
    </div>
  );
}

/** Inline, per-field validation messages (rendered from a `FormState.errors` entry). */
export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs font-medium text-red-600">{messages.join(". ")}</p>;
}

/**
 * Form-level notice: the `_form` bucket of a failed parse (top-level refinements /
 * caught errors) in red, or a success `message` in green. Field errors render at
 * their own fields via {@link FieldError}.
 */
export function FormNotice({ state }: { state: FormState }) {
  if (state.errors?._form?.length) {
    return (
      <p className="text-sm font-medium text-red-600">
        {state.errors._form.join(". ")}
      </p>
    );
  }
  if (state.ok && state.message) {
    return <p className="text-sm font-medium text-emerald-700">{state.message}</p>;
  }
  return null;
}

/** A soft status chip (e.g. a "Weekly" recurrence marker). */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
      {children}
    </span>
  );
}

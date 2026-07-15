// Zealthy — shared, presentational UI primitives for BOTH surfaces (Phase 6).
//
// Class-token constants + small layout helpers on the Phase-6 design system: warm
// cream/white grounds, rounded cards with soft shadows, pill buttons with a press
// micro-interaction, large rounded inputs with a mint focus ring, and soft pastel
// status chips. Export NAMES are kept stable from Phase 4/5 so every existing form
// and list picks up the new look without a call-site change. No "use client" — these
// are pure (no hooks) and bundle happily into client forms and Server Components alike.

import type { ReactNode } from "react";
import type { FormState } from "@/lib/types";

// ---- Class tokens ------------------------------------------------------------

/** Standard content card: rounded, minimal border, very soft shadow, spacious. */
export const cardClass =
  "rounded-3xl border border-hairline bg-white p-6 shadow-soft sm:p-7";

/** Interactive/clickable card: adds the 3–4px hover lift + slightly deeper shadow. */
export const cardInteractive =
  `${cardClass} block transition duration-200 ease-spring hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift`;

export const inputClass =
  "w-full rounded-xl border border-hairline bg-white px-4 py-2.5 text-[15px] text-ink shadow-sm outline-none transition-colors placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-mint disabled:cursor-not-allowed disabled:opacity-60";
export const labelClass = "block text-sm font-semibold text-ink";

// Pill buttons. `active:scale-[0.98]` is the press micro-interaction; the spring easing
// + color transition give immediate, quiet feedback without any continuous animation.
const btnBase =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition duration-200 ease-spring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
export const btnPrimary = `${btnBase} bg-brand-dark text-white shadow-soft hover:bg-brand-hover`;
export const btnSecondary = `${btnBase} border border-hairline bg-white text-ink hover:bg-mint/50`;
export const btnDanger = `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`;
export const btnGhost = `${btnBase} text-muted hover:bg-mint/50 hover:text-ink`;

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
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      <FieldError messages={error} />
    </div>
  );
}

/** Inline, per-field validation messages (rendered from a `FormState.errors` entry). */
export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs font-semibold text-red-600">{messages.join(". ")}</p>;
}

/**
 * Form-level notice: the `_form` bucket of a failed parse (top-level refinements /
 * caught errors) in red, or a success `message` in green. Field errors render at
 * their own fields via {@link FieldError}.
 */
export function FormNotice({ state }: { state: FormState }) {
  if (state.errors?._form?.length) {
    return (
      <p className="text-sm font-semibold text-red-600">
        {state.errors._form.join(". ")}
      </p>
    );
  }
  if (state.ok && state.message) {
    return <p className="text-sm font-semibold text-brand">{state.message}</p>;
  }
  return null;
}

const CHIP_TONES = {
  mint: "bg-mint text-brand-dark",
  peach: "bg-peach text-[#8a4b32]",
  lavender: "bg-lavender text-[#574a78]",
  neutral: "bg-cream text-muted ring-1 ring-inset ring-hairline",
} as const;

/** A soft pastel status chip (e.g. a "Weekly" recurrence marker). */
export function Chip({
  children,
  tone = "mint",
}: {
  children: ReactNode;
  tone?: keyof typeof CHIP_TONES;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${CHIP_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** Page/section header: optional eyebrow, big editorial title, subtitle, right action. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 text-[15px] text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const STAT_TONES = {
  mint: "bg-mint",
  peach: "bg-peach",
  lavender: "bg-lavender",
  cream: "bg-cream",
} as const;

/** A large, warm summary tile: a big number/value over a soft pastel ground. */
export function StatCard({
  label,
  value,
  hint,
  tone = "mint",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className={`rounded-3xl p-6 ${STAT_TONES[tone]}`}>
      <p className="text-sm font-semibold text-ink/70">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight text-brand-dark tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-sm text-ink/60">{hint}</p> : null}
    </div>
  );
}

/** Shimmering skeleton block for elegant loading states (matches final layout). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`zealthy-skeleton rounded-xl ${className}`} />;
}

// Zealthy — patient portal login page (root "/").
//
// Server Component. If a session already exists, bounce straight to the dashboard;
// otherwise render the login experience. Phase 6 turns this into the app's one
// editorial moment: a two-column hero with an oversized headline, warm trust cues,
// a floating preview card, and soft organic background shapes on the left, and the
// login card on the right. It recomposes to a single readable column on mobile.
//
// The seeded test credentials are surfaced right on the card — this is a take-home whose
// reviewers need to log in immediately, and the passwords are plaintext by design anyway.

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/portal/LoginForm";
import { Reveal } from "@/components/ui/motion";

// Never cache: the redirect decision depends on the current session.
export const dynamic = "force-dynamic";

const TRUST = [
  "24/7 portal access",
  "Board-certified care",
  "Refills on autopilot",
] as const;

export default async function LoginPage() {
  const session = await auth();
  if (session?.patientId) redirect("/portal");

  return (
    <main className="relative flex min-h-full flex-col overflow-hidden">
      {/* Soft organic background shapes — decorative, slow-floating, hidden from AT. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="zealthy-float absolute -left-24 -top-24 h-80 w-80 rounded-full bg-mint blur-3xl opacity-70" />
        <div className="absolute right-[-6rem] top-24 h-72 w-72 rounded-full bg-peach blur-3xl opacity-50" />
        <div className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-lavender blur-3xl opacity-40" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        {/* Left — editorial ------------------------------------------------- */}
        <Reveal className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
            Zealthy · Patient Portal
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Your care,
            <br />
            <span className="text-brand-dark">calmly in hand.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            See what&apos;s coming up next — appointments, refills, and the people
            looking after you — all in one warm, uncluttered place.
          </p>

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {TRUST.map((t) => (
              <li
                key={t}
                className="rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-ink shadow-soft ring-1 ring-inset ring-hairline backdrop-blur-sm"
              >
                {t}
              </li>
            ))}
          </ul>

          {/* Floating preview card — a quiet product glimpse (desktop only). */}
          <div className="zealthy-float mt-12 hidden max-w-xs rounded-3xl border border-hairline bg-white/85 p-5 shadow-lift backdrop-blur-sm lg:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              Next appointment
            </p>
            <p className="mt-2 text-lg font-bold text-ink">Thursday · 4:30 PM</p>
            <p className="text-sm text-muted">Dr. Alex Rivera · Telehealth</p>
            <div className="mt-3 inline-flex items-center rounded-full bg-mint px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
              Weekly
            </div>
          </div>
        </Reveal>

        {/* Right — login card ---------------------------------------------- */}
        <Reveal delay={0.1} className="w-full">
          <div className="mx-auto w-full max-w-md rounded-[28px] border border-hairline bg-white p-7 shadow-lift sm:p-9">
            <h2 className="text-2xl font-bold tracking-tight text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-muted">
              Welcome back. Enter your details to continue.
            </p>

            <div className="mt-6">
              <LoginForm />
            </div>

            <div className="mt-6 rounded-2xl bg-cream p-4 text-sm">
              <p className="font-semibold text-ink">Sample login</p>
              <p className="mt-1 text-muted">
                <span className="font-mono text-ink">mark@some-email-provider.net</span>
                <br />
                <span className="font-mono text-ink">Password123!</span>
              </p>
              <p className="mt-2 text-xs text-muted">
                Or use any patient created in the{" "}
                <Link
                  href="/admin"
                  className="font-semibold text-brand underline-offset-2 hover:underline"
                >
                  mini-EMR
                </Link>
                .
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}

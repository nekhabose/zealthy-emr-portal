// Zealthy — patient portal login page (root "/").
//
// Server Component. If a session already exists, bounce straight to the dashboard;
// otherwise render the login form. The form itself is a client component wired to the
// `loginAction` Server Action (email + password → `signIn('credentials')`).
//
// The seeded test credentials are surfaced right on the page — this is a take-home whose
// reviewers need to log in immediately, and the passwords are plaintext by design anyway.

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/portal/LoginForm";
import { cardClass } from "@/components/ui/controls";

// Never cache: the redirect decision depends on the current session.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await auth();
  if (session?.patientId) redirect("/portal");

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-emerald-800">
          Zealthy
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Patient portal
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sign in to see your upcoming appointments and refills.
        </p>
      </div>

      <div className={cardClass}>
        <LoginForm />
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-zinc-300 bg-white/60 p-4 text-xs text-zinc-500">
        <p className="font-medium text-zinc-600">Sample login</p>
        <p className="mt-1">
          <span className="font-mono">mark@some-email-provider.net</span> ·{" "}
          <span className="font-mono">Password123!</span>
        </p>
        <p className="mt-1 text-zinc-400">
          Or use any patient created in the{" "}
          <Link href="/admin" className="text-emerald-800 hover:underline">
            mini-EMR
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

// Zealthy — mini-EMR login page (/admin/login).
//
// Server Component. If already authenticated as admin, bounce into the EMR; otherwise
// render the login card. This is the ONE admin route the Proxy leaves open (everything
// else under /admin requires the session), so it must handle its own already-signed-in
// redirect. Utilitarian and centered — the EMR is an operator tool, not the consumer hero.

import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-helpers";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { Reveal } from "@/components/ui/motion";

// Never cache: the redirect decision depends on the current admin cookie.
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect("/admin");

  return (
    <main className="flex min-h-full items-center justify-center px-5 py-16">
      <Reveal className="w-full max-w-md">
        <div className="rounded-[28px] border border-hairline bg-white p-7 shadow-lift sm:p-9">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-dark text-sm font-bold text-white"
            >
              Z
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Mini-EMR sign in
              </h1>
              <p className="text-sm text-muted">Staff access to the patient records.</p>
            </div>
          </div>

          <div className="mt-6">
            <AdminLoginForm />
          </div>

          <p className="mt-6 rounded-2xl bg-cream p-4 text-xs text-muted">
            The EMR is protected by a single shared staff password (set via the
            <span className="font-mono text-ink"> ADMIN_PASSWORD </span>
            environment variable). Patients sign in separately at the{" "}
            <Link
              href="/"
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              portal
            </Link>
            .
          </p>
        </div>
      </Reveal>
    </main>
  );
}

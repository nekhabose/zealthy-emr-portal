// Zealthy — mini-EMR (/admin) layout.
//
// Password-gated (see proxy.ts + lib/admin-helpers): the EMR now sits behind a shared
// staff login. The sticky, softly-blurred header carries the brand mark and — when a
// session is present — a sign-out button. The header is a Server Component so it can read
// the session state; the login page renders inside this shell too, hence the conditional.

import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-helpers";
import { adminLogoutAction } from "@/app/admin/auth-actions";
import { btnSecondary } from "@/components/ui/controls";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAdminAuthenticated();

  return (
    <div className="min-h-full text-ink">
      <header className="sticky top-0 z-30 border-b border-hairline/70 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-dark text-sm font-bold text-white"
            >
              Z
            </span>
            <span className="text-sm font-bold tracking-tight text-ink">
              Zealthy · Mini-EMR
            </span>
          </Link>
          {authed ? (
            <form action={adminLogoutAction}>
              <button type="submit" className={btnSecondary}>
                Sign out
              </button>
            </form>
          ) : (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted ring-1 ring-inset ring-hairline">
              Staff only
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

// Zealthy — AUTHENTICATED portal shell (/portal/*).
//
// Renders the header chrome (greeting + nav tabs + sign-out) around every authenticated
// page. The name comes from `auth()`; if there's no session we still render nothing
// sensitive here because each child PAGE calls `requirePatient()` and redirects — the
// authoritative check lives next to the data, per the Next.js auth guidance (a layout
// check alone wouldn't re-run on client-side navigation between the tabs).

import { auth } from "@/auth";
import { signOutAction } from "@/app/(portal)/actions";
import { PortalNav } from "@/components/portal/PortalNav";
import { btnSecondary } from "@/components/ui/controls";

export default async function PortalShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const name = session?.user?.name ?? "there";

  return (
    <div className="min-h-full">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
              Zealthy · Patient portal
            </p>
            <p className="text-sm text-zinc-500">Hi, {name}</p>
          </div>
          <div className="flex items-center gap-3">
            <PortalNav />
            <form action={signOutAction}>
              <button type="submit" className={btnSecondary}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  );
}

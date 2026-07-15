// Zealthy — AUTHENTICATED portal shell (/portal/*).
//
// Renders the header chrome (brand + greeting + segmented nav + sign-out) around every
// authenticated page, plus a fixed bottom nav on mobile. The name comes from `auth()`;
// if there's no session we still render nothing sensitive here because each child PAGE
// calls `requirePatient()` and redirects — the authoritative check lives next to the
// data, per the Next.js auth guidance (a layout check alone wouldn't re-run on
// client-side navigation between the tabs).

import { auth } from "@/auth";
import { signOutAction } from "@/app/(portal)/actions";
import { PortalNav, PortalBottomNav } from "@/components/portal/PortalNav";
import { btnSecondary } from "@/components/ui/controls";

export default async function PortalShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const name = session?.user?.name ?? "there";

  return (
    <div className="min-h-full pb-24 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-hairline/70 bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-dark text-sm font-bold text-white"
            >
              Z
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">Zealthy</p>
              <p className="text-xs text-muted">Hi, {name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <PortalNav />
            </div>
            <form action={signOutAction}>
              <button type="submit" className={btnSecondary}>
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-10">{children}</main>

      <div className="sm:hidden">
        <PortalBottomNav />
      </div>
    </div>
  );
}

// Zealthy — mini-EMR (/admin) layout.
//
// Open by design: the exercise brief specifies the EMR requires NO authentication
// (normally it would, of course). The sticky, softly-blurred header carries the brand
// mark and a plain label — no login, no session state.

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted ring-1 ring-inset ring-hairline">
            Staff view
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

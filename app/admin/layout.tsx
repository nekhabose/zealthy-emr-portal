// Zealthy — mini-EMR (/admin) layout.
//
// Open by design: the brief specifies the EMR has no auth (unlike the portal). Phase 6
// gives it a sticky, softly-blurred header with a brand mark and a plain-language
// "no sign-in" badge, over the shared warm cream ground. The EMR stays a touch more
// utilitarian than the consumer portal — denser, table-first — but on the same tokens.

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
            Admin · no sign-in
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}

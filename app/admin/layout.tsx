// Zealthy — mini-EMR (/admin) layout.
//
// Open by design: the brief specifies the EMR has no auth (unlike the Phase-5 portal).
// Provides the shared header + a max-width container and switches the surface to the
// Geist sans font (globals.css sets a fallback body font). Design polish is Phase 6.

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            Zealthy · Mini-EMR
          </Link>
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-500">
            Admin · no sign-in
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}

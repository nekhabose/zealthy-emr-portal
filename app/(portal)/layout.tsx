// Zealthy — patient portal route-group layout.
//
// Wraps BOTH the login page ("/") and the authenticated drill-downs ("/portal/*") with
// the portal's surface treatment (background + Geist sans). It intentionally carries no
// nav or sign-out — the login page must stay chrome-free, and the authenticated shell
// lives one level down in `portal/layout.tsx`. Design polish (the editorial login hero,
// brand tokens) is Phase 6; this keeps Phase 5 clean-but-basic.

export default function PortalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-zinc-50 font-sans text-zinc-900">{children}</div>
  );
}

// Zealthy — patient portal route-group layout.
//
// Wraps BOTH the login page ("/") and the authenticated drill-downs ("/portal/*").
// It intentionally carries no nav or sign-out — the login page must stay chrome-free,
// and the authenticated shell lives one level down in `portal/layout.tsx`. The warm
// cream ground comes from the body (globals.css); this just guarantees full height.

export default function PortalGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full text-ink">{children}</div>;
}

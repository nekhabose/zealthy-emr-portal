// Zealthy — portal loading skeleton.
//
// Shown by the App Router while a /portal/* Server Component streams its data. The
// shapes mirror the dashboard layout (greeting → stat tiles → summary cards) so there's
// no jarring reflow when the real content replaces it. The shimmer is CSS-only and is
// disabled under prefers-reduced-motion (see globals.css).

import { Skeleton } from "@/components/ui/controls";

export default function PortalLoading() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    </div>
  );
}

// Zealthy — mini-EMR loading skeleton.
//
// Shown while an /admin Server Component streams its data. Mirrors the patients-page
// layout (header row → table card) so content swaps in without a reflow. CSS-only
// shimmer, disabled under prefers-reduced-motion (see globals.css).

import { Skeleton } from "@/components/ui/controls";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>

      <div className="space-y-2 rounded-3xl border border-hairline bg-white p-4 shadow-soft">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

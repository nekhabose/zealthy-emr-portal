"use client";

// Zealthy — patient portal top navigation.
//
// Client component so the active tab can be highlighted from `usePathname()`. Three
// destinations: the dashboard summary and the two 3-month drill-downs. Purely
// presentational otherwise; auth is enforced server-side (proxy + `requirePatient`).

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/portal", label: "Overview" },
  { href: "/portal/appointments", label: "Appointments" },
  { href: "/portal/prescriptions", label: "Prescriptions" },
] as const;

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {TABS.map((tab) => {
        // Exact match for the overview root; prefix match for the drill-downs.
        const active =
          tab.href === "/portal"
            ? pathname === "/portal"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-800 text-white"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

// Zealthy — patient portal navigation (Phase 6).
//
// Two presentations of the same three destinations, both driven by `usePathname()`:
//   • PortalNav — a desktop segmented control whose green "pill" slides between tabs
//     via a shared-layout (layoutId) spring, so the active state animates smoothly.
//   • PortalBottomNav — a fixed, thumb-friendly bottom bar for mobile (icons + labels).
// Auth is enforced server-side (proxy + `requirePatient`); this is purely presentational.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const TABS = [
  { href: "/portal", label: "Overview", icon: HomeIcon },
  { href: "/portal/appointments", label: "Appointments", icon: CalendarIcon },
  { href: "/portal/prescriptions", label: "Prescriptions", icon: PillIcon },
] as const;

function isActive(pathname: string, href: string): boolean {
  // Exact match for the overview root; prefix match for the drill-downs.
  return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
}

/** Desktop: a segmented pill control with an animated active indicator. */
export function PortalNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <nav className="flex items-center gap-1 rounded-full bg-white p-1 shadow-soft ring-1 ring-inset ring-hairline">
      {TABS.map((tab) => {
        const active = isActive(pathname, tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active ? "text-white" : "text-muted hover:text-ink"
            }`}
          >
            {active ? (
              <motion.span
                layoutId="portal-tab-pill"
                className="absolute inset-0 rounded-full bg-brand-dark"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 260, damping: 24, mass: 0.8 }
                }
              />
            ) : null}
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile: a fixed bottom navigation bar with large touch targets. */
export function PortalBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline bg-cream/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-1.5">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-semibold transition-colors ${
                active ? "text-brand-dark" : "text-muted"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                  active ? "bg-mint" : "bg-transparent"
                }`}
              >
                <Icon />
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ---- Minimal inline icons (decorative; labels carry the meaning) -------------

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

function HomeIcon() {
  return (
    <IconWrap>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </IconWrap>
  );
}

function CalendarIcon() {
  return (
    <IconWrap>
      <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M8 3v3M16 3v3" />
    </IconWrap>
  );
}

function PillIcon() {
  return (
    <IconWrap>
      <rect x="3" y="8" width="18" height="8" rx="4" />
      <path d="M12 8v8" />
    </IconWrap>
  );
}

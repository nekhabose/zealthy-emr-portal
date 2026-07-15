// Zealthy — Proxy (formerly "Middleware"; renamed in Next.js 16).
//
// Optimistic auth guard for the patient portal. Built from the EDGE-SAFE `authConfig`
// only — no Prisma, no providers — so it can decode the signed session cookie on every
// matched request without dragging Node-only code into the proxy bundle. The `authorized`
// callback in authConfig makes the actual allow/redirect decision; an unauthenticated hit
// to `/portal/*` is bounced to the login page ("/").
//
// This is a fast FIRST line of defense, not the only one: each portal page ALSO calls
// `requirePatient()` (a secure server-side `auth()` check) close to its data, per the
// Next.js auth guidance. The matcher scopes the proxy to the portal so the open `/admin`
// EMR and the public login page are never intercepted.
//
// Next 16 requires the proxy to be a DECLARED function export (a destructured `const`
// isn't recognised by the build analyzer), so we wrap Auth.js's `auth` middleware
// runner in an explicit `proxy` function that delegates to it.

import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

// `auth(request, event)` runs the session decode + `authorized` guard and returns a
// redirect Response (or continues). Typed here to the middleware call shape.
const runAuthGuard = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Promise<Response | undefined>;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  return runAuthGuard(request, event);
}

export const config = {
  // Only guard the authenticated portal drill-downs. `/` (login) and `/admin` (open EMR)
  // are intentionally excluded.
  matcher: ["/portal/:path*"],
};

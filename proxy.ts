// Zealthy — Proxy (formerly "Middleware"; renamed in Next.js 16).
//
// Guards the PATIENT portal only. Built from the EDGE-SAFE `authConfig` (no Prisma, no
// providers), so it decodes the signed session cookie on every matched request; the
// `authorized` callback redirects an unauthenticated hit to "/". The `/admin` EMR is
// intentionally OPEN (no auth) per the exercise brief, so it is not matched here.
//
// The proxy is the FAST, optimistic line of defense — every portal page additionally
// calls `requirePatient()` close to the data.
//
// Next 16 requires the proxy to be a DECLARED function export (a destructured `const`
// isn't recognised by the build analyzer), so we wrap Auth.js's `auth` runner in an
// explicit `proxy` function.

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

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Portal gate — delegated to the Auth.js `authorized` callback.
  return runAuthGuard(request, event);
}

export const config = {
  // Guard the patient portal only. `/` (login) handles its own redirect; `/admin` is
  // open by design (brief: the EMR requires no auth).
  matcher: ["/portal/:path*"],
};

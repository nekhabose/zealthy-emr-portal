// Zealthy — Proxy (formerly "Middleware"; renamed in Next.js 16).
//
// Two independent guards, one choke point:
//   • /portal/*  — the PATIENT session (Auth.js). Built from the EDGE-SAFE `authConfig`
//     only (no Prisma, no providers), so it decodes the signed session cookie on every
//     matched request; the `authorized` callback redirects an unauthenticated hit to "/".
//   • /admin/*   — the ADMIN session (a separate HMAC-signed cookie; admins aren't
//     patients). Verified inline here via `verifyAdminToken`; a missing/invalid/expired
//     cookie is redirected to `/admin/login`. `/admin/login` itself is left open.
//
// Because the proxy matches `/admin/*`, it also intercepts Server Action POSTs to those
// routes — so an unauthenticated direct mutation is bounced too. This is still the FAST
// line of defense, not the only one: every protected admin page + mutation also calls
// `requireAdmin()`, and every portal page calls `requirePatient()`, close to the data.
//
// Next 16 requires the proxy to be a DECLARED function export (a destructured `const`
// isn't recognised by the build analyzer), so we wrap Auth.js's `auth` runner and add
// the admin branch in an explicit `proxy` function.

import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "./auth.config";
import { ADMIN_COOKIE, verifyAdminToken } from "./lib/admin-auth";

const { auth } = NextAuth(authConfig);

// `auth(request, event)` runs the session decode + `authorized` guard and returns a
// redirect Response (or continues). Typed here to the middleware call shape.
const runAuthGuard = auth as unknown as (
  request: NextRequest,
  event: NextFetchEvent,
) => Promise<Response | undefined>;

const ADMIN_LOGIN_PATH = "/admin/login";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  // Admin gate — everything under /admin except the login page needs a valid session.
  if (pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN_PATH) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!(await verifyAdminToken(token))) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_LOGIN_PATH;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Portal gate — delegated to the Auth.js `authorized` callback.
  return runAuthGuard(request, event);
}

export const config = {
  // Guard the patient portal and the whole EMR (index + sub-routes). `/` (login) and
  // `/admin/login` are intentionally NOT guarded — they handle their own redirects.
  matcher: ["/portal/:path*", "/admin", "/admin/:path*"],
};

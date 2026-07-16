// Zealthy — admin auth helpers (the authoritative server-side check).
//
// The Proxy (proxy.ts) is the fast, optimistic gate; THESE are the authoritative checks
// run next to the data — mirroring the portal's `requirePatient()`. `requireAdmin()`
// guards every protected admin page and every admin mutation Server Action, so admin
// data can never be read or written without a verified session even if a route were
// reached without passing the proxy. Reads the cookie via next/headers, so this module
// is Node-only and must NOT be imported by the edge proxy (which uses lib/admin-auth).

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdminToken } from "./admin-auth";

/** True iff the request carries a valid, unexpired admin session cookie. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return verifyAdminToken(token);
}

/** Allow through if authenticated as admin; otherwise redirect to the admin login. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
}

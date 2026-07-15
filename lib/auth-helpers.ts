// Zealthy — portal auth helpers (the secure server-side check).
//
// The Proxy (proxy.ts) is an optimistic guard; THIS is the authoritative one. Every
// portal Server Component calls `requirePatient()` right next to its data fetch, so a
// page can never render patient data without a verified session — even if a route were
// somehow reached without passing the proxy. Per the Next.js auth guidance, security
// checks belong close to the data source, not only in middleware.

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { Session } from "next-auth";

/**
 * Resolve the current session and its `patientId`, or redirect to the login page ("/")
 * if there is no authenticated patient. Returns the id every portal read is scoped to,
 * plus the session (for the greeting/basic info) so callers avoid a second `auth()` call.
 */
export async function requirePatient(): Promise<{
  patientId: string;
  session: Session;
}> {
  const session = await auth();
  if (!session?.patientId) redirect("/");
  return { patientId: session.patientId, session };
}

// Zealthy — Auth.js (NextAuth v5) type augmentation.
//
// Adds our one custom claim, `patientId`, to the session and JWT shapes so the portal
// can key every read by `session.patientId` with full type-safety (no `as` casts).
// The default `session.user` still carries name/email; `patientId` is promoted to the
// top level of the Session because it's the primary key the portal services expect.

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    /** The signed-in patient's id — the key every portal query is scoped to. */
    patientId: string;
    user: DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** Mirrors {@link Session.patientId}; set in the `jwt` callback at sign-in. */
    patientId?: string;
  }
}

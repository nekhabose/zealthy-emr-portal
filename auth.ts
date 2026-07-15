// Zealthy — Auth.js (NextAuth v5) full config for the Node runtime.
//
// Extends the edge-safe `authConfig` (callbacks + guard) with the Credentials provider
// that actually verifies a patient against the database. This module imports Prisma, so
// it must never be pulled into the Proxy bundle — only route handlers, Server Components,
// and Server Actions import from here.
//
// PLAINTEXT PASSWORDS BY DESIGN: the brief requires admin-settable patient passwords to
// ease portal testing, so we store and COMPARE them in plaintext (no bcrypt). This is a
// deliberate, non-production choice, isolated to this one compare and documented in the
// README. Swapping in a hash here (hash on create in the admin action + `bcrypt.compare`
// here) is the single change that would productionise it.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "./lib/prisma";
import { credentialsSchema } from "./lib/validation";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      // We render our own login form, so these are only used by NextAuth's default page
      // (unused here) — the real validation is the Zod parse + DB lookup below.
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        // Never trust the client: re-validate shape server-side before touching the DB.
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const patient = await prisma.patient.findUnique({ where: { email } });
        // Return null on any failure (unknown email OR wrong password) — the login form
        // shows a single generic "invalid credentials" message, never revealing which.
        if (!patient || patient.password !== password) return null;

        // The returned object seeds the JWT (`user` in the jwt callback). Only non-secret
        // identity fields — never the password.
        return { id: patient.id, name: patient.name, email: patient.email };
      },
    }),
  ],
});

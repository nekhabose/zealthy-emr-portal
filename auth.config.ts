// Zealthy — Auth.js (NextAuth v5) EDGE-SAFE base config.
//
// This half of the split-config pattern carries everything the Proxy (middleware) needs
// to VERIFY a session — the JWT/session callbacks and the `authorized` route guard — but
// deliberately imports NO database code and declares NO providers. That keeps it safe to
// bundle into `proxy.ts`, which only decodes the signed cookie (it never runs `authorize`).
// The Credentials provider + Prisma lookup live in `auth.ts`, which extends this config for
// the Node runtime (route handlers, Server Components, Server Actions).
//
// Why split at all: verifying a session (decode JWT with AUTH_SECRET) is lightweight and
// runs on every guarded request; signing IN (DB lookup) runs once. Isolating the DB import
// keeps the proxy bundle small and free of Node-only deps.

import type { NextAuthConfig } from "next-auth";

/** Where the portal login form lives — NextAuth redirects here when a guard fails. */
const SIGN_IN_PATH = "/";

export const authConfig = {
  // Stateless JWT sessions: the patient id rides in a signed cookie, so no session table
  // is needed and the Proxy can authorize by decoding the cookie alone.
  session: { strategy: "jwt" },
  pages: { signIn: SIGN_IN_PATH },
  callbacks: {
    // Runs whenever a token is minted/refreshed. At sign-in the `user` returned by
    // `authorize` (see auth.ts) is present; we copy its id onto the token as `patientId`
    // so it persists in the cookie for every later request.
    jwt({ token, user }) {
      if (user?.id) token.patientId = user.id;
      return token;
    },
    // Shapes the Session object read by `auth()` and the Proxy. Promotes `patientId` from
    // the token to the top level so portal services can scope reads to `session.patientId`.
    session({ session, token }) {
      // `typeof` guard narrows regardless of how the JWT augmentation resolves.
      if (typeof token.patientId === "string") {
        session.patientId = token.patientId;
      }
      return session;
    },
    // The Proxy route guard. Invoked by the `auth` middleware wrapper for matched routes
    // (see proxy.ts). `/portal/*` requires a session; returning false redirects to the
    // sign-in page. Everything else is public (the login page handles its own redirect).
    authorized({ request, auth }) {
      const isPortal = request.nextUrl.pathname.startsWith("/portal");
      if (isPortal) return Boolean(auth?.patientId);
      return true;
    },
  },
  // Providers are attached in auth.ts (Node runtime) — none here, on purpose.
  providers: [],
} satisfies NextAuthConfig;

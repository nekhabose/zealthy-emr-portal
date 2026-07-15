// Zealthy — Auth.js catch-all route handler.
//
// Exposes NextAuth's GET/POST endpoints (CSRF token, session, sign-in/out callbacks) at
// /api/auth/*. `signIn('credentials')` from our Server Action posts through here. The
// handlers come straight from the Node-runtime config in auth.ts.

import { handlers } from "@/auth";

export const { GET, POST } = handlers;

// Zealthy — admin (mini-EMR) session primitives. EDGE-SAFE.
//
// The `/admin` surface is gated by a lightweight, self-contained session that is
// deliberately SEPARATE from the Auth.js patient session: an admin is a different actor
// (an operator) with no Patient row, so mixing it into the patient JWT would be wrong.
// Instead we mint a small HMAC-signed, expiring token and keep it in an httpOnly cookie.
//
// Everything here uses only Web Crypto + global encoders (no Node-only APIs, no Prisma,
// no next/headers), so it bundles cleanly into the edge Proxy (proxy.ts), which verifies
// the cookie on every `/admin/*` request. Cookie READ/WRITE (which needs next/headers)
// lives in the Node-only `lib/admin-helpers.ts` and the admin auth Server Actions.

/** Name of the httpOnly cookie carrying the signed admin session token. */
export const ADMIN_COOKIE = "zealthy_admin";

/** Admin session lifetime — 7 days, in seconds (matches the cookie `maxAge`). */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

/** The signed payload prefix — bumping this invalidates every existing token. */
const PAYLOAD_PREFIX = "admin";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — cannot sign admin sessions.");
  return secret;
}

/** base64url (no padding) encode raw bytes — `btoa` is a global in edge + Node. */
function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** HMAC-SHA256 of `message` under the app secret, as a base64url string. */
async function hmac(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64url(new Uint8Array(signature));
}

/** Length-independent, constant-time string comparison (avoids early-exit timing leaks). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Mint a signed admin session token: `"<expiresAt>.<hmac(admin:<expiresAt>)>"`.
 * `now` is injectable so the sign/verify roundtrip and expiry are unit-testable.
 */
export async function signAdminToken(now: number = Date.now()): Promise<string> {
  const expiresAt = now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const signature = await hmac(`${PAYLOAD_PREFIX}:${expiresAt}`);
  return `${expiresAt}.${signature}`;
}

/**
 * Verify a token's signature and that it has not expired. Returns false for anything
 * missing/malformed/tampered/expired — never throws on bad input.
 */
export async function verifyAdminToken(
  token: string | undefined | null,
  now: number = Date.now(),
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;

  const expiresAtRaw = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) return false;

  const expected = await hmac(`${PAYLOAD_PREFIX}:${expiresAt}`);
  return timingSafeEqual(signature, expected);
}

/**
 * Constant-time check of a submitted password against `ADMIN_PASSWORD`. Both sides are
 * HMAC'd first, so the comparison is fixed-length (no password-length timing leak) and
 * fails closed when `ADMIN_PASSWORD` is unset.
 */
export async function checkAdminPassword(password: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const [a, b] = await Promise.all([hmac(password), hmac(expected)]);
  return timingSafeEqual(a, b);
}

// Unit tests for the admin session primitives (lib/admin-auth) — pure crypto, no DB.
//
// Covers the sign/verify roundtrip, tamper + expiry rejection, and the constant-time
// password check. AUTH_SECRET / ADMIN_PASSWORD are set here (the module reads them at
// call time, not import time), so the suite is self-contained and CI-safe.

import { beforeAll, describe, expect, it } from "vitest";

const FIXED_NOW = Date.UTC(2026, 6, 15, 12, 0, 0); // 2026-07-15T12:00:00Z
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

let signAdminToken: typeof import("../lib/admin-auth").signAdminToken;
let verifyAdminToken: typeof import("../lib/admin-auth").verifyAdminToken;
let checkAdminPassword: typeof import("../lib/admin-auth").checkAdminPassword;

beforeAll(async () => {
  process.env.AUTH_SECRET = "test-secret-for-admin-auth";
  process.env.ADMIN_PASSWORD = "correct horse battery staple";
  const mod = await import("../lib/admin-auth");
  signAdminToken = mod.signAdminToken;
  verifyAdminToken = mod.verifyAdminToken;
  checkAdminPassword = mod.checkAdminPassword;
});

describe("admin token sign/verify", () => {
  it("verifies a freshly signed token", async () => {
    const token = await signAdminToken(FIXED_NOW);
    expect(await verifyAdminToken(token, FIXED_NOW)).toBe(true);
  });

  it("rejects a missing/empty/malformed token", async () => {
    expect(await verifyAdminToken(undefined, FIXED_NOW)).toBe(false);
    expect(await verifyAdminToken(null, FIXED_NOW)).toBe(false);
    expect(await verifyAdminToken("", FIXED_NOW)).toBe(false);
    expect(await verifyAdminToken("not-a-token", FIXED_NOW)).toBe(false);
    expect(await verifyAdminToken(".abc", FIXED_NOW)).toBe(false);
  });

  it("rejects a tampered signature", async () => {
    const token = await signAdminToken(FIXED_NOW);
    const [exp, sig] = token.split(".");
    const flipped = sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A");
    expect(await verifyAdminToken(`${exp}.${flipped}`, FIXED_NOW)).toBe(false);
  });

  it("rejects a tampered expiry (extending the deadline breaks the signature)", async () => {
    const token = await signAdminToken(FIXED_NOW);
    const sig = token.split(".")[1];
    const forged = `${FIXED_NOW + 10 * WEEK_MS}.${sig}`;
    expect(await verifyAdminToken(forged, FIXED_NOW)).toBe(false);
  });

  it("rejects an expired token", async () => {
    const token = await signAdminToken(FIXED_NOW);
    // One millisecond past the 7-day lifetime.
    expect(await verifyAdminToken(token, FIXED_NOW + WEEK_MS + 1)).toBe(false);
    // Still valid the moment before expiry.
    expect(await verifyAdminToken(token, FIXED_NOW + WEEK_MS - 1)).toBe(true);
  });
});

describe("admin password check", () => {
  it("accepts the configured password and rejects others", async () => {
    expect(await checkAdminPassword("correct horse battery staple")).toBe(true);
    expect(await checkAdminPassword("wrong")).toBe(false);
    expect(await checkAdminPassword("")).toBe(false);
    expect(await checkAdminPassword("Correct Horse Battery Staple")).toBe(false);
  });
});

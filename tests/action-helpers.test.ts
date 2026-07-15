// Zealthy — Server Action helper unit tests (Phase 3, DB-free).
//
// The synchronous glue the admin actions share: Zod-error flattening, the
// FormState constructors, and the Prisma unique-violation detector.

import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  fieldErrors,
  invalid,
  isUniqueConstraintError,
  ok,
} from "../lib/action-helpers";

describe("fieldErrors", () => {
  it("maps each field issue to its field with messages", () => {
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      email: z.email("Bad email"),
    });
    const result = schema.safeParse({ name: "", email: "nope" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const errors = fieldErrors(result.error);
    expect(errors.name).toContain("Name is required");
    expect(errors.email).toContain("Bad email");
  });

  it("buckets a top-level refine (empty path) under _form", () => {
    // Fields must be individually valid so Zod actually runs the refinement.
    const schema = z
      .object({ a: z.string(), b: z.string() })
      .refine((v) => v.a !== v.b, { message: "Cross-field" });
    const result = schema.safeParse({ a: "same", b: "same" });
    expect(result.success).toBe(false);
    if (result.success) return;

    expect(fieldErrors(result.error)._form).toContain("Cross-field");
  });
});

describe("FormState constructors", () => {
  it("invalid() is a failed state carrying the errors", () => {
    expect(invalid({ email: ["taken"] })).toEqual({
      ok: false,
      errors: { email: ["taken"] },
    });
  });
  it("ok() is a success state with an optional message", () => {
    expect(ok()).toEqual({ ok: true, message: undefined });
    expect(ok("Saved")).toEqual({ ok: true, message: "Saved" });
  });
});

describe("isUniqueConstraintError", () => {
  it("is true for a Prisma P2002 error", () => {
    const e = new Prisma.PrismaClientKnownRequestError("Unique failed", {
      code: "P2002",
      clientVersion: "test",
    });
    expect(isUniqueConstraintError(e)).toBe(true);
  });
  it("is false for other Prisma errors and plain errors", () => {
    const other = new Prisma.PrismaClientKnownRequestError("Not found", {
      code: "P2025",
      clientVersion: "test",
    });
    expect(isUniqueConstraintError(other)).toBe(false);
    expect(isUniqueConstraintError(new Error("boom"))).toBe(false);
    expect(isUniqueConstraintError(null)).toBe(false);
  });
});

// Zealthy — Server Action helpers.
//
// Small pure utilities the admin Server Actions share. Kept OUT of the `"use server"`
// actions file on purpose: that file may only export async server functions, so these
// synchronous helpers (and any non-function export) live here and are imported in.

import { Prisma } from "@prisma/client";
import type { z } from "zod";
import type { FormState } from "./types";

/**
 * Flatten a `ZodError` into a `field → messages` map for {@link FormState.errors}.
 * Issues with an empty path (form-level refinements) bucket under `_form`. Built by
 * hand from `error.issues` so it's stable across Zod minor-version API shifts.
 */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_form";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

/** A failed-validation {@link FormState} from a field-errors map. */
export function invalid(errors: Record<string, string[]>): FormState {
  return { ok: false, errors };
}

/** A successful {@link FormState}, optionally with a notice. */
export function ok(message?: string): FormState {
  return { ok: true, message };
}

/**
 * True when `e` is Prisma's unique-constraint violation (P2002) — used to turn a
 * duplicate-email insert into an inline field error instead of an unhandled 500.
 */
export function isUniqueConstraintError(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

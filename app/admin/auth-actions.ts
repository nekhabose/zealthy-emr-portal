"use server";

// Zealthy — admin (mini-EMR) auth Server Actions.
//
// `adminLoginAction` backs the /admin/login form (via `useActionState`); on the right
// password it sets the signed, httpOnly session cookie and redirects into the EMR.
// `adminLogoutAction` backs the header sign-out button. Both live here (a `"use server"`
// module) because setting/clearing cookies needs next/headers at the request edge.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkAdminPassword,
  signAdminToken,
} from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/validation";
import { fieldErrors, invalid } from "@/lib/action-helpers";
import type { FormState } from "@/lib/types";

/**
 * Verify the admin password and open an admin session. On success we set the cookie and
 * `redirect` into `/admin` (redirect throws, so nothing after it runs); a wrong password
 * returns a single generic form error — never confirming whether the password exists.
 */
export async function adminLoginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = adminLoginSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return invalid(fieldErrors(parsed.error));

  if (!(await checkAdminPassword(parsed.data.password))) {
    return { ok: false, errors: { _form: ["Incorrect admin password."] } };
  }

  (await cookies()).set(ADMIN_COOKIE, await signAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin");
}

/** Clear the admin session and return to the admin login page. */
export async function adminLogoutAction(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
  redirect("/admin/login");
}

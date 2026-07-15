"use server";

// Zealthy — patient portal auth Server Actions.
//
// `loginAction` backs the login form (via `useActionState`); `signOutAction` backs the
// header sign-out button. Both re-validate on the server and return the shared
// `FormState` shape so the login form can show inline field + form errors, exactly like
// the admin forms.

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { credentialsSchema } from "@/lib/validation";
import { fieldErrors } from "@/lib/action-helpers";
import type { FormState } from "@/lib/types";

/**
 * Verify credentials and open a session. On success, `signIn` throws a redirect to
 * `/portal` (rethrown here so Next handles it); on bad credentials we return a single
 * generic form error — never revealing whether the email or the password was wrong.
 */
export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/portal",
    });
  } catch (error) {
    // A failed `authorize` surfaces as an AuthError (CredentialsSignin); anything else —
    // notably the NEXT_REDIRECT thrown on SUCCESS — must be rethrown so Next can act on it.
    if (error instanceof AuthError) {
      return {
        ok: false,
        errors: { _form: ["Invalid email or password."] },
      };
    }
    throw error;
  }

  // Unreachable in practice: a successful signIn redirects before returning.
  return { ok: true };
}

/** Clear the session and return to the login page. */
export async function signOutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

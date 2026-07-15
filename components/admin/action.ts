// Zealthy — the client-side shape of a bound admin Server Action.
//
// The Phase-3 actions have signature `(id?, prevState, formData) => FormState`; the
// Server Components bind any leading id with `.bind(null, id)` and hand the forms
// this `(prevState, formData)` remainder — exactly what React's `useActionState`
// expects. Type-only, so it costs nothing in the client bundle.

import type { FormState } from "@/lib/types";

export type BoundAction = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

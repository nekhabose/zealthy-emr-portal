// Zealthy — new patient form page.
//
// The create action is passed straight to the client form (its `(prev, formData)`
// signature already matches `useActionState`); on success it revalidates /admin and
// redirects to the new patient's record.

import Link from "next/link";
import { requireAdmin } from "@/lib/admin-helpers";
import { createPatientAction } from "@/app/admin/actions";
import { PatientForm } from "@/components/admin/PatientForm";
import { cardClass } from "@/components/ui/controls";
import { PageTransition } from "@/components/ui/motion";

// Reads the admin cookie, so it must render fresh (not statically prerendered).
export const dynamic = "force-dynamic";

export default async function NewPatientPage() {
  await requireAdmin();
  return (
    <PageTransition className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
        >
          ← Back to patients
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          New patient
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Create a patient record and portal login.
        </p>
      </div>

      <div className={cardClass}>
        <PatientForm
          action={createPatientAction}
          mode="create"
          submitLabel="Create patient"
        />
      </div>
    </PageTransition>
  );
}

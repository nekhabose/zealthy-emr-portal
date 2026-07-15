// Zealthy — new patient form page.
//
// The create action is passed straight to the client form (its `(prev, formData)`
// signature already matches `useActionState`); on success it revalidates /admin and
// redirects to the new patient's record.

import Link from "next/link";
import { createPatientAction } from "@/app/admin/actions";
import { PatientForm } from "@/components/admin/PatientForm";
import { cardClass } from "@/components/ui/controls";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-emerald-800 hover:underline">
          ← Back to patients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New patient</h1>
        <p className="mt-1 text-sm text-zinc-500">
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
    </div>
  );
}

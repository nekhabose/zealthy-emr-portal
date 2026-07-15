// Zealthy — patient record (mini-EMR drill-down).
//
// Server Component. Loads the patient's raw (unexpanded) appointment + prescription
// anchors and the seeded reference lists, then renders three sections:
//   1. editable basic info (name / email / password),
//   2. Appointments — list + add + inline edit/delete/end-recurring,
//   3. Prescriptions — list + add + inline edit/delete/end-refills.
//
// All Dates are formatted to strings HERE (server) — both the human display and the
// <input> default values — so only strings cross into the client rows/forms and there
// is no timezone-driven hydration mismatch. Every mutating control is a bound Server
// Action (`action.bind(null, id)`); the actions revalidate /admin so this page and the
// table refetch after a write.

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPatientDetail } from "@/lib/services/patients";
import { listDosages, listMedications } from "@/lib/services/reference";
import {
  createAppointmentAction,
  createPrescriptionAction,
  deleteAppointmentAction,
  deletePrescriptionAction,
  endAppointmentRecurrenceAction,
  endPrescriptionRecurrenceAction,
  updateAppointmentAction,
  updatePatientAction,
  updatePrescriptionAction,
} from "@/app/admin/actions";
import {
  formatDate,
  formatDateTime,
  toDateInputValue,
  toDateTimeLocalValue,
} from "@/lib/format";
import { cadenceLabel } from "@/components/admin/cadence";
import { PatientForm } from "@/components/admin/PatientForm";
import { AppointmentForm } from "@/components/admin/AppointmentForm";
import { PrescriptionForm } from "@/components/admin/PrescriptionForm";
import { AppointmentRow } from "@/components/admin/AppointmentRow";
import { PrescriptionRow } from "@/components/admin/PrescriptionRow";
import { Disclosure } from "@/components/admin/Disclosure";
import { cardClass } from "@/components/ui/controls";
import { PageTransition, Reveal } from "@/components/ui/motion";

export const dynamic = "force-dynamic";

export default async function PatientRecordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, medications, dosages] = await Promise.all([
    getPatientDetail(id),
    listMedications(),
    listDosages(),
  ]);
  if (!detail) notFound();

  const { patient, appointments, prescriptions } = detail;

  return (
    <PageTransition className="space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
        >
          ← Back to patients
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {patient.name}
        </h1>
        <p className="mt-1 text-[15px] text-muted">{patient.email}</p>
      </div>

      {/* 1. Basic info -------------------------------------------------------- */}
      <Reveal>
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight text-ink">Basic info</h2>
          <div className={cardClass}>
            <PatientForm
              action={updatePatientAction.bind(null, patient.id)}
              mode="edit"
              defaults={{ name: patient.name, email: patient.email }}
              submitLabel="Save changes"
            />
          </div>
        </section>
      </Reveal>

      {/* 2. Appointments ------------------------------------------------------ */}
      <Reveal>
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Appointments{" "}
            <span className="text-sm font-medium text-muted">
              ({appointments.length})
            </span>
          </h2>

          <div className={`${cardClass} space-y-4`}>
          <Disclosure label="Add appointment">
            <AppointmentForm
              action={createAppointmentAction.bind(null, patient.id)}
              mode="create"
            />
          </Disclosure>

          {appointments.length === 0 ? (
            <p className="text-sm text-muted">No appointments yet.</p>
          ) : (
            <ul className="space-y-3">
              {appointments.map((a) => (
                <AppointmentRow
                  key={a.id}
                  display={{
                    provider: a.provider,
                    datetime: formatDateTime(a.datetime),
                    cadenceLabel: cadenceLabel(a.repeat),
                    isRecurring: a.repeat !== "NONE",
                    endsAt: a.endsAt ? formatDate(a.endsAt) : null,
                  }}
                  defaults={{
                    provider: a.provider,
                    datetime: toDateTimeLocalValue(a.datetime),
                    repeat: a.repeat,
                    endsAt: a.endsAt ? toDateInputValue(a.endsAt) : "",
                  }}
                  canEndRecurrence={a.repeat !== "NONE" && a.endsAt === null}
                  updateAction={updateAppointmentAction.bind(null, a.id)}
                  deleteAction={deleteAppointmentAction.bind(null, a.id)}
                  endAction={endAppointmentRecurrenceAction.bind(null, a.id)}
                />
              ))}
            </ul>
          )}
          </div>
        </section>
      </Reveal>

      {/* 3. Prescriptions ----------------------------------------------------- */}
      <Reveal>
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Prescriptions{" "}
            <span className="text-sm font-medium text-muted">
              ({prescriptions.length})
            </span>
          </h2>

          <div className={`${cardClass} space-y-4`}>
          <Disclosure label="Add prescription">
            <PrescriptionForm
              action={createPrescriptionAction.bind(null, patient.id)}
              mode="create"
              medications={medications}
              dosages={dosages}
            />
          </Disclosure>

          {prescriptions.length === 0 ? (
            <p className="text-sm text-muted">No prescriptions yet.</p>
          ) : (
            <ul className="space-y-3">
              {prescriptions.map((p) => (
                <PrescriptionRow
                  key={p.id}
                  display={{
                    medication: p.medication,
                    dosage: p.dosage,
                    quantity: p.quantity,
                    refillOn: formatDate(p.refillOn),
                    cadenceLabel: cadenceLabel(p.refillSchedule),
                    isRecurring: p.refillSchedule !== "NONE",
                    endsAt: p.endsAt ? formatDate(p.endsAt) : null,
                  }}
                  defaults={{
                    medication: p.medication,
                    dosage: p.dosage,
                    quantity: p.quantity,
                    refillOn: toDateInputValue(p.refillOn),
                    refillSchedule: p.refillSchedule,
                    endsAt: p.endsAt ? toDateInputValue(p.endsAt) : "",
                  }}
                  medications={medications}
                  dosages={dosages}
                  canEndRecurrence={
                    p.refillSchedule !== "NONE" && p.endsAt === null
                  }
                  updateAction={updatePrescriptionAction.bind(null, p.id)}
                  deleteAction={deletePrescriptionAction.bind(null, p.id)}
                  endAction={endPrescriptionRecurrenceAction.bind(null, p.id)}
                />
              ))}
            </ul>
          )}
          </div>
        </section>
      </Reveal>
    </PageTransition>
  );
}

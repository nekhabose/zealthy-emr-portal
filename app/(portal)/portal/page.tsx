// Zealthy — patient portal dashboard (/portal).
//
// The brief's "main page summary": basic info + appointments in the next 7 days +
// refills in the next 7 days, with links into the full 3-month drill-downs. Reads
// `getPatientSummary(patientId, now)` — scoped to the SIGNED-IN patient's id, so a
// patient can only ever see their own data. `now` is read at this request edge and
// passed into the (otherwise deterministic) service.

import Link from "next/link";
import { requirePatient } from "@/lib/auth-helpers";
import { getPatientSummary } from "@/lib/services/portal";
import { formatDate, formatDateTime } from "@/lib/format";
import { cadenceLabel } from "@/components/admin/cadence";
import { cardClass } from "@/components/ui/controls";
import {
  AppointmentItem,
  EmptyRow,
  RefillItem,
} from "@/components/portal/schedule";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { patientId } = await requirePatient();
  const summary = await getPatientSummary(patientId, new Date());
  // requirePatient guarantees a valid session, but the row could vanish (deleted in the
  // EMR mid-session); treat that the same as "signed out".
  if (!summary) {
    return (
      <p className="text-sm text-zinc-500">
        We couldn&apos;t load your account. Please sign in again.
      </p>
    );
  }

  const { patient, upcomingAppointments, upcomingRefills } = summary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {patient.name.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Here&apos;s what&apos;s coming up in the next 7 days.
        </p>
      </div>

      {/* Basic info ----------------------------------------------------------- */}
      <section className={cardClass}>
        <h2 className="text-sm font-semibold text-zinc-700">Your details</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Name</dt>
            <dd className="text-zinc-900">{patient.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-zinc-400">Email</dt>
            <dd className="text-zinc-900">{patient.email}</dd>
          </div>
        </dl>
      </section>

      {/* Next 7 days: appointments -------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Appointments · next 7 days
          </h2>
          <Link
            href="/portal/appointments"
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className={cardClass}>
          {upcomingAppointments.length === 0 ? (
            <EmptyRow>No appointments in the next 7 days.</EmptyRow>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcomingAppointments.map((a) => (
                <AppointmentItem
                  key={`${a.sourceId}-${a.date.toISOString()}`}
                  when={formatDateTime(a.date)}
                  provider={a.provider}
                  cadenceLabel={cadenceLabel(a.cadence)}
                  isRecurring={a.isRecurring}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Next 7 days: refills ------------------------------------------------- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Refills · next 7 days
          </h2>
          <Link
            href="/portal/prescriptions"
            className="text-sm font-medium text-emerald-800 hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className={cardClass}>
          {upcomingRefills.length === 0 ? (
            <EmptyRow>No refills due in the next 7 days.</EmptyRow>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {upcomingRefills.map((r) => (
                <RefillItem
                  key={`${r.sourceId}-${r.date.toISOString()}`}
                  when={formatDate(r.date)}
                  medication={r.medication}
                  dosage={r.dosage}
                  quantity={r.quantity}
                  cadenceLabel={cadenceLabel(r.cadence)}
                  isRecurring={r.isRecurring}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

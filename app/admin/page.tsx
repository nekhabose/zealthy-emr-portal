// Zealthy — mini-EMR home: the patients table with at-a-glance data.
//
// Server Component. Reads the whole patient list with the rollups the brief asks for
// (# upcoming appointments, next appointment, # active prescriptions) via
// `listPatientsWithCounts(now)`, formats dates on the server, and links each row into
// the patient record. `new Date()` is read here at the request edge and passed into
// the (otherwise deterministic) service.

import Link from "next/link";
import { listPatientsWithCounts } from "@/lib/services/patients";
import { formatDateTime } from "@/lib/format";
import { cadenceLabel } from "@/components/admin/cadence";
import { Chip, PageHeader, btnPrimary } from "@/components/ui/controls";
import { PageTransition, Reveal } from "@/components/ui/motion";

// Always render fresh: this is an internal tool over mutable data, not a cacheable page.
export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  const patients = await listPatientsWithCounts(new Date());

  return (
    <PageTransition className="space-y-8">
      <PageHeader
        eyebrow="Mini-EMR"
        title="Patients"
        subtitle={`${patients.length} ${
          patients.length === 1 ? "patient" : "patients"
        } · appointments & prescriptions at a glance`}
        action={
          <Link href="/admin/patients/new" className={btnPrimary}>
            + New patient
          </Link>
        }
      />

      {patients.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-white p-14 text-center shadow-soft">
          <p className="text-sm text-muted">
            No patients yet. Create the first one to get started.
          </p>
          <Link href="/admin/patients/new" className={`${btnPrimary} mt-5`}>
            + New patient
          </Link>
        </div>
      ) : (
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-soft">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-hairline text-sm">
                <thead className="bg-cream text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3.5">Patient</th>
                    <th className="px-5 py-3.5">Upcoming</th>
                    <th className="px-5 py-3.5">Next appointment</th>
                    <th className="px-5 py-3.5">Active Rx</th>
                    <th className="px-5 py-3.5 text-right">&nbsp;</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {patients.map((p) => (
                    <tr
                      key={p.id}
                      className="transition-colors hover:bg-mint/30"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="font-semibold text-brand underline-offset-2 hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted">{p.email}</div>
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink">
                        {p.upcomingAppointmentCount}
                      </td>
                      <td className="px-5 py-4">
                        {p.nextAppointment ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-ink">
                              {formatDateTime(p.nextAppointment.date)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-muted">
                              {p.nextAppointment.provider}
                              {p.nextAppointment.isRecurring ? (
                                <Chip>
                                  {cadenceLabel(p.nextAppointment.cadence)}
                                </Chip>
                              ) : null}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted/60">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 tabular-nums text-ink">
                        {p.activePrescriptionCount}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/patients/${p.id}`}
                          className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
                        >
                          Open →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </PageTransition>
  );
}

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
import { Chip, btnPrimary } from "@/components/ui/controls";

// Always render fresh: this is an internal tool over mutable data, not a cacheable page.
export const dynamic = "force-dynamic";

export default async function AdminPatientsPage() {
  const patients = await listPatientsWithCounts(new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {patients.length} {patients.length === 1 ? "patient" : "patients"} · appointments &amp; prescriptions at a glance
          </p>
        </div>
        <Link href="/admin/patients/new" className={btnPrimary}>
          + New patient
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-12 text-center">
          <p className="text-sm text-zinc-500">
            No patients yet. Create the first one to get started.
          </p>
          <Link href="/admin/patients/new" className={`${btnPrimary} mt-4`}>
            + New patient
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-zinc-200 text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Upcoming</th>
                <th className="px-4 py-3">Next appointment</th>
                <th className="px-4 py-3">Active Rx</th>
                <th className="px-4 py-3 text-right">&nbsp;</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/patients/${p.id}`}
                      className="font-medium text-emerald-800 hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{p.email}</div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">
                    {p.upcomingAppointmentCount}
                  </td>
                  <td className="px-4 py-3">
                    {p.nextAppointment ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-zinc-700">
                          {formatDateTime(p.nextAppointment.date)}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                          {p.nextAppointment.provider}
                          {p.nextAppointment.isRecurring ? (
                            <Chip>{cadenceLabel(p.nextAppointment.cadence)}</Chip>
                          ) : null}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700">
                    {p.activePrescriptionCount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/patients/${p.id}`}
                      className="text-sm font-medium text-emerald-800 hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

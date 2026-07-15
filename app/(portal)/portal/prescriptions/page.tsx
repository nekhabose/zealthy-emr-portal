// Zealthy — portal prescriptions drill-down (/portal/prescriptions).
//
// The brief's "all prescriptions with upcoming refill dates": every expanded refill
// occurrence across the next 3 months. Reads `getPatientSchedule(patientId, now)`,
// scoped to the signed-in patient; occurrences arrive sorted ascending from the mapper.

import Link from "next/link";
import { requirePatient } from "@/lib/auth-helpers";
import { getPatientSchedule } from "@/lib/services/portal";
import { formatDate } from "@/lib/format";
import { cadenceLabel } from "@/components/admin/cadence";
import { cardClass } from "@/components/ui/controls";
import { EmptyRow, RefillItem } from "@/components/portal/schedule";

export const dynamic = "force-dynamic";

export default async function PortalPrescriptionsPage() {
  const { patientId } = await requirePatient();
  const schedule = await getPatientSchedule(patientId, new Date());
  if (!schedule) {
    return (
      <p className="text-sm text-zinc-500">
        We couldn&apos;t load your prescriptions. Please sign in again.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-sm text-emerald-800 hover:underline">
          ← Back to overview
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Prescriptions &amp; refills
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every upcoming refill for the next 3 months.
        </p>
      </div>

      <div className={cardClass}>
        {schedule.refills.length === 0 ? (
          <EmptyRow>No refills due in the next 3 months.</EmptyRow>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {schedule.refills.map((r) => (
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
    </div>
  );
}

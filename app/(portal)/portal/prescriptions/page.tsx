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
import { PageTransition, Reveal } from "@/components/ui/motion";
import { EmptyRow, RefillItem } from "@/components/portal/schedule";

export const dynamic = "force-dynamic";

export default async function PortalPrescriptionsPage() {
  const { patientId } = await requirePatient();
  const schedule = await getPatientSchedule(patientId, new Date());
  if (!schedule) {
    return (
      <p className="text-sm text-muted">
        We couldn&apos;t load your prescriptions. Please sign in again.
      </p>
    );
  }

  return (
    <PageTransition className="space-y-6">
      <div>
        <Link
          href="/portal"
          className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
        >
          ← Back to overview
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Prescriptions &amp; refills
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Every upcoming refill for the next 3 months.
        </p>
      </div>

      <Reveal>
        <div className={cardClass}>
          {schedule.refills.length === 0 ? (
            <EmptyRow>No refills due in the next 3 months.</EmptyRow>
          ) : (
            <ul className="divide-y divide-hairline">
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
      </Reveal>
    </PageTransition>
  );
}

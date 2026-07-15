// Zealthy — portal appointments drill-down (/portal/appointments).
//
// The brief's "full upcoming appointment schedule": every expanded occurrence across the
// next 3 months. Reads `getPatientSchedule(patientId, now)`, scoped to the signed-in
// patient. Occurrences arrive already sorted ascending from the mapper.

import Link from "next/link";
import { requirePatient } from "@/lib/auth-helpers";
import { getPatientSchedule } from "@/lib/services/portal";
import { formatDateTime } from "@/lib/format";
import { cadenceLabel } from "@/components/admin/cadence";
import { cardClass } from "@/components/ui/controls";
import { PageTransition, Reveal } from "@/components/ui/motion";
import { AppointmentItem, EmptyRow } from "@/components/portal/schedule";

export const dynamic = "force-dynamic";

export default async function PortalAppointmentsPage() {
  const { patientId } = await requirePatient();
  const schedule = await getPatientSchedule(patientId, new Date());
  if (!schedule) {
    return (
      <p className="text-sm text-muted">
        We couldn&apos;t load your schedule. Please sign in again.
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
          Upcoming appointments
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Your full schedule for the next 3 months.
        </p>
      </div>

      <Reveal>
        <div className={cardClass}>
          {schedule.appointments.length === 0 ? (
            <EmptyRow>No appointments scheduled in the next 3 months.</EmptyRow>
          ) : (
            <ul className="divide-y divide-hairline">
              {schedule.appointments.map((a) => (
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
      </Reveal>
    </PageTransition>
  );
}

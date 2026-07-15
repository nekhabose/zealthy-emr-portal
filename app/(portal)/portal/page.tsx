// Zealthy — patient portal dashboard (/portal).
//
// The brief's "main page summary": basic info + appointments in the next 7 days +
// refills in the next 7 days, with links into the full 3-month drill-downs. Reads
// `getPatientSummary(patientId, now)` — scoped to the SIGNED-IN patient's id, so a
// patient can only ever see their own data. `now` is read at this request edge and
// passed into the (otherwise deterministic) service.
//
// Phase 6: a warm, breathing dashboard — a personalized greeting, at-a-glance stat
// tiles (the most important numbers), and two large summary cards, with staggered
// entrance motion that degrades to a plain fade under reduced-motion.

import Link from "next/link";
import { requirePatient } from "@/lib/auth-helpers";
import { getPatientSummary } from "@/lib/services/portal";
import { formatDate, formatDateTime } from "@/lib/format";
import { cadenceLabel } from "@/components/admin/cadence";
import { cardClass, StatCard } from "@/components/ui/controls";
import { PageTransition, Reveal, Stagger, StaggerItem } from "@/components/ui/motion";
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
      <p className="text-sm text-muted">
        We couldn&apos;t load your account. Please sign in again.
      </p>
    );
  }

  const { patient, upcomingAppointments, upcomingRefills } = summary;

  return (
    <PageTransition className="space-y-8 sm:space-y-10">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          Overview
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Welcome back, {patient.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          Here&apos;s what&apos;s coming up in the next 7 days.
        </p>
      </Reveal>

      {/* At-a-glance tiles ---------------------------------------------------- */}
      <Stagger className="grid gap-4 sm:grid-cols-3">
        <StaggerItem>
          <StatCard
            label="Appointments"
            value={upcomingAppointments.length}
            hint="in the next 7 days"
            tone="mint"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Refills due"
            value={upcomingRefills.length}
            hint="in the next 7 days"
            tone="peach"
          />
        </StaggerItem>
        <StaggerItem>
          <div className="h-full rounded-3xl border border-hairline bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-ink/70">Your details</p>
            <p className="mt-2 text-lg font-bold text-ink">{patient.name}</p>
            <p className="truncate text-sm text-muted">{patient.email}</p>
          </div>
        </StaggerItem>
      </Stagger>

      {/* Next 7 days: appointments -------------------------------------------- */}
      <Reveal>
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Appointments · next 7 days
            </h2>
            <Link
              href="/portal/appointments"
              className="shrink-0 text-sm font-semibold text-brand underline-offset-2 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-2">
            {upcomingAppointments.length === 0 ? (
              <EmptyRow>No appointments in the next 7 days.</EmptyRow>
            ) : (
              <ul className="divide-y divide-hairline">
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
      </Reveal>

      {/* Next 7 days: refills ------------------------------------------------- */}
      <Reveal>
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold tracking-tight text-ink">
              Refills · next 7 days
            </h2>
            <Link
              href="/portal/prescriptions"
              className="shrink-0 text-sm font-semibold text-brand underline-offset-2 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-2">
            {upcomingRefills.length === 0 ? (
              <EmptyRow>No refills due in the next 7 days.</EmptyRow>
            ) : (
              <ul className="divide-y divide-hairline">
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
      </Reveal>
    </PageTransition>
  );
}

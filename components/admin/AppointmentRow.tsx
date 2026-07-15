"use client";

// Zealthy — one appointment in the patient record: read view ⇄ inline editor.
//
// All display strings and the edit-form defaults are pre-formatted on the server and
// passed in as plain strings (no Date crosses the boundary), so there is no
// client/server timezone divergence. Local state only toggles the inline editor.
// Edit / delete / end-recurrence each run their own bound Server Action.

import { useState } from "react";
import { Chip, btnDanger, btnGhost, btnSecondary } from "@/components/ui/controls";
import { AppointmentForm, type AppointmentDefaults } from "./AppointmentForm";
import { ConfirmForm } from "./ConfirmForm";
import type { BoundAction } from "./action";

export interface AppointmentDisplay {
  provider: string;
  datetime: string;
  cadenceLabel: string;
  isRecurring: boolean;
  /** Formatted end date, or null if open-ended / one-off. */
  endsAt: string | null;
}

export function AppointmentRow({
  display,
  defaults,
  canEndRecurrence,
  updateAction,
  deleteAction,
  endAction,
}: {
  display: AppointmentDisplay;
  defaults: AppointmentDefaults;
  canEndRecurrence: boolean;
  updateAction: BoundAction;
  deleteAction: BoundAction;
  endAction: BoundAction;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-2xl border border-brand/30 bg-mint/30 p-4">
        <AppointmentForm
          action={updateAction}
          mode="edit"
          defaults={defaults}
          onDone={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-hairline p-4 transition-colors hover:border-brand/30 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ink">{display.provider}</span>
          {display.isRecurring ? <Chip>{display.cadenceLabel}</Chip> : null}
        </div>
        <p className="text-sm text-muted">{display.datetime}</p>
        {display.endsAt ? (
          <p className="text-xs text-muted">Ends {display.endsAt}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={btnSecondary}
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        {canEndRecurrence ? (
          <ConfirmForm
            action={endAction}
            className={btnGhost}
            confirmText="End this recurring appointment as of now? Future occurrences will stop."
            pendingLabel="Ending…"
          >
            End recurring
          </ConfirmForm>
        ) : null}
        <ConfirmForm
          action={deleteAction}
          className={btnDanger}
          confirmText="Delete this appointment? This cannot be undone."
          pendingLabel="Deleting…"
        >
          Delete
        </ConfirmForm>
      </div>
    </li>
  );
}

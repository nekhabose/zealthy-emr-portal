"use client";

// Zealthy — one prescription in the patient record: read view ⇄ inline editor.
//
// Mirror of AppointmentRow for the prescription slice. Display strings + edit-form
// defaults are pre-formatted on the server; the medication/dosage option lists are
// passed through to the inline editor so an edit re-selects from the reference tables.

import { useState } from "react";
import { Chip, btnDanger, btnGhost, btnSecondary } from "@/components/ui/controls";
import { PrescriptionForm, type PrescriptionDefaults } from "./PrescriptionForm";
import { ConfirmForm } from "./ConfirmForm";
import type { BoundAction } from "./action";

export interface PrescriptionDisplay {
  medication: string;
  dosage: string;
  quantity: number;
  refillOn: string;
  cadenceLabel: string;
  isRecurring: boolean;
  /** Formatted end date, or null if open-ended. */
  endsAt: string | null;
}

export function PrescriptionRow({
  display,
  defaults,
  medications,
  dosages,
  canEndRecurrence,
  updateAction,
  deleteAction,
  endAction,
}: {
  display: PrescriptionDisplay;
  defaults: PrescriptionDefaults;
  medications: readonly string[];
  dosages: readonly string[];
  canEndRecurrence: boolean;
  updateAction: BoundAction;
  deleteAction: BoundAction;
  endAction: BoundAction;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-2xl border border-brand/30 bg-mint/30 p-4">
        <PrescriptionForm
          action={updateAction}
          mode="edit"
          medications={medications}
          dosages={dosages}
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
          <span className="font-semibold text-ink">
            {display.medication} · {display.dosage}
          </span>
          {display.isRecurring ? <Chip>{display.cadenceLabel}</Chip> : null}
        </div>
        <p className="text-sm text-muted">
          Qty {display.quantity} · Next refill {display.refillOn}
        </p>
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
            confirmText="End this recurring prescription as of now? Future refills will stop."
            pendingLabel="Ending…"
          >
            End refills
          </ConfirmForm>
        ) : null}
        <ConfirmForm
          action={deleteAction}
          className={btnDanger}
          confirmText="Delete this prescription? This cannot be undone."
          pendingLabel="Deleting…"
        >
          Delete
        </ConfirmForm>
      </div>
    </li>
  );
}

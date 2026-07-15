"use client";

// Zealthy — a small "click to reveal" wrapper for the add-item forms.
//
// Keeps the patient record page tidy: the "Add appointment" / "Add prescription"
// forms stay collapsed behind a button until the operator wants them. The revealed
// child is a form that stays open across multiple adds (it resets itself on each
// success); "Cancel" collapses it.

import { useState, type ReactNode } from "react";
import { btnGhost, btnSecondary } from "@/components/ui/controls";

export function Disclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className={btnSecondary} onClick={() => setOpen(true)}>
        + {label}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-4">
      {children}
      <div className="mt-3">
        <button type="button" className={btnGhost} onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </div>
  );
}

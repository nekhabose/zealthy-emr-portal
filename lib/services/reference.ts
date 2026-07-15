// Zealthy — reference-list service.
//
// The seeded Medication / Dosage tables that populate the prescription form's
// dropdowns. The brief requires the create/edit prescription form's selectable options
// to come from these reference tables, and `makePrescriptionSchema` re-checks the
// submitted values against these same lists on the server.

import { prisma } from "../prisma";

/** All prescribable medication names, alphabetically. */
export async function listMedications(): Promise<string[]> {
  const rows = await prisma.medication.findMany({ orderBy: { name: "asc" } });
  return rows.map((r) => r.name);
}

/**
 * All dosage values in ascending STRENGTH (e.g. "5mg" before "10mg"), driven by the
 * seeded `sortOrder` — lexical string ordering would wrongly place "10mg" before "5mg".
 */
export async function listDosages(): Promise<string[]> {
  const rows = await prisma.dosage.findMany({ orderBy: { sortOrder: "asc" } });
  return rows.map((r) => r.value);
}

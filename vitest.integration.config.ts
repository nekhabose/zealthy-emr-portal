import { defineConfig } from "vitest/config";

// Integration config: exercises the Phase-3 service layer against a REAL Postgres
// (the local `DATABASE_URL`). Kept separate from the default unit run so `npm test`
// stays DB-free and CI-safe. Run with `npm run test:int`.
//
// Tests here create a throwaway patient, drive the full CRUD + portal reads, and
// clean up after themselves (cascade delete) — they never touch the seeded rows
// destructively. `fileParallelism` is off so the single shared DB isn't raced.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    fileParallelism: false,
    // A DB round-trip per case; give a little headroom over the 5s default.
    testTimeout: 20000,
  },
});

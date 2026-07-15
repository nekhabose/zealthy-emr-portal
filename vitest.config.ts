import { defineConfig } from "vitest/config";

// Phase-2 unit tests are pure Node domain logic (no DOM, no Next runtime), so the
// default node environment is all we need. Scope the run to the tests/ directory.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

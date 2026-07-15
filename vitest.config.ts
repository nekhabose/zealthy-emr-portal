import { defineConfig } from "vitest/config";

// Default `npm test` runs the PURE unit tests — Node domain logic (recurrence,
// service mappers) with no DOM, no Next runtime, and NO database. That keeps the
// default suite fast and CI-safe. DB-backed integration tests live under
// tests/integration/ and are excluded here; run them with `npm run test:int`
// (a live Postgres, see vitest.integration.config.ts).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/integration/**", "node_modules/**"],
  },
});

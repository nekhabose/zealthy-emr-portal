// Singleton PrismaClient.
//
// Next.js dev + HMR re-evaluates modules on every change; without this guard each
// reload would spin up a new PrismaClient and exhaust Postgres connections. We stash
// one instance on `globalThis` in non-production so hot reloads reuse it. In
// production a single module-scoped instance is used.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

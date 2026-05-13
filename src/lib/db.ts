import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in dev (Next.js re-evaluates
// modules on every change, which would otherwise leak connections).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import { PrismaClient } from "@prisma/client";

// Singleton Prisma client (Next.js dev hot-reload safe via globalThis).
// Pool sizing is controlled via DATABASE_URL (?connection_limit=…) — keep
// serverless/low-connection environments in mind when tuning it.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

import { PrismaPg } from "@prisma/adapter-pg";

import { serverEnv } from "@/config/env";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Prisma 7 requires a driver adapter. We use node-postgres via @prisma/adapter-pg.
 * A single PrismaClient instance is shared across the app. In development the
 * instance is cached on globalThis so Next.js hot reloads do not open new
 * connection pools on every change.
 */

function createPrismaClient(): PrismaClient {
  const url = new URL(serverEnv.DATABASE_URL);

  // `schema` is a Prisma-style URL parameter that node-postgres does not understand.
  // Extract it and pass it to the adapter instead.
  const schema = url.searchParams.get("schema") ?? undefined;
  url.searchParams.delete("schema");

  const adapter = new PrismaPg(
    {
      connectionString: url.toString(),
      max: serverEnv.NODE_ENV === "production" ? 20 : 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    },
    schema ? { schema } : undefined,
  );

  return new PrismaClient({
    adapter,
    log: serverEnv.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (serverEnv.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient } from "@/generated/prisma/client";
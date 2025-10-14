import { PrismaClient } from "./generated";
export type { Prisma } from "./generated";

const g = globalThis as unknown as { __core?: PrismaClient };

export const prisma =
  g.__core ?? new PrismaClient({ datasources: { db: { url: process.env.CORE_DATABASE_URL } } });

if (process.env.NODE_ENV !== "production") g.__core = prisma;
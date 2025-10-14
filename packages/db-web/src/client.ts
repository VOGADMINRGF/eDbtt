import { PrismaClient } from "./generated";
export type { Prisma } from "./generated";

const g = globalThis as unknown as { __web?: PrismaClient };

export const prisma =
  g.__web ?? new PrismaClient({ datasources: { db: { url: process.env.WEB_DATABASE_URL } } });

if (process.env.NODE_ENV !== "production") g.__web = prisma;
export { ContentKind, RegionMode, Locale } from "./generated";

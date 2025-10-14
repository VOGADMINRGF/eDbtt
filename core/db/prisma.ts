import { PrismaClient, Prisma } from "@prisma/client";
declare global { var PRISMA_WEB: PrismaClient | undefined; }
export const prisma =
global.PRISMA_WEB ??
new PrismaClient({
log: process.env.NODE_ENV === "development"
? (["query","warn","error"] as Prisma.LogLevel[])
: (["error"] as Prisma.LogLevel[]),
datasources: { db: { url: process.env.WEB_DATABASE_URL || process.env.DATABASE_URL } },
});
if (process.env.NODE_ENV !== "production") global.PRISMA_WEB = prisma;

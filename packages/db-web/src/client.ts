import { PrismaClient } from "./generated";
export type { Prisma } from "./generated";

const g = globalThis as unknown as { __web?: PrismaClient };
let clientSingleton: PrismaClient | undefined = g.__web;

function isMongoDatasourceUrl(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized.startsWith("mongodb://") || normalized.startsWith("mongodb+srv://");
}

export function resolveWebDatabaseUrl(): string | null {
  const url = process.env.WEB_DATABASE_URL?.trim();
  if (!url || !isMongoDatasourceUrl(url)) return null;
  return url;
}

export function isWebDatabaseConfigured(): boolean {
  return resolveWebDatabaseUrl() !== null;
}

function createClient() {
  const rawUrl = process.env.WEB_DATABASE_URL?.trim();
  const url = resolveWebDatabaseUrl();
  const shadowUrl = process.env.DATABASE_URL?.trim();

  if (!url) {
    if (rawUrl) {
      throw new Error(
        "WEB_DATABASE_URL must use a MongoDB datasource URL (mongodb:// or mongodb+srv://).",
      );
    }
    if (shadowUrl) {
      throw new Error(
        "WEB_DATABASE_URL missing; DATABASE_URL fallback is disabled for the web runtime.",
      );
    }

    throw new Error("WEB_DATABASE_URL missing");
  }

  if (shadowUrl && shadowUrl !== url) {
    throw new Error(
      "WEB_DATABASE_URL conflicts with DATABASE_URL; the web runtime only accepts WEB_DATABASE_URL.",
    );
  }

  return new PrismaClient({
    datasources: {
      db: { url },
    },
  });
}

export function getPrismaClient() {
  if (clientSingleton) {
    return clientSingleton;
  }

  const client = createClient();
  clientSingleton = client;

  if (process.env.NODE_ENV !== "production") {
    g.__web = client;
  }

  return client;
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop, receiver) {
      const client = getPrismaClient();
      const value = Reflect.get(client as object, prop, receiver) as unknown;

      return typeof value === "function" ? value.bind(client) : value;
    },
  },
) as PrismaClient;

export { ContentKind, RegionMode, Locale } from "./generated";

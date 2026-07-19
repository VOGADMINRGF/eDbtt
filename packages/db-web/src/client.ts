import { PrismaClient } from "./generated";
export type { Prisma } from "./generated";

const g = globalThis as unknown as { __web?: PrismaClient };
let clientSingleton: PrismaClient | undefined = g.__web;

const WEB_DATABASE_ENV_KEYS = [
  "WEB_DATABASE_URL",
  "WEB_POSTGRES_URL",
  "WEB_POSTGRES_URI",
] as const;

export function resolveWebDatabaseUrl(): string | null {
  for (const key of WEB_DATABASE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return null;
}

export function isWebDatabaseConfigured(): boolean {
  return resolveWebDatabaseUrl() !== null;
}

function createClient() {
  const url = resolveWebDatabaseUrl();
  if (!url) {
    throw new Error(
      "Web database missing: configure WEB_DATABASE_URL (or WEB_POSTGRES_URL / WEB_POSTGRES_URI)",
    );
  }
  return new PrismaClient({ datasources: { db: { url } } });
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
  }
) as PrismaClient;

export { ContentKind, RegionMode, Locale } from "./generated";

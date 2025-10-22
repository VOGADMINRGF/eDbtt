// apps/web/src/shims/core/db/triMongo.ts
import "server-only";
import { MongoClient, Db, Collection, type Document } from "mongodb";

let coreClient: MongoClient | null = null;
let votesClient: MongoClient | null = null;
let piiClient: MongoClient | null = null;

async function getClient(uri: string): Promise<MongoClient> {
  const client = new MongoClient(uri);
  try { await client.connect(); } catch {}
  return client;
}

export async function coreDb(): Promise<Db> {
  const uri = process.env.CORE_MONGODB_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  coreClient = coreClient ?? await getClient(uri);
  const name = process.env.CORE_DB_NAME || process.env.DB_NAME || "core";
  return coreClient.db(name);
}
export async function votesDb(): Promise<Db> {
  const uri = process.env.VOTES_MONGODB_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  votesClient = votesClient ?? await getClient(uri);
  const name = process.env.VOTES_DB_NAME || process.env.DB_NAME || "votes";
  return votesClient.db(name);
}
export async function piiDb(): Promise<Db> {
  const uri = process.env.PII_MONGODB_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
  piiClient = piiClient ?? await getClient(uri);
  const name = process.env.PII_DB_NAME || process.env.DB_NAME || "pii";
  return piiClient.db(name);
}

export async function coreCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return (await coreDb()).collection<T>(name);
}
export async function votesCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return (await votesDb()).collection<T>(name);
}
export async function piiCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
  return (await piiDb()).collection<T>(name);
}

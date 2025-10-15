import { MongoClient, Db, Collection, Document } from "mongodb";

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

/** getDb(dbName) – für legacy Importe */
export async function getDb(dbName: "core" | "votes" | "pii" = "core"): Promise<Db> {
  if (dbName === "core") return coreDb();
  if (dbName === "votes") return votesDb();
  return piiDb();
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

/** getCol(name) oder getCol(dbName, name) (legacy Overload) */
export async function getCol<T extends Document = Document>(name: string): Promise<Collection<T>>;
export async function getCol<T extends Document = Document>(dbName: "core" | "votes" | "pii", name: string): Promise<Collection<T>>;
export async function getCol<T extends Document = Document>(a: any, b?: any): Promise<Collection<T>> {
  if (typeof b === "string") {
    const db = await getDb(a as "core"|"votes"|"pii");
    return db.collection<T>(b);
  }
  return coreCol<T>(a as string);
}

const api = { coreDb, votesDb, piiDb, getDb, coreCol, votesCol, piiCol, getCol };
export default api;

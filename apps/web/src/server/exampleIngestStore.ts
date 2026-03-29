import { MongoClient, Collection } from "mongodb";
import { hasCoreMongoRuntimeConfig, resolveCoreMongoRuntimeConfig } from "@/lib/server/env/runtimeMongo";

export type ExampleIngest = {
  id: string;
  exampleId: string;
  lang: string;
  title: string;
  kind: string;
  scope: string;
  topics: string[];
  country?: string;
  region?: string;
  createdAt: string;
  ua?: string | null;
  _id?: any;
};

type Store = {
  create(payload: Omit<ExampleIngest, "id" | "createdAt">): Promise<ExampleIngest>;
};

function isoNow() {
  return new Date().toISOString();
}

function rid() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

async function mongoCol(): Promise<Collection<ExampleIngest>> {
  const mongo = resolveCoreMongoRuntimeConfig();
  if (!mongo.uri || !mongo.dbName) {
    throw new Error("Missing CORE_MONGODB_URI/CORE_DB_NAME (or legacy MONGODB_URI/MONGODB_DB)");
  }
  const client = new MongoClient(mongo.uri);
  await client.connect();
  return client.db(mongo.dbName).collection<ExampleIngest>("example_ingests");
}

const mongoStore: Store = {
  async create(payload) {
    const col = await mongoCol();
    const doc: ExampleIngest = { id: rid(), createdAt: isoNow(), ...payload };
    await col.insertOne(doc);
    return doc;
  },
};

const g = globalThis as any;
g.__VOG_EXAMPLE_INGESTS__ ||= new Map<string, ExampleIngest>();
const mem: Map<string, ExampleIngest> = g.__VOG_EXAMPLE_INGESTS__;

const memoryStore: Store = {
  async create(payload) {
    const doc: ExampleIngest = { id: rid(), createdAt: isoNow(), ...payload };
    mem.set(doc.id, doc);
    return doc;
  },
};

function pickStore(): Store {
  const hasMongo = hasCoreMongoRuntimeConfig();
  return hasMongo ? mongoStore : memoryStore;
}

export async function createExampleIngest(payload: Omit<ExampleIngest, "id" | "createdAt">) {
  return pickStore().create(payload);
}

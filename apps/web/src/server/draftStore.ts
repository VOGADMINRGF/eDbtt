import { MongoClient, Collection } from "mongodb";
import { hasCoreMongoRuntimeConfig, resolveCoreMongoRuntimeConfig } from "@/lib/server/env/runtimeMongo";
import { toMongoRuntimeError } from "@/lib/server/env/runtimeMongoErrors";

export type Draft = {
  id: string;
  kind: "contribution" | string;
  text: string;
  analysis?: any;
  createdAt: string;
  updatedAt: string;
  _id?: any;
};

type Store = {
  get(id: string): Promise<Draft | null>;
};

const RETIRED_WRITER_ERROR = "legacy_draft_store_write_retired";

/** --- Mongo-Implementierung --- */
async function mongoCol(): Promise<Collection<Draft>> {
  try {
    const mongo = resolveCoreMongoRuntimeConfig();
    if (!mongo.uri || !mongo.dbName) {
      throw new Error("Missing CORE_MONGODB_URI/CORE_DB_NAME (or legacy MONGODB_URI/MONGODB_DB)");
    }
    const client = new MongoClient(mongo.uri);
    await client.connect();
    return client.db(mongo.dbName).collection<Draft>("drafts");
  } catch (error) {
    throw toMongoRuntimeError(error, "draftStore:mongoCol");
  }
}
const mongoStore: Store = {
  async get(id) {
    const col = await mongoCol();
    return await col.findOne({ id });
  }
};

/** --- In-Memory-Implementierung (Dev-Fallback) --- */
const g = globalThis as any;
g.__VOG_DRAFTS__ ||= new Map<string, Draft>();
const mem: Map<string, Draft> = g.__VOG_DRAFTS__;

const memoryStore: Store = {
  async get(id) { return mem.get(id) || null; }
};

/** --- Factory: Prod (Mongo) wenn ENV da, sonst Dev (Memory) --- */
function pickStore(): Store {
  const hasMongo = hasCoreMongoRuntimeConfig();
  return hasMongo ? mongoStore : memoryStore;
}

export async function createDraft(_d: Omit<Draft, "id"|"createdAt"|"updatedAt">) {
  throw new Error(RETIRED_WRITER_ERROR);
}
export async function patchDraft(_id: string, _patch: Partial<Draft>) {
  throw new Error(RETIRED_WRITER_ERROR);
}
export async function getDraft(id: string) {
  return pickStore().get(id);
}

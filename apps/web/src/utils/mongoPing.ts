import { MongoClient } from "mongodb";
import { resolveMongoUriForZone } from "@/lib/server/env/runtimeMongo";
import { toMongoRuntimeError } from "@/lib/server/env/runtimeMongoErrors";

const clients: Record<string, MongoClient | null> = {
  core: null,
  votes: null,
  pii: null,
};

function uriFor(kind: "core" | "votes" | "pii") {
  return resolveMongoUriForZone(kind);
}

export async function mongoPing(
  kind: "core" | "votes" | "pii" = "core",
): Promise<boolean> {
  try {
    const uri = uriFor(kind);
    if (!uri) throw new Error(`Missing Mongo URI for ${kind}`);
    if (!clients[kind]) clients[kind] = new MongoClient(uri);
    const c = clients[kind]!;
    if (!(c as any).topology?.isConnected?.()) await c.connect();
    await c.db().command({ ping: 1 });
    return true;
  } catch (error) {
    throw toMongoRuntimeError(error, `mongoPing:${kind}`);
  }
}

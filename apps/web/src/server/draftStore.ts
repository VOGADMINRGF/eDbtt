// apps/web/src/server/draftStore.ts
/* @ts-nocheck */
import { randomUUID } from "crypto";

type Draft = {
  id: string;
  kind: "contribution";
  text: string;
  analysis?: any;
  status?: "light"|"full";
  createdAt?: string;
  updatedAt?: string;
};

const USE_DB = String(process.env.VOG_USE_DB ?? "false") === "true";

// In-Memory Fallback
const mem: Record<string, Draft> = {};

// Mongo optional & nur auf Server dynamisch laden
async function mongo() {
  const { MongoClient } = await import("mongodb"); // lazy, server only
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB!;
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(dbName).collection<Draft>("drafts");
}

export async function createDraft(input: Partial<Draft>) {
  const doc: Draft = {
    id: randomUUID(),
    kind: "contribution",
    text: input.text ?? "",
    analysis: input.analysis ?? null,
    status: input.status ?? "light",
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (USE_DB) {
    const col = await mongo();
    await col.insertOne(doc as any);
  } else {
    mem[doc.id] = doc;
  }
  return doc;
}

export async function getDraft(id: string) {
  if (USE_DB) {
    const col = await mongo();
    return await col.findOne({ id });
  }
  return mem[id] ?? null;
}

export async function patchDraft(id: string, patch: any) {
  if (USE_DB) {
    const col = await mongo();
    await col.updateOne({ id }, { $set: { ...patch, updatedAt: new Date().toISOString() } }, { upsert: false });
    return await col.findOne({ id });
  } else {
    const curr = mem[id];
    if (!curr) return null;
    mem[id] = { ...curr, ...patch, updatedAt: new Date().toISOString() };
    return mem[id];
  }
}

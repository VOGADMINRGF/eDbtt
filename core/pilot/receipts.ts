import { coreCol } from "@core/db/triMongo";
import type { PilotSettings } from "./settings";

export type PilotSettingsReceipt = {
  actorId: string | null;
  patch: Partial<PilotSettings>;
  settings: PilotSettings;
  createdAt: Date;
};

export type PilotRunReceiptStatus =
  | "skipped"
  | "factchecked"
  | "error";

export type PilotRunReceipt = {
  runId: string;
  candidateId: string;
  draftId?: string | null;
  topic?: string | null;
  checkLevel: 0 | 1 | 2;
  status: PilotRunReceiptStatus;
  costEur?: number | null;
  jobId?: string | null;
  reason?: string | null;
  createdAt: Date;
};

const SETTINGS_RECEIPTS_COLLECTION = "pilot_settings_receipts";
const RUN_RECEIPTS_COLLECTION = "pilot_run_receipts";

let ensuredSettings = false;
let ensuredRuns = false;

async function ensureSettingsIndexes() {
  if (ensuredSettings) return;
  const col = await coreCol<PilotSettingsReceipt>(SETTINGS_RECEIPTS_COLLECTION);
  await col.createIndex({ createdAt: -1 });
  ensuredSettings = true;
}

async function ensureRunIndexes() {
  if (ensuredRuns) return;
  const col = await coreCol<PilotRunReceipt>(RUN_RECEIPTS_COLLECTION);
  await col.createIndex({ createdAt: -1 });
  await col.createIndex({ candidateId: 1, createdAt: -1 });
  await col.createIndex({ topic: 1, createdAt: -1 });
  ensuredRuns = true;
}

export async function logPilotSettingsReceipt(receipt: PilotSettingsReceipt): Promise<void> {
  await ensureSettingsIndexes();
  const col = await coreCol<PilotSettingsReceipt>(SETTINGS_RECEIPTS_COLLECTION);
  await col.insertOne(receipt);
}

export async function logPilotRunReceipt(receipt: PilotRunReceipt): Promise<void> {
  await ensureRunIndexes();
  const col = await coreCol<PilotRunReceipt>(RUN_RECEIPTS_COLLECTION);
  await col.insertOne(receipt);
}

export async function sumPilotCostsSince(params: { since: Date; topic?: string | null }): Promise<number> {
  await ensureRunIndexes();
  const col = await coreCol<PilotRunReceipt>(RUN_RECEIPTS_COLLECTION);
  const filter: Record<string, unknown> = { createdAt: { $gte: params.since } };
  if (params.topic) {
    filter.topic = params.topic;
  }
  const docs = await col.find(filter, { projection: { costEur: 1 } }).toArray();
  return docs.reduce((acc, doc) => acc + (Number(doc.costEur) || 0), 0);
}

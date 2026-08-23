import type { Model } from "mongoose";
import { mongo, mongoose } from "@core/db/mongoose";
import {
  Alpha2RunRecordSchema,
  type Alpha2RunRecord,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";
import {
  assertAlpha2LedgerIdentity,
  type Alpha2RunLedger,
  type Alpha2RunLedgerCreateResult,
  type Alpha2VersionedRun,
} from "@/features/agenticRuntime/alpha2RunLedgerContract";

const ALPHA2_LEDGER_COLLECTION = "alpha2_runs";
const ALPHA2_LEDGER_MODEL = "Alpha2RunLedger";

const Alpha2RunLedgerSchema = new mongoose.Schema(
  {
    schemaVersion: { type: String, required: true, default: "alpha2.ledger.v1" },
    runId: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    rootRunId: { type: String, required: true, index: true },
    parentRunId: { type: String, default: null, index: true },
    taskId: { type: String, required: true, index: true },
    status: { type: String, required: true, index: true },
    riskClass: { type: String, required: true, index: true },
    resumeAt: { type: Date, default: null, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    version: { type: Number, required: true, default: 0 },
    leaseOwner: { type: String, default: null, index: true },
    leaseExpiresAt: { type: Date, default: null, index: true },
  },
  {
    collection: ALPHA2_LEDGER_COLLECTION,
    timestamps: true,
    minimize: false,
    versionKey: false,
  },
);

Alpha2RunLedgerSchema.index({ status: 1, resumeAt: 1, leaseExpiresAt: 1 });
Alpha2RunLedgerSchema.index({ rootRunId: 1, updatedAt: -1 });
Alpha2RunLedgerSchema.index({ taskId: 1, updatedAt: -1 });

async function Alpha2LedgerModel(): Promise<Model<any>> {
  await mongo();
  const existing = mongoose.models[ALPHA2_LEDGER_MODEL] as Model<any> | undefined;
  return existing ?? mongoose.model<any>(ALPHA2_LEDGER_MODEL, Alpha2RunLedgerSchema);
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toVersionedRun(raw: any): Alpha2VersionedRun {
  const plain = typeof raw?.toObject === "function" ? raw.toObject() : raw;
  const run = Alpha2RunRecordSchema.parse(plain.payload);
  const leaseExpiresAt = toIso(plain.leaseExpiresAt);
  return {
    run,
    version: Number(plain.version ?? 0),
    lease:
      plain.leaseOwner && leaseExpiresAt
        ? { owner: String(plain.leaseOwner), expiresAt: leaseExpiresAt }
        : null,
  };
}

function indexedFields(run: Alpha2RunRecord) {
  return {
    rootRunId: run.rootRunId,
    parentRunId: run.parentRunId,
    taskId: run.taskId,
    status: run.status,
    riskClass: run.riskClass,
    resumeAt: run.resumeAt ? new Date(run.resumeAt) : null,
    payload: run,
  };
}

function dueStateFilter(now: Date) {
  return {
    $or: [
      { status: "queued" },
      { status: "running" },
      { status: "waiting", resumeAt: { $lte: now } },
      { status: "failed", resumeAt: { $lte: now } },
    ],
  };
}

function availableLeaseFilter(now: Date, owner?: string) {
  return {
    $or: [
      ...(owner ? [{ leaseOwner: owner }] : []),
      { leaseOwner: null },
      { leaseExpiresAt: null },
      { leaseExpiresAt: { $lte: now } },
    ],
  };
}

export class Alpha2MongoRunLedger implements Alpha2RunLedger {
  async createOrGet(run: Alpha2RunRecord): Promise<Alpha2RunLedgerCreateResult> {
    const validated = Alpha2RunRecordSchema.parse(run);
    const Model = await Alpha2LedgerModel();

    const existing = await Model.findOne({ idempotencyKey: validated.idempotencyKey });
    if (existing) {
      const record = toVersionedRun(existing);
      assertAlpha2LedgerIdentity(record.run, validated);
      return { record, created: false };
    }

    try {
      const created = await Model.create({
        schemaVersion: "alpha2.ledger.v1",
        runId: validated.runId,
        idempotencyKey: validated.idempotencyKey,
        ...indexedFields(validated),
        version: 0,
        leaseOwner: null,
        leaseExpiresAt: null,
      });
      return { record: toVersionedRun(created), created: true };
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const raced = await Model.findOne({ idempotencyKey: validated.idempotencyKey });
      if (!raced) throw error;
      const record = toVersionedRun(raced);
      assertAlpha2LedgerIdentity(record.run, validated);
      return { record, created: false };
    }
  }

  async getByRunId(runId: string): Promise<Alpha2VersionedRun | null> {
    const Model = await Alpha2LedgerModel();
    const doc = await Model.findOne({ runId });
    return doc ? toVersionedRun(doc) : null;
  }

  async getByIdempotencyKey(idempotencyKey: string): Promise<Alpha2VersionedRun | null> {
    const Model = await Alpha2LedgerModel();
    const doc = await Model.findOne({ idempotencyKey });
    return doc ? toVersionedRun(doc) : null;
  }

  async compareAndSwap(input: {
    run: Alpha2RunRecord;
    expectedVersion: number;
  }): Promise<Alpha2VersionedRun> {
    const run = Alpha2RunRecordSchema.parse(input.run);
    const Model = await Alpha2LedgerModel();
    const updated = await Model.findOneAndUpdate(
      { runId: run.runId, version: input.expectedVersion },
      {
        $set: indexedFields(run),
        $inc: { version: 1 },
      },
      { new: true, runValidators: true },
    );

    if (!updated) throw new Error("alpha2_ledger_version_conflict");
    return toVersionedRun(updated);
  }

  async tryAcquireLease(input: {
    runId: string;
    owner: string;
    now: string;
    leaseMs: number;
  }): Promise<Alpha2VersionedRun | null> {
    const Model = await Alpha2LedgerModel();
    const now = new Date(input.now);
    const expiresAt = new Date(now.getTime() + input.leaseMs);

    const updated = await Model.findOneAndUpdate(
      {
        runId: input.runId,
        $and: [dueStateFilter(now), availableLeaseFilter(now, input.owner)],
      },
      {
        $set: {
          leaseOwner: input.owner,
          leaseExpiresAt: expiresAt,
        },
      },
      { new: true },
    );

    return updated ? toVersionedRun(updated) : null;
  }

  async releaseLease(input: { runId: string; owner: string }): Promise<void> {
    const Model = await Alpha2LedgerModel();
    await Model.updateOne(
      { runId: input.runId, leaseOwner: input.owner },
      { $set: { leaseOwner: null, leaseExpiresAt: null } },
    );
  }

  async listRecoverable(input: { now: string; limit?: number }): Promise<Alpha2VersionedRun[]> {
    const Model = await Alpha2LedgerModel();
    const now = new Date(input.now);
    const limit = Math.max(1, Math.min(input.limit ?? 50, 500));

    const docs = await Model.find({
      $and: [dueStateFilter(now), availableLeaseFilter(now)],
    })
      .sort({ updatedAt: 1 })
      .limit(limit);

    return docs.map(toVersionedRun);
  }
}

let sharedLedger: Alpha2MongoRunLedger | null = null;

export function getAlpha2MongoRunLedger() {
  return (sharedLedger ??= new Alpha2MongoRunLedger());
}

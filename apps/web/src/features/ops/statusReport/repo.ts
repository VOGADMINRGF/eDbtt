import crypto from "node:crypto";
import { coreCol } from "@core/db/triMongo";
import type {
  ScheduledStatusReportSlot,
  StatusReportOverallStatus,
  StatusReportRunRecord,
  StatusReportRunStatus,
  StatusReportSlot,
  StatusReportSummary,
} from "./contracts";

type StatusReportRunDoc = {
  _id: string;
  slotKey: string;
  slot: StatusReportSlot;
  timezone: string;
  trigger: "scheduler" | "manual";
  recipients: string[];
  startedAt: Date;
  completedAt: Date | null;
  status: StatusReportRunStatus;
  overallStatus: StatusReportOverallStatus | null;
  summaryPoints: string[];
  mailSent: boolean;
  error: string | null;
  report: StatusReportSummary | null;
};

type ClaimScheduledRunInput = {
  slotKey: string;
  slot: ScheduledStatusReportSlot;
  timezone: string;
  recipients: string[];
};

type CreateManualRunInput = {
  timezone: string;
  recipients: string[];
};

type FinishRunInput = {
  id: string;
  status: StatusReportRunStatus;
  completedAt: string;
  overallStatus: StatusReportOverallStatus | null;
  summaryPoints: string[];
  mailSent: boolean;
  error: string | null;
  report: StatusReportSummary | null;
};

type StatusReportRepo = {
  claimScheduledRun(input: ClaimScheduledRunInput): Promise<{
    claimed: boolean;
    run: StatusReportRunRecord;
  }>;
  createManualRun(input: CreateManualRunInput): Promise<StatusReportRunRecord>;
  finishRun(input: FinishRunInput): Promise<StatusReportRunRecord | null>;
  listRecent(limit?: number): Promise<StatusReportRunRecord[]>;
};

const STATUS_REPORT_COLLECTION = "edebatte_ops_status_reports";

let mongoIndexesReady = false;
let repoSingleton: StatusReportRepo | null = null;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeLimit(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 20;
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function mapDocToRunRecord(doc: StatusReportRunDoc): StatusReportRunRecord {
  return {
    id: doc._id,
    slotKey: doc.slotKey,
    slot: doc.slot,
    timezone: doc.timezone,
    trigger: doc.trigger,
    recipients: [...(doc.recipients ?? [])],
    startedAt: doc.startedAt.toISOString(),
    completedAt: toIso(doc.completedAt),
    status: doc.status,
    overallStatus: doc.overallStatus,
    summaryPoints: [...(doc.summaryPoints ?? [])],
    mailSent: Boolean(doc.mailSent),
    error: doc.error ?? null,
    report: doc.report ? clone(doc.report) : null,
  };
}

async function ensureMongoIndexes() {
  if (mongoIndexesReady) return;
  const col = await coreCol<StatusReportRunDoc>(STATUS_REPORT_COLLECTION);
  await Promise.all([
    col.createIndex({ slotKey: 1 }, { unique: true }),
    col.createIndex({ slot: 1, startedAt: -1 }),
    col.createIndex({ status: 1, startedAt: -1 }),
    col.createIndex({ "report.overallStatus": 1, startedAt: -1 }),
  ]);
  mongoIndexesReady = true;
}

function buildRunningDoc(input: {
  id: string;
  slotKey: string;
  slot: StatusReportSlot;
  timezone: string;
  recipients: string[];
  trigger: "scheduler" | "manual";
  startedAt: Date;
}): StatusReportRunDoc {
  return {
    _id: input.id,
    slotKey: input.slotKey,
    slot: input.slot,
    timezone: input.timezone,
    trigger: input.trigger,
    recipients: [...input.recipients],
    startedAt: input.startedAt,
    completedAt: null,
    status: "running",
    overallStatus: null,
    summaryPoints: [],
    mailSent: false,
    error: null,
    report: null,
  };
}

export function createMongoStatusReportRepo(): StatusReportRepo {
  return {
    async claimScheduledRun(input) {
      await ensureMongoIndexes();
      const col = await coreCol<StatusReportRunDoc>(STATUS_REPORT_COLLECTION);
      const now = new Date();
      const doc = buildRunningDoc({
        id: input.slotKey,
        slotKey: input.slotKey,
        slot: input.slot,
        timezone: input.timezone,
        recipients: input.recipients,
        trigger: "scheduler",
        startedAt: now,
      });

      const updateResult = await col.updateOne(
        { _id: input.slotKey },
        { $setOnInsert: doc },
        { upsert: true },
      );

      if (updateResult.upsertedCount === 1) {
        return { claimed: true, run: mapDocToRunRecord(doc) };
      }

      const existing = await col.findOne({ _id: input.slotKey });
      if (!existing) {
        return { claimed: false, run: mapDocToRunRecord(doc) };
      }
      return { claimed: false, run: mapDocToRunRecord(existing) };
    },

    async createManualRun(input) {
      await ensureMongoIndexes();
      const col = await coreCol<StatusReportRunDoc>(STATUS_REPORT_COLLECTION);
      const id = `manual:${Date.now()}:${crypto.randomUUID().slice(0, 8)}`;
      const doc = buildRunningDoc({
        id,
        slotKey: id,
        slot: "manual",
        timezone: input.timezone,
        recipients: input.recipients,
        trigger: "manual",
        startedAt: new Date(),
      });
      await col.insertOne(doc);
      return mapDocToRunRecord(doc);
    },

    async finishRun(input) {
      await ensureMongoIndexes();
      const col = await coreCol<StatusReportRunDoc>(STATUS_REPORT_COLLECTION);
      const completedAtDate = new Date(input.completedAt);
      const reportClone = input.report ? clone(input.report) : null;

      await col.updateOne(
        { _id: input.id },
        {
          $set: {
            status: input.status,
            completedAt: completedAtDate,
            overallStatus: input.overallStatus,
            summaryPoints: [...input.summaryPoints],
            mailSent: input.mailSent,
            error: input.error,
            report: reportClone,
          },
        },
      );

      const updated = await col.findOne({ _id: input.id });
      return updated ? mapDocToRunRecord(updated) : null;
    },

    async listRecent(limit = 20) {
      await ensureMongoIndexes();
      const col = await coreCol<StatusReportRunDoc>(STATUS_REPORT_COLLECTION);
      const docs = await col
        .find({})
        .sort({ startedAt: -1 })
        .limit(normalizeLimit(limit))
        .toArray();
      return docs.map(mapDocToRunRecord);
    },
  };
}

export function createInMemoryStatusReportRepo(seed?: { runs?: StatusReportRunRecord[] }): StatusReportRepo {
  const byId = new Map<string, StatusReportRunRecord>();
  for (const run of seed?.runs ?? []) {
    byId.set(run.id, clone(run));
  }

  return {
    async claimScheduledRun(input) {
      const existing = byId.get(input.slotKey);
      if (existing) {
        return { claimed: false, run: clone(existing) };
      }
      const run: StatusReportRunRecord = {
        id: input.slotKey,
        slotKey: input.slotKey,
        slot: input.slot,
        timezone: input.timezone,
        trigger: "scheduler",
        recipients: [...input.recipients],
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "running",
        overallStatus: null,
        summaryPoints: [],
        mailSent: false,
        error: null,
        report: null,
      };
      byId.set(run.id, clone(run));
      return { claimed: true, run: clone(run) };
    },

    async createManualRun(input) {
      const id = `manual:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
      const run: StatusReportRunRecord = {
        id,
        slotKey: id,
        slot: "manual",
        timezone: input.timezone,
        trigger: "manual",
        recipients: [...input.recipients],
        startedAt: new Date().toISOString(),
        completedAt: null,
        status: "running",
        overallStatus: null,
        summaryPoints: [],
        mailSent: false,
        error: null,
        report: null,
      };
      byId.set(run.id, clone(run));
      return clone(run);
    },

    async finishRun(input) {
      const existing = byId.get(input.id);
      if (!existing) return null;
      const updated: StatusReportRunRecord = {
        ...existing,
        status: input.status,
        completedAt: input.completedAt,
        overallStatus: input.overallStatus,
        summaryPoints: [...input.summaryPoints],
        mailSent: input.mailSent,
        error: input.error,
        report: input.report ? clone(input.report) : null,
      };
      byId.set(input.id, clone(updated));
      return clone(updated);
    },

    async listRecent(limit = 20) {
      return Array.from(byId.values())
        .map((entry) => clone(entry))
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
        .slice(0, normalizeLimit(limit));
    },
  };
}

export function getStatusReportRepo(): StatusReportRepo {
  if (process.env.NODE_ENV === "test") {
    if (!repoSingleton) {
      repoSingleton = createInMemoryStatusReportRepo();
    }
    return repoSingleton;
  }

  if (!repoSingleton) {
    repoSingleton = createMongoStatusReportRepo();
  }
  return repoSingleton;
}

export function setStatusReportRepoForTests(repo: StatusReportRepo | null) {
  if (process.env.NODE_ENV !== "test") return;
  repoSingleton = repo;
}

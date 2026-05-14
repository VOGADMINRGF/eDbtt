import { coreCol } from "@core/db/triMongo";
import type {
  ThemenradarAuditEvent,
  ThemenradarLifecycleStatus,
  ThemenradarSourceType,
  ThemenradarItem,
} from "@features/themenradar/contracts";
import type { ThemenradarContentPrep } from "@features/themenradar/contentPrep";

const THEMENRADAR_ITEMS_COLLECTION = "edebatte_themenradar_items";
const THEMENRADAR_AUDIT_COLLECTION = "edebatte_themenradar_audit";

type ThemenradarItemDoc = {
  _id: string;
  item: ThemenradarItem;
  contentPrep: ThemenradarContentPrep | null;
  createdAt: Date;
  updatedAt: Date;
};

type ThemenradarAuditDoc = Omit<ThemenradarAuditEvent, "id"> & {
  _id?: any;
};

export type ThemenradarStoredRecord = {
  item: ThemenradarItem;
  contentPrep: ThemenradarContentPrep | null;
};

export type ThemenradarRepoListQuery = {
  status?: ThemenradarLifecycleStatus | "all";
  sourceType?: ThemenradarSourceType | "all";
  q?: string | null;
  limit?: number;
};

export type ThemenradarRepo = {
  listRecords(query?: ThemenradarRepoListQuery): Promise<ThemenradarStoredRecord[]>;
  getRecordById(id: string): Promise<ThemenradarStoredRecord | null>;
  upsertRecord(record: ThemenradarStoredRecord): Promise<void>;
  appendAuditEvent(event: Omit<ThemenradarAuditEvent, "id">): Promise<ThemenradarAuditEvent>;
  listAuditEvents(itemId: string): Promise<ThemenradarAuditEvent[]>;
};

let mongoIndexesReady = false;
let mongoRepoSingleton: ThemenradarRepo | null = null;

function normalizeLimit(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 40;
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function normalizeSearchQuery(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 120);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function ensureMongoIndexes() {
  if (mongoIndexesReady) return;
  const items = await coreCol<ThemenradarItemDoc>(THEMENRADAR_ITEMS_COLLECTION);
  const audits = await coreCol<ThemenradarAuditDoc>(THEMENRADAR_AUDIT_COLLECTION);
  await Promise.all([
    items.createIndex({ "item.lifecycleStatus": 1, "item.updatedAt": -1 }),
    items.createIndex({ "item.sourceType": 1, "item.updatedAt": -1 }),
    items.createIndex({ "item.campaignKey": 1, "item.updatedAt": -1 }),
    items.createIndex({ "item.archivedAt": -1 }),
    audits.createIndex({ itemId: 1, auditVersion: 1 }),
    audits.createIndex({ eventType: 1, at: -1 }),
    audits.createIndex({ actorUserId: 1, at: -1 }),
  ]);
  mongoIndexesReady = true;
}

function mapDocToRecord(doc: ThemenradarItemDoc | null): ThemenradarStoredRecord | null {
  if (!doc || !doc.item) return null;
  return {
    item: clone(doc.item),
    contentPrep: clone(doc.contentPrep ?? null),
  };
}

function mapAuditDoc(doc: ThemenradarAuditDoc): ThemenradarAuditEvent {
  return {
    id: String(doc._id ?? `${doc.itemId}_${doc.auditVersion}`),
    itemId: doc.itemId,
    eventType: doc.eventType,
    at: doc.at,
    actorUserId: doc.actorUserId,
    actorEmail: doc.actorEmail,
    fromStatus: doc.fromStatus,
    toStatus: doc.toStatus,
    note: doc.note,
    auditVersion: doc.auditVersion,
    metadata: doc.metadata,
  };
}

export function createMongoThemenradarRepo(): ThemenradarRepo {
  return {
    async listRecords(query = {}) {
      await ensureMongoIndexes();
      const items = await coreCol<ThemenradarItemDoc>(THEMENRADAR_ITEMS_COLLECTION);
      const limit = normalizeLimit(query.limit);
      const q = normalizeSearchQuery(query.q);
      const filter: Record<string, unknown> = {};
      if (query.status && query.status !== "all") {
        filter["item.lifecycleStatus"] = query.status;
      }
      if (query.sourceType && query.sourceType !== "all") {
        filter["item.sourceType"] = query.sourceType;
      }
      if (q) {
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, "i");
        filter.$or = [
          { _id: regex },
          { "item.title": regex },
          { "item.rawSignal": regex },
          { "item.campaignKey": regex },
          { "item.linkedAnlassraumId": regex },
          { "item.linkedDossierId": regex },
          { "item.sourceType": regex },
          { "item.lifecycleStatus": regex },
        ];
      }

      const docs = await items
        .find(filter)
        .sort({ "item.updatedAt": -1 })
        .limit(limit)
        .toArray();

      return docs
        .map((doc) => mapDocToRecord(doc))
        .filter((record): record is ThemenradarStoredRecord => Boolean(record));
    },

    async getRecordById(id: string) {
      await ensureMongoIndexes();
      const items = await coreCol<ThemenradarItemDoc>(THEMENRADAR_ITEMS_COLLECTION);
      const doc = await items.findOne({ _id: id });
      return mapDocToRecord(doc);
    },

    async upsertRecord(record) {
      await ensureMongoIndexes();
      const items = await coreCol<ThemenradarItemDoc>(THEMENRADAR_ITEMS_COLLECTION);
      const now = new Date();
      await items.updateOne(
        { _id: record.item.id },
        {
          $set: {
            item: clone(record.item),
            contentPrep: clone(record.contentPrep ?? null),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: new Date(record.item.createdAt),
          },
        },
        { upsert: true },
      );
    },

    async appendAuditEvent(event) {
      await ensureMongoIndexes();
      const audits = await coreCol<ThemenradarAuditDoc>(THEMENRADAR_AUDIT_COLLECTION);
      const doc: ThemenradarAuditDoc = {
        ...clone(event),
      };
      const result = await audits.insertOne(doc);
      return {
        ...clone(event),
        id: String(result.insertedId),
      };
    },

    async listAuditEvents(itemId: string) {
      await ensureMongoIndexes();
      const audits = await coreCol<ThemenradarAuditDoc>(THEMENRADAR_AUDIT_COLLECTION);
      const docs = await audits
        .find({ itemId })
        .sort({ auditVersion: 1, at: 1 })
        .toArray();
      return docs.map(mapAuditDoc);
    },
  };
}

export function createInMemoryThemenradarRepo(seed?: {
  records?: ThemenradarStoredRecord[];
  auditEvents?: ThemenradarAuditEvent[];
}): ThemenradarRepo {
  const byId = new Map<string, ThemenradarStoredRecord>();
  const audits: ThemenradarAuditEvent[] = [];

  for (const record of seed?.records ?? []) {
    byId.set(record.item.id, clone(record));
  }
  for (const event of seed?.auditEvents ?? []) {
    audits.push(clone(event));
  }

  return {
    async listRecords(query = {}) {
      const limit = normalizeLimit(query.limit);
      const status = query.status ?? "all";
      const sourceType = query.sourceType ?? "all";
      const q = normalizeSearchQuery(query.q).toLowerCase();

      return Array.from(byId.values())
        .map((entry) => clone(entry))
        .filter((entry) =>
          status === "all" ? true : entry.item.lifecycleStatus === status,
        )
        .filter((entry) =>
          sourceType === "all" ? true : entry.item.sourceType === sourceType,
        )
        .filter((entry) => {
          if (!q) return true;
          const haystack = [
            entry.item.id,
            entry.item.title,
            entry.item.rawSignal,
            entry.item.campaignKey ?? "",
            entry.item.linkedAnlassraumId ?? "",
            entry.item.linkedDossierId ?? "",
            entry.item.sourceType,
            entry.item.lifecycleStatus,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
        .sort((left, right) => right.item.updatedAt.localeCompare(left.item.updatedAt))
        .slice(0, limit);
    },

    async getRecordById(id) {
      const record = byId.get(id);
      return record ? clone(record) : null;
    },

    async upsertRecord(record) {
      byId.set(record.item.id, clone(record));
    },

    async appendAuditEvent(event) {
      const appended: ThemenradarAuditEvent = {
        ...clone(event),
        id: `${event.itemId}_${event.auditVersion}_${audits.length + 1}`,
      };
      audits.push(appended);
      return clone(appended);
    },

    async listAuditEvents(itemId) {
      return audits
        .filter((event) => event.itemId === itemId)
        .sort((left, right) => left.auditVersion - right.auditVersion)
        .map((event) => clone(event));
    },
  };
}

export function getThemenradarRepo(): ThemenradarRepo {
  if (process.env.NODE_ENV === "test") {
    if (!mongoRepoSingleton) {
      mongoRepoSingleton = createInMemoryThemenradarRepo();
    }
    return mongoRepoSingleton;
  }

  if (!mongoRepoSingleton) {
    mongoRepoSingleton = createMongoThemenradarRepo();
  }
  return mongoRepoSingleton;
}

export function setThemenradarRepoForTests(repo: ThemenradarRepo | null) {
  if (process.env.NODE_ENV !== "test") return;
  mongoRepoSingleton = repo;
}

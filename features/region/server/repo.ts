import { coreCol } from "@core/db/triMongo";
import type {
  CommunitySignal,
  CommunitySignalReviewStatus,
  CommunitySignalType,
  RegionalActor,
  RegionalActorType,
  RegionalActorVerificationStatus,
} from "../contracts";

const REGIONAL_ACTORS_COLLECTION = "edebatte_region_actor_register";
const COMMUNITY_SIGNALS_COLLECTION = "edebatte_region_signal_inbox";

type RegionalActorDoc = {
  _id: string;
  actor: RegionalActor;
  createdAt: Date;
  updatedAt: Date;
};

type CommunitySignalDoc = {
  _id: string;
  signal: CommunitySignal;
  createdAt: Date;
  updatedAt: Date;
};

export type RegionalActorRepoListQuery = {
  regionId?: string | null;
  actorType?: RegionalActorType | "all";
  verificationStatus?: RegionalActorVerificationStatus | "all";
  sourceKind?: RegionalActor["sourceKind"] | "all";
  limit?: number;
};

export type CommunitySignalRepoListQuery = {
  regionId?: string | null;
  signalType?: CommunitySignalType | "all";
  reviewStatus?: CommunitySignalReviewStatus | "all";
  limit?: number;
};

export type RegionDataRepo = {
  listManualActors(query?: RegionalActorRepoListQuery): Promise<RegionalActor[]>;
  getManualActorById(id: string): Promise<RegionalActor | null>;
  upsertManualActor(actor: RegionalActor): Promise<void>;
  listSignals(query?: CommunitySignalRepoListQuery): Promise<CommunitySignal[]>;
  getSignalById(id: string): Promise<CommunitySignal | null>;
  upsertSignal(signal: CommunitySignal): Promise<void>;
};

let repoSingleton: RegionDataRepo | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeLimit(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 100;
  return Math.max(1, Math.min(2000, Math.floor(numeric)));
}

async function ensureMongoIndexes() {
  if (indexesReady) return;
  const actors = await coreCol<RegionalActorDoc>(REGIONAL_ACTORS_COLLECTION);
  const signals = await coreCol<CommunitySignalDoc>(COMMUNITY_SIGNALS_COLLECTION);
  await Promise.all([
    actors.createIndex({ "actor.regionId": 1, "actor.actorType": 1 }),
    actors.createIndex({ "actor.verificationStatus": 1, "actor.updatedAt": -1 }),
    signals.createIndex({ "signal.regionId": 1, "signal.reviewStatus": 1 }),
    signals.createIndex({ "signal.signalType": 1, "signal.updatedAt": -1 }),
  ]);
  indexesReady = true;
}

function mapActorDoc(doc: RegionalActorDoc | null): RegionalActor | null {
  if (!doc?.actor) return null;
  return clone(doc.actor);
}

function mapSignalDoc(doc: CommunitySignalDoc | null): CommunitySignal | null {
  if (!doc?.signal) return null;
  return clone(doc.signal);
}

export function createMongoRegionDataRepo(): RegionDataRepo {
  return {
    async listManualActors(query = {}) {
      await ensureMongoIndexes();
      const actors = await coreCol<RegionalActorDoc>(REGIONAL_ACTORS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (query.regionId?.trim()) filter["actor.regionId"] = query.regionId.trim();
      if (query.actorType && query.actorType !== "all") filter["actor.actorType"] = query.actorType;
      if (query.verificationStatus && query.verificationStatus !== "all") {
        filter["actor.verificationStatus"] = query.verificationStatus;
      }
      if (query.sourceKind && query.sourceKind !== "all") filter["actor.sourceKind"] = query.sourceKind;

      const docs = await actors
        .find(filter)
        .sort({ "actor.updatedAt": -1 })
        .limit(normalizeLimit(query.limit))
        .toArray();
      return docs
        .map((doc) => mapActorDoc(doc))
        .filter((entry): entry is RegionalActor => Boolean(entry));
    },

    async getManualActorById(id) {
      await ensureMongoIndexes();
      const actors = await coreCol<RegionalActorDoc>(REGIONAL_ACTORS_COLLECTION);
      const doc = await actors.findOne({ _id: id });
      return mapActorDoc(doc);
    },

    async upsertManualActor(actor) {
      await ensureMongoIndexes();
      const actors = await coreCol<RegionalActorDoc>(REGIONAL_ACTORS_COLLECTION);
      const now = new Date();
      await actors.updateOne(
        { _id: actor.id },
        {
          $set: {
            actor: clone(actor),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );
    },

    async listSignals(query = {}) {
      await ensureMongoIndexes();
      const signals = await coreCol<CommunitySignalDoc>(COMMUNITY_SIGNALS_COLLECTION);
      const filter: Record<string, unknown> = {};
      if (query.regionId?.trim()) filter["signal.regionId"] = query.regionId.trim();
      if (query.signalType && query.signalType !== "all") filter["signal.signalType"] = query.signalType;
      if (query.reviewStatus && query.reviewStatus !== "all") filter["signal.reviewStatus"] = query.reviewStatus;

      const docs = await signals
        .find(filter)
        .sort({ "signal.updatedAt": -1 })
        .limit(normalizeLimit(query.limit))
        .toArray();
      return docs
        .map((doc) => mapSignalDoc(doc))
        .filter((entry): entry is CommunitySignal => Boolean(entry));
    },

    async getSignalById(id) {
      await ensureMongoIndexes();
      const signals = await coreCol<CommunitySignalDoc>(COMMUNITY_SIGNALS_COLLECTION);
      const doc = await signals.findOne({ _id: id });
      return mapSignalDoc(doc);
    },

    async upsertSignal(signal) {
      await ensureMongoIndexes();
      const signals = await coreCol<CommunitySignalDoc>(COMMUNITY_SIGNALS_COLLECTION);
      const now = new Date();
      await signals.updateOne(
        { _id: signal.id },
        {
          $set: {
            signal: clone(signal),
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );
    },
  };
}

export function createInMemoryRegionDataRepo(seed?: {
  actors?: RegionalActor[];
  signals?: CommunitySignal[];
}): RegionDataRepo {
  const actors = new Map<string, RegionalActor>();
  const signals = new Map<string, CommunitySignal>();

  for (const actor of seed?.actors ?? []) actors.set(actor.id, clone(actor));
  for (const signal of seed?.signals ?? []) signals.set(signal.id, clone(signal));

  return {
    async listManualActors(query = {}) {
      const limit = normalizeLimit(query.limit);
      return Array.from(actors.values())
        .map((entry) => clone(entry))
        .filter((entry) => (query.regionId?.trim() ? entry.regionId === query.regionId.trim() : true))
        .filter((entry) => (query.actorType && query.actorType !== "all" ? entry.actorType === query.actorType : true))
        .filter((entry) =>
          query.verificationStatus && query.verificationStatus !== "all"
            ? entry.verificationStatus === query.verificationStatus
            : true,
        )
        .filter((entry) => (query.sourceKind && query.sourceKind !== "all" ? entry.sourceKind === query.sourceKind : true))
        .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
        .slice(0, limit);
    },

    async getManualActorById(id) {
      const actor = actors.get(id);
      return actor ? clone(actor) : null;
    },

    async upsertManualActor(actor) {
      actors.set(actor.id, clone(actor));
    },

    async listSignals(query = {}) {
      const limit = normalizeLimit(query.limit);
      return Array.from(signals.values())
        .map((entry) => clone(entry))
        .filter((entry) => (query.regionId?.trim() ? entry.regionId === query.regionId.trim() : true))
        .filter((entry) => (query.signalType && query.signalType !== "all" ? entry.signalType === query.signalType : true))
        .filter((entry) =>
          query.reviewStatus && query.reviewStatus !== "all"
            ? entry.reviewStatus === query.reviewStatus
            : true,
        )
        .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
        .slice(0, limit);
    },

    async getSignalById(id) {
      const signal = signals.get(id);
      return signal ? clone(signal) : null;
    },

    async upsertSignal(signal) {
      signals.set(signal.id, clone(signal));
    },
  };
}

export function getRegionDataRepo(): RegionDataRepo {
  if (process.env.VITEST) {
    if (!repoSingleton) repoSingleton = createInMemoryRegionDataRepo();
    return repoSingleton;
  }

  if (!repoSingleton) {
    repoSingleton = createMongoRegionDataRepo();
  }
  return repoSingleton;
}

export function setRegionDataRepoForTests(repo: RegionDataRepo | null) {
  repoSingleton = repo;
}

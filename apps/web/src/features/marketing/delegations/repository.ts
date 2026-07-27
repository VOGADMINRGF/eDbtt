import { coreCol, shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { getMarketingRegistry } from "@/features/marketing/registry/data";
import {
  MarketingDelegationRecordSchema,
  MarketingDelegationRequestSchema,
  type MarketingDelegationAgentRole,
  type MarketingDelegationRecord,
  type MarketingDelegationRequest,
} from "./contracts";

const COLLECTION = "marketing_delegation_records";

export type MarketingDelegationPersistenceState = {
  mode: "persistent_primary" | "in_memory_fallback";
  productionTruth: boolean;
  label: string;
};

export type MarketingDelegationRepository = {
  save(record: MarketingDelegationRecord): Promise<void>;
  get(id: string): Promise<MarketingDelegationRecord | null>;
  list(): Promise<MarketingDelegationRecord[]>;
  getPersistenceState(): MarketingDelegationPersistenceState;
};

let repositorySingleton: MarketingDelegationRepository | null = null;
let indexesReady = false;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function persistenceState(mode: MarketingDelegationPersistenceState["mode"]): MarketingDelegationPersistenceState {
  const productionTruth = mode === "persistent_primary";
  return {
    mode,
    productionTruth,
    label: productionTruth ? "Dauerhaft gespeichert" : "Nur für diese Laufzeit gespeichert",
  };
}

async function ensureIndexes() {
  if (indexesReady) return;
  const collection = await coreCol(COLLECTION);
  await Promise.all([
    collection.createIndex({ itemType: 1, itemId: 1, agentRole: 1 }, { unique: true }),
    collection.createIndex({ status: 1, updatedAt: -1 }),
  ]).catch(() => undefined);
  indexesReady = true;
}

function createMongoRepository(): MarketingDelegationRepository {
  return {
    async save(record) {
      await ensureIndexes();
      const collection = await coreCol<any>(COLLECTION);
      await collection.updateOne(
        { _id: record.id },
        { $set: { _id: record.id, ...clone(record) } },
        { upsert: true },
      );
    },
    async get(id) {
      await ensureIndexes();
      const collection = await coreCol<any>(COLLECTION);
      const document = await collection.findOne({ _id: id });
      if (!document) return null;
      const { _id: _ignored, ...record } = document;
      return MarketingDelegationRecordSchema.parse(record);
    },
    async list() {
      await ensureIndexes();
      const collection = await coreCol<any>(COLLECTION);
      const documents = await collection.find({}).sort({ updatedAt: -1 }).toArray();
      return documents.map((document) => {
        const { _id: _ignored, ...record } = document;
        return MarketingDelegationRecordSchema.parse(record);
      });
    },
    getPersistenceState() {
      return persistenceState("persistent_primary");
    },
  };
}

export function createInMemoryMarketingDelegationRepository(
  seed: MarketingDelegationRecord[] = [],
): MarketingDelegationRepository {
  const records = new Map(seed.map((record) => [record.id, clone(record)]));
  return {
    async save(record) {
      records.set(record.id, clone(record));
    },
    async get(id) {
      const record = records.get(id);
      return record ? clone(record) : null;
    },
    async list() {
      return [...records.values()]
        .map((record) => clone(record))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },
    getPersistenceState() {
      return persistenceState("in_memory_fallback");
    },
  };
}

function getRepository() {
  if (shouldUseInMemoryMongoFallback()) {
    if (!repositorySingleton) repositorySingleton = createInMemoryMarketingDelegationRepository();
    return repositorySingleton;
  }
  if (!repositorySingleton) repositorySingleton = createMongoRepository();
  return repositorySingleton;
}

export function setMarketingDelegationRepositoryForTests(repository: MarketingDelegationRepository | null) {
  repositorySingleton = repository;
  indexesReady = false;
}

export function getMarketingDelegationPersistenceState() {
  return getRepository().getPersistenceState();
}

export async function listMarketingDelegations() {
  return getRepository().list();
}

export async function createMarketingDelegation(
  input: MarketingDelegationRequest & { requestedByUserId: string },
) {
  const request = MarketingDelegationRequestSchema.parse({
    itemType: input.itemType,
    itemId: input.itemId,
    agentRole: input.agentRole,
  });
  const requestedByUserId = String(input.requestedByUserId ?? "").trim();
  if (!requestedByUserId) throw new Error("marketing_delegation_actor_required");

  const registry = getMarketingRegistry();
  const campaign = request.itemType === "campaign"
    ? registry.campaigns.find((item) => item.id === request.itemId)
    : null;
  const opportunity = request.itemType === "opportunity"
    ? registry.opportunities.find((item) => item.id === request.itemId)
    : null;
  const itemTitle = campaign?.title ?? opportunity?.title;
  const itemSummary = campaign?.description ?? opportunity?.summary;

  if (!itemTitle || !itemSummary) throw new Error("marketing_delegation_item_not_found");

  const id = `marketing-delegation-${stableHash(
    `${request.itemType}:${request.itemId}:${request.agentRole}`,
  ).slice(0, 20)}`;
  const timestamp = new Date().toISOString();
  const record = MarketingDelegationRecordSchema.parse({
    id,
    itemType: request.itemType,
    itemId: request.itemId,
    itemTitle,
    agentRole: request.agentRole,
    status: "queued",
    goal: buildGoal(request.itemType, itemTitle, itemSummary),
    expectedOutputs: expectedOutputsFor(request.agentRole),
    requestedByUserId,
    requestedAt: timestamp,
    updatedAt: timestamp,
    requiresHumanReview: true,
    autoExecute: false,
    autoPublish: false,
  });

  await getRepository().save(record);
  return record;
}

function buildGoal(itemType: MarketingDelegationRequest["itemType"], title: string, summary: string) {
  const noun = itemType === "campaign" ? "Kampagne" : "Marketingchance";
  return `${noun} „${title}“ auf Basis der vorhandenen Evidenz weiterbearbeiten. ${summary} Zielgruppe, Botschaft, CTA, benötigte Assets, Messziel und offene Entscheidungen nachvollziehbar aufbereiten. Keine unbelegten Aussagen und keine Veröffentlichung ohne menschliche Freigabe.`;
}

function expectedOutputsFor(agentRole: MarketingDelegationAgentRole) {
  switch (agentRole) {
    case "research_operator":
      return [
        "Evidenz- und Quellenlage mit erkennbaren Lücken",
        "zu prüfende Claims, Gegenpositionen und Unsicherheiten",
        "konkrete Rechercheempfehlung mit Reviewbedarf",
      ];
    case "content_operator":
      return [
        "klare Kernbotschaft und Zielgruppenansprache",
        "benötigte Content- und Asset-Varianten je Sprache/Kanal",
        "Review-Checkliste ohne Veröffentlichung",
      ];
    case "analytics_operator":
      return [
        "Primary KPI und höchstens vier unterstützende Kennzahlen",
        "Messplan mit Datenqualität und Attribution",
        "Entscheidungslogik für Keep, Improve, Scale, Pause oder Stop",
      ];
    case "marketing_operator":
    default:
      return [
        "entscheidungsfertiger Kampagnen- oder Opportunity-Brief",
        "priorisierte nächste Schritte und benötigte Assets",
        "offene Entscheidungen, Risiken und Reviewpunkte",
      ];
  }
}

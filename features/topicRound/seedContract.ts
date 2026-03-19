import { ObjectId, coreCol } from "@core/db/triMongo";

export type RoundSeedContractStatus = "review_required";

type ProtocolEventRef = {
  id: string;
  title?: string | null;
  startAt?: string | null;
};

type RoundSeedContractDoc = {
  _id?: ObjectId;
  contractId: string;
  protocolEntryId: ObjectId;
  qrSetCode: string;
  status: RoundSeedContractStatus;
  source: {
    sourceType: "protocol";
    anlassraumId: string | null;
    dossierId: string | null;
    protocolEntryId: string;
    qrSetCode: string;
    eventRefs: ProtocolEventRef[];
  };
  seed: {
    title: string;
    topicKey: string | null;
    summary: string;
    questions: string[];
    options: string[];
    followUpPrompts: string[];
    tags: string[];
  };
  readiness: {
    hasAnlassraum: boolean;
    hasDossier: boolean;
    hasQuestions: boolean;
    hasOptionHints: boolean;
    requiresManualReview: true;
    completenessScore: number;
  };
  provenance: {
    sourceType: "protocol";
    actorId: string | null;
    timestamp: string;
  };
  createdBy: string | null;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoundSeedContractSummary = {
  contractId: string;
  status: RoundSeedContractStatus;
  readiness: RoundSeedContractDoc["readiness"];
  updatedAt: string | null;
};

type CreateProtocolRoundSeedInput = {
  protocolEntryId: ObjectId | string;
  qrSetCode: string;
  anlassraumId?: ObjectId | string | null;
  dossierId?: ObjectId | string | null;
  eventRefs?: ProtocolEventRef[];
  title?: string | null;
  topicKey?: string | null;
  summary: string;
  openQuestions?: string[];
  decisions?: string[];
  nextSteps?: string[];
  tags?: string[];
  createdBy?: string | null;
};

const ROUND_SEED_CONTRACTS_COLLECTION = "round_seed_contracts";

const ensured = {
  contracts: false,
};

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}

function toOptionalHex(value: ObjectId | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value).toHexString();
}

function normalizeTextList(values: string[] | undefined, maxEntries = 20, maxLength = 280) {
  const dedupe = new Set<string>();
  const out: string[] = [];
  for (const value of values ?? []) {
    const normalized = String(value || "").trim().slice(0, maxLength);
    if (!normalized || dedupe.has(normalized)) continue;
    dedupe.add(normalized);
    out.push(normalized);
    if (out.length >= maxEntries) break;
  }
  return out;
}

function normalizeEventRefs(values: ProtocolEventRef[] | undefined): ProtocolEventRef[] {
  const out: ProtocolEventRef[] = [];
  const seen = new Set<string>();
  for (const item of values ?? []) {
    const id = String(item?.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      title: item?.title ? String(item.title).slice(0, 240) : null,
      startAt: item?.startAt ? String(item.startAt) : null,
    });
    if (out.length >= 10) break;
  }
  return out;
}

function normalizeTitle(value: string | null | undefined) {
  const title = String(value || "").trim().slice(0, 200);
  return title || "Round Seed aus Event-Protokoll";
}

function toSummary(doc: RoundSeedContractDoc | null): RoundSeedContractSummary | null {
  if (!doc) return null;
  return {
    contractId: doc.contractId,
    status: doc.status,
    readiness: doc.readiness,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

async function roundSeedContractsCol() {
  if (!ensured.contracts) {
    const col = await coreCol<RoundSeedContractDoc>(ROUND_SEED_CONTRACTS_COLLECTION);
    await col.createIndex({ protocolEntryId: 1 }, { unique: true });
    await col.createIndex({ qrSetCode: 1, updatedAt: -1 });
    await col.createIndex({ "source.anlassraumId": 1, updatedAt: -1 }, { sparse: true });
    ensured.contracts = true;
    return col;
  }
  return coreCol<RoundSeedContractDoc>(ROUND_SEED_CONTRACTS_COLLECTION);
}

export async function createProtocolRoundSeedContract(
  input: CreateProtocolRoundSeedInput,
): Promise<RoundSeedContractSummary> {
  const protocolEntryId = toObjectId(input.protocolEntryId);
  const contractId = `rsc_${protocolEntryId.toHexString()}`;
  const now = new Date();

  const questions = normalizeTextList(input.openQuestions, 30, 320);
  const options = normalizeTextList(input.decisions, 12, 200);
  const followUpPrompts = normalizeTextList(input.nextSteps, 20, 260);
  const tags = normalizeTextList(input.tags, 30, 64);
  const eventRefs = normalizeEventRefs(input.eventRefs);
  const anlassraumId = toOptionalHex(input.anlassraumId);
  const dossierId = toOptionalHex(input.dossierId);
  const summary = String(input.summary || "").trim().slice(0, 4000);
  const readiness = {
    hasAnlassraum: !!anlassraumId,
    hasDossier: !!dossierId,
    hasQuestions: questions.length > 0,
    hasOptionHints: options.length >= 2,
    requiresManualReview: true as const,
    completenessScore: 0,
  };
  const readinessScoreRaw = [
    readiness.hasAnlassraum,
    readiness.hasDossier,
    readiness.hasQuestions,
    readiness.hasOptionHints,
  ].filter(Boolean).length;
  readiness.completenessScore = Math.round((readinessScoreRaw / 4) * 100);

  const contracts = await roundSeedContractsCol();
  await contracts.updateOne(
    { protocolEntryId },
    {
      $set: {
        qrSetCode: String(input.qrSetCode || "").trim(),
        status: "review_required",
        source: {
          sourceType: "protocol",
          anlassraumId,
          dossierId,
          protocolEntryId: protocolEntryId.toHexString(),
          qrSetCode: String(input.qrSetCode || "").trim(),
          eventRefs,
        },
        seed: {
          title: normalizeTitle(input.title),
          topicKey: input.topicKey ? String(input.topicKey).slice(0, 80) : null,
          summary,
          questions,
          options,
          followUpPrompts,
          tags,
        },
        readiness,
        provenance: {
          sourceType: "protocol",
          actorId: input.createdBy ? String(input.createdBy).trim() : null,
          timestamp: now.toISOString(),
        },
        createdBy: input.createdBy ? String(input.createdBy).trim() : null,
        reviewedBy: null,
        updatedAt: now,
      },
      $setOnInsert: {
        contractId,
        protocolEntryId,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const saved = await contracts.findOne({ protocolEntryId });
  const summaryOut = toSummary(saved);
  if (!summaryOut) {
    throw new Error("round_seed_contract_not_persisted");
  }
  return summaryOut;
}

export async function getLatestRoundSeedContractByCode(code: string) {
  const contracts = await roundSeedContractsCol();
  const item = await contracts
    .find({ qrSetCode: String(code || "").trim() })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next();
  return toSummary(item);
}

export async function countRoundSeedContractsByCode(code: string) {
  const contracts = await roundSeedContractsCol();
  return contracts.countDocuments({ qrSetCode: String(code || "").trim() });
}

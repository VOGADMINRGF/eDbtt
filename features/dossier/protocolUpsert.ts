import { ObjectId, coreCol } from "@core/db/triMongo";
import { dossierSuggestionsCol } from "./db";
import type { SuggestionType } from "./schemas";

export type ProtocolDossierUpsertStatus =
  | "mapped_to_existing_dossier"
  | "pending_dossier_link";

type ProtocolEventRef = {
  id: string;
  title?: string | null;
  startAt?: string | null;
};

type ProtocolDossierUpsertContractDoc = {
  _id?: ObjectId;
  contractId: string;
  protocolEntryId: ObjectId;
  qrSetCode: string;
  anlassraumId: string | null;
  targetDossierId: string | null;
  status: ProtocolDossierUpsertStatus;
  material: {
    summaryNotes: string[];
    openQuestions: string[];
    decisions: string[];
    nextSteps: string[];
    tags: string[];
    eventRefs: ProtocolEventRef[];
  };
  suggestionCount: number;
  provenance: {
    sourceType: "protocol";
    protocolEntryId: string;
    qrSetCode: string;
    anlassraumId: string | null;
    eventIds: string[];
    actorId: string | null;
    timestamp: string;
  };
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ProtocolDossierUpsertContractSummary = {
  contractId: string;
  status: ProtocolDossierUpsertStatus;
  targetDossierId: string | null;
  suggestionCount: number;
  updatedAt: string | null;
};

type CreateProtocolDossierUpsertInput = {
  protocolEntryId: ObjectId | string;
  qrSetCode: string;
  anlassraumId?: ObjectId | string | null;
  dossierId?: ObjectId | string | null;
  summary: string;
  openQuestions?: string[];
  decisions?: string[];
  nextSteps?: string[];
  tags?: string[];
  eventRefs?: ProtocolEventRef[];
  createdBy?: string | null;
};

const DOSSIER_UPSERT_CONTRACTS_COLLECTION = "dossier_upsert_contracts";

const ensured = {
  contracts: false,
};

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

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}

function toOptionalObjectId(value: ObjectId | string | null | undefined): ObjectId | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}

function toOptionalHex(value: ObjectId | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value).toHexString();
}

async function dossierUpsertContractsCol() {
  if (!ensured.contracts) {
    const col = await coreCol<ProtocolDossierUpsertContractDoc>(
      DOSSIER_UPSERT_CONTRACTS_COLLECTION,
    );
    await col.createIndex({ protocolEntryId: 1 }, { unique: true });
    await col.createIndex({ qrSetCode: 1, updatedAt: -1 });
    await col.createIndex({ targetDossierId: 1, status: 1 }, { sparse: true });
    ensured.contracts = true;
    return col;
  }
  return coreCol<ProtocolDossierUpsertContractDoc>(DOSSIER_UPSERT_CONTRACTS_COLLECTION);
}

async function upsertPendingSuggestion(input: {
  dossierId: string;
  suggestionId: string;
  type: SuggestionType;
  payload: Record<string, unknown>;
  now: Date;
}) {
  const suggestions = await dossierSuggestionsCol();
  const prev = await suggestions.findOneAndUpdate(
    { dossierId: input.dossierId, suggestionId: input.suggestionId },
    {
      $set: {
        type: input.type,
        payload: input.payload,
        status: "pending",
        updatedAt: input.now,
      },
      $setOnInsert: {
        dossierId: input.dossierId,
        suggestionId: input.suggestionId,
        createdAt: input.now,
      },
    },
    { upsert: true, returnDocument: "before", includeResultMetadata: true },
  );
  return !prev.value;
}

async function upsertDossierSuggestions(input: {
  dossierId: string;
  contractId: string;
  protocolEntryId: string;
  summary: string;
  openQuestions: string[];
  decisions: string[];
  nextSteps: string[];
  tags: string[];
  provenance: Record<string, unknown>;
  now: Date;
}) {
  let created = 0;
  const prefix = input.protocolEntryId.slice(-10);

  if (input.summary) {
    const createdNow = await upsertPendingSuggestion({
      dossierId: input.dossierId,
      suggestionId: `qr_${prefix}_summary`,
      type: "flag",
      payload: {
        contractId: input.contractId,
        category: "summary_note",
        text: input.summary,
        tags: input.tags,
        provenance: input.provenance,
      },
      now: input.now,
    });
    if (createdNow) created += 1;
  }

  for (const [idx, question] of input.openQuestions.entries()) {
    const createdNow = await upsertPendingSuggestion({
      dossierId: input.dossierId,
      suggestionId: `qr_${prefix}_question_${idx + 1}`,
      type: "question",
      payload: {
        contractId: input.contractId,
        category: "open_question",
        text: question,
        provenance: input.provenance,
      },
      now: input.now,
    });
    if (createdNow) created += 1;
  }

  for (const [idx, decision] of input.decisions.entries()) {
    const createdNow = await upsertPendingSuggestion({
      dossierId: input.dossierId,
      suggestionId: `qr_${prefix}_decision_${idx + 1}`,
      type: "claim",
      payload: {
        contractId: input.contractId,
        category: "decision",
        text: decision,
        provenance: input.provenance,
      },
      now: input.now,
    });
    if (createdNow) created += 1;
  }

  for (const [idx, nextStep] of input.nextSteps.entries()) {
    const createdNow = await upsertPendingSuggestion({
      dossierId: input.dossierId,
      suggestionId: `qr_${prefix}_next_${idx + 1}`,
      type: "flag",
      payload: {
        contractId: input.contractId,
        category: "next_step",
        text: nextStep,
        provenance: input.provenance,
      },
      now: input.now,
    });
    if (createdNow) created += 1;
  }

  return created;
}

function toSummary(
  contract: ProtocolDossierUpsertContractDoc | null,
): ProtocolDossierUpsertContractSummary | null {
  if (!contract) return null;
  return {
    contractId: contract.contractId,
    status: contract.status,
    targetDossierId: contract.targetDossierId ?? null,
    suggestionCount: Number(contract.suggestionCount ?? 0),
    updatedAt: contract.updatedAt?.toISOString?.() ?? null,
  };
}

export async function createProtocolDossierUpsertContract(
  input: CreateProtocolDossierUpsertInput,
): Promise<ProtocolDossierUpsertContractSummary> {
  const protocolEntryId = toObjectId(input.protocolEntryId);
  const now = new Date();
  const contractId = `dupc_${protocolEntryId.toHexString()}`;

  const summary = String(input.summary || "").trim().slice(0, 4000);
  const openQuestions = normalizeTextList(input.openQuestions, 30, 320);
  const decisions = normalizeTextList(input.decisions, 30, 320);
  const nextSteps = normalizeTextList(input.nextSteps, 30, 320);
  const tags = normalizeTextList(input.tags, 30, 64);
  const eventRefs = normalizeEventRefs(input.eventRefs);
  const anlassraumId = toOptionalHex(input.anlassraumId);
  const dossierId = toOptionalObjectId(input.dossierId)?.toHexString() ?? null;
  const status: ProtocolDossierUpsertStatus = dossierId
    ? "mapped_to_existing_dossier"
    : "pending_dossier_link";
  const provenance = {
    sourceType: "protocol" as const,
    protocolEntryId: protocolEntryId.toHexString(),
    qrSetCode: String(input.qrSetCode || "").trim(),
    anlassraumId,
    eventIds: eventRefs.map((item) => item.id),
    actorId: input.createdBy ? String(input.createdBy).trim() : null,
    timestamp: now.toISOString(),
  };

  let suggestionCount = 0;
  if (dossierId) {
    suggestionCount = await upsertDossierSuggestions({
      dossierId,
      contractId,
      protocolEntryId: protocolEntryId.toHexString(),
      summary,
      openQuestions,
      decisions,
      nextSteps,
      tags,
      provenance,
      now,
    });
  }

  const contracts = await dossierUpsertContractsCol();
  await contracts.updateOne(
    { protocolEntryId },
    {
      $set: {
        qrSetCode: String(input.qrSetCode || "").trim(),
        anlassraumId,
        targetDossierId: dossierId,
        status,
        material: {
          summaryNotes: summary ? [summary] : [],
          openQuestions,
          decisions,
          nextSteps,
          tags,
          eventRefs,
        },
        suggestionCount,
        provenance,
        createdBy: input.createdBy ? String(input.createdBy).trim() : null,
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
    throw new Error("dossier_upsert_contract_not_persisted");
  }
  return summaryOut;
}

export async function getLatestDossierUpsertContractByCode(code: string) {
  const contracts = await dossierUpsertContractsCol();
  const item = await contracts
    .find({ qrSetCode: String(code || "").trim() })
    .sort({ updatedAt: -1 })
    .limit(1)
    .next();
  return toSummary(item);
}

export async function countDossierUpsertContractsByCode(code: string) {
  const contracts = await dossierUpsertContractsCol();
  return contracts.countDocuments({ qrSetCode: String(code || "").trim() });
}

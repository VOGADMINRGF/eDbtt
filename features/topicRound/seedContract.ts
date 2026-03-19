import { ObjectId, coreCol } from "@core/db/triMongo";
import { anlassraumCol } from "@features/anlassraum/db";
import { canActorAccessAnlassraum } from "@features/anlassraum/governance";
import type { GovernanceActor } from "@features/trust/types";

export type RoundSeedContractStatus = "review_required" | "draft_created" | "rejected";

export type RoundSeedContractAction = "created" | "handoff" | "rejected" | "backfilled";

type ProtocolEventRef = {
  id: string;
  title?: string | null;
  startAt?: string | null;
};

type RoundSeedContractAuditEntry = {
  action: RoundSeedContractAction;
  contractId: string;
  sourceType: "protocol";
  qrSetCode: string;
  protocolEntryId: string;
  anlassraumId: string | null;
  dossierId: string | null;
  actorId: string | null;
  timestamp: string;
  details?: Record<string, unknown>;
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
  roundDraftId: string | null;
  createdBy: string | null;
  reviewedBy: string | null;
  handedOffBy: string | null;
  handedOffAt: Date | null;
  rejectedBy: string | null;
  rejectedAt: Date | null;
  lastAction: RoundSeedContractAction;
  lastActionBy: string | null;
  lastActionAt: Date;
  lastActionNote: string | null;
  auditTrail: RoundSeedContractAuditEntry[];
  createdAt: Date;
  updatedAt: Date;
};

type RoundSeedDraftDoc = {
  _id?: ObjectId;
  roundDraftId: string;
  sourceContractId: string;
  status: "draft";
  visibility: "internal";
  publishState: "manual_review_required";
  source: {
    sourceType: "protocol";
    contractId: string;
    qrSetCode: string;
    protocolEntryId: string;
    anlassraumId: string | null;
    dossierId: string | null;
    eventRefs: ProtocolEventRef[];
  };
  seed: RoundSeedContractDoc["seed"];
  readiness: RoundSeedContractDoc["readiness"];
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoundSeedContractSummary = {
  contractId: string;
  status: RoundSeedContractStatus;
  readiness: RoundSeedContractDoc["readiness"];
  roundDraftId: string | null;
  lastAction: RoundSeedContractAction;
  lastActionAt: string | null;
  updatedAt: string | null;
};

export type RoundSeedContractDetail = RoundSeedContractSummary & {
  qrSetCode: string;
  source: RoundSeedContractDoc["source"];
  seed: RoundSeedContractDoc["seed"];
  provenance: RoundSeedContractDoc["provenance"];
  createdBy: string | null;
  reviewedBy: string | null;
  handedOffBy: string | null;
  handedOffAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  lastActionBy: string | null;
  lastActionNote: string | null;
  auditTrail: RoundSeedContractAuditEntry[];
  createdAt: string | null;
};

export type RoundSeedDraftSummary = {
  roundDraftId: string;
  sourceContractId: string;
  status: "draft";
  visibility: "internal";
  publishState: "manual_review_required";
  createdAt: string | null;
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

type ListRoundSeedContractsInput = {
  status?: RoundSeedContractStatus;
  qrSetCode?: string;
  anlassraumId?: string;
  limit?: number;
};

type ListLegacyRoundSeedContractsInput = {
  limit?: number;
};

type HandoffRoundSeedContractInput = {
  contractId: string;
  actor: GovernanceActor;
  actionNote?: string | null;
};

type RejectRoundSeedContractInput = {
  contractId: string;
  actor: GovernanceActor;
  reason?: string | null;
};

type BackfillRoundSeedContractInput = {
  contractId: string;
  actor: GovernanceActor;
  anlassraumId?: string | null;
  dossierId?: string | null;
  actionNote?: string | null;
};

const ROUND_SEED_CONTRACTS_COLLECTION = "round_seed_contracts";
const ROUND_SEED_DRAFTS_COLLECTION = "round_seed_drafts";

const ensured = {
  contracts: false,
  drafts: false,
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

function normalizeContractId(value: string) {
  return String(value || "").trim();
}

function normalizeListLimit(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 40;
  return Math.max(1, Math.min(100, Math.floor(value)));
}

async function resolveDossierHex(value: string | null | undefined): Promise<string | null> {
  const normalized = String(value || "").trim();
  if (!normalized) return null;

  if (ObjectId.isValid(normalized)) {
    const asId = new ObjectId(normalized);
    const hit = await (await coreCol("dossiers")).findOne(
      { _id: asId },
      { projection: { _id: 1 } },
    );
    return hit?._id?.toHexString?.() ?? null;
  }

  const hit = await (await coreCol("dossiers")).findOne(
    { $or: [{ dossierId: normalized }, { statementId: normalized }] } as Record<string, unknown>,
    { projection: { _id: 1 } },
  );
  return hit?._id?.toHexString?.() ?? null;
}

function computeReadiness(input: { anlassraumId: string | null; dossierId: string | null; questions: string[]; options: string[] }) {
  const readiness = {
    hasAnlassraum: !!input.anlassraumId,
    hasDossier: !!input.dossierId,
    hasQuestions: input.questions.length > 0,
    hasOptionHints: input.options.length >= 2,
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
  return readiness;
}

function appendAuditEntry(
  contract: RoundSeedContractDoc,
  entry: RoundSeedContractAuditEntry,
): RoundSeedContractAuditEntry[] {
  const trail = Array.isArray(contract.auditTrail) ? contract.auditTrail : [];
  return [...trail, entry].slice(-50);
}

function toSummary(doc: RoundSeedContractDoc | null): RoundSeedContractSummary | null {
  if (!doc) return null;
  return {
    contractId: doc.contractId,
    status: doc.status,
    readiness: doc.readiness,
    roundDraftId: doc.roundDraftId ?? null,
    lastAction: doc.lastAction,
    lastActionAt: doc.lastActionAt?.toISOString?.() ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

function toDetail(doc: RoundSeedContractDoc | null): RoundSeedContractDetail | null {
  if (!doc) return null;
  const summary = toSummary(doc);
  if (!summary) return null;
  return {
    ...summary,
    qrSetCode: doc.qrSetCode,
    source: doc.source,
    seed: doc.seed,
    provenance: doc.provenance,
    createdBy: doc.createdBy,
    reviewedBy: doc.reviewedBy,
    handedOffBy: doc.handedOffBy,
    handedOffAt: doc.handedOffAt?.toISOString?.() ?? null,
    rejectedBy: doc.rejectedBy,
    rejectedAt: doc.rejectedAt?.toISOString?.() ?? null,
    lastActionBy: doc.lastActionBy,
    lastActionNote: doc.lastActionNote,
    auditTrail: Array.isArray(doc.auditTrail) ? doc.auditTrail : [],
    createdAt: doc.createdAt?.toISOString?.() ?? null,
  };
}

function toDraftSummary(doc: RoundSeedDraftDoc | null): RoundSeedDraftSummary | null {
  if (!doc) return null;
  return {
    roundDraftId: doc.roundDraftId,
    sourceContractId: doc.sourceContractId,
    status: doc.status,
    visibility: doc.visibility,
    publishState: doc.publishState,
    createdAt: doc.createdAt?.toISOString?.() ?? null,
    updatedAt: doc.updatedAt?.toISOString?.() ?? null,
  };
}

async function roundSeedContractsCol() {
  if (!ensured.contracts) {
    const col = await coreCol<RoundSeedContractDoc>(ROUND_SEED_CONTRACTS_COLLECTION);
    await col.createIndex({ contractId: 1 }, { unique: true });
    await col.createIndex({ protocolEntryId: 1 }, { unique: true });
    await col.createIndex({ qrSetCode: 1, updatedAt: -1 });
    await col.createIndex({ status: 1, updatedAt: -1 });
    await col.createIndex({ "source.anlassraumId": 1, updatedAt: -1 }, { sparse: true });
    ensured.contracts = true;
    return col;
  }
  return coreCol<RoundSeedContractDoc>(ROUND_SEED_CONTRACTS_COLLECTION);
}

async function roundSeedDraftsCol() {
  if (!ensured.drafts) {
    const col = await coreCol<RoundSeedDraftDoc>(ROUND_SEED_DRAFTS_COLLECTION);
    await col.createIndex({ roundDraftId: 1 }, { unique: true });
    await col.createIndex({ sourceContractId: 1 }, { unique: true });
    await col.createIndex({ status: 1, updatedAt: -1 });
    await col.createIndex({ "source.qrSetCode": 1, updatedAt: -1 });
    ensured.drafts = true;
    return col;
  }
  return coreCol<RoundSeedDraftDoc>(ROUND_SEED_DRAFTS_COLLECTION);
}

async function resolveAccessContext(contract: RoundSeedContractDoc) {
  const id = String(contract.source?.anlassraumId || "").trim();
  if (!ObjectId.isValid(id)) return null;
  return (await anlassraumCol()).findOne({ _id: new ObjectId(id) });
}

async function assertActorCanAccessContract(
  contract: RoundSeedContractDoc,
  actor: GovernanceActor,
  action: "read" | "review",
) {
  if (actor.isAdmin || actor.role === "admin") return;
  if (actor.role === "community") {
    throw new Error("actor_scope_forbidden");
  }
  const room = await resolveAccessContext(contract);
  if (!room) {
    throw new Error("actor_scope_requires_anlassraum");
  }
  const allowed = canActorAccessAnlassraum(room, actor, action);
  if (!allowed) {
    throw new Error("actor_scope_forbidden");
  }
}

function assertAdminActor(actor: GovernanceActor) {
  if (actor.isAdmin || actor.role === "admin") return;
  throw new Error("forbidden_scope");
}

async function canActorReadContract(
  contract: RoundSeedContractDoc,
  actor: GovernanceActor,
  roomById: Map<string, Awaited<ReturnType<typeof resolveAccessContext>>>,
) {
  if (actor.isAdmin || actor.role === "admin") return true;
  if (actor.role === "community") return false;
  const roomId = String(contract.source?.anlassraumId || "").trim();
  if (!roomId) return false;
  const room = roomById.get(roomId);
  if (!room) return false;
  return canActorAccessAnlassraum(room, actor, "read");
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
  const readiness = computeReadiness({ anlassraumId, dossierId, questions, options });

  const auditEntry: RoundSeedContractAuditEntry = {
    action: "created",
    contractId,
    sourceType: "protocol",
    qrSetCode: String(input.qrSetCode || "").trim(),
    protocolEntryId: protocolEntryId.toHexString(),
    anlassraumId,
    dossierId,
    actorId: input.createdBy ? String(input.createdBy).trim() : null,
    timestamp: now.toISOString(),
  };

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
        roundDraftId: null,
        createdBy: input.createdBy ? String(input.createdBy).trim() : null,
        reviewedBy: null,
        handedOffBy: null,
        handedOffAt: null,
        rejectedBy: null,
        rejectedAt: null,
        lastAction: "created",
        lastActionBy: input.createdBy ? String(input.createdBy).trim() : null,
        lastActionAt: now,
        lastActionNote: null,
        auditTrail: [auditEntry],
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

export async function listRoundSeedContractsAuthorized(
  actor: GovernanceActor,
  input: ListRoundSeedContractsInput = {},
): Promise<RoundSeedContractSummary[]> {
  const contracts = await roundSeedContractsCol();
  const filter: Record<string, unknown> = {};

  if (input.status) filter.status = input.status;
  if (input.qrSetCode) filter.qrSetCode = String(input.qrSetCode).trim();
  if (input.anlassraumId) filter["source.anlassraumId"] = String(input.anlassraumId).trim();

  const docs = await contracts
    .find(filter)
    .sort({ updatedAt: -1 })
    .limit(normalizeListLimit(input.limit))
    .toArray();

  if (actor.isAdmin || actor.role === "admin") {
    return docs.map((item) => toSummary(item)).filter((item): item is RoundSeedContractSummary => !!item);
  }

  const roomIds = Array.from(
    new Set(docs.map((item) => String(item.source?.anlassraumId || "").trim()).filter(Boolean)),
  );
  const roomObjectIds = roomIds
    .filter((value) => ObjectId.isValid(value))
    .map((value) => new ObjectId(value));
  const rooms = roomObjectIds.length
    ? await (await anlassraumCol()).find({ _id: { $in: roomObjectIds } }).toArray()
    : [];
  const roomById = new Map<string, (typeof rooms)[number]>(
    rooms.map((room) => [room._id?.toHexString?.() ?? "", room]),
  );

  const visible: RoundSeedContractSummary[] = [];
  for (const contract of docs) {
    // eslint-disable-next-line no-await-in-loop
    const allowed = await canActorReadContract(contract, actor, roomById);
    if (!allowed) continue;
    const summary = toSummary(contract);
    if (summary) visible.push(summary);
  }

  return visible;
}

export async function getRoundSeedContractAuthorized(
  actor: GovernanceActor,
  contractId: string,
): Promise<RoundSeedContractDetail> {
  const normalizedId = normalizeContractId(contractId);
  if (!normalizedId) {
    throw new Error("invalid_contract_id");
  }

  const contracts = await roundSeedContractsCol();
  const contract = await contracts.findOne({ contractId: normalizedId });
  if (!contract) {
    throw new Error("contract_not_found");
  }

  await assertActorCanAccessContract(contract, actor, "read");

  const detail = toDetail(contract);
  if (!detail) {
    throw new Error("contract_not_found");
  }

  return detail;
}

export async function handoffRoundSeedContractAuthorized(input: HandoffRoundSeedContractInput) {
  const normalizedId = normalizeContractId(input.contractId);
  if (!normalizedId) {
    throw new Error("invalid_contract_id");
  }

  const contracts = await roundSeedContractsCol();
  const contract = await contracts.findOne({ contractId: normalizedId });
  if (!contract) {
    throw new Error("contract_not_found");
  }

  await assertActorCanAccessContract(contract, input.actor, "review");

  if (contract.status === "draft_created" && contract.roundDraftId) {
    throw new Error("contract_already_handed_off");
  }
  if (contract.status === "rejected") {
    throw new Error("contract_rejected");
  }

  const now = new Date();
  const draftId = contract.roundDraftId || `rndraft_${contract.source.protocolEntryId}`;
  const drafts = await roundSeedDraftsCol();

  await drafts.updateOne(
    { sourceContractId: contract.contractId },
    {
      $set: {
        updatedAt: now,
      },
      $setOnInsert: {
        roundDraftId: draftId,
        sourceContractId: contract.contractId,
        status: "draft",
        visibility: "internal",
        publishState: "manual_review_required",
        source: {
          sourceType: "protocol",
          contractId: contract.contractId,
          qrSetCode: contract.source.qrSetCode,
          protocolEntryId: contract.source.protocolEntryId,
          anlassraumId: contract.source.anlassraumId,
          dossierId: contract.source.dossierId,
          eventRefs: contract.source.eventRefs,
        },
        seed: contract.seed,
        readiness: contract.readiness,
        createdBy: input.actor.userId,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const draft = await drafts.findOne({ sourceContractId: contract.contractId });
  const roundDraftSummary = toDraftSummary(draft);
  if (!roundDraftSummary) {
    throw new Error("round_seed_draft_not_persisted");
  }

  const auditEntry: RoundSeedContractAuditEntry = {
    action: "handoff",
    contractId: contract.contractId,
    sourceType: "protocol",
    qrSetCode: contract.qrSetCode,
    protocolEntryId: contract.source.protocolEntryId,
    anlassraumId: contract.source.anlassraumId,
    dossierId: contract.source.dossierId,
    actorId: input.actor.userId,
    timestamp: now.toISOString(),
    details: {
      roundDraftId: roundDraftSummary.roundDraftId,
    },
  };

  await contracts.updateOne(
    { _id: contract._id },
    {
      $set: {
        status: "draft_created",
        roundDraftId: roundDraftSummary.roundDraftId,
        reviewedBy: input.actor.userId,
        handedOffBy: input.actor.userId,
        handedOffAt: now,
        lastAction: "handoff",
        lastActionBy: input.actor.userId,
        lastActionAt: now,
        lastActionNote: input.actionNote ? String(input.actionNote).slice(0, 400) : null,
        auditTrail: appendAuditEntry(contract, auditEntry),
        updatedAt: now,
      },
    },
  );

  const updated = await contracts.findOne({ _id: contract._id });
  const detail = toDetail(updated);
  if (!detail) {
    throw new Error("contract_not_found_after_update");
  }

  return {
    contract: detail,
    roundDraft: roundDraftSummary,
  };
}

export async function rejectRoundSeedContractAuthorized(input: RejectRoundSeedContractInput) {
  const normalizedId = normalizeContractId(input.contractId);
  if (!normalizedId) {
    throw new Error("invalid_contract_id");
  }

  const contracts = await roundSeedContractsCol();
  const contract = await contracts.findOne({ contractId: normalizedId });
  if (!contract) {
    throw new Error("contract_not_found");
  }

  await assertActorCanAccessContract(contract, input.actor, "review");

  if (contract.status === "rejected") {
    throw new Error("contract_already_rejected");
  }
  if (contract.status === "draft_created" && contract.roundDraftId) {
    throw new Error("contract_already_handed_off");
  }

  const now = new Date();
  const auditEntry: RoundSeedContractAuditEntry = {
    action: "rejected",
    contractId: contract.contractId,
    sourceType: "protocol",
    qrSetCode: contract.qrSetCode,
    protocolEntryId: contract.source.protocolEntryId,
    anlassraumId: contract.source.anlassraumId,
    dossierId: contract.source.dossierId,
    actorId: input.actor.userId,
    timestamp: now.toISOString(),
    details: {
      reason: input.reason ? String(input.reason).slice(0, 400) : null,
    },
  };

  await contracts.updateOne(
    { _id: contract._id },
    {
      $set: {
        status: "rejected",
        rejectedBy: input.actor.userId,
        rejectedAt: now,
        lastAction: "rejected",
        lastActionBy: input.actor.userId,
        lastActionAt: now,
        lastActionNote: input.reason ? String(input.reason).slice(0, 400) : null,
        auditTrail: appendAuditEntry(contract, auditEntry),
        updatedAt: now,
      },
    },
  );

  const updated = await contracts.findOne({ _id: contract._id });
  const detail = toDetail(updated);
  if (!detail) {
    throw new Error("contract_not_found_after_update");
  }

  return {
    contract: detail,
  };
}

export async function listLegacyRoundSeedContractsAuthorized(
  actor: GovernanceActor,
  input: ListLegacyRoundSeedContractsInput = {},
): Promise<RoundSeedContractSummary[]> {
  assertAdminActor(actor);

  const contracts = await roundSeedContractsCol();
  const docs = await contracts
    .find({
      $or: [
        { "source.anlassraumId": null },
        { "source.anlassraumId": { $exists: false } },
        { "source.dossierId": null },
        { "source.dossierId": { $exists: false } },
        { "provenance.actorId": null },
        { "provenance.actorId": { $exists: false } },
      ],
    })
    .sort({ updatedAt: -1 })
    .limit(normalizeListLimit(input.limit))
    .toArray();

  return docs.map((item) => toSummary(item)).filter((item): item is RoundSeedContractSummary => !!item);
}

export async function backfillRoundSeedContractAuthorized(input: BackfillRoundSeedContractInput) {
  assertAdminActor(input.actor);

  const normalizedId = normalizeContractId(input.contractId);
  if (!normalizedId) {
    throw new Error("invalid_contract_id");
  }

  const contracts = await roundSeedContractsCol();
  const contract = await contracts.findOne({ contractId: normalizedId });
  if (!contract) {
    throw new Error("contract_not_found");
  }
  if (contract.status === "draft_created" && contract.roundDraftId) {
    throw new Error("contract_already_handed_off");
  }

  let nextAnlassraumId = contract.source.anlassraumId ?? null;
  if (typeof input.anlassraumId !== "undefined") {
    const normalizedRoomId = String(input.anlassraumId || "").trim();
    if (!ObjectId.isValid(normalizedRoomId)) {
      throw new Error("invalid_anlassraum_id");
    }
    const room = await (await anlassraumCol()).findOne({ _id: new ObjectId(normalizedRoomId) });
    if (!room) {
      throw new Error("anlassraum_not_found");
    }
    nextAnlassraumId = normalizedRoomId;
  }

  let nextDossierId = contract.source.dossierId ?? null;
  if (typeof input.dossierId !== "undefined") {
    const resolved = await resolveDossierHex(input.dossierId);
    if (!resolved) {
      throw new Error("invalid_dossier_target");
    }
    nextDossierId = resolved;
  }

  const nextReadiness = computeReadiness({
    anlassraumId: nextAnlassraumId,
    dossierId: nextDossierId,
    questions: contract.seed.questions,
    options: contract.seed.options,
  });

  const changed =
    (nextAnlassraumId ?? null) !== (contract.source.anlassraumId ?? null) ||
    (nextDossierId ?? null) !== (contract.source.dossierId ?? null) ||
    JSON.stringify(nextReadiness) !== JSON.stringify(contract.readiness);
  if (!changed) {
    throw new Error("contract_backfill_requires_change");
  }

  const now = new Date();
  const auditEntry: RoundSeedContractAuditEntry = {
    action: "backfilled",
    contractId: contract.contractId,
    sourceType: "protocol",
    qrSetCode: contract.qrSetCode,
    protocolEntryId: contract.source.protocolEntryId,
    anlassraumId: nextAnlassraumId,
    dossierId: nextDossierId,
    actorId: input.actor.userId,
    timestamp: now.toISOString(),
    details: {
      previousAnlassraumId: contract.source.anlassraumId ?? null,
      previousDossierId: contract.source.dossierId ?? null,
      readinessBefore: contract.readiness,
      readinessAfter: nextReadiness,
    },
  };

  await contracts.updateOne(
    { _id: contract._id },
    {
      $set: {
        source: {
          ...contract.source,
          anlassraumId: nextAnlassraumId,
          dossierId: nextDossierId,
        },
        readiness: nextReadiness,
        lastAction: "backfilled",
        lastActionBy: input.actor.userId,
        lastActionAt: now,
        lastActionNote: input.actionNote ? String(input.actionNote).slice(0, 400) : null,
        auditTrail: appendAuditEntry(contract, auditEntry),
        updatedAt: now,
      },
    },
  );

  const updated = await contracts.findOne({ _id: contract._id });
  const detail = toDetail(updated);
  if (!detail) {
    throw new Error("contract_not_found_after_update");
  }

  return {
    contract: detail,
    backfillResult: {
      anlassraumId: nextAnlassraumId,
      dossierId: nextDossierId,
      readiness: nextReadiness,
    },
  };
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

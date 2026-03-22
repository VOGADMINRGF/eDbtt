import { ObjectId } from "@core/db/triMongo";
import { buildRegionKey, normalizeRegionCode } from "@core/regions/types";
import { ensureSystemEntityForRegion } from "@features/entities/service";
import { normalizeGermanSlug } from "@features/common/utils/textNormalization";
import type {
  StatementCandidate,
  StatementCandidateAnalyzeResultDoc,
  VoteDraftDoc,
} from "@features/feeds/types";
import type { GovernanceActor, RoomType } from "@features/trust/types";
import {
  anlassraumCol,
  anlassraumSourceLinksCol,
  anlassraumStructureCol,
  outputSeedCol,
} from "./db";
import { assertActorCanCreateAnlassraum } from "./governance";
import type {
  AnlassraumDoc,
  AnlassraumMaturity,
  AnlassraumOriginType,
  AnlassraumScope,
  AnlassraumSourceMode,
  AnlassraumStatus,
  AnlassraumStructureDoc,
  AnlassraumType,
  OutputSeedDoc,
  OutputSeedType,
} from "./types";

type EnsureAnlassraumInput = {
  draftId: ObjectId;
  draft: VoteDraftDoc;
  candidate: StatementCandidate;
  analyzeResult: StatementCandidateAnalyzeResultDoc;
};

type EnsureAnlassraumResult = {
  anlassraumId: ObjectId;
  created: boolean;
};

type CreateManualAnlassraumInput = {
  entityId: ObjectId | string;
  type: AnlassraumType;
  title: string;
  summary: string;
  topicKey: string;
  regionKey?: string | null;
  scope: AnlassraumScope;
  decisionScope?: AnlassraumScope;
  ownerType: AnlassraumDoc["ownerType"];
  ownerId: string;
  originType?: AnlassraumOriginType;
  roomType?: RoomType;
  createdBy: string;
  actor?: GovernanceActor;
};

export async function ensureAnlassraumFromFeedDraft(
  input: EnsureAnlassraumInput,
): Promise<EnsureAnlassraumResult> {
  if (!input.candidate._id) {
    throw new Error("ensureAnlassraumFromFeedDraft: candidate._id fehlt");
  }

  const links = await anlassraumSourceLinksCol();
  const existing = await links.findOne({
    statementCandidateId: input.candidate._id,
  });

  if (existing?.anlassraumId) {
    await ensureGovernanceDefaults(existing.anlassraumId, input);
    await upsertStructure(existing.anlassraumId, input);
    await ensureOutputSeeds(existing.anlassraumId, input);
    return { anlassraumId: existing.anlassraumId, created: false };
  }

  const rooms = await anlassraumCol();
  const now = new Date();
  const topicKey = deriveTopicKey(input.draft, input.candidate);
  const regionKey = deriveRegionKey(input.draft.regionCode ?? input.candidate.regionCode ?? null);
  const scope = scopeFromRegion(regionKey);
  const summary = deriveSummary(input);
  const entity = await ensureSystemEntityForRegion({
    regionKey,
    scope,
    ownerId: "feed-pipeline",
  });
  const clusterKey = buildClusterKey({
    regionKey,
    topicKey,
    publishedAt: input.candidate.publishedAt ?? null,
    sourceMode: "feed",
  });

  const room: AnlassraumDoc = {
    entityId: entity.entityId,
    type: deriveType(input),
    title: input.draft.title || input.candidate.sourceTitle || "Anlassraum",
    summary,
    slug: buildSlug(input.draft.title || input.candidate.sourceTitle || "anlassraum", input.candidate._id.toHexString()),
    topicKey,
    regionKey,
    regionCode: input.draft.regionCode ?? input.candidate.regionCode ?? null,
    scope,
    decisionScope: scope,
    ownerType: "system",
    ownerId: "feed-pipeline",
    stewardUserId: null,
    sourceMode: "feed" as AnlassraumSourceMode,
    originType: "feed",
    status: deriveStatus(input),
    maturity: deriveMaturity(input),
    roomType: "community",
    contentTrust: input.candidate.sourceName ? "source_based" : "unverified",
    parentAnlassraumId: null,
    dossierId: null,
    dossierType: null,
    isPublic: false,
    createdBy: "system:feeds",
    reviewedBy: null,
    approvedBy: null,
    relevanceScore: deriveRelevanceScore(input),
    reviewMode: deriveReviewMode(input),
    riskFlags: deriveRiskFlags(input),
    clusterKey,
    kind: "event",
    pipeline: input.draft.pipeline ?? "feeds_to_statementCandidate",
    publishedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const inserted = await rooms.insertOne(room);
  const anlassraumId = inserted.insertedId;

  try {
    await links.insertOne({
      anlassraumId,
      statementCandidateId: input.candidate._id,
      ingestItemId: null,
      sourceUrl: input.candidate.sourceUrl ?? input.draft.sourceUrl ?? null,
      sourceWeight: 1,
      role: "primary",
      publisher: input.candidate.sourceName ?? null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (err: unknown) {
    const code =
      typeof err === "object" && err && "code" in err
        ? (err as { code?: number }).code
        : undefined;
    if (code === 11000) {
      const winner = await links.findOne({
        statementCandidateId: input.candidate._id,
      });
      if (winner?.anlassraumId) {
        await rooms.deleteOne({ _id: anlassraumId }).catch(() => {});
        await ensureGovernanceDefaults(winner.anlassraumId, input);
        await upsertStructure(winner.anlassraumId, input);
        await ensureOutputSeeds(winner.anlassraumId, input);
        return { anlassraumId: winner.anlassraumId, created: false };
      }
    }
    throw err;
  }

  await upsertStructure(anlassraumId, input);
  await ensureOutputSeeds(anlassraumId, input);

  return { anlassraumId, created: true };
}

export async function createManualAnlassraum(
  input: CreateManualAnlassraumInput,
): Promise<{ anlassraumId: ObjectId }> {
  const rooms = await anlassraumCol();
  const now = new Date();
  const title = String(input.title || "").trim();
  const topicKey = normalizeTopicKey(input.topicKey);
  if (!title) {
    throw new Error("anlassraum_title_required");
  }
  const roomType = input.roomType ?? "community";

  if (input.actor) {
    assertActorCanCreateAnlassraum(input.actor, {
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      roomType,
      originType: input.originType ?? "manual",
    });
  }

  const doc: AnlassraumDoc = {
    entityId: toObjectId(input.entityId),
    type: input.type,
    title,
    summary: String(input.summary || "").trim(),
    slug: buildSlug(title, new ObjectId().toHexString()),
    topicKey,
    regionKey: normalizeRegionKey(input.regionKey ?? null),
    regionCode: null,
    scope: input.scope,
    decisionScope: input.decisionScope ?? input.scope,
    ownerType: input.ownerType,
    ownerId: String(input.ownerId || "").trim(),
    stewardUserId: String(input.createdBy || "").trim() || null,
    sourceMode: "manual",
    originType: input.originType ?? "manual",
    status: "draft",
    maturity: "signal",
    roomType,
    contentTrust: "unverified",
    parentAnlassraumId: null,
    dossierId: null,
    dossierType: null,
    isPublic: false,
    createdBy: String(input.createdBy || "").trim() || "system:manual",
    reviewedBy: null,
    approvedBy: null,
    relevanceScore: 0,
    reviewMode: "standard",
    riskFlags: [],
    clusterKey: null,
    kind: "issue",
    pipeline: "manual",
    publishedAt: null,
    archivedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  if (!doc.ownerId) {
    throw new Error("anlassraum_owner_id_required");
  }

  const inserted = await rooms.insertOne(doc);
  return { anlassraumId: inserted.insertedId };
}

function deriveStatus(input: EnsureAnlassraumInput): AnlassraumStatus {
  const riskFlags = deriveRiskFlags(input);
  if (riskFlags.length >= 2) return "draft";
  return "curated";
}

function deriveReviewMode(input: EnsureAnlassraumInput): AnlassraumDoc["reviewMode"] {
  const riskFlags = deriveRiskFlags(input);
  if (riskFlags.length >= 3) return "strict";
  if (riskFlags.length >= 1) return "standard";
  return "light";
}

function deriveRelevanceScore(input: EnsureAnlassraumInput): number {
  let score = 0.35;
  if (input.candidate.sourceName) score += 0.1;
  if (input.candidate.sourceSummary || input.candidate.sourceContent) score += 0.1;
  if ((input.analyzeResult.claims ?? []).length >= 2) score += 0.15;
  if ((input.analyzeResult.questions ?? []).length >= 2) score += 0.1;
  if (input.candidate.regionCode || input.draft.regionCode) score += 0.1;
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

function deriveRiskFlags(input: EnsureAnlassraumInput): string[] {
  const out = new Set<string>();
  if (!input.candidate.sourceName) out.add("missing_primary_source");
  if (!input.candidate.sourceSummary && !input.candidate.sourceContent) out.add("thin_source_context");
  if ((input.analyzeResult.claims ?? []).length <= 1) out.add("low_claim_density");
  if ((input.analyzeResult.questions ?? []).length === 0) out.add("missing_open_questions");
  return Array.from(out);
}

function deriveMaturity(input: EnsureAnlassraumInput): AnlassraumMaturity {
  const claimCount = (input.analyzeResult.claims ?? []).length;
  const questionCount = (input.analyzeResult.questions ?? []).length;
  if (claimCount >= 4 && questionCount >= 2) return "structured";
  if (claimCount >= 2) return "emerging";
  return "signal";
}

function deriveType(input: EnsureAnlassraumInput): AnlassraumType {
  const sourceType = String(input.candidate.sourceType || "").toLowerCase();
  if (sourceType.includes("investig")) return "investigation";
  if (sourceType.includes("crisis")) return "crisis";
  return "event";
}

function deriveTopicKey(draft: VoteDraftDoc, candidate: StatementCandidate): string {
  const fromTags = Array.isArray(draft.tags) ? draft.tags.find((tag) => !!String(tag || "").trim()) : null;
  const fromCandidate = candidate.topic ?? null;
  const fromClaim = draft.claims?.find((claim) => !!claim?.topic)?.topic ?? null;
  return normalizeTopicKey(String(fromTags ?? fromCandidate ?? fromClaim ?? "allgemein"));
}

function normalizeTopicKey(value: string): string {
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9äöüß-]/g, "")
      .slice(0, 64) || "allgemein"
  );
}

function deriveSummary(input: EnsureAnlassraumInput): string {
  const value = String(
    input.draft.summary ??
      input.candidate.sourceSummary ??
      input.candidate.sourceContent?.slice(0, 400) ??
      "",
  ).trim();
  return value || "Signalraum aus Feed-Kandidat";
}

function deriveRegionKey(region: VoteDraftDoc["regionCode"] | StatementCandidate["regionCode"] | null): string | null {
  const normalized = normalizeRegionCode(region ?? null);
  if (!normalized) return null;
  return buildRegionKey(normalized);
}

function scopeFromRegion(regionKey: string | null): AnlassraumScope {
  if (!regionKey) return "global";
  const parts = regionKey.split(":");
  if (parts[2]) return "local";
  if (parts[1]) return "regional";
  return "national";
}

function buildClusterKey(input: {
  regionKey: string | null;
  topicKey: string;
  publishedAt?: string | null;
  sourceMode: AnlassraumSourceMode;
}): string {
  const date = parseDate(input.publishedAt) ?? new Date();
  const bucket = toWindowBucket(date, 72);
  return [input.sourceMode, input.regionKey ?? "global", input.topicKey, bucket].join("|");
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toWindowBucket(date: Date, hours: number): string {
  const windowMs = Math.max(1, hours) * 60 * 60 * 1000;
  const floored = new Date(Math.floor(date.getTime() / windowMs) * windowMs);
  return [
    floored.getUTCFullYear(),
    String(floored.getUTCMonth() + 1).padStart(2, "0"),
    String(floored.getUTCDate()).padStart(2, "0"),
    String(floored.getUTCHours()).padStart(2, "0"),
  ].join("");
}

async function ensureGovernanceDefaults(anlassraumId: ObjectId, input: EnsureAnlassraumInput) {
  const rooms = await anlassraumCol();
  const existing = await rooms.findOne({ _id: anlassraumId });
  if (!existing) return;

  const now = new Date();
  const regionKey = existing.regionKey ?? deriveRegionKey(input.draft.regionCode ?? input.candidate.regionCode ?? null);
  const scope = existing.scope ?? scopeFromRegion(regionKey);
  const entity = existing.entityId
    ? { entityId: existing.entityId }
    : await ensureSystemEntityForRegion({
        regionKey,
        scope,
        ownerId: "feed-pipeline",
      });

  const patch: Partial<AnlassraumDoc> = {
    entityId: existing.entityId ?? entity.entityId,
    type: existing.type ?? deriveType(input),
    summary: existing.summary ?? deriveSummary(input),
    topicKey: existing.topicKey ?? deriveTopicKey(input.draft, input.candidate),
    regionKey: existing.regionKey ?? regionKey,
    scope: existing.scope ?? scope,
    decisionScope: existing.decisionScope ?? scope,
    ownerType: existing.ownerType ?? "system",
    ownerId: existing.ownerId ?? "feed-pipeline",
    stewardUserId: existing.stewardUserId ?? null,
    originType: existing.originType ?? "feed",
    maturity: existing.maturity ?? deriveMaturity(input),
    roomType: existing.roomType ?? "community",
    contentTrust: existing.contentTrust ?? "unverified",
    parentAnlassraumId: existing.parentAnlassraumId ?? null,
    dossierId: existing.dossierId ?? null,
    dossierType: existing.dossierType ?? null,
    isPublic: existing.isPublic ?? false,
    createdBy: existing.createdBy ?? "system:feeds",
    reviewedBy: existing.reviewedBy ?? null,
    approvedBy: existing.approvedBy ?? null,
    updatedAt: now,
  };

  await rooms.updateOne({ _id: anlassraumId }, { $set: patch });
}

async function upsertStructure(anlassraumId: ObjectId, input: EnsureAnlassraumInput) {
  const structures = await anlassraumStructureCol();
  const now = new Date();
  const evidenceSummary = String(
    input.draft.summary ??
      input.candidate.sourceSummary ??
      input.candidate.sourceContent?.slice(0, 400) ??
      "",
  ).slice(0, 500);

  const structure: AnlassraumStructureDoc = {
    anlassraumId,
    claims: input.draft.claims ?? input.analyzeResult.claims ?? [],
    notes: input.analyzeResult.notes ?? [],
    questions: input.analyzeResult.questions ?? [],
    knots: input.analyzeResult.knots ?? [],
    segments: deriveSegments(input),
    actors: deriveActors(input),
    evidenceSummary: evidenceSummary || null,
    riskFlags: deriveRiskFlags(input),
    createdAt: now,
    updatedAt: now,
  };

  await structures.updateOne(
    { anlassraumId },
    {
      $set: {
        claims: structure.claims,
        notes: structure.notes,
        questions: structure.questions,
        knots: structure.knots,
        segments: structure.segments,
        actors: structure.actors,
        evidenceSummary: structure.evidenceSummary,
        riskFlags: structure.riskFlags,
        updatedAt: now,
      },
      $setOnInsert: {
        anlassraumId,
        createdAt: now,
      },
    },
    { upsert: true },
  );
}

function deriveSegments(input: EnsureAnlassraumInput): string[] {
  const out = new Set<string>();
  for (const claim of input.draft.claims ?? []) {
    const domain = String(claim?.domain ?? "").trim();
    const topic = String(claim?.topic ?? "").trim();
    if (domain) out.add(domain);
    if (topic) out.add(topic);
  }
  if (!out.size) out.add("kernfrage");
  return Array.from(out).slice(0, 6);
}

function deriveActors(input: EnsureAnlassraumInput): string[] {
  const actors = new Set<string>();
  for (const claim of input.draft.claims ?? []) {
    const responsibility = String(claim?.responsibility ?? "").trim();
    if (responsibility) actors.add(responsibility);
  }
  if (input.candidate.sourceName) actors.add(input.candidate.sourceName);
  return Array.from(actors).slice(0, 10);
}

async function ensureOutputSeeds(anlassraumId: ObjectId, input: EnsureAnlassraumInput) {
  const seeds = await outputSeedCol();
  const now = new Date();
  const outputTypes = deriveOutputTypes(input);

  const ops = outputTypes.map((outputType) => {
    const doc: OutputSeedDoc = {
      anlassraumId,
      outputType,
      status: "draft",
      targetRegion: input.draft.regionCode ?? input.candidate.regionCode ?? null,
      targetAudience: audienceForOutput(outputType),
      reviewState: "pending",
      publishTarget: null,
      createdAt: now,
      updatedAt: now,
    };
    return {
      updateOne: {
        filter: { anlassraumId, outputType },
        update: {
          $setOnInsert: doc,
          $set: {
            updatedAt: now,
          },
        },
        upsert: true,
      },
    };
  });

  if (ops.length) await seeds.bulkWrite(ops, { ordered: false });
}

function deriveOutputTypes(input: EnsureAnlassraumInput): OutputSeedType[] {
  const out = new Set<OutputSeedType>(["round_seed", "dossier_seed"]);
  const sourceUrl = input.candidate.sourceUrl ?? input.draft.sourceUrl;
  if (sourceUrl) {
    out.add("embed_seed");
    out.add("social_seed");
  }
  if (input.draft.regionCode ?? input.candidate.regionCode) {
    out.add("regional_briefing_seed");
  }
  out.add("editorial_pitch_seed");
  return Array.from(out);
}

function audienceForOutput(type: OutputSeedType): string {
  if (type === "round_seed") return "citizens";
  if (type === "dossier_seed") return "journalism";
  if (type === "embed_seed") return "media";
  if (type === "social_seed") return "social";
  if (type === "regional_briefing_seed") return "municipality";
  return "editorial";
}

function buildSlug(title: string, fallbackId: string): string {
  const base = normalizeGermanSlug(title, { maxLength: 70, fallback: "" });
  if (!base) return `anlassraum-${fallbackId.slice(-8)}`;
  return `${base}-${fallbackId.slice(-6)}`;
}

function normalizeRegionKey(input: string | null): string | null {
  const value = String(input || "").trim();
  return value || null;
}

function toObjectId(value: ObjectId | string): ObjectId {
  return typeof value === "string" ? new ObjectId(value) : value;
}

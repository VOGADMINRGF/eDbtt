import { ObjectId } from "@core/db/triMongo";
import { buildRegionKey, normalizeRegionCode } from "@core/regions/types";
import type {
  StatementCandidate,
  StatementCandidateAnalyzeResultDoc,
  VoteDraftDoc,
} from "@features/feeds/types";
import {
  anlassraumCol,
  anlassraumSourceLinksCol,
  anlassraumStructureCol,
  outputSeedCol,
} from "./db";
import type {
  AnlassraumDoc,
  AnlassraumSourceMode,
  AnlassraumStatus,
  AnlassraumStructureDoc,
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
    await upsertStructure(existing.anlassraumId, input);
    await ensureOutputSeeds(existing.anlassraumId, input);
    return { anlassraumId: existing.anlassraumId, created: false };
  }

  const rooms = await anlassraumCol();
  const now = new Date();
  const topicKey = deriveTopicKey(input.draft, input.candidate);
  const regionKey = deriveRegionKey(input.draft.regionCode ?? input.candidate.regionCode ?? null);
  const clusterKey = buildClusterKey({
    regionKey,
    topicKey,
    publishedAt: input.candidate.publishedAt ?? null,
    sourceMode: "feed",
  });
  const room: AnlassraumDoc = {
    kind: "event",
    title: input.draft.title || input.candidate.sourceTitle || "Anlassraum",
    slug: buildSlug(input.draft.title || input.candidate.sourceTitle || "anlassraum", input.candidate._id.toHexString()),
    regionCode: input.draft.regionCode ?? input.candidate.regionCode ?? null,
    scope: scopeFromRegion(regionKey),
    topicKey,
    clusterKey,
    sourceMode: "feed" as AnlassraumSourceMode,
    status: deriveStatus(input),
    relevanceScore: deriveRelevanceScore(input),
    reviewMode: deriveReviewMode(input),
    riskFlags: deriveRiskFlags(input),
    pipeline: input.draft.pipeline ?? "feeds_to_statementCandidate",
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
  } catch (err: any) {
    if (err?.code === 11000) {
      const winner = await links.findOne({
        statementCandidateId: input.candidate._id,
      });
      if (winner?.anlassraumId) {
        await rooms.deleteOne({ _id: anlassraumId }).catch(() => {});
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

function deriveStatus(input: EnsureAnlassraumInput): AnlassraumStatus {
  const riskFlags = deriveRiskFlags(input);
  if (riskFlags.length >= 2) return "needs_editor_review";
  return "auto_ingested";
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

function deriveTopicKey(draft: VoteDraftDoc, candidate: StatementCandidate): string {
  const fromTags = Array.isArray(draft.tags) ? draft.tags.find((tag) => !!String(tag || "").trim()) : null;
  const fromCandidate = candidate.topic ?? null;
  const fromClaim = draft.claims?.find((claim) => !!claim?.topic)?.topic ?? null;
  const value = String(fromTags ?? fromCandidate ?? fromClaim ?? "allgemein")
    .toLowerCase()
    .trim();
  return value.replace(/\s+/g, "-").replace(/[^a-z0-9äöüß-]/g, "").slice(0, 64) || "allgemein";
}

function deriveRegionKey(region: VoteDraftDoc["regionCode"] | StatementCandidate["regionCode"] | null): string | null {
  const normalized = normalizeRegionCode(region ?? null);
  if (!normalized) return null;
  return buildRegionKey(normalized);
}

function scopeFromRegion(regionKey: string | null): string {
  if (!regionKey) return "global";
  const country = regionKey.split(":")[0]?.toUpperCase() ?? "GLOBAL";
  return country || "global";
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
  const base = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9äöüß-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);
  if (!base) return `anlassraum-${fallbackId.slice(-8)}`;
  return `${base}-${fallbackId.slice(-6)}`;
}

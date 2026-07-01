import { stableHash } from "@core/utils/hash";
import {
  COMMUNITY_SOURCE_REVIEW_CONTRIBUTION_KINDS,
  COMMUNITY_SOURCE_REVIEW_TARGETS,
  createCommunitySourceReviewContributionDraft,
  type CommunitySourceReviewContribution,
  type CommunitySourceReviewContributionKind,
  type CommunitySourceReviewTarget,
} from "@/features/create/communitySourceReviewContribution";
import {
  communitySourceReviewSubmissionRuntimeStatus,
  listCommunitySourceReviewRecords,
  persistCommunitySourceReviewContributionDraft,
  type CommunitySourceReviewSubmissionRuntimeStatus,
} from "@/features/create/communitySourceReviewServer";
import { getPublishedParticipationSpaceBySlugOrId } from "@/features/participation/publicParticipationSpaceRuntime";

const MAX_TITLE_LENGTH = 160;
const MAX_TEXT_LENGTH = 2400;
const MAX_CLAIM_TEXT_LENGTH = 320;
const MAX_SOURCE_REFS = 6;
const MAX_MATERIAL_REFS = 6;
const MAX_NOTES = 6;
const MAX_CONTEXT_LENGTH = 120;
const RECENT_REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000;
const RELATED_HISTORY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const COMMUNITY_SOURCE_REVIEW_PUBLIC_SUBMISSION_CODES = [
  "invalid_kind",
  "invalid_target",
  "missing_target_id",
  "missing_text",
  "missing_claim_context",
  "missing_source_reference",
  "invalid_source_reference",
  "invalid_material_reference",
  "invalid_participation_space",
  "participation_space_not_public",
  "public_runtime_lookup_failed",
  "duplicate_recent_submission",
  "honeypot_blocked",
] as const;

export type CommunitySourceReviewPublicSubmissionCode =
  (typeof COMMUNITY_SOURCE_REVIEW_PUBLIC_SUBMISSION_CODES)[number];

export type CommunitySourceReviewPublicSubmissionInput = {
  kind: string;
  target: string;
  targetId?: string | null;
  title?: string | null;
  text?: string | null;
  language?: string | null;
  claimText?: string | null;
  sourceRefs?: readonly string[];
  materialRefs?: readonly string[];
  notes?: readonly string[];
  participationSpaceSlugOrId?: string | null;
  honeypotValue?: string | null;
};

type NormalizedSubmission = {
  kind: CommunitySourceReviewContributionKind;
  target: CommunitySourceReviewTarget;
  targetId: string;
  title: string | null;
  text: string;
  language: string;
  claimText: string | null;
  sourceRefs: string[];
  materialRefs: string[];
  notes: string[];
  participationSpaceSlugOrId: string | null;
};

export type CommunitySourceReviewPublicSubmissionResult =
  | {
      ok: true;
      deduped: boolean;
      status: "pending_review" | "needs_moderation" | "duplicate_recent_submission";
      publicMessage: string;
      runtimeStatus: CommunitySourceReviewSubmissionRuntimeStatus;
      submissionReference: string;
      contribution: CommunitySourceReviewContribution;
      matchedPublicParticipationSpace:
        | {
            id: string;
            slug: string;
            title: string;
          }
        | null;
    }
  | {
      ok: false;
      status: "invalid_submission";
      publicMessage: string;
      runtimeStatus: CommunitySourceReviewSubmissionRuntimeStatus;
      codes: CommunitySourceReviewPublicSubmissionCode[];
    };

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values));
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "");
}

function sanitizeText(value: unknown, maxLength: number, preserveNewlines = false) {
  if (typeof value !== "string") return "";
  const stripped = stripHtml(value).replace(/\p{C}/gu, "");
  const normalized = preserveNewlines
    ? stripped
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .join("\n")
    : stripped.replace(/\s+/g, " ").trim();
  return normalized.slice(0, maxLength);
}

function sanitizeList(
  values: readonly string[] | undefined,
  maxItems: number,
  maxLength: number,
) {
  return unique(
    (values ?? [])
      .map((value) => sanitizeText(value, maxLength))
      .filter(Boolean)
      .slice(0, maxItems),
  );
}

function normalizeUrlList(
  values: readonly string[] | undefined,
  maxItems: number,
): { urls: string[]; invalid: boolean } {
  const urls: string[] = [];
  let invalid = false;

  for (const value of values ?? []) {
    const cleaned = sanitizeText(value, 600);
    if (!cleaned) continue;
    try {
      const parsed = new URL(cleaned);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        invalid = true;
        continue;
      }
      urls.push(parsed.toString());
    } catch {
      invalid = true;
    }
  }

  return {
    urls: unique(urls).slice(0, maxItems),
    invalid,
  };
}

function normalizeLanguage(value: string | null | undefined) {
  const cleaned = sanitizeText(value, 12).toLowerCase();
  return cleaned || "de";
}

function normalizeParticipationSpaceSlugOrId(value: string | null | undefined) {
  const cleaned = sanitizeText(value, 120);
  return cleaned || null;
}

function buildEffectiveTitle(input: NormalizedSubmission) {
  if (hasText(input.title)) return String(input.title).trim();
  const targetLabel =
    input.target === "handoff_review_item" ? "Prüfhinweis" : "Quellenhinweis";
  if (!hasText(input.claimText)) return targetLabel;
  return `${targetLabel}: ${String(input.claimText).trim().slice(0, 72)}`;
}

function buildFingerprint(input: NormalizedSubmission) {
  return stableHash(
    [
      input.kind,
      input.target,
      input.targetId,
      buildEffectiveTitle(input),
      input.text,
      input.claimText ?? "",
      input.language,
      input.sourceRefs.join("|"),
      input.materialRefs.join("|"),
      input.participationSpaceSlugOrId ?? "",
    ].join("::"),
  );
}

function buildPublicMessage(status: "pending_review" | "needs_moderation") {
  if (status === "needs_moderation") {
    return "Der Hinweis wurde aufgenommen und wird vor jeder weiteren Sichtbarkeit moderiert.";
  }
  return "Der Hinweis wurde aufgenommen und zur redaktionellen Prüfung vorgemerkt.";
}

function normalizeSubmission(
  input: CommunitySourceReviewPublicSubmissionInput,
): { ok: true; value: NormalizedSubmission } | { ok: false; codes: CommunitySourceReviewPublicSubmissionCode[] } {
  const codes: CommunitySourceReviewPublicSubmissionCode[] = [];
  const kind = sanitizeText(input.kind, 60) as CommunitySourceReviewContributionKind;
  const target = sanitizeText(input.target, 60) as CommunitySourceReviewTarget;
  const targetId = sanitizeText(input.targetId, 120);
  const title = sanitizeText(input.title, MAX_TITLE_LENGTH) || null;
  const text = sanitizeText(input.text, MAX_TEXT_LENGTH, true);
  const claimText = sanitizeText(input.claimText, MAX_CLAIM_TEXT_LENGTH) || null;
  const sourceRefs = normalizeUrlList(input.sourceRefs, MAX_SOURCE_REFS);
  const materialRefs = normalizeUrlList(input.materialRefs, MAX_MATERIAL_REFS);
  const notes = sanitizeList(input.notes, MAX_NOTES, 240);
  const normalized: NormalizedSubmission = {
    kind,
    target,
    targetId,
    title,
    text,
    language: normalizeLanguage(input.language),
    claimText,
    sourceRefs: sourceRefs.urls,
    materialRefs: materialRefs.urls,
    notes,
    participationSpaceSlugOrId: normalizeParticipationSpaceSlugOrId(
      input.participationSpaceSlugOrId,
    ),
  };

  if (!COMMUNITY_SOURCE_REVIEW_CONTRIBUTION_KINDS.includes(kind)) {
    codes.push("invalid_kind");
  }
  if (!COMMUNITY_SOURCE_REVIEW_TARGETS.includes(target)) {
    codes.push("invalid_target");
  }
  if (!targetId) {
    codes.push("missing_target_id");
  }
  if (!text) {
    codes.push("missing_text");
  }
  if (target === "claim" && !claimText) {
    codes.push("missing_claim_context");
  }
  if (
    (kind === "source_suggestion" || kind === "counter_source") &&
    sourceRefs.urls.length === 0
  ) {
    codes.push("missing_source_reference");
  }
  if (sourceRefs.invalid) {
    codes.push("invalid_source_reference");
  }
  if (materialRefs.invalid) {
    codes.push("invalid_material_reference");
  }

  if (codes.length > 0) {
    return { ok: false, codes: unique(codes) as CommunitySourceReviewPublicSubmissionCode[] };
  }

  return { ok: true, value: normalized };
}

function isRecent(timestamp: string, windowMs: number) {
  const parsed = Date.parse(timestamp);
  if (!Number.isFinite(parsed)) return false;
  return Date.now() - parsed <= windowMs;
}

function countRelatedHistory(
  normalized: NormalizedSubmission,
  records: Awaited<ReturnType<typeof listCommunitySourceReviewRecords>>,
) {
  return records.filter((record) => {
    if (!isRecent(record.createdAt, RELATED_HISTORY_WINDOW_MS)) return false;
    return (
      record.contribution.target === normalized.target &&
      record.contribution.targetId === normalized.targetId
    );
  }).length;
}

function findReplayMatch(
  normalized: NormalizedSubmission,
  records: Awaited<ReturnType<typeof listCommunitySourceReviewRecords>>,
) {
  const fingerprint = buildFingerprint(normalized);
  return (
    records.find((record) => {
      if (!isRecent(record.createdAt, RECENT_REPLAY_WINDOW_MS)) return false;
      return buildFingerprint({
        kind: record.contribution.kind,
        target: record.contribution.target,
        targetId: record.contribution.targetId ?? "",
        title: record.contribution.title,
        text: record.contribution.text,
        language: record.contribution.language,
        claimText: record.contribution.claimText,
        sourceRefs: record.contribution.sourceRefs,
        materialRefs: record.contribution.materialRefs,
        notes: [],
        participationSpaceSlugOrId:
          record.contribution.notes.find((note) =>
            note.startsWith("Öffentlicher Beteiligungsraum: "),
          )?.replace("Öffentlicher Beteiligungsraum: ", "") ?? null,
      }) === fingerprint;
    }) ?? null
  );
}

export async function submitPublicCommunitySourceReview(
  input: CommunitySourceReviewPublicSubmissionInput,
): Promise<CommunitySourceReviewPublicSubmissionResult> {
  const runtimeStatus = communitySourceReviewSubmissionRuntimeStatus();
  const honeypotValue = sanitizeText(input.honeypotValue, MAX_CONTEXT_LENGTH);
  if (honeypotValue) {
    return {
      ok: false,
      status: "invalid_submission",
      publicMessage:
        "Der Hinweis konnte in dieser Form nicht angenommen werden. Bitte prüfe die Eingabe und versuche es erneut.",
      runtimeStatus,
      codes: ["honeypot_blocked"],
    };
  }

  const normalized = normalizeSubmission(input);
  if (normalized.ok === false) {
    return {
      ok: false,
      status: "invalid_submission",
      publicMessage:
        "Der Hinweis ist noch nicht vollständig. Bitte ergänze die Pflichtangaben und versuche es erneut.",
      runtimeStatus,
      codes: normalized.codes,
    };
  }

  let matchedPublicParticipationSpace: {
    id: string;
    slug: string;
    title: string;
  } | null = null;

  if (normalized.value.participationSpaceSlugOrId) {
    const published = await getPublishedParticipationSpaceBySlugOrId(
      normalized.value.participationSpaceSlugOrId,
      { allowFixtureFallback: false },
    );
    if (published.status.source === "error") {
      return {
        ok: false,
        status: "invalid_submission",
        publicMessage:
          "Der Hinweis konnte gerade nicht sicher einem öffentlichen Beteiligungsraum zugeordnet werden. Bitte versuche es erneut.",
        runtimeStatus,
        codes: ["public_runtime_lookup_failed"],
      };
    }
    if (!published.detail) {
      return {
        ok: false,
        status: "invalid_submission",
        publicMessage:
          "Hinweise können nur an veröffentlichte öffentliche Beteiligungsräume angehängt werden.",
        runtimeStatus,
        codes: ["participation_space_not_public"],
      };
    }
    matchedPublicParticipationSpace = {
      id: published.detail.id,
      slug: published.detail.slug,
      title: published.detail.title,
    };
  }

  const records = await listCommunitySourceReviewRecords(200);
  const replay = findReplayMatch(normalized.value, records);
  if (replay) {
    return {
      ok: true,
      deduped: true,
      status: "duplicate_recent_submission",
      publicMessage:
        "Ein ähnlicher Hinweis ist bereits vorgemerkt und bleibt in redaktioneller Prüfung.",
      runtimeStatus,
      submissionReference: replay.id,
      contribution: replay.contribution,
      matchedPublicParticipationSpace,
    };
  }

  const relatedContributionCount = countRelatedHistory(normalized.value, records);
  const contextNotes = [
    ...normalized.value.notes,
    "Öffentlicher Intake: review-first API",
    matchedPublicParticipationSpace
      ? `Öffentlicher Beteiligungsraum: ${matchedPublicParticipationSpace.slug}`
      : null,
  ].filter(Boolean) as string[];

  const contribution = createCommunitySourceReviewContributionDraft({
    kind: normalized.value.kind,
    target: normalized.value.target,
    targetId: normalized.value.targetId,
    title: normalized.value.title,
    text: normalized.value.text,
    language: normalized.value.language,
    claimText: normalized.value.claimText,
    sourceRefs: normalized.value.sourceRefs,
    materialRefs: normalized.value.materialRefs,
    notes: contextNotes,
    relatedContributionCount,
    submittedAt: new Date().toISOString(),
  });

  await persistCommunitySourceReviewContributionDraft(contribution);

  return {
    ok: true,
    deduped: false,
    status: contribution.status === "needs_moderation" ? "needs_moderation" : "pending_review",
    publicMessage: buildPublicMessage(
      contribution.status === "needs_moderation" ? "needs_moderation" : "pending_review",
    ),
    runtimeStatus,
    submissionReference: contribution.id,
    contribution,
    matchedPublicParticipationSpace,
  };
}

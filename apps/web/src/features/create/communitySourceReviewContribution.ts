import type {
  CreateHandoffDraft,
  CreateHandoffDraftStatus,
  CreateHandoffDraftTarget,
} from "@/features/create/createHandoffDrafts";
import { createReviewQueueItemFromHandoffDraft } from "@/features/create/createHandoffReviewQueue";
import type { CreateHandoffReviewQueueItem } from "@/features/create/createHandoffReviewQueue";

export const COMMUNITY_SOURCE_REVIEW_CONTRIBUTION_KINDS = [
  "source_suggestion",
  "counter_source",
  "context_note",
  "lived_experience",
  "unclear_claim",
  "wording_clarification",
  "escalation_request",
] as const;

export type CommunitySourceReviewContributionKind =
  (typeof COMMUNITY_SOURCE_REVIEW_CONTRIBUTION_KINDS)[number];

export const COMMUNITY_SOURCE_REVIEW_STATUSES = [
  "draft",
  "submitted",
  "pending_review",
  "accepted_as_hint",
  "needs_moderation",
  "rejected",
] as const;

export type CommunitySourceReviewStatus =
  (typeof COMMUNITY_SOURCE_REVIEW_STATUSES)[number];

export const COMMUNITY_SOURCE_REVIEW_TARGETS = [
  "claim",
  "factcheck_request",
  "source_question",
  "handoff_review_item",
] as const;

export type CommunitySourceReviewTarget =
  (typeof COMMUNITY_SOURCE_REVIEW_TARGETS)[number];

export const COMMUNITY_SOURCE_REVIEW_CONTRIBUTION_BLOCKERS = [
  "missing_title",
  "missing_text",
  "missing_target_id",
  "missing_claim_context",
  "missing_source_reference",
  "contribution_verifies_claim",
  "contribution_marks_source_confirmed",
  "contribution_requests_publish",
  "contribution_requests_auto_merge",
  "contribution_requests_runtime_entity",
  "contribution_uses_majority_as_truth",
  "missing_runtime_contract",
] as const;

export type CommunitySourceReviewContributionBlocker =
  (typeof COMMUNITY_SOURCE_REVIEW_CONTRIBUTION_BLOCKERS)[number];

type CommunitySourceReviewModerationFlags = {
  verifiesClaim: boolean;
  marksSourceConfirmed: boolean;
  requestsPublish: boolean;
  requestsAutoMerge: boolean;
  requestsRuntimeEntity: boolean;
  usesMajorityAsTruth: boolean;
};

export type CommunitySourceReviewContribution = {
  id: string;
  kind: CommunitySourceReviewContributionKind;
  status: CommunitySourceReviewStatus;
  target: CommunitySourceReviewTarget;
  targetId: string | null;
  title: string;
  text: string;
  language: string;
  claimText: string | null;
  sourceRefs: string[];
  materialRefs: string[];
  notes: string[];
  relatedContributionCount: number;
  moderationFlags: CommunitySourceReviewModerationFlags;
  guardrails: {
    hintOnly: true;
    canVerifyClaim: false;
    canPublish: false;
    canAutoMerge: false;
    canCreateRuntimeEntity: false;
    canConfirmSource: false;
    countsMajorityAsTruth: false;
  };
  runtime: {
    reviewQueueKind: "create_handoff_review_queue";
    factcheckRuntimeKind: "factcheck_enqueue";
    pendingReviewMessage: string;
  };
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
};

type CreateCommunitySourceReviewContributionDraftInput = {
  id?: string;
  kind: CommunitySourceReviewContributionKind;
  status?: CommunitySourceReviewStatus;
  target: CommunitySourceReviewTarget;
  targetId?: string | null;
  title?: string | null;
  text: string;
  language?: string | null;
  claimText?: string | null;
  sourceRefs?: readonly string[];
  materialRefs?: readonly string[];
  notes?: readonly string[];
  relatedContributionCount?: number;
  moderationFlags?: Partial<CommunitySourceReviewModerationFlags>;
  createdAt?: string;
  updatedAt?: string;
  submittedAt?: string | null;
};

export type CommunitySourceReviewContributionValidationResult = {
  ok: boolean;
  blockers: CommunitySourceReviewContributionBlocker[];
  message: string;
};

export type CommunitySourceReviewQueueMapping = {
  contribution: CommunitySourceReviewContribution;
  previewStatus: "pending_review";
  previewMessage: string;
  reviewQueueItem: CreateHandoffReviewQueueItem;
  runtime:
    | {
        ok: true;
        blocked: false;
        blockers: [];
        status: "pending_review";
        message: string;
      }
    | {
        ok: false;
        blocked: true;
        blockers: CommunitySourceReviewContributionBlocker[];
        error: "blocked_unwired";
        status: "blocked_unwired";
        message: string;
      };
};

function nowIso() {
  return new Date().toISOString();
}

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildContributionId(input: CreateCommunitySourceReviewContributionDraftInput) {
  if (hasText(input.id)) return String(input.id).trim();
  const seed = `${input.kind}-${input.target}-${Date.now()}`;
  return `community-source-review-${seed.replace(/[^a-zA-Z0-9-]+/g, "-").toLowerCase()}`;
}

function buildTitle(
  input: CreateCommunitySourceReviewContributionDraftInput,
) {
  const explicitTitle = String(input.title ?? "").trim();
  if (explicitTitle) return explicitTitle;

  const targetLabel = input.target === "handoff_review_item"
    ? "Prüfhinweis"
    : "Quellenhinweis";
  const claimContext = String(input.claimText ?? "").trim();
  if (!claimContext) return targetLabel;
  return `${targetLabel}: ${claimContext.slice(0, 72)}`;
}

function toPreviewTarget(
  target: CommunitySourceReviewTarget,
): CreateHandoffDraftTarget {
  if (target === "handoff_review_item") return "editorial_review";
  return "factcheck_request";
}

function toPreviewDraftStatus(
  status: CommunitySourceReviewStatus,
): CreateHandoffDraftStatus {
  if (status === "rejected") return "rejected";
  if (status === "needs_moderation") return "needs_clarification";
  if (status === "accepted_as_hint") return "approved_for_setup";
  if (status === "submitted" || status === "pending_review") {
    return "submitted_for_review";
  }
  return "prepared";
}

function buildOpenQuestions(
  contribution: CommunitySourceReviewContribution,
) {
  const questions = [...contribution.notes];

  if (contribution.kind === "lived_experience") {
    questions.push("Erfahrung bleibt Einzelperspektive und ist kein repräsentativer Beleg.");
  }
  if (contribution.kind === "counter_source") {
    questions.push("Gegenquelle ist ein Prüfhinweis und widerlegt den Claim nicht automatisch.");
  }
  if (contribution.kind === "unclear_claim") {
    questions.push("Welche Formulierung oder Tatsachenbasis ist noch unklar?");
  }
  if (contribution.kind === "source_suggestion" && contribution.sourceRefs.length === 0) {
    questions.push("Welche Quelle sollte konkret nachgereicht werden?");
  }

  return unique(questions);
}

function buildPreviewSummary(
  contribution: CommunitySourceReviewContribution,
) {
  const kindLead: Record<CommunitySourceReviewContributionKind, string> = {
    source_suggestion: "Community-Quellenhinweis",
    counter_source: "Community-Gegenquelle",
    context_note: "Community-Kontext",
    lived_experience: "Community-Erfahrungsbericht",
    unclear_claim: "Community-Unklarheit",
    wording_clarification: "Community-Formulierungshinweis",
    escalation_request: "Community-Eskalationshinweis",
  };

  const base = `${kindLead[contribution.kind]}: ${contribution.text}`;
  if (contribution.kind === "lived_experience") {
    return `${base} Die Erfahrung bleibt ein Hinweis und kein repräsentativer Beleg.`;
  }
  if (contribution.kind === "counter_source") {
    return `${base} Gegenbelege bleiben prüfpflichtig und widerrufen keinen Claim automatisch.`;
  }
  return `${base} Der Hinweis bestätigt noch keine Wahrheit und bleibt redaktionell prüfpflichtig.`;
}

function buildPreviewDraft(
  contribution: CommunitySourceReviewContribution,
): CreateHandoffDraft {
  return {
    id: contribution.id,
    source: "manual_author_choice",
    target: toPreviewTarget(contribution.target),
    status: toPreviewDraftStatus(contribution.status),
    title: contribution.title,
    summary: buildPreviewSummary(contribution),
    authorStandpoint: null,
    topicTitle: contribution.claimText,
    relatedMatchId: contribution.targetId,
    relatedDialogOutcomeId: null,
    selectedPerspectiveIds: [],
    selectedBranchIds: [],
    selectedArgumentIds: [],
    authorProvidedSources: [...contribution.sourceRefs],
    authorProvidedExamples: contribution.kind === "lived_experience"
      ? [contribution.text]
      : [],
    openQuestions: buildOpenQuestions(contribution),
    requiresEditorialReview: true,
    requiresFactcheck: contribution.target !== "handoff_review_item",
    autoCreate: false,
    autoPublish: false,
    createdAt: contribution.createdAt,
    updatedAt: contribution.updatedAt,
  };
}

function buildRuntimeMessage(
  blockers: readonly CommunitySourceReviewContributionBlocker[],
) {
  if (blockers.length === 0) {
    return "Hinweis eingereicht – redaktionelle Prüfung offen.";
  }
  if (
    blockers.length === 1 &&
    blockers[0] === "missing_runtime_contract"
  ) {
    return "Hinweis vorbereitet – öffentliche Review-Submission ist noch nicht an die bestehende Runtime verdrahtet.";
  }
  return "Hinweis bleibt lokal vorbereitet, bis Inhalt und Moderationsgrenzen sauber erfüllt sind.";
}

export function createCommunitySourceReviewContributionDraft(
  input: CreateCommunitySourceReviewContributionDraftInput,
): CommunitySourceReviewContribution {
  const createdAt = input.createdAt ?? nowIso();
  const updatedAt = input.updatedAt ?? createdAt;
  const contribution: CommunitySourceReviewContribution = {
    id: buildContributionId(input),
    kind: input.kind,
    status: input.status ?? "draft",
    target: input.target,
    targetId: hasText(input.targetId) ? String(input.targetId).trim() : null,
    title: buildTitle(input),
    text: String(input.text ?? "").trim(),
    language: String(input.language ?? "de").trim() || "de",
    claimText: hasText(input.claimText) ? String(input.claimText).trim() : null,
    sourceRefs: unique(input.sourceRefs ?? []),
    materialRefs: unique(input.materialRefs ?? []),
    notes: unique(input.notes ?? []),
    relatedContributionCount: Math.max(0, input.relatedContributionCount ?? 0),
    moderationFlags: {
      verifiesClaim: Boolean(input.moderationFlags?.verifiesClaim),
      marksSourceConfirmed: Boolean(input.moderationFlags?.marksSourceConfirmed),
      requestsPublish: Boolean(input.moderationFlags?.requestsPublish),
      requestsAutoMerge: Boolean(input.moderationFlags?.requestsAutoMerge),
      requestsRuntimeEntity: Boolean(input.moderationFlags?.requestsRuntimeEntity),
      usesMajorityAsTruth: Boolean(input.moderationFlags?.usesMajorityAsTruth),
    },
    guardrails: {
      hintOnly: true,
      canVerifyClaim: false,
      canPublish: false,
      canAutoMerge: false,
      canCreateRuntimeEntity: false,
      canConfirmSource: false,
      countsMajorityAsTruth: false,
    },
    runtime: {
      reviewQueueKind: "create_handoff_review_queue",
      factcheckRuntimeKind: "factcheck_enqueue",
      pendingReviewMessage: "Hinweis eingereicht – redaktionelle Prüfung offen.",
    },
    createdAt,
    updatedAt,
    submittedAt: input.submittedAt ?? null,
  };

  return contribution;
}

export function getCommunitySourceReviewContributionBlockers(
  contribution: CommunitySourceReviewContribution,
  options?: {
    runtimeAvailable?: boolean;
  },
): CommunitySourceReviewContributionBlocker[] {
  const blockers: CommunitySourceReviewContributionBlocker[] = [];

  if (!hasText(contribution.title)) blockers.push("missing_title");
  if (!hasText(contribution.text)) blockers.push("missing_text");
  if (!hasText(contribution.targetId)) blockers.push("missing_target_id");
  if (contribution.target === "claim" && !hasText(contribution.claimText)) {
    blockers.push("missing_claim_context");
  }
  if (
    (contribution.kind === "source_suggestion" ||
      contribution.kind === "counter_source") &&
    contribution.sourceRefs.length === 0
  ) {
    blockers.push("missing_source_reference");
  }
  if (contribution.moderationFlags.verifiesClaim) {
    blockers.push("contribution_verifies_claim");
  }
  if (contribution.moderationFlags.marksSourceConfirmed) {
    blockers.push("contribution_marks_source_confirmed");
  }
  if (contribution.moderationFlags.requestsPublish) {
    blockers.push("contribution_requests_publish");
  }
  if (contribution.moderationFlags.requestsAutoMerge) {
    blockers.push("contribution_requests_auto_merge");
  }
  if (contribution.moderationFlags.requestsRuntimeEntity) {
    blockers.push("contribution_requests_runtime_entity");
  }
  if (contribution.moderationFlags.usesMajorityAsTruth) {
    blockers.push("contribution_uses_majority_as_truth");
  }
  if (options?.runtimeAvailable !== true) {
    blockers.push("missing_runtime_contract");
  }

  return blockers;
}

export function validateCommunitySourceReviewContribution(
  contribution: CommunitySourceReviewContribution,
  options?: {
    runtimeAvailable?: boolean;
  },
): CommunitySourceReviewContributionValidationResult {
  const blockers = getCommunitySourceReviewContributionBlockers(
    contribution,
    options,
  );

  return {
    ok: blockers.length === 0,
    blockers,
    message: buildRuntimeMessage(blockers),
  };
}

export function canSubmitCommunitySourceReviewContribution(
  contribution: CommunitySourceReviewContribution,
  options?: {
    runtimeAvailable?: boolean;
  },
) {
  return (
    getCommunitySourceReviewContributionBlockers(contribution, options).length === 0
  );
}

export function mapCommunityContributionToReviewQueueInput(
  contribution: CommunitySourceReviewContribution,
  options?: {
    runtimeAvailable?: boolean;
  },
): CommunitySourceReviewQueueMapping {
  const blockers = getCommunitySourceReviewContributionBlockers(
    contribution,
    options,
  );
  const reviewQueueItem = createReviewQueueItemFromHandoffDraft(
    buildPreviewDraft(contribution),
  );
  const previewMessage = contribution.runtime.pendingReviewMessage;

  if (blockers.length === 0) {
    return {
      contribution,
      previewStatus: "pending_review",
      previewMessage,
      reviewQueueItem,
      runtime: {
        ok: true,
        blocked: false,
        blockers: [],
        status: "pending_review",
        message: previewMessage,
      },
    };
  }

  return {
    contribution,
    previewStatus: "pending_review",
    previewMessage,
    reviewQueueItem,
    runtime: {
      ok: false,
      blocked: true,
      blockers,
      error: "blocked_unwired",
      status: "blocked_unwired",
      message: buildRuntimeMessage(blockers),
    },
  };
}

import type {
  CreateHandoffDraft,
  CreateHandoffDraftStatus,
  CreateHandoffDraftTarget,
} from "@/features/create/createHandoffDrafts";
import { createReviewQueueItemFromHandoffDraft } from "@/features/create/createHandoffReviewQueue";
import type { CreateHandoffReviewQueueItem } from "@/features/create/createHandoffReviewQueue";
import {
  assessCommunitySourceReviewContributionRisk,
  type CommunitySourceReviewAbuseReason,
  type CommunitySourceReviewGuardrailFlags,
  type CommunitySourceReviewModerationInput,
  type CommunitySourceReviewModerationSignal,
} from "@/features/create/communitySourceReviewModeration";

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
  "contribution_spam",
  "contribution_harassment",
  "contribution_duplicate",
  "contribution_coordinated_manipulation",
  "contribution_misleading_source",
  "contribution_personal_data",
  "contribution_off_topic",
  "contribution_unsafe_content",
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
  moderationFlags: CommunitySourceReviewGuardrailFlags;
  moderation: CommunitySourceReviewModerationSignal;
  guardrails: {
    hintOnly: true;
    canVerifyClaim: false;
    canPublish: false;
    canAutoMerge: false;
    canCreateRuntimeEntity: false;
    canConfirmSource: false;
    countsMajorityAsTruth: false;
    trustCanOnlyPrioritizeReview: true;
    acceptedHintIsFact: false;
    hiddenOrRejectedCountsAsEvidence: false;
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
  moderationFlags?: Partial<CommunitySourceReviewGuardrailFlags>;
  moderation?: CommunitySourceReviewModerationInput | null;
  history?: {
    priorAllowedHint?: boolean;
    priorRejectedHint?: boolean;
    priorSourceReviewRouted?: boolean;
    priorEditorialReviewRouted?: boolean;
    contributorContextAvailable?: boolean;
  } | null;
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

export function getCommunitySourceReviewContributionKindLabel(
  kind: CommunitySourceReviewContributionKind,
): string {
  if (kind === "source_suggestion") return "Quellenvorschlag";
  if (kind === "counter_source") return "Gegenquelle";
  if (kind === "context_note") return "Kontextnotiz";
  if (kind === "lived_experience") return "Erfahrungsbericht";
  if (kind === "unclear_claim") return "Unklarer Claim";
  if (kind === "wording_clarification") return "Formulierungs- oder Begriffsklärung";
  return "Eskalationshinweis";
}

export function getCommunitySourceReviewTargetLabel(
  target: CommunitySourceReviewTarget,
): string {
  if (target === "claim") return "Claim";
  if (target === "factcheck_request") return "Quellenprüfung";
  if (target === "source_question") return "Quellenfrage";
  return "Review-Item";
}

export function getCommunitySourceReviewStatusLabel(
  status: CommunitySourceReviewStatus,
): string {
  if (status === "draft") return "Entwurf";
  if (status === "submitted") return "eingereicht";
  if (status === "pending_review") return "wartet auf Prüfung";
  if (status === "accepted_as_hint") return "als Hinweis erlaubt";
  if (status === "needs_moderation") return "Moderation nötig";
  return "abgelehnt";
}

export function getCommunitySourceReviewContributionBlockerLabel(
  blocker: CommunitySourceReviewContributionBlocker,
): string {
  if (blocker === "missing_title") return "Titel fehlt.";
  if (blocker === "missing_text") return "Hinweistext fehlt.";
  if (blocker === "missing_target_id") return "Bezug zu Claim, Quellenfrage oder Review-Item fehlt.";
  if (blocker === "missing_claim_context") return "Claim-Kontext fehlt.";
  if (blocker === "missing_source_reference") return "Quellenreferenz fehlt.";
  if (blocker === "contribution_spam") return "Hinweis ist als Spam markiert.";
  if (blocker === "contribution_harassment") return "Hinweis enthält Belästigung oder Angriffe.";
  if (blocker === "contribution_duplicate") return "Hinweis ist ein Duplikat.";
  if (blocker === "contribution_coordinated_manipulation") {
    return "Hinweis wirkt koordiniert manipulativ.";
  }
  if (blocker === "contribution_misleading_source") {
    return "Quellenreferenz wirkt irreführend.";
  }
  if (blocker === "contribution_personal_data") {
    return "Hinweis enthält personenbezogene Daten.";
  }
  if (blocker === "contribution_off_topic") return "Hinweis ist themenfremd.";
  if (blocker === "contribution_unsafe_content") return "Hinweis enthält unsicheren Inhalt.";
  if (blocker === "contribution_verifies_claim") {
    return "Hinweis versucht, einen Claim direkt als wahr zu markieren.";
  }
  if (blocker === "contribution_marks_source_confirmed") {
    return "Hinweis versucht, eine Quelle direkt als bestätigt zu markieren.";
  }
  if (blocker === "contribution_requests_publish") {
    return "Hinweis fordert automatische Veröffentlichung an.";
  }
  if (blocker === "contribution_requests_auto_merge") {
    return "Hinweis fordert automatisches Merge an.";
  }
  if (blocker === "contribution_requests_runtime_entity") {
    return "Hinweis fordert automatische Entitätserstellung an.";
  }
  if (blocker === "contribution_uses_majority_as_truth") {
    return "Hinweis versucht, Menge oder Mehrheit als Wahrheit zu deuten.";
  }
  return "Runtime-Vertrag für sichere Submission fehlt noch.";
}

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

function mapModerationStatusToContributionStatus(
  moderationStatus: CommunitySourceReviewModerationSignal["moderationStatus"],
): CommunitySourceReviewStatus {
  if (moderationStatus === "allowed_as_hint") return "accepted_as_hint";
  if (moderationStatus === "rejected_abuse") return "rejected";
  if (
    moderationStatus === "needs_moderation" ||
    moderationStatus === "hidden_pending_review"
  ) {
    return "needs_moderation";
  }
  return "pending_review";
}

function mapAbuseReasonToContributionBlocker(
  reason: CommunitySourceReviewAbuseReason,
): CommunitySourceReviewContributionBlocker | null {
  if (reason === "spam") return "contribution_spam";
  if (reason === "harassment") return "contribution_harassment";
  if (reason === "duplicate") return "contribution_duplicate";
  if (reason === "coordinated_manipulation") {
    return "contribution_coordinated_manipulation";
  }
  if (reason === "misleading_source") return "contribution_misleading_source";
  if (reason === "personal_data") return "contribution_personal_data";
  if (reason === "off_topic") return "contribution_off_topic";
  if (reason === "unsafe_content") return "contribution_unsafe_content";
  return null;
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
  if (
    contribution.moderation.moderationStatus === "needs_moderation" ||
    contribution.moderation.moderationStatus === "hidden_pending_review"
  ) {
    questions.push(
      "Hinweis wird moderiert, bevor er als prüfbarer Beitrag sichtbar werden kann.",
    );
  }
  if (contribution.relatedContributionCount > 1) {
    questions.push("Viele Hinweise bedeuten keine bestätigte Wahrheit.");
  }
  if (contribution.moderation.trustLevel !== "unknown") {
    questions.push("Trust priorisiert höchstens Review und bestätigt keine Wahrheit.");
  }
  if (contribution.moderation.sourceQualityLevel !== "unknown") {
    questions.push("Quellenqualität hilft bei der Einordnung, verifiziert aber keine Quelle.");
  }
  if (contribution.moderation.sourceQualityState.reviewCandidateHint === "strong_review_candidate") {
    questions.push("Auch starke Review-Kandidaten müssen fachlich oder redaktionell geprüft werden.");
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
  const moderationTail = contribution.moderation.summary;
  if (contribution.kind === "lived_experience") {
    return `${base} Die Erfahrung bleibt ein Hinweis und kein repräsentativer Beleg. ${moderationTail}`;
  }
  if (contribution.kind === "counter_source") {
    return `${base} Gegenbelege bleiben prüfpflichtig und widerrufen keinen Claim automatisch. ${moderationTail}`;
  }
  return `${base} Der Hinweis bestätigt noch keine Wahrheit und bleibt redaktionell prüfpflichtig. ${moderationTail}`;
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
  const moderationFlags: CommunitySourceReviewGuardrailFlags = {
    verifiesClaim: Boolean(input.moderationFlags?.verifiesClaim),
    marksSourceConfirmed: Boolean(input.moderationFlags?.marksSourceConfirmed),
    requestsPublish: Boolean(input.moderationFlags?.requestsPublish),
    requestsAutoMerge: Boolean(input.moderationFlags?.requestsAutoMerge),
    requestsRuntimeEntity: Boolean(input.moderationFlags?.requestsRuntimeEntity),
    usesMajorityAsTruth: Boolean(input.moderationFlags?.usesMajorityAsTruth),
  };
  const moderation = assessCommunitySourceReviewContributionRisk({
    kind: input.kind,
    target: input.target,
    relatedContributionCount: Math.max(0, input.relatedContributionCount ?? 0),
    sourceRefCount: unique(input.sourceRefs ?? []).length,
    sourceRefs: unique(input.sourceRefs ?? []),
    textLength: String(input.text ?? "").trim().length,
    claimText: input.claimText ?? null,
    notes: input.notes ?? [],
    materialRefs: input.materialRefs ?? [],
    moderationFlags,
    history: input.history ?? null,
    moderation: input.moderation ?? null,
  });
  const contribution: CommunitySourceReviewContribution = {
    id: buildContributionId(input),
    kind: input.kind,
    status: input.status ?? mapModerationStatusToContributionStatus(moderation.moderationStatus),
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
    moderationFlags,
    moderation,
    guardrails: {
      hintOnly: true,
      canVerifyClaim: false,
      canPublish: false,
      canAutoMerge: false,
      canCreateRuntimeEntity: false,
      canConfirmSource: false,
      countsMajorityAsTruth: false,
      trustCanOnlyPrioritizeReview: true,
      acceptedHintIsFact: false,
      hiddenOrRejectedCountsAsEvidence: false,
    },
    runtime: {
      reviewQueueKind: "create_handoff_review_queue",
      factcheckRuntimeKind: "factcheck_enqueue",
      pendingReviewMessage: moderation.summary,
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
  for (const reason of contribution.moderation.abuseReasons) {
    const blocker = mapAbuseReasonToContributionBlocker(reason);
    if (blocker) blockers.push(blocker);
  }
  if (options?.runtimeAvailable !== true) {
    blockers.push("missing_runtime_contract");
  }

  return unique(blockers) as CommunitySourceReviewContributionBlocker[];
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

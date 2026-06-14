import type {
  BranchActionIntent,
  ClaimCandidate,
  ClaimInferredStance,
  ClaimStanceConfirmationStatus,
  ClaimUserStanceDecision,
  ContributionPackage,
  ExistingMatch,
  ExistingMatchDifferenceReason,
  PlaceResolutionResult,
  PlaceResolutionSource,
  StreetRegistryLookupSource,
  StreetRegistryLookupStatus,
  StreetRegistryMatch,
  StreetVerificationStatus,
} from "@/features/create/createContributionPackageContract";
import {
  resolveBranchHandoffTarget,
  type CreateBranchHandoffStatus,
  type CreateBranchHandoffTargetType,
  type CreateBranchReviewPreparationDraft,
} from "@/features/create/branchHandoffTargets";

export type CreateContributionLedgerDraftSaveStatus =
  | "local_only"
  | "server_saved"
  | "server_failed"
  | "anonymous_local";

export type CreateBranchLedgerSelectedAction =
  | "qr_poll_prepare"
  | "public_swipes_prepare"
  | "review_or_sources"
  | "save_branch_only"
  | "attach_existing"
  | "count_position_in_existing"
  | "count_opposition_in_existing"
  | "add_nuance_to_existing"
  | "keep_separate"
  | null;

export type CreateBranchLedgerStatus =
  | "draft_saved"
  | "qr_draft_prepared"
  | "swipe_draft_prepared"
  | "review_draft_prepared"
  | "match_decision_pending"
  | "match_decision_recorded"
  | "local_only"
  | "server_failed";

export type CreateBranchLedgerVisibilityIntent =
  | "draft"
  | "private_qr"
  | "public_after_review"
  | "public_swipes";

export type CreateQrParticipationDraft = {
  draftId: string;
  packageId: string;
  branchId: string;
  title: string;
  question: string | null;
  description: string;
  proPrompt: string;
  contraPrompt: string;
  eventualitiesPrompt: string;
  visibilityIntent: "private_qr" | "public_after_review";
  status: "draft" | "needs_review" | "ready_for_review";
  shareUrl: null;
  qrCodeUrl: null;
  publishedAt: null;
  createdAt: string;
  updatedAt: string;
  guardrails: {
    noAutoPublish: true;
    noAutoVote: true;
    noAutoShare: true;
  };
};

export type SwipeDraftStatement = {
  id: string;
  text: string;
  inferredStance: ClaimInferredStance;
  stanceConfirmationStatus: ClaimStanceConfirmationStatus;
  sourceClaimId?: string;
  needsReview: boolean;
  sensitivityLevel: ContributionPackage["branches"][number]["sensitivityLevel"];
};

export type CreateSwipeDraft = {
  draftId: string;
  packageId: string;
  branchId: string;
  statements: SwipeDraftStatement[];
  status: "draft" | "needs_review" | "ready_for_review";
  visibilityIntent: "public_swipes" | "public_after_review";
  publishedAt: null;
  createdAt: string;
  updatedAt: string;
  guardrails: {
    noAutoPublish: true;
    noAutoVote: true;
    noAutoMerge: true;
  };
};

export type ExistingMatchDecision = {
  matchId: string;
  targetType: "claim" | "topic" | "anlassraum" | "dossier";
  targetTitle: string;
  matchedClaimText: string | null;
  currentSupportCount: number | null;
  currentOpposeCount: number | null;
  currentNeutralCount: number | null;
  matchConfidence: number | null;
  whyMatched: string | null;
  userDecision:
    | "count_my_position"
    | "add_as_nuance"
    | "keep_separate"
    | "count_as_opposition"
    | "request_review"
    | "undecided";
  differenceReason?: ExistingMatchDifferenceReason | null;
  userNuanceText?: string | null;
  recordedAsDraftOnly: true;
  confirmedAt: null;
  countedAt: null;
  mergedAt: null;
};

export type CreateBranchLedgerItem = {
  branchId: string;
  title: string;
  summary: string;
  selectedAction: CreateBranchLedgerSelectedAction;
  status: CreateBranchLedgerStatus;
  visibilityIntent: CreateBranchLedgerVisibilityIntent;
  claimCandidates: ClaimCandidate[];
  placeCandidates: string[];
  localIssueCandidates: string[];
  needsPlaceClarification: boolean;
  placeClarificationQuestion?: string | null;
  placeClarificationStatus: "pending" | "answered" | "skipped";
  detectedStreetName?: string | null;
  correctedStreetName?: string | null;
  suppliedPlace?: string | null;
  placeResolution?: PlaceResolutionResult | null;
  placeResolutionCandidateLabel?: string | null;
  placeResolutionSource: PlaceResolutionSource;
  streetRegistryStatus?: StreetRegistryLookupStatus;
  streetRegistrySource?: StreetRegistryLookupSource;
  streetRegistryMatches?: StreetRegistryMatch[];
  selectedStreetMatch?: StreetRegistryMatch | null;
  streetVerificationStatus?: StreetVerificationStatus;
  confirmedPlaceCandidateId?: string | null;
  placeConfirmationStatus?: "unconfirmed" | "confirmed" | "corrected" | "skipped";
  inferredStance: ClaimInferredStance;
  stanceConfirmationStatus: ClaimStanceConfirmationStatus;
  userStanceDecision?: ClaimUserStanceDecision;
  sensitivityLevel: ContributionPackage["branches"][number]["sensitivityLevel"];
  needsReview: boolean;
  existingMatchDecision?: ExistingMatchDecision;
  qrParticipationDraft?: CreateQrParticipationDraft;
  swipeDraft?: CreateSwipeDraft;
  handoffStatus: CreateBranchHandoffStatus;
  handoffTargetType: CreateBranchHandoffTargetType;
  handoffTargetUrl: string | null;
  reviewPreparationDraft?: CreateBranchReviewPreparationDraft;
  targetReference?: {
    id: string;
    type: "claim" | "topic" | "anlassraum" | "dossier";
    title: string;
  };
};

export type CreateContributionLedgerEntry = {
  ledgerId: string;
  packageId: string;
  userId?: string;
  anonymousSessionId?: string;
  sourceText: string;
  createdAt: string;
  updatedAt: string;
  locale: string;
  entryPoint: "create";
  draftSaveStatus: CreateContributionLedgerDraftSaveStatus;
  branches: CreateBranchLedgerItem[];
};

type BuildCreateContributionLedgerEntryInput = {
  ledgerId: string;
  packageId: string;
  userId?: string;
  anonymousSessionId?: string;
  sourceText: string;
  createdAt: string;
  updatedAt: string;
  locale: string;
  contributionPackage: ContributionPackage;
  draftSaveStatus: CreateContributionLedgerDraftSaveStatus;
};

function toLedgerTimestamp(value: string | null | undefined): number {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function hasRealExistingMatch(match: ExistingMatch): boolean {
  return (
    (typeof match.currentSupportCount === "number" && match.currentSupportCount > 0) ||
    (typeof match.currentOpposeCount === "number" && match.currentOpposeCount > 0) ||
    (typeof match.currentNeutralCount === "number" && match.currentNeutralCount > 0)
  );
}

function mapExistingMatchDecision(
  existingMatches: ExistingMatch[],
): ExistingMatchDecision | undefined {
  const selectedMatch = existingMatches.find((match) => hasRealExistingMatch(match) && match.userDecision) ?? null;
  if (!selectedMatch) return undefined;
  return {
    matchId: selectedMatch.id,
    targetType: selectedMatch.targetType,
    targetTitle: selectedMatch.title,
    matchedClaimText: selectedMatch.matchedClaimText ?? null,
    currentSupportCount: selectedMatch.currentSupportCount ?? null,
    currentOpposeCount: selectedMatch.currentOpposeCount ?? null,
    currentNeutralCount: selectedMatch.currentNeutralCount ?? null,
    matchConfidence: selectedMatch.matchConfidence ?? null,
    whyMatched: selectedMatch.whyMatched ?? null,
    userDecision: selectedMatch.userDecision,
    differenceReason: selectedMatch.differenceReason ?? null,
    userNuanceText: selectedMatch.userNuanceText ?? null,
    recordedAsDraftOnly: true,
    confirmedAt: null,
    countedAt: null,
    mergedAt: null,
  };
}

function resolveBranchInferredStance(claimCandidates: ClaimCandidate[]): ClaimInferredStance {
  return claimCandidates.find((candidate) => candidate.inferredStance)?.inferredStance ?? "not_inferred";
}

function resolveBranchStanceConfirmationStatus(
  claimCandidates: ClaimCandidate[],
): ClaimStanceConfirmationStatus {
  return claimCandidates.find((candidate) => candidate.stanceConfirmationStatus)?.stanceConfirmationStatus ?? "not_requested";
}

function resolveBranchUserStanceDecision(
  claimCandidates: ClaimCandidate[],
): ClaimUserStanceDecision | undefined {
  return claimCandidates.find((candidate) => candidate.userStanceDecision)?.userStanceDecision;
}

function mapSelectedAction(params: {
  branchAction: BranchActionIntent | null;
  existingMatchDecision?: ExistingMatchDecision;
}): CreateBranchLedgerSelectedAction {
  if (params.existingMatchDecision) {
    if (params.existingMatchDecision.userDecision === "count_my_position") return "count_position_in_existing";
    if (params.existingMatchDecision.userDecision === "count_as_opposition") return "count_opposition_in_existing";
    if (params.existingMatchDecision.userDecision === "add_as_nuance") return "add_nuance_to_existing";
    if (params.existingMatchDecision.userDecision === "keep_separate") return "keep_separate";
    return "attach_existing";
  }
  if (params.branchAction === "prepare_qr_poll") return "qr_poll_prepare";
  if (params.branchAction === "prepare_swipes") return "public_swipes_prepare";
  if (params.branchAction === "request_review_or_sources") return "review_or_sources";
  if (params.branchAction === "save_only") return "save_branch_only";
  return null;
}

function mapVisibilityIntent(selectedAction: CreateBranchLedgerSelectedAction): CreateBranchLedgerVisibilityIntent {
  if (selectedAction === "qr_poll_prepare") return "private_qr";
  if (selectedAction === "public_swipes_prepare") return "public_swipes";
  if (
    selectedAction === "review_or_sources" ||
    selectedAction === "attach_existing" ||
    selectedAction === "count_position_in_existing" ||
    selectedAction === "count_opposition_in_existing" ||
    selectedAction === "add_nuance_to_existing"
  ) {
    return "public_after_review";
  }
  return "draft";
}

function mapStatus(params: {
  selectedAction: CreateBranchLedgerSelectedAction;
  existingMatchDecision?: ExistingMatchDecision;
  hasMatchSuggestion: boolean;
  draftSaveStatus: CreateContributionLedgerDraftSaveStatus;
}): CreateBranchLedgerStatus {
  if (params.existingMatchDecision && params.existingMatchDecision.userDecision !== "undecided") {
    return "match_decision_recorded";
  }
  if (params.hasMatchSuggestion) {
    return "match_decision_pending";
  }
  if (params.selectedAction === "qr_poll_prepare") return "qr_draft_prepared";
  if (params.selectedAction === "public_swipes_prepare") return "swipe_draft_prepared";
  if (params.selectedAction === "review_or_sources") return "review_draft_prepared";
  if (params.draftSaveStatus === "local_only" || params.draftSaveStatus === "anonymous_local") return "local_only";
  if (params.draftSaveStatus === "server_failed") return "server_failed";
  return "draft_saved";
}

function resolveBranchQuestion(branch: ContributionPackage["branches"][number]): string | null {
  const questionCandidate =
    branch.claimCandidates.find((candidate) => candidate.kind === "question") ??
    branch.claimCandidates[0] ??
    null;
  return questionCandidate?.text?.trim() ? questionCandidate.text.trim() : null;
}

function buildQrParticipationDraft(params: {
  branch: ContributionPackage["branches"][number];
  packageId: string;
  createdAt: string;
  updatedAt: string;
}): CreateQrParticipationDraft | undefined {
  if (params.branch.selectedAction !== "prepare_qr_poll") return undefined;
  const question = resolveBranchQuestion(params.branch);
  const needsReview =
    params.branch.sensitivityLevel === "high_risk" ||
    params.branch.sensitivityLevel === "legal_sensitive" ||
    !question;
  return {
    draftId: `qr-draft-${params.packageId}-${params.branch.id}`,
    packageId: params.packageId,
    branchId: params.branch.id,
    title: params.branch.title,
    question,
    description: `Beteiligung zu ${params.branch.title}. Pro/Contra und mögliche Folgen können vor Veröffentlichung ergänzt werden.`,
    proPrompt: `Was spricht für ${params.branch.title}?`,
    contraPrompt: `Was spricht gegen ${params.branch.title}?`,
    eventualitiesPrompt: `Welche möglichen Folgen oder Eventualitäten gibt es bei ${params.branch.title}?`,
    visibilityIntent: needsReview ? "public_after_review" : "private_qr",
    status: needsReview ? "needs_review" : "ready_for_review",
    shareUrl: null,
    qrCodeUrl: null,
    publishedAt: null,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
    guardrails: {
      noAutoPublish: true,
      noAutoVote: true,
      noAutoShare: true,
    },
  };
}

function buildSwipeDraft(params: {
  branch: ContributionPackage["branches"][number];
  packageId: string;
  createdAt: string;
  updatedAt: string;
}): CreateSwipeDraft | undefined {
  if (params.branch.selectedAction !== "prepare_swipes") return undefined;
  const statements = params.branch.claimCandidates.map((candidate) => ({
    id: `swipe-draft-statement-${params.packageId}-${params.branch.id}-${candidate.id}`,
    text: candidate.text,
    inferredStance: candidate.inferredStance,
    stanceConfirmationStatus: candidate.stanceConfirmationStatus,
    sourceClaimId: candidate.id,
    needsReview:
      params.branch.sensitivityLevel === "high_risk" ||
      params.branch.sensitivityLevel === "legal_sensitive" ||
      candidate.stanceConfirmationStatus !== "confirmed",
    sensitivityLevel: params.branch.sensitivityLevel,
  }));
  const needsReview =
    params.branch.sensitivityLevel === "high_risk" ||
    params.branch.sensitivityLevel === "legal_sensitive" ||
    statements.length === 0 ||
    statements.some((statement) => statement.needsReview);
  return {
    draftId: `swipe-draft-${params.packageId}-${params.branch.id}`,
    packageId: params.packageId,
    branchId: params.branch.id,
    statements,
    status: needsReview ? "needs_review" : "ready_for_review",
    visibilityIntent: needsReview ? "public_after_review" : "public_swipes",
    publishedAt: null,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
    guardrails: {
      noAutoPublish: true,
      noAutoVote: true,
      noAutoMerge: true,
    },
  };
}

export function buildCreateContributionLedgerEntry(
  input: BuildCreateContributionLedgerEntryInput,
): CreateContributionLedgerEntry {
  return {
    ledgerId: input.ledgerId,
    packageId: input.packageId,
    userId: input.userId,
    anonymousSessionId: input.anonymousSessionId,
    sourceText: input.sourceText,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    locale: input.locale,
    entryPoint: "create",
    draftSaveStatus: input.draftSaveStatus,
    branches: input.contributionPackage.branches.map((branch) => {
      const existingMatchDecision = mapExistingMatchDecision(branch.existingMatches);
      const selectedAction = mapSelectedAction({
        branchAction: branch.selectedAction,
        existingMatchDecision,
      });
      const hasMatchSuggestion = branch.existingMatches.some(hasRealExistingMatch);
      const inferredStance = resolveBranchInferredStance(branch.claimCandidates);
      const stanceConfirmationStatus = resolveBranchStanceConfirmationStatus(branch.claimCandidates);
      const userStanceDecision = resolveBranchUserStanceDecision(branch.claimCandidates);
      const qrParticipationDraft = buildQrParticipationDraft({
        branch,
        packageId: input.packageId,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      });
      const swipeDraft = buildSwipeDraft({
        branch,
        packageId: input.packageId,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      });
      const needsReview =
        branch.sensitivityLevel === "high_risk" ||
        branch.sensitivityLevel === "legal_sensitive" ||
        selectedAction === "review_or_sources" ||
        existingMatchDecision?.userDecision === "request_review" ||
        userStanceDecision === "request_review" ||
        qrParticipationDraft?.status === "needs_review" ||
        swipeDraft?.status === "needs_review";
      const handoff = resolveBranchHandoffTarget({
        packageId: input.packageId,
        branch: {
          branchId: branch.id,
          title: branch.title,
          summary: branch.summary,
          selectedAction,
          claimCandidates: branch.claimCandidates,
          placeCandidates: branch.placeCandidates ?? [],
          localIssueCandidates: branch.localIssueCandidates ?? [],
          needsPlaceClarification: branch.needsPlaceClarification ?? false,
          placeClarificationStatus: branch.placeClarificationStatus ?? "answered",
          placeClarificationQuestion: branch.placeClarificationQuestion ?? null,
          sensitivityLevel: branch.sensitivityLevel,
          existingMatches: branch.existingMatches,
          inferredStance,
          stanceConfirmationStatus,
        },
      });
      return {
        branchId: branch.id,
        title: branch.title,
        summary: branch.summary,
        selectedAction,
        status: mapStatus({
          selectedAction,
          existingMatchDecision,
          hasMatchSuggestion,
          draftSaveStatus: input.draftSaveStatus,
        }),
        visibilityIntent: mapVisibilityIntent(selectedAction),
        claimCandidates: branch.claimCandidates,
        placeCandidates: branch.placeCandidates ?? [],
        localIssueCandidates: branch.localIssueCandidates ?? [],
        needsPlaceClarification: branch.needsPlaceClarification ?? false,
        placeClarificationQuestion: branch.placeClarificationQuestion ?? null,
        placeClarificationStatus: branch.placeClarificationStatus ?? "answered",
        detectedStreetName: branch.detectedStreetName ?? null,
        correctedStreetName: branch.correctedStreetName ?? null,
        suppliedPlace: branch.suppliedPlace ?? null,
        placeResolution: branch.placeResolution ?? null,
        placeResolutionCandidateLabel: branch.placeResolutionCandidateLabel ?? null,
        placeResolutionSource: branch.placeResolutionSource ?? "none",
        streetRegistryStatus: branch.streetRegistryStatus ?? "not_configured",
        streetRegistrySource: branch.streetRegistrySource ?? "none",
        streetRegistryMatches: branch.streetRegistryMatches ?? [],
        selectedStreetMatch: branch.selectedStreetMatch ?? null,
        streetVerificationStatus: branch.streetVerificationStatus ?? "unchecked",
        confirmedPlaceCandidateId: branch.confirmedPlaceCandidateId ?? null,
        placeConfirmationStatus: branch.placeConfirmationStatus ?? "unconfirmed",
        inferredStance,
        stanceConfirmationStatus,
        userStanceDecision,
        sensitivityLevel: branch.sensitivityLevel,
        needsReview,
        existingMatchDecision,
        qrParticipationDraft,
        swipeDraft,
        handoffStatus: handoff.handoffStatus,
        handoffTargetType: handoff.handoffTargetType,
        handoffTargetUrl: handoff.handoffTargetUrl,
        reviewPreparationDraft: handoff.reviewPreparationDraft,
        targetReference: existingMatchDecision
          ? {
              id: existingMatchDecision.matchId,
              type: existingMatchDecision.targetType,
              title: existingMatchDecision.targetTitle,
            }
          : undefined,
      };
    }),
  };
}

export function dedupeCreateContributionLedgerEntries(
  entries: readonly CreateContributionLedgerEntry[],
): CreateContributionLedgerEntry[] {
  const byPackageId = new Map<string, CreateContributionLedgerEntry>();
  for (const entry of entries) {
    const key = String(entry.packageId || entry.ledgerId || "").trim();
    if (!key) continue;
    const existing = byPackageId.get(key);
    if (!existing) {
      byPackageId.set(key, entry);
      continue;
    }
    const incomingIsNewer = toLedgerTimestamp(entry.updatedAt) >= toLedgerTimestamp(existing.updatedAt);
    const newer = incomingIsNewer ? entry : existing;
    const older = incomingIsNewer ? existing : entry;
    const mergedBranches = new Map<string, CreateBranchLedgerItem>();
    for (const branch of older.branches) mergedBranches.set(branch.branchId, branch);
    for (const branch of newer.branches) mergedBranches.set(branch.branchId, branch);
    byPackageId.set(key, {
      ...newer,
      createdAt: older.createdAt || newer.createdAt,
      branches: Array.from(mergedBranches.values()),
    });
  }
  return Array.from(byPackageId.values()).sort(
    (left, right) => toLedgerTimestamp(right.updatedAt) - toLedgerTimestamp(left.updatedAt),
  );
}

export function readCreateContributionLedgerEntryFromAnalysis(input: {
  analysis: unknown;
  ledgerId: string;
  userId?: string;
  locale?: string | null;
  sourceText?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}): CreateContributionLedgerEntry | null {
  if (!input.analysis || typeof input.analysis !== "object" || Array.isArray(input.analysis)) return null;
  const record = input.analysis as Record<string, unknown>;
  const storedLedger = record.createContributionLedger;
  if (storedLedger && typeof storedLedger === "object" && !Array.isArray(storedLedger)) {
    const candidate = storedLedger as CreateContributionLedgerEntry;
    if (Array.isArray(candidate.branches) && typeof candidate.packageId === "string") {
      return {
        ...candidate,
        ledgerId: candidate.ledgerId || input.ledgerId,
        userId: candidate.userId ?? input.userId,
        locale: candidate.locale || input.locale || "de",
        sourceText: candidate.sourceText || input.sourceText || "",
        createdAt: candidate.createdAt || input.createdAt || input.updatedAt || new Date().toISOString(),
        updatedAt: candidate.updatedAt || input.updatedAt || input.createdAt || new Date().toISOString(),
      };
    }
  }

  const intelligentFollowup = record.intelligentFollowup;
  if (!intelligentFollowup || typeof intelligentFollowup !== "object" || Array.isArray(intelligentFollowup)) return null;
  const contributionPackage = (intelligentFollowup as Record<string, unknown>).contributionPackage;
  if (!contributionPackage || typeof contributionPackage !== "object" || Array.isArray(contributionPackage)) return null;
  const typedContributionPackage = contributionPackage as ContributionPackage;
  if (!Array.isArray(typedContributionPackage.branches) || typedContributionPackage.branches.length === 0) return null;

  return buildCreateContributionLedgerEntry({
    ledgerId: input.ledgerId,
    packageId: typedContributionPackage.id,
    userId: input.userId,
    sourceText:
      input.sourceText ||
      String((intelligentFollowup as Record<string, unknown>).sourceText ?? "").trim(),
    createdAt: input.createdAt || input.updatedAt || new Date().toISOString(),
    updatedAt: input.updatedAt || input.createdAt || new Date().toISOString(),
    locale: input.locale || "de",
    contributionPackage: typedContributionPackage,
    draftSaveStatus: "server_saved",
  });
}

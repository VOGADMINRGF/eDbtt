import type {
  AccountUserScopedRuntimeSurfaceRef,
  AccountUserScopedRuntimeTruthLevel,
} from "./userScopedRuntimeLinkageTypes";

export const ACCOUNT_CONTRIBUTION_HANDOFF_CORRELATION_STRENGTHS = [
  "exact",
  "strong",
  "partial",
  "suggested",
  "missing",
  "blocked",
] as const;

export type AccountContributionHandoffCorrelationStrength =
  (typeof ACCOUNT_CONTRIBUTION_HANDOFF_CORRELATION_STRENGTHS)[number];

export const ACCOUNT_CONTRIBUTION_HANDOFF_CORRELATION_BASES = [
  "shared_id",
  "source_handoff_id",
  "source_draft_id",
  "ledger_branch_id",
  "provenance",
  "created_by_and_dossier_id",
  "existing_review_context",
  "existing_runtime_readmodel",
  "text_similarity_suggestion",
  "none",
] as const;

export type AccountContributionHandoffCorrelationBasis =
  (typeof ACCOUNT_CONTRIBUTION_HANDOFF_CORRELATION_BASES)[number];

export type AccountContributionSourceKind =
  | "local_start_draft"
  | "ledger_branch"
  | "persisted_handoff_only";

export type AccountContributionSourceRef = {
  id: string;
  kind: AccountContributionSourceKind;
  title: string;
  summary: string;
  href: string | null;
  sourceText: string;
  createdAt: string | null;
  updatedAt: string | null;
  userId: string | null;
  localDraftId?: string | null;
  startDraftId?: string | null;
  ledgerId?: string | null;
  packageId?: string | null;
  branchId?: string | null;
  ledgerBranchId?: string | null;
  contributionId?: string | null;
  sourceDraftId?: string | null;
  sourceHandoffId?: string | null;
  sourceBranchId?: string | null;
  dossierId?: string | null;
  selectedActionHint?: string | null;
  sharedIds?: string[];
};

export type AccountPersistedHandoffCorrelationRef = {
  handoffId: string;
  createHandoffId: string;
  title: string;
  summary: string;
  href: string;
  sourceText: string;
  reviewState: string;
  selectedAction: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  dossierId: string | null;
  sourceDraftId?: string | null;
  sourceHandoffId?: string | null;
  sourceBranchId?: string | null;
  reviewItemId?: string | null;
  workspaceId?: string | null;
  participationSpaceId?: string | null;
  outputArtifactId?: string | null;
  voxyBriefingId?: string | null;
  provenance?: {
    sourceDraftId?: string | null;
    sourceHandoffId?: string | null;
  } | null;
  sharedIds?: string[];
};

export type AccountContributionHandoffCorrelation = {
  contributionRef: AccountContributionSourceRef;
  persistedHandoffRef: AccountPersistedHandoffCorrelationRef | null;
  reviewQueueRef: AccountUserScopedRuntimeSurfaceRef | null;
  dossierWorkspaceRef: AccountUserScopedRuntimeSurfaceRef | null;
  participationRef: AccountUserScopedRuntimeSurfaceRef | null;
  outputDraftRef: AccountUserScopedRuntimeSurfaceRef | null;
  voxyBriefingRef: AccountUserScopedRuntimeSurfaceRef | null;
  correlationStrength: AccountContributionHandoffCorrelationStrength;
  correlationBasis: AccountContributionHandoffCorrelationBasis;
  userVisibleLabel: string;
  adminReason: string | null;
  needsReview: boolean;
  runtimeTruthLevel: AccountUserScopedRuntimeTruthLevel;
  nextStep: string;
  publicActivationAllowed: false;
  publishActionEnabled: false;
};

export type AccountPersistedHandoffReverseCorrelation = {
  contributionRef: AccountContributionSourceRef | null;
  persistedHandoffRef: AccountPersistedHandoffCorrelationRef;
  correlationStrength: AccountContributionHandoffCorrelationStrength;
  correlationBasis: AccountContributionHandoffCorrelationBasis;
  userVisibleLabel: string;
  adminReason: string | null;
  needsReview: boolean;
};

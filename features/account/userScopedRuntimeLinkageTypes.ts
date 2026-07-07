import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { AccountPersistedHandoffCorrelationRef } from "./contributionHandoffCorrelationTypes";

export const ACCOUNT_USER_SCOPED_RUNTIME_LINKAGE_STATUSES = [
  "linked",
  "partially_linked",
  "missing_linkage",
  "blocked_by_runtime_truth",
  "blocked_by_review",
  "blocked_by_provider",
  "not_available",
] as const;

export type AccountUserScopedRuntimeLinkageStatus =
  (typeof ACCOUNT_USER_SCOPED_RUNTIME_LINKAGE_STATUSES)[number];

export const ACCOUNT_USER_SCOPED_RUNTIME_TRUTH_LEVELS = [
  "local_draft",
  "ledger",
  "review_readmodel",
  "dossier_readmodel",
  "participation_readmodel",
  "output_readmodel",
  "runtime_confirmed",
] as const;

export type AccountUserScopedRuntimeTruthLevel =
  (typeof ACCOUNT_USER_SCOPED_RUNTIME_TRUTH_LEVELS)[number];

export const ACCOUNT_USER_SCOPED_RUNTIME_SURFACE_KINDS = [
  "review",
  "dossier",
  "participation",
  "output",
  "voxy",
] as const;

export type AccountUserScopedRuntimeSurfaceKind =
  (typeof ACCOUNT_USER_SCOPED_RUNTIME_SURFACE_KINDS)[number];

export type AccountUserScopedRuntimeSurfaceState = {
  kind: AccountUserScopedRuntimeSurfaceKind;
  label: string;
  status: "linked" | "candidate" | "missing" | "blocked";
  stateLabel: string;
  summary: string;
  href: string | null;
};

export type AccountUserScopedRuntimeContributionRef = {
  handoffId: string;
  title: string;
  summary: string;
  href: string;
  selectedAction: string;
  reviewState: string;
  createdAt: string;
  updatedAt: string;
};

export type AccountUserScopedRuntimeSurfaceRef = {
  title: string;
  href: string | null;
  stateLabel: string;
  summary: string;
  linkageMode:
    | "source_handoff_id"
    | "workspace_source_draft"
    | "workspace_owner_scope"
    | "readmodel_candidate";
};

export type AccountUserScopedRuntimeLinkage = {
  contributionRef: AccountUserScopedRuntimeContributionRef;
  persistedHandoffRef: AccountPersistedHandoffCorrelationRef;
  reviewQueueRef: AccountUserScopedRuntimeSurfaceRef | null;
  dossierWorkspaceRef: AccountUserScopedRuntimeSurfaceRef | null;
  participationRef: AccountUserScopedRuntimeSurfaceRef | null;
  outputDraftRef: AccountUserScopedRuntimeSurfaceRef | null;
  voxyBriefingRef: AccountUserScopedRuntimeSurfaceRef | null;
  surfaces: AccountUserScopedRuntimeSurfaceState[];
  linkageStatus: AccountUserScopedRuntimeLinkageStatus;
  userVisibleStatus: string;
  adminReason: string | null;
  nextStep: string;
  reviewRequired: boolean;
  publicActivationAllowed: false;
  publishActionEnabled: false;
  runtimeTruthLevel: AccountUserScopedRuntimeTruthLevel;
  linkageGaps: string[];
  v3ReviewContext: V3ReviewQueueWiringContext;
};

export type AccountUserScopedRuntimeLinkageSlice = {
  userScopedRuntimeLinkages?: AccountUserScopedRuntimeLinkage[];
};

export function readAccountUserScopedRuntimeLinkageSlice(
  src: unknown,
): AccountUserScopedRuntimeLinkageSlice {
  const value =
    src && typeof src === "object"
      ? (src as { userScopedRuntimeLinkages?: unknown }).userScopedRuntimeLinkages
      : undefined;

  return {
    userScopedRuntimeLinkages: Array.isArray(value)
      ? (value as AccountUserScopedRuntimeLinkage[])
      : [],
  };
}

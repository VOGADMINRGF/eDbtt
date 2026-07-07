import {
  resolveCanonicalPublishGuard,
  type CanonicalPreparationStatus,
  type CanonicalPublishGuard,
} from "@/features/create/canonicalPreparationStatusContract";
import type { CanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import type { CanonicalTrustState } from "@/features/create/languageBridgeTrustFormatContract";
import type { V3UnifiedReviewQueueItem } from "@/features/create/unifiedReviewQueueContract";

export const DOSSIER_WORKSPACE_REVIEW_SURFACE_STATES = [
  "draft",
  "review",
  "approval_required",
  "publish_ready",
  "published_history",
  "archived",
] as const;

export type DossierWorkspaceReviewSurfaceState =
  (typeof DOSSIER_WORKSPACE_REVIEW_SURFACE_STATES)[number];

export type DossierWorkspaceReviewSurface = {
  dossierId: string;
  title: string;
  state: DossierWorkspaceReviewSurfaceState;
  preparationStatus: CanonicalPreparationStatus;
  publishGuard: CanonicalPublishGuard;
  guardrails: {
    noAutoPublish: true;
    noAutoDossierFinal: true;
    noAutoSocialPosting: true;
    reviewRequired: true;
  };
  sections: {
    claims: string[];
    counterPositions: string[];
    openQuestions: string[];
    formatRecommendations: string[];
    participationCandidates: string[];
    socialOutputDrafts: string[];
    voxyBriefingCandidates: string[];
  };
  sourcePack: {
    sourcePackId: string | null;
    sourceCount: number;
    reviewState: string | null;
  };
  trustLayer: {
    trustState: CanonicalTrustState | null;
    visibleAsAdvice: true;
  };
  reviewQueueItems: V3UnifiedReviewQueueItem[];
};

export type BuildDossierWorkspaceReviewSurfaceInput = {
  dossierId: string;
  title: string;
  state?: DossierWorkspaceReviewSurfaceState;
  approvalGranted?: boolean;
  blockers?: readonly string[];
  claims?: readonly string[];
  counterPositions?: readonly string[];
  openQuestions?: readonly string[];
  formatRecommendations?: readonly string[];
  participationCandidates?: readonly string[];
  socialOutputDrafts?: readonly string[];
  voxyBriefingCandidates?: readonly string[];
  sourcePack?: CanonicalSourcePack | null;
  trustState?: CanonicalTrustState | null;
  reviewQueueItems?: readonly V3UnifiedReviewQueueItem[];
};

function unique(values: readonly string[] | undefined): string[] {
  return Array.from(
    new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  );
}

function mapSurfaceStateToPreparationStatus(
  state: DossierWorkspaceReviewSurfaceState,
): CanonicalPreparationStatus {
  if (state === "review") return "review_ready";
  if (state === "approval_required") return "review_ready";
  if (state === "publish_ready") return "publish_ready";
  if (state === "published_history") return "active_or_published";
  if (state === "archived") return "archived";
  return "draft";
}

export function buildDossierWorkspaceReviewSurface(
  input: BuildDossierWorkspaceReviewSurfaceInput,
): DossierWorkspaceReviewSurface {
  const state = input.state ?? "draft";
  const preparationStatus = mapSurfaceStateToPreparationStatus(state);

  return {
    dossierId: input.dossierId,
    title: input.title.trim(),
    state,
    preparationStatus,
    publishGuard: resolveCanonicalPublishGuard({
      status: preparationStatus,
      approvalGranted: input.approvalGranted,
      blockers: input.blockers,
    }),
    guardrails: {
      noAutoPublish: true,
      noAutoDossierFinal: true,
      noAutoSocialPosting: true,
      reviewRequired: true,
    },
    sections: {
      claims: unique(input.claims),
      counterPositions: unique(input.counterPositions),
      openQuestions: unique(input.openQuestions),
      formatRecommendations: unique(input.formatRecommendations),
      participationCandidates: unique(input.participationCandidates),
      socialOutputDrafts: unique(input.socialOutputDrafts),
      voxyBriefingCandidates: unique(input.voxyBriefingCandidates),
    },
    sourcePack: {
      sourcePackId: input.sourcePack?.sourcePackId ?? null,
      sourceCount: input.sourcePack?.sources.length ?? 0,
      reviewState: input.sourcePack?.reviewState ?? null,
    },
    trustLayer: {
      trustState: input.trustState ?? null,
      visibleAsAdvice: true,
    },
    reviewQueueItems: [...(input.reviewQueueItems ?? [])],
  };
}

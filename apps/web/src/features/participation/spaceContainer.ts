import { type ParticipationAdminCockpitQueueKey, type ParticipationAdminCockpitRiskFlag } from "@/features/participation/adminCockpit";
import { type ParticipationImpactStatus } from "@/features/participation/impactStatus";
import {
  type ParticipationResultFeedbackSourceStatus,
  type ParticipationResultFeedbackStatus,
} from "@/features/participation/resultFeedback";

export const PARTICIPATION_SPACE_STATUSES = [
  "draft",
  "intake_open",
  "review_active",
  "feedback_prepared",
  "public_feedback_live",
  "closed_archived",
] as const;

export type ParticipationSpaceStatus =
  (typeof PARTICIPATION_SPACE_STATUSES)[number];

export const PARTICIPATION_SPACE_VISIBILITIES = [
  "private",
  "review_only",
  "public_read_only",
  "public_intake_open",
  "archived_public",
] as const;

export type ParticipationSpaceVisibility =
  (typeof PARTICIPATION_SPACE_VISIBILITIES)[number];

export const PARTICIPATION_SPACE_MODULES = [
  "topic_overview",
  "public_intake",
  "status_timeline",
  "result_feedback",
  "minority_positions",
  "open_questions",
  "next_steps",
  "operator_cockpit",
  "live_context",
  "dossier_references",
] as const;

export type ParticipationSpaceModule =
  (typeof PARTICIPATION_SPACE_MODULES)[number];

export type ParticipationSpaceGuardrails = {
  noAutoPublish: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoGraph: true;
  noAutomaticOfficialAssessment: true;
  spaceIsContainerOnly: true;
  publicFeedbackRequiresExplicitStatus: true;
  operatorCockpitIsNeverPublic: true;
  modulesDoNotTriggerAutomation: true;
  mapLogicOutOfScope: true;
};

export type ParticipationSpaceLinkedItem = {
  id: string;
  title: string;
  impactStatus: ParticipationImpactStatus;
  feedbackStatus: ParticipationResultFeedbackStatus;
  sourceStatus: ParticipationResultFeedbackSourceStatus;
  queueKey: ParticipationAdminCockpitQueueKey;
  riskFlags: ParticipationAdminCockpitRiskFlag[];
};

export type ParticipationSpacePublicSummary = {
  headline: string;
  shortSummary: string;
  statusLabel: string;
  feedbackAvailable: boolean;
  openQuestionCount: number;
  minorityPositionCount: number;
  nextStepCount: number;
  lastUpdatedAt: string;
};

export type ParticipationSpace = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  status: ParticipationSpaceStatus;
  visibility: ParticipationSpaceVisibility;
  modules: ParticipationSpaceModule[];
  linkedItems: ParticipationSpaceLinkedItem[];
  publicSummary: ParticipationSpacePublicSummary;
  updatedAt: string;
  guardrails: ParticipationSpaceGuardrails;
};

export type ParticipationSpaceReadiness = {
  publicVisible: boolean;
  intakeOpen: boolean;
  feedbackPublic: boolean;
  reviewRequired: boolean;
  visibleModules: ParticipationSpaceModule[];
  statusLabel: string;
  visibilityLabel: string;
  riskItemCount: number;
  guardrails: ParticipationSpaceGuardrails;
};

const PARTICIPATION_SPACE_GUARDRAILS =
  Object.freeze({
    noAutoPublish: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoGraph: true,
    noAutomaticOfficialAssessment: true,
    spaceIsContainerOnly: true,
    publicFeedbackRequiresExplicitStatus: true,
    operatorCockpitIsNeverPublic: true,
    modulesDoNotTriggerAutomation: true,
    mapLogicOutOfScope: true,
  }) satisfies ParticipationSpaceGuardrails;

const PARTICIPATION_SPACE_STATUS_LABELS: Record<
  ParticipationSpaceStatus,
  string
> = {
  draft: "Vorbereitet",
  intake_open: "Teilnahme offen",
  review_active: "Review aktiv",
  feedback_prepared: "Rückmeldung vorbereitet",
  public_feedback_live: "Öffentliche Rückmeldung sichtbar",
  closed_archived: "Abgeschlossen / archiviert",
};

const PARTICIPATION_SPACE_VISIBILITY_LABELS: Record<
  ParticipationSpaceVisibility,
  string
> = {
  private: "Intern vorbereitet",
  review_only: "Nur Review / Operator",
  public_read_only: "Öffentlich lesbar",
  public_intake_open: "Öffentlich mit Teilnahme",
  archived_public: "Öffentlich archiviert",
};

function isPublicVisibility(
  visibility: ParticipationSpaceVisibility,
): boolean {
  return (
    visibility === "public_read_only" ||
    visibility === "public_intake_open" ||
    visibility === "archived_public"
  );
}

function hasRiskFlags(space: ParticipationSpace): boolean {
  return space.linkedItems.some((item) => item.riskFlags.length > 0);
}

export function getParticipationSpaceStatusLabel(
  status: ParticipationSpaceStatus,
): string {
  return PARTICIPATION_SPACE_STATUS_LABELS[status];
}

export function getParticipationSpaceVisibilityLabel(
  visibility: ParticipationSpaceVisibility,
): string {
  return PARTICIPATION_SPACE_VISIBILITY_LABELS[visibility];
}

export function isParticipationSpacePublic(
  space: ParticipationSpace,
): boolean {
  return isPublicVisibility(space.visibility);
}

export function isParticipationSpaceIntakeOpen(
  space: ParticipationSpace,
): boolean {
  return (
    space.status === "intake_open" &&
    space.visibility === "public_intake_open"
  );
}

export function isParticipationSpaceFeedbackPublic(
  space: ParticipationSpace,
): boolean {
  return (
    space.status === "public_feedback_live" &&
    space.publicSummary.feedbackAvailable === true &&
    isParticipationSpacePublic(space)
  );
}

export function requiresParticipationSpaceReview(
  space: ParticipationSpace,
): boolean {
  return (
    space.status === "draft" ||
    space.status === "review_active" ||
    space.visibility === "review_only" ||
    hasRiskFlags(space)
  );
}

export function canShowParticipationSpaceModule(
  space: ParticipationSpace,
  module: ParticipationSpaceModule,
): boolean {
  if (!space.modules.includes(module)) {
    return false;
  }

  if (module === "operator_cockpit" && isParticipationSpacePublic(space)) {
    return false;
  }

  return true;
}

export function summarizeParticipationSpaceReadiness(
  space: ParticipationSpace,
): ParticipationSpaceReadiness {
  return {
    publicVisible: isParticipationSpacePublic(space),
    intakeOpen: isParticipationSpaceIntakeOpen(space),
    feedbackPublic: isParticipationSpaceFeedbackPublic(space),
    reviewRequired: requiresParticipationSpaceReview(space),
    visibleModules: space.modules.filter((module) =>
      canShowParticipationSpaceModule(space, module)
    ),
    statusLabel: getParticipationSpaceStatusLabel(space.status),
    visibilityLabel: getParticipationSpaceVisibilityLabel(space.visibility),
    riskItemCount: space.linkedItems.filter((item) => item.riskFlags.length > 0)
      .length,
    guardrails: PARTICIPATION_SPACE_GUARDRAILS,
  };
}

export function createEmptyParticipationSpace(
  params: Pick<ParticipationSpace, "id" | "title" | "slug" | "updatedAt"> & {
    summary?: string;
    status?: ParticipationSpaceStatus;
    visibility?: ParticipationSpaceVisibility;
    modules?: ParticipationSpaceModule[];
  },
): ParticipationSpace {
  const status = params.status ?? "draft";

  return {
    id: params.id,
    title: params.title,
    slug: params.slug,
    summary: params.summary ?? "",
    status,
    visibility: params.visibility ?? "private",
    modules: params.modules ?? ["topic_overview", "status_timeline"],
    linkedItems: [],
    publicSummary: {
      headline: params.title,
      shortSummary: params.summary ?? "",
      statusLabel: getParticipationSpaceStatusLabel(status),
      feedbackAvailable: false,
      openQuestionCount: 0,
      minorityPositionCount: 0,
      nextStepCount: 0,
      lastUpdatedAt: params.updatedAt,
    },
    updatedAt: params.updatedAt,
    guardrails: PARTICIPATION_SPACE_GUARDRAILS,
  };
}

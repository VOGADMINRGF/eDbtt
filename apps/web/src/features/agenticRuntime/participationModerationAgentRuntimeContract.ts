import {
  buildParticipationHandoffCandidate,
  type ParticipationHandoffCandidate,
} from "@/features/create/participationHandoffContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export type ParticipationModerationFormatFitness = {
  recommendation: ParticipationHandoffCandidate["candidateType"];
  finalParticipationDecision: false;
  reviewRequired: true;
  reason: string;
};

export type ParticipationModerationClusterCandidate = {
  id: string;
  label: string;
  merged: false;
  reviewRequired: true;
};

export type ParticipationMissingPerspectiveCandidate = {
  id: string;
  label: string;
  requiredUserPosition: false;
  reviewRequired: true;
};

export type ParticipationModerationSuggestion = {
  id: string;
  label: string;
  enforcementAction: false;
  reviewRequired: true;
};

export type ParticipationModerationAgentRuntimeContract = {
  participationCandidate: ParticipationHandoffCandidate;
  formatFitness: ParticipationModerationFormatFitness;
  clusteringCandidates: ParticipationModerationClusterCandidate[];
  missingPerspectiveCandidates: ParticipationMissingPerspectiveCandidate[];
  moderationSuggestions: ParticipationModerationSuggestion[];
  reviewRequired: true;
  noVotingForUser: true;
  noPremiumVoteWeighting: true;
  noExternalNotification: true;
  safeTrace: AgentSafeTraceStep[];
};

export function buildParticipationModerationAgentRuntimeContract(input: {
  id: string;
  recommendation: string;
  title: string;
  prompt: string;
  options?: readonly string[];
  clusterHints: string[];
  missingPerspectiveHints: string[];
}): ParticipationModerationAgentRuntimeContract {
  const participationCandidate = buildParticipationHandoffCandidate({
    id: input.id,
    recommendation: input.recommendation,
    title: input.title,
    prompt: input.prompt,
    options: input.options,
  });

  const formatFitness: ParticipationModerationFormatFitness = {
    recommendation: participationCandidate.candidateType,
    finalParticipationDecision: false,
    reviewRequired: true,
    reason:
      "Format fitness bleibt ein pruefbarer Vorschlag und ist keine endgueltige Beteiligungsentscheidung.",
  };
  const clusteringCandidates = input.clusterHints.map((label, index) => ({
    id: `cluster-${index + 1}`,
    label,
    merged: false as const,
    reviewRequired: true as const,
  }));
  const missingPerspectiveCandidates = input.missingPerspectiveHints.map(
    (label, index) => ({
      id: `perspective-${index + 1}`,
      label,
      requiredUserPosition: false as const,
      reviewRequired: true as const,
    }),
  );
  const moderationSuggestions: ParticipationModerationSuggestion[] = [
    {
      id: "moderation-1",
      label:
        "Moderationshinweise bleiben review-first Vorschlaege und fuehren keine Entfernung oder Durchsetzung automatisch aus.",
      enforcementAction: false,
      reviewRequired: true,
    },
  ];

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01",
      stepId: "participation_format_fitness_gate",
      surface: "/create",
      userSafeLabel:
        "Formatfitness, Clustering und Missing Perspectives bleiben review-first Hinweise. Es gibt keine automatische Aktivierung oder Moderationsdurchsetzung.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "continue_manually",
      inputArtifacts: [
        {
          id: `${participationCandidate.id}:participation-input`,
          type: "planner_followup",
          label: participationCandidate.title,
          reviewState: "present",
        },
      ],
      outputArtifacts: [
        {
          id: `${participationCandidate.id}:participation-contract`,
          type: "review_handoff",
          label: "Participation moderation contract",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: [
        ...clusteringCandidates.map((candidate) => candidate.id),
        ...missingPerspectiveCandidates.map((candidate) => candidate.id),
      ],
      primaryRole: "participation_moderation",
      supportingRoles: ["personal_voxy", "governance_compliance"],
    }),
  ];

  return {
    participationCandidate,
    formatFitness,
    clusteringCandidates,
    missingPerspectiveCandidates,
    moderationSuggestions,
    reviewRequired: true,
    noVotingForUser: true,
    noPremiumVoteWeighting: true,
    noExternalNotification: true,
    safeTrace,
  };
}

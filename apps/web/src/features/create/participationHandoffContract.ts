import {
  resolveCanonicalFormatRecommendationDecision,
  type CanonicalFormatRecommendation,
} from "@/features/create/languageBridgeTrustFormatContract";

export const PARTICIPATION_HANDOFF_CANDIDATE_TYPES = [
  "poll_candidate",
  "live_question_candidate",
  "mitmachraum_candidate",
  "statement_candidate",
  "participation_space_candidate",
] as const;

export type ParticipationHandoffCandidateType =
  (typeof PARTICIPATION_HANDOFF_CANDIDATE_TYPES)[number];

export type ParticipationDraftOption = {
  id: string;
  label: string;
  draftOnly: true;
};

export type ParticipationHandoffCandidate = {
  id: string;
  candidateType: ParticipationHandoffCandidateType;
  sourceRecommendation: CanonicalFormatRecommendation;
  title: string;
  prompt: string;
  options: ParticipationDraftOption[];
  reviewRequired: true;
  autoActivate: false;
  neutralityHint: string | null;
  activationState: "draft_only";
};

export type BuildParticipationHandoffCandidateInput = {
  id: string;
  recommendation: string;
  title: string;
  prompt: string;
  options?: readonly string[];
};

function uniqueOptions(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function mapRecommendationToCandidateType(
  recommendation: CanonicalFormatRecommendation,
): ParticipationHandoffCandidateType {
  if (recommendation === "poll") return "poll_candidate";
  if (recommendation === "live_question") return "live_question_candidate";
  if (recommendation === "mitmachraum") return "mitmachraum_candidate";
  if (recommendation === "statement_review") return "statement_candidate";
  return "participation_space_candidate";
}

function buildNeutralityHint(
  type: ParticipationHandoffCandidateType,
): string | null {
  if (type === "poll_candidate") {
    return "Poll-Frage und Optionen bleiben neutralitäts- und reviewpflichtig.";
  }
  if (type === "live_question_candidate") {
    return "Live-Fragen bleiben review-first und dürfen nicht direkt aktiviert werden.";
  }
  return null;
}

export function buildParticipationHandoffCandidate(
  input: BuildParticipationHandoffCandidateInput,
): ParticipationHandoffCandidate {
  const recommendation =
    resolveCanonicalFormatRecommendationDecision(input.recommendation)
      .recommendation;
  const candidateType = mapRecommendationToCandidateType(recommendation);
  const options = uniqueOptions(input.options ?? []).map((label, index) => ({
    id: `${input.id}-option-${index + 1}`,
    label,
    draftOnly: true as const,
  }));

  return {
    id: input.id,
    candidateType,
    sourceRecommendation: recommendation,
    title: input.title.trim(),
    prompt: input.prompt.trim(),
    options,
    reviewRequired: true,
    autoActivate: false,
    neutralityHint: buildNeutralityHint(candidateType),
    activationState: "draft_only",
  };
}

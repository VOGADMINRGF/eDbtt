import { z } from "zod";

export const VOXY_AUTHOR_APPROVAL_STATUSES = [
  "draft",
  "needs_author_confirmation",
  "confirmed",
  "rejected",
] as const;

export type VoxyAuthorApprovalStatus =
  (typeof VOXY_AUTHOR_APPROVAL_STATUSES)[number];

export const VOXY_EDITORIAL_REVIEW_STATUSES = [
  "not_submitted",
  "needs_review",
  "in_review",
  "changes_requested",
  "approved_for_export",
  "rejected",
] as const;

export type VoxyEditorialReviewStatus =
  (typeof VOXY_EDITORIAL_REVIEW_STATUSES)[number];

export const VoxyBothSidesObligationsSchema = z.object({
  sideA: z.array(z.string()),
  sideB: z.array(z.string()),
});

export type VoxyBothSidesObligations = z.infer<
  typeof VoxyBothSidesObligationsSchema
>;

export const VoxyCoCreationStateSchema = z.object({
  authorIntent: z.string(),
  rawObservation: z.string(),
  nonNegotiableThesis: z.string(),
  structuralIssue: z.string(),
  publicQuestion: z.string(),
  verifiedFacts: z.array(z.string()),
  assumptions: z.array(z.string()),
  openQuestions: z.array(z.string()),
  sensitiveClaims: z.array(z.string()),
  bothSidesObligations: VoxyBothSidesObligationsSchema,
  reformProposal: z.string(),
  safeguards: z.array(z.string()),
  tonePreference: z.string(),
  authorApprovalStatus: z.enum(VOXY_AUTHOR_APPROVAL_STATUSES),
  editorialReviewStatus: z.enum(VOXY_EDITORIAL_REVIEW_STATUSES),
});

export type VoxyCoCreationState = z.infer<typeof VoxyCoCreationStateSchema>;

export const VOXY_COCREATION_REQUIRED_STEPS = [
  "capture_raw_observation",
  "define_non_negotiable_thesis",
  "collect_verified_facts",
  "document_both_sides_obligations",
  "review_sensitive_claims",
  "request_author_confirmation",
  "submit_editorial_review",
  "complete_editorial_review",
  "address_editorial_changes",
  "resolve_author_rejection",
] as const;

export type VoxyCoCreationRequiredStep =
  (typeof VOXY_COCREATION_REQUIRED_STEPS)[number];

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function createEmptyVoxyCoCreationState(): VoxyCoCreationState {
  return {
    authorIntent: "",
    rawObservation: "",
    nonNegotiableThesis: "",
    structuralIssue: "",
    publicQuestion: "",
    verifiedFacts: [],
    assumptions: [],
    openQuestions: [],
    sensitiveClaims: [],
    bothSidesObligations: {
      sideA: [],
      sideB: [],
    },
    reformProposal: "",
    safeguards: [],
    tonePreference: "",
    authorApprovalStatus: "draft",
    editorialReviewStatus: "not_submitted",
  };
}

export function isVoxyCoCreationReadyForExport(
  state: VoxyCoCreationState,
): boolean {
  return (
    state.authorApprovalStatus === "confirmed" &&
    state.editorialReviewStatus === "approved_for_export"
  );
}

export function getVoxyCocreationOpenQuestions(
  state: VoxyCoCreationState,
): string[] {
  const questions = [...state.openQuestions];

  if (!state.rawObservation.trim()) {
    questions.push("Was ist die eigentliche Beobachtung?");
  }
  if (!state.nonNegotiableThesis.trim()) {
    questions.push("Welche These ist nicht verhandelbar?");
  }
  if (state.verifiedFacts.length === 0) {
    questions.push("Welche Fakten sind belegt?");
  }
  if (state.assumptions.length === 0) {
    questions.push("Welche Annahmen sind noch offen?");
  }
  if (
    state.bothSidesObligations.sideA.length === 0 ||
    state.bothSidesObligations.sideB.length === 0
  ) {
    questions.push("Welche Gegenposition muss fair und verbindlich dargestellt werden?");
  }
  if (!state.reformProposal.trim()) {
    questions.push("Welche Reformlogik folgt daraus?");
  }

  return dedupeStrings(questions);
}

export function getVoxyCocreationNextRequiredSteps(
  state: VoxyCoCreationState,
): VoxyCoCreationRequiredStep[] {
  const steps: VoxyCoCreationRequiredStep[] = [];

  if (!state.rawObservation.trim()) {
    steps.push("capture_raw_observation");
  }
  if (!state.nonNegotiableThesis.trim()) {
    steps.push("define_non_negotiable_thesis");
  }
  if (state.verifiedFacts.length === 0) {
    steps.push("collect_verified_facts");
  }
  if (
    state.bothSidesObligations.sideA.length === 0 ||
    state.bothSidesObligations.sideB.length === 0
  ) {
    steps.push("document_both_sides_obligations");
  }
  if (state.sensitiveClaims.length > 0) {
    steps.push("review_sensitive_claims");
  }
  if (state.authorApprovalStatus !== "confirmed") {
    steps.push(
      state.authorApprovalStatus === "rejected"
        ? "resolve_author_rejection"
        : "request_author_confirmation",
    );
  }
  if (state.editorialReviewStatus === "not_submitted") {
    steps.push("submit_editorial_review");
  }
  if (
    state.editorialReviewStatus === "needs_review" ||
    state.editorialReviewStatus === "in_review"
  ) {
    steps.push("complete_editorial_review");
  }
  if (state.editorialReviewStatus === "changes_requested") {
    steps.push("address_editorial_changes");
  }

  return [...new Set(steps)];
}

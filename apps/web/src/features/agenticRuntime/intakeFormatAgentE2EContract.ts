import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import { evaluateCreateClaimSafety } from "@/features/create/safety/createClaimSafety";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceArtifactRef,
  type AgentSafeTraceConfidenceLabel,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const INTAKE_CLASSIFICATION_STAGES = [
  "visible_observation",
  "user_interpretation",
  "possible_hypothesis",
  "source_backed_fact",
] as const;

export const INTAKE_FORMAT_RECOMMENDATION_TYPES = [
  "create_dossier",
  "create_anlassraum",
  "prepare_vote",
  "ask_clarifying_question",
] as const;

export type IntakeClassificationStage = (typeof INTAKE_CLASSIFICATION_STAGES)[number];
export type IntakeFormatRecommendationType =
  (typeof INTAKE_FORMAT_RECOMMENDATION_TYPES)[number];

export type IntakeClassificationEntry = {
  stage: IntakeClassificationStage;
  label: string;
  value: string | null;
  state: "present" | "review_required" | "missing_runtime_truth";
};

export type IntakeFormatRecommendation = {
  type: IntakeFormatRecommendationType;
  label: string;
  reason: string;
  requiresConfirmation: true;
};

export type IntakeFormatAgentContract = {
  summary: string;
  classification: IntakeClassificationEntry[];
  occasionCandidate: {
    label: string;
    confidence: AgentSafeTraceConfidenceLabel;
  };
  topicAssignment: string[];
  geographicScopes: CreateIntelligentFollowupResult["understanding"]["scopes"];
  affectedGroupCandidates: string[];
  formatRecommendation: IntakeFormatRecommendation;
  openQuestions: string[];
  reviewRequired: true;
  noAutoPublish: true;
  safeTrace: AgentSafeTraceStep[];
};

const AFFECTED_GROUP_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\bschul|\bkita|\bbildung/iu, label: "Schuelerinnen und Schueler" },
  { pattern: /\beltern|\bfamil/iu, label: "Eltern und Familien" },
  { pattern: /\bmieter|\bwohnen/iu, label: "Mieterinnen und Mieter" },
  { pattern: /\brad|\bverkehr|\bhaltestelle/iu, label: "Pendler und Verkehrsteilnehmende" },
  { pattern: /\bpflege|\bgesundheit/iu, label: "Pflege- und Gesundheitsbetroffene" },
];

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function resolveFormatRecommendation(
  followup: CreateIntelligentFollowupResult,
): IntakeFormatRecommendation {
  const firstSuggestion = followup.suggestions[0];

  if (!firstSuggestion) {
    return {
      type: "ask_clarifying_question",
      label: "Rueckfrage vor Formatwahl",
      reason: "Ohne belastbaren Folgeschritt bleibt der Formatpfad review-first offen.",
      requiresConfirmation: true,
    };
  }

  if (firstSuggestion.kind === "dossier") {
    return {
      type: "create_dossier",
      label: "Dossier vorbereiten",
      reason: firstSuggestion.reason,
      requiresConfirmation: true,
    };
  }

  if (firstSuggestion.kind === "anlassraum" || firstSuggestion.kind === "new_anlassraum") {
    return {
      type: "create_anlassraum",
      label: "Anlassraum vorbereiten",
      reason: firstSuggestion.reason,
      requiresConfirmation: true,
    };
  }

  if (firstSuggestion.kind === "vote") {
    return {
      type: "prepare_vote",
      label: "Beteiligungsformat pruefen",
      reason: firstSuggestion.reason,
      requiresConfirmation: true,
    };
  }

  return {
    type: "ask_clarifying_question",
    label: "Rueckfrage vor Formatwahl",
    reason: firstSuggestion.reason,
    requiresConfirmation: true,
  };
}

function inferAffectedGroups(input: {
  rawInput: string;
  summary: string;
  topics: string[];
}) {
  const haystack = `${input.rawInput} ${input.summary} ${input.topics.join(" ")}`;
  const groups = AFFECTED_GROUP_PATTERNS.filter((entry) => entry.pattern.test(haystack)).map(
    (entry) => entry.label,
  );

  if (groups.length > 0) return unique(groups);
  return ["Betroffene vor Ort"];
}

function buildInputArtifacts(rawInput: string): AgentSafeTraceArtifactRef[] {
  return [
    {
      id: "intake-raw-input",
      type: "human_input",
      label: rawInput.trim() || "Nutzereingabe",
      reviewState: "present",
    },
  ];
}

export function buildIntakeFormatAgentContract(input: {
  rawInput: string;
  followup: CreateIntelligentFollowupResult;
  locale?: string | null;
}): IntakeFormatAgentContract {
  const claimSafety = evaluateCreateClaimSafety({
    text: input.rawInput,
    locale: input.locale ?? "de",
  });
  const formatRecommendation = resolveFormatRecommendation(input.followup);
  const openQuestions = unique(
    [
      input.followup.understanding.openQuestion ?? "",
      ...input.followup.understanding.statements
        .filter((statement) => statement.kind === "question")
        .map((statement) => statement.text),
    ].filter(Boolean),
  );
  const summary = input.followup.understanding.summary;
  const topicAssignment = unique(input.followup.understanding.topics.map((topic) => topic.label));
  const affectedGroupCandidates = inferAffectedGroups({
    rawInput: input.rawInput,
    summary,
    topics: topicAssignment,
  });

  const classification: IntakeClassificationEntry[] = [
    {
      stage: "visible_observation",
      label: "Beobachtung",
      value: input.rawInput.trim(),
      state: "present",
    },
    {
      stage: "user_interpretation",
      label: "Einordnung",
      value: summary,
      state: "present",
    },
    {
      stage: "possible_hypothesis",
      label: "Pruefhypothese",
      value: openQuestions[0] ?? formatRecommendation.reason,
      state: "review_required",
    },
    {
      stage: "source_backed_fact",
      label: "Belastbare Evidenz",
      value: null,
      state:
        claimSafety.kind === "factual_claim" || claimSafety.kind === "allegation"
          ? "missing_runtime_truth"
          : "review_required",
    },
  ];

  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-INTAKE-FORMAT-AGENT-E2E-01",
      stepId: "intake_observation_split",
      surface: "/create",
      userSafeLabel:
        "Der Beitrag bleibt in Beobachtung, Einordnung, Pruefhypothese und belastbarer Evidenz getrennt.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "confirm_intake_split",
      inputArtifacts: buildInputArtifacts(input.rawInput),
      outputArtifacts: [
        {
          id: "occasion-candidate",
          type: "planner_followup",
          label: summary,
          reviewState: "review_required",
        },
      ],
      evidenceRefs: topicAssignment,
    }),
    buildAgentSafeTraceStep({
      taskId: "V3-INTAKE-FORMAT-AGENT-E2E-01",
      stepId: "intake_format_recommendation",
      surface: "/create",
      userSafeLabel: "Ein naechster Formatpfad bleibt vorbereitet und bestaetigungspflichtig.",
      status: "review_required",
      confidenceLabel:
        claimSafety.kind === "observation"
          ? AGENT_SAFE_TRACE_CONFIDENCE_LABELS[2]
          : AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "continue_manually",
      inputArtifacts: [
        {
          id: "occasion-candidate-input",
          type: "planner_followup",
          label: summary,
          reviewState: "review_required",
        },
      ],
      outputArtifacts: [
        {
          id: `format-${formatRecommendation.type}`,
          type: "review_handoff",
          label: formatRecommendation.label,
          reviewState: "review_required",
        },
      ],
      evidenceRefs: openQuestions,
    }),
  ];

  return {
    summary,
    classification,
    occasionCandidate: {
      label: summary,
      confidence:
        input.followup.degraded || claimSafety.graphReviewRequired
          ? AGENT_SAFE_TRACE_CONFIDENCE_LABELS[0]
          : AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
    },
    topicAssignment,
    geographicScopes: input.followup.understanding.scopes,
    affectedGroupCandidates,
    formatRecommendation,
    openQuestions,
    reviewRequired: true,
    noAutoPublish: true,
    safeTrace,
  };
}

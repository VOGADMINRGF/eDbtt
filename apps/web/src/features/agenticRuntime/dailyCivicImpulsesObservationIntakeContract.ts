import type { PersonalVoxyMode } from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  AGENT_SAFE_TRACE_CONFIDENCE_LABELS,
  buildAgentSafeTraceStep,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";
import {
  INTAKE_CLASSIFICATION_STAGES,
  type IntakeClassificationStage,
} from "@/features/agenticRuntime/intakeFormatAgentE2EContract";
import type { PersonalVoxyProfileConsentOnboardingContract } from "@/features/agenticRuntime/personalVoxyProfileConsentOnboardingContract";

export const DAILY_CIVIC_IMPULSE_INPUT_TYPES = [
  "text_observation",
  "voice_observation",
  "screenshot_observation",
] as const;

export type DailyCivicImpulseInputType =
  (typeof DAILY_CIVIC_IMPULSE_INPUT_TYPES)[number];

export type DailyCivicImpulsePrompt = {
  id: string;
  label: string;
  prompt: string;
  inputType: DailyCivicImpulseInputType;
  optional: true;
};

export type DailyCivicObservationSplit = {
  stage: IntakeClassificationStage;
  label: string;
  explanation: string;
};

export type DailyCivicImpulsesObservationIntakeContract = {
  mode: PersonalVoxyMode;
  optional: true;
  maxPerDay: 3;
  prompts: DailyCivicImpulsePrompt[];
  observationSplit: DailyCivicObservationSplit[];
  rewardSignals: string[];
  storageMode:
    | "consented_profile_memory"
    | "review_only_no_profile_write";
  noNegativityMachine: true;
  noComplaintVolumeGamification: true;
  noProfilePersistenceWithoutConsent: true;
  reviewRequired: true;
  safeTrace: AgentSafeTraceStep[];
};

function buildDefaultPrompts(mode: PersonalVoxyMode): DailyCivicImpulsePrompt[] {
  const modeLabel =
    mode === "topic_watch"
      ? "Thema im Blick"
      : mode === "active_companion"
        ? "Heute aufgefallen"
        : "Was bewegt dich heute?";

  return [
    {
      id: "daily-impulse-1",
      label: modeLabel,
      prompt: "Was ist dir heute konkret aufgefallen?",
      inputType: "text_observation",
      optional: true,
    },
    {
      id: "daily-impulse-2",
      label: "Kurz einsprechen",
      prompt: "Du kannst dieselbe Beobachtung auch kurz als Sprachnotiz festhalten.",
      inputType: "voice_observation",
      optional: true,
    },
    {
      id: "daily-impulse-3",
      label: "Foto oder Screenshot",
      prompt:
        "Bilder bleiben Beobachtungsinput. Ursachen, Bewertung und Fakten muessen getrennt bestaetigt werden.",
      inputType: "screenshot_observation",
      optional: true,
    },
  ];
}

export function buildDailyCivicImpulsesObservationIntakeContract(input: {
  mode: PersonalVoxyMode;
  consentContract: PersonalVoxyProfileConsentOnboardingContract;
}): DailyCivicImpulsesObservationIntakeContract {
  const storageMode = input.consentContract.profilePersistenceAllowed
    ? "consented_profile_memory"
    : "review_only_no_profile_write";

  const observationSplit: DailyCivicObservationSplit[] =
    INTAKE_CLASSIFICATION_STAGES.map((stage) => ({
      stage,
      label: stage,
      explanation:
        stage === "visible_observation"
          ? "Nur das Sicht- oder Hoerbare."
          : stage === "user_interpretation"
            ? "Deine erste Einordnung."
            : stage === "possible_hypothesis"
              ? "Moegliche Ursache oder Vermutung."
              : "Belastbare Evidenz erst nach Quelle oder Beleg.",
    }));

  const prompts = buildDefaultPrompts(input.mode).slice(0, 3);
  const safeTrace: AgentSafeTraceStep[] = [
    buildAgentSafeTraceStep({
      taskId: "V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01",
      stepId: "daily_civic_impulses_gate",
      surface: "/account",
      userSafeLabel:
        "Daily Civic Impulses bleiben optional, auf drei pro Tag begrenzt und ohne Beschwerde- oder Mengenlogik.",
      status: "review_required",
      confidenceLabel: AGENT_SAFE_TRACE_CONFIDENCE_LABELS[1],
      requiredHumanAction: "continue_manually",
      inputArtifacts: prompts.map((prompt) => ({
        id: prompt.id,
        type: "human_input",
        label: prompt.label,
        reviewState: "present",
      })),
      outputArtifacts: [
        {
          id: "daily-civic-impulses-contract",
          type: "review_handoff",
          label:
            storageMode === "consented_profile_memory"
              ? "Optionale Daily Civic Impulses mit Consent"
              : "Optionale Daily Civic Impulses ohne Profilpersistenz",
          reviewState: "review_required",
        },
      ],
      evidenceRefs: observationSplit.map((entry) => entry.stage),
      primaryRole: "personal_voxy",
      supportingRoles: ["intake_format", "governance_compliance"],
    }),
  ];

  return {
    mode: input.mode,
    optional: true,
    maxPerDay: 3,
    prompts,
    observationSplit,
    rewardSignals: [
      "Klaerung statt Aufheizung",
      "Verbindung statt Meckerbox",
      "Evidenz statt Behauptungsmenge",
      "Beteiligung statt Beschwerdezaehler",
      "Sichtbarer Impact statt Submission-Volumen",
    ],
    storageMode,
    noNegativityMachine: true,
    noComplaintVolumeGamification: true,
    noProfilePersistenceWithoutConsent: true,
    reviewRequired: true,
    safeTrace,
  };
}

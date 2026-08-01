import {
  buildAgenticBootstrapReadiness,
  resolveTaskToAgentRoles,
  type AgentRoleId,
} from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  type AgentSafeTraceRequiredHumanAction,
  type AgentSafeTraceStep,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";
import {
  buildB2GFirstLoginJurisdictionCockpitContract,
  type B2GFirstLoginJurisdictionCockpitContract,
} from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitContract";
import {
  buildClaimsFactcheckAgentGraphIntegrationContract,
  type ClaimsFactcheckAgentGraphIntegrationContract,
} from "@/features/agenticRuntime/claimsFactcheckAgentGraphIntegrationContract";
import {
  buildCivicPrinciplesGovLightMunicipalHandoffContract,
  type CivicPrinciplesGovLightMunicipalHandoffContract,
} from "@/features/agenticRuntime/civicPrinciplesGovLightMunicipalHandoffContract";
import {
  buildDailyCivicImpulsesObservationIntakeContract,
  type DailyCivicImpulsesObservationIntakeContract,
} from "@/features/agenticRuntime/dailyCivicImpulsesObservationIntakeContract";
import {
  buildDossierCauseEffectResponsibilityTransferGraphContract,
  type DossierCauseEffectResponsibilityTransferGraphContract,
} from "@/features/agenticRuntime/dossierCauseEffectResponsibilityTransferGraphContract";
import {
  buildIntakeFormatAgentContract,
  type IntakeFormatAgentContract,
} from "@/features/agenticRuntime/intakeFormatAgentE2EContract";
import {
  buildMunicipalHandoffThreeAdoptionTrialContract,
  type MunicipalHandoffThreeAdoptionTrialContract,
} from "@/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract";
import {
  buildParticipationModerationAgentRuntimeContract,
  type ParticipationModerationAgentRuntimeContract,
} from "@/features/agenticRuntime/participationModerationAgentRuntimeContract";
import {
  buildPersonalVoxyProfileConsentOnboardingContract,
  type PersonalVoxyProfileConsentOnboardingContract,
} from "@/features/agenticRuntime/personalVoxyProfileConsentOnboardingContract";
import {
  buildRegionalCivicRadarParticipationDiscoveryContract,
  type RegionalCivicRadarParticipationDiscoveryContract,
} from "@/features/agenticRuntime/regionalCivicRadarParticipationDiscoveryContract";
import {
  buildResearchSourceTransferabilityContract,
  type ResearchSourceTransferabilityContract,
} from "@/features/agenticRuntime/researchSourceTransferabilityAgentContract";
import { buildCreateHandoffDraft } from "@/features/create/createHandoff";

export const AGENTIC_CIVIC_E2E_PILOT_TASK_ID = "V3-AGENTIC-CIVIC-E2E-PILOT-01";

export const AGENTIC_CIVIC_E2E_STAGE_IDS = [
  "citizen_observation",
  "intake_format",
  "safe_trace",
  "claims_factcheck",
  "dossier_debattenstand",
  "participation_moderation",
  "gov_light_municipal_handoff",
  "verified_publisher_preflight",
  "review_pipeline_status",
] as const;

export const AGENTIC_CIVIC_E2E_STAGE_STATES = [
  "contract_ready",
  "review_required",
  "human_approval_required",
  "publish_blocked_until_conscious_action",
] as const;

export const AGENTIC_CIVIC_E2E_INTEGRATED_CONTRACT_IDS = [
  "V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01",
  "V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01",
  "V3-INTAKE-FORMAT-AGENT-E2E-01",
  "V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01",
  "V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01",
  "V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01",
  "V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01",
  "V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01",
  "V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01",
  "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
] as const;

export type AgenticCivicE2EStageId = (typeof AGENTIC_CIVIC_E2E_STAGE_IDS)[number];
export type AgenticCivicE2EStageState =
  (typeof AGENTIC_CIVIC_E2E_STAGE_STATES)[number];
export type AgenticCivicE2EIntegratedContractId =
  (typeof AGENTIC_CIVIC_E2E_INTEGRATED_CONTRACT_IDS)[number];

export type AgenticCivicE2EPilotDependencies = {
  personalVoxy: PersonalVoxyProfileConsentOnboardingContract;
  dailyCivicImpulses: DailyCivicImpulsesObservationIntakeContract;
  intake: IntakeFormatAgentContract;
  regionalDiscovery: RegionalCivicRadarParticipationDiscoveryContract;
  research: ResearchSourceTransferabilityContract;
  claimsFactcheck: ClaimsFactcheckAgentGraphIntegrationContract;
  dossier: DossierCauseEffectResponsibilityTransferGraphContract;
  participation: ParticipationModerationAgentRuntimeContract;
  b2gFirstLogin: B2GFirstLoginJurisdictionCockpitContract;
  municipalHandoff: MunicipalHandoffThreeAdoptionTrialContract;
  civicPrinciples: CivicPrinciplesGovLightMunicipalHandoffContract;
};

export type AgenticCivicE2EStage = {
  id: AgenticCivicE2EStageId;
  title: string;
  primaryRole: AgentRoleId;
  supportingRoles: AgentRoleId[];
  routeSurface: string;
  state: AgenticCivicE2EStageState;
  reviewRequired: true;
  summary: string;
  reviewFirstBoundary: string;
  guardrails: string[];
  derivedFromTaskIds: string[];
  requiredHumanActions: AgentSafeTraceRequiredHumanAction[];
};

export type AgenticCivicE2EPilotSummaryCard = {
  id: string;
  title: string;
  body: string;
};

export type AgenticCivicE2EPilotContract = {
  taskId: typeof AGENTIC_CIVIC_E2E_PILOT_TASK_ID;
  statusInOpenTasks: "codex_ready" | "done" | "blocked" | "missing";
  primaryRole: "dossier_briefing";
  supportingRoles: readonly [
    "personal_voxy",
    "intake_format",
    "research_source",
    "claims_factcheck",
    "participation_moderation",
    "governance_compliance",
  ];
  integratedContractIds: readonly AgenticCivicE2EIntegratedContractId[];
  dependencyTasksSatisfied: boolean;
  stageOrder: readonly AgenticCivicE2EStageId[];
  stages: AgenticCivicE2EStage[];
  safeTrace: AgentSafeTraceStep[];
  safeTraceSurfaceCount: number;
  publicDebattenstandRemainsFree: true;
  noYesNoPolarizationMachine: true;
  majorityWithinPrinciplesOnly: true;
  noAutoPublish: true;
  noExternalNotification: true;
  noAutomaticRecipientVerification: true;
  noAutomaticEntitlementActivation: true;
  noAutomaticAdoption: true;
  noParallelAgents: true;
  noRuntimeActivation: true;
  govLight: {
    slotLimit: 3;
    readOnlyActionsConsumeSlot: false;
    publishOrActivateConsumesSlot: true;
    internalDraftReservationConsumesSlot: false;
    summary: string;
  };
  verifiedPublisherPreflight: {
    consciousPublishClickRequired: true;
    agentMayAutoPublish: false;
    statuses: readonly ["green_direct_live", "yellow_adjust_or_review", "red_blocked_manual_review"];
    summary: string;
  };
  reviewPipeline: {
    reviewFirst: true;
    adminVisible: true;
    organizationVisible: true;
    publicStatusReadable: true;
    summary: string;
  };
  remainingControlledAgenticCodexReadyTaskIds: string[];
  nextControlledAgenticTaskId: string | null;
};

function unique(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueSafeTraceSteps(steps: readonly AgentSafeTraceStep[]) {
  const seen = new Set<string>();
  return steps.filter((step) => {
    const key = `${step.surface}:${step.stepId}:${step.roleId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectRequiredHumanActions(steps: readonly AgentSafeTraceStep[]) {
  return unique(steps.map((step) => step.requiredHumanAction)).sort() as AgentSafeTraceRequiredHumanAction[];
}

function resolvePilotTaskStatus() {
  const readiness = buildAgenticBootstrapReadiness();
  if (readiness.bootstrap.doneTaskIds.includes(AGENTIC_CIVIC_E2E_PILOT_TASK_ID)) return "done";
  if (readiness.bootstrap.codexReadyTaskIds.includes(AGENTIC_CIVIC_E2E_PILOT_TASK_ID)) return "codex_ready";
  if (readiness.bootstrap.blockedTaskIds.includes(AGENTIC_CIVIC_E2E_PILOT_TASK_ID)) return "blocked";
  return "missing";
}

function buildDefaultDependencies(): AgenticCivicE2EPilotDependencies {
  const personalVoxy = buildPersonalVoxyProfileConsentOnboardingContract({
    segment: "b2c",
    requestedMode: "relevant_only",
    explicitPersonalVoxyConsent: false,
  });
  const dailyCivicImpulses = buildDailyCivicImpulsesObservationIntakeContract({
    mode: personalVoxy.effectiveMode,
    consentContract: personalVoxy,
  });
  const followup: Parameters<typeof buildIntakeFormatAgentContract>[0]["followup"] = {
    understanding: {
      summary:
        "Eine öffentliche Beobachtung bleibt review-first und wird erst danach als Dossier-, Beteiligungs- oder Handoff-Pfad weitergeführt.",
      categories: [{ id: "cat-1", label: "Beobachtung", confidence: "medium" }],
      topics: [{ id: "topic-1", label: "Sichere Schulwege", confidence: "medium" }],
      statements: [
        {
          id: "statement-1",
          text: "Vor der Schule fehlen sichere Übergänge.",
          kind: "claim",
          stance: "pro",
          confidence: "medium",
          sourceExcerpt: "Eltern berichten von riskanten Situationen am Morgen.",
        },
        {
          id: "statement-2",
          text: "Die Kommune soll zuerst einen Zebrastreifen prüfen.",
          kind: "demand",
          stance: "pro",
          confidence: "medium",
        },
      ],
      scopes: ["district"],
      confidence: "medium",
      openQuestion: "Welche Stelle ist für die Querung zuständig?",
    },
    suggestions: [
      {
        id: "suggestion-1",
        kind: "dossier",
        title: "Dossier vorbereiten",
        reason: "Mehrere Hinweise sprechen für einen review-first Dossierpfad.",
        confidence: "medium",
        requiresConfirmation: true,
      },
    ],
    sourceText:
      "Vor der Schule fehlen sichere Übergänge. Die Kommune soll zuerst einen Zebrastreifen prüfen.",
    generatedAt: "2026-07-14T10:00:00.000Z",
    meta: {
      planner: {
        source: "openai",
        plannerSource: "openai",
        plannerProvider: "openai",
        plannerRole: "planner_only",
        plannerTopic: "Sichere Schulwege",
        plannerCore:
          "Vor der Schule fehlen sichere Übergänge. Die Kommune soll zuerst einen Zebrastreifen prüfen.",
        plannerScope: ["district"],
        plannerStance: "pro",
        plannerClusters: ["Mobilität", "Schulwegsicherheit"],
        plannerOpenQuestions: ["Welche Stelle ist für die Querung zuständig?"],
        shortSummary:
          "Eine öffentliche Beobachtung bleibt review-first und wird erst danach als Dossier-, Beteiligungs- oder Handoff-Pfad weitergeführt.",
        topicCandidates: ["Sichere Schulwege"],
        clusterCandidates: ["Mobilität", "Schulwegsicherheit"],
        scopeCandidates: ["district"],
        stance: "pro",
        openQuestions: ["Welche Stelle ist für die Querung zuständig?"],
        graphSearchTerms: ["Sichere Schulwege", "Querung"],
        materialSignals: [],
        recommendedLane: "create_fast_followup",
        providerPlan: {
          lane: "create_fast_followup",
          plannerProvider: "openai",
          plannerRole: "planner_only",
          structureProvider: "mistral",
          summaryProvider: "claude",
          researchUsed: "none",
          researchProvider: null,
          deepSearchUsed: false,
          graphMatch: "after_structure",
        },
        permissions: {
          nonMutative: true,
          canPublish: false,
          canSave: false,
          canMerge: false,
          canDeepSearch: false,
        },
        plannerDegraded: false,
        degradedReason: null,
        plannerDegradedReason: null,
        qualityStatus: "specific",
        qualityIssues: [],
        providerCallAttempted: true,
        providerCallSucceeded: true,
        providerAttemptCount: 1,
        providerAttempts: [
          {
            attempt: 1,
            provider: "openai",
            model: "gpt-4.1-mini",
            status: "succeeded",
            resultCode: "succeeded",
            responseLength: null,
            responseHash: null,
          },
        ],
        plannerDebug: {
          attemptedProvider: "openai",
          usedProvider: "openai",
          attemptedModel: "gpt-4.1-mini",
          usedModel: "gpt-4.1-mini",
          attemptNumber: 1,
          providerAvailable: true,
          providerErrorCode: null,
          rawPayloadValid: true,
          rawTextValid: true,
          normalizedPayloadValid: true,
          qualityGatePassed: true,
        },
      },
      graphMatch: {
        stage: "after_structure",
        prepared: true,
        requiresConfirmation: true,
        searchTerms: ["Sichere Schulwege", "Querung"],
        matches: [],
        matchedTopics: [],
        matchedDossiers: [],
        matchedClaims: [],
        matchedAnlassraeume: [],
        matchedVotes: [],
        shouldCreateNewTopic: false,
      },
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
    },
  };
  const intake = buildIntakeFormatAgentContract({
    rawInput:
      "Vor der Schule fehlen sichere Übergänge. Die Kommune soll zuerst einen Zebrastreifen prüfen.",
    followup,
  });
  const regionalDiscovery = buildRegionalCivicRadarParticipationDiscoveryContract({
    mode: "relevant_only",
    jurisdictionLabel: "Berlin Reinickendorf",
    preparation: {
      sourceStatusSummary: { overallLabel: "Review-first vorbereitet" },
      signalSeeds: [
        {
          id: "regional-signal-1",
          sourceId: "source-1",
          title: "Schulwegsicherheit in Reinickendorf",
          sourceLabel: "Bezirk Reinickendorf",
          publishedAt: "2026-07-14T09:30:00.000Z",
          detectedTopics: ["Sichere Schulwege"],
          relatedAnlassraumIds: ["anlassraum-1"],
          suggestedAction: "create_dossier",
          reviewStatus: "needs_review",
        },
      ],
    } as Parameters<typeof buildRegionalCivicRadarParticipationDiscoveryContract>[0]["preparation"],
  });
  const research = buildResearchSourceTransferabilityContract({
    sourcePackId: "agentic-civic-e2e-pilot-source-pack",
    localRegionCode: "DE-BE",
    sources: [
      {
        sourceId: "source-local-1",
        title: "Bezirksdokument Reinickendorf",
        url: "https://example.org/reinickendorf",
        sourceLocale: "de-DE",
        regionCode: "DE-BE",
        sourceType: "official",
        reliabilityHint: "primary",
        retrievedAt: "2026-07-14T09:40:00.000Z",
        originalSnippet: "Originalauszug",
        translationStatus: "not_needed",
        evidenceState: "supported",
        issuerLabel: "Bezirk Reinickendorf",
        jurisdictionLabel: "Berlin Reinickendorf",
      },
      {
        sourceId: "source-intl-1",
        title: "International School Streets Reference",
        url: "https://example.org/london",
        sourceLocale: "en-GB",
        regionCode: "GB-LND",
        sourceType: "research",
        reliabilityHint: "secondary",
        retrievedAt: "2026-07-14T09:45:00.000Z",
        originalSnippet: "Original excerpt",
        translatedSnippet: "Lesefassung",
        translationStatus: "translated",
        evidenceState: "supported",
        issuerLabel: "City Lab",
        jurisdictionLabel: "London",
      },
    ],
  });
  const handoffDraft = buildCreateHandoffDraft({
    id: "agentic-civic-e2e-handoff-1",
    selectedAction: "append_to_dossier",
    result: followup,
  });
  const claimsFactcheck = buildClaimsFactcheckAgentGraphIntegrationContract({
    draft: handoffDraft,
    research,
  });
  const dossier = buildDossierCauseEffectResponsibilityTransferGraphContract({
    claimsModel: claimsFactcheck,
    responsibilityHints: ["Bezirk und Schulverwaltung"],
  });
  const participation = buildParticipationModerationAgentRuntimeContract({
    id: "agentic-civic-e2e-participation-1",
    recommendation: "poll",
    title: "Schulwegfrage",
    prompt: "Welche Maßnahme zuerst?",
    options: ["Zebrastreifen", "Tempo 30"],
    clusterHints: ["Morgendliche Schulwegsicherheit"],
    missingPerspectiveHints: ["Schülerinnen und Schüler", "Anwohnende ohne Auto"],
  });
  const b2gFirstLogin = buildB2GFirstLoginJurisdictionCockpitContract({
    municipalHandoffStatus: "done",
  });
  const municipalHandoff = buildMunicipalHandoffThreeAdoptionTrialContract();
  const civicPrinciples = buildCivicPrinciplesGovLightMunicipalHandoffContract();

  return {
    personalVoxy,
    dailyCivicImpulses,
    intake,
    regionalDiscovery,
    research,
    claimsFactcheck,
    dossier,
    participation,
    b2gFirstLogin,
    municipalHandoff,
    civicPrinciples,
  };
}

function buildStage(input: {
  id: AgenticCivicE2EStageId;
  title: string;
  taskId: string;
  routeSurface: string;
  state: AgenticCivicE2EStageState;
  summary: string;
  reviewFirstBoundary: string;
  guardrails: string[];
  derivedFromTaskIds: string[];
  requiredHumanActions: AgentSafeTraceRequiredHumanAction[];
}): AgenticCivicE2EStage {
  const resolution = resolveTaskToAgentRoles({ id: input.taskId });
  return {
    id: input.id,
    title: input.title,
    primaryRole: resolution.primaryRole,
    supportingRoles: resolution.supportingRoles,
    routeSurface: input.routeSurface,
    state: input.state,
    reviewRequired: true,
    summary: input.summary,
    reviewFirstBoundary: input.reviewFirstBoundary,
    guardrails: input.guardrails,
    derivedFromTaskIds: input.derivedFromTaskIds,
    requiredHumanActions: input.requiredHumanActions,
  };
}

export function buildAgenticCivicE2EPilotContract(
  input?: Partial<AgenticCivicE2EPilotDependencies>,
): AgenticCivicE2EPilotContract {
  const defaults = buildDefaultDependencies();
  const dependencies: AgenticCivicE2EPilotDependencies = {
    ...defaults,
    ...input,
  };
  const readiness = buildAgenticBootstrapReadiness();
  const statusInOpenTasks = resolvePilotTaskStatus();
  const dependencyTasksSatisfied = AGENTIC_CIVIC_E2E_INTEGRATED_CONTRACT_IDS.every((taskId) =>
    readiness.bootstrap.doneTaskIds.includes(taskId),
  );
  const safeTrace = uniqueSafeTraceSteps([
    ...dependencies.personalVoxy.safeTrace,
    ...dependencies.dailyCivicImpulses.safeTrace,
    ...dependencies.intake.safeTrace,
    ...dependencies.regionalDiscovery.safeTrace,
    ...dependencies.research.safeTrace,
    ...dependencies.claimsFactcheck.safeTrace,
    ...dependencies.dossier.safeTrace,
    ...dependencies.participation.safeTrace,
    ...dependencies.b2gFirstLogin.safeTrace,
  ]);
  const safeTraceSurfaceCount = unique(safeTrace.map((step) => step.surface)).length;

  const stages: AgenticCivicE2EStage[] = [
    buildStage({
      id: "citizen_observation",
      title: "Bürger / Beitrag / Beobachtung",
      taskId: "V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01",
      routeSurface: "/account",
      state: "review_required",
      summary: `Persönliche Beobachtung, regionale Relevanz und optional bis zu ${dependencies.dailyCivicImpulses.maxPerDay} Daily Civic Impulses bleiben getrennt von Profilpersistenz und institutionellem Handoff.`,
      reviewFirstBoundary:
        "Beobachtung bleibt von Einordnung, Hypothese und belastbarer Evidenz getrennt; Profilspeicher braucht bewussten Consent.",
      guardrails: [
        "keine Negativitätsmaschine",
        "keine Profilpersistenz ohne Consent",
        "keine externe Notification",
      ],
      derivedFromTaskIds: [
        "V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01",
        "V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01",
        "V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01",
      ],
      requiredHumanActions: collectRequiredHumanActions([
        ...dependencies.personalVoxy.safeTrace,
        ...dependencies.dailyCivicImpulses.safeTrace,
        ...dependencies.regionalDiscovery.safeTrace,
      ]),
    }),
    buildStage({
      id: "intake_format",
      title: "Intake / Format",
      taskId: "V3-INTAKE-FORMAT-AGENT-E2E-01",
      routeSurface: "/create",
      state: "review_required",
      summary:
        "Der Eingabepfad trennt Beobachtung, Einordnung, Prüfhypothese und Evidenz; die Formatempfehlung bleibt bestätigungspflichtig.",
      reviewFirstBoundary:
        "Kein stiller Übergang in Dossier, Anlassraum oder Beteiligung ohne bewusste Bestätigung.",
      guardrails: [
        "segmentneutraler Einstieg",
        "keine Ja/Nein-Polarisierungsmaschine",
        "kein Auto-Publish",
      ],
      derivedFromTaskIds: ["V3-INTAKE-FORMAT-AGENT-E2E-01"],
      requiredHumanActions: collectRequiredHumanActions(dependencies.intake.safeTrace),
    }),
    buildStage({
      id: "safe_trace",
      title: "Safe Trace",
      taskId: "V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01",
      routeSurface: "/admin/system",
      state: "contract_ready",
      summary: `${safeTrace.length} user-safe Trace-Schritte über ${safeTraceSurfaceCount} Surfaces zeigen Rolle, Artefakte, Confidence und Human Action, aber keine Prompts, Tokens oder Provider-Debug-Interna.`,
      reviewFirstBoundary:
        "Die Spur zeigt nur user-safe Provenance statt private Chain-of-Thought oder Runtime-Interna.",
      guardrails: [
        "keine Prompt-Leaks",
        "keine Provider-Leaks",
        "safe trace only",
      ],
      derivedFromTaskIds: ["V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01"],
      requiredHumanActions: collectRequiredHumanActions(safeTrace),
    }),
    buildStage({
      id: "claims_factcheck",
      title: "Claims / Factcheck-Kandidaten",
      taskId: "V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01",
      routeSurface: "/admin/review",
      state: "review_required",
      summary:
        "Claims, Interpretationen, Hypothesen, Quellenkandidaten und Graph-Kanten bleiben candidate_only; Translation wird nicht zu Evidenz hochgeschrieben.",
      reviewFirstBoundary:
        "Kein stilles offizielles Urteil, kein Fake-Factcheck und kein automatischer Graph-Write.",
      guardrails: [
        "keine Fake-Quellen",
        "keine Fake-Factchecks",
        "kein Auto-Graph-Write",
      ],
      derivedFromTaskIds: [
        "V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01",
        "V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01",
      ],
      requiredHumanActions: collectRequiredHumanActions([
        ...dependencies.research.safeTrace,
        ...dependencies.claimsFactcheck.safeTrace,
      ]),
    }),
    buildStage({
      id: "dossier_debattenstand",
      title: "Dossier / Debattenstand",
      taskId: "V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01",
      routeSurface: "/dossier/[id]",
      state: "review_required",
      summary:
        "Dossier-Zweige für Ursache, Wirkung, Verantwortung und Transferability bleiben review-first Kandidaten; öffentliche Debattenstände bleiben frei lesbar.",
      reviewFirstBoundary:
        "Verfügbarer Debattenstand ist noch keine amtliche Wahrheit, keine Adoption und keine automatische Veröffentlichung.",
      guardrails: [
        "public Debattenstand remains free",
        "keine automatische Dossier-Veröffentlichung",
        "Gegenargumente und Grenzen bleiben sichtbar",
      ],
      derivedFromTaskIds: [
        "V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01",
        "V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01",
      ],
      requiredHumanActions: collectRequiredHumanActions([
        ...dependencies.dossier.safeTrace,
        ...dependencies.b2gFirstLogin.safeTrace,
      ]),
    }),
    buildStage({
      id: "participation_moderation",
      title: "Participation / Moderation",
      taskId: "V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01",
      routeSurface: "/runden",
      state: "review_required",
      summary:
        "Formatfitness, Clustering, Missing Perspectives und Moderationshinweise bleiben review-first Vorschläge statt automatischer Aktivierung oder Durchsetzung.",
      reviewFirstBoundary:
        "Beteiligung bevorzugt Abwägung, Priorisierung, Optionen und Bedingungen; keine künstliche Konsensmaschine und kein Voting für Nutzer.",
      guardrails: [
        "keine Premium-Vote-Gewichtung",
        "keine automatische Entfernung",
        "keine reine Ja/Nein-Polarisierung",
      ],
      derivedFromTaskIds: ["V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01"],
      requiredHumanActions: collectRequiredHumanActions(dependencies.participation.safeTrace),
    }),
    buildStage({
      id: "gov_light_municipal_handoff",
      title: "GOV-light / Municipal Handoff",
      taskId: "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
      routeSurface: "/account/organization/dashboard",
      state: "human_approval_required",
      summary: `GOV-light bleibt ein Drei-Slot-Pfad: Lesen, Teaser und internes Vormerken verbrauchen keinen Slot; nur aktives Publish oder Activate zählt gegen die ${dependencies.municipalHandoff.govLightTrial.slotLimit} aktiven Themen.`,
      reviewFirstBoundary:
        "Municipal Handoff bleibt CRM-/Pipeline-intern, human-approved und getrennt von externer Notification, Recipient Verification und Entitlement-Aktivierung.",
      guardrails: [
        "keine automatische externe Notification",
        "keine automatische Recipient Verification",
        "keine automatische Entitlement-Aktivierung",
      ],
      derivedFromTaskIds: [
        "V3-CIVIC-PRINCIPLES-GOV-LIGHT-MUNICIPAL-HANDOFF-DECISION-01",
        "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
      ],
      requiredHumanActions: collectRequiredHumanActions(dependencies.b2gFirstLogin.safeTrace),
    }),
    buildStage({
      id: "verified_publisher_preflight",
      title: "Verified Publisher Preflight",
      taskId: "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
      routeSurface: "/admin/review",
      state: "publish_blocked_until_conscious_action",
      summary:
        "Verified Publisher Preflight bleibt Grün/Gelb/Rot nach bewusstem Publish-Klick; der Agent veröffentlicht nie selbständig.",
      reviewFirstBoundary:
        "Kein Publish ohne bewusste Publisher-Aktion, kein Überspringen von Grundsätze-, Zuständigkeits- oder Missbrauchsprüfungen.",
      guardrails: [
        "conscious publish click required",
        "agent may auto publish = false",
        "green/yellow/red Pflichtpfad",
      ],
      derivedFromTaskIds: [
        "V3-CIVIC-PRINCIPLES-GOV-LIGHT-MUNICIPAL-HANDOFF-DECISION-01",
        "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
      ],
      requiredHumanActions: ["review_before_publish"],
    }),
    buildStage({
      id: "review_pipeline_status",
      title: "Review / Pipeline / Status",
      taskId: AGENTIC_CIVIC_E2E_PILOT_TASK_ID,
      routeSurface: "/admin/system",
      state: "review_required",
      summary:
        "Der End-to-End-Pilot bleibt ein durchgehender Review-/Pipeline-/Statuspfad über Create, Dossier, Review, B2G-Cockpit und Admin-System, ohne Runtime-Aktivierung oder Außenaktion.",
      reviewFirstBoundary:
        "Pipeline-Status ist keine Veröffentlichung, kein Behördenkontakt und keine Preis-/Entitlement-Aktivierung.",
      guardrails: [
        "kein Runtime-Start",
        "keine Parallel-Agenten",
        "keine externe Notification",
      ],
      derivedFromTaskIds: [AGENTIC_CIVIC_E2E_PILOT_TASK_ID],
      requiredHumanActions: ["continue_manually", "review_before_publish"],
    }),
  ];

  const remainingControlledAgenticCodexReadyTaskIds = readiness.bootstrap.codexReadyTaskIds.filter(
    (taskId) => taskId !== AGENTIC_CIVIC_E2E_PILOT_TASK_ID,
  );

  return {
    taskId: AGENTIC_CIVIC_E2E_PILOT_TASK_ID,
    statusInOpenTasks,
    primaryRole: "dossier_briefing",
    supportingRoles: [
      "personal_voxy",
      "intake_format",
      "research_source",
      "claims_factcheck",
      "participation_moderation",
      "governance_compliance",
    ],
    integratedContractIds: AGENTIC_CIVIC_E2E_INTEGRATED_CONTRACT_IDS,
    dependencyTasksSatisfied,
    stageOrder: AGENTIC_CIVIC_E2E_STAGE_IDS,
    stages,
    safeTrace,
    safeTraceSurfaceCount,
    publicDebattenstandRemainsFree: true,
    noYesNoPolarizationMachine: true,
    majorityWithinPrinciplesOnly: true,
    noAutoPublish: true,
    noExternalNotification: true,
    noAutomaticRecipientVerification: true,
    noAutomaticEntitlementActivation: true,
    noAutomaticAdoption: true,
    noParallelAgents: true,
    noRuntimeActivation: true,
    govLight: {
      slotLimit: dependencies.municipalHandoff.govLightTrial.slotLimit,
      readOnlyActionsConsumeSlot: false,
      publishOrActivateConsumesSlot: true,
      internalDraftReservationConsumesSlot: false,
      summary:
        "GOV-light bleibt auf drei aktive Themen begrenzt; öffentliche Lesbarkeit, Teaser und internes Vormerken bleiben kosten- und slot-frei.",
    },
    verifiedPublisherPreflight: {
      consciousPublishClickRequired:
        dependencies.civicPrinciples.verifiedPublisherPreflight.consciousPublishClickRequired,
      agentMayAutoPublish:
        dependencies.civicPrinciples.verifiedPublisherPreflight.agentMayAutoPublish,
      statuses: [
        "green_direct_live",
        "yellow_adjust_or_review",
        "red_blocked_manual_review",
      ],
      summary:
        "Verified Publisher klickt bewusst auf Veröffentlichen; Grün/Gelb/Rot bleibt Pflicht und der Agent veröffentlicht nie autonom.",
    },
    reviewPipeline: {
      reviewFirst: true,
      adminVisible: true,
      organizationVisible: true,
      publicStatusReadable: true,
      summary:
        "Review, Pipeline und Status bleiben über /admin/review, /admin/system und /account/organization/dashboard sichtbar, ohne daraus eine autonome Runtime zu machen.",
    },
    remainingControlledAgenticCodexReadyTaskIds,
    nextControlledAgenticTaskId: remainingControlledAgenticCodexReadyTaskIds[0] ?? null,
  };
}

export function buildAgenticCivicE2EPilotSummaryCards(
  contract: AgenticCivicE2EPilotContract,
): AgenticCivicE2EPilotSummaryCard[] {
  return [
    {
      id: "stage_coverage",
      title: "E2E Stages",
      body: `${contract.stages.length} review-first Stages von Bürgerbeobachtung bis Review-/Pipeline-Status; Safe Trace über ${contract.safeTraceSurfaceCount} Surfaces.`,
    },
    {
      id: "review_first",
      title: "Review-first Grenzen",
      body:
        "Claims, Dossier, Beteiligung und Handoff bleiben Kandidaten oder human-approved Gates; keine Fake-Quellen, keine Fake-Beteiligung und kein Auto-Publish.",
    },
    {
      id: "gov_light_handoff",
      title: "GOV-light / Handoff",
      body: contract.govLight.summary,
    },
    {
      id: "publisher_preflight",
      title: "Verified Publisher",
      body: contract.verifiedPublisherPreflight.summary,
    },
  ];
}

export function buildAgenticCivicE2ECreateHint() {
  return "Der Agentic Civic Pilot bleibt review-first: Beobachtung, Format, Claims, Dossier, Beteiligung und Handoff werden vorbereitet, aber nichts wird automatisch veröffentlicht oder extern benachrichtigt.";
}

export function buildAgenticCivicE2EAccountHint() {
  return "Persönliche Beobachtung, regionale Relevanz und spätere institutionelle Weitergabe bleiben getrennt; Consent steuert Profilspeicher, öffentliche Debattenstände bleiben frei lesbar.";
}

export function buildAgenticCivicE2EOrganizationHint() {
  return "Der E2E-Pilot verbindet Dossier, Beteiligung, GOV-light und Municipal Handoff als Statuspfad, ohne Behördenkontakt, Entitlement-Aktivierung oder Auto-Publish auszulösen.";
}

export function buildAgenticCivicE2EAdminHint() {
  return "Der Agentic Civic E2E Pilot bündelt Intake, Safe Trace, Claims, Dossier, Beteiligung, GOV-light und Preflight in einem read-only Review-/Pipeline-Pfad ohne Runtime-Aktivierung.";
}

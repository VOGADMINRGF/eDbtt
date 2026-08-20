import {
  buildAgentSafeTraceStep,
  type AgentSafeTraceStatus,
  type AgentSafeTraceRequiredHumanAction,
} from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";
import type { AgentRoleId } from "@/features/agenticRuntime/agentRegistryBootstrapContract";
import {
  RegionalAgentRunSchema,
  type RegionalAgentRun,
} from "./contracts";

const CONTRACT_REF =
  "docs/E150/MARKETING-REGIONAL-CIVIC-OPPORTUNITY-AGENT-01_DECISIONS_2026-07-26.md";
const PLAYBOOK_REF = "docs/marketing/agent-playbooks/regional-civic-campaign-operator.md";
const CREATED_AT = "2026-08-02T09:00:00+02:00";

function traceStep(input: {
  runId: string;
  stepId: string;
  label: string;
  status: AgentSafeTraceStatus;
  action: AgentSafeTraceRequiredHumanAction;
  role: AgentRoleId;
  inputId: string;
  inputType: "source_reference" | "source_pack" | "regional_signal";
  outputId: string;
  outputType: "source_pack" | "regional_signal" | "candidate_preview" | "review_handoff";
  evidenceRefs: string[];
}) {
  return buildAgentSafeTraceStep({
    taskId: "MARKETING-REGIONAL-AGENT-RUN-READMODEL-01",
    stepId: input.stepId,
    surface: `/admin/marketing/agent/runs/${input.runId}`,
    userSafeLabel: input.label,
    status: input.status,
    confidenceLabel: input.status === "completed" ? "guarded" : "review_required",
    requiredHumanAction: input.action,
    inputArtifacts: [
      {
        id: input.inputId,
        type: input.inputType,
        label: input.inputId,
        reviewState: "present",
      },
    ],
    outputArtifacts: [
      {
        id: input.outputId,
        type: input.outputType,
        label: input.outputId,
        reviewState: input.status === "completed" ? "present" : "review_required",
      },
    ],
    evidenceRefs: input.evidenceRefs,
    primaryRole: input.role,
    supportingRoles: ["governance_compliance"],
  });
}

const berlinMunicipalRun: RegionalAgentRun = {
  schemaVersion: "1.0.0",
  id: "regional-run-berlin-mitte-2026-07-fixture",
  operatorProfileVersion: "regional-civic-operator.readmodel.v1",
  purpose: "discover_civic_topics",
  status: "review_ready",
  reviewRequired: true,
  reviewState: "review_ready",
  requestedBy: "repository_fixture",
  configuration: {
    region: {
      id: "region-de-be-mitte",
      displayName: "Berlin · Bezirk Mitte",
      type: "district",
      countryCode: "DE",
      subdivisionCode: "DE-BE",
      timezone: "Europe/Berlin",
    },
    jurisdiction: {
      id: "jurisdiction-berlin-mitte-municipal",
      displayName: "Bezirk Mitte von Berlin",
      politicalLevel: "municipal",
      authorityRefs: ["fixture-authority-bezirksamt-mitte"],
    },
    period: {
      startsAt: "2026-07-21T00:00:00+02:00",
      endsAt: "2026-07-24T23:59:59+02:00",
      freshnessPolicy: "fixture_snapshot",
    },
    topicFrame: {
      topicKeys: ["mobility", "school-routes", "local-administration"],
      excludedTopicKeys: ["political-person-profiles"],
      maximumCandidates: 3,
    },
    languages: {
      originalLanguages: ["de-DE"],
      readingLanguage: "de-DE",
      interfaceLanguage: "de",
      outputLanguages: ["de-DE", "en-GB"],
      preserveOriginal: true,
      translationIsEvidence: false,
    },
    outputDepth: "standard",
    sourcePackIds: ["source-pack-berlin-mitte-manual-fixture"],
  },
  runtimeBoundaries: {
    executionMode: "read_only",
    externalSearch: "no_external_search",
    providerApi: "disabled",
    campaignMutation: "disabled",
    assetGeneration: "disabled",
    analyticsRecommendation: "disabled",
    publishing: "disabled",
    externalMessaging: "disabled",
    politicalPersonProfiles: "disabled",
  },
  sourcePacks: [
    {
      id: "source-pack-berlin-mitte-manual-fixture",
      label: "Berlin-Mitte · manuelles Kommunal-Fixture",
      collectionMode: "repository_fixture",
      externalSearchUsed: false,
      coverageStatus: "sufficient_for_fixture",
      sources: [
        {
          id: "source-berlin-mitte-school-routes-fixture",
          title: "Fixture · Arbeitsstand sichere Schulwege im Bezirk",
          issuer: "Bezirksamt Mitte von Berlin (Fixture-Metadaten)",
          sourceClass: "official_primary",
          stableRef: "fixture:berlin-mitte:school-routes:2026-07",
          url: null,
          originalLanguage: "de-DE",
          jurisdictionId: "jurisdiction-berlin-mitte-municipal",
          publishedAt: "2026-07-22T10:00:00+02:00",
          retrievedAt: "2026-07-24T15:30:00+02:00",
          evidenceStatus: "fixture_only",
          freshnessStatus: "current",
          translationStatus: "original",
          provenance: {
            mode: "repository_fixture",
            recordedBy: "eDebatte fixture registry",
            recordedAt: CREATED_AT,
            note: "Manuell hinterlegte Testprovenienz; keine Live-Abfrage und keine behauptete Produktionsquelle.",
          },
          limitations: ["Nur für den Readmodel-Vertrag; fachlicher Inhalt ist nicht produktiv verifiziert."],
        },
        {
          id: "source-berlin-state-mobility-context-fixture",
          title: "Fixture · Berliner Mobilitätskontext für kommunale Schulwege",
          issuer: "Land Berlin (Fixture-Metadaten)",
          sourceClass: "official_primary",
          stableRef: "fixture:berlin-state:mobility-context:2026-07",
          url: null,
          originalLanguage: "de-DE",
          jurisdictionId: "jurisdiction-berlin-mitte-municipal",
          publishedAt: "2026-07-21T09:00:00+02:00",
          retrievedAt: "2026-07-24T15:35:00+02:00",
          evidenceStatus: "fixture_only",
          freshnessStatus: "current",
          translationStatus: "original",
          provenance: {
            mode: "manual_source_pack",
            recordedBy: "eDebatte fixture registry",
            recordedAt: CREATED_AT,
            note: "Manueller Source-Pack-Eintrag ohne Provider, Suche oder externe Synchronisierung.",
          },
          limitations: ["Zuständigkeit und Aussagen benötigen vor jeder Nutzung eine menschliche Quellenprüfung."],
        },
      ],
      missingCoverage: [],
      createdAt: CREATED_AT,
    },
  ],
  evidenceRefs: [
    {
      id: "evidence-berlin-contract",
      type: "decision_contract",
      ref: CONTRACT_REF,
      status: "qualified",
      note: "Kanonischer Produkt- und Guardrail-Vertrag.",
    },
    {
      id: "evidence-berlin-source-pack",
      type: "manual_fixture",
      ref: "source-pack-berlin-mitte-manual-fixture",
      status: "fixture_only",
      note: "Repo-backed Source Pack mit sichtbarer Fixture-Kennzeichnung.",
    },
  ],
  blockerRefs: [],
  opportunityCandidates: [
    {
      id: "candidate-berlin-safe-school-routes",
      registryOpportunityId: "MOP-REGIONAL-AGENT-01",
      title: "Sichere Schulwege in Berlin-Mitte prüfen",
      summary: "Vorschlag für eine fachliche Prüfung eines kommunalen Beteiligungsanlasses.",
      candidateStatus: "suggested",
      disposition: "suggestion_only",
      humanDecisionRequired: true,
      evidenceRefs: ["evidence-berlin-contract", "evidence-berlin-source-pack"],
      blockerRefs: [],
      rationale: "Region, kommunale Ebene und manuelle Quellenmetadaten sind vorhanden; Inhalt und Beteiligungseignung bleiben ungeprüft.",
    },
  ],
  safeTrace: {
    safeForUser: true,
    containsPrivateChainOfThought: false,
    containsPromptData: false,
    containsSecrets: false,
    steps: [
      traceStep({
        runId: "regional-run-berlin-mitte-2026-07-fixture",
        stepId: "configuration_loaded",
        label: "Region, kommunale Zuständigkeit, Zeitraum, Themenrahmen und vier Sprachrollen wurden aus dem Fixture geladen.",
        status: "completed",
        action: "none",
        role: "governance_compliance",
        inputId: "regional-run-berlin-mitte-2026-07-fixture",
        inputType: "regional_signal",
        outputId: "configuration-berlin-mitte",
        outputType: "regional_signal",
        evidenceRefs: [CONTRACT_REF],
      }),
      traceStep({
        runId: "regional-run-berlin-mitte-2026-07-fixture",
        stepId: "manual_source_pack_review",
        label: "Zwei manuell hinterlegte Source-Pack-Einträge wurden nur auf vorhandene Provenienzfelder geprüft.",
        status: "review_required",
        action: "verify_source_provenance",
        role: "research_source",
        inputId: "source-pack-berlin-mitte-manual-fixture",
        inputType: "source_pack",
        outputId: "source-pack-berlin-mitte-review",
        outputType: "source_pack",
        evidenceRefs: ["evidence-berlin-source-pack"],
      }),
      traceStep({
        runId: "regional-run-berlin-mitte-2026-07-fixture",
        stepId: "opportunity_candidate_proposed",
        label: "Ein Opportunity-Kandidat wurde als Vorschlag markiert; es wurde nichts akzeptiert, erstellt oder veröffentlicht.",
        status: "review_required",
        action: "triage_regional_relevance",
        role: "dossier_briefing",
        inputId: "source-pack-berlin-mitte-review",
        inputType: "source_pack",
        outputId: "candidate-berlin-safe-school-routes",
        outputType: "candidate_preview",
        evidenceRefs: ["evidence-berlin-contract", "evidence-berlin-source-pack"],
      }),
    ],
  },
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
};

const multilingualRun: RegionalAgentRun = {
  schemaVersion: "1.0.0",
  id: "regional-run-berlin-neukoelln-multilingual-fixture",
  operatorProfileVersion: "regional-civic-operator.readmodel.v1",
  purpose: "evaluate_existing_opportunities",
  status: "blocked",
  reviewRequired: true,
  reviewState: "blocked",
  requestedBy: "repository_fixture",
  configuration: {
    region: {
      id: "region-de-be-neukoelln",
      displayName: "Berlin · Bezirk Neukölln",
      type: "district",
      countryCode: "DE",
      subdivisionCode: "DE-BE",
      timezone: "Europe/Berlin",
    },
    jurisdiction: {
      id: "jurisdiction-berlin-neukoelln-municipal",
      displayName: "Bezirk Neukölln von Berlin",
      politicalLevel: "municipal",
      authorityRefs: ["fixture-authority-bezirksamt-neukoelln"],
    },
    period: {
      startsAt: "2026-07-18T00:00:00+02:00",
      endsAt: "2026-07-25T23:59:59+02:00",
      freshnessPolicy: "fixture_snapshot",
    },
    topicFrame: {
      topicKeys: ["housing", "local-services", "multilingual-participation"],
      excludedTopicKeys: ["political-person-profiles"],
      maximumCandidates: 4,
    },
    languages: {
      originalLanguages: ["de-DE", "tr-TR", "ar"],
      readingLanguage: "en-GB",
      interfaceLanguage: "en",
      outputLanguages: ["de-DE", "en-GB", "tr-TR"],
      preserveOriginal: true,
      translationIsEvidence: false,
    },
    outputDepth: "detailed",
    sourcePackIds: ["source-pack-neukoelln-multilingual-fixture"],
  },
  runtimeBoundaries: {
    executionMode: "read_only",
    externalSearch: "no_external_search",
    providerApi: "disabled",
    campaignMutation: "disabled",
    assetGeneration: "disabled",
    analyticsRecommendation: "disabled",
    publishing: "disabled",
    externalMessaging: "disabled",
    politicalPersonProfiles: "disabled",
  },
  sourcePacks: [
    {
      id: "source-pack-neukoelln-multilingual-fixture",
      label: "Neukölln · mehrsprachiges manuelles Fixture",
      collectionMode: "manual_source_pack",
      externalSearchUsed: false,
      coverageStatus: "language_gap",
      sources: [
        {
          id: "source-neukoelln-housing-de-fixture",
          title: "Fixture · Kommunaler Arbeitsstand Wohnen",
          issuer: "Bezirksamt Neukölln von Berlin (Fixture-Metadaten)",
          sourceClass: "official_primary",
          stableRef: "fixture:neukoelln:housing:de:2026-07",
          url: null,
          originalLanguage: "de-DE",
          jurisdictionId: "jurisdiction-berlin-neukoelln-municipal",
          publishedAt: "2026-07-20T08:00:00+02:00",
          retrievedAt: "2026-07-25T11:00:00+02:00",
          evidenceStatus: "fixture_only",
          freshnessStatus: "current",
          translationStatus: "original",
          provenance: {
            mode: "repository_fixture",
            recordedBy: "eDebatte fixture registry",
            recordedAt: CREATED_AT,
            note: "Deutscher Fixture-Eintrag; keine Live-Quelle.",
          },
          limitations: ["Inhalt nicht produktiv verifiziert."],
        },
        {
          id: "source-neukoelln-community-tr-fixture",
          title: "Fixture · Yerel hizmetlere erişim hakkında topluluk notu",
          issuer: "eDebatte Fixture-Redaktion",
          sourceClass: "civil_society_context",
          stableRef: "fixture:neukoelln:community:tr:2026-07",
          url: null,
          originalLanguage: "tr-TR",
          jurisdictionId: "jurisdiction-berlin-neukoelln-municipal",
          publishedAt: "2026-07-21T12:00:00+02:00",
          retrievedAt: "2026-07-25T11:05:00+02:00",
          evidenceStatus: "fixture_only",
          freshnessStatus: "current",
          translationStatus: "machine_reading_support",
          provenance: {
            mode: "manual_source_pack",
            recordedBy: "eDebatte fixture registry",
            recordedAt: CREATED_AT,
            note: "Türkischer Fixture-Eintrag mit ungeprüfter Lesehilfe; Übersetzung ist keine Evidenz.",
          },
          limitations: ["Menschliche Sprach- und Quellenprüfung fehlt."],
        },
        {
          id: "source-neukoelln-community-ar-fixture",
          title: "Fixture · ملاحظة مجتمعية حول الخدمات المحلية",
          issuer: "eDebatte Fixture-Redaktion",
          sourceClass: "community_signal",
          stableRef: "fixture:neukoelln:community:ar:2026-07",
          url: null,
          originalLanguage: "ar",
          jurisdictionId: "jurisdiction-berlin-neukoelln-municipal",
          publishedAt: "2026-07-22T13:00:00+02:00",
          retrievedAt: "2026-07-25T11:10:00+02:00",
          evidenceStatus: "review_required",
          freshnessStatus: "current",
          translationStatus: "machine_reading_support",
          provenance: {
            mode: "manual_source_pack",
            recordedBy: "eDebatte fixture registry",
            recordedAt: CREATED_AT,
            note: "Arabischer Fixture-Eintrag; Community-Signal und Lesehilfe bleiben prüfpflichtig.",
          },
          limitations: ["Keine menschlich geprüfte arabische Lesefassung vorhanden.", "Community-Signal ist keine Tatsachenevidenz."],
        },
      ],
      missingCoverage: ["Human review for Arabic reading support", "Independent professional context source"],
      createdAt: CREATED_AT,
    },
  ],
  evidenceRefs: [
    {
      id: "evidence-multilingual-playbook",
      type: "decision_contract",
      ref: PLAYBOOK_REF,
      status: "qualified",
      note: "Sprachtrennung und Stop Conditions aus dem kanonischen Playbook.",
    },
    {
      id: "evidence-multilingual-source-pack",
      type: "manual_fixture",
      ref: "source-pack-neukoelln-multilingual-fixture",
      status: "review_required",
      note: "Mehrsprachiges manuelles Source Pack mit offener Sprachabdeckung.",
    },
  ],
  blockerRefs: [
    {
      id: "blocker-arabic-human-review",
      code: "language-coverage-gap",
      status: "open",
      summary: "Die arabische Lesehilfe und institutionelle Terminologie wurden nicht menschlich geprüft.",
      evidenceRefs: ["evidence-multilingual-source-pack"],
    },
  ],
  opportunityCandidates: [
    {
      id: "candidate-neukoelln-local-services",
      registryOpportunityId: "MOP-REGIONAL-AGENT-01",
      title: "Mehrsprachigen Zugang zu lokalen Diensten prüfen",
      summary: "Blockierter Vorschlag, bis Sprach- und Quellenabdeckung menschlich geprüft sind.",
      candidateStatus: "blocked",
      disposition: "suggestion_only",
      humanDecisionRequired: true,
      evidenceRefs: ["evidence-multilingual-playbook", "evidence-multilingual-source-pack"],
      blockerRefs: ["blocker-arabic-human-review"],
      rationale: "Mehrere Originalsprachen sind vorhanden, aber die Sprachbrücke ist noch nicht belastbar genug für eine Opportunity-Entscheidung.",
    },
  ],
  safeTrace: {
    safeForUser: true,
    containsPrivateChainOfThought: false,
    containsPromptData: false,
    containsSecrets: false,
    steps: [
      traceStep({
        runId: "regional-run-berlin-neukoelln-multilingual-fixture",
        stepId: "multilingual_configuration_loaded",
        label: "Original-, Lese-, Bedien- und Ausgabesprachen wurden getrennt aus der Run-Konfiguration geladen.",
        status: "completed",
        action: "none",
        role: "governance_compliance",
        inputId: "regional-run-berlin-neukoelln-multilingual-fixture",
        inputType: "regional_signal",
        outputId: "language-context-neukoelln",
        outputType: "regional_signal",
        evidenceRefs: [PLAYBOOK_REF],
      }),
      traceStep({
        runId: "regional-run-berlin-neukoelln-multilingual-fixture",
        stepId: "language_bridge_review",
        label: "Türkische und arabische Lesehilfen wurden als Übersetzungen markiert; sie gelten nicht als Evidenz.",
        status: "review_required",
        action: "verify_source_provenance",
        role: "research_source",
        inputId: "source-pack-neukoelln-multilingual-fixture",
        inputType: "source_pack",
        outputId: "language-bridge-review-neukoelln",
        outputType: "source_pack",
        evidenceRefs: ["evidence-multilingual-source-pack"],
      }),
      traceStep({
        runId: "regional-run-berlin-neukoelln-multilingual-fixture",
        stepId: "language_coverage_blocked",
        label: "Der Opportunity-Vorschlag bleibt wegen fehlender menschlicher Sprachprüfung blockiert.",
        status: "blocked",
        action: "continue_manually",
        role: "governance_compliance",
        inputId: "language-bridge-review-neukoelln",
        inputType: "source_pack",
        outputId: "blocker-arabic-human-review",
        outputType: "review_handoff",
        evidenceRefs: ["blocker-arabic-human-review"],
      }),
    ],
  },
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
};

const failedFixtureRun: RegionalAgentRun = {
  ...berlinMunicipalRun,
  id: "regional-run-fixture-ingest-failed",
  status: "failed",
  reviewState: "failed",
  configuration: {
    ...berlinMunicipalRun.configuration,
    region: {
      ...berlinMunicipalRun.configuration.region,
      id: "region-de-be-fixture-error",
      displayName: "Berlin · fehlerhaftes Fixture",
    },
    jurisdiction: {
      ...berlinMunicipalRun.configuration.jurisdiction,
      id: "jurisdiction-berlin-fixture-error",
      displayName: "Nicht aufgelöste Fixture-Jurisdiktion",
    },
    sourcePackIds: ["source-pack-berlin-ingest-error-fixture"],
  },
  sourcePacks: [
    {
      ...berlinMunicipalRun.sourcePacks[0],
      id: "source-pack-berlin-ingest-error-fixture",
      label: "Berlin · kontrolliertes Fehler-Fixture",
      coverageStatus: "jurisdiction_gap",
      sources: berlinMunicipalRun.sourcePacks[0].sources.map((source) => ({
        ...source,
        jurisdictionId: "jurisdiction-berlin-fixture-error",
      })),
      missingCoverage: ["Manual jurisdiction mapping could not be resolved"],
    },
  ],
  evidenceRefs: [
    {
      id: "evidence-fixture-ingest-error",
      type: "manual_fixture",
      ref: "source-pack-berlin-ingest-error-fixture",
      status: "rejected",
      note: "Kontrollierter Fehlerzustand für den Readmodel- und UI-Vertrag.",
    },
  ],
  blockerRefs: [
    {
      id: "blocker-fixture-jurisdiction-error",
      code: "jurisdiction-resolution-error",
      status: "terminal",
      summary: "Die manuell angegebene Fixture-Jurisdiktion konnte nicht belastbar aufgelöst werden.",
      evidenceRefs: ["evidence-fixture-ingest-error"],
    },
  ],
  opportunityCandidates: [],
  safeTrace: {
    safeForUser: true,
    containsPrivateChainOfThought: false,
    containsPromptData: false,
    containsSecrets: false,
    steps: [
      traceStep({
        runId: "regional-run-fixture-ingest-failed",
        stepId: "fixture_jurisdiction_failed",
        label: "Die Fixture-Jurisdiktion konnte nicht aufgelöst werden; der Read-only Run wurde ohne Folgeaktion gestoppt.",
        status: "blocked",
        action: "continue_manually",
        role: "governance_compliance",
        inputId: "source-pack-berlin-ingest-error-fixture",
        inputType: "source_pack",
        outputId: "blocker-fixture-jurisdiction-error",
        outputType: "review_handoff",
        evidenceRefs: ["evidence-fixture-ingest-error"],
      }),
    ],
  },
};

const FIXTURE_RUNS = [berlinMunicipalRun, multilingualRun, failedFixtureRun] as const;

export function getRegionalAgentRunFixtures(): RegionalAgentRun[] {
  return FIXTURE_RUNS.map((run) => RegionalAgentRunSchema.parse(run));
}

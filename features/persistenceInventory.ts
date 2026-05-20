import { shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  getContentReleaseRepository,
  listContentReleaseAuditEvents,
  type ContentPublishAuditEvent,
  type ContentReleaseRepository,
} from "@features/contentReleaseWorkbench";
import {
  getPublicTopicPageRepository,
  type PublicTopicPageRepository,
} from "@features/publicTopicPage";
import {
  getReviewQueueOperationsRepository,
  listReviewQueueOperationAuditEvents,
  type ReviewQueueOperationAuditEvent,
  type ReviewQueueOperationsRepository,
} from "@features/reviewQueueOperations";
import {
  getSourceConnectionRepository,
  type SourceConnectionRepository,
} from "@features/region/server/sourceConnectionRuntime";
import {
  getCreateHandoffRepository,
  type CreateHandoffRepository,
} from "@/features/create/persistedHandoffReviewQueue";

export const PERSISTENCE_SURFACES = [
  "create_handoffs",
  "review_queue_items",
  "review_queue_operations",
  "source_connections",
  "source_results",
  "snapshot_templates",
  "content_release_workbench",
  "publish_preview_visibility",
  "topic_pages",
  "audit_activity_events",
] as const;

export type PersistenceSurface = (typeof PERSISTENCE_SURFACES)[number];

export const PERSISTENCE_MODES = [
  "persistent",
  "runtime",
  "fixture",
  "in_memory",
  "derived",
] as const;

export type PersistenceMode = (typeof PERSISTENCE_MODES)[number];

export const PERSISTENCE_RISKS = ["low", "medium", "high", "critical"] as const;

export type PersistenceRisk = (typeof PERSISTENCE_RISKS)[number];

export const PERSISTENCE_HARDENING_ACTIONS = [
  "keep_persistent_primary",
  "replace_in_memory_truth_before_rollout",
  "persist_runtime_overlay_before_rollout",
  "document_derived_surface_boundary",
  "separate_fixture_seed_from_production_truth",
  "stabilize_audit_repository_contract",
] as const;

export type PersistenceHardeningAction =
  (typeof PERSISTENCE_HARDENING_ACTIONS)[number];

export const PERSISTENCE_REPOSITORY_INTERFACES = [
  "CreateHandoffRepository",
  "ReviewQueueOperationsRepository",
  "SourceConnectionRepository",
  "ContentReleaseRepository",
  "PublicTopicPageRepository",
  "AuditEventRepository",
] as const;

export type PersistenceRepositoryInterface =
  (typeof PERSISTENCE_REPOSITORY_INTERFACES)[number];

export type PersistenceSurfaceEntry = {
  surface: PersistenceSurface;
  label: string;
  effectiveMode: PersistenceMode;
  sourceOfTruthMode: PersistenceMode;
  supportingModes: PersistenceMode[];
  repositoryInterfaces: PersistenceRepositoryInterface[];
  productionCandidateMode: PersistenceMode;
  restartRisk: PersistenceRisk;
  deploymentRisk: PersistenceRisk;
  currentTruth: string;
  restartRiskSummary: string;
  deploymentRiskSummary: string;
  nextHardening: PersistenceHardeningAction;
  nextHardeningSummary: string;
  productionCandidateReady: boolean;
};

export type PersistenceInventoryReadModel = {
  entries: PersistenceSurfaceEntry[];
  summary: {
    fallbackActive: boolean;
    surfaceCount: number;
    persistentCount: number;
    derivedCount: number;
    inMemoryCount: number;
    fixtureInvolvedCount: number;
    highRiskCount: number;
  };
  guardrails: {
    noInMemoryTruthClaimForProduction: true;
    noFixtureTruthClaimForProduction: true;
    noAutoPublish: true;
    noAutoPublicOfficial: true;
  };
};

export type AuditEventRepository = {
  listContentReleaseEvents(recordId: string): Promise<ContentPublishAuditEvent[]>;
  listReviewQueueOperationEvents(itemId: string): Promise<ReviewQueueOperationAuditEvent[]>;
};

export type PersistenceRepositoryRegistry = {
  createHandoffs: CreateHandoffRepository;
  reviewQueueOperations: ReviewQueueOperationsRepository;
  sourceConnections: SourceConnectionRepository;
  contentRelease: ContentReleaseRepository;
  publicTopicPages: PublicTopicPageRepository;
  auditEvents: AuditEventRepository;
};

const PERSISTENCE_GUARDRAILS: PersistenceInventoryReadModel["guardrails"] = {
  noInMemoryTruthClaimForProduction: true,
  noFixtureTruthClaimForProduction: true,
  noAutoPublish: true,
  noAutoPublicOfficial: true,
};

function repoBackedMode(fallbackActive: boolean): PersistenceMode {
  return fallbackActive ? "in_memory" : "persistent";
}

function repoBackedRestartRisk(fallbackActive: boolean): PersistenceRisk {
  return fallbackActive ? "critical" : "low";
}

function repoBackedDeploymentRisk(fallbackActive: boolean): PersistenceRisk {
  return fallbackActive ? "high" : "medium";
}

export function getAuditEventRepository(): AuditEventRepository {
  return {
    listContentReleaseEvents: listContentReleaseAuditEvents,
    listReviewQueueOperationEvents: listReviewQueueOperationAuditEvents,
  };
}

export function getPersistenceRepositoryRegistry(): PersistenceRepositoryRegistry {
  return {
    createHandoffs: getCreateHandoffRepository(),
    reviewQueueOperations: getReviewQueueOperationsRepository(),
    sourceConnections: getSourceConnectionRepository(),
    contentRelease: getContentReleaseRepository(),
    publicTopicPages: getPublicTopicPageRepository(),
    auditEvents: getAuditEventRepository(),
  };
}

export function buildPersistenceInventory(): PersistenceInventoryReadModel {
  const fallbackActive = shouldUseInMemoryMongoFallback();
  const persistentPrimaryMode = repoBackedMode(fallbackActive);

  const entries: PersistenceSurfaceEntry[] = [
    {
      surface: "create_handoffs",
      label: "Create Handoffs",
      effectiveMode: persistentPrimaryMode,
      sourceOfTruthMode: "persistent",
      supportingModes: ["in_memory"],
      repositoryInterfaces: ["CreateHandoffRepository"],
      productionCandidateMode: "persistent",
      restartRisk: repoBackedRestartRisk(fallbackActive),
      deploymentRisk: repoBackedDeploymentRisk(fallbackActive),
      currentTruth:
        "Mongo-Collection `create_handoff_review_items` ist die dauerhafte Wahrheit, solange die Runtime nicht im In-Memory-Fallback läuft.",
      restartRiskSummary: fallbackActive
        ? "Im In-Memory-Fallback gehen rohe Handoffs bei Restart verloren."
        : "Persistente Handoffs überstehen Restart und Deployment.",
      deploymentRiskSummary: fallbackActive
        ? "Ein Deployment im Fallback-Modus verliert die zuletzt geschriebenen Handoffs."
        : "Deployments bleiben stabil, solange Mongo erreichbar bleibt.",
      nextHardening: fallbackActive
        ? "replace_in_memory_truth_before_rollout"
        : "keep_persistent_primary",
      nextHardeningSummary: fallbackActive
        ? "Produktionsnahe Läufe dürfen Handoffs nicht nur im In-Memory-Overlay halten."
        : "Nur die Repo-Grenze stabil halten und die Persistenzgrenze weiter dokumentieren.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "review_queue_items",
      label: "Review Queue Items",
      effectiveMode: "derived",
      sourceOfTruthMode: "derived",
      supportingModes: ["persistent", "runtime", "in_memory"],
      repositoryInterfaces: [
        "CreateHandoffRepository",
        "ReviewQueueOperationsRepository",
        "SourceConnectionRepository",
        "ContentReleaseRepository",
      ],
      productionCandidateMode: "derived",
      restartRisk: "medium",
      deploymentRisk: "medium",
      currentTruth:
        "Die zentrale Review Queue ist ein Readmodel aus mehreren persistenten und teils runtime-nahen Quellen; sie ist keine eigene Primärpersistenz.",
      restartRiskSummary:
        "Derived Queue-Items bleiben nur stabil, wenn die zugrunde liegenden Stores persistent sind; In-Memory-Quellen verschwinden bei Restart.",
      deploymentRiskSummary:
        "Die Queue selbst braucht keine Migration, aber gemischte Wahrheiten aus Overlay-Quellen erzeugen nach Deployments Drift-Risiko.",
      nextHardening: "document_derived_surface_boundary",
      nextHardeningSummary:
        "Review Queue explizit als derived surface behandeln und keine derived Counts als alleinige Produktionswahrheit ausgeben.",
      productionCandidateReady: true,
    },
    {
      surface: "review_queue_operations",
      label: "Review Queue Operations",
      effectiveMode: persistentPrimaryMode,
      sourceOfTruthMode: "persistent",
      supportingModes: ["in_memory"],
      repositoryInterfaces: ["ReviewQueueOperationsRepository", "AuditEventRepository"],
      productionCandidateMode: "persistent",
      restartRisk: repoBackedRestartRisk(fallbackActive),
      deploymentRisk: repoBackedDeploymentRisk(fallbackActive),
      currentTruth:
        "Zuweisung, Notizen und Statuswechsel liegen dauerhaft in `review_queue_operation_records` plus Audit-Collection, solange keine In-Memory-Runtime aktiv ist.",
      restartRiskSummary: fallbackActive
        ? "Assignment-/Status-/Notiz-Overlay fällt bei Restart weg."
        : "Operatorischer Status bleibt über Restart erhalten.",
      deploymentRiskSummary: fallbackActive
        ? "Deployments im Fallback verlieren operative Queue-Historie."
        : "Deployments bleiben stabil, wenn die Audit-Collections erreichbar bleiben.",
      nextHardening: fallbackActive
        ? "replace_in_memory_truth_before_rollout"
        : "stabilize_audit_repository_contract",
      nextHardeningSummary: fallbackActive
        ? "Operative Queue-Zustände dürfen im Rollout nicht auf In-Memory beruhen."
        : "Den Audit-Repo-Vertrag als gemeinsame Aktivitätsquelle weiter ausrollen.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "source_connections",
      label: "Source Connections",
      effectiveMode: persistentPrimaryMode,
      sourceOfTruthMode: "persistent",
      supportingModes: ["in_memory"],
      repositoryInterfaces: ["SourceConnectionRepository"],
      productionCandidateMode: "persistent",
      restartRisk: repoBackedRestartRisk(fallbackActive),
      deploymentRisk: repoBackedDeploymentRisk(fallbackActive),
      currentTruth:
        "Explizit konfigurierte Quellen leben persistent in `edebatte_region_source_connections`, sonst nur im In-Memory-Overlay.",
      restartRiskSummary: fallbackActive
        ? "Quelle-Konfigurationen gehen im Fallback bei Restart verloren."
        : "Persistente Source Connections bleiben über Restart erhalten.",
      deploymentRiskSummary: fallbackActive
        ? "Deployment im Fallback verliert Konfiguration und Snapshot-Seed-Kontext."
        : "Kein zusätzlicher Deployment-Risikohebel außer DB-Erreichbarkeit.",
      nextHardening: fallbackActive
        ? "replace_in_memory_truth_before_rollout"
        : "keep_persistent_primary",
      nextHardeningSummary: fallbackActive
        ? "Quellenkonfiguration darf vor Rollout nicht nur pro Prozess leben."
        : "Repo-Schnittstelle stabil halten und weiter für alle Quellpfade nutzen.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "source_results",
      label: "Source Dry Runs / Source Results",
      effectiveMode: persistentPrimaryMode,
      sourceOfTruthMode: "persistent",
      supportingModes: ["in_memory", "fixture"],
      repositoryInterfaces: ["SourceConnectionRepository"],
      productionCandidateMode: "persistent",
      restartRisk: repoBackedRestartRisk(fallbackActive),
      deploymentRisk: repoBackedDeploymentRisk(fallbackActive),
      currentTruth:
        "Dry-Run-Ergebnisse werden in `edebatte_region_source_test_results` abgelegt; Beispiel-/Fixture-Snapshots bleiben nur Inputmaterial, nicht die Primärwahrheit.",
      restartRiskSummary: fallbackActive
        ? "Zuletzt erzeugte Source Results verschwinden im In-Memory-Fallback bei Restart."
        : "Persistierte Source Results bleiben restart-stabil.",
      deploymentRiskSummary: fallbackActive
        ? "Deployments im Fallback verlieren Review-Ausgangslagen aus Dry Runs."
        : "Deployments sind stabil, solange Result-Collection persistent bleibt.",
      nextHardening: fallbackActive
        ? "replace_in_memory_truth_before_rollout"
        : "separate_fixture_seed_from_production_truth",
      nextHardeningSummary: fallbackActive
        ? "Source Results dürfen im Pilot nicht nur Runtime-Overlay sein."
        : "Fixture-Snapshots weiter klar vom persistierten Dry-Run-Ergebnis trennen.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "snapshot_templates",
      label: "Snapshot Templates",
      effectiveMode: "derived",
      sourceOfTruthMode: "derived",
      supportingModes: ["persistent", "fixture"],
      repositoryInterfaces: ["SourceConnectionRepository"],
      productionCandidateMode: "derived",
      restartRisk: "medium",
      deploymentRisk: "medium",
      currentTruth:
        "Snapshot Templates sind abgeleitete Konfiguration aus Source Connections; Beispiel-Seeds bleiben bewusst gekennzeichnet und sind keine eigenständige Produktionspersistenz.",
      restartRiskSummary:
        "Derived Templates bleiben nur stabil, wenn ihre Source-Connection-Basis persistent ist; Beispiel-Seeds allein sind keine dauerhafte Wahrheit.",
      deploymentRiskSummary:
        "Deployments bleiben unkritisch, solange persistente Connection-Konfigurationen erhalten bleiben und Example-Seeds nicht als Produktionswahrheit ausgegeben werden.",
      nextHardening: "separate_fixture_seed_from_production_truth",
      nextHardeningSummary:
        "Example-Seeds und kuratierte Pilot-Snapshots weiter explizit markieren und nicht mit dauerhaftem Source-Result gleichsetzen.",
      productionCandidateReady: true,
    },
    {
      surface: "content_release_workbench",
      label: "Content Release Workbench",
      effectiveMode: persistentPrimaryMode,
      sourceOfTruthMode: "persistent",
      supportingModes: ["in_memory", "derived"],
      repositoryInterfaces: ["ContentReleaseRepository", "AuditEventRepository"],
      productionCandidateMode: "persistent",
      restartRisk: repoBackedRestartRisk(fallbackActive),
      deploymentRisk: repoBackedDeploymentRisk(fallbackActive),
      currentTruth:
        "Prepared Targets, Sichtbarkeit und Audit liegen in `content_release_workbench_targets` plus Audit-Collection, solange keine In-Memory-Runtime aktiv ist.",
      restartRiskSummary: fallbackActive
        ? "Prepared Targets und Visibility-Schritte gehen im Fallback bei Restart verloren."
        : "Workbench-Status bleibt über Restart erhalten.",
      deploymentRiskSummary: fallbackActive
        ? "Deployments im Fallback verlieren Sichtbarkeits- und Preview-Zustände."
        : "Deployments bleiben stabil, wenn die Content-Release-Collections persistent sind.",
      nextHardening: fallbackActive
        ? "replace_in_memory_truth_before_rollout"
        : "stabilize_audit_repository_contract",
      nextHardeningSummary: fallbackActive
        ? "Publish-Preview und Visibility dürfen im Rollout nicht auf Prozessspeicher beruhen."
        : "Audit-Events und Target-Repo als gemeinsame Content-Release-Grenze weiter stabilisieren.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "publish_preview_visibility",
      label: "Publish Preview / Visibility / Revoke / Archive",
      effectiveMode: "derived",
      sourceOfTruthMode: "derived",
      supportingModes: ["persistent", "in_memory"],
      repositoryInterfaces: ["ContentReleaseRepository", "AuditEventRepository"],
      productionCandidateMode: "derived",
      restartRisk: fallbackActive ? "high" : "low",
      deploymentRisk: fallbackActive ? "high" : "medium",
      currentTruth:
        "Publish Preview ist ein derived readmodel aus Content-Release-Targets plus Audit-Events; es ist kein eigener zweiter Persistenzpfad.",
      restartRiskSummary: fallbackActive
        ? "Derived Publish-Preview fällt aus, wenn Targets nur im In-Memory-Overlay leben."
        : "Derived Visibility bleibt stabil, solange die zugrunde liegenden Records persistent sind.",
      deploymentRiskSummary: fallbackActive
        ? "Deployments im Fallback verlieren die gesamte Visibility-Historie."
        : "Kein eigener Deployment-Risikohebel, aber Abhängigkeit vom persistenten Workbench-Store.",
      nextHardening: "document_derived_surface_boundary",
      nextHardeningSummary:
        "Preview-/Visibility-Readmodel weiter explizit als abgeleitete Sicht auf Content-Release-Records behandeln.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "topic_pages",
      label: "Topic Pages",
      effectiveMode: "derived",
      sourceOfTruthMode: "derived",
      supportingModes: ["persistent", "in_memory"],
      repositoryInterfaces: ["PublicTopicPageRepository", "ContentReleaseRepository"],
      productionCandidateMode: "derived",
      restartRisk: fallbackActive ? "high" : "low",
      deploymentRisk: fallbackActive ? "high" : "medium",
      currentTruth:
        "Öffentliche Topic Pages haben keinen separaten Persistenzpfad; sie werden aus Content-Release-Targets abgeleitet.",
      restartRiskSummary: fallbackActive
        ? "Topic Pages verschwinden bei Restart, wenn die zugrunde liegenden Targets nur in-memory existieren."
        : "Topic Pages bleiben stabil, solange Content-Release persistent bleibt.",
      deploymentRiskSummary: fallbackActive
        ? "Deployments im Fallback entziehen Topic Pages ihre zugrunde liegende Wahrheit."
        : "Kein eigener Deploy-Risikohebel, aber klare Abhängigkeit vom Content-Release-Store.",
      nextHardening: "document_derived_surface_boundary",
      nextHardeningSummary:
        "Topic Page bewusst als leichtes derived public target behandeln, nicht als eigenständige Primärpersistenz.",
      productionCandidateReady: !fallbackActive,
    },
    {
      surface: "audit_activity_events",
      label: "Audit- / Activity-Events",
      effectiveMode: fallbackActive ? "in_memory" : "persistent",
      sourceOfTruthMode: "persistent",
      supportingModes: ["derived", "in_memory"],
      repositoryInterfaces: ["AuditEventRepository"],
      productionCandidateMode: "persistent",
      restartRisk: repoBackedRestartRisk(fallbackActive),
      deploymentRisk: repoBackedDeploymentRisk(fallbackActive),
      currentTruth:
        "Audit-Events liegen heute verteilt in Review-Queue- und Content-Release-Stores; Activity-Readmodels leiten sich daraus ab.",
      restartRiskSummary: fallbackActive
        ? "Audit-Historie geht im In-Memory-Fallback bei Restart verloren."
        : "Persistente Audit-Collections halten Visibility- und Operations-Historie über Restart.",
      deploymentRiskSummary: fallbackActive
        ? "Deployments im Fallback löschen die relevante Aktivitätshistorie."
        : "Split-Audit bleibt persistent, aber noch nicht auf einen gemeinsamen Surface-Vertrag verdichtet.",
      nextHardening: fallbackActive
        ? "replace_in_memory_truth_before_rollout"
        : "stabilize_audit_repository_contract",
      nextHardeningSummary: fallbackActive
        ? "Produktionsnahe Aktivitätshistorie darf nicht nur im Prozessspeicher existieren."
        : "Split-Audit-Feeds über einen stabilen Repository-Vertrag lesbar halten, ohne neue Persistenzarchitektur zu bauen.",
      productionCandidateReady: !fallbackActive,
    },
  ];

  return {
    entries,
    summary: {
      fallbackActive,
      surfaceCount: entries.length,
      persistentCount: entries.filter((entry) => entry.effectiveMode === "persistent").length,
      derivedCount: entries.filter((entry) => entry.effectiveMode === "derived").length,
      inMemoryCount: entries.filter((entry) => entry.effectiveMode === "in_memory").length,
      fixtureInvolvedCount: entries.filter((entry) => entry.supportingModes.includes("fixture"))
        .length,
      highRiskCount: entries.filter(
        (entry) => entry.restartRisk === "high" || entry.restartRisk === "critical",
      ).length,
    },
    guardrails: PERSISTENCE_GUARDRAILS,
  };
}

import type {
  VoxyRenderReviewDecisionGateModel,
  VoxyRenderReviewDecisionOptionId,
} from "@/features/create/voxyRenderReviewDecisionGateContract";

export const VOXY_RENDER_DECISION_RECORD_STATUSES = [
  "persisted_review_decision",
  "audit_only",
  "readmodel_only",
  "noop_persistence",
  "needs_admin_runtime",
  "needs_storage_configuration",
  "blocked_by_runtime_truth",
] as const;

export type VoxyRenderDecisionRecordStatus =
  (typeof VOXY_RENDER_DECISION_RECORD_STATUSES)[number];

export const VOXY_RENDER_DECISION_STORE_RESULT_STATUSES = [
  "stored",
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderDecisionStoreResultStatus =
  (typeof VOXY_RENDER_DECISION_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_DECISION_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderDecisionPersistenceMode =
  (typeof VOXY_RENDER_DECISION_PERSISTENCE_MODES)[number];

type DecisionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderDecisionExecutionFlags = {
  noRenderAction: true;
  noProviderExecution: true;
  noRenderQueue: true;
  noMediaCreation: true;
  noCostDebit: true;
  noPublishAction: true;
  noSocialPostAction: true;
  noRuntimeClaim: true;
};

export type VoxyRenderDecisionPersistenceCommand = {
  decisionId?: string | null;
  decisionGateId: string;
  contributionRef: DecisionRef | null;
  dossierRef: DecisionRef | null;
  scriptRef: DecisionRef | null;
  handoffRef: DecisionRef | null;
  preflightRef: DecisionRef | null;
  registryRef: DecisionRef | null;
  adapterRef: DecisionRef | null;
  selectedDecision: VoxyRenderReviewDecisionOptionId;
  reviewerNote: string | null;
  reviewerRole: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlDecisionHint: string | null;
  createdBy: string | null;
  createdAt: string | null;
};

export type VoxyRenderPersistedDecisionRecord = {
  decisionId: string;
  decisionGateId: string;
  contributionRef: DecisionRef | null;
  dossierRef: DecisionRef | null;
  scriptRef: DecisionRef | null;
  handoffRef: DecisionRef | null;
  preflightRef: DecisionRef | null;
  registryRef: DecisionRef | null;
  adapterRef: DecisionRef | null;
  status: VoxyRenderDecisionRecordStatus;
  selectedDecision: VoxyRenderReviewDecisionOptionId;
  reviewerVisibleReason: string;
  userVisibleReason: string;
  auditReason: string;
  reviewerNote: string | null;
  reviewerRole: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  persistedAt: string | null;
  persistedBy: string | null;
  executionFlags: VoxyRenderDecisionExecutionFlags;
  idempotencyKey: string | null;
  previousDecisionRef: string | null;
  supersedesDecisionRef: string | null;
  decisionVersion: number | null;
};

export type VoxyRenderDecisionStoreResult = {
  ok: boolean;
  status: VoxyRenderDecisionStoreResultStatus;
  record: VoxyRenderPersistedDecisionRecord | null;
  warnings: string[];
  errors: string[];
  nextStep: string;
};

export type VoxyRenderDecisionPersistenceState = {
  mode: VoxyRenderDecisionPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderDecisionRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderDecisionPersistencePanelModel = {
  title: string;
  summary: string;
  commandPreview: VoxyRenderDecisionPersistenceCommand;
  persistenceStatus: VoxyRenderDecisionRecordStatus;
  persistenceStatusLabel: string;
  selectedDecisionLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  latestRecord: {
    decisionId: string;
    statusLabel: string;
    selectedDecisionLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    auditReason: string;
    reviewerVisibleReason: string;
    userVisibleReason: string;
    reviewerNote: string | null;
    decisionVersion: number | null;
  } | null;
  auditLines: string[];
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  executionFlags: VoxyRenderDecisionExecutionFlags;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

export function voxyRenderDecisionLabel(value: VoxyRenderReviewDecisionOptionId): string {
  if (value === "review_script") return "Script prüfen";
  if (value === "request_sources") return "Quellen nachfordern";
  if (value === "review_factcheck") return "Factcheck prüfen";
  if (value === "review_language") return "Sprache und Untertitel prüfen";
  if (value === "prepare_assets") return "Assets vorbereiten";
  if (value === "configure_provider") return "Provider konfigurieren";
  if (value === "define_cost_policy") return "Cost-Policy klären";
  if (value === "check_credits") return "Credits und Limits prüfen";
  if (value === "keep_as_script_only") return "Bewusst bei Script-only bleiben";
  return "Renderpfad blockieren";
}

export function voxyRenderDecisionRecordStatusLabel(value: VoxyRenderDecisionRecordStatus): string {
  if (value === "persisted_review_decision") return "Gespeichert";
  if (value === "audit_only") return "Audit-only bereit";
  if (value === "noop_persistence") return "Store-Preview";
  if (value === "needs_admin_runtime") return "Admin-Laufzeit nötig";
  if (value === "needs_storage_configuration") return "Persistenz fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  return "Nur Readmodel";
}

export function buildVoxyRenderDecisionExecutionFlags(): VoxyRenderDecisionExecutionFlags {
  return {
    noRenderAction: true,
    noProviderExecution: true,
    noRenderQueue: true,
    noMediaCreation: true,
    noCostDebit: true,
    noPublishAction: true,
    noSocialPostAction: true,
    noRuntimeClaim: true,
  };
}

function defaultStoreState(): VoxyRenderDecisionPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Persistenz-Store im Surface",
    summary:
      "Dieses Surface zeigt nur Readmodel- und Audit-Readiness. Echte Persistenz braucht den server-only Admin-Pfad.",
    repositoryInterface: "VoxyRenderDecisionRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

function buildAuditReason(
  selectedDecision: VoxyRenderReviewDecisionOptionId,
  note: string | null,
  gate: VoxyRenderReviewDecisionGateModel,
) {
  return uniqueStrings([
    `${voxyRenderDecisionLabel(selectedDecision)} als review-first Render-Entscheidung dokumentiert.`,
    gate.recommendedDecision.id === selectedDecision
      ? "Entspricht der im Decision Gate empfohlenen nächsten Entscheidung."
      : "Weicht bewusst von der Empfehlung des Decision Gates ab und bleibt trotzdem ohne Ausführung.",
    note,
  ]).join(" ");
}

export function buildVoxyRenderDecisionReasonSet(input: {
  selectedDecision: VoxyRenderReviewDecisionOptionId;
  reviewerNote?: string | null;
  gate?: VoxyRenderReviewDecisionGateModel | null;
}) {
  const reviewerNote = normalizeText(input.reviewerNote) || null;
  return {
    userVisibleReason:
      "Die Entscheidung dokumentiert nur den Review-Stand. Sie erzeugt keinen Renderjob und veröffentlicht nichts.",
    reviewerVisibleReason:
      "Persistierte Decision Records bleiben strikt von Provider, Queue, Medien, Kosten und Publishing getrennt.",
    auditReason: input.gate
      ? buildAuditReason(input.selectedDecision, reviewerNote, input.gate)
      : uniqueStrings([
          `${voxyRenderDecisionLabel(input.selectedDecision)} als review-first Render-Entscheidung dokumentiert.`,
          "Die dokumentierte Entscheidung bleibt ohne Ausführung, Providerlauf, Medienerzeugung, Kostenbuchung und Publishing.",
          reviewerNote,
        ]).join(" "),
  };
}

export function buildVoxyRenderDecisionCommandFromGate(
  gate: VoxyRenderReviewDecisionGateModel,
  options?: {
    selectedDecision?: VoxyRenderReviewDecisionOptionId;
    reviewerNote?: string | null;
    reviewerRole?: string | null;
    createdBy?: string | null;
    createdAt?: string | null;
  },
): VoxyRenderDecisionPersistenceCommand {
  return {
    decisionId: null,
    decisionGateId: gate.decisionGateId,
    contributionRef: gate.contributionRef,
    dossierRef: gate.dossierRef,
    scriptRef: gate.scriptRef,
    handoffRef: gate.handoffRef,
    preflightRef: gate.preflightRef,
    registryRef: gate.registryRef,
    adapterRef: gate.adapterRef,
    selectedDecision: options?.selectedDecision ?? gate.recommendedDecision.id,
    reviewerNote: normalizeText(options?.reviewerNote) || null,
    reviewerRole: normalizeText(options?.reviewerRole) || null,
    sourceLanguage: gate.sourceLanguage,
    readingLanguage: gate.readingLanguage,
    scriptLanguage: gate.scriptLanguage,
    renderLanguage: gate.renderLanguage,
    subtitleLanguage: gate.subtitleLanguage,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDecisionHint: gate.rtlDecisionHint,
    createdBy: normalizeText(options?.createdBy) || null,
    createdAt: normalizeText(options?.createdAt) || null,
  };
}

function buildFallbackPersistenceStatus(input: {
  gate: VoxyRenderReviewDecisionGateModel;
  storeState: VoxyRenderDecisionPersistenceState;
}) {
  if (input.gate.decisionStatus === "blocked_by_runtime_truth") return "blocked_by_runtime_truth";
  if (input.storeState.mode === "persistent_primary") return "audit_only";
  if (input.storeState.mode === "in_memory_fallback") return "needs_storage_configuration";
  if (input.gate.surface === "admin" || input.gate.surface === "workspace") {
    return "needs_admin_runtime";
  }
  return "readmodel_only";
}

export function buildVoxyRenderDecisionPersistencePanelModel(input: {
  gate: VoxyRenderReviewDecisionGateModel | null;
  latestRecord?: VoxyRenderPersistedDecisionRecord | null;
  storeState?: VoxyRenderDecisionPersistenceState | null;
  selectedDecision?: VoxyRenderReviewDecisionOptionId;
  reviewerNote?: string | null;
  reviewerRole?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}): VoxyRenderDecisionPersistencePanelModel | null {
  if (!input.gate) return null;

  const storeState = input.storeState ?? defaultStoreState();
  const commandPreview = buildVoxyRenderDecisionCommandFromGate(input.gate, {
    selectedDecision: input.selectedDecision,
    reviewerNote: input.reviewerNote,
    reviewerRole: input.reviewerRole,
    createdBy: input.createdBy,
    createdAt: input.createdAt,
  });
  const latestRecord = input.latestRecord ?? null;
  const persistenceStatus =
    latestRecord?.status ?? buildFallbackPersistenceStatus({ gate: input.gate, storeState });

  return {
    title: "Review-Entscheidung dokumentieren",
    summary:
      "Diese Schicht dokumentiert nur, welche Render-bezogene Review-Entscheidung getroffen wurde, von wem und warum. Sie startet nichts.",
    commandPreview,
    persistenceStatus,
    persistenceStatusLabel: voxyRenderDecisionRecordStatusLabel(persistenceStatus),
    selectedDecisionLabel: voxyRenderDecisionLabel(commandPreview.selectedDecision),
    storeStateLabel: storeState.label,
    storeStateSummary: storeState.summary,
    latestRecord: latestRecord
      ? {
          decisionId: latestRecord.decisionId,
          statusLabel: voxyRenderDecisionRecordStatusLabel(latestRecord.status),
          selectedDecisionLabel: voxyRenderDecisionLabel(latestRecord.selectedDecision),
          persistedAt: latestRecord.persistedAt,
          persistedBy: latestRecord.persistedBy,
          auditReason: latestRecord.auditReason,
          reviewerVisibleReason: latestRecord.reviewerVisibleReason,
          userVisibleReason: latestRecord.userVisibleReason,
          reviewerNote: latestRecord.reviewerNote,
          decisionVersion: latestRecord.decisionVersion,
        }
      : null,
    auditLines: latestRecord
      ? uniqueStrings([
          `Zuletzt dokumentiert: ${voxyRenderDecisionLabel(latestRecord.selectedDecision)}`,
          latestRecord.persistedAt ? `Zeitpunkt: ${latestRecord.persistedAt}` : null,
          latestRecord.persistedBy ? `Von: ${latestRecord.persistedBy}` : null,
          latestRecord.auditReason,
        ])
      : uniqueStrings([
          `Vorgesehene Entscheidung: ${voxyRenderDecisionLabel(commandPreview.selectedDecision)}`,
          buildAuditReason(commandPreview.selectedDecision, commandPreview.reviewerNote, input.gate),
          storeState.productionTruth
            ? "Ein server-only Admin-Store kann diese Entscheidung auditierbar persistieren."
            : "Ohne produktive Store-Wahrheit bleibt dies nur Audit- und Store-Preview.",
        ]),
    userVisibleReason:
      latestRecord?.userVisibleReason ??
      buildVoxyRenderDecisionReasonSet({
        selectedDecision: commandPreview.selectedDecision,
        reviewerNote: commandPreview.reviewerNote,
        gate: input.gate,
      }).userVisibleReason,
    reviewerVisibleReason:
      latestRecord?.reviewerVisibleReason ??
      buildVoxyRenderDecisionReasonSet({
        selectedDecision: commandPreview.selectedDecision,
        reviewerNote: commandPreview.reviewerNote,
        gate: input.gate,
      }).reviewerVisibleReason,
    nextStep:
      latestRecord?.status === "persisted_review_decision"
        ? "Audit prüfen und bei Bedarf neue Review-Entscheidung dokumentieren"
        : storeState.productionTruth
          ? "Admin-only Decision Record dokumentieren"
          : "Persistenzgrenze prüfen oder Audit-Preview nutzen",
    executionFlags: buildVoxyRenderDecisionExecutionFlags(),
  };
}

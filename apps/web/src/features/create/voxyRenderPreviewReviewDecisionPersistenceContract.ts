import type {
  VoxyRenderPreviewReviewAction,
  VoxyRenderPreviewReviewCheckKey,
  VoxyRenderPreviewReviewFlowRecord,
  VoxyRenderPreviewReviewFlowStatus,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";

export const VOXY_RENDER_PREVIEW_REVIEW_DECISION_TYPES = [
  "comment_only",
  "request_revision",
  "reject_preview",
  "mark_review_ready",
  "keep_as_script_only",
  "blocked",
] as const;

export type VoxyRenderPreviewReviewDecisionType =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_DECISION_TYPES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_DECISION_STATUSES = [
  "persisted_audit_only",
  "preview_review_decision_only",
  "no_runtime_triggered",
  "blocked_by_missing_preview_review_flow",
  "blocked_by_runtime_truth",
  "keep_as_script_only",
] as const;

export type VoxyRenderPreviewReviewDecisionStatus =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_DECISION_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_DECISION_CHECKLIST_STATUSES = [
  "not_checked",
  "needs_review",
  "concern",
  "acceptable_for_review_ready",
] as const;

export type VoxyRenderPreviewReviewDecisionChecklistStatus =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_DECISION_CHECKLIST_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_DECISION_STORE_RESULT_STATUSES = [
  "persisted",
  "preview_only",
  "noop",
  "blocked",
] as const;

export type VoxyRenderPreviewReviewDecisionStoreResultStatus =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_DECISION_STORE_RESULT_STATUSES)[number];

export const VOXY_RENDER_PREVIEW_REVIEW_DECISION_PERSISTENCE_MODES = [
  "persistent_primary",
  "in_memory_fallback",
  "unavailable",
] as const;

export type VoxyRenderPreviewReviewDecisionPersistenceMode =
  (typeof VOXY_RENDER_PREVIEW_REVIEW_DECISION_PERSISTENCE_MODES)[number];

type PreviewReviewDecisionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyRenderPreviewReviewDecisionChecklistResult = {
  checkKey: VoxyRenderPreviewReviewCheckKey;
  status: VoxyRenderPreviewReviewDecisionChecklistStatus;
  reviewerVisibleReason: string;
  userVisibleReason: string;
};

export type VoxyRenderPreviewReviewDecisionPayload = {
  reviewerComment: string | null;
  revisionReason: string | null;
  rejectionReason: string | null;
  reviewReadyReason: string | null;
  checklistFindings: string[];
  languageNotes: string | null;
  sourceCaptionNotes: string | null;
  claimSafetyNotes: string | null;
  brandNotes: string | null;
  accessibilityNotes: string | null;
  legalSafetyNotes: string | null;
};

export type VoxyRenderPreviewReviewDecisionEffects = {
  createsRenderJob: false;
  triggersRerender: false;
  triggersProvider: false;
  createsQueueJob: false;
  createsMediaFile: false;
  createsUpload: false;
  triggersPublish: false;
  costDebitAllowed: false;
  creditDebitAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPreviewReviewDecisionExecutionFlags = {
  previewRendered: false;
  renderAllowed: false;
  rerenderAllowed: false;
  queueAllowed: false;
  workerAllowed: false;
  providerExecutionAllowed: false;
  secretsAccessed: false;
  mediaFileCreationAllowed: false;
  previewFileAvailable: false;
  uploadAllowed: false;
  publishAllowed: false;
  socialPostAllowed: false;
  schedulingAllowed: false;
  runtimeClaimAllowed: false;
};

export type VoxyRenderPreviewReviewDecisionPersistenceCommand = {
  decisionRecordId?: string | null;
  previewReviewFlowId?: string | null;
  decisionGateId?: string | null;
  enablementBacklogId?: string | null;
  matrixId?: string | null;
  requestDraftId?: string | null;
  renderDecisionId?: string | null;
  scriptRef?: PreviewReviewDecisionRef | null;
  contributionRef?: PreviewReviewDecisionRef | null;
  dossierRef?: PreviewReviewDecisionRef | null;
  reviewerRef?: PreviewReviewDecisionRef | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  renderLanguage: string;
  subtitleLanguage: string | null;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlRequired: boolean;
  decisionType: VoxyRenderPreviewReviewDecisionType;
  decisionPayload: VoxyRenderPreviewReviewDecisionPayload;
  checklistResults: VoxyRenderPreviewReviewDecisionChecklistResult[];
  decisionEffects: VoxyRenderPreviewReviewDecisionEffects;
  executionFlags: VoxyRenderPreviewReviewDecisionExecutionFlags;
  nextStep: string;
  userVisibleSummary: string;
  reviewerVisibleSummary: string;
  previewReviewStatusHint?: VoxyRenderPreviewReviewFlowStatus | null;
};

export type VoxyRenderPreviewReviewDecisionRecord =
  VoxyRenderPreviewReviewDecisionPersistenceCommand & {
    decisionRecordId: string;
    decisionStatus: VoxyRenderPreviewReviewDecisionStatus;
    persistedAt: string | null;
    persistedBy: string | null;
    idempotencyKey: string | null;
    previousDecisionRecordRef: string | null;
    supersedesDecisionRecordRef: string | null;
    decisionVersion: number | null;
  };

export type VoxyRenderPreviewReviewDecisionStoreResult = {
  ok: boolean;
  status: VoxyRenderPreviewReviewDecisionStoreResultStatus;
  record: VoxyRenderPreviewReviewDecisionRecord | null;
  warnings: string[];
  errors: string[];
  idempotencyKey: string | null;
  nextStep: string;
};

export type VoxyRenderPreviewReviewDecisionPersistenceState = {
  mode: VoxyRenderPreviewReviewDecisionPersistenceMode;
  label: string;
  summary: string;
  repositoryInterface: "VoxyRenderPreviewReviewDecisionRepository";
  storeKind: "mongo_collection" | "in_memory" | "none";
  productionTruth: boolean;
  restartReconstructable: boolean;
  deploymentReconstructable: boolean;
  adminWritePath: "admin_api_available" | "server_only_only" | "not_available";
};

export type VoxyRenderPreviewReviewDecisionPersistencePanelModel = {
  title: string;
  summary: string;
  previewFlowStatusLabel: string;
  decisionTypeLabel: string;
  decisionStatusLabel: string;
  storeStateLabel: string;
  storeStateSummary: string;
  commandPreview: {
    decisionTypeLabel: string;
    decisionStatusLabel: string;
    createdAt: string | null | undefined;
    previewReviewFlowId: string | null | undefined;
  };
  latestRecord: {
    decisionRecordId: string;
    decisionTypeLabel: string;
    decisionStatusLabel: string;
    persistedAt: string | null;
    persistedBy: string | null;
    decisionVersion: number | null;
  } | null;
  actionRows: Array<VoxyRenderPreviewReviewAction & { actionLabel: string }>;
  checklistRows: Array<
    VoxyRenderPreviewReviewDecisionChecklistResult & {
      checkLabel: string;
      statusLabel: string;
    }
  >;
  payloadLines: string[];
  auditLines: string[];
  topBlockers: string[];
  nextStep: string;
};

function normalizeText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

function languageName(language: string) {
  if (language === "de") return "Deutsch";
  if (language === "en") return "Englisch";
  if (language === "fr") return "Französisch";
  if (language === "tr") return "Türkisch";
  if (language === "ar") return "Arabisch";
  if (language === "fa") return "Persisch";
  if (language === "he") return "Hebräisch";
  if (language === "ur") return "Urdu";
  return language || "Unklar";
}

function checklistKeyLabel(value: VoxyRenderPreviewReviewCheckKey) {
  if (value === "script_accuracy") return "Script-Genauigkeit";
  if (value === "source_caption_accuracy") return "Quellen- und Caption-Treue";
  if (value === "claim_safety") return "Claim-Sicherheit";
  if (value === "language_quality") return "Sprachqualität";
  if (value === "subtitle_readability") return "Untertitel-Lesbarkeit";
  if (value === "rtl_layout") return "RTL-Layout";
  if (value === "brand_fit") return "Brand-Fit";
  if (value === "voxy_presence") return "Voxy-Präsenz";
  if (value === "audio_voice_fit") return "Audio- und Voice-Fit";
  if (value === "legal_safety") return "Rechtliche Sicherheit";
  if (value === "publication_safety") return "Publikationssicherheit";
  return "Barrierefreiheit";
}

function previewFlowStatusLabel(value: VoxyRenderPreviewReviewFlowStatus | null | undefined) {
  if (value === "preview_review_flow_only") return "Preview-Review-Flow vorbereitet";
  if (value === "noop_preview_review") return "Noop-Preview-Review";
  if (value === "no_preview_available") return "Noch kein Preview verfügbar";
  if (value === "needs_render_runtime") return "Render-Runtime fehlt";
  if (value === "needs_preview_asset") return "Preview-Asset fehlt";
  if (value === "needs_human_review") return "Menschliches Review nötig";
  if (value === "needs_revision") return "Revision angefragt";
  if (value === "blocked_by_missing_backlog") return "Ohne Backlog blockiert";
  if (value === "blocked_by_missing_matrix") return "Ohne Matrix blockiert";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  if (value === "keep_as_script_only") return "Bewusst Script-only";
  return "Preview-Review-Flow fehlt";
}

export function voxyRenderPreviewReviewDecisionTypeLabel(
  value: VoxyRenderPreviewReviewDecisionType,
) {
  if (value === "comment_only") return "Kommentar dokumentieren";
  if (value === "request_revision") return "Revision anfordern";
  if (value === "reject_preview") return "Preview ablehnen";
  if (value === "mark_review_ready") return "Als review-ready markieren";
  if (value === "keep_as_script_only") return "Als Script-only behalten";
  return "Blockiert";
}

export function voxyRenderPreviewReviewDecisionStatusLabel(
  value: VoxyRenderPreviewReviewDecisionStatus,
) {
  if (value === "persisted_audit_only") return "Audit-only gespeichert";
  if (value === "preview_review_decision_only") return "Nur Preview-Review-Entscheidung";
  if (value === "no_runtime_triggered") return "Keine Runtime ausgelöst";
  if (value === "blocked_by_missing_preview_review_flow") {
    return "Ohne Preview-Review-Flow blockiert";
  }
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit blockiert";
  return "Bewusst Script-only";
}

export function voxyRenderPreviewReviewDecisionChecklistStatusLabel(
  value: VoxyRenderPreviewReviewDecisionChecklistStatus,
) {
  if (value === "needs_review") return "Review nötig";
  if (value === "concern") return "Auffälligkeit";
  if (value === "acceptable_for_review_ready") return "Für review-ready vertretbar";
  return "Noch nicht geprüft";
}

export function buildVoxyRenderPreviewReviewDecisionEffects(): VoxyRenderPreviewReviewDecisionEffects {
  return {
    createsRenderJob: false,
    triggersRerender: false,
    triggersProvider: false,
    createsQueueJob: false,
    createsMediaFile: false,
    createsUpload: false,
    triggersPublish: false,
    costDebitAllowed: false,
    creditDebitAllowed: false,
    runtimeClaimAllowed: false,
  };
}

export function buildVoxyRenderPreviewReviewDecisionExecutionFlags(): VoxyRenderPreviewReviewDecisionExecutionFlags {
  return {
    previewRendered: false,
    renderAllowed: false,
    rerenderAllowed: false,
    queueAllowed: false,
    workerAllowed: false,
    providerExecutionAllowed: false,
    secretsAccessed: false,
    mediaFileCreationAllowed: false,
    previewFileAvailable: false,
    uploadAllowed: false,
    publishAllowed: false,
    socialPostAllowed: false,
    schedulingAllowed: false,
    runtimeClaimAllowed: false,
  };
}

function deriveDecisionType(
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null,
): VoxyRenderPreviewReviewDecisionType {
  if (!previewFlow) return "blocked";
  if (previewFlow.previewStatus === "keep_as_script_only") return "keep_as_script_only";
  if (
    previewFlow.previewStatus === "blocked_by_missing_backlog" ||
    previewFlow.previewStatus === "blocked_by_missing_matrix" ||
    previewFlow.previewStatus === "blocked_by_runtime_truth"
  ) {
    return "blocked";
  }
  if (previewFlow.previewStatus === "needs_revision") return "request_revision";
  return "comment_only";
}

export function deriveVoxyRenderPreviewReviewDecisionStatus(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  decisionType: VoxyRenderPreviewReviewDecisionType;
  persistenceMode?: VoxyRenderPreviewReviewDecisionPersistenceMode | null;
}) {
  if (!input.previewFlow?.previewReviewFlowId) return "blocked_by_missing_preview_review_flow";
  if (input.decisionType === "keep_as_script_only") return "keep_as_script_only";
  if (
    input.decisionType === "blocked" ||
    input.previewFlow.previewStatus === "blocked_by_runtime_truth" ||
    input.previewFlow.previewStatus === "blocked_by_missing_backlog" ||
    input.previewFlow.previewStatus === "blocked_by_missing_matrix"
  ) {
    return "blocked_by_runtime_truth";
  }
  if (input.persistenceMode === "persistent_primary") return "persisted_audit_only";
  if (input.persistenceMode === "in_memory_fallback") return "preview_review_decision_only";
  return "no_runtime_triggered";
}

function buildChecklistResults(
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null,
): VoxyRenderPreviewReviewDecisionChecklistResult[] {
  return (previewFlow?.reviewChecklist ?? []).map((item) => ({
    checkKey: item.checkKey,
    status:
      item.status === "blocked"
        ? "concern"
        : item.status === "needs_review"
          ? "needs_review"
          : "not_checked",
    reviewerVisibleReason: item.reviewerVisibleReason,
    userVisibleReason: item.userVisibleReason,
  }));
}

function buildDecisionPayload(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  decisionType: VoxyRenderPreviewReviewDecisionType;
}) {
  const previewFlow = input.previewFlow;
  const languageNotes = uniqueStrings([
    `Quelle: ${languageName(previewFlow?.sourceLanguage ?? "de")}`,
    `Lesefassung: ${languageName(previewFlow?.readingLanguage ?? previewFlow?.sourceLanguage ?? "de")}`,
    `Script: ${languageName(previewFlow?.scriptLanguage ?? previewFlow?.readingLanguage ?? "de")}`,
    `Render-Ziel: ${languageName(previewFlow?.renderLanguage ?? previewFlow?.scriptLanguage ?? "de")}`,
    previewFlow?.subtitleLanguage
      ? `Untertitel: ${languageName(previewFlow.subtitleLanguage)}`
      : "Untertitel bleiben offen.",
    previewFlow?.rtlRequired ? "RTL bleibt Review-Punkt." : null,
  ]).join(" · ");

  return {
    reviewerComment:
      input.decisionType === "comment_only"
        ? "Kommentar wird auditierbar dokumentiert, ohne Runtime-Folge."
        : input.decisionType === "blocked"
          ? "Ohne Preview-Review-Flow oder Runtime-Wahrheit bleibt die Entscheidung blockiert."
          : null,
    revisionReason:
      input.decisionType === "request_revision"
        ? "Revision wird dokumentiert, ohne Re-Render, Providerlauf oder Queue."
        : null,
    rejectionReason:
      input.decisionType === "reject_preview"
        ? "Die Preview-Ablehnung bleibt Audit-only und löst weder Publish noch Medienlöschung aus."
        : null,
    reviewReadyReason:
      input.decisionType === "mark_review_ready"
        ? "Review-ready bleibt nur Review-Readiness und ist weder Approval noch Publish noch Renderfreigabe."
        : null,
    checklistFindings: uniqueStrings(previewFlow?.topBlockers ?? []),
    languageNotes: languageNotes || null,
    sourceCaptionNotes:
      "Quellen- und Caption-Treue bleiben Review-Aufgabe und werden nicht als Evidenz-Automation behandelt.",
    claimSafetyNotes:
      "Claim-Sicherheit bleibt menschliches Review und löst keine Runtime-Aktion aus.",
    brandNotes:
      "Brand- und Voxy-Präsenz bleiben Review-Kriterien und erzeugen keine Datei oder Providerwahl.",
    accessibilityNotes:
      "Barrierefreiheit bleibt Prüfpunkt; es entstehen weder Untertitel-Datei noch Upload noch Publish.",
    legalSafetyNotes:
      "Rechtliche und Publikationssicherheit bleiben Review-Themen, ohne Veröffentlichung oder Scheduling.",
  } satisfies VoxyRenderPreviewReviewDecisionPayload;
}

function buildSummary(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  decisionType: VoxyRenderPreviewReviewDecisionType;
}) {
  if (!input.previewFlow) {
    return {
      userVisibleSummary:
        "Ohne Preview-Review-Flow bleibt die Entscheidung blockiert. Es wird nichts gerendert oder veröffentlicht.",
      reviewerVisibleSummary:
        "Der Persistenz-Layer bleibt ohne Preview-Review-Flow blockiert und darf keine Runtime-Wahrheit behaupten.",
    };
  }

  if (input.decisionType === "request_revision") {
    return {
      userVisibleSummary:
        "Revision wird auditierbar dokumentiert. Das ist kein Re-Render, kein Providerlauf und keine Veröffentlichung.",
      reviewerVisibleSummary:
        "Die dokumentierte Revisionsanforderung bleibt rein auditierbar und startet weder Queue noch Worker noch Provider.",
    };
  }

  if (input.decisionType === "reject_preview") {
    return {
      userVisibleSummary:
        "Die Preview-Ablehnung wird nur dokumentiert. Es entstehen keine Medien, kein Publish und keine Kosten.",
      reviewerVisibleSummary:
        "Die Ablehnung bleibt Audit-only und löst weder Medienlöschung noch Runtime noch Publish aus.",
    };
  }

  if (input.decisionType === "mark_review_ready") {
    return {
      userVisibleSummary:
        "Review-ready wird dokumentiert, bleibt aber getrennt von Approval, Renderfreigabe und Veröffentlichung.",
      reviewerVisibleSummary:
        "Die Review-ready-Entscheidung bleibt Audit-only, nicht approved, nicht published und nicht render_allowed.",
    };
  }

  if (input.decisionType === "keep_as_script_only") {
    return {
      userVisibleSummary:
        "Der Fall bleibt bewusst Script-only. Es gibt kein Preview, kein Rendern und keine Veröffentlichung.",
      reviewerVisibleSummary:
        "Script-only wird auditierbar festgehalten und bleibt getrennt von Preview-, Runtime- und Publish-Ansprüchen.",
    };
  }

  if (input.decisionType === "blocked") {
    return {
      userVisibleSummary:
        "Die Entscheidung bleibt blockiert, bis ein ehrlicher Preview-Review-Flow vorliegt. Es wird nichts gerendert oder veröffentlicht.",
      reviewerVisibleSummary:
        "Der Layer bleibt durch fehlende Preview-Review- oder Runtime-Wahrheit blockiert und darf keine Freigabe behaupten.",
    };
  }

  return {
    userVisibleSummary:
      "Der Kommentar wird auditierbar dokumentiert. Es wird weder gerendert noch veröffentlicht noch irgendetwas hochgeladen.",
    reviewerVisibleSummary:
      "Die Kommentar-Entscheidung bleibt audit-only und getrennt von Re-Render, Queue, Provider, Kosten und Publish.",
  };
}

function buildNextStep(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  decisionType: VoxyRenderPreviewReviewDecisionType;
}) {
  if (!input.previewFlow) {
    return "Zuerst den Preview-Review-Flow sauber ableiten, bevor irgendeine Review-Entscheidung gespeichert wird.";
  }
  if (input.decisionType === "request_revision") {
    return "Revisionsbedarf sichtbar machen, ohne Re-Render oder Providerlauf zu behaupten.";
  }
  if (input.decisionType === "reject_preview") {
    return "Ablehnung mit Guardrails dokumentieren und keine Publish-Freigabe daraus ableiten.";
  }
  if (input.decisionType === "mark_review_ready") {
    return "Review-ready nur als Audit-Status festhalten und Approval, Runtime und Publish getrennt halten.";
  }
  if (input.decisionType === "keep_as_script_only") {
    return "Script-only explizit festhalten und keinen Preview- oder Runtime-Pfad behaupten.";
  }
  if (input.decisionType === "blocked") {
    return "Fehlende Preview-Review- oder Runtime-Wahrheit klären, bevor eine echte Entscheidung behauptet wird.";
  }
  return "Kommentar und Checklist-Funde dokumentieren, ohne Render, Re-Render, Provider, Queue oder Publish auszulösen.";
}

function buildDefaultStoreState(): VoxyRenderPreviewReviewDecisionPersistenceState {
  return {
    mode: "unavailable",
    label: "Kein Preview-Review-Decision-Store im Surface",
    summary:
      "Dieses Surface zeigt nur die vorbereitete Preview-Review-Entscheidung. Echte Persistenz braucht den server-only Admin-Pfad.",
    repositoryInterface: "VoxyRenderPreviewReviewDecisionRepository",
    storeKind: "none",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
    adminWritePath: "not_available",
  };
}

export function buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null,
  options?: {
    decisionType?: VoxyRenderPreviewReviewDecisionType;
    reviewerComment?: string | null;
    reviewerRef?: PreviewReviewDecisionRef | null;
    createdAt?: string | null;
  },
): VoxyRenderPreviewReviewDecisionPersistenceCommand {
  const decisionType = options?.decisionType ?? deriveDecisionType(previewFlow);
  const payload = buildDecisionPayload({ previewFlow, decisionType });
  if (options?.reviewerComment) {
    payload.reviewerComment = normalizeText(options.reviewerComment) || null;
  }
  const summary = buildSummary({ previewFlow, decisionType });
  return {
    decisionRecordId: null,
    previewReviewFlowId: previewFlow?.previewReviewFlowId ?? null,
    decisionGateId: previewFlow?.decisionGateId ?? null,
    enablementBacklogId: previewFlow?.enablementBacklogId ?? null,
    matrixId: previewFlow?.matrixId ?? null,
    requestDraftId: previewFlow?.requestDraftId ?? null,
    renderDecisionId: previewFlow?.decisionId ?? null,
    scriptRef: previewFlow?.scriptRef ?? null,
    contributionRef: previewFlow?.contributionRef ?? null,
    dossierRef: previewFlow?.dossierRef ?? null,
    reviewerRef: options?.reviewerRef ?? null,
    createdAt: options?.createdAt ?? null,
    updatedAt: null,
    sourceLanguage: previewFlow?.sourceLanguage ?? "de",
    readingLanguage: previewFlow?.readingLanguage ?? previewFlow?.sourceLanguage ?? "de",
    scriptLanguage: previewFlow?.scriptLanguage ?? previewFlow?.readingLanguage ?? "de",
    renderLanguage: previewFlow?.renderLanguage ?? previewFlow?.scriptLanguage ?? "de",
    subtitleLanguage: previewFlow?.subtitleLanguage ?? null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: previewFlow?.rtlRequired ?? false,
    decisionType,
    decisionPayload: payload,
    checklistResults: buildChecklistResults(previewFlow),
    decisionEffects: buildVoxyRenderPreviewReviewDecisionEffects(),
    executionFlags: buildVoxyRenderPreviewReviewDecisionExecutionFlags(),
    nextStep: buildNextStep({ previewFlow, decisionType }),
    userVisibleSummary: summary.userVisibleSummary,
    reviewerVisibleSummary: summary.reviewerVisibleSummary,
    previewReviewStatusHint: previewFlow?.previewStatus ?? null,
  };
}

function buildStoreStateLabel(
  state: VoxyRenderPreviewReviewDecisionPersistenceState | null | undefined,
) {
  return (state ?? buildDefaultStoreState()).label;
}

function buildStoreStateSummary(
  state: VoxyRenderPreviewReviewDecisionPersistenceState | null | undefined,
) {
  return (state ?? buildDefaultStoreState()).summary;
}

function payloadLines(payload: VoxyRenderPreviewReviewDecisionPayload) {
  return uniqueStrings([
    payload.reviewerComment,
    payload.revisionReason,
    payload.rejectionReason,
    payload.reviewReadyReason,
    payload.languageNotes,
    payload.sourceCaptionNotes,
    payload.claimSafetyNotes,
    payload.brandNotes,
    payload.accessibilityNotes,
    payload.legalSafetyNotes,
    ...payload.checklistFindings,
  ]);
}

export function buildVoxyRenderPreviewReviewDecisionPersistencePanelModel(input: {
  previewFlow: VoxyRenderPreviewReviewFlowRecord | null;
  latestRecord?: VoxyRenderPreviewReviewDecisionRecord | null;
  storeState?: VoxyRenderPreviewReviewDecisionPersistenceState | null;
}): VoxyRenderPreviewReviewDecisionPersistencePanelModel | null {
  if (!input.previewFlow) return null;

  const commandPreview = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(
    input.previewFlow,
  );
  const derivedStatus = deriveVoxyRenderPreviewReviewDecisionStatus({
    previewFlow: input.previewFlow,
    decisionType: commandPreview.decisionType,
    persistenceMode: input.storeState?.mode,
  });
  const activePayload = input.latestRecord?.decisionPayload ?? commandPreview.decisionPayload;
  const activeChecklist = input.latestRecord?.checklistResults ?? commandPreview.checklistResults;
  const activeDecisionType = input.latestRecord?.decisionType ?? commandPreview.decisionType;
  const activeDecisionStatus = input.latestRecord?.decisionStatus ?? derivedStatus;

  return {
    title: "Preview-Review-Entscheidung",
    summary:
      "Dieser Layer speichert nur menschliche Preview-Review-Entscheidungen auditierbar: Kommentar, Revision, Ablehnung, review-ready oder bewusst Script-only. Er rendert nichts und veröffentlicht nichts.",
    previewFlowStatusLabel: previewFlowStatusLabel(input.previewFlow.previewStatus),
    decisionTypeLabel: voxyRenderPreviewReviewDecisionTypeLabel(activeDecisionType),
    decisionStatusLabel: voxyRenderPreviewReviewDecisionStatusLabel(activeDecisionStatus),
    storeStateLabel: buildStoreStateLabel(input.storeState),
    storeStateSummary: buildStoreStateSummary(input.storeState),
    commandPreview: {
      decisionTypeLabel: voxyRenderPreviewReviewDecisionTypeLabel(commandPreview.decisionType),
      decisionStatusLabel: voxyRenderPreviewReviewDecisionStatusLabel(derivedStatus),
      createdAt: commandPreview.createdAt,
      previewReviewFlowId: commandPreview.previewReviewFlowId,
    },
    latestRecord: input.latestRecord
      ? {
          decisionRecordId: input.latestRecord.decisionRecordId,
          decisionTypeLabel: voxyRenderPreviewReviewDecisionTypeLabel(
            input.latestRecord.decisionType,
          ),
          decisionStatusLabel: voxyRenderPreviewReviewDecisionStatusLabel(
            input.latestRecord.decisionStatus,
          ),
          persistedAt: input.latestRecord.persistedAt,
          persistedBy: input.latestRecord.persistedBy,
          decisionVersion: input.latestRecord.decisionVersion,
        }
      : null,
    actionRows: input.previewFlow.reviewActions.map((action) => ({
      ...action,
      actionLabel: voxyRenderPreviewReviewDecisionTypeLabel(
        action.actionKey as VoxyRenderPreviewReviewDecisionType,
      ),
    })),
    checklistRows: activeChecklist.map((item) => ({
      ...item,
      checkLabel: checklistKeyLabel(item.checkKey),
      statusLabel: voxyRenderPreviewReviewDecisionChecklistStatusLabel(item.status),
    })),
    payloadLines: payloadLines(activePayload),
    auditLines: uniqueStrings([
      `Flow-Status: ${previewFlowStatusLabel(input.previewFlow.previewStatus)}`,
      `Entscheidung: ${voxyRenderPreviewReviewDecisionTypeLabel(activeDecisionType)}`,
      `Status: ${voxyRenderPreviewReviewDecisionStatusLabel(activeDecisionStatus)}`,
      input.previewFlow.previewReviewFlowId
        ? `Preview-Review-Flow: ${input.previewFlow.previewReviewFlowId}`
        : "Noch kein Preview-Review-Flow referenziert.",
      input.latestRecord?.persistedAt
        ? `Persistiert: ${input.latestRecord.persistedAt}`
        : input.storeState?.mode === "persistent_primary"
          ? "Noch kein persistierter Preview-Review-Decision-Record."
          : "Bisher nur Decision-Vorschau ohne persistierten Record.",
      "Review-ready ist nicht approved, nicht published und nicht render_allowed.",
      "Revision_requested ist kein Re-Render.",
      "Reject_preview löscht keine Medien und publiziert nichts.",
    ]),
    topBlockers: input.previewFlow.topBlockers,
    nextStep: input.latestRecord?.nextStep ?? commandPreview.nextStep,
  };
}

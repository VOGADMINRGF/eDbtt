import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type {
  OutputSocialWorkbenchModel,
} from "@/features/create/outputSocialWorkbenchContract";
import {
  buildOutputSocialWorkbenchFromCreateCandidatePreview,
  buildOutputSocialWorkbenchFromReviewContext,
  buildOutputSocialWorkbenchFromVoxyDialog,
} from "@/features/create/outputSocialWorkbenchContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type {
  V3VoxyCocreationDialogModel,
} from "@/features/create/voxyCocreationDialogContract";
import type {
  VoxyBriefingScriptCandidateModel,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyBriefingScriptCandidateFromCreateCandidatePreview,
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
  buildVoxyVideoSegmentsFromScriptCandidate,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import type {
  VoxyPublishDraft,
  VoxyRenderJob,
  VoxyReviewState,
  VoxyScriptSegment,
  VoxyVideoBriefing,
} from "@/features/voxyVideo";

export const VOXY_RENDER_PROVIDER_HANDOFF_STATUSES = [
  "readmodel_only",
  "handoff_preview",
  "needs_script_review",
  "needs_source_review",
  "needs_factcheck_review",
  "needs_human_input",
  "needs_translation_review",
  "needs_compliance_review",
  "needs_editorial_review",
  "needs_render_review",
  "needs_publish_review",
  "blocked_by_provider",
  "blocked_by_secret",
  "blocked_by_runtime_truth",
] as const;

export type VoxyRenderProviderHandoffStatus =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_SIGNALS = [
  "briefing_package_available",
  "segment_package_available",
  "output_target_hints_available",
  "source_review_needed",
  "factcheck_needed",
  "human_input_needed",
  "multilingual_review_needed",
  "provider_mapping_missing",
  "secret_check_missing",
  "runtime_truth_missing",
] as const;

export type VoxyRenderProviderHandoffSignal =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_SIGNALS)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_TARGETS = [
  "briefing_package",
  "voice_adapter",
  "avatar_adapter",
  "render_adapter",
  "publish_adapter",
  "audit_trace",
] as const;

export type VoxyRenderProviderHandoffTarget =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_TARGETS)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_TARGET_STATUSES = [
  "prepared",
  "needs_review",
  "blocked",
] as const;

export type VoxyRenderProviderHandoffTargetStatus =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_TARGET_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_REVIEW_GATES = [
  "briefing_review",
  "script_review",
  "render_review",
  "publish_review",
] as const;

export type VoxyRenderProviderHandoffReviewGate =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_REVIEW_GATES)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_REVIEW_GATE_STATUSES = [
  "needs_review",
  "approved",
  "blocked",
] as const;

export type VoxyRenderProviderHandoffReviewGateStatus =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_REVIEW_GATE_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_DOWNSTREAM_TARGETS = [
  "script_package",
  "provider_mapping",
  "render_queue",
  "publish_draft",
  "archive_trace",
] as const;

export type VoxyRenderProviderHandoffDownstreamTarget =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_DOWNSTREAM_TARGETS)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_DOWNSTREAM_STATUSES = [
  "blocked",
  "needs_review",
  "prepared",
] as const;

export type VoxyRenderProviderHandoffDownstreamStatus =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_DOWNSTREAM_STATUSES)[number];

export const VOXY_RENDER_PROVIDER_HANDOFF_NEXT_DECISIONS = [
  "keep_internal",
  "request_sources",
  "resolve_human_input",
  "review_language",
  "refine_script",
  "review_render_gate",
  "prepare_provider_mapping",
  "prepare_publish_review",
  "blocked",
] as const;

export type VoxyRenderProviderHandoffNextDecision =
  (typeof VOXY_RENDER_PROVIDER_HANDOFF_NEXT_DECISIONS)[number];

type HandoffSurface = "create" | "account" | "admin" | "workspace";

type HandoffRef = {
  id: string;
  title: string;
  href?: string | null;
};

type HandoffTag<T extends string> = {
  id: T;
  label: string;
  reason: string;
};

export type VoxyRenderProviderHandoffReviewGateItem = {
  id: VoxyRenderProviderHandoffReviewGate;
  label: string;
  status: VoxyRenderProviderHandoffReviewGateStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type VoxyRenderProviderHandoffTargetItem = {
  id: VoxyRenderProviderHandoffTarget;
  label: string;
  status: VoxyRenderProviderHandoffTargetStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type VoxyRenderProviderHandoffDownstreamItem = {
  id: VoxyRenderProviderHandoffDownstreamTarget;
  label: string;
  status: VoxyRenderProviderHandoffDownstreamStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type VoxyRenderProviderHandoffPacket = {
  handoffId: string;
  briefingId: string;
  title: string;
  summary: string;
  scriptLanguage: string;
  segmentCount: number;
  segments: VoxyScriptSegment[];
  targetHints: string[];
  reviewRequired: true;
  providerInterface: "adapter_only";
  noProviderCall: true;
  noRenderTrigger: true;
  noPublishTrigger: true;
};

export type VoxyRenderProviderHandoffModel = {
  title: string;
  summary: string;
  surface: HandoffSurface;
  contributionRef: HandoffRef | null;
  dossierRef: HandoffRef | null;
  outputRef: HandoffRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlDisplayHint: boolean;
  handoffStatus: VoxyRenderProviderHandoffStatus;
  handoffStatusLabel: string;
  handoffPacket: {
    briefingTitle: string;
    briefingSummary: string;
    segmentCount: number;
    estimatedDurationSeconds: number;
    targetHints: string[];
    assetTruthLabel: string;
    providerBindingLabel: string;
    renderStatusLabel: string;
    publishStatusLabel: string;
  };
  reviewGates: VoxyRenderProviderHandoffReviewGateItem[];
  providerTargets: VoxyRenderProviderHandoffTargetItem[];
  handoffSignals: HandoffTag<VoxyRenderProviderHandoffSignal>[];
  blockers: string[];
  downstreamReadiness: VoxyRenderProviderHandoffDownstreamItem[];
  nextHandoffDecision: {
    id: VoxyRenderProviderHandoffNextDecision;
    label: string;
    reason: string;
  };
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  reviewRequired: true;
  noProviderCall: true;
  noRenderTrigger: true;
  noPublishTrigger: true;
  noScheduleAction: true;
  noRuntimeClaim: true;
};

type BuildModelInput = {
  surface: HandoffSurface;
  contributionRef?: HandoffRef | null;
  dossierRef?: HandoffRef | null;
  outputRef?: HandoffRef | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyBriefing: VoxyVideoBriefing | null;
  voxyReviewState: VoxyReviewState | null;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

function languageName(language: string): string {
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

function handoffStatusLabel(value: VoxyRenderProviderHandoffStatus): string {
  if (value === "handoff_preview") return "Handoff-Vorschau";
  if (value === "needs_script_review") return "Script-Review offen";
  if (value === "needs_source_review") return "Quellenreview offen";
  if (value === "needs_factcheck_review") return "Factcheck offen";
  if (value === "needs_human_input") return "Menschliche Ergänzung offen";
  if (value === "needs_translation_review") return "Sprachreview offen";
  if (value === "needs_compliance_review") return "Compliance-Review offen";
  if (value === "needs_editorial_review") return "Editorial Review offen";
  if (value === "needs_render_review") return "Render-Gate offen";
  if (value === "needs_publish_review") return "Publish-Gate offen";
  if (value === "blocked_by_provider") return "Provider-Gate blockiert";
  if (value === "blocked_by_secret") return "Secret-Gate blockiert";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Nur Readmodel";
}

function signalLabel(value: VoxyRenderProviderHandoffSignal): string {
  if (value === "briefing_package_available") return "Briefing-Paket sichtbar";
  if (value === "segment_package_available") return "Segment-Paket sichtbar";
  if (value === "output_target_hints_available") return "Zielhinweise sichtbar";
  if (value === "source_review_needed") return "Quellenreview nötig";
  if (value === "factcheck_needed") return "Factcheck nötig";
  if (value === "human_input_needed") return "Menschliche Ergänzung nötig";
  if (value === "multilingual_review_needed") return "Mehrsprachigkeitsreview nötig";
  if (value === "provider_mapping_missing") return "Provider-Mapping fehlt";
  if (value === "secret_check_missing") return "Secret-Check fehlt";
  return "Runtime-Wahrheit fehlt";
}

function targetLabel(value: VoxyRenderProviderHandoffTarget): string {
  if (value === "briefing_package") return "Briefing-Paket";
  if (value === "voice_adapter") return "Voice-Adapter";
  if (value === "avatar_adapter") return "Avatar-Adapter";
  if (value === "render_adapter") return "Render-Adapter";
  if (value === "publish_adapter") return "Publish-Adapter";
  return "Audit-Trace";
}

function targetStatusLabel(value: VoxyRenderProviderHandoffTargetStatus): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_review") return "Review nötig";
  return "Blockiert";
}

function reviewGateLabel(value: VoxyRenderProviderHandoffReviewGate): string {
  if (value === "briefing_review") return "Briefing-Review";
  if (value === "script_review") return "Script-Review";
  if (value === "render_review") return "Render-Review";
  return "Publish-Review";
}

function reviewGateStatusLabel(value: VoxyRenderProviderHandoffReviewGateStatus): string {
  if (value === "approved") return "Freigegeben";
  if (value === "blocked") return "Blockiert";
  return "Review nötig";
}

function downstreamLabel(value: VoxyRenderProviderHandoffDownstreamTarget): string {
  if (value === "script_package") return "Script-Paket";
  if (value === "provider_mapping") return "Provider-Mapping";
  if (value === "render_queue") return "Render-Queue";
  if (value === "publish_draft") return "Publish-Draft";
  return "Archiv-/Audit-Pfad";
}

function downstreamStatusLabel(value: VoxyRenderProviderHandoffDownstreamStatus): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_review") return "Review nötig";
  return "Blockiert";
}

function nextDecisionLabel(value: VoxyRenderProviderHandoffNextDecision): string {
  if (value === "keep_internal") return "Intern halten";
  if (value === "request_sources") return "Quellenlage schärfen";
  if (value === "resolve_human_input") return "Offene Eingaben klären";
  if (value === "review_language") return "Sprache und Übersetzung prüfen";
  if (value === "refine_script") return "Script-Handoff schärfen";
  if (value === "review_render_gate") return "Render-Gate prüfen";
  if (value === "prepare_provider_mapping") return "Adapter-Mapping vorbereiten";
  if (value === "prepare_publish_review") return "Publish-Gate vorbereiten";
  return "Vorläufig blockiert";
}

function mapScriptStatus(
  value: VoxyBriefingScriptCandidateModel["scriptStatus"],
): VoxyRenderProviderHandoffStatus {
  if (value === "script_preview") return "handoff_preview";
  if (value === "needs_editorial_review") return "needs_editorial_review";
  if (value === "needs_source_review") return "needs_source_review";
  if (value === "needs_factcheck_review") return "needs_factcheck_review";
  if (value === "needs_human_input") return "needs_human_input";
  if (value === "needs_translation_review") return "needs_translation_review";
  if (value === "needs_compliance_review") return "needs_compliance_review";
  if (value === "blocked_by_runtime_truth") return "blocked_by_runtime_truth";
  if (value === "blocked_by_provider") return "blocked_by_provider";
  if (value === "blocked_by_missing_review") return "needs_script_review";
  return "readmodel_only";
}

function resolveOverallStatus(input: {
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  voxyReviewState: VoxyReviewState | null;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
}): VoxyRenderProviderHandoffStatus {
  if (!input.scriptModel) return "readmodel_only";

  const renderStatus = input.voxyRenderJob?.status ?? null;
  if (renderStatus === "blocked_by_provider") return "blocked_by_provider";
  if (renderStatus === "blocked_by_secret") return "blocked_by_secret";
  if (renderStatus === "blocked_by_runtime_truth") return "blocked_by_runtime_truth";
  if (input.voxyPublishDraft?.status === "blocked_by_runtime_truth") {
    return "blocked_by_runtime_truth";
  }

  const baseStatus = mapScriptStatus(input.scriptModel.scriptStatus);
  if (baseStatus !== "handoff_preview" && baseStatus !== "readmodel_only") {
    return baseStatus;
  }

  if (input.voxyReviewState?.scriptReview.status === "needs_review") {
    return "needs_script_review";
  }
  if (input.voxyReviewState?.briefingReview.status === "needs_review") {
    return "needs_editorial_review";
  }
  if (
    renderStatus === "ready_after_review" ||
    input.voxyReviewState?.renderReview.status === "needs_review"
  ) {
    return "needs_render_review";
  }
  if (
    input.voxyReviewState?.publishReview.status === "needs_review" &&
    renderStatus === "render_queued"
  ) {
    return "needs_publish_review";
  }
  return baseStatus;
}

function buildReviewGates(input: {
  scriptModel: VoxyBriefingScriptCandidateModel;
  voxyReviewState: VoxyReviewState | null;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
}): VoxyRenderProviderHandoffReviewGateItem[] {
  const briefingStatus: VoxyRenderProviderHandoffReviewGateStatus =
    input.voxyReviewState?.briefingReview.status === "approved" ? "approved" : "needs_review";
  const scriptStatus: VoxyRenderProviderHandoffReviewGateStatus =
    input.voxyReviewState?.scriptReview.status === "approved" ? "approved" : "needs_review";
  const renderStatus: VoxyRenderProviderHandoffReviewGateStatus =
    input.voxyReviewState?.renderReview.status === "approved"
      ? "approved"
      : input.voxyReviewState?.renderReview.status === "blocked_by_provider" ||
          input.voxyReviewState?.renderReview.status === "blocked_by_secret" ||
          input.voxyRenderJob?.status === "blocked_by_provider" ||
          input.voxyRenderJob?.status === "blocked_by_secret" ||
          input.voxyRenderJob?.status === "blocked_by_runtime_truth"
        ? "blocked"
        : "needs_review";
  const publishStatus: VoxyRenderProviderHandoffReviewGateStatus =
    input.voxyReviewState?.publishReview.status === "approved"
      ? "approved"
      : input.voxyReviewState?.publishReview.status === "blocked_by_runtime_truth" ||
          input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
        ? "blocked"
        : "needs_review";

  return [
    {
      id: "briefing_review",
      label: reviewGateLabel("briefing_review"),
      status: briefingStatus,
      statusLabel: reviewGateStatusLabel(briefingStatus),
      reason:
        briefingStatus === "approved"
          ? "Der Briefing-Kontext ist explizit freigegeben."
          : "Titel, Summary und Quellenkontext bleiben vor jedem Provider-Handoff reviewpflichtig.",
      reviewRequired: true,
    },
    {
      id: "script_review",
      label: reviewGateLabel("script_review"),
      status: scriptStatus,
      statusLabel: reviewGateStatusLabel(scriptStatus),
      reason:
        scriptStatus === "approved"
          ? "Das Script wurde bereits als Handoff-Grundlage bestätigt."
          : `Aktueller Script-Stand: ${input.scriptModel.scriptStatusLabel}.`,
      reviewRequired: true,
    },
    {
      id: "render_review",
      label: reviewGateLabel("render_review"),
      status: renderStatus,
      statusLabel: reviewGateStatusLabel(renderStatus),
      reason:
        input.voxyRenderJob?.status === "blocked_by_provider"
          ? "Ein Renderpfad bleibt ohne konfigurierten Adapter bewusst blockiert."
          : input.voxyRenderJob?.status === "blocked_by_secret"
            ? "Provider-Zugangsdaten fehlen oder sind nicht freigeschaltet."
            : input.voxyRenderJob?.status === "blocked_by_runtime_truth"
              ? "Es fehlt ehrliche Runtime-Wahrheit für einen Renderstart."
              : input.voxyRenderJob?.status === "render_queued"
                ? "Der Job bleibt nur als Adapter-Readmodel sichtbar und ist kein Live-Render-Versprechen."
                : "Render-Handoff bleibt ein separater, auditierbarer Review-Schritt.",
      reviewRequired: true,
    },
    {
      id: "publish_review",
      label: reviewGateLabel("publish_review"),
      status: publishStatus,
      statusLabel: reviewGateStatusLabel(publishStatus),
      reason:
        input.voxyPublishDraft?.status === "publish_ready"
          ? "Ein Publish-Draft bleibt Vorbereitung und keine Veröffentlichung."
          : input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
            ? "Für Publish fehlt weiter belastbare Runtime-Wahrheit."
            : "Publish bleibt getrennt von Script- und Render-Handoff.",
      reviewRequired: true,
    },
  ];
}

function buildProviderTargets(input: {
  scriptModel: VoxyBriefingScriptCandidateModel;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
  contributionRef: HandoffRef | null;
  voxyBriefing: VoxyVideoBriefing | null;
}): VoxyRenderProviderHandoffTargetItem[] {
  const hasSegments = input.scriptModel.scriptSegments.length > 0;
  const renderBlocked =
    input.voxyRenderJob?.status === "blocked_by_provider" ||
    input.voxyRenderJob?.status === "blocked_by_secret" ||
    input.voxyRenderJob?.status === "blocked_by_runtime_truth";
  const publishBlocked = input.voxyPublishDraft?.status === "blocked_by_runtime_truth";

  return [
    {
      id: "briefing_package",
      label: targetLabel("briefing_package"),
      status: hasSegments ? "prepared" : "needs_review",
      statusLabel: targetStatusLabel(hasSegments ? "prepared" : "needs_review"),
      reason: hasSegments
        ? `${input.scriptModel.scriptSegments.length} Script-Segmente und ein reviewpflichtiger Briefing-Kontext sind sichtbar.`
        : "Ohne belastbare Segmentstruktur bleibt das Briefing-Paket unvollständig.",
      reviewRequired: true,
    },
    {
      id: "voice_adapter",
      label: targetLabel("voice_adapter"),
      status: renderBlocked ? "blocked" : hasSegments ? "needs_review" : "needs_review",
      statusLabel: targetStatusLabel(renderBlocked ? "blocked" : "needs_review"),
      reason: renderBlocked
        ? "Voice bleibt Adapterpunkt und wird ohne freigegebenen Renderpfad nicht ausgelöst."
        : "Voice-Timing, Aussprache und Safety bleiben manuelle Review-Themen statt Providerlauf.",
      reviewRequired: true,
    },
    {
      id: "avatar_adapter",
      label: targetLabel("avatar_adapter"),
      status: renderBlocked ? "blocked" : hasSegments ? "needs_review" : "needs_review",
      statusLabel: targetStatusLabel(renderBlocked ? "blocked" : "needs_review"),
      reason: renderBlocked
        ? "Avatar-Setup bleibt ohne freigeschalteten Renderpfad bewusst blockiert."
        : "Avatar-Framing und Disclosure bleiben Review-Themen und erzeugen noch kein Asset.",
      reviewRequired: true,
    },
    {
      id: "render_adapter",
      label: targetLabel("render_adapter"),
      status:
        input.voxyRenderJob?.status === "render_queued"
          ? "prepared"
          : renderBlocked
            ? "blocked"
            : "needs_review",
      statusLabel: targetStatusLabel(
        input.voxyRenderJob?.status === "render_queued"
          ? "prepared"
          : renderBlocked
            ? "blocked"
            : "needs_review",
      ),
      reason:
        input.voxyRenderJob?.status === "render_queued"
          ? "Ein späterer Adapter-Handoff ist vorbereitet, aber nicht als Veröffentlichung zu lesen."
          : input.voxyRenderJob?.status === "blocked_by_provider"
            ? "Kein Render-Provider ist für diesen Slice freigeschaltet."
            : input.voxyRenderJob?.status === "blocked_by_secret"
              ? "Ohne Secret-Freigabe bleibt der Adapter blockiert."
              : input.voxyRenderJob?.status === "blocked_by_runtime_truth"
                ? "Ohne Runtime-Wahrheit bleibt ein Renderstart unehrlich."
                : "Render bleibt expliziter Review- und Adapter-Handoff statt Automatik.",
      reviewRequired: true,
    },
    {
      id: "publish_adapter",
      label: targetLabel("publish_adapter"),
      status:
        input.voxyPublishDraft?.status === "publish_ready"
          ? "prepared"
          : publishBlocked
            ? "blocked"
            : "needs_review",
      statusLabel: targetStatusLabel(
        input.voxyPublishDraft?.status === "publish_ready"
          ? "prepared"
          : publishBlocked
            ? "blocked"
            : "needs_review",
      ),
      reason:
        input.voxyPublishDraft?.status === "publish_ready"
          ? "Ein Publish-Draft bleibt vorbereitet und nicht veröffentlicht."
          : publishBlocked
            ? "Ohne Runtime-Wahrheit bleibt jeder Publish-Hinweis blockiert."
            : "Zielkanäle, Sichtbarkeit und Distribution bleiben getrennte Freigaben.",
      reviewRequired: true,
    },
    {
      id: "audit_trace",
      label: targetLabel("audit_trace"),
      status: input.contributionRef || input.voxyBriefing ? "prepared" : "needs_review",
      statusLabel: targetStatusLabel(input.contributionRef || input.voxyBriefing ? "prepared" : "needs_review"),
      reason:
        input.contributionRef || input.voxyBriefing
          ? "Der Handoff bleibt auf Beitrag, Briefing oder Zielkontext rückverfolgbar."
          : "Vor einem externen Adapter-Handoff fehlt noch eine belastbare Rückverknüpfung.",
      reviewRequired: true,
    },
  ];
}

function buildSignals(input: {
  scriptModel: VoxyBriefingScriptCandidateModel;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
}): HandoffTag<VoxyRenderProviderHandoffSignal>[] {
  const items: HandoffTag<VoxyRenderProviderHandoffSignal>[] = [];
  const push = (
    id: VoxyRenderProviderHandoffSignal,
    reason: string,
  ) => items.push({ id, label: signalLabel(id), reason });

  if (input.scriptModel.scriptDraft.title || input.scriptModel.scriptDraft.intro) {
    push(
      "briefing_package_available",
      "Titel, Intro und Review-Hinweise sind als Handoff-Paket sichtbar.",
    );
  }
  if (input.scriptModel.scriptSegments.length > 0) {
    push(
      "segment_package_available",
      `${input.scriptModel.scriptSegments.length} Segmente können später als Adapter-Paket übergeben werden.`,
    );
  }
  if (
    input.voxyPublishDraft?.targetHints.length ||
    input.outputModel?.channelCandidates.length ||
    input.outputModel?.outputFormatLabels.length
  ) {
    push(
      "output_target_hints_available",
      "Zielkanäle oder Ausgabeformate bleiben als Handoff-Hinweis sichtbar.",
    );
  }
  for (const signal of input.scriptModel.readinessSignals) {
    if (signal.id === "source_review_needed") {
      push("source_review_needed", signal.reason);
    }
    if (signal.id === "factcheck_needed") {
      push("factcheck_needed", signal.reason);
    }
    if (signal.id === "human_input_needed") {
      push("human_input_needed", signal.reason);
    }
    if (signal.id === "multilingual_review_needed") {
      push("multilingual_review_needed", signal.reason);
    }
  }
  if (!input.voxyRenderJob || input.voxyRenderJob.status === "blocked_by_provider") {
    push(
      "provider_mapping_missing",
      "Adapter-Schnittstellen bleiben sichtbar, aber in diesem Slice bewusst unkonfiguriert.",
    );
  }
  if (!input.voxyRenderJob || input.voxyRenderJob.status === "blocked_by_secret") {
    push(
      "secret_check_missing",
      "Secret- und Zugangsfreigaben bleiben explizite Betreiberentscheidungen.",
    );
  }
  if (
    input.voxyRenderJob?.status === "blocked_by_runtime_truth" ||
    input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
  ) {
    push(
      "runtime_truth_missing",
      "Ohne belastbare Runtime-Wahrheit bleibt Render oder Publish bewusst blockiert.",
    );
  }

  return uniqueStrings(items.map((item) => item.id)).map((id) =>
    items.find((item) => item.id === id)!,
  );
}

function buildBlockers(input: {
  status: VoxyRenderProviderHandoffStatus;
  scriptModel: VoxyBriefingScriptCandidateModel;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
}): string[] {
  const blockers = [
    ...input.scriptModel.scriptRisks.map((item) => item.label),
  ];

  if (input.status === "blocked_by_provider") {
    blockers.push("Kein freigeschalteter Provider-Adapter für diesen Handoff.");
  }
  if (input.status === "blocked_by_secret") {
    blockers.push("Provider-Secrets oder Zugangsdaten fehlen.");
  }
  if (input.status === "blocked_by_runtime_truth") {
    blockers.push("Render- oder Publish-Runtime ist nicht belastbar genug sichtbar.");
  }
  if (input.voxyRenderJob?.status === "ready_after_review") {
    blockers.push("Render-Handoff bleibt vor Freigabe nur vorbereiteter Review-Kandidat.");
  }
  if (input.voxyPublishDraft?.status === "draft_only") {
    blockers.push("Publish-Draft ist noch nicht als veröffentlichbarer Folgeschritt vorbereitet.");
  }

  return uniqueStrings(blockers);
}

function buildDownstreamReadiness(input: {
  status: VoxyRenderProviderHandoffStatus;
  scriptModel: VoxyBriefingScriptCandidateModel;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
  hasTrace: boolean;
}): VoxyRenderProviderHandoffDownstreamItem[] {
  const renderBlocked =
    input.voxyRenderJob?.status === "blocked_by_provider" ||
    input.voxyRenderJob?.status === "blocked_by_secret" ||
    input.voxyRenderJob?.status === "blocked_by_runtime_truth";

  return [
    {
      id: "script_package",
      label: downstreamLabel("script_package"),
      status: input.scriptModel.scriptSegments.length > 0 ? "prepared" : "needs_review",
      statusLabel: downstreamStatusLabel(
        input.scriptModel.scriptSegments.length > 0 ? "prepared" : "needs_review",
      ),
      reason:
        input.scriptModel.scriptSegments.length > 0
          ? "Script, Segmente und Disclosure sind als Draft-only Paket sichtbar."
          : "Vor einem Adapter-Handoff fehlt noch eine belastbare Segmentstruktur.",
      reviewRequired: true,
    },
    {
      id: "provider_mapping",
      label: downstreamLabel("provider_mapping"),
      status:
        renderBlocked || !input.voxyRenderJob
          ? "blocked"
          : input.status === "needs_render_review"
            ? "needs_review"
            : "prepared",
      statusLabel: downstreamStatusLabel(
        renderBlocked || !input.voxyRenderJob
          ? "blocked"
          : input.status === "needs_render_review"
            ? "needs_review"
            : "prepared",
      ),
      reason:
        !input.voxyRenderJob || input.voxyRenderJob.status === "blocked_by_provider"
          ? "Ohne Provider-Mapping bleibt dieser Pfad bewusst blockiert."
          : input.voxyRenderJob.status === "blocked_by_secret"
            ? "Secret-Freigaben fehlen noch."
            : input.voxyRenderJob.status === "blocked_by_runtime_truth"
              ? "Runtime-Wahrheit muss vor jedem Mapping geklärt werden."
              : "Adapter-Mapping bleibt vorbereitet und reviewpflichtig.",
      reviewRequired: true,
    },
    {
      id: "render_queue",
      label: downstreamLabel("render_queue"),
      status:
        input.voxyRenderJob?.status === "render_queued"
          ? "prepared"
          : renderBlocked
            ? "blocked"
            : "needs_review",
      statusLabel: downstreamStatusLabel(
        input.voxyRenderJob?.status === "render_queued"
          ? "prepared"
          : renderBlocked
            ? "blocked"
            : "needs_review",
      ),
      reason:
        input.voxyRenderJob?.status === "render_queued"
          ? "Render bleibt als separater Queue-Hinweis sichtbar, nicht als Live-Ergebnis."
          : "Render-Queue bleibt ein späterer, expliziter Review-Schritt.",
      reviewRequired: true,
    },
    {
      id: "publish_draft",
      label: downstreamLabel("publish_draft"),
      status:
        input.voxyPublishDraft?.status === "publish_ready"
          ? "prepared"
          : input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
            ? "blocked"
            : "needs_review",
      statusLabel: downstreamStatusLabel(
        input.voxyPublishDraft?.status === "publish_ready"
          ? "prepared"
          : input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
            ? "blocked"
            : "needs_review",
      ),
      reason:
        input.voxyPublishDraft?.status === "publish_ready"
          ? "Publish-Draft ist vorbereitet, bleibt aber nicht veröffentlicht."
          : input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
            ? "Publish bleibt ohne Runtime-Wahrheit blockiert."
            : "Publish-Gates bleiben getrennt von Briefing und Render.",
      reviewRequired: true,
    },
    {
      id: "archive_trace",
      label: downstreamLabel("archive_trace"),
      status: input.hasTrace ? "prepared" : "needs_review",
      statusLabel: downstreamStatusLabel(input.hasTrace ? "prepared" : "needs_review"),
      reason:
        input.hasTrace
          ? "Der Handoff kann Beitrag, Briefing und Zielhinweise rückverfolgbar dokumentieren."
          : "Vor einem späteren Adapter-Handoff fehlt noch eine belastbare Trace-Kette.",
      reviewRequired: true,
    },
  ];
}

function buildNextDecision(
  status: VoxyRenderProviderHandoffStatus,
): {
  id: VoxyRenderProviderHandoffNextDecision;
  reason: string;
} {
  if (status === "readmodel_only") {
    return {
      id: "keep_internal",
      reason: "Ohne belastbaren Script- und Review-Kontext bleibt der Handoff intern.",
    };
  }
  if (status === "needs_source_review" || status === "needs_factcheck_review") {
    return {
      id: "request_sources",
      reason: "Vor jedem Provider-Handoff müssen Quellenlage und Factcheck sichtbar geklärt werden.",
    };
  }
  if (status === "needs_human_input") {
    return {
      id: "resolve_human_input",
      reason: "Offene menschliche Eingaben bleiben vor Voice-, Avatar- oder Render-Handoff vorrangig.",
    };
  }
  if (status === "needs_translation_review") {
    return {
      id: "review_language",
      reason: "Original, Lesefassung und Script-Sprache müssen vor jedem Handoff getrennt geprüft bleiben.",
    };
  }
  if (
    status === "needs_script_review" ||
    status === "needs_compliance_review" ||
    status === "needs_editorial_review"
  ) {
    return {
      id: "refine_script",
      reason: "Script-, Ton- und Sensibilitätsfragen müssen vor einem Adapter-Handoff geklärt werden.",
    };
  }
  if (status === "needs_render_review") {
    return {
      id: "review_render_gate",
      reason: "Render bleibt ein eigener Review- und Freigabeschritt statt automatischer Folgelogik.",
    };
  }
  if (status === "needs_publish_review") {
    return {
      id: "prepare_publish_review",
      reason: "Publish-Gates bleiben auch nach einem möglichen Render-Handoff getrennt reviewpflichtig.",
    };
  }
  if (status === "blocked_by_provider" || status === "blocked_by_secret") {
    return {
      id: "prepare_provider_mapping",
      reason: "Adapter, Secrets und Freigaben bleiben bewusste Betreiberentscheidungen.",
    };
  }
  if (status === "blocked_by_runtime_truth") {
    return {
      id: "blocked",
      reason: "Ohne Runtime-Wahrheit bleibt jeder Provider- oder Publish-Handoff bewusst blockiert.",
    };
  }
  return {
    id: "prepare_provider_mapping",
    reason: "Das Handoff-Paket ist sichtbar, bleibt aber Draft-only und adapter-first.",
  };
}

function buildPacketSummary(input: {
  scriptModel: VoxyBriefingScriptCandidateModel;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyBriefing: VoxyVideoBriefing | null;
  voxyRenderJob: VoxyRenderJob | null;
  voxyPublishDraft: VoxyPublishDraft | null;
}) {
  return {
    briefingTitle:
      normalizeText(input.voxyBriefing?.title) || input.scriptModel.scriptDraft.title,
    briefingSummary:
      normalizeText(input.voxyBriefing?.summary) || input.scriptModel.scriptDraft.intro,
    segmentCount: input.scriptModel.scriptSegments.length,
    estimatedDurationSeconds: input.scriptModel.scriptDraft.estimatedDurationSeconds,
    targetHints: uniqueStrings([
      ...(input.voxyPublishDraft?.targetHints ?? []),
      ...(input.outputModel?.channelCandidates.map((item) => item.label) ?? []),
      ...(input.outputModel?.outputFormatLabels ?? []),
    ]),
    assetTruthLabel:
      "Noch keine Audio-, Avatar- oder Video-Assets. Sichtbar ist nur ein reviewpflichtiger Handoff-Kandidat.",
    providerBindingLabel:
      "Adapter-only. Kein Providerlauf, kein Upload, kein Scheduling und keine Veröffentlichung.",
    renderStatusLabel:
      input.voxyRenderJob?.status === "render_queued"
        ? "Render-Hinweis vorbereitet"
        : input.voxyRenderJob?.status === "blocked_by_provider"
          ? "Render durch fehlenden Provider blockiert"
          : input.voxyRenderJob?.status === "blocked_by_secret"
            ? "Render durch fehlende Secrets blockiert"
            : input.voxyRenderJob?.status === "blocked_by_runtime_truth"
              ? "Render durch fehlende Runtime-Wahrheit blockiert"
              : "Noch kein Render ausgelöst",
    publishStatusLabel:
      input.voxyPublishDraft?.status === "publish_ready"
        ? "Publish-Draft vorbereitet"
        : input.voxyPublishDraft?.status === "blocked_by_runtime_truth"
          ? "Publish durch fehlende Runtime-Wahrheit blockiert"
          : "Noch kein Publish ausgelöst",
  };
}

function buildModelFromInput(input: BuildModelInput): VoxyRenderProviderHandoffModel | null {
  if (!input.scriptModel) return null;

  const status = resolveOverallStatus({
    scriptModel: input.scriptModel,
    voxyReviewState: input.voxyReviewState,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
  });
  const packetSummary = buildPacketSummary({
    scriptModel: input.scriptModel,
    outputModel: input.outputModel,
    voxyBriefing: input.voxyBriefing,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
  });
  const reviewGates = buildReviewGates({
    scriptModel: input.scriptModel,
    voxyReviewState: input.voxyReviewState,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
  });
  const providerTargets = buildProviderTargets({
    scriptModel: input.scriptModel,
    outputModel: input.outputModel,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
    contributionRef: input.contributionRef ?? null,
    voxyBriefing: input.voxyBriefing,
  });
  const handoffSignals = buildSignals({
    scriptModel: input.scriptModel,
    outputModel: input.outputModel,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
  });
  const blockers = buildBlockers({
    status,
    scriptModel: input.scriptModel,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
  });
  const downstreamReadiness = buildDownstreamReadiness({
    status,
    scriptModel: input.scriptModel,
    voxyRenderJob: input.voxyRenderJob,
    voxyPublishDraft: input.voxyPublishDraft,
    hasTrace: Boolean(input.contributionRef || input.voxyBriefing),
  });
  const nextDecision = buildNextDecision(status);
  const sourceLanguage = input.scriptModel.sourceLanguage;
  const readingLanguage = input.scriptModel.readingLanguage;
  const scriptLanguage = input.scriptModel.scriptLanguage;
  const sourceLabel = languageName(sourceLanguage);
  const readingLabel = languageName(readingLanguage);
  const scriptLabel = languageName(scriptLanguage);
  const rtlLabel = input.scriptModel.rtlDisplayHint ? " · RTL-Hinweis aktiv" : "";

  return {
    title: "Voxy Render/Provider Handoff",
    summary:
      "Dieser Block bündelt Script-, Adapter-, Render- und Publish-Gates als reviewpflichtigen Handoff-Kandidaten. Er startet keine Provider, kein Rendering und keine Veröffentlichung.",
    surface: input.surface,
    contributionRef: input.contributionRef ?? null,
    dossierRef: input.dossierRef ?? null,
    outputRef: input.outputRef ?? null,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    languageLabel: `Original: ${sourceLabel} · Lesefassung: ${readingLabel} · Handoff-Sprache: ${scriptLabel}${rtlLabel}`,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDisplayHint: input.scriptModel.rtlDisplayHint,
    handoffStatus: status,
    handoffStatusLabel: handoffStatusLabel(status),
    handoffPacket: packetSummary,
    reviewGates,
    providerTargets,
    handoffSignals,
    blockers,
    downstreamReadiness,
    nextHandoffDecision: {
      id: nextDecision.id,
      label: nextDecisionLabel(nextDecision.id),
      reason: nextDecision.reason,
    },
    publicSafeLabel: "Interner Handoff-Kandidat, kein Renderlauf",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    reviewRequired: true,
    noProviderCall: true,
    noRenderTrigger: true,
    noPublishTrigger: true,
    noScheduleAction: true,
    noRuntimeClaim: true,
  };
}

function sanitizeIdFragment(value: string): string {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function buildVoxyRenderProviderHandoffPacket(params: {
  model: VoxyRenderProviderHandoffModel | null;
  scriptModel: VoxyBriefingScriptCandidateModel | null;
  briefingId?: string | null;
}): VoxyRenderProviderHandoffPacket | null {
  if (!params.model || !params.scriptModel) return null;
  const briefingId =
    normalizeText(params.briefingId) ||
    `${sanitizeIdFragment(params.model.surface)}-${sanitizeIdFragment(
      params.model.contributionRef?.id ?? params.model.handoffPacket.briefingTitle,
    )}-voxy-handoff`;
  const segments = buildVoxyVideoSegmentsFromScriptCandidate({
    model: params.scriptModel,
    briefingId,
  });

  return {
    handoffId: `${briefingId}-provider-handoff`,
    briefingId,
    title: params.model.handoffPacket.briefingTitle,
    summary: params.model.handoffPacket.briefingSummary,
    scriptLanguage: params.model.scriptLanguage,
    segmentCount: segments.length,
    segments,
    targetHints: [...params.model.handoffPacket.targetHints],
    reviewRequired: true,
    providerInterface: "adapter_only",
    noProviderCall: true,
    noRenderTrigger: true,
    noPublishTrigger: true,
  };
}

export function buildVoxyRenderProviderHandoffFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  const scriptModel = buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(model);
  const outputModel = buildOutputSocialWorkbenchFromCreateCandidatePreview(model);

  return buildModelFromInput({
    surface: "create",
    contributionRef: scriptModel?.contributionRef ?? null,
    outputRef: scriptModel?.outputRef ?? null,
    scriptModel,
    outputModel,
    voxyBriefing: null,
    voxyReviewState: null,
    voxyRenderJob: null,
    voxyPublishDraft: null,
    userVisibleReason:
      "Dieser Render/Provider-Handoff bleibt in /create eine Vorschau. Nichts wird an externe Systeme übergeben.",
    reviewerVisibleReason:
      "Create zeigt nur einen typed Adapter-Handoff aus dem Script-Kandidaten. Kein Provider-, Render- oder Publish-Start.",
    nextStep: model.reviewHandoff.items[0]?.targetState ?? "Review-Handoff vorbereiten",
  });
}

export function buildVoxyRenderProviderHandoffFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    contributionRef?: HandoffRef | null;
    outputRef?: HandoffRef | null;
    nextStep?: string;
  },
) {
  const scriptModel = buildVoxyBriefingScriptCandidateFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Review-Handoff vorbereiten",
  });
  const outputModel = buildOutputSocialWorkbenchFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Review-Handoff vorbereiten",
  });

  return buildModelFromInput({
    surface: "account",
    contributionRef: options?.contributionRef ?? dialog?.contributionRef ?? null,
    outputRef: options?.outputRef ?? null,
    scriptModel,
    outputModel,
    voxyBriefing: null,
    voxyReviewState: null,
    voxyRenderJob: null,
    voxyPublishDraft: null,
    userVisibleReason:
      "Im Account bleibt dieser Voxy-Handoff ein lokaler oder resume-fähiger Arbeitsstand. Kein Provider wird kontaktiert.",
    reviewerVisibleReason:
      "Lokale oder resume-fähige Beiträge zeigen nur einen typed Provider-Handoff auf Basis des Script-Kandidaten.",
    nextStep: options?.nextStep ?? "Review-Handoff vorbereiten",
  });
}

export function buildVoxyRenderProviderHandoffFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: HandoffRef | null;
    dossierRef?: HandoffRef | null;
    outputRef?: HandoffRef | null;
  },
) {
  const surface: Extract<HandoffSurface, "admin" | "workspace"> =
    options?.audience === "admin" ? "admin" : "workspace";
  const scriptModel = buildVoxyBriefingScriptCandidateFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
  });
  const outputModel = buildOutputSocialWorkbenchFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });

  return buildModelFromInput({
    surface,
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    outputRef: options?.outputRef ?? null,
    scriptModel,
    outputModel,
    voxyBriefing: context.voxyBriefing,
    voxyReviewState: context.voxyReviewState,
    voxyRenderJob: context.voxyRenderJob,
    voxyPublishDraft: context.voxyPublishDraft,
    userVisibleReason:
      "Dieser Handoff zeigt nur vorbereitete Adapter-, Render- und Publish-Gates. Es wird nichts ausgelöst.",
    reviewerVisibleReason:
      "Review-Kontext, Render-Job und Publish-Draft werden nur als typed Handoff-Schicht lesbar gemacht. Keine Providerbindung, kein Render, kein Publish.",
    nextStep:
      context.primaryUnifiedItem?.requiredReviewType === "publish_review"
        ? "Publish-Review getrennt prüfen"
        : "Render/Provider-Handoff reviewen",
  });
}

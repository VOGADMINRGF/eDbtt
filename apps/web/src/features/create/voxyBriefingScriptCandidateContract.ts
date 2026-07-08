import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type {
  DossierWorkspaceDecisionModel,
} from "@/features/create/dossierWorkspaceDecisionContract";
import {
  buildDossierWorkspaceDecisionFromCreateCandidatePreview,
  buildDossierWorkspaceDecisionFromReviewContext,
  buildDossierWorkspaceDecisionFromVoxyDialog,
} from "@/features/create/dossierWorkspaceDecisionContract";
import type {
  OutputSocialWorkbenchModel,
} from "@/features/create/outputSocialWorkbenchContract";
import {
  buildOutputSocialWorkbenchFromCreateCandidatePreview,
  buildOutputSocialWorkbenchFromReviewContext,
  buildOutputSocialWorkbenchFromVoxyDialog,
} from "@/features/create/outputSocialWorkbenchContract";
import type {
  ParticipationActivationReviewModel,
} from "@/features/create/participationActivationReviewContract";
import {
  buildParticipationActivationReviewFromCreateCandidatePreview,
  buildParticipationActivationReviewFromReviewContext,
  buildParticipationActivationReviewFromVoxyDialog,
} from "@/features/create/participationActivationReviewContract";
import type {
  PollQuestionOptionsReviewModel,
} from "@/features/create/pollQuestionOptionsReviewContract";
import {
  buildPollQuestionOptionsReviewFromCreateCandidatePreview,
  buildPollQuestionOptionsReviewFromReviewContext,
  buildPollQuestionOptionsReviewFromVoxyDialog,
} from "@/features/create/pollQuestionOptionsReviewContract";
import type {
  SourceFactcheckFeedEnrichmentModel,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import {
  buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview,
  buildSourceFactcheckFeedEnrichmentFromReviewContext,
  buildSourceFactcheckFeedEnrichmentFromVoxyDialog,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type {
  V3VoxyCocreationDialogModel,
} from "@/features/create/voxyCocreationDialogContract";
import {
  buildVoxyCocreationDialogFromReviewContext,
} from "@/features/create/voxyCocreationDialogContract";
import { resolveCreateLanguageContext } from "@/features/create/languageContextContract";
import { usesCanonicalRtlLayout } from "@/features/create/languageBridgeTrustFormatContract";
import {
  buildVoxyScriptSegments,
  type VoxyRenderJob,
  type VoxyScriptSegment,
  type VoxyScriptSegmentKind,
  type VoxyVideoBriefing,
} from "@/features/voxyVideo";

export const VOXY_BRIEFING_SCRIPT_CANDIDATE_STATUSES = [
  "readmodel_only",
  "script_preview",
  "needs_editorial_review",
  "needs_source_review",
  "needs_factcheck_review",
  "needs_human_input",
  "needs_translation_review",
  "needs_compliance_review",
  "blocked_by_runtime_truth",
  "blocked_by_missing_review",
  "blocked_by_provider",
] as const;

export type VoxyBriefingScriptCandidateStatus =
  (typeof VOXY_BRIEFING_SCRIPT_CANDIDATE_STATUSES)[number];

export const VOXY_BRIEFING_SCRIPT_FORMATS = [
  "short_briefing",
  "desk_update",
  "participation_invitation",
  "poll_explainer",
  "dossier_summary",
  "source_review_prompt",
  "counterposition_explainer",
  "multilingual_bridge_note",
  "internal_review_script",
  "keep_as_note",
] as const;

export type VoxyBriefingScriptFormat =
  (typeof VOXY_BRIEFING_SCRIPT_FORMATS)[number];

export const VOXY_BRIEFING_SCRIPT_SEGMENT_KINDS = [
  "hook",
  "context",
  "thesis",
  "counterposition",
  "open_questions",
  "source_status",
  "participation_prompt",
  "poll_prompt",
  "review_disclaimer",
  "closing",
] as const;

export type VoxyBriefingScriptSegmentKind =
  (typeof VOXY_BRIEFING_SCRIPT_SEGMENT_KINDS)[number];

export const VOXY_BRIEFING_SCRIPT_RISKS = [
  "missing_source_context",
  "factcheck_needed",
  "overclaiming_risk",
  "public_misinterpretation_risk",
  "minority_view_smoothing_risk",
  "translation_misread_risk",
  "tone_too_promotional",
  "legal_policy_sensitivity",
  "vulnerable_group_impact",
  "call_to_action_too_strong",
] as const;

export type VoxyBriefingScriptRisk =
  (typeof VOXY_BRIEFING_SCRIPT_RISKS)[number];

export const VOXY_BRIEFING_SCRIPT_READINESS_SIGNALS = [
  "dossier_summary_available",
  "participation_question_available",
  "poll_question_available",
  "source_review_needed",
  "factcheck_needed",
  "human_input_needed",
  "output_review_needed",
  "multilingual_review_needed",
  "render_provider_missing",
] as const;

export type VoxyBriefingScriptReadinessSignal =
  (typeof VOXY_BRIEFING_SCRIPT_READINESS_SIGNALS)[number];

export const VOXY_BRIEFING_SCRIPT_DOWNSTREAM_TARGETS = [
  "scriptReview",
  "render",
  "social",
  "publishing",
  "archive",
] as const;

export type VoxyBriefingScriptDownstreamTarget =
  (typeof VOXY_BRIEFING_SCRIPT_DOWNSTREAM_TARGETS)[number];

export const VOXY_BRIEFING_SCRIPT_DOWNSTREAM_STATUSES = [
  "blocked",
  "needs_review",
  "prepared",
] as const;

export type VoxyBriefingScriptDownstreamStatus =
  (typeof VOXY_BRIEFING_SCRIPT_DOWNSTREAM_STATUSES)[number];

export const VOXY_BRIEFING_SCRIPT_NEXT_DECISIONS = [
  "refine_script",
  "request_sources",
  "review_claims",
  "translate_or_review_language",
  "prepare_render_handoff",
  "keep_internal",
  "blocked",
] as const;

export type VoxyBriefingScriptNextDecision =
  (typeof VOXY_BRIEFING_SCRIPT_NEXT_DECISIONS)[number];

type ScriptSurface = "create" | "account" | "admin" | "workspace";

type ScriptRef = {
  id: string;
  title: string;
  href?: string | null;
};

type ScriptTag<T extends string> = {
  id: T;
  label: string;
  reason: string;
};

export type VoxyBriefingScriptSegmentDraft = {
  id: string;
  kind: VoxyBriefingScriptSegmentKind;
  label: string;
  body: string;
  reviewRequired: true;
  risks: string[];
};

export type VoxyBriefingScriptDownstreamItem = {
  id: VoxyBriefingScriptDownstreamTarget;
  label: string;
  status: VoxyBriefingScriptDownstreamStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type VoxyBriefingScriptCandidateModel = {
  title: string;
  summary: string;
  surface: ScriptSurface;
  contributionRef: ScriptRef | null;
  dossierRef: ScriptRef | null;
  participationRef: ScriptRef | null;
  pollRef: ScriptRef | null;
  outputRef: ScriptRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlDisplayHint: boolean;
  scriptStatus: VoxyBriefingScriptCandidateStatus;
  scriptStatusLabel: string;
  scriptFormat: VoxyBriefingScriptFormat;
  scriptFormatLabel: string;
  scriptSegments: VoxyBriefingScriptSegmentDraft[];
  scriptDraft: {
    title: string;
    intro: string;
    segments: VoxyBriefingScriptSegmentDraft[];
    estimatedDurationSeconds: number;
    publicSafeLabel: string;
  };
  scriptRisks: ScriptTag<VoxyBriefingScriptRisk>[];
  readinessSignals: ScriptTag<VoxyBriefingScriptReadinessSignal>[];
  downstreamReadiness: VoxyBriefingScriptDownstreamItem[];
  nextScriptDecision: {
    id: VoxyBriefingScriptNextDecision;
    label: string;
    reason: string;
  };
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  reviewRequired: true;
  noRenderAction: true;
  noPublishAction: true;
  noSocialPostAction: true;
  noRuntimeClaim: true;
};

type BuildSignalsInput = {
  surface: ScriptSurface;
  contributionRef?: ScriptRef | null;
  dossierRef?: ScriptRef | null;
  participationRef?: ScriptRef | null;
  pollRef?: ScriptRef | null;
  outputRef?: ScriptRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  rtlDisplayHint: boolean;
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  dossierModel: DossierWorkspaceDecisionModel | null;
  activationModel: ParticipationActivationReviewModel | null;
  pollModel: PollQuestionOptionsReviewModel | null;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyDialog: V3VoxyCocreationDialogModel | null;
  voxyBriefing: VoxyVideoBriefing | null;
  voxyScriptSegments: VoxyScriptSegment[];
  voxyRenderJob: VoxyRenderJob | null;
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

function scriptStatusLabel(value: VoxyBriefingScriptCandidateStatus): string {
  if (value === "script_preview") return "Script-Vorschau";
  if (value === "needs_editorial_review") return "Redaktionelle Prüfung offen";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Factcheck-Prüfung offen";
  if (value === "needs_human_input") return "Menschliche Ergänzung offen";
  if (value === "needs_translation_review") return "Sprach- und Übersetzungsreview offen";
  if (value === "needs_compliance_review") return "Sensibilitäts- und Compliance-Review offen";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  if (value === "blocked_by_missing_review") return "Review fehlt";
  if (value === "blocked_by_provider") return "Provider-Gate blockiert";
  return "Nur Readmodel";
}

function scriptFormatLabel(value: VoxyBriefingScriptFormat): string {
  if (value === "short_briefing") return "Kurzes Briefing";
  if (value === "desk_update") return "Desk-Update";
  if (value === "participation_invitation") return "Beteiligungseinladung";
  if (value === "poll_explainer") return "Poll-Erklärung";
  if (value === "dossier_summary") return "Dossier-Zusammenfassung";
  if (value === "source_review_prompt") return "Quellen-/Review-Prompt";
  if (value === "counterposition_explainer") return "Gegenpositions-Erklärung";
  if (value === "multilingual_bridge_note") return "Mehrsprachige Brückennotiz";
  if (value === "internal_review_script") return "Internes Review-Skript";
  return "Als Notiz behalten";
}

function segmentLabel(value: VoxyBriefingScriptSegmentKind): string {
  if (value === "hook") return "Einstieg";
  if (value === "context") return "Kontext";
  if (value === "thesis") return "These";
  if (value === "counterposition") return "Gegenposition";
  if (value === "open_questions") return "Offene Fragen";
  if (value === "source_status") return "Quellen- und Factcheck-Stand";
  if (value === "participation_prompt") return "Beteiligungsfrage";
  if (value === "poll_prompt") return "Poll-Hinweis";
  if (value === "review_disclaimer") return "Review-Hinweis";
  return "Neutraler Abschluss";
}

function riskLabel(value: VoxyBriefingScriptRisk): string {
  if (value === "missing_source_context") return "Quellenkontext fehlt";
  if (value === "factcheck_needed") return "Factcheck nötig";
  if (value === "overclaiming_risk") return "Überdehnungsrisiko";
  if (value === "public_misinterpretation_risk") return "Missverständnisrisiko";
  if (value === "minority_view_smoothing_risk") return "Minderheitenperspektive glätten vermeiden";
  if (value === "translation_misread_risk") return "Übersetzungsrisiko";
  if (value === "tone_too_promotional") return "Ton zu werblich";
  if (value === "legal_policy_sensitivity") return "Rechtlich/politisch sensibel";
  if (value === "vulnerable_group_impact") return "Betroffenengruppen sensibel";
  return "Call-to-Action zu stark";
}

function readinessLabel(value: VoxyBriefingScriptReadinessSignal): string {
  if (value === "dossier_summary_available") return "Dossier-Zusammenfassung vorhanden";
  if (value === "participation_question_available") return "Beteiligungsfrage vorhanden";
  if (value === "poll_question_available") return "Poll-Frage vorhanden";
  if (value === "source_review_needed") return "Quellenreview nötig";
  if (value === "factcheck_needed") return "Factcheck nötig";
  if (value === "human_input_needed") return "Menschliche Ergänzung nötig";
  if (value === "output_review_needed") return "Output-Review nötig";
  if (value === "multilingual_review_needed") return "Mehrsprachigkeitsreview nötig";
  return "Render-Provider fehlt";
}

function downstreamLabel(value: VoxyBriefingScriptDownstreamTarget): string {
  if (value === "scriptReview") return "Script Review";
  if (value === "render") return "Render-Handoff";
  if (value === "social") return "Social-Handoff";
  if (value === "publishing") return "Publishing-Handoff";
  return "Archiv-/Dokupfad";
}

function downstreamStatusLabel(value: VoxyBriefingScriptDownstreamStatus): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_review") return "Review nötig";
  return "Blockiert";
}

function nextDecisionLabel(value: VoxyBriefingScriptNextDecision): string {
  if (value === "refine_script") return "Script weiter schärfen";
  if (value === "request_sources") return "Quellen anfordern";
  if (value === "review_claims") return "Claims und Risiken prüfen";
  if (value === "translate_or_review_language") return "Sprache prüfen oder übersetzen";
  if (value === "prepare_render_handoff") return "Späteren Render-Handoff vorbereiten";
  if (value === "keep_internal") return "Intern halten";
  return "Vorläufig blockiert";
}

function buildTag<T extends string>(id: T, label: string, reason: string): ScriptTag<T> {
  return { id, label, reason };
}

function findOutputDraft(
  model: OutputSocialWorkbenchModel | null,
  formats: VoxyBriefingScriptFormat[],
) {
  if (!model) return null;
  const formatMap: Record<VoxyBriefingScriptFormat, OutputSocialWorkbenchModel["draftItems"][number]["format"][]> = {
    short_briefing: ["neutral_brief", "debate_status_summary"],
    desk_update: ["admin_review_note", "debate_status_summary"],
    participation_invitation: ["participation_invitation", "stakeholder_invitation"],
    poll_explainer: ["poll_invitation"],
    dossier_summary: ["debate_status_summary", "neutral_brief"],
    source_review_prompt: ["admin_review_note", "voxy_briefing_note"],
    counterposition_explainer: ["neutral_brief", "debate_status_summary"],
    multilingual_bridge_note: ["voxy_briefing_note", "neutral_brief"],
    internal_review_script: ["admin_review_note", "voxy_briefing_note"],
    keep_as_note: ["voxy_briefing_note", "admin_review_note"],
  };
  const outputFormats = formats.flatMap((format) => formatMap[format]);
  return (
    model.draftItems.find((item) => outputFormats.includes(item.format)) ??
    model.draftItems[0] ??
    null
  );
}

function firstSentence(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parts = normalized.split(/(?<=[.!?])\s+/);
  return parts[0] ?? normalized;
}

function buildScriptFormat(input: {
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  dossierModel: DossierWorkspaceDecisionModel | null;
  activationModel: ParticipationActivationReviewModel | null;
  pollModel: PollQuestionOptionsReviewModel | null;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyDialog: V3VoxyCocreationDialogModel | null;
}): VoxyBriefingScriptFormat {
  const humanInputNeeded =
    input.voxyDialog?.status === "needs_user_input" ||
    input.voxyDialog?.cards.some((card) => card.status === "needs_user_input");
  const sourceReviewNeeded = Boolean(
    input.sourceModel &&
      (input.sourceModel.sourceNeeds.length > 0 || input.sourceModel.claimReviewNeeds.length > 0),
  );
  const translationReviewNeeded =
    input.sourceLanguage !== input.readingLanguage ||
    input.scriptLanguage !== input.sourceLanguage ||
    Boolean(input.sourceModel?.rtlDisplayHint);
  const pollQuestion = normalizeText(input.pollModel?.proposedQuestion);
  const participationQuestion = normalizeText(
    input.activationModel?.proposedParticipationQuestion,
  );
  const thesis = normalizeText(input.dossierModel?.thesis.label);
  const counterpositionPresent =
    input.dossierModel?.counterposition.status === "present" ||
    input.dossierModel?.counterposition.status === "suggested";

  if (!thesis && !participationQuestion && !pollQuestion && humanInputNeeded) {
    return "keep_as_note";
  }
  if (translationReviewNeeded) return "multilingual_bridge_note";
  if (pollQuestion) return "poll_explainer";
  if (participationQuestion) return "participation_invitation";
  if (sourceReviewNeeded && !thesis) return "source_review_prompt";
  if (counterpositionPresent) return "counterposition_explainer";
  if (input.outputModel?.draftItems.some((item) => item.format === "admin_review_note")) {
    return "desk_update";
  }
  if (input.outputModel?.draftItems.some((item) => item.format === "debate_status_summary")) {
    return "dossier_summary";
  }
  if (thesis) return "short_briefing";
  return "internal_review_script";
}

function buildScriptRisks(input: {
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  dossierModel: DossierWorkspaceDecisionModel | null;
  activationModel: ParticipationActivationReviewModel | null;
  pollModel: PollQuestionOptionsReviewModel | null;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyDialog: V3VoxyCocreationDialogModel | null;
  rtlDisplayHint: boolean;
}): ScriptTag<VoxyBriefingScriptRisk>[] {
  const items: ScriptTag<VoxyBriefingScriptRisk>[] = [];

  if ((input.sourceModel?.sourceNeeds.length ?? 0) > 0) {
    items.push(
      buildTag(
        "missing_source_context",
        riskLabel("missing_source_context"),
        "Für das Briefing fehlen noch belastbare Quellen- oder Vergleichskontexte.",
      ),
    );
  }
  if ((input.sourceModel?.factcheckQuestions.length ?? 0) > 0) {
    items.push(
      buildTag(
        "factcheck_needed",
        riskLabel("factcheck_needed"),
        "Offene Factcheck-Fragen müssen vor einem späteren Render- oder Publish-Handoff geprüft werden.",
      ),
    );
  }
  if (
    (input.sourceModel?.claimReviewNeeds.length ?? 0) > 0 ||
    input.outputModel?.copyRisks.some((item) => item.id === "overclaiming_risk")
  ) {
    items.push(
      buildTag(
        "overclaiming_risk",
        riskLabel("overclaiming_risk"),
        "Mindestens ein Claim ist noch nicht belastbar genug für ein glatt erzähltes Briefing.",
      ),
    );
  }
  if (
    input.outputModel?.copyRisks.some((item) => item.id === "public_misinterpretation_risk") ||
    (input.pollModel?.biasReviewNeeds.length ?? 0) > 0
  ) {
    items.push(
      buildTag(
        "public_misinterpretation_risk",
        riskLabel("public_misinterpretation_risk"),
        "Eine zu einfache Kurzfassung könnte den Debattenstand öffentlich missverständlich verkürzen.",
      ),
    );
  }
  if (
    input.outputModel?.copyRisks.some((item) => item.id === "minority_view_smoothing_risk") ||
    input.voxyDialog?.cards.some((card) => card.dialogueMode === "missing_perspectives")
  ) {
    items.push(
      buildTag(
        "minority_view_smoothing_risk",
        riskLabel("minority_view_smoothing_risk"),
        "Minderheiten-, Gegen- oder Betroffenenperspektiven dürfen im Script nicht geglättet werden.",
      ),
    );
  }
  if (
    input.sourceLanguage !== input.readingLanguage ||
    input.scriptLanguage !== input.sourceLanguage ||
    input.rtlDisplayHint ||
    input.outputModel?.copyRisks.some((item) => item.id === "translation_misread_risk")
  ) {
    items.push(
      buildTag(
        "translation_misread_risk",
        riskLabel("translation_misread_risk"),
        "Original, Lesefassung und Script-Sprache müssen getrennt geprüft bleiben.",
      ),
    );
  }
  if (
    input.outputModel?.copyRisks.some((item) => item.id === "channel_tone_risk") ||
    input.activationModel?.riskFlags.some(
      (item) => item.id === "public_misinterpretation_risk" || item.id === "low_context_input",
    )
  ) {
    items.push(
      buildTag(
        "tone_too_promotional",
        riskLabel("tone_too_promotional"),
        "Das Briefing darf nicht wie Werbung oder Kampagne klingen.",
      ),
    );
  }
  if (input.outputModel?.copyRisks.some((item) => item.id === "legal_policy_sensitivity")) {
    items.push(
      buildTag(
        "legal_policy_sensitivity",
        riskLabel("legal_policy_sensitivity"),
        "Der aktuelle Stand berührt sensible rechtliche oder politische Einordnungen.",
      ),
    );
  }
  if (
    input.outputModel?.copyRisks.some((item) => item.id === "vulnerable_group_impact") ||
    (input.sourceModel?.affectedGroupEvidenceNeeds.length ?? 0) > 0
  ) {
    items.push(
      buildTag(
        "vulnerable_group_impact",
        riskLabel("vulnerable_group_impact"),
        "Betroffenengruppen brauchen im Briefing eine besonders vorsichtige, faire Darstellung.",
      ),
    );
  }
  if (
    input.outputModel?.copyRisks.some((item) => item.id === "call_to_action_too_strong") ||
    input.activationModel?.blockers.some((item) =>
      normalizeText(item).toLowerCase().includes("aktiv"),
    )
  ) {
    items.push(
      buildTag(
        "call_to_action_too_strong",
        riskLabel("call_to_action_too_strong"),
        "Ein Mitmach- oder Poll-Aufruf darf den Review-Stand nicht wie eine fertige Aktivierung ausgeben.",
      ),
    );
  }

  return items;
}

function buildReadinessSignals(input: {
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  dossierModel: DossierWorkspaceDecisionModel | null;
  activationModel: ParticipationActivationReviewModel | null;
  pollModel: PollQuestionOptionsReviewModel | null;
  outputModel: OutputSocialWorkbenchModel | null;
  voxyDialog: V3VoxyCocreationDialogModel | null;
  voxyRenderJob: VoxyRenderJob | null;
  rtlDisplayHint: boolean;
}): ScriptTag<VoxyBriefingScriptReadinessSignal>[] {
  const items: ScriptTag<VoxyBriefingScriptReadinessSignal>[] = [];
  if (normalizeText(input.dossierModel?.thesis.label) || (input.dossierModel?.openQuestions.length ?? 0) > 0) {
    items.push(
      buildTag(
        "dossier_summary_available",
        readinessLabel("dossier_summary_available"),
        "These, offene Fragen oder Dossier-Kurzfassung sind als Ausgangspunkt sichtbar.",
      ),
    );
  }
  if (normalizeText(input.activationModel?.proposedParticipationQuestion)) {
    items.push(
      buildTag(
        "participation_question_available",
        readinessLabel("participation_question_available"),
        "Eine Beteiligungsfrage kann ins Script übernommen werden.",
      ),
    );
  }
  if (normalizeText(input.pollModel?.proposedQuestion)) {
    items.push(
      buildTag(
        "poll_question_available",
        readinessLabel("poll_question_available"),
        "Eine Poll-Frage ist als reviewpflichtiger Hinweis vorbereitet.",
      ),
    );
  }
  if ((input.sourceModel?.sourceNeeds.length ?? 0) > 0 || (input.sourceModel?.claimReviewNeeds.length ?? 0) > 0) {
    items.push(
      buildTag(
        "source_review_needed",
        readinessLabel("source_review_needed"),
        "Quellen- oder Claim-Prüfung ist noch offen.",
      ),
    );
  }
  if ((input.sourceModel?.factcheckQuestions.length ?? 0) > 0) {
    items.push(
      buildTag(
        "factcheck_needed",
        readinessLabel("factcheck_needed"),
        "Factcheck-Fragen sind vorbereitet, aber noch nicht beantwortet.",
      ),
    );
  }
  if (
    input.voxyDialog?.status === "needs_user_input" ||
    input.voxyDialog?.cards.some((card) => card.status === "needs_user_input")
  ) {
    items.push(
      buildTag(
        "human_input_needed",
        readinessLabel("human_input_needed"),
        "Vor dem Script-Freeze fehlen noch menschliche Ergänzungen oder Beispiele.",
      ),
    );
  }
  if ((input.outputModel?.copyRisks.length ?? 0) > 0) {
    items.push(
      buildTag(
        "output_review_needed",
        readinessLabel("output_review_needed"),
        "Copy-, Kanal- oder Veröffentlichungsrisiken aus dem Output-Workbench-Kontext bleiben offen.",
      ),
    );
  }
  if (
    input.sourceLanguage !== input.readingLanguage ||
    input.scriptLanguage !== input.sourceLanguage ||
    input.rtlDisplayHint
  ) {
    items.push(
      buildTag(
        "multilingual_review_needed",
        readinessLabel("multilingual_review_needed"),
        "Original, Lesefassung und Script-Sprache müssen sichtbar getrennt reviewed werden.",
      ),
    );
  }
  if (
    !input.voxyRenderJob ||
    input.voxyRenderJob.status === "blocked_by_provider" ||
    input.voxyRenderJob.status === "blocked_by_secret" ||
    input.voxyRenderJob.status === "blocked_by_runtime_truth"
  ) {
    items.push(
      buildTag(
        "render_provider_missing",
        readinessLabel("render_provider_missing"),
        "Es gibt bewusst keinen freigeschalteten Render- oder Providerpfad in diesem Slice.",
      ),
    );
  }
  return items;
}

function determineStatus(input: {
  enoughContext: boolean;
  humanInputNeeded: boolean;
  sourceReviewNeeded: boolean;
  factcheckNeeded: boolean;
  translationReviewNeeded: boolean;
  complianceNeeded: boolean;
  outputReviewNeeded: boolean;
  renderProviderBlocked: boolean;
  runtimeTruthMissing: boolean;
  missingReview: boolean;
}): VoxyBriefingScriptCandidateStatus {
  if (!input.enoughContext) return "readmodel_only";
  if (input.humanInputNeeded) return "needs_human_input";
  if (input.sourceReviewNeeded) return "needs_source_review";
  if (input.factcheckNeeded) return "needs_factcheck_review";
  if (input.translationReviewNeeded) return "needs_translation_review";
  if (input.complianceNeeded) return "needs_compliance_review";
  if (input.outputReviewNeeded) return "needs_editorial_review";
  if (input.runtimeTruthMissing) return "blocked_by_runtime_truth";
  if (input.missingReview) return "blocked_by_missing_review";
  if (input.renderProviderBlocked) return "blocked_by_provider";
  return "script_preview";
}

function determineNextDecision(input: {
  scriptFormat: VoxyBriefingScriptFormat;
  humanInputNeeded: boolean;
  sourceReviewNeeded: boolean;
  factcheckNeeded: boolean;
  translationReviewNeeded: boolean;
  outputReviewNeeded: boolean;
  renderBlocked: boolean;
  enoughContext: boolean;
  highRisk: boolean;
}): {
  id: VoxyBriefingScriptNextDecision;
  reason: string;
} {
  if (!input.enoughContext || input.scriptFormat === "keep_as_note") {
    return {
      id: "keep_internal",
      reason: "Ohne belastbaren Debatten- und Quellenkontext bleibt das Briefing intern als Notiz.",
    };
  }
  if (input.humanInputNeeded || input.highRisk) {
    return {
      id: "keep_internal",
      reason: "Vor einem späteren Render- oder Publish-Handoff sollte das Script intern bleiben und menschlich nachgeschärft werden.",
    };
  }
  if (input.sourceReviewNeeded) {
    return {
      id: "request_sources",
      reason: "Quellen, Vergleichsräume oder Gegenbelege müssen vor dem Script-Freeze geklärt werden.",
    };
  }
  if (input.factcheckNeeded || input.outputReviewNeeded) {
    return {
      id: "review_claims",
      reason: "Claims, Ton und Risiken müssen vor einer Weitergabe an Video- oder Publishing-Pfade geprüft werden.",
    };
  }
  if (input.translationReviewNeeded) {
    return {
      id: "translate_or_review_language",
      reason: "Original, Lesefassung und Script-Sprache brauchen ein explizites Sprachreview.",
    };
  }
  if (input.renderBlocked) {
    return {
      id: "prepare_render_handoff",
      reason: "Der Script-Kandidat ist anschlussfähig, aber Render-/Provider-Wahrheit fehlt weiterhin bewusst.",
    };
  }
  return {
    id: "refine_script",
    reason: "Der Script-Kandidat kann redaktionell weiter gestrafft werden, bleibt aber ein internes Review-Artefakt.",
  };
}

function estimateDurationSeconds(format: VoxyBriefingScriptFormat, segmentCount: number): number {
  const base =
    format === "poll_explainer"
      ? 40
      : format === "participation_invitation"
        ? 45
        : format === "multilingual_bridge_note"
          ? 45
          : format === "source_review_prompt"
            ? 50
            : format === "counterposition_explainer"
              ? 55
              : format === "desk_update"
                ? 60
                : format === "dossier_summary"
                  ? 70
                  : format === "keep_as_note"
                    ? 30
                    : 50;
  return Math.max(base, segmentCount * 8);
}

function mapSegmentRisks(
  kind: VoxyBriefingScriptSegmentKind,
  riskIds: VoxyBriefingScriptRisk[],
): string[] {
  if (kind === "source_status") {
    return riskIds
      .filter((risk) => risk === "missing_source_context" || risk === "factcheck_needed")
      .map((risk) => riskLabel(risk));
  }
  if (kind === "counterposition") {
    return riskIds
      .filter((risk) => risk === "minority_view_smoothing_risk" || risk === "public_misinterpretation_risk")
      .map((risk) => riskLabel(risk));
  }
  if (kind === "participation_prompt" || kind === "poll_prompt") {
    return riskIds
      .filter((risk) => risk === "call_to_action_too_strong" || risk === "tone_too_promotional")
      .map((risk) => riskLabel(risk));
  }
  if (kind === "review_disclaimer") {
    return riskIds
      .filter(
        (risk) =>
          risk === "translation_misread_risk" ||
          risk === "legal_policy_sensitivity" ||
          risk === "vulnerable_group_impact",
      )
      .map((risk) => riskLabel(risk));
  }
  return riskIds
    .filter((risk) => risk === "overclaiming_risk" || risk === "public_misinterpretation_risk")
    .map((risk) => riskLabel(risk));
}

function buildSegment(
  kind: VoxyBriefingScriptSegmentKind,
  body: string | null,
  riskIds: VoxyBriefingScriptRisk[],
): VoxyBriefingScriptSegmentDraft | null {
  const normalized = normalizeText(body);
  if (!normalized) return null;
  return {
    id: kind,
    kind,
    label: segmentLabel(kind),
    body: normalized,
    reviewRequired: true,
    risks: mapSegmentRisks(kind, riskIds),
  };
}

function buildModelFromSignals(input: BuildSignalsInput): VoxyBriefingScriptCandidateModel {
  const sourceLanguage = resolveCreateLanguageContext({
    sourceLanguage: input.sourceLanguage,
    contentLanguage: input.readingLanguage,
    uiLocale: input.readingLanguage,
  }).sourceLanguage;
  const readingLanguage = resolveCreateLanguageContext({
    sourceLanguage,
    contentLanguage: input.readingLanguage,
    uiLocale: input.readingLanguage,
  }).contentLanguage;
  const scriptLanguage = resolveCreateLanguageContext({
    sourceLanguage,
    contentLanguage: input.scriptLanguage,
    uiLocale: input.scriptLanguage,
  }).contentLanguage;
  const rtlDisplayHint =
    input.rtlDisplayHint ||
    usesCanonicalRtlLayout(sourceLanguage) ||
    usesCanonicalRtlLayout(readingLanguage) ||
    usesCanonicalRtlLayout(scriptLanguage);
  const scriptFormat = buildScriptFormat({
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    sourceModel: input.sourceModel,
    dossierModel: input.dossierModel,
    activationModel: input.activationModel,
    pollModel: input.pollModel,
    outputModel: input.outputModel,
    voxyDialog: input.voxyDialog,
  });
  const scriptRisks = buildScriptRisks({
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    sourceModel: input.sourceModel,
    dossierModel: input.dossierModel,
    activationModel: input.activationModel,
    pollModel: input.pollModel,
    outputModel: input.outputModel,
    voxyDialog: input.voxyDialog,
    rtlDisplayHint,
  });
  const riskIds = scriptRisks.map((risk) => risk.id);
  const readinessSignals = buildReadinessSignals({
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    sourceModel: input.sourceModel,
    dossierModel: input.dossierModel,
    activationModel: input.activationModel,
    pollModel: input.pollModel,
    outputModel: input.outputModel,
    voxyDialog: input.voxyDialog,
    voxyRenderJob: input.voxyRenderJob,
    rtlDisplayHint,
  });
  const thesisText =
    input.dossierModel?.thesis.confidence === "missing"
      ? null
      : normalizeText(input.dossierModel?.thesis.label);
  const counterpositionText =
    input.dossierModel?.counterposition.status === "missing"
      ? null
      : normalizeText(input.dossierModel?.counterposition.summary);
  const openQuestions = uniqueStrings([
    ...(input.dossierModel?.openQuestions ?? []),
    ...(input.sourceModel?.factcheckQuestions.map((question) => question.question) ?? []),
  ]).slice(0, 3);
  const outputDraft = findOutputDraft(input.outputModel, [
    scriptFormat,
    "short_briefing",
    "dossier_summary",
  ]);
  const sourceReviewNeeded = readinessSignals.some((item) => item.id === "source_review_needed");
  const factcheckNeeded = readinessSignals.some((item) => item.id === "factcheck_needed");
  const humanInputNeeded = readinessSignals.some((item) => item.id === "human_input_needed");
  const translationReviewNeeded = readinessSignals.some(
    (item) => item.id === "multilingual_review_needed",
  );
  const outputReviewNeeded = readinessSignals.some((item) => item.id === "output_review_needed");
  const complianceNeeded = scriptRisks.some(
    (risk) =>
      risk.id === "legal_policy_sensitivity" || risk.id === "vulnerable_group_impact",
  );
  const enoughContext = Boolean(
    thesisText ||
      outputDraft?.body ||
      openQuestions.length > 0 ||
      normalizeText(input.activationModel?.proposedParticipationQuestion) ||
      normalizeText(input.pollModel?.proposedQuestion),
  );
  const renderProviderBlocked =
    input.voxyRenderJob?.status === "blocked_by_provider" ||
    input.voxyRenderJob?.status === "blocked_by_secret";
  const runtimeTruthMissing =
    (!input.voxyBriefing && !input.outputModel?.draftItems.some((item) => item.format === "voxy_briefing_note")) ||
    input.voxyRenderJob?.status === "blocked_by_runtime_truth";
  const missingReview =
    input.voxyBriefing?.preparationStatus === "review_ready" &&
    input.voxyScriptSegments.length === 0;
  const highRisk = scriptRisks.length >= 4;

  const nextDecision = determineNextDecision({
    scriptFormat,
    humanInputNeeded,
    sourceReviewNeeded,
    factcheckNeeded,
    translationReviewNeeded,
    outputReviewNeeded,
    renderBlocked:
      renderProviderBlocked ||
      readinessSignals.some((item) => item.id === "render_provider_missing"),
    enoughContext,
    highRisk,
  });

  const scriptStatus = determineStatus({
    enoughContext,
    humanInputNeeded,
    sourceReviewNeeded,
    factcheckNeeded,
    translationReviewNeeded,
    complianceNeeded,
    outputReviewNeeded,
    renderProviderBlocked:
      nextDecision.id === "prepare_render_handoff" && renderProviderBlocked,
    runtimeTruthMissing:
      nextDecision.id === "prepare_render_handoff" && Boolean(runtimeTruthMissing),
    missingReview,
  });

  const titleSeed =
    normalizeText(input.voxyBriefing?.title) ||
    normalizeText(outputDraft?.title) ||
    normalizeText(input.dossierRef?.title) ||
    normalizeText(input.contributionRef?.title) ||
    "Voxy-Briefing-Kandidat";
  const title = titleSeed.includes("Voxy")
    ? titleSeed
    : `${titleSeed} · Voxy-Briefing`;
  const intro =
    firstSentence(outputDraft?.body) ||
    firstSentence(input.voxyBriefing?.summary) ||
    (thesisText
      ? `Voxy erklärt den aktuellen Debattenstand zu ${thesisText} fair, knapp und anschlussfähig.`
      : "Voxy erklärt den aktuellen Debattenstand knapp, fair und review-first.");
  const contextBody =
    outputDraft?.body ||
    (thesisText
      ? `Im aktuellen Arbeitsstand verdichtet sich die Debatte auf ${thesisText}.`
      : null);
  const counterpositionBody = counterpositionText
    ? `Gegenposition oder Ergänzung: ${counterpositionText}`
    : sourceReviewNeeded || factcheckNeeded
      ? "Eine belastbare Gegenposition oder Ergänzung muss vor einem öffentlichen Briefing noch geprüft werden."
      : null;
  const sourceStatusBody =
    sourceReviewNeeded || factcheckNeeded
      ? uniqueStrings([
          (input.sourceModel?.sourceNeeds[0]?.reason ?? null),
          (input.sourceModel?.factcheckQuestions[0]?.reason ?? null),
          "Quellenbedarf und Factcheck-Fragen bleiben offen; es wird keine geprüfte Wahrheit behauptet.",
        ]).join(" ")
      : "Der Script-Kandidat bleibt review-first und erfindet weder Quellen noch Factcheck-Ergebnisse.";
  const participationPromptBody = normalizeText(input.activationModel?.proposedParticipationQuestion)
    ? `Mögliche Beteiligungsfrage: ${normalizeText(input.activationModel?.proposedParticipationQuestion)}`
    : null;
  const pollPromptBody = normalizeText(input.pollModel?.proposedQuestion)
    ? `Möglicher Poll-Hinweis: ${normalizeText(input.pollModel?.proposedQuestion)}`
    : null;
  const reviewDisclaimerBody = uniqueStrings([
    "Dies ist ein Script-Kandidat, kein Video und kein Rendering.",
    "Original, Lesefassung und Script-Sprache bleiben getrennt; Übersetzung ist kein Beleg.",
    rtlDisplayHint ? "RTL- und cross-lingual Fälle brauchen einen sichtbaren Review-Hinweis." : null,
    renderProviderBlocked || runtimeTruthMissing
      ? "Render-, Provider- und Publishing-Runtime bleiben bewusst blockiert oder unbelegt."
      : null,
  ]).join(" ");
  const closingBody =
    scriptFormat === "participation_invitation" || scriptFormat === "poll_explainer"
      ? "Vor einem späteren Video- oder Veröffentlichungsweg müssen Frage, Ton und Review-Gates menschlich bestätigt werden."
      : "Nächster Schritt bleibt menschliches Review, nicht Rendering oder Veröffentlichung.";

  const segments = [
    buildSegment(
      "hook",
      intro,
      riskIds,
    ),
    buildSegment(
      "context",
      contextBody,
      riskIds,
    ),
    buildSegment(
      "thesis",
      thesisText ? `Kernthese: ${thesisText}` : null,
      riskIds,
    ),
    buildSegment(
      "counterposition",
      counterpositionBody,
      riskIds,
    ),
    buildSegment(
      "open_questions",
      openQuestions.length > 0
        ? `Offen bleibt vor allem: ${openQuestions.join(" · ")}`
        : null,
      riskIds,
    ),
    buildSegment(
      "source_status",
      sourceStatusBody,
      riskIds,
    ),
    buildSegment(
      "participation_prompt",
      participationPromptBody,
      riskIds,
    ),
    buildSegment(
      "poll_prompt",
      pollPromptBody,
      riskIds,
    ),
    buildSegment(
      "review_disclaimer",
      reviewDisclaimerBody,
      riskIds,
    ),
    buildSegment(
      "closing",
      closingBody,
      riskIds,
    ),
  ].filter((segment): segment is VoxyBriefingScriptSegmentDraft => Boolean(segment));

  const publicSafeLabel =
    scriptFormat === "keep_as_note" || humanInputNeeded
      ? "Interner Script-Kandidat, noch kein Video"
      : "Script-Kandidat, noch kein Video";

  const downstreamReadiness: VoxyBriefingScriptDownstreamItem[] = [
    {
      id: "scriptReview",
      label: downstreamLabel("scriptReview"),
      status:
        scriptStatus === "script_preview" ? "needs_review" : enoughContext ? "needs_review" : "blocked",
      statusLabel: downstreamStatusLabel(
        scriptStatus === "script_preview" ? "needs_review" : enoughContext ? "needs_review" : "blocked",
      ),
      reason:
        scriptStatus === "readmodel_only"
          ? "Ohne belastbaren Arbeitsstand bleibt das Script nur als interne Notiz sichtbar."
          : "Ein menschliches Script-Review bleibt verpflichtend, bevor weitere Folgeschritte denkbar sind.",
      reviewRequired: true,
    },
    {
      id: "render",
      label: downstreamLabel("render"),
      status:
        nextDecision.id === "prepare_render_handoff" && !renderProviderBlocked && !runtimeTruthMissing
          ? "prepared"
          : nextDecision.id === "prepare_render_handoff"
            ? "blocked"
            : "blocked",
      statusLabel: downstreamStatusLabel(
        nextDecision.id === "prepare_render_handoff" && !renderProviderBlocked && !runtimeTruthMissing
          ? "prepared"
          : "blocked",
      ),
      reason:
        nextDecision.id === "prepare_render_handoff"
          ? renderProviderBlocked
            ? "Render-Handoff bleibt ehrlich durch fehlende Provider- oder Secret-Wahrheit blockiert."
            : runtimeTruthMissing
              ? "Render-Handoff bleibt durch fehlende Runtime-Wahrheit blockiert."
              : "Das Script wäre später für einen Render-Handoff strukturiert anschlussfähig."
          : "Dieser Slice erzeugt bewusst kein Rendering und keinen Providerlauf.",
      reviewRequired: true,
    },
    {
      id: "social",
      label: downstreamLabel("social"),
      status:
        input.outputModel?.channelCandidates.some((item) => item.id === "voxy_video_briefing" || item.id === "linkedin")
          ? "needs_review"
          : "blocked",
      statusLabel: downstreamStatusLabel(
        input.outputModel?.channelCandidates.some((item) => item.id === "voxy_video_briefing" || item.id === "linkedin")
          ? "needs_review"
          : "blocked",
      ),
      reason:
        input.outputModel?.channelCandidates.length
          ? "Mögliche Social- oder Share-Pfade bleiben review-gated und ungepostet."
          : "Ohne belastbaren Output-Handoff bleibt der Social-Pfad blockiert.",
      reviewRequired: true,
    },
    {
      id: "publishing",
      label: downstreamLabel("publishing"),
      status:
        input.outputModel?.downstreamReadiness.some((item) => item.id === "publicDossier")
          ? "needs_review"
          : "blocked",
      statusLabel: downstreamStatusLabel(
        input.outputModel?.downstreamReadiness.some((item) => item.id === "publicDossier")
          ? "needs_review"
          : "blocked",
      ),
      reason:
        input.outputModel?.downstreamReadiness.some((item) => item.id === "publicDossier")
          ? "Publishing bleibt getrennt review-gated; `publish_ready` ist nicht `published`."
          : "Es gibt bewusst keinen Publishing-Schritt aus diesem Script-Layer.",
      reviewRequired: true,
    },
    {
      id: "archive",
      label: downstreamLabel("archive"),
      status: enoughContext ? "prepared" : "needs_review",
      statusLabel: downstreamStatusLabel(enoughContext ? "prepared" : "needs_review"),
      reason:
        enoughContext
          ? "Der Script-Kandidat kann intern dokumentiert und später wieder aufgegriffen werden."
          : "Vor einer Archiv-/Dokupflege sollte der Arbeitsstand erst menschlich ergänzt werden.",
      reviewRequired: true,
    },
  ];

  return {
    title: "Voxy-Briefing vorbereiten",
    summary:
      "Aus Debattenstand, Quellenbedarf, Beteiligungsformat, Poll-Kandidat und Output-Hinweisen entsteht ein review-first Script-Kandidat. Er bleibt intern, mehrsprachig nachvollziehbar und nicht gerendert.",
    surface: input.surface,
    contributionRef: input.contributionRef ?? null,
    dossierRef: input.dossierRef ?? null,
    participationRef: input.participationRef ?? null,
    pollRef: input.pollRef ?? null,
    outputRef: input.outputRef ?? null,
    sourceLanguage,
    readingLanguage,
    scriptLanguage,
    languageLabel: `Original: ${languageName(sourceLanguage)} · Lesefassung: ${languageName(readingLanguage)} · Script: ${languageName(scriptLanguage)}${rtlDisplayHint ? " · RTL-Hinweis aktiv" : ""}`,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDisplayHint,
    scriptStatus,
    scriptStatusLabel: scriptStatusLabel(scriptStatus),
    scriptFormat,
    scriptFormatLabel: scriptFormatLabel(scriptFormat),
    scriptSegments: segments,
    scriptDraft: {
      title,
      intro,
      segments,
      estimatedDurationSeconds: estimateDurationSeconds(scriptFormat, segments.length),
      publicSafeLabel,
    },
    scriptRisks,
    readinessSignals,
    downstreamReadiness,
    nextScriptDecision: {
      id: nextDecision.id,
      label: nextDecisionLabel(nextDecision.id),
      reason: nextDecision.reason,
    },
    publicSafeLabel,
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    reviewRequired: true,
    noRenderAction: true,
    noPublishAction: true,
    noSocialPostAction: true,
    noRuntimeClaim: true,
  };
}

function buildSegmentInputFromDialog(
  dialog: V3VoxyCocreationDialogModel | null,
): {
  sourceLanguage: string;
  readingLanguage: string;
  scriptLanguage: string;
  rtlDisplayHint: boolean;
} {
  const sourceLanguage = dialog?.sourceLanguage ?? "de";
  const readingLanguage = dialog?.readingLanguage ?? sourceLanguage;
  return {
    sourceLanguage,
    readingLanguage,
    scriptLanguage: readingLanguage,
    rtlDisplayHint: Boolean(dialog?.rtl),
  };
}

export function buildVoxyVideoSegmentsFromScriptCandidate(params: {
  model: VoxyBriefingScriptCandidateModel | null;
  briefingId: string;
}) {
  if (!params.model) return [];
  const mapped = params.model.scriptSegments
    .map((segment) => {
      let kind: VoxyScriptSegmentKind = "call_to_action";
      if (segment.kind === "hook") kind = "intro";
      else if (segment.kind === "context" || segment.kind === "source_status") kind = "context";
      else if (segment.kind === "thesis") kind = "claim";
      else if (segment.kind === "counterposition") kind = "counter_position";
      else if (segment.kind === "open_questions") kind = "open_question";
      return {
        kind,
        text: segment.body,
      };
    })
    .slice(0, 8);

  return buildVoxyScriptSegments({
    briefingId: params.briefingId,
    segments: mapped,
  });
}

export function buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
) {
  if (!model.hasPreview || !model.voxyCocreationDialog) return null;

  const sourceModel = buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview(model);
  const dossierModel = buildDossierWorkspaceDecisionFromCreateCandidatePreview(model);
  const activationModel = buildParticipationActivationReviewFromCreateCandidatePreview(model);
  const pollModel = buildPollQuestionOptionsReviewFromCreateCandidatePreview(model);
  const outputModel = buildOutputSocialWorkbenchFromCreateCandidatePreview(model);
  const languageInput = buildSegmentInputFromDialog(model.voxyCocreationDialog);

  return buildModelFromSignals({
    surface: "create",
    contributionRef: {
      id: model.reviewHandoff.items[0]?.candidateId ?? model.title,
      title: model.title,
      href: null,
    },
    sourceModel,
    dossierModel,
    activationModel,
    pollModel,
    outputModel,
    voxyDialog: model.voxyCocreationDialog,
    voxyBriefing: null,
    voxyScriptSegments: [],
    voxyRenderJob: null,
    userVisibleReason:
      "Dieser Voxy-Block bereitet nur ein Script vor. Es wird weder gerendert noch veröffentlicht.",
    reviewerVisibleReason:
      "Create zeigt nur einen preview-only Script-Kandidaten aus bestehenden Readmodels; Render-, Provider- und Publishing-Wahrheit fehlen bewusst.",
    nextStep: "Script-Struktur prüfen und offene Reviews klären",
    ...languageInput,
  });
}

export function buildVoxyBriefingScriptCandidateFromReviewContext(
  context: V3ReviewQueueWiringContext,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: ScriptRef | null;
    dossierRef?: ScriptRef | null;
    participationRef?: ScriptRef | null;
    pollRef?: ScriptRef | null;
    outputRef?: ScriptRef | null;
  },
) {
  const voxyDialog = buildVoxyCocreationDialogFromReviewContext(context, {
    contributionRef: options?.contributionRef ?? options?.dossierRef ?? null,
    surface: options?.audience === "admin" ? "admin" : "workspace",
    maxCards: 4,
  });
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
  });
  const dossierModel = buildDossierWorkspaceDecisionFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const activationModel = buildParticipationActivationReviewFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const pollModel = buildPollQuestionOptionsReviewFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const outputModel = buildOutputSocialWorkbenchFromReviewContext(context, {
    audience: options?.audience ?? "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const languageInput = buildSegmentInputFromDialog(voxyDialog);

  return buildModelFromSignals({
    surface: options?.audience === "admin" ? "admin" : "workspace",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    participationRef: options?.participationRef ?? null,
    pollRef: options?.pollRef ?? null,
    outputRef: options?.outputRef ?? null,
    sourceModel,
    dossierModel,
    activationModel,
    pollModel,
    outputModel,
    voxyDialog,
    voxyBriefing: context.voxyBriefing,
    voxyScriptSegments: context.voxyScriptSegments,
    voxyRenderJob: context.voxyRenderJob,
    userVisibleReason:
      "Der Script-Kandidat bleibt intern, trennt Sprache und Evidenz sauber und startet weder Rendern noch Veröffentlichung.",
    reviewerVisibleReason:
      "Bestehender V3-Review-Kontext speist nur einen additiven Script-Layer; voxy render/publish bleiben review-gated und nicht ausgeführt.",
    nextStep: "Script-Kandidat prüfen und Render-/Publish-Blocker ehrlich sichtbar halten",
    ...languageInput,
  });
}

export function buildVoxyBriefingScriptCandidateFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null,
  options?: {
    contributionRef?: ScriptRef | null;
    dossierRef?: ScriptRef | null;
    participationRef?: ScriptRef | null;
    pollRef?: ScriptRef | null;
    outputRef?: ScriptRef | null;
    nextStep?: string;
  },
) {
  if (!dialog) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromVoxyDialog(dialog, {
    surface: "account",
    nextStep: options?.nextStep ?? "Beitrag weiter schärfen",
    userVisibleReason:
      "Im Account bleibt dies ein vorbereiteter Quellen- und Faktencheck-Arbeitsstand.",
    reviewerVisibleReason:
      "Lokale oder resume-fähige Beiträge zeigen nur review-first Quellenbedarf ohne Providerlauf.",
    runtimeTruthMissing: true,
  });
  const dossierModel = buildDossierWorkspaceDecisionFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef ?? null,
    surface: "account",
    nextStep: options?.nextStep ?? "Beitrag weiter schärfen",
  });
  const activationModel = buildParticipationActivationReviewFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Beitrag weiter schärfen",
  });
  const pollModel = buildPollQuestionOptionsReviewFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Beitrag weiter schärfen",
  });
  const outputModel = buildOutputSocialWorkbenchFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef ?? null,
    nextStep: options?.nextStep ?? "Beitrag weiter schärfen",
  });
  const languageInput = buildSegmentInputFromDialog(dialog);

  return buildModelFromSignals({
    surface: "account",
    contributionRef: options?.contributionRef ?? dialog.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    participationRef: options?.participationRef ?? null,
    pollRef: options?.pollRef ?? null,
    outputRef: options?.outputRef ?? null,
    sourceModel,
    dossierModel,
    activationModel,
    pollModel,
    outputModel,
    voxyDialog: dialog,
    voxyBriefing: null,
    voxyScriptSegments: [],
    voxyRenderJob: null,
    userVisibleReason:
      "Das Script bleibt im Account ein interner Arbeitsstand. Nichts wird gerendert, gepostet oder veröffentlicht.",
    reviewerVisibleReason:
      "Lokale oder servergesicherte Resume-Drafts speisen nur einen readmodel-only Script-Kandidaten ohne Provider- oder Runtime-Wahrheit.",
    nextStep: options?.nextStep ?? "Beitrag weiter schärfen",
    ...languageInput,
  });
}

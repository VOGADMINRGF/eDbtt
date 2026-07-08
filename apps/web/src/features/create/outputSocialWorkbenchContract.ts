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
  DossierSocialOutputDraft,
  DossierSocialOutputDraftKind,
} from "@/features/create/dossierSocialOutputDraftContract";
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
import type { VoxyVideoBriefing } from "@/features/voxyVideo";

export const OUTPUT_SOCIAL_WORKBENCH_STATUSES = [
  "readmodel_only",
  "output_preview",
  "needs_editorial_review",
  "needs_source_review",
  "needs_factcheck_review",
  "needs_human_input",
  "needs_scope_decision",
  "needs_channel_review",
  "needs_translation_review",
  "needs_compliance_review",
  "blocked_by_runtime_truth",
  "blocked_by_missing_review",
  "blocked_by_provider",
] as const;

export type OutputSocialWorkbenchStatus =
  (typeof OUTPUT_SOCIAL_WORKBENCH_STATUSES)[number];

export const OUTPUT_SOCIAL_WORKBENCH_FORMATS = [
  "debate_status_summary",
  "participation_invitation",
  "neutral_brief",
  "social_post_draft",
  "share_snippet",
  "newsletter_teaser",
  "admin_review_note",
  "stakeholder_invitation",
  "poll_invitation",
  "voxy_briefing_note",
  "keep_internal_draft",
] as const;

export type OutputSocialWorkbenchFormat =
  (typeof OUTPUT_SOCIAL_WORKBENCH_FORMATS)[number];

export const OUTPUT_SOCIAL_WORKBENCH_CHANNELS = [
  "internal_review",
  "dossier_workspace",
  "participation_room",
  "website_preview",
  "linkedin",
  "x_twitter",
  "instagram",
  "facebook",
  "newsletter",
  "whatsapp_share",
  "press_note",
  "voxy_video_briefing",
] as const;

export type OutputSocialWorkbenchChannel =
  (typeof OUTPUT_SOCIAL_WORKBENCH_CHANNELS)[number];

export const OUTPUT_SOCIAL_COPY_RISKS = [
  "missing_source_context",
  "factcheck_needed",
  "overclaiming_risk",
  "public_misinterpretation_risk",
  "minority_view_smoothing_risk",
  "translation_misread_risk",
  "channel_tone_risk",
  "legal_policy_sensitivity",
  "vulnerable_group_impact",
  "call_to_action_too_strong",
] as const;

export type OutputSocialCopyRisk =
  (typeof OUTPUT_SOCIAL_COPY_RISKS)[number];

export const OUTPUT_SOCIAL_READINESS_SIGNALS = [
  "dossier_summary_available",
  "participation_question_available",
  "poll_question_available",
  "source_review_needed",
  "factcheck_needed",
  "human_input_needed",
  "activation_review_needed",
  "poll_review_needed",
  "multilingual_review_needed",
  "voxy_script_needed",
] as const;

export type OutputSocialReadinessSignal =
  (typeof OUTPUT_SOCIAL_READINESS_SIGNALS)[number];

export const OUTPUT_SOCIAL_DOWNSTREAM_TARGETS = [
  "publicDossier",
  "participationRoom",
  "poll",
  "social",
  "newsletter",
  "press",
  "voxyBriefing",
] as const;

export type OutputSocialDownstreamTarget =
  (typeof OUTPUT_SOCIAL_DOWNSTREAM_TARGETS)[number];

export const OUTPUT_SOCIAL_DOWNSTREAM_STATUSES = [
  "blocked",
  "needs_review",
  "prepared",
] as const;

export type OutputSocialDownstreamStatus =
  (typeof OUTPUT_SOCIAL_DOWNSTREAM_STATUSES)[number];

export const OUTPUT_SOCIAL_NEXT_DECISIONS = [
  "refine_summary",
  "request_sources",
  "review_claims",
  "choose_channel",
  "translate_or_review_language",
  "prepare_invitation_copy",
  "prepare_social_draft",
  "prepare_voxy_script",
  "keep_internal",
  "blocked",
] as const;

export type OutputSocialNextDecision =
  (typeof OUTPUT_SOCIAL_NEXT_DECISIONS)[number];

type OutputSurface = "create" | "account" | "admin" | "workspace";

type OutputRef = {
  id: string;
  title: string;
  href?: string | null;
};

type OutputTag<T extends string> = {
  id: T;
  label: string;
  reason: string;
};

export type OutputSocialDraftItem = {
  id: string;
  format: OutputSocialWorkbenchFormat;
  formatLabel: string;
  channel: OutputSocialWorkbenchChannel | null;
  channelLabel: string | null;
  title: string;
  body: string;
  reviewRequired: true;
  publicSafeLabel: string;
  risks: string[];
  blockers: string[];
};

export type OutputSocialDownstreamItem = {
  id: OutputSocialDownstreamTarget;
  label: string;
  status: OutputSocialDownstreamStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type OutputSocialWorkbenchModel = {
  title: string;
  summary: string;
  surface: OutputSurface;
  contributionRef: OutputRef | null;
  dossierRef: OutputRef | null;
  participationRef: OutputRef | null;
  pollRef: OutputRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  outputLanguage: string;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlDisplayHint: boolean;
  outputStatus: OutputSocialWorkbenchStatus;
  outputStatusLabel: string;
  outputFormats: OutputSocialWorkbenchFormat[];
  outputFormatLabels: string[];
  channelCandidates: OutputTag<OutputSocialWorkbenchChannel>[];
  draftItems: OutputSocialDraftItem[];
  copyRisks: OutputTag<OutputSocialCopyRisk>[];
  readinessSignals: OutputTag<OutputSocialReadinessSignal>[];
  downstreamReadiness: OutputSocialDownstreamItem[];
  nextOutputDecision: {
    id: OutputSocialNextDecision;
    label: string;
    reason: string;
  };
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  reviewRequired: true;
  noPublishAction: true;
  noSocialPostAction: true;
  noScheduleAction: true;
  noRuntimeClaim: true;
};

type BuildSignalsInput = {
  surface: OutputSurface;
  contributionRef?: OutputRef | null;
  dossierRef?: OutputRef | null;
  participationRef?: OutputRef | null;
  pollRef?: OutputRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  outputLanguage: string;
  rtlDisplayHint: boolean;
  translationAvailable: boolean;
  summarySeed: string | null;
  headlineSeed: string | null;
  texts: string[];
  socialOutputDrafts: DossierSocialOutputDraft[];
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  dossierModel: DossierWorkspaceDecisionModel | null;
  activationModel: ParticipationActivationReviewModel | null;
  pollModel: PollQuestionOptionsReviewModel | null;
  voxyDialog: V3VoxyCocreationDialogModel | null;
  voxyBriefing: VoxyVideoBriefing | null;
  runtimeTruthMissing: boolean;
  providerBlocked: boolean;
  missingReview: boolean;
  nextStep: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean)),
  );
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

function outputStatusLabel(value: OutputSocialWorkbenchStatus): string {
  if (value === "output_preview") return "Output-Vorschau";
  if (value === "needs_editorial_review") return "Redaktionelle Prüfung offen";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Factcheck-Fragen offen";
  if (value === "needs_human_input") return "Menschliche Ergänzung offen";
  if (value === "needs_scope_decision") return "Scope-Entscheidung offen";
  if (value === "needs_channel_review") return "Kanalprüfung offen";
  if (value === "needs_translation_review") return "Sprachprüfung offen";
  if (value === "needs_compliance_review") return "Compliance-Prüfung offen";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  if (value === "blocked_by_missing_review") return "Review fehlt";
  if (value === "blocked_by_provider") return "Provider blockiert";
  return "Nur Readmodel";
}

function formatLabel(value: OutputSocialWorkbenchFormat): string {
  if (value === "debate_status_summary") return "Debattenstand-Kurzfassung";
  if (value === "participation_invitation") return "Beteiligungseinladung";
  if (value === "neutral_brief") return "Neutraler Kurzbrief";
  if (value === "social_post_draft") return "Social Draft";
  if (value === "share_snippet") return "Share Copy";
  if (value === "newsletter_teaser") return "Newsletter-Teaser";
  if (value === "admin_review_note") return "Review-Notiz";
  if (value === "stakeholder_invitation") return "Stakeholder-Einladung";
  if (value === "poll_invitation") return "Poll-Einladung";
  if (value === "voxy_briefing_note") return "Voxy-Briefing-Hinweis";
  return "Interner Arbeitsstand";
}

function channelLabel(value: OutputSocialWorkbenchChannel): string {
  if (value === "internal_review") return "Interne Prüfung";
  if (value === "dossier_workspace") return "Dossier-Workspace";
  if (value === "participation_room") return "Beteiligungsraum";
  if (value === "website_preview") return "Website-Vorschau";
  if (value === "linkedin") return "LinkedIn";
  if (value === "x_twitter") return "X / Twitter";
  if (value === "instagram") return "Instagram";
  if (value === "facebook") return "Facebook";
  if (value === "newsletter") return "Newsletter";
  if (value === "whatsapp_share") return "WhatsApp-Share";
  if (value === "press_note") return "Pressehinweis";
  return "Voxy-Video-Briefing";
}

function copyRiskLabel(value: OutputSocialCopyRisk): string {
  if (value === "missing_source_context") return "Quellenkontext fehlt";
  if (value === "factcheck_needed") return "Factcheck offen";
  if (value === "overclaiming_risk") return "Überzeichnungsrisiko";
  if (value === "public_misinterpretation_risk") return "Öffentliches Missverständnis möglich";
  if (value === "minority_view_smoothing_risk") return "Minderheitenperspektive könnte geglättet werden";
  if (value === "translation_misread_risk") return "Übersetzungsrisiko";
  if (value === "channel_tone_risk") return "Kanalton prüfen";
  if (value === "legal_policy_sensitivity") return "Rechts-/Policy-Sensitivität";
  if (value === "vulnerable_group_impact") return "Betroffene Gruppen besonders prüfen";
  return "Call to Action prüfen";
}

function readinessSignalLabel(value: OutputSocialReadinessSignal): string {
  if (value === "dossier_summary_available") return "Kurzfassung sichtbar";
  if (value === "participation_question_available") return "Beteiligungsfrage sichtbar";
  if (value === "poll_question_available") return "Poll-Frage sichtbar";
  if (value === "source_review_needed") return "Quellenprüfung offen";
  if (value === "factcheck_needed") return "Factcheck offen";
  if (value === "human_input_needed") return "Menschliche Ergänzung offen";
  if (value === "activation_review_needed") return "Aktivierungsreview offen";
  if (value === "poll_review_needed") return "Poll-Review offen";
  if (value === "multilingual_review_needed") return "Mehrsprachiges Review nötig";
  return "Voxy-Skriptbedarf sichtbar";
}

function downstreamTargetLabel(value: OutputSocialDownstreamTarget): string {
  if (value === "publicDossier") return "Public Dossier";
  if (value === "participationRoom") return "Participation Room";
  if (value === "poll") return "Poll";
  if (value === "social") return "Social";
  if (value === "newsletter") return "Newsletter";
  if (value === "press") return "Presse";
  return "Voxy Briefing";
}

function downstreamStatusLabel(value: OutputSocialDownstreamStatus): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_review") return "Review offen";
  return "Blockiert";
}

function nextDecisionLabel(value: OutputSocialNextDecision): string {
  if (value === "refine_summary") return "Kurzfassung nachschärfen";
  if (value === "request_sources") return "Quellen anfordern";
  if (value === "review_claims") return "Claims prüfen";
  if (value === "choose_channel") return "Kanal prüfen";
  if (value === "translate_or_review_language") return "Sprachfassung prüfen";
  if (value === "prepare_invitation_copy") return "Einladungstext vorbereiten";
  if (value === "prepare_social_draft") return "Social Draft vorbereiten";
  if (value === "prepare_voxy_script") return "Voxy-Hinweis weiterführen";
  if (value === "keep_internal") return "Internen Arbeitsstand behalten";
  return "Blockiert";
}

function kindToFormat(kind: DossierSocialOutputDraftKind): OutputSocialWorkbenchFormat {
  if (kind === "website_update_draft") return "debate_status_summary";
  if (kind === "newsletter_draft") return "newsletter_teaser";
  if (kind === "linkedin_draft") return "social_post_draft";
  if (kind === "carousel_draft") return "share_snippet";
  if (kind === "short_video_script_draft") return "voxy_briefing_note";
  return "neutral_brief";
}

function kindToChannel(kind: DossierSocialOutputDraftKind): OutputSocialWorkbenchChannel {
  if (kind === "website_update_draft") return "website_preview";
  if (kind === "newsletter_draft") return "newsletter";
  if (kind === "linkedin_draft") return "linkedin";
  if (kind === "carousel_draft") return "instagram";
  if (kind === "short_video_script_draft") return "voxy_video_briefing";
  return "press_note";
}

function pushTag<T extends string>(
  target: OutputTag<T>[],
  id: T,
  label: string,
  reason: string,
) {
  if (target.some((item) => item.id === id)) return;
  target.push({ id, label, reason });
}

function buildDraftItem(input: {
  id: string;
  format: OutputSocialWorkbenchFormat;
  channel?: OutputSocialWorkbenchChannel | null;
  title: string;
  body: string;
  risks: string[];
  blockers: string[];
}): OutputSocialDraftItem {
  return {
    id: input.id,
    format: input.format,
    formatLabel: formatLabel(input.format),
    channel: input.channel ?? null,
    channelLabel: input.channel ? channelLabel(input.channel) : null,
    title: input.title,
    body: input.body,
    reviewRequired: true,
    publicSafeLabel: "Entwurf, nicht veröffentlicht",
    risks: input.risks,
    blockers: input.blockers,
  };
}

function sentence(text: string | null | undefined, fallback: string): string {
  const normalized = normalizeText(text);
  if (!normalized) return fallback;
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function buildModelFromSignals(input: BuildSignalsInput): OutputSocialWorkbenchModel {
  const summarySeed =
    normalizeText(input.summarySeed) ||
    uniqueStrings([
      input.dossierModel?.thesis.label ?? null,
      input.texts[0] ?? null,
    ])[0] ||
    "";
  const headlineSeed =
    normalizeText(input.headlineSeed) ||
    input.dossierRef?.title ||
    input.contributionRef?.title ||
    "Arbeitsstand";
  const pollQuestion = input.pollModel?.proposedQuestion ?? null;
  const participationQuestion =
    input.activationModel?.proposedParticipationQuestion ?? null;
  const sourceReviewNeeded =
    input.sourceModel?.enrichmentStatus === "needs_source_review" ||
    (input.sourceModel?.sourceNeeds.length ?? 0) > 0;
  const factcheckNeeded =
    input.sourceModel?.enrichmentStatus === "needs_factcheck_review" ||
    (input.sourceModel?.factcheckQuestions.length ?? 0) > 0 ||
    (input.dossierModel?.factcheckQuestions.length ?? 0) > 0;
  const humanInputNeeded =
    input.activationModel?.readinessSignals.some((item) => item.id === "human_input_needed") ||
    input.voxyDialog?.status === "needs_user_input" ||
    (input.voxyDialog?.cards.length ?? 0) > 0;
  const translationReviewNeeded =
    input.sourceLanguage !== input.readingLanguage || input.rtlDisplayHint;
  const scopeDecisionNeeded =
    input.activationModel?.riskFlags.some((item) => item.id === "unclear_scope") ||
    input.pollModel?.biasReviewNeeds.some((item) => item.id === "scope_unclear") ||
    false;
  const legalPolicySensitive =
    input.activationModel?.riskFlags.some((item) => item.id === "legal_policy_sensitivity") ||
    false;
  const vulnerableGroupImpact =
    input.activationModel?.riskFlags.some((item) => item.id === "vulnerable_group_impact") ||
    false;
  const publicMisreadRisk =
    input.activationModel?.riskFlags.some((item) => item.id === "public_misinterpretation_risk") ||
    (input.pollModel?.biasReviewNeeds.some((item) => item.id === "translation_misread_risk") ??
      false);
  const highRisk =
    legalPolicySensitive ||
    vulnerableGroupImpact ||
    publicMisreadRisk ||
    (input.activationModel?.riskFlags.some((item) => item.id === "low_context_input") ?? false);

  const copyRisks: OutputTag<OutputSocialCopyRisk>[] = [];
  if (sourceReviewNeeded) {
    pushTag(
      copyRisks,
      "missing_source_context",
      copyRiskLabel("missing_source_context"),
      "Quellenlage oder Kontext sind noch offen und sollten vor Veröffentlichung sichtbar geprüft werden.",
    );
  }
  if (factcheckNeeded) {
    pushTag(
      copyRisks,
      "factcheck_needed",
      copyRiskLabel("factcheck_needed"),
      "Offene Tatsachen- oder Kausalfragen sollten nicht in fertige Output-Kopie umgedeutet werden.",
    );
  }
  if (summarySeed && (sourceReviewNeeded || factcheckNeeded)) {
    pushTag(
      copyRisks,
      "overclaiming_risk",
      copyRiskLabel("overclaiming_risk"),
      "Eine zu glatte Kurzfassung könnte offene Prüfungslagen wie gesicherte Wahrheit wirken lassen.",
    );
  }
  if (publicMisreadRisk || scopeDecisionNeeded) {
    pushTag(
      copyRisks,
      "public_misinterpretation_risk",
      copyRiskLabel("public_misinterpretation_risk"),
      "Öffentliche oder halböffentliche Copy könnte den Arbeitsstand zu früh als entschiedenen Stand lesen lassen.",
    );
  }
  if ((input.activationModel?.targetGroups.length ?? 0) > 0 && translationReviewNeeded) {
    pushTag(
      copyRisks,
      "minority_view_smoothing_risk",
      copyRiskLabel("minority_view_smoothing_risk"),
      "Betroffene oder Minderheitenperspektiven dürfen in knapper Output-Copy nicht geglättet werden.",
    );
  }
  if (translationReviewNeeded) {
    pushTag(
      copyRisks,
      "translation_misread_risk",
      copyRiskLabel("translation_misread_risk"),
      "Originalsprache, Lesefassung und Output-Sprache müssen vor Veröffentlichung getrennt geprüft bleiben.",
    );
  }
  if (
    input.socialOutputDrafts.length > 0 ||
    summarySeed ||
    participationQuestion ||
    pollQuestion
  ) {
    pushTag(
      copyRisks,
      "channel_tone_risk",
      copyRiskLabel("channel_tone_risk"),
      "Kanal- und Tonalitätsprüfung bleibt nötig, bevor Copy nach außen oder halböffentlich weitergegeben wird.",
    );
  }
  if (legalPolicySensitive) {
    pushTag(
      copyRisks,
      "legal_policy_sensitivity",
      copyRiskLabel("legal_policy_sensitivity"),
      "Rechts- oder Verwaltungskontext braucht vor externer Copy eine bewusste Prüfung.",
    );
  }
  if (vulnerableGroupImpact) {
    pushTag(
      copyRisks,
      "vulnerable_group_impact",
      copyRiskLabel("vulnerable_group_impact"),
      "Betroffene Gruppen sollten in Einladung oder Zusammenfassung nicht verkürzt werden.",
    );
  }
  if ((participationQuestion || pollQuestion) && (sourceReviewNeeded || humanInputNeeded)) {
    pushTag(
      copyRisks,
      "call_to_action_too_strong",
      copyRiskLabel("call_to_action_too_strong"),
      "Einladungstexte sollten offene Quellen- oder Review-Lagen nicht wie eine fertige Aktivierung klingen lassen.",
    );
  }

  const readinessSignals: OutputTag<OutputSocialReadinessSignal>[] = [];
  if (summarySeed) {
    pushTag(
      readinessSignals,
      "dossier_summary_available",
      readinessSignalLabel("dossier_summary_available"),
      "Eine Debattenstand-Kurzfassung ist als reviewpflichtiger Entwurf ableitbar.",
    );
  }
  if (participationQuestion) {
    pushTag(
      readinessSignals,
      "participation_question_available",
      readinessSignalLabel("participation_question_available"),
      "Eine Beteiligungsfrage kann als Einladungsidee sichtbar gemacht werden.",
    );
  }
  if (pollQuestion) {
    pushTag(
      readinessSignals,
      "poll_question_available",
      readinessSignalLabel("poll_question_available"),
      "Eine Poll-Frage liegt als Vorschlag vor und kann nur review-first weitergedacht werden.",
    );
  }
  if (sourceReviewNeeded) {
    pushTag(
      readinessSignals,
      "source_review_needed",
      readinessSignalLabel("source_review_needed"),
      "Quellenprüfung bleibt vor öffentlicher oder halböffentlicher Ausgabe offen.",
    );
  }
  if (factcheckNeeded) {
    pushTag(
      readinessSignals,
      "factcheck_needed",
      readinessSignalLabel("factcheck_needed"),
      "Factcheck-Fragen sollten in der Output-Copy sichtbar mitgedacht werden.",
    );
  }
  if (humanInputNeeded) {
    pushTag(
      readinessSignals,
      "human_input_needed",
      readinessSignalLabel("human_input_needed"),
      "Menschliche Ergänzungen oder Betroffenenperspektiven fehlen noch.",
    );
  }
  if (input.activationModel && input.activationModel.activationStatus !== "activation_preview") {
    pushTag(
      readinessSignals,
      "activation_review_needed",
      readinessSignalLabel("activation_review_needed"),
      "Beteiligungsaktivierung bleibt getrenntes Review und wird nicht von Output-Copy ersetzt.",
    );
  }
  if (
    input.pollModel &&
    input.pollModel.questionType !== "not_poll_ready" &&
    input.pollModel.pollStatus !== "poll_preview"
  ) {
    pushTag(
      readinessSignals,
      "poll_review_needed",
      readinessSignalLabel("poll_review_needed"),
      "Poll-Frage und Optionen bleiben eigenes Review und werden nicht still veröffentlicht.",
    );
  }
  if (translationReviewNeeded) {
    pushTag(
      readinessSignals,
      "multilingual_review_needed",
      readinessSignalLabel("multilingual_review_needed"),
      "Mehrsprachige oder RTL-nahe Fälle brauchen eine getrennte Sprachprüfung.",
    );
  }
  if (input.voxyBriefing || input.voxyDialog) {
    pushTag(
      readinessSignals,
      "voxy_script_needed",
      readinessSignalLabel("voxy_script_needed"),
      "Voxy-Briefing bleibt Hinweis auf späteres Briefing oder Skript, nicht auf Rendern.",
    );
  }

  const baseBlockers = uniqueStrings([
    sourceReviewNeeded
      ? "Quellen- oder Evidence-Review bleibt vor Veröffentlichung offen."
      : null,
    factcheckNeeded
      ? "Offene Factcheck-Fragen blockieren eine ehrliche Output-Freigabe."
      : null,
    humanInputNeeded
      ? "Menschliche Ergänzungen oder Betroffenenperspektiven fehlen noch."
      : null,
    scopeDecisionNeeded
      ? "Scope und Empfängerkreis sollten vor externer oder halböffentlicher Ausgabe klarer getrennt werden."
      : null,
    translationReviewNeeded
      ? "Sprachgrenzen und Output-Sprache brauchen vor Veröffentlichung Review."
      : null,
    input.providerBlocked
      ? "Voxy-Folgepfade bleiben durch Provider- oder Secret-Gates blockiert."
      : null,
    highRisk
      ? "Der aktuelle Stand wirkt noch zu sensibel für glatte oder öffentliche Copy."
      : null,
  ]);

  const draftItems: OutputSocialDraftItem[] = [];
  const seenKeys = new Set<string>();
  const addDraft = (draft: OutputSocialDraftItem) => {
    const key = `${draft.format}:${draft.channel ?? "none"}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    draftItems.push(draft);
  };

  for (const draft of input.socialOutputDrafts) {
    const format = kindToFormat(draft.kind);
    const channel = kindToChannel(draft.kind);
    addDraft(
      buildDraftItem({
        id: draft.draftId,
        format,
        channel,
        title: draft.title,
        body: sentence(
          draft.summary,
          "Bestehender Output-Entwurf bleibt reviewpflichtig und nicht veröffentlicht.",
        ),
        risks: copyRisks.slice(0, 3).map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 3),
      }),
    );
  }

  if (summarySeed) {
    addDraft(
      buildDraftItem({
        id: "debate-status-summary",
        format: "debate_status_summary",
        channel: input.dossierRef ? "dossier_workspace" : "internal_review",
        title: `${headlineSeed} · Debattenstand`,
        body: sentence(
          summarySeed,
          "Ein Debattenstand ist noch nicht belastbar formulierbar.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["missing_source_context", "factcheck_needed", "overclaiming_risk"].includes(
              risk.id,
            ),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 2),
      }),
    );
    addDraft(
      buildDraftItem({
        id: "neutral-brief",
        format: "neutral_brief",
        channel: "internal_review",
        title: `${headlineSeed} · Neutraler Kurzbrief`,
        body: sentence(
          `${summarySeed}${input.dossierModel?.openQuestions[0] ? ` Offene Frage: ${input.dossierModel.openQuestions[0]}` : ""}`,
          "Neutraler Kurzbrief bleibt noch intern.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["public_misinterpretation_risk", "minority_view_smoothing_risk"].includes(
              risk.id,
            ),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 2),
      }),
    );
    addDraft(
      buildDraftItem({
        id: "share-snippet",
        format: "share_snippet",
        channel: "whatsapp_share",
        title: `${headlineSeed} · Share Copy`,
        body: sentence(
          input.pollModel?.proposedQuestion ?? input.activationModel?.proposedParticipationQuestion ?? summarySeed,
          "Share-Hinweis bleibt noch intern.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["translation_misread_risk", "channel_tone_risk", "call_to_action_too_strong"].includes(
              risk.id,
            ),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 2),
      }),
    );
    addDraft(
      buildDraftItem({
        id: "social-draft",
        format: "social_post_draft",
        channel: "linkedin",
        title: `${headlineSeed} · Social Draft`,
        body: sentence(
          `${summarySeed}${participationQuestion ? ` Beteiligungsfrage: ${participationQuestion}` : ""}`,
          "Social Draft bleibt reviewpflichtig.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["channel_tone_risk", "public_misinterpretation_risk", "overclaiming_risk"].includes(
              risk.id,
            ),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 3),
      }),
    );
    addDraft(
      buildDraftItem({
        id: "newsletter-teaser",
        format: "newsletter_teaser",
        channel: "newsletter",
        title: `${headlineSeed} · Newsletter-Teaser`,
        body: sentence(
          `${summarySeed}${participationQuestion ? ` Mehr dazu in der Beteiligungsfrage: ${participationQuestion}` : ""}`,
          "Newsletter-Teaser bleibt noch intern.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["missing_source_context", "translation_misread_risk", "channel_tone_risk"].includes(
              risk.id,
            ),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 3),
      }),
    );
  }

  if (participationQuestion) {
    addDraft(
      buildDraftItem({
        id: "participation-invitation",
        format: "participation_invitation",
        channel: "participation_room",
        title: `${headlineSeed} · Beteiligungseinladung`,
        body: sentence(
          `Zur Beteiligung steht im Raum: ${participationQuestion}`,
          "Eine Beteiligungseinladung bleibt noch reviewpflichtig.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["call_to_action_too_strong", "public_misinterpretation_risk"].includes(risk.id),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 3),
      }),
    );
  }

  if (pollQuestion) {
    addDraft(
      buildDraftItem({
        id: "poll-invitation",
        format: "poll_invitation",
        channel: "website_preview",
        title: `${headlineSeed} · Poll-Einladung`,
        body: sentence(
          `Als Poll-Frage wäre sichtbar: ${pollQuestion}`,
          "Eine Poll-Einladung bleibt noch reviewpflichtig.",
        ),
        risks: copyRisks
          .filter((risk) =>
            [
              "call_to_action_too_strong",
              "translation_misread_risk",
              "public_misinterpretation_risk",
            ].includes(risk.id),
          )
          .map((risk) => risk.label),
        blockers: uniqueStrings([
          ...(input.pollModel?.reviewBlockers ?? []).slice(0, 2),
          ...baseBlockers.slice(0, 2),
        ]),
      }),
    );
  }

  if ((input.activationModel?.targetGroups.length ?? 0) > 0 && participationQuestion) {
    addDraft(
      buildDraftItem({
        id: "stakeholder-invitation",
        format: "stakeholder_invitation",
        channel: "internal_review",
        title: `${headlineSeed} · Stakeholder-Einladung`,
        body: sentence(
          `Betroffene Gruppen wie ${(input.activationModel?.targetGroups ?? []).slice(0, 3).join(", ")} sollten sichtbar und nicht geglättet eingeladen werden.`,
          "Stakeholder-Einladung bleibt intern.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["minority_view_smoothing_risk", "vulnerable_group_impact"].includes(risk.id),
          )
          .map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 2),
      }),
    );
  }

  if (input.voxyBriefing || input.voxyDialog) {
    addDraft(
      buildDraftItem({
        id: "voxy-briefing-note",
        format: "voxy_briefing_note",
        channel: "voxy_video_briefing",
        title: `${headlineSeed} · Voxy-Briefing-Hinweis`,
        body: sentence(
          input.voxyBriefing?.summary ??
            `Voxy könnte diesen Arbeitsstand später als Briefing aufnehmen, sobald Review und Script-Check bewusst erfolgt sind.`,
          "Voxy-Briefing bleibt Hinweis.",
        ),
        risks: copyRisks
          .filter((risk) =>
            ["missing_source_context", "translation_misread_risk", "channel_tone_risk"].includes(
              risk.id,
            ),
          )
          .map((risk) => risk.label),
        blockers: uniqueStrings([
          input.providerBlocked
            ? "Voxy-Provider oder Secrets fehlen noch."
            : "Voxy-Hinweis ist noch kein Skript und kein Render.",
          ...baseBlockers.slice(0, 2),
        ]),
      }),
    );
  }

  if (highRisk || !summarySeed) {
    addDraft(
      buildDraftItem({
        id: "keep-internal-draft",
        format: "keep_internal_draft",
        channel: "internal_review",
        title: `${headlineSeed} · Interner Arbeitsstand`,
        body: sentence(
          "Der aktuelle Stand sollte vorerst intern bleiben, bis Quellen, Sprache, Betroffenheit und Review sauber geklärt sind.",
          "Interner Arbeitsstand bleibt reviewpflichtig.",
        ),
        risks: copyRisks.slice(0, 4).map((risk) => risk.label),
        blockers: baseBlockers,
      }),
    );
  }

  if (input.surface === "admin" || input.surface === "workspace") {
    addDraft(
      buildDraftItem({
        id: "admin-review-note",
        format: "admin_review_note",
        channel: "internal_review",
        title: `${headlineSeed} · Review-Notiz`,
        body: sentence(
          uniqueStrings([
            baseBlockers[0] ?? null,
            input.userVisibleReason,
          ]).join(" "),
          "Review-Notiz bleibt intern.",
        ),
        risks: copyRisks.slice(0, 3).map((risk) => risk.label),
        blockers: baseBlockers.slice(0, 3),
      }),
    );
  }

  const channelCandidates: OutputTag<OutputSocialWorkbenchChannel>[] = [];
  const addChannel = (id: OutputSocialWorkbenchChannel, reason: string) =>
    pushTag(channelCandidates, id, channelLabel(id), reason);

  addChannel(
    "internal_review",
    "Jeder Output-Kandidat bleibt mindestens als interner Review-Entwurf sichtbar.",
  );
  if (summarySeed) {
    addChannel(
      input.dossierRef ? "dossier_workspace" : "website_preview",
      "Eine Kurzfassung kann als bestehende Workspace- oder Website-Vorschau vorbereitet werden.",
    );
  }
  if (participationQuestion) {
    addChannel(
      "participation_room",
      "Eine Beteiligungseinladung passt nur review-first zum vorhandenen Participation-Kontext.",
    );
  }
  if (pollQuestion) {
    addChannel(
      "whatsapp_share",
      "Share Copy oder Poll-Einladung bleiben nur Kandidaten und brauchen Review.",
    );
  }
  if (summarySeed) {
    addChannel(
      "linkedin",
      "Ein Social Draft kann als Kanal-Kandidat sichtbar werden, bleibt aber ungepostet.",
    );
    addChannel(
      "instagram",
      "Carousel- oder Share-Kopie bleiben Kanal-Kandidaten und keine Veröffentlichung.",
    );
    addChannel(
      "newsletter",
      "Newsletter-Teaser bleibt reviewpflichtig und unversendet.",
    );
  }
  if (legalPolicySensitive || summarySeed) {
    addChannel(
      "press_note",
      "Pressehinweise brauchen zusätzliche Kanal- und Compliance-Prüfung.",
    );
  }
  if (input.voxyBriefing || input.voxyDialog) {
    addChannel(
      "voxy_video_briefing",
      "Voxy-Hinweis bleibt Vorschlag für ein späteres Briefing und kein Render.",
    );
  }

  const outputFormats = uniqueStrings(draftItems.map((item) => item.format)).filter(
    (value): value is OutputSocialWorkbenchFormat =>
      (OUTPUT_SOCIAL_WORKBENCH_FORMATS as readonly string[]).includes(value),
  );

  const publicishChannels = channelCandidates.some((item) =>
    [
      "website_preview",
      "linkedin",
      "x_twitter",
      "instagram",
      "facebook",
      "newsletter",
      "whatsapp_share",
      "press_note",
      "voxy_video_briefing",
    ].includes(item.id),
  );
  const channelReviewNeeded = publicishChannels;
  const complianceReviewNeeded =
    legalPolicySensitive ||
    vulnerableGroupImpact ||
    channelCandidates.some((item) => item.id === "press_note" || item.id === "newsletter");
  const hasExistingNewsletterDraft = input.socialOutputDrafts.some(
    (draft) => draft.kind === "newsletter_draft",
  );
  const hasExistingSocialDraft = input.socialOutputDrafts.some((draft) =>
    ["linkedin_draft", "carousel_draft", "website_update_draft"].includes(draft.kind),
  );
  const hasExistingPressDraft = input.socialOutputDrafts.some(
    (draft) => draft.kind === "press_note_draft",
  );

  let outputStatus: OutputSocialWorkbenchStatus = "readmodel_only";
  if (input.providerBlocked) {
    outputStatus = "blocked_by_provider";
  } else if (draftItems.length === 0 && input.runtimeTruthMissing) {
    outputStatus = "blocked_by_runtime_truth";
  } else if (sourceReviewNeeded) {
    outputStatus = "needs_source_review";
  } else if (factcheckNeeded) {
    outputStatus = "needs_factcheck_review";
  } else if (humanInputNeeded) {
    outputStatus = "needs_human_input";
  } else if (scopeDecisionNeeded) {
    outputStatus = "needs_scope_decision";
  } else if (translationReviewNeeded) {
    outputStatus = "needs_translation_review";
  } else if (complianceReviewNeeded) {
    outputStatus = "needs_compliance_review";
  } else if (channelReviewNeeded) {
    outputStatus = input.missingReview ? "blocked_by_missing_review" : "needs_channel_review";
  } else if (highRisk) {
    outputStatus = "needs_editorial_review";
  } else if (draftItems.length > 0) {
    outputStatus = "output_preview";
  }

  let nextOutputDecision: OutputSocialNextDecision = "blocked";
  let nextOutputDecisionReason =
    "Ohne weitere Review-Wahrheit bleibt dieser Output-Arbeitsstand blockiert.";
  if (!summarySeed) {
    nextOutputDecision = "refine_summary";
    nextOutputDecisionReason =
      "Vor Kanal- oder Einladungskopie braucht es zuerst eine belastbare Kurzfassung des Debattenstands.";
  } else if (sourceReviewNeeded) {
    nextOutputDecision = "request_sources";
    nextOutputDecisionReason =
      "Offene Quellen- oder Evidence-Lagen sollten vor externer oder halböffentlicher Copy sichtbar geklärt werden.";
  } else if (factcheckNeeded) {
    nextOutputDecision = "review_claims";
    nextOutputDecisionReason =
      "Claim- und Factcheck-Fragen sollten vor Veröffentlichung oder Social Drafts weiter geprüft werden.";
  } else if (translationReviewNeeded) {
    nextOutputDecision = "translate_or_review_language";
    nextOutputDecisionReason =
      "Original, Lesefassung und gewünschte Output-Sprache brauchen eine bewusste Sprachprüfung.";
  } else if (participationQuestion || pollQuestion) {
    nextOutputDecision = "prepare_invitation_copy";
    nextOutputDecisionReason =
      "Einladungstexte sollten jetzt präzise und nicht überziehend aufbereitet werden.";
  } else if (summarySeed && draftItems.some((item) => item.format === "social_post_draft")) {
    nextOutputDecision = "prepare_social_draft";
    nextOutputDecisionReason =
      "Ein Social Draft ist sichtbar, braucht aber noch Kanal- und Review-Feinschliff.";
  } else if (input.voxyBriefing || input.voxyDialog) {
    nextOutputDecision = "prepare_voxy_script";
    nextOutputDecisionReason =
      "Der Voxy-Hinweis kann erst nach Review in ein späteres Briefing oder Skript weitergeführt werden.";
  } else if (highRisk) {
    nextOutputDecision = "keep_internal";
    nextOutputDecisionReason =
      "Der aktuelle Stand sollte bis zur weiteren Klärung intern bleiben.";
  }

  const downstreamReadiness: OutputSocialDownstreamItem[] = [
    {
      id: "publicDossier",
      label: downstreamTargetLabel("publicDossier"),
      status:
        summarySeed && !sourceReviewNeeded && !factcheckNeeded
          ? "needs_review"
          : "blocked",
      statusLabel: downstreamStatusLabel(
        summarySeed && !sourceReviewNeeded && !factcheckNeeded
          ? "needs_review"
          : "blocked",
      ),
      reason:
        summarySeed
          ? "Ein öffentlicher Dossier-Auszug braucht weiter Review, Quellenstatus und Freigabe."
          : "Ohne belastbare Kurzfassung bleibt ein Public-Dossier-Output blockiert.",
      reviewRequired: true,
    },
    {
      id: "participationRoom",
      label: downstreamTargetLabel("participationRoom"),
      status:
        input.activationModel?.downstreamReadiness.find((item) => item.id === "publicActivation")
          ?.status === "prepared" ||
        input.activationModel?.suggestedFormat === "poll_preparation"
          ? "needs_review"
          : "blocked",
      statusLabel: downstreamStatusLabel(
        input.activationModel?.downstreamReadiness.find((item) => item.id === "publicActivation")
          ?.status === "prepared" ||
        input.activationModel?.suggestedFormat === "poll_preparation"
          ? "needs_review"
          : "blocked",
      ),
      reason:
        "Participation Room braucht weiter Activation Review und wird nicht durch Output-Copy aktiviert.",
      reviewRequired: true,
    },
    {
      id: "poll",
      label: downstreamTargetLabel("poll"),
      status:
        input.pollModel?.downstreamReadiness.find((item) => item.id === "publicPoll")?.status ===
        "prepared"
          ? "needs_review"
          : input.pollModel?.proposedQuestion
            ? "needs_review"
            : "blocked",
      statusLabel: downstreamStatusLabel(
        input.pollModel?.downstreamReadiness.find((item) => item.id === "publicPoll")?.status ===
        "prepared"
          ? "needs_review"
          : input.pollModel?.proposedQuestion
            ? "needs_review"
            : "blocked",
      ),
      reason:
        "Poll-Einladung ersetzt keinen gestarteten Poll und bleibt an Poll-Review und Runtime-Wahrheit gebunden.",
      reviewRequired: true,
    },
    {
      id: "social",
      label: downstreamTargetLabel("social"),
      status:
        hasExistingSocialDraft || (summarySeed && !sourceReviewNeeded && !factcheckNeeded)
          ? "needs_review"
          : "blocked",
      statusLabel: downstreamStatusLabel(
        hasExistingSocialDraft || (summarySeed && !sourceReviewNeeded && !factcheckNeeded)
          ? "needs_review"
          : "blocked",
      ),
      reason:
        "Social bleibt ungepostet und braucht Copy-, Kanal- und Freigabeprüfung.",
      reviewRequired: true,
    },
    {
      id: "newsletter",
      label: downstreamTargetLabel("newsletter"),
      status:
        hasExistingNewsletterDraft || (summarySeed && !sourceReviewNeeded)
          ? "needs_review"
          : "blocked",
      statusLabel: downstreamStatusLabel(
        hasExistingNewsletterDraft || (summarySeed && !sourceReviewNeeded)
          ? "needs_review"
          : "blocked",
      ),
      reason:
        "Newsletter braucht zusätzlich Kanal- und Compliance-Review und bleibt unversendet.",
      reviewRequired: true,
    },
    {
      id: "press",
      label: downstreamTargetLabel("press"),
      status:
        legalPolicySensitive || vulnerableGroupImpact
          ? "blocked"
          : hasExistingPressDraft || summarySeed
            ? "needs_review"
            : "blocked",
      statusLabel: downstreamStatusLabel(
        legalPolicySensitive || vulnerableGroupImpact
          ? "blocked"
          : hasExistingPressDraft || summarySeed
            ? "needs_review"
            : "blocked",
      ),
      reason:
        legalPolicySensitive || vulnerableGroupImpact
          ? "Pressehinweise bleiben bei sensiblen Lagen blockiert, bis Review und Einordnung klar sind."
          : "Pressehinweise brauchen Review und bleiben Entwurf.",
      reviewRequired: true,
    },
    {
      id: "voxyBriefing",
      label: downstreamTargetLabel("voxyBriefing"),
      status:
        input.providerBlocked
          ? "blocked"
          : input.voxyBriefing || input.voxyDialog
            ? "needs_review"
            : "blocked",
      statusLabel: downstreamStatusLabel(
        input.providerBlocked
          ? "blocked"
          : input.voxyBriefing || input.voxyDialog
            ? "needs_review"
            : "blocked",
      ),
      reason:
        input.providerBlocked
          ? "Voxy-Briefing bleibt durch Provider- oder Secret-Gates blockiert."
          : input.voxyBriefing || input.voxyDialog
            ? "Voxy-Briefing braucht Review und bleibt ohne Script/Render-Runtime nur Hinweis."
            : "Kein belastbarer Voxy-Briefing-Kandidat sichtbar.",
      reviewRequired: true,
    },
  ];

  return {
    title: "Ausgabe vorbereiten",
    summary:
      "Dieser Layer bereitet nur Output-, Social- und Briefing-Kandidaten vor. Es wird nichts veröffentlicht, gepostet, geplant oder gerendert.",
    surface: input.surface,
    contributionRef: input.contributionRef ?? null,
    dossierRef: input.dossierRef ?? null,
    participationRef: input.participationRef ?? null,
    pollRef: input.pollRef ?? null,
    sourceLanguage: input.sourceLanguage,
    readingLanguage: input.readingLanguage,
    outputLanguage: input.outputLanguage,
    languageLabel: `Original: ${languageName(input.sourceLanguage)} · Lesefassung: ${languageName(input.readingLanguage)} · Output: ${languageName(input.outputLanguage)}${input.rtlDisplayHint ? " · RTL-Hinweis aktiv" : ""}`,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDisplayHint: input.rtlDisplayHint,
    outputStatus,
    outputStatusLabel: outputStatusLabel(outputStatus),
    outputFormats,
    outputFormatLabels: outputFormats.map(formatLabel),
    channelCandidates,
    draftItems,
    copyRisks,
    readinessSignals,
    downstreamReadiness,
    nextOutputDecision: {
      id: nextOutputDecision,
      label: nextDecisionLabel(nextOutputDecision),
      reason: nextOutputDecisionReason,
    },
    publicSafeLabel: "Vorschlag, nicht veröffentlicht",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    reviewRequired: true,
    noPublishAction: true,
    noSocialPostAction: true,
    noScheduleAction: true,
    noRuntimeClaim: true,
  };
}

export function buildOutputSocialWorkbenchFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
): OutputSocialWorkbenchModel | null {
  if (!model.hasPreview || !model.voxyCocreationDialog) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview(model);
  const dossierModel = buildDossierWorkspaceDecisionFromCreateCandidatePreview(model);
  const activationModel =
    buildParticipationActivationReviewFromCreateCandidatePreview(model);
  const pollModel = buildPollQuestionOptionsReviewFromCreateCandidatePreview(model);

  return buildModelFromSignals({
    surface: "create",
    contributionRef: model.voxyCocreationDialog.contributionRef,
    participationRef: activationModel?.suggestedFormat
      ? {
          id: `${model.voxyCocreationDialog.contributionRef?.id ?? "create"}:participation`,
          title: activationModel.suggestedFormatLabel,
        }
      : null,
    pollRef: pollModel?.proposedQuestion
      ? {
          id: `${model.voxyCocreationDialog.contributionRef?.id ?? "create"}:poll`,
          title: pollModel.proposedQuestion,
        }
      : null,
    sourceLanguage: model.voxyCocreationDialog.sourceLanguage,
    readingLanguage: model.voxyCocreationDialog.readingLanguage,
    outputLanguage: model.voxyCocreationDialog.readingLanguage,
    rtlDisplayHint: model.voxyCocreationDialog.rtl,
    translationAvailable: model.voxyCocreationDialog.translationAvailable,
    summarySeed: model.summary,
    headlineSeed: model.title,
    texts: model.sections.flatMap((section) => section.items).map((item) => item.title),
    socialOutputDrafts: [],
    sourceModel,
    dossierModel,
    activationModel,
    pollModel,
    voxyDialog: model.voxyCocreationDialog,
    voxyBriefing: null,
    runtimeTruthMissing:
      model.providerRuntimeTruth === "missing_runtime_truth" ||
      model.reviewHandoff.persistenceTruth === "missing_persistence_truth",
    providerBlocked: false,
    missingReview: false,
    nextStep:
      "Kurzfassung, Einladungstext, Kanalwahl und offene Reviews prüfen, bevor ein Output weitergereicht wird.",
    userVisibleReason:
      "Die Vorschau zeigt nur, welche Ausgabeformen aus dem Arbeitsstand entstehen könnten und was davor noch fehlt.",
    reviewerVisibleReason:
      "Create bleibt eine review-first Output-Vorschau. Es wird nichts veröffentlicht, gepostet oder geplant.",
  });
}

export function buildOutputSocialWorkbenchFromReviewContext(
  context: V3ReviewQueueWiringContext | null | undefined,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: OutputRef | null;
    dossierRef?: OutputRef | null;
  },
): OutputSocialWorkbenchModel | null {
  if (!context?.languageBridge) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromReviewContext(context, {
    audience: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? null,
  });
  const dossierModel = buildDossierWorkspaceDecisionFromReviewContext(context, {
    audience: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const activationModel = buildParticipationActivationReviewFromReviewContext(context, {
    audience: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const pollModel = buildPollQuestionOptionsReviewFromReviewContext(context, {
    audience: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
  });
  const voxyDialog = buildVoxyCocreationDialogFromReviewContext(context, {
    contributionRef: options?.contributionRef ?? null,
    surface: options?.audience === "workspace" ? "workspace" : "admin",
    maxCards: 4,
  });
  const firstParticipation = context.participationCandidates[0] ?? null;
  return buildModelFromSignals({
    surface: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? null,
    dossierRef: options?.dossierRef ?? null,
    participationRef: firstParticipation
      ? {
          id: firstParticipation.id,
          title: firstParticipation.title,
        }
      : null,
    pollRef: pollModel?.proposedQuestion && firstParticipation
      ? {
          id: `${firstParticipation.id}:poll`,
          title: pollModel.proposedQuestion,
        }
      : null,
    sourceLanguage: context.languageBridge.original.language,
    readingLanguage:
      context.multilingualThread?.readingLocale ?? context.languageBridge.translation.language,
    outputLanguage:
      context.multilingualThread?.readingLocale ?? context.languageBridge.translation.language,
    rtlDisplayHint: Boolean(context.languageBridge.translation.rtl),
    translationAvailable: Boolean(context.languageBridge.translation.text),
    summarySeed:
      context.voxyBriefing?.summary ??
      context.languageBridge.summary.text ??
      context.primaryUnifiedItem?.summary ??
      null,
    headlineSeed:
      options?.dossierRef?.title ??
      options?.contributionRef?.title ??
      context.primaryUnifiedItem?.title ??
      null,
    texts: uniqueStrings([
      ...(context.dossierWorkspaceSurface?.sections.claims ?? []),
      ...(context.dossierWorkspaceSurface?.sections.counterPositions ?? []),
      ...context.participationCandidates.map((candidate) => candidate.title),
      ...context.socialOutputDrafts.map((draft) => draft.title),
    ]),
    socialOutputDrafts: context.socialOutputDrafts,
    sourceModel,
    dossierModel,
    activationModel,
    pollModel,
    voxyDialog,
    voxyBriefing: context.voxyBriefing,
    runtimeTruthMissing:
      context.socialOutputDrafts.length === 0 &&
      !context.voxyBriefing &&
      context.participationCandidates.length === 0,
    providerBlocked: Boolean(
      context.voxyRenderJob?.status === "blocked_by_provider" ||
        context.voxyRenderJob?.status === "blocked_by_secret",
    ),
    missingReview: false,
    nextStep:
      "Output-Formate, Kanalwahl, Copy-Risiken und Freigabegrenzen im bestehenden Review-Kontext prüfen.",
    userVisibleReason:
      "Der Review-Kontext zeigt nur Output- und Social-Kandidaten und keine Veröffentlichung oder Planung.",
    reviewerVisibleReason:
      "Output-, Social- und Voxy-Hinweise bleiben review-first Entwürfe statt Publish-, Schedule- oder Render-Aktionen.",
  });
}

export function buildOutputSocialWorkbenchFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    contributionRef?: OutputRef | null;
    nextStep?: string;
  },
): OutputSocialWorkbenchModel | null {
  if (!dialog) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromVoxyDialog(dialog, {
    surface: "account",
    nextStep:
      options?.nextStep ?? "Quellen und Beispiele würden spätere Output-Entwürfe belastbarer machen.",
    runtimeTruthMissing: true,
  });
  const dossierModel = buildDossierWorkspaceDecisionFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef,
    surface: "account",
    nextStep:
      options?.nextStep ?? "Zuerst Kontext, Beispiele und Gegenperspektiven weiter schärfen.",
  });
  const activationModel = buildParticipationActivationReviewFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef,
    nextStep: options?.nextStep,
  });
  const pollModel = buildPollQuestionOptionsReviewFromVoxyDialog(dialog, {
    contributionRef: options?.contributionRef ?? dialog.contributionRef,
    nextStep: options?.nextStep,
  });

  return buildModelFromSignals({
    surface: "account",
    contributionRef: options?.contributionRef ?? dialog.contributionRef,
    participationRef: activationModel?.suggestedFormat
      ? {
          id: `${dialog.contributionRef?.id ?? "account"}:participation`,
          title: activationModel.suggestedFormatLabel,
        }
      : null,
    pollRef: pollModel?.proposedQuestion
      ? {
          id: `${dialog.contributionRef?.id ?? "account"}:poll`,
          title: pollModel.proposedQuestion,
        }
      : null,
    sourceLanguage: dialog.sourceLanguage,
    readingLanguage: dialog.readingLanguage,
    outputLanguage: dialog.readingLanguage,
    rtlDisplayHint: dialog.rtl,
    translationAvailable: dialog.translationAvailable,
    summarySeed: dialog.summary,
    headlineSeed: dialog.contributionRef?.title ?? null,
    texts: uniqueStrings([
      dialog.contributionRef?.title ?? null,
      ...dialog.cards.map((card) => card.userVisibleQuestion),
    ]),
    socialOutputDrafts: [],
    sourceModel,
    dossierModel,
    activationModel,
    pollModel,
    voxyDialog: dialog,
    voxyBriefing: null,
    runtimeTruthMissing: true,
    providerBlocked: false,
    missingReview: false,
    nextStep:
      options?.nextStep ?? "Arbeitsstand klären, bevor Output-, Share- oder Briefing-Kopie vorbereitet wird.",
    userVisibleReason:
      "Im Account bleibt dieser Output-Vorschlag ein lokaler oder readmodel-only Arbeitsstand.",
    reviewerVisibleReason:
      "Ohne persisted Handoff oder Runtime-Wahrheit bleibt der Output-Pfad bewusst intern und ungepostet.",
  });
}

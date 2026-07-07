import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
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

export const DOSSIER_WORKSPACE_DECISION_STATUSES = [
  "readmodel_only",
  "decision_preview",
  "needs_editorial_review",
  "needs_source_review",
  "needs_factcheck_review",
  "needs_human_input",
  "blocked_by_runtime_truth",
  "blocked_by_provider",
  "blocked_by_missing_review",
] as const;

export type DossierWorkspaceDecisionStatus =
  (typeof DOSSIER_WORKSPACE_DECISION_STATUSES)[number];

export const DOSSIER_WORKSPACE_THESIS_CONFIDENCE = [
  "explicit",
  "inferred",
  "missing",
] as const;

export type DossierWorkspaceThesisConfidence =
  (typeof DOSSIER_WORKSPACE_THESIS_CONFIDENCE)[number];

export const DOSSIER_WORKSPACE_COUNTERPOSITION_STATUSES = [
  "present",
  "missing",
  "suggested",
  "needs_review",
] as const;

export type DossierWorkspaceCounterpositionStatus =
  (typeof DOSSIER_WORKSPACE_COUNTERPOSITION_STATUSES)[number];

export const DOSSIER_WORKSPACE_CLAIM_TYPES = [
  "factual",
  "normative",
  "causal",
  "forecast",
  "personal_experience",
  "unclear",
  "contested",
] as const;

export type DossierWorkspaceClaimType =
  (typeof DOSSIER_WORKSPACE_CLAIM_TYPES)[number];

export const DOSSIER_WORKSPACE_REFERENCE_SCOPES = [
  "local",
  "regional",
  "national",
  "eu",
  "global",
  "multilingual",
] as const;

export type DossierWorkspaceReferenceScope =
  (typeof DOSSIER_WORKSPACE_REFERENCE_SCOPES)[number];

export const DOSSIER_WORKSPACE_DOWNSTREAM_STATUSES = [
  "readmodel_only",
  "blocked",
  "needs_review",
  "prepared",
] as const;

export type DossierWorkspaceDownstreamStatus =
  (typeof DOSSIER_WORKSPACE_DOWNSTREAM_STATUSES)[number];

export const DOSSIER_WORKSPACE_NEXT_DECISIONS = [
  "clarify_human_input",
  "request_sources",
  "prepare_counterposition",
  "review_claims",
  "define_participation_scope",
  "prepare_dossier_brief",
  "keep_as_draft",
  "blocked",
] as const;

export type DossierWorkspaceNextDecision =
  (typeof DOSSIER_WORKSPACE_NEXT_DECISIONS)[number];

type DossierDecisionSurface = "create" | "account" | "admin" | "workspace";

type DecisionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type DossierWorkspaceClaimItem = {
  id: string;
  text: string;
  claimType: DossierWorkspaceClaimType;
  claimTypeLabel: string;
  reviewNeed: string;
  sourceNeed: string | null;
  factcheckQuestion: string | null;
  reviewRequired: true;
};

export type DossierWorkspaceDownstreamReadinessItem = {
  id: "participation" | "poll" | "output" | "social" | "voxyBriefing";
  label: string;
  status: DossierWorkspaceDownstreamStatus;
  statusLabel: string;
  reason: string;
  reviewRequired: true;
};

export type DossierWorkspaceDecisionModel = {
  title: string;
  summary: string;
  surface: DossierDecisionSurface;
  dossierRef: DecisionRef | null;
  contributionRef: DecisionRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  rtlDisplayHint: boolean;
  workspaceStatus: DossierWorkspaceDecisionStatus;
  workspaceStatusLabel: string;
  thesis: {
    label: string;
    confidence: DossierWorkspaceThesisConfidence;
    confidenceLabel: string;
    reviewRequired: true;
  };
  counterposition: {
    status: DossierWorkspaceCounterpositionStatus;
    statusLabel: string;
    summary: string;
    reviewRequired: true;
  };
  claimItems: DossierWorkspaceClaimItem[];
  openQuestions: string[];
  sourceNeeds: string[];
  factcheckQuestions: string[];
  affectedGroups: string[];
  commonGoodTensions: string[];
  referenceScopes: Array<{
    id: DossierWorkspaceReferenceScope;
    label: string;
    reason: string;
  }>;
  humanLoopNeeds: string[];
  downstreamReadiness: DossierWorkspaceDownstreamReadinessItem[];
  nextDecision: {
    id: DossierWorkspaceNextDecision;
    label: string;
    reason: string;
  };
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  reviewRequired: true;
  noPublishAction: true;
  noRuntimeClaim: true;
};

type GenericSignalsInput = {
  surface: DossierDecisionSurface;
  dossierRef?: DecisionRef | null;
  contributionRef?: DecisionRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  rtlDisplayHint: boolean;
  thesisText: string | null;
  thesisConfidence: DossierWorkspaceThesisConfidence;
  claimTexts: string[];
  counterpositionTexts: string[];
  openQuestions: string[];
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  voxyDialog: V3VoxyCocreationDialogModel | null;
  downstream: {
    participation: { status: DossierWorkspaceDownstreamStatus; reason: string };
    poll: { status: DossierWorkspaceDownstreamStatus; reason: string };
    output: { status: DossierWorkspaceDownstreamStatus; reason: string };
    social: { status: DossierWorkspaceDownstreamStatus; reason: string };
    voxyBriefing: { status: DossierWorkspaceDownstreamStatus; reason: string };
  };
  runtimeTruthMissing: boolean;
  providerBlocked: boolean;
  missingReview: boolean;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
};

function normalizeText(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function uniqueStrings(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.map((value) => normalizeText(value)).filter(Boolean)),
  );
}

function lowerJoined(values: readonly string[]): string {
  return values.map((value) => value.toLowerCase()).join(" ");
}

function containsPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
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

function thesisConfidenceLabel(value: DossierWorkspaceThesisConfidence): string {
  if (value === "explicit") return "Explizit";
  if (value === "inferred") return "Abgeleitet";
  return "Noch offen";
}

function workspaceStatusLabel(value: DossierWorkspaceDecisionStatus): string {
  if (value === "decision_preview") return "Entscheidungsvorschau";
  if (value === "needs_editorial_review") return "Redaktionelle Prüfung offen";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Factcheck-Fragen offen";
  if (value === "needs_human_input") return "Menschliche Ergänzung offen";
  if (value === "blocked_by_provider") return "Provider blockiert";
  if (value === "blocked_by_missing_review") return "Review fehlt";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Nur Readmodel";
}

function counterpositionStatusLabel(value: DossierWorkspaceCounterpositionStatus): string {
  if (value === "present") return "Vorhanden";
  if (value === "suggested") return "Sinnvoll, aber noch offen";
  if (value === "needs_review") return "Braucht Review";
  return "Fehlt noch";
}

function claimTypeLabel(value: DossierWorkspaceClaimType): string {
  if (value === "factual") return "Tatsachenbehauptung";
  if (value === "normative") return "Normative Aussage";
  if (value === "causal") return "Kausalbehauptung";
  if (value === "forecast") return "Prognose";
  if (value === "personal_experience") return "Erfahrungsbericht";
  if (value === "contested") return "Umstrittene Aussage";
  return "Unklare Aussage";
}

function downstreamStatusLabel(value: DossierWorkspaceDownstreamStatus): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_review") return "Braucht Review";
  if (value === "blocked") return "Blockiert";
  return "Nur Readmodel";
}

function nextDecisionLabel(value: DossierWorkspaceNextDecision): string {
  if (value === "clarify_human_input") return "Human-Loop klären";
  if (value === "request_sources") return "Quellen nachfordern";
  if (value === "prepare_counterposition") return "Gegenposition vorbereiten";
  if (value === "review_claims") return "Claims prüfen";
  if (value === "define_participation_scope") return "Beteiligungsrahmen klären";
  if (value === "prepare_dossier_brief") return "Dossier-Brief vorbereiten";
  if (value === "keep_as_draft") return "Als Arbeitsstand halten";
  return "Blockiert";
}

function referenceScopeReason(scope: string): string {
  if (scope === "local") return "Der aktuelle Arbeitsstand hat einen lokalen Bezug.";
  if (scope === "regional") return "Ein regionaler Vergleichsraum ist relevant.";
  if (scope === "national") return "Der Beitrag berührt eine nationale Ebene.";
  if (scope === "eu") return "Ein EU-Vergleich könnte Regeln oder Einordnung schärfen.";
  if (scope === "global") return "Ein globaler Vergleich könnte die These kontextualisieren.";
  return "Originalsprache und Lesesprache bleiben getrennt reviewpflichtig.";
}

function referenceScopeLabel(scope: DossierWorkspaceReferenceScope): string {
  if (scope === "local") return "Lokal";
  if (scope === "regional") return "Regional";
  if (scope === "national") return "National";
  if (scope === "eu") return "EU";
  if (scope === "global") return "Global";
  return "Mehrsprachig";
}

function detectClaimType(text: string, allText: string): DossierWorkspaceClaimType {
  if (
    containsPattern(text, [
      /\b(ich|wir|meine erfahrung|unsere erfahrung|i |we |experience|expérience|ben|biz)\b/i,
      /(?:أنا|نحن|تجربة)/i,
    ])
  ) {
    return "personal_experience";
  }
  if (
    containsPattern(text, [
      /\b(weil|dadurch|führt zu|verursacht|because|causes|lead to|entraîne|neden olur)\b/i,
      /(?:يسبب|يؤدي إلى)/i,
    ])
  ) {
    return "causal";
  }
  if (
    containsPattern(text, [
      /\b(wird|werden|künftig|future|forecast|prévision|olacak)\b/i,
      /(?:سوف|مستقبلاً)/i,
    ])
  ) {
    return "forecast";
  }
  if (
    containsPattern(text, [
      /\b(sollte|sollten|muss|müssen|should|must|faut|doit|olmalı|gerekir)\b/i,
      /(?:يجب|ينبغي)/i,
    ])
  ) {
    return "normative";
  }
  if (
    containsPattern(allText, [
      /\b(umstritten|contested|strittig|controversial)\b/i,
      /(?:متنازع عليه)/i,
    ])
  ) {
    return "contested";
  }
  if (
    containsPattern(text, [
      /\b(ist|sind|war|waren|gibt|there is|there are|sont|sind)\b/i,
      /\b\d{1,4}([.,]\d+)?\b/,
    ])
  ) {
    return "factual";
  }
  return "unclear";
}

function inferAffectedGroups(texts: readonly string[], sourceModel: SourceFactcheckFeedEnrichmentModel | null) {
  const groups = [...(sourceModel?.affectedGroupEvidenceNeeds ?? [])];
  const combined = lowerJoined(texts);
  if (
    containsPattern(combined, [
      /\b(menschen|anwohner|familien|kinder|mieter|schüler|people|residents|families|children)\b/i,
      /\b(insanlar|aileler|çocuklar|öğrenciler)\b/i,
      /(?:السكان|العائلات|الأطفال|الطلاب)/i,
    ])
  ) {
    groups.unshift("Betroffene Gruppen sind benannt, sollten aber noch präziser belegt oder differenziert werden.");
  }
  return uniqueStrings(groups);
}

function inferCommonGoodTensions(texts: readonly string[], sourceModel: SourceFactcheckFeedEnrichmentModel | null) {
  const tensions = [...(sourceModel?.commonGoodEvidenceNeeds ?? [])];
  const combined = lowerJoined(texts);
  if (
    containsPattern(combined, [
      /\b(gemeinwohl|öffentlich|allgemeinheit|public good|intérêt général)\b/i,
      /\b(kamusal yarar)\b/i,
      /(?:المصلحة العامة)/i,
    ])
  ) {
    tensions.unshift("Der Beitrag berührt einen möglichen Gemeinwohl- oder Zielkonflikt.");
  }
  return uniqueStrings(tensions);
}

function deriveHumanLoopNeeds(dialog: V3VoxyCocreationDialogModel | null) {
  if (!dialog) return [];
  return uniqueStrings(
    dialog.cards
      .filter((card) => card.status === "needs_user_input")
      .map((card) => card.userVisibleQuestion),
  );
}

function mapClaimItems(params: {
  claimTexts: string[];
  sourceNeeds: string[];
  factcheckQuestions: string[];
}): DossierWorkspaceClaimItem[] {
  const allText = lowerJoined(params.claimTexts);
  return uniqueStrings(params.claimTexts).map((text, index) => {
    const claimType = detectClaimType(text, allText);
    return {
      id: `claim-${index + 1}`,
      text,
      claimType,
      claimTypeLabel: claimTypeLabel(claimType),
      reviewNeed: `${claimTypeLabel(claimType)} bleibt reviewpflichtig.`,
      sourceNeed: params.sourceNeeds[0] ?? null,
      factcheckQuestion: params.factcheckQuestions[index] ?? params.factcheckQuestions[0] ?? null,
      reviewRequired: true,
    };
  });
}

function buildCounterposition(params: {
  counterpositionTexts: string[];
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
}) {
  if (params.counterpositionTexts.length > 0) {
    return {
      status: "present" as const,
      statusLabel: counterpositionStatusLabel("present"),
      summary: `${params.counterpositionTexts.length} Gegenposition(en) sind als Arbeitsstand sichtbar.`,
      reviewRequired: true as const,
    };
  }
  if ((params.sourceModel?.counterpositionNeeds.length ?? 0) > 0) {
    return {
      status: "needs_review" as const,
      statusLabel: counterpositionStatusLabel("needs_review"),
      summary: params.sourceModel?.counterpositionNeeds[0] ?? "Eine Gegenposition sollte noch vorbereitet werden.",
      reviewRequired: true as const,
    };
  }
  return {
    status: "missing" as const,
    statusLabel: counterpositionStatusLabel("missing"),
    summary: "Noch keine belastbare Gegenposition sichtbar.",
    reviewRequired: true as const,
  };
}

function resolveWorkspaceStatus(params: {
  sourceModel: SourceFactcheckFeedEnrichmentModel | null;
  humanLoopNeeds: string[];
  runtimeTruthMissing: boolean;
  providerBlocked: boolean;
  missingReview: boolean;
  claimItems: DossierWorkspaceClaimItem[];
}): DossierWorkspaceDecisionStatus {
  if (params.providerBlocked) return "blocked_by_provider";
  if (params.runtimeTruthMissing && !params.sourceModel) return "blocked_by_runtime_truth";
  if (params.humanLoopNeeds.length > 0) return "needs_human_input";
  if (
    params.sourceModel?.enrichmentStatus === "needs_source_review" ||
    (params.sourceModel?.sourceNeeds.length ?? 0) > 0
  ) {
    return "needs_source_review";
  }
  if (
    params.sourceModel?.enrichmentStatus === "needs_factcheck_review" ||
    (params.sourceModel?.factcheckQuestions.length ?? 0) > 0
  ) {
    return "needs_factcheck_review";
  }
  if (params.missingReview) return "blocked_by_missing_review";
  if (params.claimItems.length > 0) return "needs_editorial_review";
  if (params.runtimeTruthMissing) return "readmodel_only";
  return "decision_preview";
}

function resolveNextDecision(params: {
  humanLoopNeeds: string[];
  sourceNeeds: string[];
  counterposition: { status: DossierWorkspaceCounterpositionStatus; summary: string };
  claimItems: DossierWorkspaceClaimItem[];
  downstream: GenericSignalsInput["downstream"];
  runtimeTruthMissing: boolean;
}): { id: DossierWorkspaceNextDecision; label: string; reason: string } {
  if (params.runtimeTruthMissing && params.claimItems.length === 0) {
    return {
      id: "blocked",
      label: nextDecisionLabel("blocked"),
      reason: "Ohne belastbare Runtime- oder Review-Wahrheit bleibt der Dossier-Arbeitsstand blockiert.",
    };
  }
  if (params.humanLoopNeeds.length > 0) {
    return {
      id: "clarify_human_input",
      label: nextDecisionLabel("clarify_human_input"),
      reason: "Offene Human-Loop-Fragen sollten zuerst geklärt werden.",
    };
  }
  if (params.sourceNeeds.length > 0) {
    return {
      id: "request_sources",
      label: nextDecisionLabel("request_sources"),
      reason: "Belastbare Quellen oder Referenzen fehlen noch.",
    };
  }
  if (params.counterposition.status === "missing" || params.counterposition.status === "needs_review") {
    return {
      id: "prepare_counterposition",
      label: nextDecisionLabel("prepare_counterposition"),
      reason: "Eine Gegenposition oder Gegenstimme sollte noch vorbereitet werden.",
    };
  }
  if (params.claimItems.length > 0) {
    return {
      id: "review_claims",
      label: nextDecisionLabel("review_claims"),
      reason: "Die zentrale These und ihre Claims sollten vor Folgeschritten geprüft werden.",
    };
  }
  if (
    params.downstream.participation.status === "needs_review" ||
    params.downstream.poll.status === "needs_review"
  ) {
    return {
      id: "define_participation_scope",
      label: nextDecisionLabel("define_participation_scope"),
      reason: "Beteiligungsfrage, Scope oder Poll-Form sind noch nicht reif genug.",
    };
  }
  if (
    params.downstream.output.status === "prepared" ||
    params.downstream.social.status === "prepared" ||
    params.downstream.voxyBriefing.status === "prepared"
  ) {
    return {
      id: "prepare_dossier_brief",
      label: nextDecisionLabel("prepare_dossier_brief"),
      reason: "Ein strukturierter Dossier-Brief kann vorbereitet werden, ohne Veröffentlichung auszulösen.",
    };
  }
  return {
    id: "keep_as_draft",
    label: nextDecisionLabel("keep_as_draft"),
    reason: "Der Arbeitsstand kann vorerst als review-first Draft bestehen bleiben.",
  };
}

function buildModelFromSignals(input: GenericSignalsInput): DossierWorkspaceDecisionModel {
  const sourceNeeds = uniqueStrings(input.sourceModel?.sourceNeeds.map((entry) => entry.label) ?? []);
  const factcheckQuestions = uniqueStrings(
    input.sourceModel?.factcheckQuestions.map((entry) => entry.question) ?? [],
  );
  const claimItems = mapClaimItems({
    claimTexts: input.claimTexts,
    sourceNeeds,
    factcheckQuestions,
  });
  const counterposition = buildCounterposition({
    counterpositionTexts: input.counterpositionTexts,
    sourceModel: input.sourceModel,
  });
  const humanLoopNeeds = deriveHumanLoopNeeds(input.voxyDialog);
  const affectedGroups = inferAffectedGroups(input.claimTexts, input.sourceModel);
  const commonGoodTensions = inferCommonGoodTensions(input.claimTexts, input.sourceModel);
  const referenceScopes = (input.sourceModel?.referenceScopes ?? []).map((scope) => ({
    id: scope.id as DossierWorkspaceReferenceScope,
    label: scope.label,
    reason: scope.reason || referenceScopeReason(scope.id),
  }));
  const workspaceStatus = resolveWorkspaceStatus({
    sourceModel: input.sourceModel,
    humanLoopNeeds,
    runtimeTruthMissing: input.runtimeTruthMissing,
    providerBlocked: input.providerBlocked,
    missingReview: input.missingReview,
    claimItems,
  });
  const thesisText =
    normalizeText(input.thesisText) ||
    claimItems[0]?.text ||
    input.contributionRef?.title ||
    input.dossierRef?.title ||
    "Noch keine belastbare Kernthese sichtbar.";
  const nextDecision = resolveNextDecision({
    humanLoopNeeds,
    sourceNeeds,
    counterposition,
    claimItems,
    downstream: input.downstream,
    runtimeTruthMissing: input.runtimeTruthMissing,
  });

  return {
    title: "Dossier-Arbeitsstand",
    summary:
      "Dieser Layer strukturiert nur den nächsten review-first Entscheidungsbedarf. Er finalisiert kein Dossier und veröffentlicht nichts.",
    surface: input.surface,
    dossierRef: input.dossierRef ?? null,
    contributionRef: input.contributionRef ?? null,
    sourceLanguage: input.sourceLanguage,
    readingLanguage: input.readingLanguage,
    languageLabel: `Original: ${languageName(input.sourceLanguage)} · Lesefassung: ${languageName(input.readingLanguage)}${input.rtlDisplayHint ? " · RTL-Hinweis aktiv" : ""}`,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDisplayHint: input.rtlDisplayHint,
    workspaceStatus,
    workspaceStatusLabel: workspaceStatusLabel(workspaceStatus),
    thesis: {
      label: thesisText,
      confidence: input.thesisConfidence,
      confidenceLabel: thesisConfidenceLabel(input.thesisConfidence),
      reviewRequired: true,
    },
    counterposition,
    claimItems,
    openQuestions: uniqueStrings([
      ...input.openQuestions,
      ...humanLoopNeeds,
    ]),
    sourceNeeds,
    factcheckQuestions,
    affectedGroups,
    commonGoodTensions,
    referenceScopes,
    humanLoopNeeds,
    downstreamReadiness: [
      {
        id: "participation",
        label: "Beteiligung / Anlassraum",
        status: input.downstream.participation.status,
        statusLabel: downstreamStatusLabel(input.downstream.participation.status),
        reason: input.downstream.participation.reason,
        reviewRequired: true,
      },
      {
        id: "poll",
        label: "Poll / Frage",
        status: input.downstream.poll.status,
        statusLabel: downstreamStatusLabel(input.downstream.poll.status),
        reason: input.downstream.poll.reason,
        reviewRequired: true,
      },
      {
        id: "output",
        label: "Output-Entwurf",
        status: input.downstream.output.status,
        statusLabel: downstreamStatusLabel(input.downstream.output.status),
        reason: input.downstream.output.reason,
        reviewRequired: true,
      },
      {
        id: "social",
        label: "Social / Distribution",
        status: input.downstream.social.status,
        statusLabel: downstreamStatusLabel(input.downstream.social.status),
        reason: input.downstream.social.reason,
        reviewRequired: true,
      },
      {
        id: "voxyBriefing",
        label: "Voxy-Briefing",
        status: input.downstream.voxyBriefing.status,
        statusLabel: downstreamStatusLabel(input.downstream.voxyBriefing.status),
        reason: input.downstream.voxyBriefing.reason,
        reviewRequired: true,
      },
    ],
    nextDecision,
    publicSafeLabel: "Arbeitsstand, nicht veröffentlicht",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    reviewRequired: true,
    noPublishAction: true,
    noRuntimeClaim: true,
  };
}

export function buildDossierWorkspaceDecisionFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
): DossierWorkspaceDecisionModel | null {
  if (!model.hasPreview || !model.voxyCocreationDialog) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview(model);
  const claimTexts = [
    ...(model.sections.find((section) => section.kind === "claim")?.items.map((item) => item.title) ?? []),
  ];
  const counterpositionTexts =
    model.sections.find((section) => section.kind === "counter_position")?.items.map((item) => item.title) ?? [];
  const questionTexts =
    model.sections.find((section) => section.kind === "question")?.items.map((item) => item.title) ?? [];
  const hasPoll = (model.sections.find((section) => section.kind === "poll")?.items.length ?? 0) > 0;

  return buildModelFromSignals({
    surface: "create",
    contributionRef: model.voxyCocreationDialog.contributionRef,
    sourceLanguage: model.voxyCocreationDialog.sourceLanguage,
    readingLanguage: model.voxyCocreationDialog.readingLanguage,
    rtlDisplayHint: model.voxyCocreationDialog.rtl,
    thesisText: claimTexts[0] ?? model.title,
    thesisConfidence: claimTexts.length > 0 ? "explicit" : "inferred",
    claimTexts,
    counterpositionTexts,
    openQuestions: questionTexts,
    sourceModel,
    voxyDialog: model.voxyCocreationDialog,
    downstream: {
      participation: {
        status: hasPoll ? "prepared" : "needs_review",
        reason: hasPoll
          ? "Ein Beteiligungsformat ist vorbereitet, bleibt aber review-first."
          : "Für Beteiligung oder Anlassraum braucht es erst eine belastbare Fragestellung.",
      },
      poll: {
        status: hasPoll ? "prepared" : "needs_review",
        reason: hasPoll
          ? "Ein Poll-Kandidat ist sichtbar, aber noch nicht aktiviert."
          : "Ohne klare Frage und Review bleibt ein Poll blockiert.",
      },
      output: {
        status: "blocked",
        reason: "Output-Drafts entstehen erst nach späterem Dossier- und Review-Kontext.",
      },
      social: {
        status: "blocked",
        reason: "Social- oder Distributionspfade bleiben vor einer geprüften Dossier-Lesart blockiert.",
      },
      voxyBriefing: {
        status: "readmodel_only",
        reason: "Voxy-Briefing ist aus `/create` noch kein aktiver Folgepfad.",
      },
    },
    runtimeTruthMissing:
      model.providerRuntimeTruth === "missing_runtime_truth" ||
      model.reviewHandoff.persistenceTruth === "missing_persistence_truth",
    providerBlocked: false,
    missingReview: true,
    userVisibleReason:
      "Antworten, Quellen und Gegenpositionen verbessern spätere Dossier-Reife, finalisieren aber noch nichts.",
    reviewerVisibleReason:
      sourceModel?.reviewerVisibleReason ??
      "Der Create-Arbeitsstand bleibt eine Dossier-Vorschau ohne Runtime- oder Publish-Behauptung.",
    nextStep: "These, Gegenposition, Quellenbedarf und offene Fragen bewusst nachschärfen.",
  });
}

export function buildDossierWorkspaceDecisionFromReviewContext(
  context: V3ReviewQueueWiringContext | null | undefined,
  options?: {
    audience?: "admin" | "workspace";
    dossierRef?: DecisionRef | null;
    contributionRef?: DecisionRef | null;
  },
): DossierWorkspaceDecisionModel | null {
  if (!context?.languageBridge) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromReviewContext(context, {
    audience: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? null,
  });
  const voxyDialog = buildVoxyCocreationDialogFromReviewContext(context, {
    contributionRef: options?.contributionRef ?? null,
    surface: options?.audience === "workspace" ? "workspace" : "admin",
    maxCards: 4,
  });
  const claims = Array.isArray(context.dossierWorkspaceSurface?.sections.claims)
    ? context.dossierWorkspaceSurface?.sections.claims
    : [];
  const counters = Array.isArray(context.dossierWorkspaceSurface?.sections.counterPositions)
    ? context.dossierWorkspaceSurface?.sections.counterPositions
    : [];
  const questions = Array.isArray(context.dossierWorkspaceSurface?.sections.openQuestions)
    ? context.dossierWorkspaceSurface?.sections.openQuestions
    : [];
  const primaryTitle =
    normalizeText(options?.dossierRef?.title) ||
    normalizeText(context.dossierWorkspaceSurface?.title) ||
    normalizeText(options?.contributionRef?.title);
  const providerBlocked = Boolean(
    context.voxyRenderJob &&
      (context.voxyRenderJob.status === "blocked_by_provider" ||
        context.voxyRenderJob.status === "blocked_by_secret"),
  );
  const runtimeTruthMissing = Boolean(
    context.voxyRenderJob?.status === "blocked_by_runtime_truth" ||
      context.voxyPublishDraft?.status === "blocked_by_runtime_truth",
  );

  return buildModelFromSignals({
    surface: options?.audience === "workspace" ? "workspace" : "admin",
    dossierRef: options?.dossierRef ?? null,
    contributionRef: options?.contributionRef ?? null,
    sourceLanguage: context.languageBridge.original.language,
    readingLanguage: context.languageBridge.translation.language,
    rtlDisplayHint: Boolean(context.languageBridge.translation.rtl),
    thesisText: claims[0] ?? primaryTitle ?? null,
    thesisConfidence: claims.length > 0 ? "explicit" : primaryTitle ? "inferred" : "missing",
    claimTexts: claims,
    counterpositionTexts: counters,
    openQuestions: questions,
    sourceModel,
    voxyDialog,
    downstream: {
      participation: {
        status: context.participationCandidates.length > 0 ? "needs_review" : "readmodel_only",
        reason:
          context.participationCandidates.length > 0
            ? "Participation-Kandidaten sind sichtbar, brauchen aber Scope und Review."
            : "Noch kein belastbarer Participation-Folgepfad sichtbar.",
      },
      poll: {
        status:
          context.participationCandidates.some(
            (candidate) => candidate.candidateType === "poll_candidate",
          )
            ? "needs_review"
            : "readmodel_only",
        reason:
          context.participationCandidates.some(
            (candidate) => candidate.candidateType === "poll_candidate",
          )
            ? "Ein Poll-Kandidat braucht klare Frage, Optionen und Review."
            : "Noch kein Poll-Folgepfad sichtbar.",
      },
      output: {
        status: context.socialOutputDrafts.length > 0 ? "prepared" : "readmodel_only",
        reason:
          context.socialOutputDrafts.length > 0
            ? "Output-Drafts sind vorbereitet, aber nicht veröffentlicht."
            : "Noch kein Output-Draft sichtbar.",
      },
      social: {
        status: context.socialOutputDrafts.length > 0 ? "needs_review" : "readmodel_only",
        reason:
          context.socialOutputDrafts.length > 0
            ? "Social- oder Distributionspfade brauchen eine separate Freigabe."
            : "Kein Social- oder Distributionspfad aktiv.",
      },
      voxyBriefing: {
        status: context.voxyBriefing ? "needs_review" : "readmodel_only",
        reason:
          context.voxyBriefing
            ? "Voxy-Briefing bleibt Kandidat und braucht Skript-Review vor jeder Runtime."
            : "Noch kein Voxy-Briefing sichtbar.",
      },
    },
    runtimeTruthMissing,
    providerBlocked,
    missingReview: Boolean(context.primaryUnifiedItem || context.unifiedItems.length > 0),
    userVisibleReason:
      "Der Dossier-Arbeitsstand zeigt, welche Entscheidung als Nächstes nötig ist, ohne schon zu veröffentlichen oder freizugeben.",
    reviewerVisibleReason:
      sourceModel?.reviewerVisibleReason ??
      "Bestehender Review- und Workspace-Kontext bleibt ein Decision-Layer, keine Approval-Entscheidung.",
    nextStep:
      sourceModel?.nextStep ??
      "Review-Bedarf, Quellenlage und offene Dossier-Fragen bewusst weiterführen.",
  });
}

export function buildDossierWorkspaceDecisionFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    contributionRef?: DecisionRef | null;
    surface?: "account";
    nextStep?: string;
  },
): DossierWorkspaceDecisionModel | null {
  if (!dialog) return null;
  const sourceModel = buildSourceFactcheckFeedEnrichmentFromVoxyDialog(dialog, {
    surface: "account",
    nextStep:
      options?.nextStep ?? "Antworten und Quellen würden eine spätere Dossier-Reife verbessern.",
    runtimeTruthMissing: true,
  });

  return buildModelFromSignals({
    surface: "account",
    contributionRef: options?.contributionRef ?? dialog.contributionRef,
    sourceLanguage: dialog.sourceLanguage,
    readingLanguage: dialog.readingLanguage,
    rtlDisplayHint: dialog.rtl,
    thesisText: dialog.contributionRef?.title ?? null,
    thesisConfidence: dialog.contributionRef?.title ? "inferred" : "missing",
    claimTexts: dialog.contributionRef?.title ? [dialog.contributionRef.title] : [],
    counterpositionTexts: [],
    openQuestions: dialog.cards.map((card) => card.userVisibleQuestion),
    sourceModel,
    voxyDialog: dialog,
    downstream: {
      participation: {
        status: "readmodel_only",
        reason: "Ohne user-scoped Runtime-Wahrheit bleibt Beteiligung nur ein möglicher Folgepfad.",
      },
      poll: {
        status: "readmodel_only",
        reason: "Ein Poll entsteht hier noch nicht automatisch.",
      },
      output: {
        status: "blocked",
        reason: "Output- oder Dossier-Folgeschritte brauchen erst Review und weitere Wahrheit.",
      },
      social: {
        status: "blocked",
        reason: "Social- oder Distributionspfade bleiben ohne Review und Runtime blockiert.",
      },
      voxyBriefing: {
        status: "readmodel_only",
        reason: "Voxy bleibt hier nur Human-Loop und kein Render- oder Briefingpfad.",
      },
    },
    runtimeTruthMissing: true,
    providerBlocked: false,
    missingReview: true,
    userVisibleReason:
      "Dieser Arbeitsstand zeigt nur, was eine spätere Dossier-Reife verbessern würde.",
    reviewerVisibleReason:
      sourceModel?.reviewerVisibleReason ??
      "Account- und Resume-Arbeitsstände bleiben readmodel-only, solange keine belastbare Runtime existiert.",
    nextStep:
      options?.nextStep ?? "Mit Antworten, Quellen und Gegenpositionen den Arbeitsstand schärfen.",
  });
}

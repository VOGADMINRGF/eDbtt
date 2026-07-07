import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type {
  CanonicalSourcePackSourceType,
} from "@/features/create/canonicalSourcePackContract";
import {
  buildV3ReviewContextSummaryModel,
} from "@/features/create/V3ReviewContextSummary";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type {
  V3VoxyCocreationDialogModel,
} from "@/features/create/voxyCocreationDialogContract";
import {
  buildVoxyCocreationDialogFromReviewContext,
} from "@/features/create/voxyCocreationDialogContract";

export const SOURCE_FACTCHECK_FEED_ENRICHMENT_STATUSES = [
  "readmodel_only",
  "prepared",
  "needs_source_review",
  "needs_factcheck_review",
  "needs_feed_review",
  "blocked_by_provider",
  "blocked_by_runtime_truth",
  "blocked_by_cost_preflight",
] as const;

export type SourceFactcheckFeedEnrichmentStatus =
  (typeof SOURCE_FACTCHECK_FEED_ENRICHMENT_STATUSES)[number];

export const SOURCE_FACTCHECK_SOURCE_NEEDS = [
  "primary_source",
  "official_source",
  "local_reference",
  "media_reference",
  "scientific_reference",
  "legal_or_policy_reference",
  "international_comparison",
  "lived_experience",
  "statistical_context",
] as const;

export type SourceFactcheckSourceNeed =
  (typeof SOURCE_FACTCHECK_SOURCE_NEEDS)[number];

export const SOURCE_FACTCHECK_CLAIM_REVIEW_NEEDS = [
  "factual_claim",
  "normative_claim",
  "causal_claim",
  "forecast_claim",
  "personal_experience",
  "contested_claim",
  "unclear_claim",
] as const;

export type SourceFactcheckClaimReviewNeed =
  (typeof SOURCE_FACTCHECK_CLAIM_REVIEW_NEEDS)[number];

export const SOURCE_FACTCHECK_REFERENCE_SCOPES = [
  "local",
  "regional",
  "national",
  "eu",
  "global",
  "multilingual",
] as const;

export type SourceFactcheckReferenceScope =
  (typeof SOURCE_FACTCHECK_REFERENCE_SCOPES)[number];

type EnrichmentSurface = "create" | "account" | "admin" | "workspace";

type ContributionRef = {
  id: string;
  title: string;
  href?: string | null;
};

type NeedTag<T extends string> = {
  id: T;
  label: string;
  reason: string;
  reviewRequired: true;
};

export type SourceFactcheckQuestion = {
  id: string;
  question: string;
  reason: string;
  reviewRequired: true;
};

export type SourceFactcheckFeedHint = {
  id: string;
  label: string;
  reason: string;
  status: "prepared" | "blocked";
  blockerLabel: string | null;
  reviewRequired: true;
};

export type SourceFactcheckFeedEnrichmentModel = {
  title: string;
  summary: string;
  surface: EnrichmentSurface;
  contributionRef: ContributionRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  languageLabel: string;
  originalPreserved: true;
  translationIsEvidence: false;
  translationAvailable: boolean;
  rtlDisplayHint: boolean;
  enrichmentStatus: SourceFactcheckFeedEnrichmentStatus;
  statusLabel: string;
  sourceNeeds: NeedTag<SourceFactcheckSourceNeed>[];
  claimReviewNeeds: NeedTag<SourceFactcheckClaimReviewNeed>[];
  referenceScopes: NeedTag<SourceFactcheckReferenceScope>[];
  factcheckQuestions: SourceFactcheckQuestion[];
  feedHints: SourceFactcheckFeedHint[];
  counterpositionNeeds: string[];
  affectedGroupEvidenceNeeds: string[];
  commonGoodEvidenceNeeds: string[];
  publicSafeLabel: string;
  userVisibleReason: string;
  reviewerVisibleReason: string;
  nextStep: string;
  reviewRequired: true;
  noSourceInvented: true;
  noFactcheckResult: true;
  noProviderRun: true;
};

type BuildSignalsInput = {
  surface: EnrichmentSurface;
  contributionRef?: ContributionRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  translationAvailable: boolean;
  rtlDisplayHint: boolean;
  texts: string[];
  openQuestions: string[];
  voxyModes: string[];
  sourceTypes: string[];
  sourceGapKeys: string[];
  feedSourceTypes: string[];
  providerBlocked: boolean;
  runtimeTruthMissing: boolean;
  costBlocked: boolean;
  claimCount: number;
  counterPositionCount: number;
  questionCount: number;
  sourcePresent: boolean;
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

function lowerJoined(values: readonly string[]): string {
  return values.map((value) => value.toLowerCase()).join(" ");
}

function containsPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function isRtlLanguage(language: string): boolean {
  return ["ar", "fa", "he", "ur"].includes(normalizeText(language).toLowerCase());
}

function languageLabel(language: string): string {
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

function statusLabel(value: SourceFactcheckFeedEnrichmentStatus): string {
  if (value === "prepared") return "Vorbereitet";
  if (value === "needs_source_review") return "Quellenprüfung offen";
  if (value === "needs_factcheck_review") return "Faktencheck-Fragen offen";
  if (value === "needs_feed_review") return "Feed-/Research-Hinweis offen";
  if (value === "blocked_by_provider") return "Provider blockiert";
  if (value === "blocked_by_cost_preflight") return "Kosten-/Providerprüfung offen";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  return "Nur Readmodel";
}

function sourceNeedLabel(value: SourceFactcheckSourceNeed): string {
  if (value === "primary_source") return "Primärquelle sinnvoll";
  if (value === "official_source") return "Amtliche Quelle sinnvoll";
  if (value === "local_reference") return "Lokale Referenz sinnvoll";
  if (value === "media_reference") return "Medienquelle sinnvoll";
  if (value === "scientific_reference") return "Wissenschaftliche Quelle sinnvoll";
  if (value === "legal_or_policy_reference") return "Rechts- oder Policy-Referenz sinnvoll";
  if (value === "international_comparison") return "Internationaler Vergleich sinnvoll";
  if (value === "lived_experience") return "Erfahrungsbericht sinnvoll";
  return "Statistischer Kontext sinnvoll";
}

function claimNeedLabel(value: SourceFactcheckClaimReviewNeed): string {
  if (value === "factual_claim") return "Tatsachenbehauptung prüfen";
  if (value === "normative_claim") return "Normative Aussage sauber trennen";
  if (value === "causal_claim") return "Kausalbehauptung prüfen";
  if (value === "forecast_claim") return "Prognose transparent prüfen";
  if (value === "personal_experience") return "Erfahrung als Erfahrung markieren";
  if (value === "contested_claim") return "Umstrittene Aussage einordnen";
  return "Aussage präzisieren";
}

function referenceScopeLabel(value: SourceFactcheckReferenceScope): string {
  if (value === "local") return "Lokaler Vergleich";
  if (value === "regional") return "Regionaler Vergleich";
  if (value === "national") return "Nationaler Vergleich";
  if (value === "eu") return "EU-Vergleich";
  if (value === "global") return "Weltweiter Vergleich";
  return "Mehrsprachiger Vergleich";
}

function feedSourceLabel(value: string): string {
  if (value === "feed_candidate") return "Feed-Hinweis vorbereitet";
  if (value === "material_candidate") return "Materialhinweis vorbereitet";
  if (value === "evidence_candidate") return "Evidenzhinweis vorbereitet";
  if (value === "source_candidate") return "Quellenhinweis vorbereitet";
  return "Research-Hinweis vorbereitet";
}

function sourceTypeToNeed(
  value: string,
): SourceFactcheckSourceNeed | null {
  if (value === "source_candidate" || value === "feed_candidate") {
    return "media_reference";
  }
  if (value === "material_candidate") return "media_reference";
  if (value === "evidence_candidate") return "primary_source";
  const sourceType = value as CanonicalSourcePackSourceType;
  if (sourceType === "official") return "official_source";
  if (sourceType === "media") return "media_reference";
  if (sourceType === "academic") return "scientific_reference";
  if (sourceType === "civil_society") return "lived_experience";
  if (sourceType === "user_supplied") return "primary_source";
  return null;
}

function addNeed<T extends string>(
  target: NeedTag<T>[],
  seen: Set<string>,
  id: T,
  reason: string,
  labelFn: (value: T) => string,
) {
  if (seen.has(id)) return;
  seen.add(id);
  target.push({
    id,
    label: labelFn(id),
    reason,
    reviewRequired: true,
  });
}

function extractReferenceScopes(texts: readonly string[], voxyModes: readonly string[]) {
  const combined = lowerJoined(texts);
  const scopes: Array<{
    id: SourceFactcheckReferenceScope;
    reason: string;
  }> = [];

  if (
    containsPattern(combined, [
      /\b(kiez|bezirk|stadtteil|quartier|kommune|gemeinde|stadt|local|city|district|neighborhood)\b/i,
      /\b(mahalle|belediye|şehir)\b/i,
      /(?:حي|بلدية|مدينة)/i,
    ])
  ) {
    scopes.push({
      id: "local",
      reason: "Der Beitrag hat einen klaren lokalen oder städtischen Bezug.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(region|regional|bundesland|landkreis|county)\b/i,
      /\b(bölgesel)\b/i,
      /(?:إقليمي)/i,
    ])
  ) {
    scopes.push({
      id: "regional",
      reason: "Ein regionaler Vergleich kann helfen, Muster und Zuständigkeiten zu prüfen.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(deutschland|bund|national|nationwide|country|france|turkey|türkei)\b/i,
      /\b(ulusal)\b/i,
      /(?:وطني)/i,
    ])
  ) {
    scopes.push({
      id: "national",
      reason: "Der Beitrag berührt eine nationale Ebene oder landesweite Zuständigkeit.",
    });
  }
  if (
    containsPattern(combined, [/\b(eu|europa|europe|union européenne)\b/i, /(?:الاتحاد الأوروبي|أوروبا)/i])
  ) {
    scopes.push({
      id: "eu",
      reason: "Ein EU-Vergleich könnte Regellage oder Beispiele besser einordnen.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(global|welt|world|worldwide|international)\b/i,
      /\b(dünya)\b/i,
      /(?:عالمي)/i,
    ])
  ) {
    scopes.push({
      id: "global",
      reason: "Ein weltweiter Vergleich könnte die Vergleichsrichtung schärfen.",
    });
  }

  if (voxyModes.includes("local_global_context") && scopes.length === 0) {
    scopes.push({
      id: "local",
      reason: "Der Vergleichsraum ist noch offen und sollte lokal geklärt werden.",
    });
    scopes.push({
      id: "global",
      reason: "Der Beitrag deutet einen offenen Vergleichsraum jenseits der lokalen Ebene an.",
    });
  }

  return scopes;
}

function inferClaimReviewNeeds(params: {
  texts: string[];
  counterPositionCount: number;
  openQuestions: string[];
  sourceGapKeys: string[];
}): Array<{
  id: SourceFactcheckClaimReviewNeed;
  reason: string;
}> {
  const combined = lowerJoined(params.texts);
  const results: Array<{
    id: SourceFactcheckClaimReviewNeed;
    reason: string;
  }> = [];

  if (
    containsPattern(combined, [
      /\b(ist|sind|war|waren|gibt|gibt es|there is|there are|are|is|fait|sont)\b/i,
      /\b\d{1,4}([.,]\d+)?\b/,
    ])
  ) {
    results.push({
      id: "factual_claim",
      reason: "Der Text enthält eine Tatsachenbehauptung oder überprüfbare Größenordnung.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(sollte|sollten|muss|müssen|should|must|faut|doit|olmalı|gerekir)\b/i,
      /(?:يجب|ينبغي)/i,
    ])
  ) {
    results.push({
      id: "normative_claim",
      reason: "Normative Forderungen sollten sauber von überprüfbaren Tatsachen getrennt bleiben.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(weil|dadurch|führt zu|verursacht|because|causes|lead to|entraîne|cause|neden olur)\b/i,
      /(?:يسبب|يؤدي إلى)/i,
    ])
  ) {
    results.push({
      id: "causal_claim",
      reason: "Der Beitrag stellt eine Ursache-Wirkungs-Beziehung in den Raum.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(wird|werden|künftig|prognose|future|will|forecast|prévision|olacak)\b/i,
      /(?:سوف|مستقبلاً)/i,
    ])
  ) {
    results.push({
      id: "forecast_claim",
      reason: "Zukünftige Entwicklungen sollten als Prognose gekennzeichnet und prüfbar gemacht werden.",
    });
  }
  if (
    containsPattern(combined, [
      /\b(ich|wir|meine erfahrung|unsere erfahrung|i |we |experience|expérience|ben|biz)\b/i,
      /(?:أنا|نحن|تجربة)/i,
    ])
  ) {
    results.push({
      id: "personal_experience",
      reason: "Erfahrungsberichte bleiben wertvoll, aber nicht automatisch repräsentative Evidenz.",
    });
  }
  if (
    params.counterPositionCount > 0 ||
    params.sourceGapKeys.some((value) =>
      ["contested", "counterposition_needed"].includes(value),
    )
  ) {
    results.push({
      id: "contested_claim",
      reason: "Es gibt erkennbare Gegenpositionen oder offene Einwände, die getrennt sichtbar bleiben sollten.",
    });
  }
  if (params.openQuestions.length > 0 || params.sourceGapKeys.length > 0) {
    results.push({
      id: "unclear_claim",
      reason: "Offene Fragen oder Quellenlücken machen Teile des Beitrags noch unklar.",
    });
  }
  if (results.length === 0) {
    results.push({
      id: "unclear_claim",
      reason: "Ohne belastbare Einordnung bleibt der Prüfbedarf bewusst offen.",
    });
  }
  return results;
}

function buildFactcheckQuestions(
  texts: readonly string[],
  openQuestions: readonly string[],
  claimNeeds: readonly NeedTag<SourceFactcheckClaimReviewNeed>[],
): SourceFactcheckQuestion[] {
  const uniqueQuestions = uniqueStrings([
    ...openQuestions,
    ...texts
      .filter(Boolean)
      .slice(0, 3)
      .map((text) => `Woran lässt sich prüfen: „${normalizeText(text)}“?`),
  ]);

  return uniqueQuestions.slice(0, 4).map((question, index) => ({
    id: `factcheck-question-${index + 1}`,
    question,
    reason:
      claimNeeds[0]?.label ??
      "Die Frage bereitet nur eine spätere Prüfung vor und behauptet noch kein Ergebnis.",
    reviewRequired: true,
  }));
}

function buildFeedHints(params: {
  feedSourceTypes: string[];
  runtimeTruthMissing: boolean;
  providerBlocked: boolean;
  costBlocked: boolean;
  surface: EnrichmentSurface;
}): SourceFactcheckFeedHint[] {
  const hints: SourceFactcheckFeedHint[] = [];
  const uniqueTypes = uniqueStrings(params.feedSourceTypes).slice(0, 3);

  uniqueTypes.forEach((type, index) => {
    hints.push({
      id: `feed-hint-${index + 1}`,
      label: feedSourceLabel(type),
      reason:
        "Der Hinweis bleibt vorbereitet und wird weder als Feed-Treffer noch als verifizierte Quelle ausgegeben.",
      status: "prepared",
      blockerLabel: null,
      reviewRequired: true,
    });
  });

  if (params.providerBlocked) {
    hints.push({
      id: "feed-hint-provider-blocked",
      label: "Feed-/Research-Hinweis blockiert",
      reason: "Eine echte Provider- oder Feed-Ausführung ist in diesem Slice bewusst nicht aktiv.",
      status: "blocked",
      blockerLabel: "Anbieter-Anbindung fehlt",
      reviewRequired: true,
    });
  } else if (params.costBlocked) {
    hints.push({
      id: "feed-hint-cost-blocked",
      label: "Feed-/Research-Hinweis blockiert",
      reason: "Ein möglicher Feed- oder Research-Lauf bleibt an einer Kosten- oder Anbieterprüfung hängen.",
      status: "blocked",
      blockerLabel: "Kosten-/Anbieterprüfung offen",
      reviewRequired: true,
    });
  } else if (uniqueTypes.length === 0) {
    hints.push({
      id: "feed-hint-runtime-only",
      label:
        params.surface === "account"
          ? "Feed-/Research-Hinweis nur als Arbeitsstand"
          : "Feed-/Research-Hinweis vorbereitet",
      reason:
        params.runtimeTruthMissing
          ? "Ohne bestehende Runtime-Wahrheit bleibt der Hinweis bewusst readmodel-only."
          : "Der Hinweis ist nur vorbereitet und startet keine Recherche.",
      status: params.runtimeTruthMissing ? "blocked" : "prepared",
      blockerLabel: params.runtimeTruthMissing ? "Belastbare Runtime-Wahrheit fehlt" : null,
      reviewRequired: true,
    });
  }

  return hints;
}

function buildModelFromSignals(input: BuildSignalsInput): SourceFactcheckFeedEnrichmentModel {
  const combinedText = lowerJoined(input.texts);
  const sourceNeeds: NeedTag<SourceFactcheckSourceNeed>[] = [];
  const claimReviewNeeds: NeedTag<SourceFactcheckClaimReviewNeed>[] = [];
  const referenceScopes: NeedTag<SourceFactcheckReferenceScope>[] = [];
  const sourceSeen = new Set<string>();
  const claimSeen = new Set<string>();
  const scopeSeen = new Set<string>();

  if (!input.sourcePresent || input.sourceGapKeys.some((value) => value.includes("source"))) {
    addNeed(
      sourceNeeds,
      sourceSeen,
      "primary_source",
      "Für diesen Beitrag ist noch keine belastbare Primärquelle sichtbar.",
      sourceNeedLabel,
    );
  }

  input.sourceTypes.forEach((sourceType) => {
    const mapped = sourceTypeToNeed(sourceType);
    if (!mapped) return;
    addNeed(
      sourceNeeds,
      sourceSeen,
      mapped,
      "Bestehende Hinweise legen diesen Quellentyp nahe, ohne ihn als geprüft auszugeben.",
      sourceNeedLabel,
    );
  });

  if (
    containsPattern(combinedText, [
      /\b(gesetz|verordnung|satzung|richtlinie|policy|law|legal|droit|politique)\b/i,
      /\b(yasa|yönetmelik|politika)\b/i,
      /(?:قانون|لائحة|سياسة)/i,
    ])
  ) {
    addNeed(
      sourceNeeds,
      sourceSeen,
      "legal_or_policy_reference",
      "Der Beitrag berührt Regeln, Zuständigkeiten oder Policy-Fragen.",
      sourceNeedLabel,
    );
  }

  if (
    containsPattern(combinedText, [
      /\b(studie|studien|wissenschaft|forschung|study|research|étude|recherche)\b/i,
      /\b(araştırma|çalışma)\b/i,
      /(?:دراسة|بحث)/i,
    ])
  ) {
    addNeed(
      sourceNeeds,
      sourceSeen,
      "scientific_reference",
      "Der Text berührt Erkenntnisse, die eher wissenschaftlich eingeordnet werden sollten.",
      sourceNeedLabel,
    );
  }

  if (
    containsPattern(combinedText, [
      /\b(zahl|zahlen|statistik|quote|rate|trend|data|stats|statistique)\b/i,
      /\b(istatistik|oran|veri)\b/i,
      /(?:إحصاء|بيانات|نسبة)/i,
    ])
  ) {
    addNeed(
      sourceNeeds,
      sourceSeen,
      "statistical_context",
      "Numerische oder statistische Aussagen brauchen Kontext und Vergleichsbasis.",
      sourceNeedLabel,
    );
  }

  if (
    input.voxyModes.includes("affected_groups_probe") ||
    containsPattern(combinedText, [
      /\b(menschen|anwohner|familien|kinder|mieter|schüler|people|residents|families|children)\b/i,
      /\b(insanlar|aileler|çocuklar|öğrenciler)\b/i,
      /(?:السكان|العائلات|الأطفال|الطلاب)/i,
    ])
  ) {
    addNeed(
      sourceNeeds,
      sourceSeen,
      "lived_experience",
      "Betroffene Perspektiven sollten als eigene Evidenzform sichtbar werden.",
      sourceNeedLabel,
    );
  }

  extractReferenceScopes(input.texts, input.voxyModes).forEach((entry) => {
    addNeed(referenceScopes, scopeSeen, entry.id, entry.reason, referenceScopeLabel);
  });

  referenceScopes.forEach((scope) => {
    if (scope.id === "local" || scope.id === "regional") {
      addNeed(
        sourceNeeds,
        sourceSeen,
        "local_reference",
        "Ein lokaler oder regionaler Vergleich kann den Beitrag belastbarer machen.",
        sourceNeedLabel,
      );
    }
    if (scope.id === "eu" || scope.id === "global") {
      addNeed(
        sourceNeeds,
        sourceSeen,
        "international_comparison",
        "Ein Vergleich über die lokale Ebene hinaus könnte den Beitrag besser einordnen.",
        sourceNeedLabel,
      );
    }
  });

  if (
    normalizeText(input.sourceLanguage).toLowerCase() !==
    normalizeText(input.readingLanguage).toLowerCase()
  ) {
    addNeed(
      referenceScopes,
      scopeSeen,
      "multilingual",
      "Originalsprache und Lesesprache bleiben getrennt und brauchen eigene Quellenprüfung.",
      referenceScopeLabel,
    );
  }

  inferClaimReviewNeeds({
    texts: input.texts,
    counterPositionCount: input.counterPositionCount,
    openQuestions: input.openQuestions,
    sourceGapKeys: input.sourceGapKeys,
  }).forEach((entry) => {
    addNeed(claimReviewNeeds, claimSeen, entry.id, entry.reason, claimNeedLabel);
  });

  const counterpositionNeeds =
    input.counterPositionCount > 0
      ? []
      : ["Noch keine belastbare Gegenposition sichtbar."];
  if (input.voxyModes.includes("counterposition_probe")) {
    counterpositionNeeds.unshift(
      "Eine Gegenposition oder Gegenstimme sollte getrennt vorbereitet werden.",
    );
  }

  const affectedGroupEvidenceNeeds: string[] = [];
  if (
    input.voxyModes.includes("affected_groups_probe") ||
    sourceNeeds.some((entry) => entry.id === "lived_experience")
  ) {
    affectedGroupEvidenceNeeds.push(
      "Betroffene Gruppen sollten mit eigener Beobachtung oder Perspektive sichtbar werden.",
    );
  }

  const commonGoodEvidenceNeeds: string[] = [];
  if (
    input.voxyModes.includes("common_good_reflection") ||
    containsPattern(combinedText, [
      /\b(gemeinwohl|öffentlich|allgemeinheit|public good|intérêt général)\b/i,
      /\b(kamusal yarar)\b/i,
      /(?:المصلحة العامة)/i,
    ])
  ) {
    commonGoodEvidenceNeeds.push(
      "Gemeinwohlkonflikte oder Zielkonflikte sollten ausdrücklich belegt oder erläutert werden.",
    );
  }

  const factcheckQuestions = buildFactcheckQuestions(
    input.texts,
    input.openQuestions,
    claimReviewNeeds,
  );
  const feedHints = buildFeedHints({
    feedSourceTypes: input.feedSourceTypes,
    runtimeTruthMissing: input.runtimeTruthMissing,
    providerBlocked: input.providerBlocked,
    costBlocked: input.costBlocked,
    surface: input.surface,
  });

  let enrichmentStatus: SourceFactcheckFeedEnrichmentStatus = "prepared";
  if (input.providerBlocked) {
    enrichmentStatus = "blocked_by_provider";
  } else if (input.costBlocked) {
    enrichmentStatus = "blocked_by_cost_preflight";
  } else if (input.surface === "account" && !input.sourcePresent && input.runtimeTruthMissing) {
    enrichmentStatus = "readmodel_only";
  } else if (input.runtimeTruthMissing && sourceNeeds.length === 0 && feedHints.length === 0) {
    enrichmentStatus = "blocked_by_runtime_truth";
  } else if (sourceNeeds.length > 0) {
    enrichmentStatus = "needs_source_review";
  } else if (factcheckQuestions.length > 0) {
    enrichmentStatus = "needs_factcheck_review";
  } else if (feedHints.length > 0) {
    enrichmentStatus = "needs_feed_review";
  }

  const rtlDisplayHint = input.rtlDisplayHint || isRtlLanguage(input.sourceLanguage);
  const languageLine = `Original: ${languageLabel(input.sourceLanguage)} · Lesefassung: ${languageLabel(input.readingLanguage)}${rtlDisplayHint ? " · RTL-Hinweis aktiv" : ""}`;

  return {
    title: "Quellen & Faktencheck vorbereiten",
    summary:
      "Dieser Block bereitet nur Quellenbedarf, Faktencheck-Fragen, Vergleichsräume und Feed-Hinweise vor. Es startet weder Recherche noch Faktencheck noch Veröffentlichung.",
    surface: input.surface,
    contributionRef: input.contributionRef ?? null,
    sourceLanguage: input.sourceLanguage,
    readingLanguage: input.readingLanguage,
    languageLabel: languageLine,
    originalPreserved: true,
    translationIsEvidence: false,
    translationAvailable: input.translationAvailable,
    rtlDisplayHint,
    enrichmentStatus,
    statusLabel: statusLabel(enrichmentStatus),
    sourceNeeds,
    claimReviewNeeds,
    referenceScopes,
    factcheckQuestions,
    feedHints,
    counterpositionNeeds: uniqueStrings(counterpositionNeeds),
    affectedGroupEvidenceNeeds: uniqueStrings(affectedGroupEvidenceNeeds),
    commonGoodEvidenceNeeds: uniqueStrings(commonGoodEvidenceNeeds),
    publicSafeLabel:
      "Noch nicht recherchiert · noch nicht geprüft · keine Quelle erfunden",
    userVisibleReason: input.userVisibleReason,
    reviewerVisibleReason: input.reviewerVisibleReason,
    nextStep: input.nextStep,
    reviewRequired: true,
    noSourceInvented: true,
    noFactcheckResult: true,
    noProviderRun: true,
  };
}

export function buildSourceFactcheckFeedEnrichmentFromVoxyDialog(
  dialog: V3VoxyCocreationDialogModel | null | undefined,
  options?: {
    surface?: "create" | "account" | "workspace";
    userVisibleReason?: string;
    reviewerVisibleReason?: string;
    nextStep?: string;
    runtimeTruthMissing?: boolean;
  },
): SourceFactcheckFeedEnrichmentModel | null {
  if (!dialog) return null;
  const runtimeTruthMissing =
    options?.runtimeTruthMissing !== undefined
      ? options.runtimeTruthMissing
      : dialog.status === "blocked_by_runtime_truth" ||
        dialog.status === "readmodel_only";
  return buildModelFromSignals({
    surface: options?.surface ?? "account",
    contributionRef: dialog.contributionRef,
    sourceLanguage: dialog.sourceLanguage,
    readingLanguage: dialog.readingLanguage,
    translationAvailable: dialog.translationAvailable,
    rtlDisplayHint: dialog.rtl,
    texts: uniqueStrings([
      dialog.contributionRef?.title,
      ...dialog.cards.map((card) => card.userVisibleQuestion),
    ]),
    openQuestions: dialog.cards
      .filter((card) => card.promptType === "question" || card.promptType === "reference_need")
      .map((card) => card.userVisibleQuestion),
    voxyModes: dialog.cards.map((card) => card.dialogueMode),
    sourceTypes: [],
    sourceGapKeys: dialog.cards.map((card) => card.status),
    feedSourceTypes: [],
    providerBlocked: false,
    runtimeTruthMissing,
    costBlocked: false,
    claimCount: dialog.cards.filter((card) => card.dialogueMode === "contribution_clarification").length,
    counterPositionCount: dialog.cards.filter((card) => card.dialogueMode === "counterposition_probe").length,
    questionCount: dialog.cards.length,
    sourcePresent: false,
    nextStep:
      options?.nextStep ??
      dialog.cards[0]?.nextStep ??
      "Quellenlage und offene Prüfhinweise bewusst weiterführen.",
    userVisibleReason:
      options?.userVisibleReason ??
      "Der Arbeitsstand zeigt nur vorbereiteten Quellen- und Faktencheckbedarf.",
    reviewerVisibleReason:
      options?.reviewerVisibleReason ??
      "Dieser Pfad bleibt ein ehrlicher Handoff-Layer ohne Recherche- oder Providerlauf.",
  });
}

export function buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
): SourceFactcheckFeedEnrichmentModel | null {
  if (!model.hasPreview || !model.voxyCocreationDialog) return null;
  const texts = model.sections
    .flatMap((section) => section.items)
    .map((item) => item.title);
  const openQuestions = model.sections
    .filter((section) => section.kind === "question")
    .flatMap((section) => section.items)
    .map((item) => item.title);

  return buildModelFromSignals({
    surface: "create",
    contributionRef: model.voxyCocreationDialog.contributionRef,
    sourceLanguage: model.voxyCocreationDialog.sourceLanguage,
    readingLanguage: model.voxyCocreationDialog.readingLanguage,
    translationAvailable: model.voxyCocreationDialog.translationAvailable,
    rtlDisplayHint: model.voxyCocreationDialog.rtl,
    texts,
    openQuestions,
    voxyModes: model.voxyCocreationDialog.cards.map((card) => card.dialogueMode),
    sourceTypes: model.feedEnrichmentSuggestions.items.map((item) => item.sourceType),
    sourceGapKeys: uniqueStrings([
      ...model.feedEnrichmentSuggestions.items.flatMap((item) => item.missingRuntimeTruth),
      ...(model.providerRuntimeTruth === "missing_runtime_truth"
        ? ["missing_runtime_truth"]
        : []),
    ]),
    feedSourceTypes: model.feedEnrichmentSuggestions.items.map((item) => item.sourceType),
    providerBlocked: false,
    runtimeTruthMissing:
      model.providerRuntimeTruth === "missing_runtime_truth" ||
      model.feedEnrichmentSuggestions.items.some((item) => item.missingRuntimeTruth.length > 0),
    costBlocked: false,
    claimCount: model.sections.find((section) => section.kind === "claim")?.items.length ?? 0,
    counterPositionCount:
      model.sections.find((section) => section.kind === "counter_position")?.items.length ?? 0,
    questionCount: openQuestions.length,
    sourcePresent:
      model.feedEnrichmentSuggestions.items.some((item) => item.sourceType !== "missing_source_truth"),
    nextStep: "Review-Handoff prüfen oder zuerst Quellenbedarf und Gegenpositionen schärfen.",
    userVisibleReason:
      "Die Candidate-Preview zeigt, welche Quellen, Prüfpfade und Vergleichsräume noch fehlen könnten.",
    reviewerVisibleReason:
      "Feed-Hinweise bleiben readmodel-first und dürfen weder Recherche noch Factcheck-Ergebnis vortäuschen.",
  });
}

function extractWorkspaceTexts(context: V3ReviewQueueWiringContext): string[] {
  const sections = context.dossierWorkspaceSurface?.sections;
  const claims = Array.isArray(sections?.claims) ? sections?.claims : [];
  const questions = Array.isArray(sections?.openQuestions) ? sections?.openQuestions : [];
  const counters = Array.isArray(sections?.counterPositions)
    ? sections?.counterPositions
    : [];
  return uniqueStrings([
    ...claims.map((entry: unknown) =>
      typeof entry === "string" ? entry : normalizeText((entry as { text?: string }).text),
    ),
    ...questions.map((entry: unknown) =>
      typeof entry === "string" ? entry : normalizeText((entry as { text?: string; question?: string }).text ?? (entry as { question?: string }).question),
    ),
    ...counters.map((entry: unknown) =>
      typeof entry === "string" ? entry : normalizeText((entry as { text?: string }).text),
    ),
  ]);
}

function countSectionEntries(value: unknown[] | undefined): number {
  return Array.isArray(value) ? value.length : 0;
}

export function buildSourceFactcheckFeedEnrichmentFromReviewContext(
  context: V3ReviewQueueWiringContext | null | undefined,
  options?: {
    audience?: "admin" | "workspace";
    contributionRef?: ContributionRef | null;
  },
): SourceFactcheckFeedEnrichmentModel | null {
  if (!context?.languageBridge) return null;
  const summary = buildV3ReviewContextSummaryModel(
    context,
    options?.audience === "workspace" ? "workspace" : "admin",
  );
  const voxyDialog = buildVoxyCocreationDialogFromReviewContext(context, {
    contributionRef: options?.contributionRef ?? null,
    surface: options?.audience === "workspace" ? "workspace" : "admin",
    maxCards: 4,
  });
  const sourcePack = context.sourcePack;
  const items = context.primaryUnifiedItem
    ? [context.primaryUnifiedItem, ...context.unifiedItems]
    : context.unifiedItems;
  const texts = extractWorkspaceTexts(context);
  const providerBlocked = Boolean(
    context.voxyRenderJob &&
      (context.voxyRenderJob.status === "blocked_by_provider" ||
        context.voxyRenderJob.status === "blocked_by_secret"),
  );
  const runtimeTruthMissing = Boolean(
    context.voxyRenderJob?.status === "blocked_by_runtime_truth" ||
      context.voxyPublishDraft?.status === "blocked_by_runtime_truth" ||
      summary.blockerLabels.some((label) =>
        lowerJoined([label]).includes("laufzeit") ||
        lowerJoined([label]).includes("runtime"),
      ),
  );

  return buildModelFromSignals({
    surface: options?.audience === "workspace" ? "workspace" : "admin",
    contributionRef: options?.contributionRef ?? voxyDialog?.contributionRef ?? null,
    sourceLanguage: context.languageBridge.original.language,
    readingLanguage:
      context.multilingualThread?.readingLocale ??
      context.languageBridge.translation.language ??
      context.languageBridge.summary.language,
    translationAvailable: Boolean(context.languageBridge.translation.text),
    rtlDisplayHint:
      Boolean(context.languageBridge.translation.rtl) ||
      isRtlLanguage(context.languageBridge.original.language),
    texts,
    openQuestions: context.languageBridge.openQuestions,
    voxyModes: voxyDialog?.cards.map((card) => card.dialogueMode) ?? [],
    sourceTypes: sourcePack?.sources.map((source) => source.sourceType) ?? [],
    sourceGapKeys: uniqueStrings([
      ...(sourcePack?.openGaps ?? []),
      ...(context.multilingualEvidence?.overallUncertaintyReasons ?? []),
      ...(providerBlocked ? ["blocked_by_provider"] : []),
      ...(runtimeTruthMissing ? ["blocked_by_runtime_truth"] : []),
    ]),
    feedSourceTypes: [],
    providerBlocked,
    runtimeTruthMissing,
    costBlocked: items.some((item) => item.requiredReviewType === "cost_provider_review"),
    claimCount: countSectionEntries(context.dossierWorkspaceSurface?.sections.claims as unknown[]),
    counterPositionCount: countSectionEntries(
      context.dossierWorkspaceSurface?.sections.counterPositions as unknown[],
    ),
    questionCount: countSectionEntries(
      context.dossierWorkspaceSurface?.sections.openQuestions as unknown[],
    ),
    sourcePresent: Boolean(sourcePack && sourcePack.sources.length > 0),
    nextStep: summary.nextStepLabel,
    userVisibleReason:
      "Der Review-Kontext zeigt, welche Quellen, Prüfpfade und Vergleichsräume noch offen bleiben.",
    reviewerVisibleReason:
      `${summary.evidenceLine} · ${summary.candidateLine}`,
  });
}

import {
  collectCreateSafetyLexicon,
  redactCreateSafetySensitiveText,
  sanitizeCreateSafetyExcerpt,
  splitCreateSafetySentences,
} from "@/features/create/safety/createSafetyLexicon";
import {
  buildCreateSafetyReviewItems,
  type CreateSafetyReviewItem,
} from "@/features/create/safety/createSafetyReviewContract";
import {
  buildCreateSafetyTelemetry,
  type CreateSafetyTelemetry,
} from "@/features/create/safety/createSafetyTelemetry";

export type CreateInputSafetyDecision =
  | "allow"
  | "revise_required"
  | "factcheck_required"
  | "graph_review_required"
  | "moderation_required"
  | "blocked";

export type CreateInputSafetySeverity = "low" | "medium" | "high" | "critical";

export type CreateInputSafetyRouteStage = "analyze" | "save" | "finalize";

export type CreateInputSafetyTruthStatus =
  | "not_checked"
  | "open"
  | "supported"
  | "contested"
  | "refuted"
  | "not_checkable";

export type CreateInputSafetyFindingKind =
  | "email"
  | "phone"
  | "street_address"
  | "postal_code"
  | "third_party_call_to_action"
  | "doxxing"
  | "threat_concrete"
  | "threat_implicit"
  | "self_justice"
  | "insult_public_actor"
  | "insult_private_person"
  | "group_abuse"
  | "unsupported_allegation"
  | "corruption_or_capture_claim"
  | "unverified_number"
  | "source_bluffing"
  | "censorship_counterclaim"
  | "spam_campaign"
  | "political_framing"
  | "low_readability"
  | "cross_lingual_review";

export type CreateInputSafetyFinding = {
  id: string;
  kind: CreateInputSafetyFindingKind;
  severity: CreateInputSafetySeverity;
  message: string;
  excerpt?: string;
};

export type CreateInputQualityScore = {
  readability: number;
  structure: number;
  civicIntent: number;
  overall: number;
  notes: string[];
};

export type CreateInputSafetyFactCheckReason =
  | "unsupported_allegation"
  | "corruption_or_capture_claim"
  | "unverified_number"
  | "source_bluffing";

export type CreateInputSafetyFactCheckCandidate = {
  id: string;
  text: string;
  truthStatus: CreateInputSafetyTruthStatus;
  safeQuestion: boolean;
  reason: CreateInputSafetyFactCheckReason;
};

export type CreateInputSafetyResult = {
  decision: CreateInputSafetyDecision;
  severity: CreateInputSafetySeverity;
  findings: CreateInputSafetyFinding[];
  quality: CreateInputQualityScore;
  redactedText: string;
  safeRewrite: string;
  factCheckCandidates: CreateInputSafetyFactCheckCandidate[];
  graphReviewHints: string[];
  reviewItems: CreateSafetyReviewItem[];
  telemetry: CreateSafetyTelemetry;
  requiresHumanReview: boolean;
  noAutoPublish: true;
  noSilentMerge: true;
  blockedReasons: string[];
  nextActions: string[];
  sourceLanguage: string;
  contentLanguage: string;
  crossLingualRisk: boolean;
  createdAt: string;
};

type EvaluateCreateInputSafetyInput = {
  text: string;
  locale?: string | null;
  sourceLanguage?: string | null;
  contentLanguage?: string | null;
  uiLocale?: string | null;
  routeStage?: CreateInputSafetyRouteStage;
  runId?: string | null;
  correlationId?: string | null;
  draftId?: string | null;
};

type CandidateSeed = {
  text: string;
  reason: CreateInputSafetyFactCheckReason;
};

function cleanLang(value?: string | null, fallback = "de"): string {
  const raw = String(value ?? "").trim().toLowerCase();
  const short = raw.split(/[-_]/)[0] ?? "";
  if (/^[a-z]{2,16}$/.test(short)) return short;
  return fallback;
}

function makeFinding(
  findings: CreateInputSafetyFinding[],
  kind: CreateInputSafetyFindingKind,
  severity: CreateInputSafetySeverity,
  message: string,
  excerpt?: string,
) {
  findings.push({
    id: `${kind}-${findings.length + 1}`,
    kind,
    severity,
    message,
    excerpt,
  });
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function buildSafeRewrite(params: {
  redactedText: string;
  factCheckCandidates: CreateInputSafetyFactCheckCandidate[];
  hasHostileLanguage: boolean;
  hasThreatOrEscalation: boolean;
}): string {
  const base = params.redactedText.replace(/\s+/g, " ").trim();
  const concise = base.length > 260 ? `${base.slice(0, 257).trim()}...` : base;
  const hints: string[] = [];
  if (params.hasHostileLanguage) hints.push("beleidigende oder eskalierende Sprache entfernen");
  if (params.hasThreatOrEscalation) hints.push("Drohungen, Selbstjustiz und Mobilisierung entfernen");
  if (params.factCheckCandidates.length > 0) hints.push("Behauptungen als prüfbare Frage mit Belegen rahmen");
  const hintText = hints.length > 0 ? ` Nächster Schritt: ${hints.join(", ")}.` : "";
  return `Vorläufig verstanden: ${concise || "Anliegen mit öffentlichem Bezug."}.${hintText}`;
}

function computeQuality(text: string, hasCivicMarkers: boolean): CreateInputQualityScore {
  const normalized = text.replace(/\s+/g, " ").trim();
  const words = normalized.length > 0 ? normalized.split(" ").filter(Boolean) : [];
  const sentences = splitCreateSafetySentences(text);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : words.length;
  const punctuationDensity = normalized.length > 0 ? (normalized.match(/[.,!?;:]/g)?.length ?? 0) / normalized.length : 0;

  const readability =
    avgSentenceLength > 38 || (punctuationDensity < 0.006 && words.length > 45)
      ? 0.28
      : avgSentenceLength > 28
        ? 0.46
        : 0.72;

  const structure = sentences.length >= 2 ? 0.72 : words.length > 18 ? 0.52 : 0.32;
  const civicIntent = hasCivicMarkers ? 0.82 : 0.48;
  const overall = clampScore(readability * 0.4 + structure * 0.25 + civicIntent * 0.35);
  const notes: string[] = [];

  if (readability < 0.4) notes.push("Text ist schwer lesbar; kurze Sätze helfen.");
  if (structure < 0.4) notes.push("Struktur ist dünn; Kontext und Ziel klarer benennen.");
  if (civicIntent < 0.6) notes.push("Öffentliche Fragestellung oder konkretes Anliegen ergänzen.");

  return {
    readability: clampScore(readability),
    structure: clampScore(structure),
    civicIntent: clampScore(civicIntent),
    overall,
    notes,
  };
}

function maxSeverity(
  left: CreateInputSafetySeverity,
  right: CreateInputSafetySeverity,
): CreateInputSafetySeverity {
  const rank: Record<CreateInputSafetySeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return rank[left] >= rank[right] ? left : right;
}

function buildFactCheckCandidates(
  seeds: CandidateSeed[],
  safeQuestionDetected: boolean,
): CreateInputSafetyFactCheckCandidate[] {
  const seen = new Set<string>();

  return seeds
    .map((seed) => ({
      text: sanitizeCreateSafetyExcerpt(seed.text, 220),
      reason: seed.reason,
    }))
    .filter((seed) => {
      if (!seed.text) return false;
      const key = `${seed.reason}:${seed.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8)
    .map((seed, index) => ({
      id: `factcheck-${index + 1}`,
      text: seed.text,
      truthStatus: safeQuestionDetected ? "open" : "not_checked",
      safeQuestion: safeQuestionDetected,
      reason: seed.reason,
    }));
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function evaluateCreateInputSafety(
  input: EvaluateCreateInputSafetyInput,
): CreateInputSafetyResult {
  const text = String(input.text ?? "").trim();
  const sourceLanguage = cleanLang(input.sourceLanguage, cleanLang(input.locale, "de"));
  const contentLanguage = cleanLang(input.contentLanguage, cleanLang(input.locale, "de"));
  const routeStage = input.routeStage ?? "analyze";
  const createdAt = new Date().toISOString();
  const findings: CreateInputSafetyFinding[] = [];
  const lexicon = collectCreateSafetyLexicon(text);

  const hasEmail = lexicon.emails.length > 0;
  const hasPhone = lexicon.phones.length > 0;
  const hasStreet = lexicon.streetAddresses.length > 0;
  const hasPostal = lexicon.postalCodes.length > 0;
  const hasPii = hasEmail || hasPhone || hasStreet || hasPostal;
  const hasSelfPiiContext = hasPii && lexicon.selfPiiContextDetected;
  const hasCallToAction = lexicon.callToActionMatches.length > 0;
  const hasDoxxingPattern = lexicon.doxxingMatches.length > 0;
  const hasThreatConcrete = lexicon.threatConcreteMatches.length > 0;
  const hasThreatImplicit = lexicon.threatImplicitMatches.length > 0;
  const hasSelfJustice = lexicon.selfJusticeMatches.length > 0;
  const hasInsultPublicActor = lexicon.insultPublicActorMatches.length > 0;
  const hasInsultPrivatePerson = lexicon.insultPrivatePersonMatches.length > 0;
  const hasGroupAbuse = lexicon.groupAbuseMatches.length > 0;
  const hasPoliticalFraming = lexicon.politicalFramingMatches.length > 0;
  const hasUnsupportedAllegation = lexicon.unsupportedAllegationMatches.length > 0;
  const hasCorruptionClaim = lexicon.corruptionOrCaptureClaimMatches.length > 0;
  const hasUnverifiedNumber = lexicon.unverifiedNumberMatches.length > 0;
  const hasSourceBluffing = lexicon.sourceBluffingMatches.length > 0;
  const hasCensorshipCounterclaim = lexicon.censorshipCounterclaimMatches.length > 0;
  const hasSpamCampaign = lexicon.spamCampaignMatches.length > 0;
  const hasAccusationOrAllegation =
    hasUnsupportedAllegation || hasCorruptionClaim || hasUnverifiedNumber || hasSourceBluffing;

  if (hasEmail) makeFinding(findings, "email", "high", "E-Mail-Adresse erkannt.");
  if (hasPhone) makeFinding(findings, "phone", "high", "Telefonnummer erkannt.");
  if (hasStreet) makeFinding(findings, "street_address", "high", "Straße/Hausnummer erkannt.");
  if (hasPostal) makeFinding(findings, "postal_code", "medium", "Postleitzahl erkannt.");

  if (hasCallToAction) {
    makeFinding(
      findings,
      "third_party_call_to_action",
      "high",
      "Aufforderung gegen Dritte erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.callToActionMatches[0] ?? text),
    );
  }

  if (hasThreatConcrete) {
    makeFinding(
      findings,
      "threat_concrete",
      "critical",
      "Konkrete Gewaltandrohung erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.threatConcreteMatches[0] ?? text),
    );
  }

  if (hasThreatImplicit) {
    makeFinding(
      findings,
      "threat_implicit",
      "high",
      "Implizite Droh- oder Einschüchterungssprache erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.threatImplicitMatches[0] ?? text),
    );
  }

  if (hasSelfJustice) {
    makeFinding(
      findings,
      "self_justice",
      "high",
      "Selbstjustiz-Hinweis erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.selfJusticeMatches[0] ?? text),
    );
  }

  if (hasInsultPublicActor) {
    makeFinding(
      findings,
      "insult_public_actor",
      "medium",
      "Beleidigende Sprache gegen öffentliche Akteure erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.insultPublicActorMatches[0] ?? text),
    );
  }

  if (hasInsultPrivatePerson) {
    makeFinding(
      findings,
      "insult_private_person",
      "medium",
      "Beleidigende Sprache gegen Einzelpersonen erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.insultPrivatePersonMatches[0] ?? text),
    );
  }

  if (hasGroupAbuse) {
    makeFinding(
      findings,
      "group_abuse",
      "high",
      "Abwertende Sprache gegen Gruppen erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.groupAbuseMatches[0] ?? text),
    );
  }

  if (hasUnsupportedAllegation) {
    makeFinding(
      findings,
      "unsupported_allegation",
      "high",
      "Schwere Behauptung ohne Belegmarker erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.allegationSentences[0] ?? text),
    );
  }

  if (hasCorruptionClaim) {
    makeFinding(
      findings,
      "corruption_or_capture_claim",
      "high",
      "Korruptions- oder Capture-Behauptung erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.allegationSentences[0] ?? text),
    );
  }

  if (hasUnverifiedNumber) {
    makeFinding(
      findings,
      "unverified_number",
      "high",
      "Unverifizierte Zahl oder Größenordnung erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.allegationSentences[0] ?? text),
    );
  }

  if (hasSourceBluffing) {
    makeFinding(
      findings,
      "source_bluffing",
      "high",
      "Unbelegte Quellenbehauptung erkannt.",
      sanitizeCreateSafetyExcerpt(lexicon.allegationSentences[0] ?? text),
    );
  }

  if (hasCensorshipCounterclaim) {
    makeFinding(
      findings,
      "censorship_counterclaim",
      "low",
      "Zensur- oder Faktencheck-Gegenframing erkannt.",
      sanitizeCreateSafetyExcerpt(text),
    );
  }

  if (hasSpamCampaign) {
    makeFinding(
      findings,
      "spam_campaign",
      "medium",
      "Kampagnen- oder Brigading-Signal erkannt.",
      sanitizeCreateSafetyExcerpt(text),
    );
  }

  if (hasPoliticalFraming) {
    makeFinding(
      findings,
      "political_framing",
      "low",
      "Politisches Framing erkannt (nicht automatisch als Fakt).",
    );
  }

  const crossLingualRisk =
    contentLanguage === "de" &&
    (sourceLanguage !== "de" || lexicon.languageRiskHints.some((language) => language !== "de"));
  if (crossLingualRisk) {
    makeFinding(
      findings,
      "cross_lingual_review",
      "medium",
      "Sprachwechsel erkannt: Graph-Abgleich nur mit Review.",
    );
  }

  const quality = computeQuality(text, lexicon.civicIntentDetected);
  if (quality.readability < 0.4) {
    makeFinding(findings, "low_readability", "low", "Text ist schwer lesbar.");
  }

  const safeQuestionDetected =
    lexicon.questionMatches.length > 0 &&
    (lexicon.evidenceMatches.length > 0 ||
      lexicon.questionSentences.length > 0 ||
      /\b(bitte\s+prüft|bitte\s+prueft|welche\s+quellen|can\s+anyone\s+verify|what\s+evidence)\b/iu.test(
        text,
      ));

  const factCheckCandidates = buildFactCheckCandidates(
    [
      ...lexicon.allegationSentences.map((sentence) => ({
        text: sentence,
        reason: hasCorruptionClaim
          ? ("corruption_or_capture_claim" as const)
          : hasSourceBluffing
            ? ("source_bluffing" as const)
            : hasUnverifiedNumber
              ? ("unverified_number" as const)
              : ("unsupported_allegation" as const),
      })),
      ...lexicon.questionSentences
        .filter((sentence) => safeQuestionDetected)
        .map((sentence) => ({
          text: sentence,
          reason: hasCorruptionClaim
            ? ("corruption_or_capture_claim" as const)
            : hasSourceBluffing
              ? ("source_bluffing" as const)
              : hasUnverifiedNumber
                ? ("unverified_number" as const)
                : ("unsupported_allegation" as const),
        })),
    ],
    safeQuestionDetected,
  );

  const graphReviewHints = uniqueList([
    crossLingualRisk
      ? `Cross-lingual Match nur manuell prüfen (${lexicon.languageRiskHints.join(", ") || sourceLanguage} -> ${contentLanguage}); same_language_only bleibt Standard.`
      : "",
    hasPoliticalFraming
      ? "Politisches Framing als Perspektive markieren, nicht als Faktknoten."
      : "",
  ]);

  const hasThirdPartyPii = hasPii && !hasSelfPiiContext;
  const hasDoxxingSignal = hasThirdPartyPii && (hasCallToAction || hasDoxxingPattern);

  if (hasDoxxingSignal) {
    makeFinding(
      findings,
      "doxxing",
      "critical",
      "Möglicher Doxxing- oder Adressierungsaufruf erkannt.",
      sanitizeCreateSafetyExcerpt(text),
    );
  }

  let decision: CreateInputSafetyDecision = "allow";
  if (hasThreatConcrete || hasDoxxingSignal) {
    decision = "blocked";
  } else if (hasThirdPartyPii && hasAccusationOrAllegation) {
    decision = hasCallToAction ? "blocked" : "moderation_required";
  } else if (hasSelfJustice || hasThreatImplicit || hasGroupAbuse) {
    decision = "moderation_required";
  } else if (factCheckCandidates.length > 0 && !safeQuestionDetected) {
    decision = "factcheck_required";
  } else if (crossLingualRisk) {
    decision = "graph_review_required";
  } else if (
    hasInsultPublicActor ||
    hasInsultPrivatePerson ||
    hasPoliticalFraming ||
    hasCensorshipCounterclaim ||
    hasSpamCampaign ||
    quality.readability < 0.4
  ) {
    decision = "revise_required";
  }

  const redactedText = redactCreateSafetySensitiveText(text);
  const safeRewrite = buildSafeRewrite({
    redactedText,
    factCheckCandidates,
    hasHostileLanguage:
      hasInsultPublicActor || hasInsultPrivatePerson || hasGroupAbuse || hasSpamCampaign,
    hasThreatOrEscalation:
      hasThreatConcrete || hasThreatImplicit || hasSelfJustice || hasDoxxingSignal,
  });

  const blockedReasons: string[] = [];
  if (decision === "blocked") {
    if (hasThreatConcrete) blockedReasons.push("Konkrete Gewaltandrohung erkannt.");
    if (hasDoxxingSignal) blockedReasons.push("Doxxing-/Adressierungsaufruf mit Drittpersonenbezug erkannt.");
    if (hasThirdPartyPii && hasAccusationOrAllegation && hasCallToAction) {
      blockedReasons.push("Private Daten Dritter mit Vorwurf und Mobilisierung erkannt.");
    }
  }
  if (decision === "moderation_required") {
    if (hasSelfJustice) blockedReasons.push("Selbstjustiz-Sprache benötigt Moderation.");
    if (hasThreatImplicit) blockedReasons.push("Implizite Drohsprache benötigt Moderation.");
    if (hasGroupAbuse) blockedReasons.push("Abwertung von Gruppen benötigt Moderation.");
    if (hasThirdPartyPii && hasAccusationOrAllegation) {
      blockedReasons.push("Private Daten Dritter in Verbindung mit Vorwürfen erkannt.");
    }
  }

  const requiresHumanReview =
    decision === "moderation_required" ||
    decision === "blocked" ||
    decision === "factcheck_required" ||
    decision === "graph_review_required";

  const nextActions: string[] = [];
  if (decision === "revise_required") nextActions.push("Eingabe überarbeiten");
  if (decision === "factcheck_required") nextActions.push("Faktencheck starten");
  if (decision === "graph_review_required") nextActions.push("Graph-Review erforderlich");
  if (decision === "moderation_required") nextActions.push("Moderation erforderlich");
  if (decision === "blocked") nextActions.push("Blockiert: neu formulieren");
  if ((safeQuestionDetected || redactedText !== text) && decision !== "blocked") {
    nextActions.push("Sichere Fassung übernehmen");
  }
  if (nextActions.length === 0) {
    nextActions.push("Sichere Fassung übernehmen");
  }

  let severity: CreateInputSafetySeverity = "low";
  for (const finding of findings) {
    severity = maxSeverity(severity, finding.severity);
  }
  if (decision === "blocked") severity = "critical";
  if (decision === "moderation_required" && severity !== "critical") severity = "high";

  const reviewItems = buildCreateSafetyReviewItems({
    draftId: input.draftId,
    runId: input.runId,
    decision,
    severity,
    findings,
    redactedText,
    factCheckCandidates,
    graphReviewHints,
    blockedReasons,
    crossLingualRisk,
    safeQuestionDetected,
    hasThirdPartyPii,
    hasAccusationOrAllegation,
    hasThreatImplicit,
    hasGroupAbuse,
    hasPoliticalFraming,
    hasCensorshipCounterclaim,
    hasSpamCampaign,
    createdAt,
  });

  const telemetry = buildCreateSafetyTelemetry({
    decision,
    severity,
    findings,
    requiresHumanReview,
    crossLingualRisk,
    qualityOverall: quality.overall,
    redactedText,
    factCheckCandidateCount: factCheckCandidates.length,
    graphReviewHintCount: graphReviewHints.length,
    routeStage,
    runId: input.runId,
    correlationId: input.correlationId,
    timestamp: createdAt,
  });

  return {
    decision,
    severity,
    findings,
    quality,
    redactedText,
    safeRewrite,
    factCheckCandidates,
    graphReviewHints,
    reviewItems,
    telemetry,
    requiresHumanReview,
    noAutoPublish: true,
    noSilentMerge: true,
    blockedReasons,
    nextActions,
    sourceLanguage,
    contentLanguage,
    crossLingualRisk,
    createdAt,
  };
}

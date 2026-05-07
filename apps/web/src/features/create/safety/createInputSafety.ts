export type CreateInputSafetyDecision =
  | "allow"
  | "revise_required"
  | "factcheck_required"
  | "graph_review_required"
  | "moderation_required"
  | "blocked";

export type CreateInputSafetySeverity = "low" | "medium" | "high" | "critical";

export type CreateInputSafetyFindingKind =
  | "email"
  | "phone"
  | "street_address"
  | "postal_code"
  | "third_party_call_to_action"
  | "doxxing"
  | "threat"
  | "self_justice"
  | "insult"
  | "unsupported_allegation"
  | "political_framing"
  | "unverified_number"
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

export type CreateInputSafetyResult = {
  decision: CreateInputSafetyDecision;
  severity: CreateInputSafetySeverity;
  findings: CreateInputSafetyFinding[];
  quality: CreateInputQualityScore;
  redactedText: string;
  safeRewrite: string;
  factCheckCandidates: string[];
  graphReviewHints: string[];
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
};

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?:\+?\d[\d\s\-().]{6,}\d)/g;
const STREET_RE =
  /\b([A-ZÄÖÜ][\p{L}-]+(?:\s+[A-ZÄÖÜa-zäöüß][\p{L}-]+){0,3})\s+(?:straße|str\.?|weg|allee|platz|gasse|ring)\s+\d+[a-z]?\b/giu;
const POSTAL_RE = /\b\d{5}\b/g;

const CALL_TO_ACTION_RE =
  /\b(ruft?(?:\s+\w+){0,3}\s+an|ruf(?:\s+\w+){0,3}\s+an|geht?\s+zu|geht?\s+hin|postet|veröffentlicht|teilt\s+die\s+adresse|call(?:\s+\w+){0,2}\s+(him|her|them)|go\s+to\s+his\s+house|go\s+to\s+her\s+house|share\s+his\s+address|share\s+her\s+address|doxx)\b/giu;
const THREAT_RE =
  /\b(ich\s+bring(e)?\s+dich\s+um|wir\s+bringen\s+euch\s+um|wir\s+machen\s+euch\s+fertig|kill\s+you|we\s+will\s+hurt\s+you|anschlag|anzünden|verprügeln)\b/giu;
const SELF_JUSTICE_RE =
  /\b(selbstjustiz|wir\s+kümmern\s+uns\s+selbst|wir\s+regeln\s+das\s+selbst|take\s+justice\s+into\s+our\s+own\s+hands)\b/giu;
const INSULT_RE =
  /\b(idiot(en)?|dumm(kopf|e)?|verräter|abschaum|schmarotzer|bastard|arschloch|spasti|clown(s)?|idiot(s)?|moron(s)?|stupid)\b/giu;

const ALLEGATION_RE =
  /\b(absichtlich|korruption|investoren|presse\s+schreibt\s+nur|jeder\s+weiß|follow\s+the\s+money|gekauft|vertuscht|mafia)\b/giu;
const UNVERIFIED_NUMBER_RE =
  /\b(\d+[.,]?\d*\s*(million(en)?|mrd|milliarden?)|40\s+millionen|keine\s+ahnung\s+ob\s+die\s+zahl\s+stimmt|not\s+sure\s+if\s+that\s+number\s+is\s+correct)\b/giu;
const POLITICAL_FRAMING_RE =
  /\b(linke(n)?|rechte(n)?|altparteien|mainstreammedien|woke|establishment|lager|propaganda)\b/giu;
const ACCUSATION_RE =
  /\b(kriminell|schuldig|hat\s+gestohlen|hat\s+gelogen|betrug|bestechlich|corrupt|criminal)\b/giu;

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

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function redactSensitive(text: string): string {
  return text
    .replace(EMAIL_RE, "[E-MAIL ENTFERNT]")
    .replace(PHONE_RE, "[TELEFON ENTFERNT]")
    .replace(STREET_RE, "[ADRESSE ENTFERNT]")
    .replace(POSTAL_RE, "[PLZ ENTFERNT]");
}

function buildSafeRewrite(params: {
  redactedText: string;
  factCheckCandidates: string[];
  hasInsult: boolean;
  hasThreat: boolean;
}): string {
  const base = params.redactedText.replace(/\s+/g, " ").trim();
  const concise = base.length > 260 ? `${base.slice(0, 257).trim()}...` : base;
  const hints: string[] = [];
  if (params.hasInsult) hints.push("Beleidigungen entfernen");
  if (params.hasThreat) hints.push("Drohungen/Selbstjustiz entfernen");
  if (params.factCheckCandidates.length > 0) hints.push("Behauptungen als prüfbare Fragen formulieren");
  const hintText = hints.length > 0 ? ` Nächster Schritt: ${hints.join(", ")}.` : "";
  return `Vorläufig verstanden: ${concise || "Anliegen mit öffentlichem Bezug."}.${hintText}`;
}

function computeQuality(text: string, hasCivicMarkers: boolean): CreateInputQualityScore {
  const normalized = text.replace(/\s+/g, " ").trim();
  const words = normalized.length > 0 ? normalized.split(" ").filter(Boolean) : [];
  const sentences = splitSentences(text);
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

export function evaluateCreateInputSafety(
  input: EvaluateCreateInputSafetyInput,
): CreateInputSafetyResult {
  const text = String(input.text ?? "").trim();
  const sourceLanguage = cleanLang(input.sourceLanguage, cleanLang(input.locale, "de"));
  const contentLanguage = cleanLang(input.contentLanguage, cleanLang(input.locale, "de"));
  const lowered = text.toLowerCase();
  const findings: CreateInputSafetyFinding[] = [];

  const hasEmail = EMAIL_RE.test(text);
  const hasPhone = PHONE_RE.test(text);
  const hasStreet = STREET_RE.test(text);
  const hasPostal = POSTAL_RE.test(text);
  EMAIL_RE.lastIndex = 0;
  PHONE_RE.lastIndex = 0;
  STREET_RE.lastIndex = 0;
  POSTAL_RE.lastIndex = 0;

  if (hasEmail) makeFinding(findings, "email", "high", "E-Mail-Adresse erkannt.");
  if (hasPhone) makeFinding(findings, "phone", "high", "Telefonnummer erkannt.");
  if (hasStreet) makeFinding(findings, "street_address", "high", "Straße/Hausnummer erkannt.");
  if (hasPostal) makeFinding(findings, "postal_code", "medium", "Postleitzahl erkannt.");

  const hasCallToAction =
    CALL_TO_ACTION_RE.test(text) ||
    ((/\bruf(t)?\b/iu.test(text) || /\bcall\b/iu.test(text)) &&
      (/\ban\b/iu.test(text) || /\bhim\b|\bher\b|\bthem\b/iu.test(text)));
  CALL_TO_ACTION_RE.lastIndex = 0;
  if (hasCallToAction) {
    makeFinding(
      findings,
      "third_party_call_to_action",
      "high",
      "Aufforderung gegen Dritte erkannt.",
    );
  }

  const hasThreat = THREAT_RE.test(text);
  THREAT_RE.lastIndex = 0;
  if (hasThreat) makeFinding(findings, "threat", "critical", "Konkrete Gewaltandrohung erkannt.");

  const hasSelfJustice = SELF_JUSTICE_RE.test(text);
  SELF_JUSTICE_RE.lastIndex = 0;
  if (hasSelfJustice) makeFinding(findings, "self_justice", "high", "Selbstjustiz-Hinweis erkannt.");

  const hasInsult = INSULT_RE.test(text);
  INSULT_RE.lastIndex = 0;
  if (hasInsult) makeFinding(findings, "insult", "medium", "Beleidigende Sprache erkannt.");

  const hasAllegation = ALLEGATION_RE.test(text);
  ALLEGATION_RE.lastIndex = 0;
  if (hasAllegation) {
    makeFinding(
      findings,
      "unsupported_allegation",
      "high",
      "Schwere Behauptung ohne Belegmarker erkannt.",
    );
  }

  const hasUnverifiedNumber = UNVERIFIED_NUMBER_RE.test(text);
  UNVERIFIED_NUMBER_RE.lastIndex = 0;
  if (hasUnverifiedNumber) {
    makeFinding(
      findings,
      "unverified_number",
      "high",
      "Unverifizierte Zahl/Größenordnung erkannt.",
    );
  }

  const hasPoliticalFraming = POLITICAL_FRAMING_RE.test(text);
  POLITICAL_FRAMING_RE.lastIndex = 0;
  if (hasPoliticalFraming) {
    makeFinding(
      findings,
      "political_framing",
      "low",
      "Politisches Framing erkannt (nicht automatisch als Fakt).",
    );
  }

  const hasAccusation = ACCUSATION_RE.test(text);
  ACCUSATION_RE.lastIndex = 0;
  const hasThirdPartyPii = hasEmail || hasPhone || hasStreet || hasPostal;

  const crossLingualRisk = contentLanguage === "de" && sourceLanguage !== "de";
  if (crossLingualRisk) {
    makeFinding(
      findings,
      "cross_lingual_review",
      "medium",
      "Sprachwechsel erkannt: Graph-Abgleich nur mit Review.",
    );
  }

  const civicIntentMarkers =
    /\b(anliegen|frage|vorschlag|lösung|loesung|bitte|können\s+wir|koennen\s+wir|wir\s+sollten|öffentlich|oeffentlich|kommune|bezirk)\b/iu.test(
      lowered,
    );
  const quality = computeQuality(text, civicIntentMarkers);
  if (quality.readability < 0.4) {
    makeFinding(findings, "low_readability", "low", "Text ist schwer lesbar.");
  }

  const sentences = splitSentences(text);
  const factCheckCandidates = sentences
    .filter((sentence) => ALLEGATION_RE.test(sentence) || UNVERIFIED_NUMBER_RE.test(sentence))
    .slice(0, 8);
  ALLEGATION_RE.lastIndex = 0;
  UNVERIFIED_NUMBER_RE.lastIndex = 0;

  const graphReviewHints: string[] = [];
  if (crossLingualRisk) {
    graphReviewHints.push("Cross-lingual Match nur manuell prüfen (same_language_only bleibt Standard).");
  }
  if (hasPoliticalFraming) {
    graphReviewHints.push("Politisches Framing als Perspektive markieren, nicht als Faktknoten.");
  }

  const hasDoxxingSignal = hasThirdPartyPii && hasCallToAction;
  if (hasDoxxingSignal) {
    makeFinding(
      findings,
      "doxxing",
      "critical",
      "Möglicher Doxxing-/Adressierungsaufruf erkannt.",
    );
  }

  let decision: CreateInputSafetyDecision = "allow";
  if (hasThreat || hasDoxxingSignal) {
    decision = "blocked";
  } else if (hasThirdPartyPii && (hasAccusation || hasAllegation)) {
    decision = hasCallToAction ? "blocked" : "moderation_required";
  } else if (hasSelfJustice) {
    decision = "moderation_required";
  } else if (hasAllegation || hasUnverifiedNumber) {
    decision = "factcheck_required";
  } else if (crossLingualRisk) {
    decision = "graph_review_required";
  } else if (hasInsult || quality.readability < 0.4 || hasPoliticalFraming) {
    decision = "revise_required";
  }

  const redactedText = redactSensitive(text);
  const safeRewrite = buildSafeRewrite({
    redactedText,
    factCheckCandidates,
    hasInsult,
    hasThreat: hasThreat || hasSelfJustice,
  });

  const blockedReasons: string[] = [];
  if (decision === "blocked") {
    if (hasThreat) blockedReasons.push("Konkrete Gewaltandrohung erkannt.");
    if (hasDoxxingSignal) blockedReasons.push("Doxxing-/Adressierungsaufruf mit Drittpersonenbezug erkannt.");
  }
  if (decision === "moderation_required") {
    if (hasSelfJustice) blockedReasons.push("Selbstjustiz-/Drohmarker benötigen Moderation.");
    if (hasThirdPartyPii && (hasAccusation || hasAllegation)) {
      blockedReasons.push("Private Daten Dritter in Verbindung mit Vorwürfen erkannt.");
    }
  }

  const nextActions: string[] = [];
  if (decision === "revise_required") {
    nextActions.push("Bitte beleidigungsfrei und mit klarer Fragestellung formulieren.");
  }
  if (decision === "factcheck_required") {
    nextActions.push("Belege/Quellen ergänzen oder Behauptung als prüfbare Frage formulieren.");
  }
  if (decision === "graph_review_required") {
    nextActions.push("Sprachkontext und Graph-Matches manuell prüfen.");
  }
  if (decision === "moderation_required") {
    nextActions.push("Beitrag wird vor Weiterverwendung moderiert.");
  }
  if (decision === "blocked") {
    nextActions.push("Bitte entferne Drohungen, Doxxing oder personenbezogene Angriffe.");
  }
  if (nextActions.length === 0) {
    nextActions.push("Du kannst mit der strukturierten Ausarbeitung fortfahren.");
  }

  let severity: CreateInputSafetySeverity = "low";
  for (const finding of findings) {
    severity = maxSeverity(severity, finding.severity);
  }
  if (decision === "blocked") severity = "critical";
  if (decision === "moderation_required" && severity !== "critical") severity = "high";

  return {
    decision,
    severity,
    findings,
    quality,
    redactedText,
    safeRewrite,
    factCheckCandidates,
    graphReviewHints,
    requiresHumanReview:
      decision !== "allow" ||
      crossLingualRisk ||
      hasAllegation ||
      hasUnverifiedNumber,
    noAutoPublish: true,
    noSilentMerge: true,
    blockedReasons,
    nextActions,
    sourceLanguage,
    contentLanguage,
    crossLingualRisk,
    createdAt: new Date().toISOString(),
  };
}

export type CreateInputQualityDecision =
  | "allow"
  | "revise_required"
  | "factcheck_required"
  | "graph_review_required"
  | "moderation_required"
  | "blocked";

export type CreateInputQualityFindingKind =
  | "readability"
  | "privacy"
  | "doxxing"
  | "threat"
  | "abuse"
  | "political_framing"
  | "unsupported_claim"
  | "factcheck_need"
  | "graph_review_need";

export type CreateInputQualitySeverity = "low" | "medium" | "high" | "critical";

export type CreateInputQualityFinding = {
  kind: CreateInputQualityFindingKind;
  severity: CreateInputQualitySeverity;
  code: string;
  label: string;
  reason: string;
  fragment?: string;
  action:
    | "allow"
    | "redact"
    | "rewrite"
    | "factcheck"
    | "graph_review"
    | "moderation"
    | "block";
};

export type CreateFactcheckCandidate = {
  id: string;
  text: string;
  reason: string;
  severity: Exclude<CreateInputQualitySeverity, "low">;
};

export type CreateInputQualityAssessment = {
  schemaVersion: "create_input_quality.v1";
  decision: CreateInputQualityDecision;
  qualityScore: number;
  sourceLanguage: string;
  contentLanguage: string;
  uiLocale: string;
  originalLength: number;
  redactedText: string;
  redactionApplied: boolean;
  findings: CreateInputQualityFinding[];
  factcheckCandidates: CreateFactcheckCandidate[];
  flags: string[];
  safeRewrite: string | null;
  userFacingMessage: string;
  systemNote: string;
  createdAt: string;
};

type CreateInputQualityInput = {
  text: string;
  sourceLanguage?: string | null;
  contentLanguage?: string | null;
  uiLocale?: string | null;
  graphMatchState?: "unknown" | "none" | "possible" | "matched";
};

const TEXT_FIELD_KEYS = ["text", "textOriginal", "textPrepared", "preparedText"] as const;

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE = /(?<!\w)(?:\+?\d{1,3}[\s().-]*)?(?:\d[\s().-]*){7,}\d(?!\w)/g;
const POSTAL_CITY_RE = /\b\d{5}\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ.-]+(?:\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ.-]+)?\b/gu;
const STREET_RE = /\b(?:[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ.-]*(?:straße|strasse|str\.|weg|allee|damm|platz|ufer|ring|gasse|chaussee)|Musterstraße|Beispielstraße)\s+\d+[a-zA-Z]?(?:\s*,?\s*\d{5}\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ.-]+(?:\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ.-]+)?)?/giu;
const FLOOR_RE = /\b(?:\d+\.\s*(?:og|stock|etage)|erdgeschoss|links|rechts)\b/giu;
const SELF_NAME_RE = /\b(?:ich\s+hei(?:ß|ss)e|mein\s+name\s+ist|i\s+am|my\s+name\s+is)\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ'’.-]+(?:\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ'’.-]+){0,2}/giu;
const TITLED_PERSON_RE = /\b(?:Herr|Frau|Dr\.?|Prof\.?)\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ'’.-]+(?:\s+[A-ZÄÖÜ][\p{L}ÄÖÜäöüßẞ'’.-]+){0,2}/gu;
const SOCIAL_HANDLE_RE = /(?<!\w)@[A-Za-z0-9_][A-Za-z0-9_.-]{2,30}/g;

const THREAT_RULES: Array<{
  code: string;
  severity: CreateInputQualitySeverity;
  pattern: RegExp;
  label: string;
  reason: string;
}> = [
  {
    code: "concrete_violence",
    severity: "critical",
    pattern: /\b(umbringen|abstechen|erschie(?:ß|ss)en|anz(?:ü|ue)nden|in\s+die\s+luft\s+jagen|kill|shoot|stab|burn\s+down)\b/iu,
    label: "Konkrete Gewaltformulierung",
    reason: "Der Text enthält eine konkrete Gewaltandrohung oder Gewaltfantasie.",
  },
  {
    code: "self_justice_signal",
    severity: "high",
    pattern: /\b(selbst\s+k(?:ü|ue)mmern|selber\s+k(?:ü|ue)mmern|selbstjustiz|garantiere\s+f(?:ü|ue)r\s+nichts|wird\s+(?:richtig\s+)?ungem(?:ü|ue)tlich|take\s+care\s+of\s+it\s+ourselves|people\s+will\s+handle\s+it)\b/iu,
    label: "Drohungsnahe Eskalationsformulierung",
    reason: "Der Text deutet Selbstjustiz, Einschüchterung oder eine mögliche Eskalation an.",
  },
  {
    code: "intimidation_signal",
    severity: "medium",
    pattern: /\b(kragen\s+platzt|dann\s+passiert\s+(?:halt\s+)?was|no\s+one\s+should\s+be\s+surprised|things\s+will\s+get\s+ugly)\b/iu,
    label: "Eskalationssignal",
    reason: "Der Text kann als Einschüchterung oder drohende Zuspitzung gelesen werden.",
  },
];

const ABUSE_RULES: Array<{
  code: string;
  severity: CreateInputQualitySeverity;
  pattern: RegExp;
  label: string;
  reason: string;
}> = [
  {
    code: "targeted_insult_public_actor",
    severity: "medium",
    pattern: /\b(versager|schlafm(?:ü|ue)tzen|sesselfurzer|idioten|dummk(?:ö|oe)pfe|maulhelden|unf(?:ä|ae)hige\s+(?:leute|verwaltung|beamte)|losers|idiots|morons|corrupt\s+scum)\b/iu,
    label: "Beleidigende Formulierung",
    reason: "Der Text enthält abwertende Begriffe, die nicht als sachlicher Debattenbeitrag übernommen werden sollten.",
  },
  {
    code: "dehumanizing_generalization",
    severity: "high",
    pattern: /\b(abschaum|pack|parasiten|verr(?:ä|ae)terpack|vermin|parasites|traitors)\b/iu,
    label: "Entmenschlichende Abwertung",
    reason: "Der Text enthält stark entmenschlichende oder pauschal abwertende Sprache.",
  },
];

const POLITICAL_FRAMING_RULES: Array<{
  code: string;
  pattern: RegExp;
  label: string;
  reason: string;
}> = [
  {
    code: "left_right_stereotype",
    pattern: /\b(linke\s+spinner|rechte\s+schreih(?:ä|ae)lse|konservative\s+blockieren|woke\s+ideologie|anti[-\s]?woke|linksgr(?:ü|ue)n|right[-\s]?wing\s+fearmongering|leftist\s+agenda)\b/iu,
    label: "Politisches Pauschalframing",
    reason: "Der Text enthält politische Pauschalisierungen, die als Perspektive erkennbar sein dürfen, aber nicht als Fakt übernommen werden sollten.",
  },
  {
    code: "institutional_totalizing_framing",
    pattern: /\b(die\s+verwaltung\s+macht\s+das\s+absichtlich|die\s+presse\s+schreibt\s+nur|alle\s+parteien\s+benutzen|the\s+media\s+only\s+writes|all\s+parties\s+use)\b/iu,
    label: "Pauschale Institutionenbehauptung",
    reason: "Der Text deutet umfassende Absichten oder Steuerung an, ohne sie zu belegen.",
  },
];

const UNSUPPORTED_CLAIM_RULES: Array<{
  code: string;
  severity: Exclude<CreateInputQualitySeverity, "low">;
  pattern: RegExp;
  label: string;
  reason: string;
}> = [
  {
    code: "secret_corruption_or_capture_claim",
    severity: "high",
    pattern: /\b(absichtlich\s+verkommen|investoren|lobbygruppen|parteifreunde|korruption|gekauft|unter\s+einer\s+decke|geheim\s+gehalten|follow\s+the\s+money|secretly\s+planned|corrupt|bought\s+off)\b/iu,
    label: "Schwere unbelegte Absichts-/Korruptionsbehauptung",
    reason: "Der Text enthält eine schwere Tatsachenbehauptung zu Absicht, Korruption, Investoren- oder Lobbyeinfluss.",
  },
  {
    code: "everyone_knows_claim",
    severity: "medium",
    pattern: /\b(jeder\s+wei(?:ß|ss)\s+das|aus\s+sicherer\s+quelle|man\s+muss\s+doch\s+nur|everyone\s+knows|safe\s+source|obviously)\b/iu,
    label: "Unbelegte Gewissheitsbehauptung",
    reason: "Der Text stützt eine Tatsachenbehauptung auf Gewissheitssprache statt auf prüfbare Belege.",
  },
  {
    code: "uncertain_number_claim",
    severity: "medium",
    pattern: /\b\d+[\d.,]*\s*(?:millionen|mio\.?|mrd\.?|euro|€|percent|prozent|%)\b.*\b(keine\s+ahnung|stimmt|gef(?:ü|ue)hlt|i\s+don.?t\s+know|not\s+sure)\b/iu,
    label: "Unsichere Zahlenbehauptung",
    reason: "Der Text nennt Zahlen oder Finanzvergleiche, markiert sie aber selbst als unsicher.",
  },
];

function cleanLanguage(value: string | null | undefined, fallback: string): string {
  const normalized = String(value ?? "").trim().toLowerCase().split(/[-_]/)[0] ?? "";
  return /^[a-z]{2,16}$/.test(normalized) ? normalized : fallback;
}

function collectMatches(text: string, pattern: RegExp, max = 4): string[] {
  const matches = new Set<string>();
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const re = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const value = match[0]?.replace(/\s+/g, " ").trim();
    if (value) matches.add(value.slice(0, 160));
    if (matches.size >= max) break;
    if (match.index === re.lastIndex) re.lastIndex += 1;
  }
  return Array.from(matches);
}

function pushFinding(
  findings: CreateInputQualityFinding[],
  finding: CreateInputQualityFinding,
) {
  const key = `${finding.kind}:${finding.code}:${finding.fragment ?? ""}`;
  if (findings.some((item) => `${item.kind}:${item.code}:${item.fragment ?? ""}` === key)) return;
  findings.push(finding);
}

export function extractCreateInputText(input: unknown): string {
  if (!input || typeof input !== "object") return "";
  const raw = input as Record<string, unknown>;
  for (const key of ["textPrepared", "preparedText", "text", "textOriginal"] as const) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

export function redactCreateInputText(text: string): string {
  let redacted = text;
  redacted = redacted.replace(EMAIL_RE, "[E-Mail entfernt]");
  redacted = redacted.replace(PHONE_RE, "[Telefonnummer entfernt]");
  redacted = redacted.replace(STREET_RE, "[Adresse entfernt]");
  redacted = redacted.replace(POSTAL_CITY_RE, "[Ort/PLZ entfernt]");
  redacted = redacted.replace(SELF_NAME_RE, (value) => {
    const prefix = value.match(/^(ich\s+hei(?:ß|ss)e|mein\s+name\s+ist|i\s+am|my\s+name\s+is)/iu)?.[0] ?? "Name";
    return `${prefix} [Name entfernt]`;
  });
  redacted = redacted.replace(TITLED_PERSON_RE, (value) => {
    const title = value.match(/^(Herr|Frau|Dr\.?|Prof\.?)\b/u)?.[0] ?? "Person";
    return `${title} [Name entfernt]`;
  });
  redacted = redacted.replace(SOCIAL_HANDLE_RE, "[Handle entfernt]");
  return redacted;
}

function detectPrivacy(text: string, findings: CreateInputQualityFinding[]) {
  const privacyRules: Array<{
    code: string;
    pattern: RegExp;
    label: string;
    reason: string;
  }> = [
    { code: "email", pattern: EMAIL_RE, label: "E-Mail-Adresse", reason: "Der Text enthält eine E-Mail-Adresse." },
    { code: "phone", pattern: PHONE_RE, label: "Telefonnummer", reason: "Der Text enthält eine Telefonnummer." },
    { code: "street_address", pattern: STREET_RE, label: "Adresse", reason: "Der Text enthält eine Straße/Hausnummer oder Adresse." },
    { code: "postal_city", pattern: POSTAL_CITY_RE, label: "PLZ/Ort", reason: "Der Text enthält eine PLZ-Ort-Kombination." },
    { code: "self_name", pattern: SELF_NAME_RE, label: "Eigener Name", reason: "Der Text enthält einen Namen der einreichenden Person." },
    { code: "titled_person", pattern: TITLED_PERSON_RE, label: "Namentlich genannte Person", reason: "Der Text enthält eine namentlich genannte Einzelperson." },
    { code: "social_handle", pattern: SOCIAL_HANDLE_RE, label: "Social Handle", reason: "Der Text enthält einen Social-Media-Handle." },
  ];

  for (const rule of privacyRules) {
    for (const fragment of collectMatches(text, rule.pattern, 5)) {
      pushFinding(findings, {
        kind: "privacy",
        severity: rule.code === "titled_person" ? "medium" : "high",
        code: rule.code,
        label: rule.label,
        reason: rule.reason,
        fragment,
        action: "redact",
      });
    }
  }

  const hasContactCall = /\b(ruft|rufen|anrufen|kontaktiert|kontaktieren|call|contact|message)\b/iu.test(text);
  const hasThirdPartySignal = /\b(Herr|Frau|Nachbar|Nachbarin|neighbor|neighbour|2\.\s*OG|links|rechts)\b/iu.test(text);
  const hasPrivateData = findings.some((item) => item.kind === "privacy");
  if (hasPrivateData && hasContactCall) {
    pushFinding(findings, {
      kind: "doxxing",
      severity: "critical",
      code: "contact_private_person",
      label: "Doxxing-/Kontaktaufruf",
      reason: "Private Daten werden mit einer Aufforderung zur Kontaktaufnahme verbunden.",
      fragment: collectMatches(text, /(.{0,40}(?:ruft|rufen|anrufen|kontaktiert|call|contact).{0,80})/iu, 1)[0],
      action: "block",
    });
  } else if (hasPrivateData && hasThirdPartySignal) {
    pushFinding(findings, {
      kind: "doxxing",
      severity: "high",
      code: "third_party_private_data",
      label: "Private Daten Dritter",
      reason: "Der Text verbindet Einzelpersonen mit privaten Orts- oder Kontaktdaten.",
      action: "moderation",
    });
  }
}

function detectRules(text: string, findings: CreateInputQualityFinding[]) {
  for (const rule of THREAT_RULES) {
    for (const fragment of collectMatches(text, rule.pattern, 3)) {
      pushFinding(findings, {
        kind: "threat",
        severity: rule.severity,
        code: rule.code,
        label: rule.label,
        reason: rule.reason,
        fragment,
        action: rule.severity === "critical" ? "block" : "moderation",
      });
    }
  }

  for (const rule of ABUSE_RULES) {
    for (const fragment of collectMatches(text, rule.pattern, 5)) {
      pushFinding(findings, {
        kind: "abuse",
        severity: rule.severity,
        code: rule.code,
        label: rule.label,
        reason: rule.reason,
        fragment,
        action: rule.severity === "high" ? "moderation" : "rewrite",
      });
    }
  }

  for (const rule of POLITICAL_FRAMING_RULES) {
    for (const fragment of collectMatches(text, rule.pattern, 4)) {
      pushFinding(findings, {
        kind: "political_framing",
        severity: "medium",
        code: rule.code,
        label: rule.label,
        reason: rule.reason,
        fragment,
        action: "rewrite",
      });
    }
  }
}

function detectUnsupportedClaims(
  text: string,
  findings: CreateInputQualityFinding[],
): CreateFactcheckCandidate[] {
  const candidates: CreateFactcheckCandidate[] = [];
  UNSUPPORTED_CLAIM_RULES.forEach((rule, index) => {
    const fragments = collectMatches(text, rule.pattern, 4);
    for (const fragment of fragments) {
      pushFinding(findings, {
        kind: "unsupported_claim",
        severity: rule.severity,
        code: rule.code,
        label: rule.label,
        reason: rule.reason,
        fragment,
        action: "factcheck",
      });
      candidates.push({
        id: `fc-${index + 1}-${candidates.length + 1}`,
        text: fragment,
        reason: rule.reason,
        severity: rule.severity,
      });
    }
  });
  return candidates.slice(0, 8);
}

function detectReadability(text: string, findings: CreateInputQualityFinding[]) {
  const trimmed = text.trim();
  if (!trimmed) return;
  const words = trimmed.split(/\s+/).filter(Boolean);
  const sentenceLike = /[.!?;:]|\n/.test(trimmed);
  const veryLong = trimmed.length >= 900 && words.length >= 140;
  const veryShortButUsable = trimmed.length >= 10 && words.length <= 8;

  if (veryShortButUsable) {
    pushFinding(findings, {
      kind: "readability",
      severity: "low",
      code: "thin_but_usable",
      label: "Sehr knapper Input",
      reason: "Der Text ist kurz, kann aber als Anliegen geklärt werden.",
      action: "allow",
    });
  }

  if (veryLong && !sentenceLike) {
    pushFinding(findings, {
      kind: "readability",
      severity: "medium",
      code: "long_low_structure",
      label: "Langer unstrukturierter Input",
      reason: "Der Text ist lang und kaum gegliedert; vor Veröffentlichung sollte er zusammengefasst werden.",
      action: "rewrite",
    });
  }
}

function inferLocation(text: string): string {
  const scharnweber = text.match(/Scharnweber(?:stra(?:ß|ss)e|straße|strasse)?/iu)?.[0];
  if (scharnweber) return "Bereich Scharnweberstraße";
  const address = text.match(STREET_RE)?.[0];
  if (address) return "genannten Bereich";
  return "genannten Ort oder Sachverhalt";
}

function inferConcernLine(text: string): string {
  const lower = text.toLowerCase();
  const concerns: string[] = [];
  if (/m(?:ü|ue)ll|dreck|sauber/.test(lower)) concerns.push("Sauberkeit");
  if (/kind|fu(?:ß|ss)g(?:ä|ae)nger|sicherheit|unfall/.test(lower)) concerns.push("Sicherheit");
  if (/auto|verkehr|park|lieferwagen|rad/.test(lower)) concerns.push("Verkehr");
  if (/zust(?:ä|ae)ndig|amt|verwaltung|senat|polizei|ordnungsamt/.test(lower)) concerns.push("Zuständigkeit");
  if (/antwort|r(?:ü|ue)ckmeldung|transparent|status/.test(lower)) concerns.push("Rückmeldung und Transparenz");
  if (concerns.length === 0) return "Zuständigkeit, Faktenlage und mögliche nächste Schritte";
  return Array.from(new Set(concerns)).slice(0, 5).join(", ");
}

function buildSafeRewrite(text: string, findings: CreateInputQualityFinding[]): string | null {
  if (!text.trim()) return null;
  const needsRewrite = findings.some((item) =>
    ["privacy", "doxxing", "threat", "abuse", "political_framing", "unsupported_claim", "readability"].includes(item.kind),
  );
  if (!needsRewrite) return null;
  const location = inferLocation(text);
  const concernLine = inferConcernLine(text);
  return `Ich möchte sachlich klären lassen, welche Probleme, Zuständigkeiten, Daten und geplanten Maßnahmen zum ${location} vorliegen. Im Mittelpunkt stehen ${concernLine}. Unbelegte Behauptungen sollen als Prüfbehauptungen behandelt und private Daten, Beleidigungen oder drohende Formulierungen nicht übernommen werden.`;
}

function deriveDecision(
  findings: CreateInputQualityFinding[],
  factcheckCandidates: CreateFactcheckCandidate[],
  graphMatchState: CreateInputQualityInput["graphMatchState"],
): CreateInputQualityDecision {
  if (findings.some((item) => item.kind === "threat" && item.severity === "critical")) return "blocked";
  if (findings.some((item) => item.kind === "doxxing" && item.severity === "critical")) return "blocked";
  if (findings.some((item) => item.action === "moderation" || item.kind === "doxxing")) return "moderation_required";
  if (findings.some((item) => item.kind === "privacy" || item.kind === "abuse" || item.kind === "political_framing")) {
    return "revise_required";
  }
  if (factcheckCandidates.length > 0) return "factcheck_required";
  if (graphMatchState === "possible") return "graph_review_required";
  if (findings.some((item) => item.kind === "readability" && item.severity === "medium")) return "revise_required";
  return "allow";
}

function score(findings: CreateInputQualityFinding[]): number {
  const penalty = findings.reduce((sum, item) => {
    const base = item.severity === "critical" ? 45 : item.severity === "high" ? 28 : item.severity === "medium" ? 14 : 4;
    const multiplier = item.kind === "privacy" || item.kind === "doxxing" || item.kind === "threat" ? 1.2 : 1;
    return sum + base * multiplier;
  }, 0);
  return Math.max(0, Math.min(100, Math.round(100 - penalty)));
}

function buildUserFacingMessage(decision: CreateInputQualityDecision): string {
  switch (decision) {
    case "blocked":
      return "Dein Anliegen kann nicht in dieser Form verarbeitet werden, weil es private Daten, Doxxing oder konkrete Gewalt-/Drohsignale enthält. Bitte formuliere ohne private Daten, Beleidigungen oder Drohung neu.";
    case "moderation_required":
      return "Dein Anliegen ist grundsätzlich erkennbar, muss aber vor der Weiterverarbeitung moderiert werden. Private Daten, Doxxing, Einschüchterung oder stark abwertende Formulierungen werden nicht übernommen.";
    case "revise_required":
      return "Dein Anliegen ist verwertbar, braucht aber vor Veröffentlichung eine sachliche Fassung. Private Daten, Beleidigungen und pauschale Framings werden entfernt oder neutralisiert.";
    case "factcheck_required":
      return "Der Beitrag enthält strittige oder schwere Tatsachenbehauptungen. Sie können als Prüfbehauptung aufgenommen werden, sollten aber vor öffentlicher Tatsachendarstellung per Faktencheck oder Quellenabgleich geprüft werden.";
    case "graph_review_required":
      return "Der Beitrag könnte zu bestehendem Kontext passen. Vor einer Zuordnung ist ein Graph-Abgleich erforderlich; es erfolgt kein automatischer Merge.";
    case "allow":
    default:
      return "Der Beitrag kann als sachlicher Input weiterverarbeitet werden. eDebatte übernimmt weiterhin keine automatische Veröffentlichung ohne bewusste Bestätigung.";
  }
}

export function evaluateCreateInputQuality(input: CreateInputQualityInput): CreateInputQualityAssessment {
  const text = String(input.text ?? "").trim();
  const findings: CreateInputQualityFinding[] = [];
  detectReadability(text, findings);
  detectPrivacy(text, findings);
  detectRules(text, findings);
  const factcheckCandidates = detectUnsupportedClaims(text, findings);
  const redactedText = redactCreateInputText(text).trim();
  const redactionApplied = redactedText !== text;
  const decision = deriveDecision(findings, factcheckCandidates, input.graphMatchState ?? "unknown");
  const flags = Array.from(new Set(findings.map((item) => `${item.kind}:${item.code}`)));
  const safeRewrite = buildSafeRewrite(text, findings);

  return {
    schemaVersion: "create_input_quality.v1",
    decision,
    qualityScore: score(findings),
    sourceLanguage: cleanLanguage(input.sourceLanguage, "de"),
    contentLanguage: cleanLanguage(input.contentLanguage, cleanLanguage(input.sourceLanguage, "de")),
    uiLocale: cleanLanguage(input.uiLocale, "de"),
    originalLength: text.length,
    redactedText,
    redactionApplied,
    findings,
    factcheckCandidates,
    flags,
    safeRewrite,
    userFacingMessage: buildUserFacingMessage(decision),
    systemNote:
      "Input quality gate separates civic concern, private data, abuse, threat signals and fact-check needs before create handoff.",
    createdAt: new Date().toISOString(),
  };
}

export function isCreateInputHardStop(assessment: Pick<CreateInputQualityAssessment, "decision">): boolean {
  return assessment.decision === "blocked" || assessment.decision === "moderation_required";
}

export function shouldBlockCreateFinalize(assessment: Pick<CreateInputQualityAssessment, "decision">): boolean {
  return assessment.decision !== "allow";
}

export function buildCreateInputSafetyErrorBody(assessment: CreateInputQualityAssessment) {
  return {
    ok: false,
    errorCode: "CREATE_INPUT_QUALITY_GATE",
    message: assessment.userFacingMessage,
    createInputSafety: assessment,
  };
}

export function redactCreateInputPayload<T extends Record<string, unknown>>(
  payload: T,
  assessment: CreateInputQualityAssessment,
): T & { createInputSafety: CreateInputQualityAssessment } {
  const next: Record<string, unknown> = { ...payload, createInputSafety: assessment };
  for (const key of TEXT_FIELD_KEYS) {
    if (typeof next[key] === "string") {
      next[key] = redactCreateInputText(String(next[key]));
    }
  }
  const analysis = next.analysis;
  if (analysis && typeof analysis === "object" && !Array.isArray(analysis)) {
    next.analysis = { ...(analysis as Record<string, unknown>), createInputSafety: assessment };
  }
  return next as T & { createInputSafety: CreateInputQualityAssessment };
}

export function mergeCreateInputSafetyIntoAnalyzePayload<T extends Record<string, unknown>>(
  payload: T,
  assessment: CreateInputQualityAssessment,
): T & { createInputSafety: CreateInputQualityAssessment } {
  const next: Record<string, unknown> = { ...payload, createInputSafety: assessment };
  const createAnalyze = next.createAnalyze;
  if (createAnalyze && typeof createAnalyze === "object" && !Array.isArray(createAnalyze)) {
    const ca = { ...(createAnalyze as Record<string, unknown>) };
    const existingFlags = Array.isArray(ca.uncertaintyFlags) ? ca.uncertaintyFlags.map(String) : [];
    ca.uncertaintyFlags = Array.from(new Set([...existingFlags, ...assessment.flags, `decision:${assessment.decision}`]));
    ca.requiresHumanReview = ca.requiresHumanReview === true || assessment.decision !== "allow";
    ca.noAutoPublish = true;
    ca.noSilentMerge = true;
    const phases = ca.phases && typeof ca.phases === "object" && !Array.isArray(ca.phases)
      ? { ...(ca.phases as Record<string, unknown>) }
      : {};
    const quality = phases.quality && typeof phases.quality === "object" && !Array.isArray(phases.quality)
      ? { ...(phases.quality as Record<string, unknown>) }
      : {};
    phases.quality = {
      ...quality,
      status: assessment.decision === "allow" ? quality.status ?? "done" : "review_required",
      summary: `${quality.summary ?? ""} InputQuality=${assessment.decision}; score=${assessment.qualityScore}.`.trim(),
    };
    ca.phases = phases;
    const evidenceNeeds = Array.isArray(ca.evidenceNeeds) ? [...ca.evidenceNeeds] : [];
    ca.evidenceNeeds = [
      ...evidenceNeeds,
      ...assessment.factcheckCandidates.map((item) => `Faktencheck empfohlen: ${item.text}`),
    ].slice(0, 10);
    next.createAnalyze = ca;
  }
  return next as T & { createInputSafety: CreateInputQualityAssessment };
}

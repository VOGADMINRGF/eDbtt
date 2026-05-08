export const CREATE_SAFETY_EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
export const CREATE_SAFETY_PHONE_RE = /(?:\+?\d[\d\s\-().]{6,}\d)/g;
export const CREATE_SAFETY_STREET_RE =
  /\b(?:[A-ZÄÖÜ][\p{L}-]*(?:straße|strasse|str\.?|weg|allee|platz|gasse|ring)|[A-ZÄÖÜ][\p{L}-]+(?:\s+[A-ZÄÖÜa-zäöüß][\p{L}-]+){0,3}\s+(?:straße|strasse|str\.?|weg|allee|platz|gasse|ring))\s+\d+[a-z]?\b/giu;
export const CREATE_SAFETY_POSTAL_RE = /\b\d{5}\b/g;

export const CREATE_SAFETY_CALL_TO_ACTION_RE =
  /\b(ruft?(?:\s+[^\s,.;:!?]+){0,6}\s+an|ruf(?:\s+[^\s,.;:!?]+){0,6}\s+an|geht?\s+zu|geht?\s+hin|postet|veröffentlicht|veroeffentlicht|teilt\s+die\s+adresse|droppt\s+die\s+adresse|call(?:\s+[^\s,.;:!?]+){0,4}\s+(him|her|them)|go\s+to\s+his\s+house|go\s+to\s+her\s+house|share\s+(his|her|their)\s+address|doxx)\b/giu;
export const CREATE_SAFETY_DOXXING_RE =
  /\b(doxx|adresse\s+teilen|adresse\s+veröffentlichen|adresse\s+veroeffentlichen|telefonnummer\s+teilen|share\s+the\s+address)\b/giu;
export const CREATE_SAFETY_THREAT_CONCRETE_RE =
  /\b(ich\s+bring(e)?\s+dich\s+um|wir\s+bringen\s+euch\s+um|wir\s+machen\s+euch\s+fertig|kill\s+you|we\s+will\s+hurt\s+you|anschlag|anzünden|anzuenden|wir\s+zünd(?:en|e?t)\s+[^\n.!?]{0,40}\s+an|wir\s+zuend(?:en|e?t)\s+[^\n.!?]{0,40}\s+an|zünd(?:en|e?t)\s+wir\s+[^\n.!?]{0,40}\s+an|zuend(?:en|e?t)\s+wir\s+[^\n.!?]{0,40}\s+an|verprügeln|verpruegeln)\b/giu;
export const CREATE_SAFETY_THREAT_IMPLICIT_RE =
  /\b(das\s+wird\s+folgen\s+haben|wird\s+das\s+folgen\s+haben|wir\s+kriegen\s+dich|wir\s+finden\s+dich|you\s+will\s+pay|there\s+will\s+be\s+consequences)\b/giu;
export const CREATE_SAFETY_SELF_JUSTICE_RE =
  /\b(selbstjustiz|wir\s+kümmern\s+uns\s+selbst|wir\s+kuemmern\s+uns\s+selbst|wir\s+regeln\s+das\s+selbst|take\s+justice\s+into\s+our\s+own\s+hands)\b/giu;

export const CREATE_SAFETY_INSULT_RE =
  /\b(idiot(en)?|dumm(kopf|e)?|verräter|verraeter|abschaum|schmarotzer|bastard|arschloch|spasti|clown(s)?|idiot(s)?|moron(s)?|stupid|trash)\b/giu;
export const CREATE_SAFETY_PUBLIC_ACTOR_RE =
  /\b(verwaltung|stadtrat|bürgermeister|buergermeister|amt|kommune|regierung|behörde|behoerde|presse|medien|redaktion)\b/giu;
export const CREATE_SAFETY_GROUP_ABUSE_RE =
  /\b(dreckspack|ungeziefer|parasiten|abschaum\s+von\s+(menschen|leuten)|all\s+(refugees|migrants|muslims)\s+are\s+(trash|criminals))\b/giu;

export const CREATE_SAFETY_POLITICAL_FRAMING_RE =
  /\b(linke(n)?|rechte(n)?|altparteien|mainstreammedien|woke|establishment|lager|propaganda)\b/giu;
export const CREATE_SAFETY_UNSUPPORTED_ALLEGATION_RE =
  /\b(absichtlich|vertuscht|mafia|skandal|manipuliert|manipulated|gekauft)\b/giu;
export const CREATE_SAFETY_CORRUPTION_OR_CAPTURE_RE =
  /\b(korruption|korrupt|investoren|presse\s+schreibt\s+nur|follow\s+the\s+money|bestechlich|captured\s+media)\b/giu;
export const CREATE_SAFETY_UNVERIFIED_NUMBER_RE =
  /\b(\d+[.,]?\d*\s*(million(en)?|million|mrd|milliarden?|billion|billions)|40\s+millionen|keine\s+ahnung\s+ob\s+die\s+zahl\s+stimmt|not\s+sure\s+if\s+that\s+number\s+is\s+correct)\b/giu;
export const CREATE_SAFETY_SOURCE_BLUFFING_RE =
  /\b(aus\s+sicherer\s+quelle|jeder\s+weiß|jeder\s+weiss|man\s+weiß\s+doch|man\s+weiss\s+doch|everyone\s+knows|trust\s+me|insider\s+say)\b/giu;
export const CREATE_SAFETY_CENSORSHIP_COUNTERCLAIM_RE =
  /\b(faktencheck\s+ist\s+zensur|fact[-\s]?checking\s+is\s+censorship|zensur|censorship)\b/giu;
export const CREATE_SAFETY_SPAM_CAMPAIGN_RE =
  /\b(postet\s+das\s+überall|alle\s+sollen\s+das\s+teilen|copy\s+paste\s+this\s+everywhere|mass\s+report|brigade)\b/giu;

export const CREATE_SAFETY_EVIDENCE_RE =
  /\b(quelle|quellen|beleg|belege|nachweis|nachweise|prüft|prueft|prüfen|pruefen|verify|verified|verification|evidence|source|sources)\b/giu;
export const CREATE_SAFETY_QUESTION_RE =
  /\?|(?:\b(stimmt\s+das|ist\s+das\s+belegt|gibt\s+es\s+belege|welche\s+quellen|kann\s+das\s+jemand\s+belegen|can\s+anyone\s+verify|what\s+evidence|is\s+there\s+evidence)\b)/giu;
export const CREATE_SAFETY_CIVIC_INTENT_RE =
  /\b(anliegen|frage|vorschlag|lösung|loesung|bitte|können\s+wir|koennen\s+wir|wir\s+sollten|öffentlich|oeffentlich|kommune|bezirk)\b/iu;
export const CREATE_SAFETY_SELF_PII_CONTEXT_RE =
  /\b(meine?|mein|ich\s+bin\s+erreichbar|ich\s+wohne|my\s+(email|number|phone|address)|you\s+can\s+reach\s+me)\b/iu;

const CREATE_SAFETY_LANGUAGE_PLACEHOLDER_PATTERNS = [
  { language: "en", pattern: /\b(the|but|claim|evidence|sources|verify|unclear|school|housing)\b/u },
  { language: "tr", pattern: /(?:\b(belediye|mahalle|ulaşım|ulasim)\b|[ıİğĞşŞçÇ])/u },
  { language: "ar", pattern: /[\u0600-\u06FF]/u },
  { language: "ru", pattern: /(?:\b(город|власть|дорога)\b|[ЁёЪъЫыЭэ])/u },
  { language: "uk", pattern: /(?:\b(місто|громада|влада)\b|[ЄєІіЇїҐґ])/u },
  { language: "pl", pattern: /(?:\b(miasto|gmina|transport)\b|[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ])/u },
] as const;

export type CreateSafetyLexiconSnapshot = {
  emails: string[];
  phones: string[];
  streetAddresses: string[];
  postalCodes: string[];
  callToActionMatches: string[];
  doxxingMatches: string[];
  threatConcreteMatches: string[];
  threatImplicitMatches: string[];
  selfJusticeMatches: string[];
  insultPublicActorMatches: string[];
  insultPrivatePersonMatches: string[];
  groupAbuseMatches: string[];
  politicalFramingMatches: string[];
  unsupportedAllegationMatches: string[];
  corruptionOrCaptureClaimMatches: string[];
  unverifiedNumberMatches: string[];
  sourceBluffingMatches: string[];
  censorshipCounterclaimMatches: string[];
  spamCampaignMatches: string[];
  questionMatches: string[];
  evidenceMatches: string[];
  allegationSentences: string[];
  questionSentences: string[];
  evidenceSentences: string[];
  selfPiiContextDetected: boolean;
  civicIntentDetected: boolean;
  languageRiskHints: string[];
};

function toGlobalRegex(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
}

function collectMatches(text: string, pattern: RegExp): string[] {
  const matches = text.match(toGlobalRegex(pattern));
  return Array.isArray(matches) ? matches.filter(Boolean) : [];
}

function testPattern(text: string, pattern: RegExp): boolean {
  return new RegExp(pattern.source, pattern.flags.replaceAll("g", "")).test(text);
}

function collectMatchingSentences(text: string, patterns: RegExp[]): string[] {
  return splitCreateSafetySentences(text).filter((sentence) =>
    patterns.some((pattern) => testPattern(sentence, pattern)),
  );
}

function dedupeEntries(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function splitCreateSafetySentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function redactCreateSafetySensitiveText(text: string): string {
  return text
    .replace(CREATE_SAFETY_EMAIL_RE, "[E-MAIL ENTFERNT]")
    .replace(CREATE_SAFETY_PHONE_RE, "[TELEFON ENTFERNT]")
    .replace(CREATE_SAFETY_STREET_RE, "[ADRESSE ENTFERNT]")
    .replace(CREATE_SAFETY_POSTAL_RE, "[PLZ ENTFERNT]");
}

export function sanitizeCreateSafetyExcerpt(text: string, maxLength = 160): string {
  const normalized = redactCreateSafetySensitiveText(text).replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function collectCreateSafetyLexicon(text: string): CreateSafetyLexiconSnapshot {
  const insultMatches = collectMatches(text, CREATE_SAFETY_INSULT_RE);
  const publicActorContextDetected = testPattern(text, CREATE_SAFETY_PUBLIC_ACTOR_RE);

  const languageRiskHints = CREATE_SAFETY_LANGUAGE_PLACEHOLDER_PATTERNS.filter(({ pattern }) =>
    pattern.test(text),
  ).map(({ language }) => language);

  return {
    emails: collectMatches(text, CREATE_SAFETY_EMAIL_RE),
    phones: collectMatches(text, CREATE_SAFETY_PHONE_RE),
    streetAddresses: collectMatches(text, CREATE_SAFETY_STREET_RE),
    postalCodes: collectMatches(text, CREATE_SAFETY_POSTAL_RE),
    callToActionMatches: collectMatches(text, CREATE_SAFETY_CALL_TO_ACTION_RE),
    doxxingMatches: collectMatches(text, CREATE_SAFETY_DOXXING_RE),
    threatConcreteMatches: collectMatches(text, CREATE_SAFETY_THREAT_CONCRETE_RE),
    threatImplicitMatches: collectMatches(text, CREATE_SAFETY_THREAT_IMPLICIT_RE),
    selfJusticeMatches: collectMatches(text, CREATE_SAFETY_SELF_JUSTICE_RE),
    insultPublicActorMatches: publicActorContextDetected ? insultMatches : [],
    insultPrivatePersonMatches: publicActorContextDetected ? [] : insultMatches,
    groupAbuseMatches: collectMatches(text, CREATE_SAFETY_GROUP_ABUSE_RE),
    politicalFramingMatches: collectMatches(text, CREATE_SAFETY_POLITICAL_FRAMING_RE),
    unsupportedAllegationMatches: collectMatches(text, CREATE_SAFETY_UNSUPPORTED_ALLEGATION_RE),
    corruptionOrCaptureClaimMatches: collectMatches(text, CREATE_SAFETY_CORRUPTION_OR_CAPTURE_RE),
    unverifiedNumberMatches: collectMatches(text, CREATE_SAFETY_UNVERIFIED_NUMBER_RE),
    sourceBluffingMatches: collectMatches(text, CREATE_SAFETY_SOURCE_BLUFFING_RE),
    censorshipCounterclaimMatches: collectMatches(text, CREATE_SAFETY_CENSORSHIP_COUNTERCLAIM_RE),
    spamCampaignMatches: collectMatches(text, CREATE_SAFETY_SPAM_CAMPAIGN_RE),
    questionMatches: collectMatches(text, CREATE_SAFETY_QUESTION_RE),
    evidenceMatches: collectMatches(text, CREATE_SAFETY_EVIDENCE_RE),
    allegationSentences: dedupeEntries(
      collectMatchingSentences(text, [
        CREATE_SAFETY_UNSUPPORTED_ALLEGATION_RE,
        CREATE_SAFETY_CORRUPTION_OR_CAPTURE_RE,
        CREATE_SAFETY_UNVERIFIED_NUMBER_RE,
        CREATE_SAFETY_SOURCE_BLUFFING_RE,
      ]),
    ),
    questionSentences: dedupeEntries(collectMatchingSentences(text, [CREATE_SAFETY_QUESTION_RE])),
    evidenceSentences: dedupeEntries(collectMatchingSentences(text, [CREATE_SAFETY_EVIDENCE_RE])),
    selfPiiContextDetected: CREATE_SAFETY_SELF_PII_CONTEXT_RE.test(text),
    civicIntentDetected: CREATE_SAFETY_CIVIC_INTENT_RE.test(text.toLowerCase()),
    languageRiskHints,
  };
}

export const LANDING_CONTRIBUTION_MIN_LENGTH = 20;
export const LANDING_CONTRIBUTION_MAX_LENGTH = 2000;
export const LANDING_START_CREATE_LIGHT_STORAGE_KEY = "landing-create-light-draft";
export const LANDING_EDITORIAL_REVIEW_STORAGE_KEY = "landing-editorial-review-draft";
export const LANDING_EDITORIAL_REVIEW_RETURN_TO = "/start?review=editorial";

export type LandingContributionIntent = "question" | "problem" | "proposal" | "opinion" | "note";

export type LandingContributionRelevance =
  | "public_relevant"
  | "needs_reframe"
  | "personal_only"
  | "spam_suspected"
  | "abusive_or_empty";

export type LandingContributionNextStep =
  | "continue_create"
  | "login_required"
  | "needs_reframe"
  | "request_editorial_review"
  | "blocked";

export type LandingContributionEditorialReviewRequest = {
  id: string;
  originalText: string;
  normalizedText?: string | null;
  relevanceClassification: LandingContributionRelevance;
  userReason?: string | null;
  createdAt: string;
  userId?: string | null;
  contactEmail?: string | null;
  status: "pending_review";
  source: "start_create_light";
  noAutoPublish: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoGraphPromotion: true;
  noAutoVote: true;
};

export type LandingContributionGuardrailState = {
  minLength: number;
  maxLength: number;
  isTooShort: boolean;
  isTooLong: boolean;
  spamSuspected: boolean;
  blockingMessage: string | null;
  canPreview: boolean;
};

export type LandingContributionGuidance = {
  classification: LandingContributionRelevance;
  title: string;
  body: string;
  helperText: string;
  hintChips: string[];
  allowEditorialReview: boolean;
  editorialReviewReasonRequired: boolean;
  nextStep: LandingContributionNextStep;
};

export type LandingContributionDraft = {
  sourceText: string;
  normalizedText: string;
  intent: LandingContributionIntent;
  relevanceClassification: LandingContributionRelevance;
  guidance: LandingContributionGuidance;
  guardrails: LandingContributionGuardrailState;
  suggestedThemes: string[];
  suggestedNextSteps: string[];
};

export type LandingContributionPreview = {
  title: string;
  contributionTypeLabel: string;
  topicLabels: string[];
  openQuestionLabels: string[];
  nextStepLabels: string[];
  notice: string;
  deepenHref: string;
  existingTopicHref: string;
  roundsHref: string;
  newTopicHref: string;
};

const TOPIC_RULES: ReadonlyArray<{ label: string; pattern: RegExp }> = [
  {
    label: "Mobilität & öffentlicher Raum",
    pattern: /\bradweg\b|\bschulweg\b|\bverkehr\b|\bbus\b|\bbahn\b|\bstraße\b|\ballee\b|\bparken\b/iu,
  },
  {
    label: "Wohnen & Nachbarschaft",
    pattern: /\bmiete\b|\bwohnen\b|\bwohnung\b|\bneubau\b|\bnachbarschaft\b|\bbezirk\b/iu,
  },
  {
    label: "Pflege & Gesundheit",
    pattern: /\bpflege\b|\bkrankenhaus\b|\bgesundheit\b|\bversorgung\b/iu,
  },
  {
    label: "Bildung & Familie",
    pattern: /\bschule\b|\bkita\b|\bfamilie\b|\bkinder\b|\bausbildung\b/iu,
  },
  {
    label: "Recht & Sicherheit",
    pattern: /\bstraftat\b|\bstraftaten\b|\bhaft\b|\bjustiz\b|\bsicherheit\b|\bpolizei\b/iu,
  },
  {
    label: "Staat & Transparenz",
    pattern: /\btransparenz\b|\bverwaltung\b|\bpolitiker\b|\bpolitikertransparenz\b|\bamt\b/iu,
  },
  {
    label: "Klima, Umwelt & Energie",
    pattern: /\bklima\b|\bumwelt\b|\benergie\b|\bsolar\b|\bgrün\b|\bbaum\b/iu,
  },
];

const PUBLIC_SIGNAL_PATTERN =
  /\b(öffentlich|politik|politisch|regel|regeln|gesetz|entscheidung|verwaltung|rathaus|kommune|bezirk|stadt|dorf|gemeinde|veranstaltung|schule|kita|radweg|verkehr|pflege|gesundheit|miete|wohnen|transparenz|sicherheit|justiz|grundschule|gruppe|nachbarschaft)\b/iu;

const PERSONAL_ONLY_PATTERN =
  /\b(neues? handy|smartphone|playstation|urlaub|mein handy|mein auto|mein laptop|mein fernseher|meine konsole|mehr taschengeld)\b/iu;

const REFRAme_SLOGAN_PATTERN =
  /\b(freibier für alle|alles gratis|gratis für alle|ich will geld|schenk mir|kostenlos für alle|umsonst für alle)\b/iu;

const AD_SCAM_PATTERN =
  /\b(gewinnspiel|casino|crypto|telegram|verdiene schnell|affiliate|angebot nur heute|jetzt kaufen|bonuscode)\b/iu;

const ABUSIVE_PATTERN =
  /\b(arschloch|hurensohn|verpiss dich|fick dich|scheiß|idiot)\b/iu;

export function normalizeLandingContributionText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function resolveIntent(normalizedText: string): LandingContributionIntent {
  const lower = normalizedText.toLowerCase();
  if (normalizedText.includes("?") || /\bich frage mich\b|\bwarum\b|\bwie\b|\bwelche[rsnm]?\b/iu.test(lower)) {
    return "question";
  }
  if (/\bich schlage vor\b|\bich möchte vorschlagen\b|\bvorschlag\b|\bwir sollten\b|\bes sollte\b/iu.test(lower)) {
    return "proposal";
  }
  if (/\bfehlt\b|\bproblem\b|\bmangel\b|\bfunktioniert nicht\b|\bzu wenig\b|\bzu teuer\b/iu.test(lower)) {
    return "problem";
  }
  if (/\bich bin für\b|\bich bin gegen\b|\bmeiner meinung nach\b|\bich finde\b/iu.test(lower)) {
    return "opinion";
  }
  return "note";
}

function resolveIntentLabel(intent: LandingContributionIntent) {
  switch (intent) {
    case "question":
      return "Frage";
    case "problem":
      return "Problem";
    case "proposal":
      return "Vorschlag";
    case "opinion":
      return "Meinung";
    default:
      return "Hinweis";
  }
}

function resolveThemes(normalizedText: string) {
  const labels = TOPIC_RULES.filter((rule) => rule.pattern.test(normalizedText)).map((rule) => rule.label);
  if (labels.length > 0) return labels.slice(0, 4);
  return ["Thema noch offen"];
}

function resolveNextSteps(intent: LandingContributionIntent) {
  switch (intent) {
    case "question":
      return ["Themen erkennen", "Offene Fragen sortieren", "Zu bestehendem Thema beitragen"];
    case "proposal":
      return ["Themen erkennen", "Als neues Thema vorschlagen", "Dossier aufbauen"];
    case "problem":
      return ["Themen erkennen", "Prüfen oder Quellen ergänzen", "Sichtweisen sammeln"];
    case "opinion":
      return ["Sichtweisen sammeln", "Abstimmen & auswerten", "Jetzt vertiefen"];
    default:
      return ["Themen erkennen", "Jetzt vertiefen", "Prüfen oder Quellen ergänzen"];
  }
}

function resolveOpenQuestions(intent: LandingContributionIntent, topicLabels: string[]) {
  const questions: string[] = [];

  if (topicLabels.includes("Mobilität & öffentlicher Raum")) {
    questions.push("Wo zeigt sich das Problem oder der Vorschlag konkret?");
  }
  if (topicLabels.includes("Staat & Transparenz")) {
    questions.push("Welche Informationen, Entscheidungen oder Abläufe sind noch unklar?");
  }
  if (topicLabels.includes("Pflege & Gesundheit")) {
    questions.push("Welche Folgen spüren Betroffene oder Einrichtungen zuerst?");
  }

  if (intent === "question") {
    questions.push("Welche Antwort oder Klärung wird öffentlich wirklich gebraucht?");
  }
  if (intent === "proposal") {
    questions.push("Welche Schritte oder Folgen sollten vor einer Umsetzung geprüft werden?");
  }
  if (intent === "problem") {
    questions.push("Wer ist betroffen und was müsste sich zuerst ändern?");
  }

  if (questions.length === 0) {
    questions.push(
      "Welche offene Frage sollte vor dem nächsten öffentlichen Schritt zuerst geklärt werden?",
    );
  }

  return Array.from(new Set(questions)).slice(0, 3);
}

function countLinks(normalizedText: string) {
  const matches = normalizedText.match(/https?:\/\/\S+/giu);
  return matches?.length ?? 0;
}

function hasPublicSignals(normalizedText: string, suggestedThemes: string[]) {
  return suggestedThemes[0] !== "Thema noch offen" || PUBLIC_SIGNAL_PATTERN.test(normalizedText);
}

function classifyRelevance(
  normalizedText: string,
  suggestedThemes: string[],
): LandingContributionRelevance {
  if (REFRAme_SLOGAN_PATTERN.test(normalizedText)) {
    return "needs_reframe";
  }

  if (!normalizedText || normalizedText.length < LANDING_CONTRIBUTION_MIN_LENGTH) {
    return "abusive_or_empty";
  }

  if (ABUSIVE_PATTERN.test(normalizedText) && !hasPublicSignals(normalizedText, suggestedThemes)) {
    return "abusive_or_empty";
  }

  const linkCount = countLinks(normalizedText);
  if (linkCount >= 2 || (linkCount >= 1 && AD_SCAM_PATTERN.test(normalizedText))) {
    return "spam_suspected";
  }
  if (AD_SCAM_PATTERN.test(normalizedText)) {
    return "spam_suspected";
  }

  if (PERSONAL_ONLY_PATTERN.test(normalizedText) && !hasPublicSignals(normalizedText, suggestedThemes)) {
    return "personal_only";
  }

  const wordCount = normalizedText.split(/\s+/u).filter(Boolean).length;
  if (wordCount <= 5 && !hasPublicSignals(normalizedText, suggestedThemes)) {
    return "needs_reframe";
  }

  if (!hasPublicSignals(normalizedText, suggestedThemes)) {
    return "needs_reframe";
  }

  return "public_relevant";
}

function buildGuidance(classification: LandingContributionRelevance): LandingContributionGuidance {
  switch (classification) {
    case "needs_reframe":
      return {
        classification,
        title: "Das wirkt noch eher wie eine zugespitzte oder scherzhafte Forderung.",
        body:
          "Damit daraus ein sinnvoller Beitrag wird: Welches öffentliche Problem, welche Entscheidung oder welche Regel möchtest du eigentlich ansprechen?",
        helperText:
          "Du kannst deinen Beitrag überarbeiten – oder ihn zur redaktionellen Prüfung geben, wenn du meinst, dass wir ihn falsch einordnen.",
        hintChips: [
          "Als Frage formulieren",
          "Betroffene Gruppe nennen",
          "Ort oder Zuständigkeit ergänzen",
          "öffentliches Problem beschreiben",
        ],
        allowEditorialReview: true,
        editorialReviewReasonRequired: false,
        nextStep: "needs_reframe",
      };
    case "personal_only":
      return {
        classification,
        title: "Das klingt aktuell eher nach einem persönlichen Wunsch.",
        body:
          "eDebatte eignet sich vor allem für Anliegen mit öffentlicher Bedeutung. Beschreibe bitte, welche Gruppe, welcher Ort oder welche Regel betroffen ist.",
        helperText:
          "Du kannst eine redaktionelle Prüfung anfragen, wenn du meinst, dass wir die öffentliche Relevanz deines Anliegens falsch einschätzen.",
        hintChips: [
          "Betroffene Gruppe nennen",
          "Ort oder Bezirk ergänzen",
          "Regel oder Entscheidung benennen",
          "öffentliches Problem beschreiben",
        ],
        allowEditorialReview: true,
        editorialReviewReasonRequired: true,
        nextStep: "request_editorial_review",
      };
    case "spam_suspected":
      return {
        classification,
        title: "Diese Eingabe kann so nicht eingeordnet werden.",
        body:
          "Bitte beschreibe ein konkretes öffentliches Anliegen ohne Werbung, Wiederholungen oder irrelevante Links.",
        helperText:
          "Eindeutige Werbung, Scam-Muster oder Linkspam leiten wir nicht in eine redaktionelle Prüfung weiter.",
        hintChips: ["konkretes Anliegen beschreiben", "ohne Links formulieren", "Werbung entfernen"],
        allowEditorialReview: false,
        editorialReviewReasonRequired: false,
        nextStep: "blocked",
      };
    case "abusive_or_empty":
      return {
        classification,
        title: "Bitte formuliere dein Anliegen sachlich.",
        body:
          "Kritik ist willkommen, persönliche Angriffe helfen bei der Einordnung nicht weiter.",
        helperText:
          "Bitte beschreibe das dahinterliegende Problem oder die öffentliche Frage etwas genauer.",
        hintChips: ["sachlich formulieren", "konkretes Problem nennen", "öffentliche Frage ergänzen"],
        allowEditorialReview: false,
        editorialReviewReasonRequired: false,
        nextStep: "blocked",
      };
    default:
      return {
        classification,
        title: "Dein Beitrag kann eingeordnet werden.",
        body:
          "Wir zeigen dir zunächst einen leichten Entwurf, bevor du entscheidest, ob du in /create weiterarbeitest.",
        helperText: "Noch nicht veröffentlicht.",
        hintChips: [],
        allowEditorialReview: false,
        editorialReviewReasonRequired: false,
        nextStep: "continue_create",
      };
  }
}

function buildGuardrails(
  normalizedText: string,
  classification: LandingContributionRelevance,
): LandingContributionGuardrailState {
  const isTooShort = normalizedText.length < LANDING_CONTRIBUTION_MIN_LENGTH;
  const isTooLong = normalizedText.length > LANDING_CONTRIBUTION_MAX_LENGTH;
  const linkCount = countLinks(normalizedText);
  const spamSuspected = classification === "spam_suspected";

  let blockingMessage: string | null = null;
  if (isTooShort) {
    blockingMessage = "Bitte beschreibe dein Anliegen noch etwas genauer.";
  } else if (isTooLong) {
    blockingMessage = "Bitte kürze deinen Text etwas, damit wir ihn sauber einordnen können.";
  } else if (classification === "spam_suspected") {
    blockingMessage =
      linkCount >= 2
        ? "Diese Eingabe wirkt gerade wie Linkspam. Bitte beschreibe ein öffentliches Anliegen ohne Werbelinks."
        : "Diese Eingabe kann so nicht eingeordnet werden. Bitte beschreibe ein konkretes öffentliches Anliegen.";
  } else if (classification === "abusive_or_empty") {
    blockingMessage = "Bitte formuliere dein Anliegen sachlich und etwas genauer.";
  }

  return {
    minLength: LANDING_CONTRIBUTION_MIN_LENGTH,
    maxLength: LANDING_CONTRIBUTION_MAX_LENGTH,
    isTooShort,
    isTooLong,
    spamSuspected,
    blockingMessage,
    canPreview: !isTooShort && !isTooLong && classification === "public_relevant",
  };
}

export function buildLandingContributionDraft(sourceText: string): LandingContributionDraft {
  const normalizedText = normalizeLandingContributionText(sourceText);
  const intent = resolveIntent(normalizedText);
  const suggestedThemes = resolveThemes(normalizedText);
  const relevanceClassification = classifyRelevance(normalizedText, suggestedThemes);
  const guidance = buildGuidance(relevanceClassification);
  return {
    sourceText,
    normalizedText,
    intent,
    relevanceClassification,
    guidance,
    guardrails: buildGuardrails(normalizedText, relevanceClassification),
    suggestedThemes,
    suggestedNextSteps: resolveNextSteps(intent),
  };
}

export function buildLandingContributionPreview(sourceText: string): {
  draft: LandingContributionDraft;
  preview: LandingContributionPreview | null;
} {
  const draft = buildLandingContributionDraft(sourceText);
  if (!draft.guardrails.canPreview) {
    return { draft, preview: null };
  }

  const deepenParams = new URLSearchParams({
    intent: "contribute",
    entryIntent: "issue_signal",
    entryMode: "guided",
    startDraft: "1",
  });
  const newTopicParams = new URLSearchParams({
    intent: "contribute",
    entryIntent: "issue_signal",
    entryMode: "direct",
    startDraft: "1",
  });
  const roundParams = new URLSearchParams({
    startDraft: "1",
    from: "start",
  });

  return {
    draft,
    preview: {
      title: "Erster Entwurf deiner Einordnung",
      contributionTypeLabel: resolveIntentLabel(draft.intent),
      topicLabels: draft.suggestedThemes,
      openQuestionLabels: resolveOpenQuestions(draft.intent, draft.suggestedThemes),
      nextStepLabels: draft.suggestedNextSteps,
      notice: "Diese Einordnung ist noch nicht veröffentlicht.",
      deepenHref: `/create?${deepenParams.toString()}`,
      existingTopicHref: "/themen?startDraft=1",
      roundsHref: `/runden/new?${roundParams.toString()}`,
      newTopicHref: `/create?${newTopicParams.toString()}`,
    },
  };
}

export function resolveLandingContinueAction(preview: LandingContributionPreview, isAuthenticated: boolean) {
  if (isAuthenticated) {
    return {
      href: preview.deepenHref,
      label: "Jetzt vertiefen",
    } as const;
  }

  return {
    href: `/login?next=${encodeURIComponent(preview.deepenHref)}&draft=start`,
    label: "Einloggen und weiterarbeiten",
  } as const;
}

export function buildLandingEditorialReviewResumeHref() {
  return LANDING_EDITORIAL_REVIEW_RETURN_TO;
}

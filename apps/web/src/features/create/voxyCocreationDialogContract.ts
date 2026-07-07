import {
  resolveCreateLanguageContext,
} from "@/features/create/languageContextContract";
import {
  usesCanonicalRtlLayout,
} from "@/features/create/languageBridgeTrustFormatContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";

export const VOXY_COCREATION_DIALOGUE_MODES = [
  "contribution_clarification",
  "missing_perspectives",
  "common_good_reflection",
  "evidence_reference_need",
  "local_global_context",
  "counterposition_probe",
  "affected_groups_probe",
  "example_request",
  "solution_path_probe",
  "moderation_safety_probe",
] as const;

export type VoxyCocreationDialogueMode =
  (typeof VOXY_COCREATION_DIALOGUE_MODES)[number];

export const VOXY_COCREATION_PROMPT_TYPES = [
  "question",
  "suggestion",
  "reflection",
  "reference_need",
  "perspective_gap",
  "blocker",
] as const;

export type VoxyCocreationPromptType =
  (typeof VOXY_COCREATION_PROMPT_TYPES)[number];

export const VOXY_COCREATION_STATUSES = [
  "prepared",
  "needs_user_input",
  "answered",
  "needs_review",
  "blocked_by_runtime_truth",
  "readmodel_only",
] as const;

export type VoxyCocreationStatus = (typeof VOXY_COCREATION_STATUSES)[number];

export type VoxyCocreationContributionRef = {
  id: string;
  title: string;
  href?: string | null;
};

export type VoxyCocreationPromptCard = {
  id: string;
  dialogueMode: VoxyCocreationDialogueMode;
  promptType: VoxyCocreationPromptType;
  status: VoxyCocreationStatus;
  userVisibleQuestion: string;
  userVisibleReason: string;
  optionalSuggestedAnswerFormat: string | null;
  requiredHumanInput: string;
  reviewRequired: true;
  nextStep: string;
  languageDisplay: string;
  translationDisplay: string;
  originalPreserved: true;
  noManipulation: true;
  publicSafeLabel: string;
  currentInputStateLabel: string;
  internalReason?: string | null;
};

export type V3VoxyCocreationDialogModel = {
  title: string;
  summary: string;
  status: VoxyCocreationStatus;
  contributionRef: VoxyCocreationContributionRef | null;
  sourceLanguage: string;
  readingLanguage: string;
  originalTextAvailable: boolean;
  translationAvailable: boolean;
  rtl: boolean;
  originalPreserved: true;
  noManipulation: true;
  reviewRequired: true;
  autoPublish: false;
  cards: VoxyCocreationPromptCard[];
};

export type BuildVoxyCocreationDialogInput = {
  contributionRef?: VoxyCocreationContributionRef | null;
  sourceLanguage?: string | null;
  readingLanguage?: string | null;
  uiLocale?: string | null;
  originalText?: string | null;
  translationText?: string | null;
  summaryText?: string | null;
  sourcePresent?: boolean;
  openQuestions?: readonly string[];
  uncertaintyNotes?: readonly string[];
  missingPerspectiveCount?: number;
  counterPositionCount?: number;
  questionCount?: number;
  claimCount?: number;
  evidenceGapCount?: number;
  scopeHint?: string | null;
  voxyBriefingState?:
    | "not_connected"
    | "candidate_connected"
    | "blocked_by_runtime_truth";
  maxCards?: number;
  surface?: "create" | "account" | "admin" | "workspace";
};

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => normalizeText(value)).filter(Boolean)));
}

function hasText(value: string | null | undefined): boolean {
  return normalizeText(value).length > 0;
}

function buildLanguageLabel(language: string): string {
  if (language === "de") return "Deutsch";
  if (language === "en") return "Englisch";
  if (language === "fr") return "Französisch";
  if (language === "tr") return "Türkisch";
  if (language === "ar") return "Arabisch";
  if (language === "fa") return "Persisch";
  if (language === "he") return "Hebräisch";
  if (language === "ur") return "Urdu";
  return language;
}

function dialogueModeLabel(value: VoxyCocreationDialogueMode): string {
  if (value === "contribution_clarification") return "Beitrag klären";
  if (value === "missing_perspectives") return "Perspektiven ergänzen";
  if (value === "common_good_reflection") return "Gemeinwohl mitdenken";
  if (value === "evidence_reference_need") return "Quellenbedarf klären";
  if (value === "local_global_context") return "Vergleichsraum klären";
  if (value === "counterposition_probe") return "Gegenposition mitdenken";
  if (value === "affected_groups_probe") return "Betroffene Gruppen";
  if (value === "example_request") return "Beispiel ergänzen";
  if (value === "solution_path_probe") return "Lösungsweg schärfen";
  return "Review-Grenzen beachten";
}

function buildLanguageDisplay(params: {
  sourceLanguage: string;
  readingLanguage: string;
  rtl: boolean;
}): string {
  const sourceLabel = buildLanguageLabel(params.sourceLanguage);
  const readingLabel = buildLanguageLabel(params.readingLanguage);
  const rtlLabel = params.rtl ? " · RTL-Hinweis aktiv" : "";
  return `Original: ${sourceLabel} · Lesefassung: ${readingLabel}${rtlLabel}`;
}

function buildTranslationDisplay(params: {
  sourceLanguage: string;
  readingLanguage: string;
  translationAvailable: boolean;
}): string {
  if (params.translationAvailable) {
    return "Original und Übersetzung bleiben getrennt. Die Übersetzung ist nur Lesehilfe.";
  }
  if (params.sourceLanguage !== params.readingLanguage) {
    return "Die Originalsprache bleibt maßgeblich. Eine getrennte Lesefassung kann ergänzt werden.";
  }
  return "Original bleibt erhalten. Es wird keine geglättete Ersatzfassung behauptet.";
}

function containsPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function hasConcreteExample(text: string): boolean {
  return containsPattern(text, [
    /\b(zum beispiel|beispielsweise|z\.\s?b\.|konkret|etwa)\b/i,
    /\b(for example|for instance|such as)\b/i,
    /\b(par exemple)\b/i,
    /\b(örneğin|örnek|mesela)\b/i,
    /(?:مثال|مثلاً)/i,
    /\b\d{1,4}\b/,
  ]);
}

function hasAffectedGroupsCue(text: string): boolean {
  return containsPattern(text, [
    /\b(menschen|anwohner|bewohner|kinder|jugendliche|eltern|mieter|pendler|familien|schüler|vereine|unternehmen|nachbarn|gruppen)\b/i,
    /\b(people|residents|children|families|workers|tenants|students|parents|community|groups)\b/i,
    /\b(insanlar|öğrenci|öğrenciler|aile|aileler|kiracı|kiracılar|komşu|komşular|çocuk|çocuklar|grup|gruplar)\b/i,
    /(?:السكان|الأطفال|العائلات|الطلاب|المستأجرين|الناس|المجتمع|الفئات)/i,
  ]);
}

function hasScopeCue(text: string): boolean {
  return containsPattern(text, [
    /\b(bezirk|stadt|kommune|gemeinde|deutschland|bund|land|europa|eu|welt|lokal|regional|national|global)\b/i,
    /\b(city|local|regional|national|global|europe|worldwide)\b/i,
    /\b(şehir|belediye|mahalle|yerel|bölgesel|ulusal|avrupa|dünya)\b/i,
    /(?:محلي|وطني|عالمي|أوروبا|بلدية|مدينة)/i,
  ]);
}

function hasDemandCue(text: string): boolean {
  return containsPattern(text, [
    /\b(sollte|sollten|muss|müssen|fordern|fordert|braucht|brauchen)\b/i,
    /\b(should|must|need|needs|demand)\b/i,
    /\b(gerek|gerekir|olmalı|olmalıyız|istemek)\b/i,
    /(?:يجب|نحتاج|مطالب)/i,
  ]);
}

function hasSolutionCue(text: string): boolean {
  return containsPattern(text, [
    /\b(plan|schritt|schritte|umsetzen|umsetzung|finanzieren|vorschlag|lösung|lösungsweg)\b/i,
    /\b(plan|step|steps|implement|implementation|solution|proposal|funding)\b/i,
    /\b(plan|adım|adımlar|uygula|uygulama|çözüm|öneri|finansman)\b/i,
    /(?:خطة|خطوة|خطوات|تنفيذ|حل|اقتراح|تمويل)/i,
  ]);
}

function resolveTopLevelStatus(cards: readonly VoxyCocreationPromptCard[]): VoxyCocreationStatus {
  if (cards.some((card) => card.status === "needs_user_input")) return "needs_user_input";
  if (cards.some((card) => card.status === "needs_review")) return "needs_review";
  if (cards.some((card) => card.status === "blocked_by_runtime_truth")) {
    return "blocked_by_runtime_truth";
  }
  if (cards.some((card) => card.status === "prepared")) return "prepared";
  return "readmodel_only";
}

function buildCardBase(params: {
  id: string;
  dialogueMode: VoxyCocreationDialogueMode;
  promptType: VoxyCocreationPromptType;
  status: VoxyCocreationStatus;
  sourceLanguage: string;
  readingLanguage: string;
  translationAvailable: boolean;
  rtl: boolean;
  userVisibleQuestion: string;
  userVisibleReason: string;
  optionalSuggestedAnswerFormat?: string | null;
  requiredHumanInput: string;
  nextStep: string;
  currentInputStateLabel: string;
  internalReason?: string | null;
}): VoxyCocreationPromptCard {
  return {
    id: params.id,
    dialogueMode: params.dialogueMode,
    promptType: params.promptType,
    status: params.status,
    userVisibleQuestion: params.userVisibleQuestion,
    userVisibleReason: params.userVisibleReason,
    optionalSuggestedAnswerFormat: params.optionalSuggestedAnswerFormat ?? null,
    requiredHumanInput: params.requiredHumanInput,
    reviewRequired: true,
    nextStep: params.nextStep,
    languageDisplay: buildLanguageDisplay({
      sourceLanguage: params.sourceLanguage,
      readingLanguage: params.readingLanguage,
      rtl: params.rtl,
    }),
    translationDisplay: buildTranslationDisplay({
      sourceLanguage: params.sourceLanguage,
      readingLanguage: params.readingLanguage,
      translationAvailable: params.translationAvailable,
    }),
    originalPreserved: true,
    noManipulation: true,
    publicSafeLabel: dialogueModeLabel(params.dialogueMode),
    currentInputStateLabel: params.currentInputStateLabel,
    internalReason: params.internalReason ?? null,
  };
}

type PrioritizedCard = {
  priority: number;
  card: VoxyCocreationPromptCard;
};

function pushIfMissing(
  target: PrioritizedCard[],
  entry: PrioritizedCard | null,
) {
  if (!entry) return;
  if (target.some((existing) => existing.card.id === entry.card.id)) return;
  target.push(entry);
}

function buildSummary(params: {
  status: VoxyCocreationStatus;
  surface: NonNullable<BuildVoxyCocreationDialogInput["surface"]>;
  sourceLanguage: string;
  readingLanguage: string;
}): string {
  const languageSplit =
    params.sourceLanguage !== params.readingLanguage
      ? " Originalsprache und Lesefassung bleiben getrennt."
      : "";
  const surfaceLabel =
    params.surface === "create"
      ? "Antworten verbessern den Beitrag, veröffentlichen aber nichts."
      : params.surface === "account"
        ? "Die Hinweise bleiben read-only und helfen beim Weiterarbeiten."
        : "Die Hinweise markieren nur menschlichen Ergänzungsbedarf.";
  if (params.status === "blocked_by_runtime_truth") {
    return `${surfaceLabel} Echte Dialog-Runtime wird nicht vorgetäuscht.${languageSplit}`;
  }
  return `${surfaceLabel} Voxy bleibt respektvoll, review-first und ohne Faktenbehauptung.${languageSplit}`;
}

export function buildVoxyCocreationDialog(
  input: BuildVoxyCocreationDialogInput,
): V3VoxyCocreationDialogModel | null {
  const originalText = normalizeText(input.originalText);
  const summaryText = normalizeText(input.summaryText);
  if (!originalText && !summaryText) return null;

  const languageContext = resolveCreateLanguageContext({
    sourceLanguage: input.sourceLanguage,
    contentLanguage: input.readingLanguage,
    uiLocale: input.uiLocale ?? input.readingLanguage,
  });
  const sourceLanguage = languageContext.sourceLanguage;
  const readingLanguage =
    resolveCreateLanguageContext({
      sourceLanguage,
      contentLanguage: input.readingLanguage ?? input.uiLocale,
      uiLocale: input.uiLocale ?? input.readingLanguage ?? sourceLanguage,
    }).contentLanguage;
  const translationAvailable =
    hasText(input.translationText) && sourceLanguage !== readingLanguage;
  const rtl =
    usesCanonicalRtlLayout(sourceLanguage) || usesCanonicalRtlLayout(readingLanguage);
  const textForSignals = `${originalText} ${summaryText}`.trim();
  const openQuestions = unique(input.openQuestions ?? []);
  const uncertaintyNotes = unique(input.uncertaintyNotes ?? []);
  const cards: PrioritizedCard[] = [];
  const maxCards = Math.max(2, Math.min(input.maxCards ?? 5, 5));
  const sourcePresent = input.sourcePresent === true;
  const evidenceGapCount = Math.max(input.evidenceGapCount ?? 0, uncertaintyNotes.length);
  const counterPositionCount = Math.max(input.counterPositionCount ?? 0, 0);
  const missingPerspectiveCount = Math.max(input.missingPerspectiveCount ?? 0, 0);
  const scopeKnown = hasText(input.scopeHint) || hasScopeCue(textForSignals);
  const surface = input.surface ?? "create";

  if (openQuestions[0]) {
    pushIfMissing(cards, {
      priority: 10,
      card: buildCardBase({
        id: "voxy-open-question",
        dialogueMode: "contribution_clarification",
        promptType: "question",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion: openQuestions[0],
        userVisibleReason:
          "Im bestehenden Arbeitsstand ist bereits eine offene Rückfrage sichtbar. Voxy macht daraus keine Entscheidung, sondern nur einen menschlichen Klärungspunkt.",
        optionalSuggestedAnswerFormat:
          "Antworte mit 1-3 Sätzen oder einem kurzen Beispiel. Wenn nötig, ergänze danach eine getrennte Lesefassung.",
        requiredHumanInput: "Eigene Präzisierung oder Ergänzung",
        nextStep: "Antwort ergänzen und anschließend weiter prüfen",
        currentInputStateLabel: "Noch keine belastbare Ergänzung im bestehenden Arbeitsstand",
        internalReason: "existing_open_question",
      }),
    });
  }

  if (sourceLanguage !== readingLanguage || rtl || translationAvailable) {
    const readingLabel = buildLanguageLabel(readingLanguage);
    pushIfMissing(cards, {
      priority: 20,
      card: buildCardBase({
        id: "voxy-language-bridge",
        dialogueMode: "contribution_clarification",
        promptType: "reflection",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion:
          readingLanguage === "de"
            ? "Möchtest du im Original antworten oder zusätzlich eine deutsche Lesefassung ergänzen?"
            : `Möchtest du im Original antworten oder zusätzlich eine ${readingLabel}-Lesefassung ergänzen?`,
        userVisibleReason:
          "Originalsprache und Lesesprache bleiben getrennt. Sprachwechsel gilt hier nicht als Fehler und ersetzt niemals das Original.",
        optionalSuggestedAnswerFormat:
          "Antworte zuerst in deiner Originalsprache. Ergänze eine getrennte Lesefassung nur, wenn sie anderen beim Mitlesen hilft.",
        requiredHumanInput: "Sprachwahl für die nächste Ergänzung",
        nextStep: "Original behalten und optionale Lesefassung getrennt ergänzen",
        currentInputStateLabel:
          translationAvailable
            ? "Lesefassung vorhanden, aber das Original bleibt maßgeblich"
            : "Noch keine getrennte Lesefassung im Arbeitsstand",
        internalReason: rtl ? "rtl_or_cross_lingual_context" : "cross_lingual_context",
      }),
    });
  }

  if (!hasConcreteExample(textForSignals)) {
    pushIfMissing(cards, {
      priority: 30,
      card: buildCardBase({
        id: "voxy-example-request",
        dialogueMode: "example_request",
        promptType: "suggestion",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion: "Welches konkrete Beispiel würde deinen Beitrag stärker und prüfbarer machen?",
        userVisibleReason:
          "Ein nachvollziehbares Beispiel macht die Aussage anschlussfähiger, ohne deine Sichtweise zu glätten oder umzuschreiben.",
        optionalSuggestedAnswerFormat:
          "Nenne eine konkrete Situation, einen Ort, einen Zeitpunkt oder eine beobachtete Folge.",
        requiredHumanInput: "Konkretes Beispiel",
        nextStep: "Ein Beispiel oder eine konkrete Beobachtung ergänzen",
        currentInputStateLabel: "Noch kein klares Beispiel im bestehenden Arbeitsstand",
        internalReason: "no_concrete_example_detected",
      }),
    });
  }

  if (!sourcePresent || evidenceGapCount > 0) {
    pushIfMissing(cards, {
      priority: 40,
      card: buildCardBase({
        id: "voxy-evidence-reference-need",
        dialogueMode: "evidence_reference_need",
        promptType: "reference_need",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion: "Welche Quelle, Erfahrung oder Beobachtung stützt deine Einschätzung?",
        userVisibleReason:
          "Fehlende Quellen werden hier als Bedarf markiert. Voxy erfindet keine Recherche und keinen Beleg.",
        optionalSuggestedAnswerFormat:
          "Verlinke eine Quelle oder beschreibe knapp, worauf deine Beobachtung beruht.",
        requiredHumanInput: "Quelle, Erfahrung oder Beobachtung",
        nextStep: "Quellenbedarf ergänzen und danach review-first weiterarbeiten",
        currentInputStateLabel:
          sourcePresent
            ? "Quellenkontext ist teilweise vorhanden, aber noch nicht belastbar genug"
            : "Noch kein belastbarer Quellenkontext im Arbeitsstand",
        internalReason: evidenceGapCount > 0 ? uncertaintyNotes.join(", ") : "source_needed",
      }),
    });
  }

  if (counterPositionCount === 0 && missingPerspectiveCount === 0) {
    pushIfMissing(cards, {
      priority: 50,
      card: buildCardBase({
        id: "voxy-counterposition-probe",
        dialogueMode: "counterposition_probe",
        promptType: "perspective_gap",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion: "Welche Gegenposition sollte fairerweise mitgedacht werden?",
        userVisibleReason:
          "Das ist keine Moderationsentscheidung und kein Urteil über deinen Beitrag. Es ist nur eine faire Gegenprobe auf Anschlussfähigkeit.",
        optionalSuggestedAnswerFormat:
          "Formuliere eine Gegenperspektive in 1-2 Sätzen, auch wenn du ihr nicht zustimmst.",
        requiredHumanInput: "Faire Gegenposition",
        nextStep: "Gegenposition benennen und danach im Review-Kontext abgleichen",
        currentInputStateLabel: "Noch keine belastbare Gegenposition im Arbeitsstand",
        internalReason: "missing_counterposition",
      }),
    });
  }

  if (!hasAffectedGroupsCue(textForSignals)) {
    pushIfMissing(cards, {
      priority: 60,
      card: buildCardBase({
        id: "voxy-affected-groups",
        dialogueMode: "affected_groups_probe",
        promptType: "question",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion: "Welche Gruppen wären direkt betroffen und warum?",
        userVisibleReason:
          "Betroffenengruppen sichtbar zu machen hilft beim fairen Vergleich unterschiedlicher Perspektiven. Es bewertet nicht den Verfasser.",
        optionalSuggestedAnswerFormat:
          "Nenne 2-4 betroffene Gruppen und beschreibe je eine Auswirkung in einem Halbsatz.",
        requiredHumanInput: "Betroffene Gruppen",
        nextStep: "Betroffene Gruppen ergänzen",
        currentInputStateLabel: "Betroffene Gruppen sind noch nicht klar benannt",
        internalReason: "missing_affected_groups",
      }),
    });
  }

  if (!scopeKnown) {
    pushIfMissing(cards, {
      priority: 70,
      card: buildCardBase({
        id: "voxy-local-global-context",
        dialogueMode: "local_global_context",
        promptType: "question",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion:
          "Geht es um deinen Ort, Deutschland, Europa oder einen weltweiten Vergleich?",
        userVisibleReason:
          "Der Vergleichsraum macht den Beitrag besser prüfbar. Voxy leitet daraus keine automatische Zusammenführung oder Reichweitenbehauptung ab.",
        optionalSuggestedAnswerFormat:
          "Ordne den Beitrag kurz als lokal, regional, national, europäisch oder weltweit ein.",
        requiredHumanInput: "Vergleichsraum",
        nextStep: "Vergleichsraum ergänzen",
        currentInputStateLabel: "Vergleichsraum ist noch offen",
        internalReason: "missing_scope_context",
      }),
    });
  }

  if (hasDemandCue(textForSignals) && !hasSolutionCue(textForSignals)) {
    pushIfMissing(cards, {
      priority: 80,
      card: buildCardBase({
        id: "voxy-solution-path",
        dialogueMode: "solution_path_probe",
        promptType: "reflection",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion: "Welche umsetzbare Lösung wäre aus deiner Sicht fair?",
        userVisibleReason:
          "Starke Forderungen werden so in einen nachvollziehbaren Lösungsweg übersetzt. Es gibt dabei keinen Auto-Plan und keine Auto-Moderation.",
        optionalSuggestedAnswerFormat:
          "Nenne einen ersten Schritt, wer handeln müsste und woran man Fairness erkennen könnte.",
        requiredHumanInput: "Umsetzbarer Lösungsweg",
        nextStep: "Lösungsweg konkretisieren",
        currentInputStateLabel: "Noch kein klarer Lösungsweg im Arbeitsstand",
        internalReason: "demand_without_solution_path",
      }),
    });
  }

  if ((input.claimCount ?? 0) > 0 || hasText(textForSignals)) {
    pushIfMissing(cards, {
      priority: 90,
      card: buildCardBase({
        id: "voxy-common-good",
        dialogueMode: "common_good_reflection",
        promptType: "reflection",
        status: "needs_user_input",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion:
          "Welche Auswirkung hätte dein Vorschlag auf Menschen mit anderer Perspektive?",
        userVisibleReason:
          "Die Gemeinwohlfrage ist keine Bewertung des Verfassers. Sie hilft nur, mögliche Konflikte und Nebenwirkungen sichtbar zu machen.",
        optionalSuggestedAnswerFormat:
          "Beschreibe kurz eine mögliche positive und eine mögliche schwierige Folge für andere.",
        requiredHumanInput: "Gemeinwohl- und Konfliktwirkung",
        nextStep: "Gemeinwohlfrage mit einer knappen Ergänzung beantworten",
        currentInputStateLabel: "Gemeinwohl- und Konfliktwirkung ist noch nicht beschrieben",
        internalReason: "common_good_reflection_needed",
      }),
    });
  }

  if (input.voxyBriefingState === "candidate_connected") {
    pushIfMissing(cards, {
      priority: 100,
      card: buildCardBase({
        id: "voxy-briefing-bridge",
        dialogueMode: "moderation_safety_probe",
        promptType: "blocker",
        status: "readmodel_only",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion:
          "Welche Ergänzung würde später ein besseres Voxy-Briefing ermöglichen, ohne schon ein Video zu erzeugen?",
        userVisibleReason:
          "Der Briefing-Anschluss bleibt nur ein Kandidat. Rendern, Provider-Ausführung und Publishing sind weiterhin blockiert oder bewusst nicht aktiv.",
        optionalSuggestedAnswerFormat:
          "Ergänze einen knappen Kernpunkt, der später als Briefing-Hinweis taugen könnte.",
        requiredHumanInput: "Optionaler Briefing-Hinweis",
        nextStep: "Nur als Briefing-Kandidat vormerken",
        currentInputStateLabel: "Briefing-Anschluss ist bisher nur als Vorschau sichtbar",
        internalReason: "voxy_briefing_candidate_only",
      }),
    });
  } else if (input.voxyBriefingState === "blocked_by_runtime_truth") {
    pushIfMissing(cards, {
      priority: 25,
      card: buildCardBase({
        id: "voxy-briefing-blocked",
        dialogueMode: "moderation_safety_probe",
        promptType: "blocker",
        status: "blocked_by_runtime_truth",
        sourceLanguage,
        readingLanguage,
        translationAvailable,
        rtl,
        userVisibleQuestion:
          "Welche Ergänzung wäre für ein späteres Briefing hilfreich, auch wenn noch keine echte Voxy-Runtime vorhanden ist?",
        userVisibleReason:
          "Es wird kein Chat, kein Rendern und kein Providerlauf vorgetäuscht. Der Hinweis bleibt ehrlich blockiert, solange dafür noch keine belastbare Laufwirklichkeit vorliegt.",
        optionalSuggestedAnswerFormat:
          "Formuliere einen kurzen Satz, der das Anliegen präziser macht.",
        requiredHumanInput: "Späterer Briefing-Hinweis",
        nextStep: "Nur als blockierten Folgehinweis festhalten",
        currentInputStateLabel: "Echte Briefing-Runtime fehlt",
        internalReason: "voxy_runtime_truth_missing",
      }),
    });
  }

  const selectedCards = cards
    .sort((left, right) => left.priority - right.priority)
    .slice(0, maxCards)
    .map((entry) => entry.card);
  if (selectedCards.length === 0) return null;

  const status = resolveTopLevelStatus(selectedCards);

  return {
    title: "Mit Voxy weiterdenken",
    summary: buildSummary({
      status,
      surface,
      sourceLanguage,
      readingLanguage,
    }),
    status,
    contributionRef: input.contributionRef ?? null,
    sourceLanguage,
    readingLanguage,
    originalTextAvailable: hasText(originalText),
    translationAvailable,
    rtl,
    originalPreserved: true,
    noManipulation: true,
    reviewRequired: true,
    autoPublish: false,
    cards: selectedCards,
  };
}

export function buildVoxyCocreationDialogFromReviewContext(
  context: V3ReviewQueueWiringContext | null | undefined,
  options?: {
    contributionRef?: VoxyCocreationContributionRef | null;
    surface?: "account" | "admin" | "workspace";
    maxCards?: number;
  },
): V3VoxyCocreationDialogModel | null {
  if (!context?.languageBridge) return null;
  const sourcePack = context.sourcePack;
  const languageBridge = context.languageBridge;
  return buildVoxyCocreationDialog({
    contributionRef: options?.contributionRef ?? null,
    sourceLanguage: languageBridge.original.language,
    readingLanguage:
      context.multilingualThread?.readingLocale ??
      languageBridge.translation.language ??
      languageBridge.summary.language,
    uiLocale: languageBridge.languageContext.uiLocale,
    originalText: languageBridge.original.text,
    translationText: languageBridge.translation.text,
    summaryText: languageBridge.summary.text,
    sourcePresent: languageBridge.sourceGrounding.sourcePresent,
    openQuestions: languageBridge.openQuestions,
    uncertaintyNotes: [
      ...languageBridge.uncertaintyNotes,
      ...(sourcePack?.openGaps ?? []),
    ],
    missingPerspectiveCount: context.crossLingualSuggestions.length > 0 ? 1 : 0,
    counterPositionCount:
      context.dossierWorkspaceSurface?.sections.counterPositions.length ?? 0,
    questionCount: context.dossierWorkspaceSurface?.sections.openQuestions.length ?? 0,
    claimCount: context.dossierWorkspaceSurface?.sections.claims.length ?? 0,
    evidenceGapCount: sourcePack?.openGaps.length ?? 0,
    voxyBriefingState: context.voxyBriefing
      ? context.voxyRenderJob?.status === "blocked_by_runtime_truth"
        ? "blocked_by_runtime_truth"
        : "candidate_connected"
      : "not_connected",
    maxCards: options?.maxCards ?? 5,
    surface: options?.surface ?? "workspace",
  });
}

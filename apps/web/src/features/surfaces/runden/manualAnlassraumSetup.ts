export const MANUAL_ANLASSRAUM_SCOPE_VALUES = [
  "public",
  "organization_internal",
  "private_group",
] as const;

export const MANUAL_ANLASSRAUM_VISIBILITY_VALUES = [
  "private_draft",
  "internal",
  "public_after_review",
  "public_unverified",
] as const;

export const MANUAL_ANLASSRAUM_COMMUNITY_OPTIONS_MODE_VALUES = [
  "disabled",
  "review_required",
  "open_unverified",
] as const;

export const MANUAL_ANLASSRAUM_AI_SUPPORT_MODE_VALUES = [
  "disabled",
  "optional_suggestions",
  "option_suggestions",
  "source_review",
] as const;

export const MANUAL_ANLASSRAUM_NEXT_STEP_VALUES = [
  "save_draft",
  "start_internal",
  "submit_public_review",
  "continue_create",
] as const;

export type ManualAnlassraumScope = (typeof MANUAL_ANLASSRAUM_SCOPE_VALUES)[number];
export type ManualAnlassraumVisibility = (typeof MANUAL_ANLASSRAUM_VISIBILITY_VALUES)[number];
export type ManualAnlassraumCommunityOptionsMode =
  (typeof MANUAL_ANLASSRAUM_COMMUNITY_OPTIONS_MODE_VALUES)[number];
export type ManualAnlassraumAiSupportMode =
  (typeof MANUAL_ANLASSRAUM_AI_SUPPORT_MODE_VALUES)[number];
export type ManualAnlassraumNextStep = (typeof MANUAL_ANLASSRAUM_NEXT_STEP_VALUES)[number];

export type ManualAnlassraumSetup = {
  title: string;
  votingQuestion: string;
  description: string;
  scope: ManualAnlassraumScope;
  visibility: ManualAnlassraumVisibility;
  options: string[];
  communityOptionsMode: ManualAnlassraumCommunityOptionsMode;
  aiSupportMode: ManualAnlassraumAiSupportMode;
  nextStep: ManualAnlassraumNextStep;
};

type StartDraftAnlassraumInput = {
  text: string;
  preview?: {
    possibleTopics?: string[];
    openQuestions?: string[];
  } | null;
};

export type ManualAnlassraumChoiceDefinition<T extends string> = {
  value: T;
  label: string;
  description: string;
};

export type ManualAnlassraumActionState = {
  hasFrameInput: boolean;
  optionCount: number;
  canSaveDraft: boolean;
  canStartInternal: boolean;
  canSubmitPublicReview: boolean;
  canContinueCreate: boolean;
  publicReviewRequirements: string[];
};

export const MANUAL_ANLASSRAUM_SCOPE_CHOICES: readonly ManualAnlassraumChoiceDefinition<ManualAnlassraumScope>[] =
  [
    {
      value: "public",
      label: "Öffentlich",
      description: "Der Anlass kann später bewusst für Beteiligung geöffnet werden.",
    },
    {
      value: "organization_internal",
      label: "Organisation intern",
      description: "Der Anlass bleibt zunächst im geschützten Arbeitsraum deiner Organisation.",
    },
    {
      value: "private_group",
      label: "Private Gruppe",
      description: "Ein kleiner Kreis bereitet den Anlass zuerst gemeinsam vor.",
    },
  ] as const;

export const MANUAL_ANLASSRAUM_VISIBILITY_CHOICES: readonly ManualAnlassraumChoiceDefinition<ManualAnlassraumVisibility>[] =
  [
    {
      value: "private_draft",
      label: "Privater Entwurf",
      description: "Nur als Arbeitsstand speichern und noch nicht teilen.",
    },
    {
      value: "internal",
      label: "Nur intern sichtbar",
      description: "Im internen Kreis besprechen, bevor weitere Sichtbarkeit entsteht.",
    },
    {
      value: "public_after_review",
      label: "Öffentlich nach Prüfung",
      description: "Erst nach bewusster Prüfung sichtbar machen.",
    },
    {
      value: "public_unverified",
      label: "Öffentlich, noch ungeprüft",
      description: "Mit klarer Vorsichtssprache sichtbar, ohne als geprüft zu gelten.",
    },
  ] as const;

export const MANUAL_ANLASSRAUM_COMMUNITY_OPTIONS_MODE_CHOICES: readonly ManualAnlassraumChoiceDefinition<ManualAnlassraumCommunityOptionsMode>[] =
  [
    {
      value: "disabled",
      label: "Nur feste Optionen",
      description: "Nur die hier gesetzten Optionen bleiben offen.",
    },
    {
      value: "review_required",
      label: "Vorschläge mit Prüfung",
      description: "Menschen können weitere Optionen vorschlagen, bevor sie sichtbar werden.",
    },
    {
      value: "open_unverified",
      label: "Vorschläge offen sammeln",
      description: "Weitere Vorschläge werden als ungeprüfte Ergänzungen gesammelt.",
    },
  ] as const;

export const MANUAL_ANLASSRAUM_AI_SUPPORT_MODE_CHOICES: readonly ManualAnlassraumChoiceDefinition<ManualAnlassraumAiSupportMode>[] =
  [
    {
      value: "disabled",
      label: "Keine KI",
      description: "Du startest vollständig manuell.",
    },
    {
      value: "optional_suggestions",
      label: "Optionale Hinweise",
      description: "Später nur zusätzliche Formulierungshilfen holen.",
    },
    {
      value: "option_suggestions",
      label: "Optionen ergänzen",
      description: "Später Varianten für mögliche Antworten vorschlagen lassen.",
    },
    {
      value: "source_review",
      label: "Quellen prüfen",
      description: "Später nur Quellen- und Prüfhinweise ergänzen.",
    },
  ] as const;

export function createEmptyManualAnlassraumSetup(): ManualAnlassraumSetup {
  return {
    title: "",
    votingQuestion: "",
    description: "",
    scope: "public",
    visibility: "private_draft",
    options: ["", ""],
    communityOptionsMode: "disabled",
    aiSupportMode: "disabled",
    nextStep: "save_draft",
  };
}

export function normalizeManualAnlassraumText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeManualAnlassraumOption(value: string): string {
  return normalizeManualAnlassraumText(value);
}

export function sanitizeManualAnlassraumSetup(
  input: ManualAnlassraumSetup,
): ManualAnlassraumSetup {
  const normalizedOptions = input.options.map(normalizeManualAnlassraumOption);
  const optionSlots = normalizedOptions.length >= 2 ? normalizedOptions : [...normalizedOptions, "", ""].slice(0, 2);

  return {
    ...input,
    title: normalizeManualAnlassraumText(input.title),
    votingQuestion: normalizeManualAnlassraumText(input.votingQuestion),
    description: normalizeManualAnlassraumText(input.description),
    options: optionSlots,
  };
}

export function countConfiguredManualAnlassraumOptions(options: readonly string[]): number {
  return options.filter((option) => normalizeManualAnlassraumOption(option).length > 0).length;
}

export function hasManualAnlassraumFrameInput(setup: ManualAnlassraumSetup): boolean {
  return (
    normalizeManualAnlassraumText(setup.title).length > 0 ||
    normalizeManualAnlassraumText(setup.votingQuestion).length > 0
  );
}

export function getManualAnlassraumSignalTitle(setup: ManualAnlassraumSetup): string {
  const normalizedTitle = normalizeManualAnlassraumText(setup.title);
  if (normalizedTitle) return normalizedTitle.slice(0, 160);

  const normalizedQuestion = normalizeManualAnlassraumText(setup.votingQuestion);
  if (normalizedQuestion) return normalizedQuestion.slice(0, 160);

  return "Manueller Anlassraum-Entwurf";
}

export function resolveManualAnlassraumActionState(
  setup: ManualAnlassraumSetup,
): ManualAnlassraumActionState {
  const normalized = sanitizeManualAnlassraumSetup(setup);
  const hasFrameInput = hasManualAnlassraumFrameInput(normalized);
  const optionCount = countConfiguredManualAnlassraumOptions(normalized.options);
  const publicReviewRequirements: string[] = [];

  if (!hasFrameInput) {
    publicReviewRequirements.push("Setze mindestens einen Titel oder eine Abstimmungsfrage.");
  }
  if (optionCount < 2) {
    publicReviewRequirements.push("Für eine öffentliche Einreichung braucht es mindestens zwei Optionen.");
  }

  return {
    hasFrameInput,
    optionCount,
    canSaveDraft: hasFrameInput,
    canStartInternal: hasFrameInput,
    canSubmitPublicReview: hasFrameInput && optionCount >= 2,
    canContinueCreate: hasFrameInput,
    publicReviewRequirements,
  };
}

function mapScopeToPrefillLabel(scope: ManualAnlassraumScope): string {
  return (
    MANUAL_ANLASSRAUM_SCOPE_CHOICES.find((choice) => choice.value === scope)?.label ?? "Öffentlich"
  );
}

function mapVisibilityToPrefillLabel(visibility: ManualAnlassraumVisibility): string {
  return (
    MANUAL_ANLASSRAUM_VISIBILITY_CHOICES.find((choice) => choice.value === visibility)?.label ??
    "Privater Entwurf"
  );
}

function mapCommunityModeToPrefillLabel(
  mode: ManualAnlassraumCommunityOptionsMode,
): string {
  return (
    MANUAL_ANLASSRAUM_COMMUNITY_OPTIONS_MODE_CHOICES.find((choice) => choice.value === mode)?.label ??
    "Nur feste Optionen"
  );
}

function mapAiModeToPrefillLabel(mode: ManualAnlassraumAiSupportMode): string {
  return (
    MANUAL_ANLASSRAUM_AI_SUPPORT_MODE_CHOICES.find((choice) => choice.value === mode)?.label ??
    "Keine KI"
  );
}

export function buildManualAnlassraumPrefill(setup: ManualAnlassraumSetup): string {
  const normalized = sanitizeManualAnlassraumSetup(setup);
  const optionLines = normalized.options
    .map(normalizeManualAnlassraumOption)
    .filter(Boolean)
    .map((option) => `- ${option}`);

  const lines = [
    "Manueller Anlassraum-Entwurf",
    `Titel: ${normalized.title || "—"}`,
    `Abstimmungsfrage: ${normalized.votingQuestion || "—"}`,
    `Beschreibung: ${normalized.description || "—"}`,
    `Rahmen: ${mapScopeToPrefillLabel(normalized.scope)}`,
    `Sichtbarkeit: ${mapVisibilityToPrefillLabel(normalized.visibility)}`,
    `Community-Regeln: ${mapCommunityModeToPrefillLabel(normalized.communityOptionsMode)}`,
    `KI-Unterstützung: ${mapAiModeToPrefillLabel(normalized.aiSupportMode)}`,
    "Optionen:",
    ...(optionLines.length > 0 ? optionLines : ["- Noch keine festen Optionen"]),
  ];

  return lines.join("\n");
}

export function buildManualAnlassraumContinueCreateHref(params: {
  returnTo?: string;
  setup: ManualAnlassraumSetup;
}): string {
  const normalized = sanitizeManualAnlassraumSetup(params.setup);
  const searchParams = new URLSearchParams();
  searchParams.set("mode", "source");
  searchParams.set("source", "runden");
  searchParams.set("reason", "manual_anlassraum_continue_create");
  searchParams.set("signalTitle", getManualAnlassraumSignalTitle(normalized));
  searchParams.set("prefill", buildManualAnlassraumPrefill(normalized));
  searchParams.set("returnTo", params.returnTo || "/runden/new");
  return `/create?${searchParams.toString()}`;
}

function dedupeDraftOptions(options: readonly string[]): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const option of options) {
    const normalized = normalizeManualAnlassraumOption(option);
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(normalized);
  }
  return next;
}

function looksLikeSchoolwayDraft(text: string): boolean {
  return /schulweg|schule|grundschule|zebrastreifen|querung|tempo 30|hauptstra[ßs]e/i.test(text);
}

export function deriveManualAnlassraumSetupFromStartDraft(
  input: StartDraftAnlassraumInput,
): Pick<ManualAnlassraumSetup, "title" | "votingQuestion" | "description" | "options"> {
  const text = normalizeManualAnlassraumText(input.text);
  const possibleTopic = input.preview?.possibleTopics?.find((entry) => normalizeManualAnlassraumText(entry).length > 0) ?? "";
  const openQuestion = input.preview?.openQuestions?.find((entry) => normalizeManualAnlassraumText(entry).length > 0) ?? "";
  const schoolwayDraft = looksLikeSchoolwayDraft(text);

  const title = schoolwayDraft
    ? "Schulweg rund um die Grundschule sicherer machen"
    : possibleTopic
      ? `${possibleTopic} gemeinsam klären`
      : "Anlassraum aus deinem Entwurf vorbereiten";
  const votingQuestion = openQuestion
    ? normalizeManualAnlassraumText(openQuestion)
    : schoolwayDraft
      ? "Welche Maßnahme hilft zuerst, damit der Schulweg sicherer wird?"
      : "Welcher nächste Schritt soll zuerst vorbereitet werden?";
  const description = schoolwayDraft
    ? `Aus dem Start-Entwurf übernommen: ${text}`
    : possibleTopic
      ? `Aus dem Start-Entwurf übernommen. Themenfeld: ${possibleTopic}. ${text}`
      : `Aus dem Start-Entwurf übernommen: ${text}`;

  const options = schoolwayDraft
    ? [
        "Tempo 30 konsequent sichern",
        "Zebrastreifen oder Querungshilfe ergänzen",
        "Elternhaltestelle neu ordnen",
        "Beleuchtung und Sichtachsen verbessern",
        "Schulstraße zeitweise einführen",
        "Anderer Vorschlag",
      ]
    : [
        "Sofortmaßnahme starten",
        "Informationen und Quellen sammeln",
        "Beteiligung im Anlassraum vorbereiten",
        "Zuständigkeit zuerst klären",
        "Später weiterbearbeiten",
        "Anderer Vorschlag",
      ];

  return {
    title,
    votingQuestion,
    description,
    options: dedupeDraftOptions(options),
  };
}

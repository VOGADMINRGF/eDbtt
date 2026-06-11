export type StartDraftOrigin =
  | "start_create_light"
  | "start_example"
  | "start_relevance_review"
  | "create_handoff"
  | "theme_handoff"
  | "round_handoff"
  | "live_campaign"
  | "campaign_qr";

export type StartDraftIntent =
  | "contribution"
  | "question"
  | "problem"
  | "proposal"
  | "opinion"
  | "theme_suggestion"
  | "round_suggestion"
  | "needs_reframe"
  | "unknown";

export type StartDraftTarget =
  | "create"
  | "themes"
  | "rounds"
  | "login"
  | "register";

export type StartDraftSurface = "start" | "create" | "themes" | "rounds";

export type StartDraftPreview = {
  contributionType?: string;
  possibleTopics?: string[];
  openQuestions?: string[];
  suggestedNextSteps?: string[];
  relevance?: string;
};

export type StartDraftCampaignContext = {
  campaignId: string;
  title: string;
  contextLabel?: string;
  regionLabel?: string;
  organizerLabel?: string;
  sourceLabel?: string;
};

export type StartDraftContext = {
  id: string;
  text: string;
  normalizedText?: string;
  origin: StartDraftOrigin;
  intent: StartDraftIntent;
  createdAt: string;
  updatedAt: string;
  preview?: StartDraftPreview;
  campaign?: StartDraftCampaignContext;
  targetHint?: StartDraftTarget;
  handoffCount?: number;
  noAutoPublish: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoDeepSearch: true;
  noAutoGraphWrite: true;
};

export type StartDraftTopicCandidate = {
  slug: string;
  title: string;
  framingQuestion: string;
  score: number;
  matchedKeywords: string[];
};

type PersistedStartDraftContext = StartDraftContext & {
  schemaVersion: 1;
};

const START_DRAFT_CONTEXT_STORAGE_KEY = "start-draft-context.v1";
const START_DRAFT_CONTEXT_SCHEMA_VERSION = 1;
const MIN_START_DRAFT_TEXT_LENGTH = 12;

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCampaignContext(
  value: StartDraftCampaignContext | null | undefined,
): StartDraftCampaignContext | undefined {
  if (!value) return undefined;
  const campaignId = normalizeText(value.campaignId);
  const title = normalizeText(value.title);
  if (!campaignId || !title) return undefined;
  const contextLabel = normalizeText(value.contextLabel);
  const regionLabel = normalizeText(value.regionLabel);
  const organizerLabel = normalizeText(value.organizerLabel);
  const sourceLabel = normalizeText(value.sourceLabel);
  return {
    campaignId,
    title,
    contextLabel: contextLabel || undefined,
    regionLabel: regionLabel || undefined,
    organizerLabel: organizerLabel || undefined,
    sourceLabel: sourceLabel || undefined,
  };
}

function buildDraftId() {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `start-draft-${Date.now()}`;
}

function isStartDraftTarget(value: string | null | undefined): value is StartDraftTarget {
  return (
    value === "create" ||
    value === "themes" ||
    value === "rounds" ||
    value === "login" ||
    value === "register"
  );
}

function parsePersistedDraft(raw: string | null): PersistedStartDraftContext | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PersistedStartDraftContext;
    if (parsed?.schemaVersion !== START_DRAFT_CONTEXT_SCHEMA_VERSION) return null;
    const text = normalizeText(parsed.text);
    if (text.length < MIN_START_DRAFT_TEXT_LENGTH) return null;
    return {
      ...parsed,
      text,
      normalizedText: normalizeText(parsed.normalizedText ?? text),
      preview: parsed.preview
        ? {
            contributionType: parsed.preview.contributionType,
            possibleTopics: Array.isArray(parsed.preview.possibleTopics)
              ? parsed.preview.possibleTopics.filter(Boolean)
              : [],
            openQuestions: Array.isArray(parsed.preview.openQuestions)
              ? parsed.preview.openQuestions.filter(Boolean)
              : [],
            suggestedNextSteps: Array.isArray(parsed.preview.suggestedNextSteps)
              ? parsed.preview.suggestedNextSteps.filter(Boolean)
              : [],
            relevance: parsed.preview.relevance,
          }
        : undefined,
      campaign: normalizeCampaignContext(parsed.campaign),
      targetHint: isStartDraftTarget(parsed.targetHint) ? parsed.targetHint : undefined,
    };
  } catch {
    return null;
  }
}

function toPersistedDraft(draft: StartDraftContext): PersistedStartDraftContext {
  return {
    ...draft,
    schemaVersion: START_DRAFT_CONTEXT_SCHEMA_VERSION,
  };
}

export function createStartDraftContext(input: {
  text: string;
  normalizedText?: string;
  origin: StartDraftOrigin;
  intent: StartDraftIntent;
  preview?: StartDraftPreview;
  campaign?: StartDraftCampaignContext;
  targetHint?: StartDraftTarget;
  id?: string;
  createdAt?: string;
}): StartDraftContext | null {
  const text = normalizeText(input.text);
  const normalizedText = normalizeText(input.normalizedText ?? text);
  if (normalizedText.length < MIN_START_DRAFT_TEXT_LENGTH) return null;

  const now = new Date().toISOString();
  return {
    id: input.id ?? buildDraftId(),
    text,
    normalizedText,
    origin: input.origin,
    intent: input.intent,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    preview: input.preview
      ? {
          contributionType: input.preview.contributionType,
          possibleTopics: input.preview.possibleTopics?.filter(Boolean) ?? [],
          openQuestions: input.preview.openQuestions?.filter(Boolean) ?? [],
          suggestedNextSteps: input.preview.suggestedNextSteps?.filter(Boolean) ?? [],
          relevance: input.preview.relevance,
        }
      : undefined,
    campaign: normalizeCampaignContext(input.campaign),
    targetHint: input.targetHint,
    handoffCount: 0,
    noAutoPublish: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoDeepSearch: true,
    noAutoGraphWrite: true,
  };
}

export function saveStartDraftContext(draft: StartDraftContext | null): StartDraftContext | null {
  if (!draft) return null;
  const normalized = createStartDraftContext({
    ...draft,
    id: draft.id,
    createdAt: draft.createdAt,
  });
  if (!normalized) return null;
  const nextDraft = {
    ...normalized,
    handoffCount: typeof draft.handoffCount === "number" ? draft.handoffCount : normalized.handoffCount,
  } satisfies StartDraftContext;
  if (!canUseBrowserStorage()) return nextDraft;
  window.sessionStorage.setItem(
    START_DRAFT_CONTEXT_STORAGE_KEY,
    JSON.stringify(toPersistedDraft(nextDraft)),
  );
  return nextDraft;
}

export function readStartDraftContext(): StartDraftContext | null {
  if (!canUseBrowserStorage()) return null;
  const parsed = parsePersistedDraft(window.sessionStorage.getItem(START_DRAFT_CONTEXT_STORAGE_KEY));
  if (!parsed) return null;
  return parsed;
}

export function clearStartDraftContext() {
  if (!canUseBrowserStorage()) return;
  window.sessionStorage.removeItem(START_DRAFT_CONTEXT_STORAGE_KEY);
}

export function updateStartDraftContext(
  partial: Partial<StartDraftContext>,
): StartDraftContext | null {
  const current = readStartDraftContext();
  if (!current) return null;
  const merged = createStartDraftContext({
    text: partial.text ?? current.text,
    normalizedText: partial.normalizedText ?? current.normalizedText ?? current.text,
    origin: partial.origin ?? current.origin,
    intent: partial.intent ?? current.intent,
    preview: partial.preview ?? current.preview,
    campaign: partial.campaign ?? current.campaign,
    targetHint: partial.targetHint ?? current.targetHint,
    id: partial.id ?? current.id,
    createdAt: partial.createdAt ?? current.createdAt,
  });
  if (!merged) return null;
  return saveStartDraftContext({
    ...merged,
    handoffCount: partial.handoffCount ?? current.handoffCount ?? 0,
  });
}

export function getStartDraftForTarget(target: StartDraftTarget): StartDraftContext | null {
  const draft = readStartDraftContext();
  if (!draft) return null;
  if (draft.preview?.relevance === "spam_suspected") return null;
  if (!draft.targetHint) return draft;
  if (draft.targetHint === target) return draft;
  if (target === "login" || target === "register") return draft;
  return null;
}

export function bumpStartDraftHandoff(target: StartDraftTarget) {
  const current = readStartDraftContext();
  if (!current) return null;
  return updateStartDraftContext({
    targetHint: target,
    handoffCount: (current.handoffCount ?? 0) + 1,
  });
}

export function tokenizeStartDraftText(value: string) {
  return normalizeText(value)
    .toLowerCase()
    .split(/[^a-zäöüß0-9]+/iu)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3);
}

export function matchStartDraftTopics(
  draft: Pick<StartDraftContext, "text" | "preview">,
  topics: Array<{ slug: string; title: string; framingQuestion: string }>,
): StartDraftTopicCandidate[] {
  const keywordSet = new Set([
    ...tokenizeStartDraftText(draft.text),
    ...(draft.preview?.possibleTopics ?? [])
      .flatMap((value) => tokenizeStartDraftText(value)),
  ]);
  const keywords = Array.from(keywordSet);

  return topics
    .map((topic) => {
      const haystack = `${topic.title} ${topic.framingQuestion}`.toLowerCase();
      const matchedKeywords = keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
      return {
        slug: topic.slug,
        title: topic.title,
        framingQuestion: topic.framingQuestion,
        score: matchedKeywords.length,
        matchedKeywords,
      } satisfies StartDraftTopicCandidate;
    })
    .filter((topic) => topic.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.title.localeCompare(right.title, "de");
    })
    .slice(0, 4);
}

export function normalizeStartDraftIntent(value: string | null | undefined): StartDraftIntent {
  switch (value) {
    case "question":
      return "question";
    case "problem":
      return "problem";
    case "proposal":
      return "proposal";
    case "opinion":
      return "opinion";
    case "theme_suggestion":
      return "theme_suggestion";
    case "round_suggestion":
      return "round_suggestion";
    case "needs_reframe":
      return "needs_reframe";
    default:
      return "contribution";
  }
}

export function getStartDraftStatusLabel(
  draft: Pick<StartDraftContext, "preview" | "origin"> | null | undefined,
) {
  const relevance = draft?.preview?.relevance;
  if (relevance === "needs_reframe" || relevance === "personal_only") {
    return "Öffentliche Relevanz klären";
  }
  if (draft?.origin === "start_create_light") return "Analyse-Entwurf";
  return "Entwurf";
}

export function getStartDraftSurfaceLabel(
  target: StartDraftTarget | StartDraftSurface | null | undefined,
) {
  switch (target) {
    case "create":
      return "Beitrag ausarbeiten";
    case "themes":
      return "Passende Themen finden";
    case "rounds":
      return "Runde vorbereiten";
    case "login":
    case "register":
      return "Weiter anmelden";
    case "start":
      return "Entwurf fortsetzen";
    default:
      return "Bereit zur Weiterarbeit";
  }
}

export function getStartDraftGuardrailSummary(
  draft: Pick<StartDraftContext, "preview" | "origin"> | null | undefined,
  target: StartDraftSurface,
) {
  const summary = ["Noch nicht veröffentlicht"];
  if (draft?.origin === "start_create_light") {
    summary.unshift("Analyse-Entwurf");
  }
  if (target === "themes") {
    summary.push("Noch nicht zusammengeführt");
  } else if (target === "rounds") {
    summary.push("Noch keine Stimmen");
  } else {
    summary.push("Noch nicht gezählt");
  }
  if (draft?.origin === "start_create_light") {
    summary.push("Keine Quellenprüfung gestartet");
  }

  const relevance = draft?.preview?.relevance;
  if (relevance === "needs_reframe" || relevance === "personal_only") {
    summary.push("Öffentliche Relevanz klären");
  } else {
    summary.push("Keine automatische Prüfung");
  }

  summary.push("Du bestätigst den nächsten Schritt");
  return summary;
}

export function getStartDraftExcerpt(
  draft: Pick<StartDraftContext, "text"> | null | undefined,
  maxLength = 160,
) {
  const text = normalizeText(draft?.text);
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export { START_DRAFT_CONTEXT_STORAGE_KEY };

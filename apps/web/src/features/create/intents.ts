export type CreateIntent =
  | "claim"
  | "source"
  | "question"
  | "perspective"
  | "objection"
  | "option"
  | "factcheck";

export const CREATE_MODE_VALUES = ["manual", "source", "ai"] as const;
export type CreateMode = (typeof CREATE_MODE_VALUES)[number];

export type CreateIntentDefinition = {
  intent: CreateIntent;
  title: string;
  lead: string;
};

export const CREATE_INTENT_DEFINITIONS: CreateIntentDefinition[] = [
  {
    intent: "source",
    title: "Quelle einreichen",
    lead: "Link, Anlage oder Hinweis als neue Quelle einbringen.",
  },
  {
    intent: "question",
    title: "Offene Frage melden",
    lead: "Ungeklaerte Punkte sichtbar halten und priorisieren.",
  },
  {
    intent: "perspective",
    title: "Perspektive ergaenzen",
    lead: "Argumente, Betroffenheit oder Kontext hinzufuegen.",
  },
  {
    intent: "objection",
    title: "Widerspruch einreichen",
    lead: "Einordnung, Evidenz oder Schlussfolgerung begruendet hinterfragen.",
  },
  {
    intent: "option",
    title: "Option vorschlagen",
    lead: "Umsetzbare Alternative fuer Entscheidung und Abstimmung vorschlagen.",
  },
  {
    intent: "claim",
    title: "Kernaussage formulieren",
    lead: "Abstimmungsfaehige Aussage mit klarer Verantwortung erstellen.",
  },
  {
    intent: "factcheck",
    title: "Factcheck starten",
    lead: "Pruefhinweis zu Text, Link, Anlage oder Video-URL einreichen.",
  },
];

const VALID_INTENTS = new Set<CreateIntent>(CREATE_INTENT_DEFINITIONS.map((item) => item.intent));
const VALID_MODES = new Set<CreateMode>(CREATE_MODE_VALUES);
const CANONICAL_CREATE_PATH = "/create";

export type BuildCreateHrefArgs = {
  intent: CreateIntent;
  mode?: CreateMode;
  dossierId?: string | null;
  statementId?: string | null;
  next?: string | null;
};

export type BuildCreateFastPathHrefArgs = {
  intent?: CreateIntent;
  mode?: CreateMode;
  anlassraumId?: string | null;
  draftId?: string | null;
  candidateId?: string | null;
  signalTitle?: string | null;
  sourceUrl?: string | null;
  sourceLabel?: string | null;
  region?: string | null;
  scope?: string | null;
  clusterHint?: string | null;
  reviewState?: string | null;
  reason?: string | null;
  prefill?: string | null;
  source?: string | null;
  next?: string | null;
};

function withQuery(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function normalizeQueryText(value: string | null | undefined, maxLen: number): string | undefined {
  const normalized = String(value ?? "").trim();
  if (!normalized) return undefined;
  return normalized.slice(0, maxLen);
}

function normalizeQueryUrl(value: string | null | undefined): string | undefined {
  const normalized = String(value ?? "").trim();
  if (!normalized) return undefined;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString().slice(0, 1000);
  } catch {
    return undefined;
  }
}

export function parseCreateIntent(raw?: string | null): CreateIntent | undefined {
  if (!raw) return undefined;
  const value = raw.toLowerCase();
  if (VALID_INTENTS.has(value as CreateIntent)) return value as CreateIntent;
  if (value === "statement") return "claim";
  if (value === "contribution") return "source";
  return undefined;
}

export function parseCreateMode(raw?: string | null): CreateMode | undefined {
  if (!raw) return undefined;
  const value = raw.toLowerCase().trim();
  if (VALID_MODES.has(value as CreateMode)) return value as CreateMode;
  if (value === "manuell") return "manual";
  if (value === "ki" || value === "ai" || value === "ai_assist" || value === "ai-assist") return "ai";
  if (value === "quelle") return "source";
  if (
    value === "feed-treffer" ||
    value === "rss" ||
    value === "feed" ||
    value === "cluster" ||
    value === "themencluster"
  ) {
    return "source";
  }
  return undefined;
}

export function createModeFromIntent(intent?: CreateIntent | null): CreateMode {
  if (!intent) return "source";
  if (intent === "claim") return "manual";
  return "source";
}

/**
 * Canonical create resolver.
 * Product architecture uses `/create` as the single entry path.
 */
export function buildCreateHref({
  intent,
  mode,
  dossierId,
  statementId,
  next,
}: BuildCreateHrefArgs): string {
  return withQuery(CANONICAL_CREATE_PATH, {
    intent,
    mode: mode ?? undefined,
    dossierId: dossierId ?? undefined,
    statementId: statementId ?? undefined,
    next: next ?? undefined,
  });
}

export function buildCreateFastPathHref(args: BuildCreateFastPathHrefArgs = {}): string {
  const intent = args.intent ?? undefined;
  const mode = args.mode ?? undefined;
  return withQuery(CANONICAL_CREATE_PATH, {
    intent,
    mode,
    anlassraumId: normalizeQueryText(args.anlassraumId, 64),
    draftId: normalizeQueryText(args.draftId, 64),
    candidateId: normalizeQueryText(args.candidateId, 64),
    signalTitle: normalizeQueryText(args.signalTitle, 160),
    sourceUrl: normalizeQueryUrl(args.sourceUrl),
    sourceLabel: normalizeQueryText(args.sourceLabel, 120),
    region: normalizeQueryText(args.region, 48),
    scope: normalizeQueryText(args.scope, 48),
    clusterHint: normalizeQueryText(args.clusterHint, 96),
    reviewState: normalizeQueryText(args.reviewState, 48),
    reason: normalizeQueryText(args.reason, 160),
    prefill: normalizeQueryText(args.prefill, 2000),
    source: normalizeQueryText(args.source, 64),
    next: args.next ?? undefined,
  });
}

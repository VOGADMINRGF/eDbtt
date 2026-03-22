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
  const intent = args.intent ?? "claim";
  const mode = args.mode ?? "manual";
  return withQuery(CANONICAL_CREATE_PATH, {
    intent,
    mode,
    anlassraumId: args.anlassraumId ? args.anlassraumId.trim() : undefined,
    draftId: args.draftId ? args.draftId.trim() : undefined,
    source: args.source ? args.source.trim() : undefined,
    next: args.next ?? undefined,
  });
}

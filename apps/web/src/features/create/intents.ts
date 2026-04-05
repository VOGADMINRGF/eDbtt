import { normalizeCreateIntakeContextInput } from "@/features/create/intakeContext";

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
    lead: "Ungeklärte Punkte sichtbar halten und priorisieren.",
  },
  {
    intent: "perspective",
    title: "Perspektive ergänzen",
    lead: "Argumente, Betroffenheit oder Kontext hinzufügen.",
  },
  {
    intent: "objection",
    title: "Widerspruch einreichen",
    lead: "Einordnung, Evidenz oder Schlussfolgerung begründet hinterfragen.",
  },
  {
    intent: "option",
    title: "Option vorschlagen",
    lead: "Umsetzbare Alternative für Entscheidung und Abstimmung vorschlagen.",
  },
  {
    intent: "claim",
    title: "Kernaussage formulieren",
    lead: "Abstimmungsfähige Aussage mit klarer Verantwortung erstellen.",
  },
  {
    intent: "factcheck",
    title: "Factcheck starten",
    lead: "Prüfhinweis zu Text, Link, Anlage oder Video-URL einreichen.",
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
  const intake = normalizeCreateIntakeContextInput({
    source: args.source,
    signalTitle: args.signalTitle,
    sourceUrl: args.sourceUrl,
    sourceLabel: args.sourceLabel,
    region: args.region,
    scope: args.scope,
    clusterHint: args.clusterHint,
    reviewState: args.reviewState,
    candidateId: args.candidateId,
    draftId: args.draftId,
    reason: args.reason,
  });
  const intent = args.intent ?? undefined;
  const mode = args.mode ?? undefined;
  return withQuery(CANONICAL_CREATE_PATH, {
    intent,
    mode,
    anlassraumId: normalizeQueryText(args.anlassraumId, 64),
    draftId: intake.draftId ?? undefined,
    candidateId: intake.candidateId ?? undefined,
    signalTitle: intake.signalTitle ?? undefined,
    sourceUrl: intake.sourceUrl ?? undefined,
    sourceLabel: intake.sourceLabel ?? undefined,
    region: intake.region ?? undefined,
    scope: intake.scope ?? undefined,
    clusterHint: intake.clusterHint ?? undefined,
    reviewState: intake.reviewState ?? undefined,
    reason: intake.reason ?? undefined,
    prefill: normalizeQueryText(args.prefill, 2000),
    source: intake.source ?? undefined,
    next: args.next ?? undefined,
  });
}

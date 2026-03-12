export type CreateIntent =
  | "claim"
  | "source"
  | "question"
  | "perspective"
  | "objection"
  | "option"
  | "factcheck";

export type CreateEntryMode = "legacy" | "unified";

export type BuildCreateHrefArgs = {
  intent: CreateIntent;
  dossierId?: string | null;
  statementId?: string | null;
  next?: string | null;
};

const UNIFIED_ENTRY_PATH = "/create";

function readCreateEntryMode(): CreateEntryMode {
  return process.env.NEXT_PUBLIC_CREATE_ENTRY_MODE === "unified"
    ? "unified"
    : "legacy";
}

function withQuery(path: string, query: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

function legacyPathForIntent(intent: CreateIntent) {
  if (intent === "claim") return "/statements/new";
  if (intent === "factcheck") return "/factcheck";
  return "/contributions/new";
}

/**
 * Single resolver for "new contribution/statement/factcheck" entry links.
 * Current default keeps legacy routes stable. Switching to unified create
 * entry can be done via NEXT_PUBLIC_CREATE_ENTRY_MODE=unified.
 */
export function buildCreateHref({
  intent,
  dossierId,
  statementId,
  next,
}: BuildCreateHrefArgs): string {
  const mode = readCreateEntryMode();

  if (mode === "unified") {
    return withQuery(UNIFIED_ENTRY_PATH, {
      intent,
      dossierId: dossierId ?? undefined,
      statementId: statementId ?? undefined,
      next: next ?? undefined,
    });
  }

  const legacyPath = legacyPathForIntent(intent);
  return withQuery(legacyPath, {
    dossierId: dossierId ?? undefined,
    statementId: statementId ?? undefined,
    intent,
    next: next ?? undefined,
  });
}


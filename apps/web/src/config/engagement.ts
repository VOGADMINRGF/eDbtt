export type EngagementLevel =
  | "Interessiert"
  | "Engagiert"
  | "Begeistert"
  | "Brennend"
  | "Inspirierend"
  | "Leuchtend";

export type EngagementLevelKey = Lowercase<EngagementLevel>;

export type EngagementThreshold = {
  level: EngagementLevel;
  minXp: number;
};

export const XP_EVENTS = {
  swipe: 1,
  eventuality: 10,
  questionOrKnot: 20,
  streamParticipation: 50,
  streamHost: 200,
} as const;

export const ENGAGEMENT_LEVEL_THRESHOLDS: EngagementThreshold[] = [
  { level: "Leuchtend", minXp: 50_000 },
  { level: "Inspirierend", minXp: 15_000 },
  { level: "Brennend", minXp: 5_000 },
  { level: "Begeistert", minXp: 1_500 },
  { level: "Engagiert", minXp: 250 },
  { level: "Interessiert", minXp: 0 },
];

const LEVEL_KEY_BY_LABEL: Record<EngagementLevel, EngagementLevelKey> = {
  Interessiert: "interessiert",
  Engagiert: "engagiert",
  Begeistert: "begeistert",
  Brennend: "brennend",
  Inspirierend: "inspirierend",
  Leuchtend: "leuchtend",
};

const LEVEL_LABEL_BY_KEY: Record<EngagementLevelKey, EngagementLevel> = {
  interessiert: "Interessiert",
  engagiert: "Engagiert",
  begeistert: "Begeistert",
  brennend: "Brennend",
  inspirierend: "Inspirierend",
  leuchtend: "Leuchtend",
};

export const ENGAGEMENT_LEVEL_ORDER: EngagementLevel[] = [
  "Interessiert",
  "Engagiert",
  "Begeistert",
  "Brennend",
  "Inspirierend",
  "Leuchtend",
];

export function getEngagementLevelFromXp(totalXp: number): EngagementLevel {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  const threshold = ENGAGEMENT_LEVEL_THRESHOLDS.find((entry) => safeXp >= entry.minXp);
  return threshold?.level ?? "Interessiert";
}

export function normalizeEngagementLevel(value?: string | null): EngagementLevel {
  if (!value) return "Interessiert";
  const trimmed = value.trim();
  const direct = ENGAGEMENT_LEVEL_THRESHOLDS.find((entry) => entry.level === trimmed)?.level;
  if (direct) return direct;

  const lowered = trimmed.toLowerCase() as EngagementLevelKey;
  return LEVEL_LABEL_BY_KEY[lowered] ?? "Interessiert";
}

export function toEngagementLevelKey(value?: string | null): EngagementLevelKey {
  const normalized = normalizeEngagementLevel(value);
  return LEVEL_KEY_BY_LABEL[normalized];
}

export function compareEngagementLevels(current: string | null | undefined, minimum: string | null | undefined) {
  const currentLabel = normalizeEngagementLevel(current);
  const minimumLabel = normalizeEngagementLevel(minimum);
  return ENGAGEMENT_LEVEL_ORDER.indexOf(currentLabel) - ENGAGEMENT_LEVEL_ORDER.indexOf(minimumLabel);
}

export function meetsEngagementLevel(current: string | null | undefined, minimum: string | null | undefined) {
  return compareEngagementLevels(current, minimum) >= 0;
}

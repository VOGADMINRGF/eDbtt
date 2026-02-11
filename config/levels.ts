export const ENGAGEMENT_LEVELS = [
  "interessiert",
  "engagiert",
  "begeistert",
  "brennend",
  "inspirierend",
  "leuchtend",
] as const;

export type EngagementLevel = (typeof ENGAGEMENT_LEVELS)[number];

export type EngagementThreshold = {
  minXp: number;
  level: EngagementLevel;
};

export const ENGAGEMENT_LEVEL_LABELS: Record<EngagementLevel, string> = {
  interessiert: "Interessiert",
  engagiert: "Engagiert",
  begeistert: "Begeistert",
  brennend: "Brennend",
  inspirierend: "Inspirierend",
  leuchtend: "Leuchtend",
};

export const ENGAGEMENT_THRESHOLDS: EngagementThreshold[] = [
  { minXp: 50_000, level: "leuchtend" },
  { minXp: 15_000, level: "inspirierend" },
  { minXp: 5_000, level: "brennend" },
  { minXp: 1_500, level: "begeistert" },
  { minXp: 250, level: "engagiert" },
  { minXp: 0, level: "interessiert" },
];

import type { SwipeItem, SwipeScopeLevel } from "@/features/swipes/types";

export type SwipeDiscoverySegment = "mine" | "saved" | "region" | "all";

export const SWIPE_DISCOVERY_SEGMENTS: ReadonlyArray<{ id: SwipeDiscoverySegment; label: string }> = [
  { id: "mine", label: "Meine Themen" },
  { id: "saved", label: "Gespeichert" },
  { id: "region", label: "In meinem Umfeld" },
  { id: "all", label: "Alle Themen" },
];

const DEFAULT_REGION_LEVELS: readonly SwipeScopeLevel[] = ["Kommune", "Land"];

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildTopicHaystack(item: SwipeItem) {
  return [item.title, item.category, item.domainLabel, ...item.topicTags]
    .filter((entry): entry is string => Boolean(entry))
    .map(normalize)
    .join(" ");
}

function hasTopicMatch(item: SwipeItem, preferredTopics: readonly string[]) {
  if (!preferredTopics.length) return true;
  const haystack = buildTopicHaystack(item);
  return preferredTopics.some((topic) => haystack.includes(normalize(topic)));
}

export function filterSwipeItemsByDiscoverySegment(params: {
  items: readonly SwipeItem[];
  segment: SwipeDiscoverySegment;
  savedIds?: ReadonlySet<string>;
  preferredTopics?: readonly string[];
  regionLevels?: readonly SwipeScopeLevel[];
}): SwipeItem[] {
  const items = [...params.items];

  if (params.segment === "all") return items;

  if (params.segment === "saved") {
    if (!params.savedIds || params.savedIds.size === 0) return [];
    return items.filter((item) => params.savedIds?.has(item.id));
  }

  if (params.segment === "region") {
    const regionLevels = params.regionLevels?.length ? params.regionLevels : DEFAULT_REGION_LEVELS;
    return items.filter((item) => regionLevels.includes(item.level));
  }

  return items.filter((item) => hasTopicMatch(item, params.preferredTopics ?? []));
}

export function derivePreferredSwipeTopics(params: {
  savedTopicHints?: readonly string[];
  decisionTopicHints?: readonly string[];
}): string[] {
  const unique = new Set<string>();
  [...(params.savedTopicHints ?? []), ...(params.decisionTopicHints ?? [])]
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => unique.add(entry));
  return [...unique].slice(0, 8);
}

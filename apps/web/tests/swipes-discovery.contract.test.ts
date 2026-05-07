import { describe, expect, it } from "vitest";
import {
  derivePreferredSwipeTopics,
  filterSwipeItemsByDiscoverySegment,
  prioritizeSwipeItemsForCreateSeed,
  SWIPE_DISCOVERY_SEGMENTS,
} from "@/features/surfaces/swipes/discoveryContract";
import type { SwipeItem } from "@/features/swipes/types";

const ITEMS: SwipeItem[] = [
  {
    id: "a",
    title: "Neue Busspur in Mitte",
    text: "Kernthese A",
    category: "Mobilität",
    level: "Kommune",
    topicTags: ["Bus", "Verkehr"],
    evidenceCount: 2,
    responsibilityLabel: "Zuständigkeit: Kommune",
    domainLabel: "Verkehr",
    hasEventualities: true,
    eventualitiesCount: 2,
  },
  {
    id: "b",
    title: "Bundesweiter Mieten-Deckel",
    text: "Kernthese B",
    category: "Wohnen",
    level: "Bund",
    topicTags: ["Miete"],
    evidenceCount: 1,
    responsibilityLabel: "Zuständigkeit: Bund",
    domainLabel: "Wohnen",
    hasEventualities: false,
    eventualitiesCount: 0,
  },
  {
    id: "c",
    title: "EU-Förderrahmen",
    text: "Kernthese C",
    category: "Klima",
    level: "EU",
    topicTags: ["Förderung"],
    evidenceCount: 0,
    responsibilityLabel: "Zuständigkeit: EU",
    domainLabel: "Klima",
    hasEventualities: false,
    eventualitiesCount: 0,
  },
];

describe("swipes discovery contract", () => {
  it("ships the expected segment labels", () => {
    expect(SWIPE_DISCOVERY_SEGMENTS.map((entry) => entry.label)).toEqual([
      "Meine Themen",
      "Gespeichert",
      "In meinem Umfeld",
      "Alle Themen",
    ]);
  });

  it("filters saved and region segments deterministically", () => {
    const saved = filterSwipeItemsByDiscoverySegment({
      items: ITEMS,
      segment: "saved",
      savedIds: new Set(["b"]),
    });
    expect(saved.map((item) => item.id)).toEqual(["b"]);

    const region = filterSwipeItemsByDiscoverySegment({
      items: ITEMS,
      segment: "region",
    });
    expect(region.map((item) => item.id)).toEqual(["a"]);
  });

  it("uses preferred topic hints for meine-themen and keeps all as passthrough", () => {
    const preferred = derivePreferredSwipeTopics({
      savedTopicHints: ["Mobilität"],
      decisionTopicHints: ["Wohnen", "Mobilität"],
    });
    expect(preferred).toEqual(["Mobilität", "Wohnen"]);

    const mine = filterSwipeItemsByDiscoverySegment({
      items: ITEMS,
      segment: "mine",
      preferredTopics: preferred,
    });
    expect(mine.map((item) => item.id)).toEqual(["a", "b"]);

    const all = filterSwipeItemsByDiscoverySegment({
      items: ITEMS,
      segment: "all",
    });
    expect(all.map((item) => item.id)).toEqual(["a", "b", "c"]);
  });

  it("prioritizes claim/topic seeded items before general discovery", () => {
    const seeded = prioritizeSwipeItemsForCreateSeed({
      items: ITEMS,
      topic: "Wohnen",
      claim: "Mieten-Deckel",
    });
    expect(seeded.claimMatchCount).toBeGreaterThan(0);
    expect(seeded.topicMatchCount).toBeGreaterThanOrEqual(0);
    expect(seeded.items[0]?.id).toBe("b");
  });

  it("does not fall back to generic deck items when create seed has no match", () => {
    const seeded = prioritizeSwipeItemsForCreateSeed({
      items: ITEMS,
      topic: "Unbekanntes Themenfeld",
      claim: "Nicht vorhandener Claim",
    });
    expect(seeded.claimMatchCount).toBe(0);
    expect(seeded.topicMatchCount).toBe(0);
    expect(seeded.items).toEqual([]);
  });
});

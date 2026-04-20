import { describe, expect, it } from "vitest";
import {
  canTransitionLifecycle,
  clampScore,
  parseThemenradarItem,
} from "@features/themenradar/contracts";

describe("themenradar contracts", () => {
  it("parses a valid item with fixed review/guardrail flags", () => {
    const parsed = parseThemenradarItem({
      id: "themenradar_1",
      title: "Kommunaler Hitzeschutz",
      rawSignal: "Mehrere Hinweise aus Schule, Pflege und Verwaltung.",
      sourceType: "community",
      heatScore: 68,
      everydayRelevanceScore: 82,
      polarizationScore: 44,
      membershipPotentialScore: 59,
      jurisdiction: "kommune",
      lifecycleStatus: "raw",
      reviewRequired: true,
      autoPostEligible: false,
      officialSocialRequiresReview: true,
      createdBy: null,
      updatedBy: null,
      lastReviewedBy: null,
      lastReviewedAt: null,
      reviewNotes: [],
      auditVersion: 0,
      archivedAt: null,
      archivedBy: null,
      createdAt: new Date("2026-04-19T08:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-04-19T08:00:00.000Z").toISOString(),
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.value.reviewRequired).toBe(true);
    expect(parsed.value.autoPostEligible).toBe(false);
    expect(parsed.value.officialSocialRequiresReview).toBe(true);
  });

  it("rejects invalid guardrail flags", () => {
    const parsed = parseThemenradarItem({
      id: "themenradar_2",
      title: "Energiepreise",
      rawSignal: "Signal",
      sourceType: "manual",
      heatScore: 40,
      everydayRelevanceScore: 50,
      polarizationScore: 20,
      membershipPotentialScore: 10,
      jurisdiction: "bund",
      lifecycleStatus: "raw",
      reviewRequired: false,
      autoPostEligible: true,
      officialSocialRequiresReview: false,
      createdBy: null,
      updatedBy: null,
      lastReviewedBy: null,
      lastReviewedAt: null,
      reviewNotes: [],
      auditVersion: 0,
      archivedAt: null,
      archivedBy: null,
      createdAt: new Date("2026-04-19T08:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-04-19T08:00:00.000Z").toISOString(),
    });
    expect(parsed.ok).toBe(false);
  });

  it("clamps scores into the canonical 0..100 range", () => {
    expect(clampScore(-10)).toBe(0);
    expect(clampScore(10.4)).toBe(10);
    expect(clampScore(1000)).toBe(100);
  });

  it("keeps lifecycle transitions strict and ordered", () => {
    expect(canTransitionLifecycle({ from: "raw", to: "qualified" })).toBe(true);
    expect(canTransitionLifecycle({ from: "raw", to: "review_ready" })).toBe(false);
    expect(canTransitionLifecycle({ from: "review_ready", to: "published" })).toBe(true);
    expect(canTransitionLifecycle({ from: "archived", to: "published" })).toBe(false);
  });
});

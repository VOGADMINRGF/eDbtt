import { describe, expect, it } from "vitest";
import {
  hasCreateIntakeContext,
  normalizeCreateIntakeContextInput,
  parseCreateIntakeContextFromQuery,
} from "@/features/create/intakeContext";

describe("create intake context normalizer", () => {
  it("normalizes allowed handoff fields deterministically", () => {
    const context = normalizeCreateIntakeContextInput({
      source: " feed_drafts_queue ",
      signalTitle: " Signal Innenstadt ",
      sourceUrl: "https://example.org/a",
      sourceLabel: " Lokale Presse ",
      region: " DE-BE ",
      scope: " regional ",
      clusterHint: " cluster-verkehr ",
      reviewState: " queued ",
      candidateId: " cand-1 ",
      draftId: " draft-1 ",
      reason: " manual_fast_path ",
    });

    expect(context).toMatchObject({
      source: "feed_drafts_queue",
      signalTitle: "Signal Innenstadt",
      sourceUrl: "https://example.org/a",
      sourceLabel: "Lokale Presse",
      region: "DE-BE",
      scope: "regional",
      clusterHint: "cluster-verkehr",
      reviewState: "queued",
      candidateId: "cand-1",
      draftId: "draft-1",
      reason: "manual_fast_path",
    });
    expect(hasCreateIntakeContext(context)).toBe(true);
  });

  it("ignores unknown legacy query keys and rejects invalid URL fields", () => {
    const context = parseCreateIntakeContextFromQuery({
      mode: "manual",
      legacyMode: "feed",
      sourceUrl: "javascript:alert(1)",
      unknownHint: "abc",
    });

    expect(context.source).toBeNull();
    expect(context.sourceUrl).toBeNull();
    expect(context.reason).toBeNull();
    expect(hasCreateIntakeContext(context)).toBe(false);
  });

  it("parses encoded values and truncates oversized values from query params", () => {
    const context = parseCreateIntakeContextFromQuery({
      signalTitle: "Signal%20Innenstadt",
      reason: ` ${"r".repeat(300)} `,
      source: ["feed_drafts_queue", "ignored-second"],
    });

    expect(context.signalTitle).toBe("Signal Innenstadt");
    expect(context.reason?.length).toBe(200);
    expect(context.source).toBe("feed_drafts_queue");
  });
});

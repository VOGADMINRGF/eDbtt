import { describe, expect, it } from "vitest";
import { buildCreateFastPathHref, createModeFromIntent, parseCreateMode } from "@/features/create/intents";

describe("create mode canonical parsing", () => {
  it("keeps canonical modes", () => {
    expect(parseCreateMode("manual")).toBe("manual");
    expect(parseCreateMode("source")).toBe("source");
    expect(parseCreateMode("ai")).toBe("ai");
  });

  it("maps legacy aliases to canonical modes", () => {
    expect(parseCreateMode("ai_assist")).toBe("ai");
    expect(parseCreateMode("feed")).toBe("source");
    expect(parseCreateMode("cluster")).toBe("source");
  });

  it("keeps intent fallback stable", () => {
    expect(createModeFromIntent("claim")).toBe("manual");
    expect(createModeFromIntent("source")).toBe("source");
    expect(createModeFromIntent(undefined)).toBe("source");
  });

  it("builds fast-path links without forcing legacy mode/intent defaults", () => {
    const href = buildCreateFastPathHref({ anlassraumId: "65f000000000000000000011" });
    expect(href).toBe("/create?anlassraumId=65f000000000000000000011");
  });

  it("serializes reusable intake context fields for canonical /create handoff", () => {
    const href = buildCreateFastPathHref({
      anlassraumId: "65f000000000000000000011",
      draftId: "65f000000000000000000101",
      source: "feed_drafts_queue",
      signalTitle: "Signal Innenstadt",
      sourceUrl: "https://example.org/a",
      region: "DE-BE",
      scope: "regional",
      clusterHint: "cluster-verkehr",
      reviewState: "queued",
      reason: "manual_fast_path_via_create",
    });

    expect(href).toContain("/create?");
    expect(href).toContain("anlassraumId=65f000000000000000000011");
    expect(href).toContain("draftId=65f000000000000000000101");
    expect(href).toContain("source=feed_drafts_queue");
    expect(href).toContain("signalTitle=Signal+Innenstadt");
    expect(href).toContain("sourceUrl=https%3A%2F%2Fexample.org%2Fa");
    expect(href).toContain("region=DE-BE");
    expect(href).toContain("scope=regional");
    expect(href).toContain("clusterHint=cluster-verkehr");
    expect(href).toContain("reviewState=queued");
    expect(href).toContain("reason=manual_fast_path_via_create");
  });
});

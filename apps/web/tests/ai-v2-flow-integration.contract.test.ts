import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { resolveAiFlowIntegration } from "@/features/ai/v2OrchestrationPolicy";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

describe("ai v2 flow integration contract", () => {
  it("binds themenradar, feed and material extraction to explicit V2 AI lanes", () => {
    expect(resolveAiFlowIntegration("themenradar")).toMatchObject({
      lane: "themenradar_cluster",
      reviewRequired: true,
      draftOnly: true,
      publicOutputAllowed: false,
    });
    expect(resolveAiFlowIntegration("feed_signal")).toMatchObject({
      lane: "feed_signal",
      reviewRequired: true,
      draftOnly: true,
      publicOutputAllowed: false,
    });
    expect(resolveAiFlowIntegration("material_extraction")).toMatchObject({
      lane: "material_extraction",
      reviewRequired: true,
      draftOnly: true,
      publicOutputAllowed: false,
    });
  });

  it("wires the policy contract into the existing V2 flow readmodels", () => {
    const themenradar = read("../../features/themenradar/autonomousSupply.ts");
    const feeds = read("../../features/feeds/runtimeReadModel.ts");
    const material = read("src/features/material/materialExtractionJobs.ts");

    expect(themenradar).toContain('resolveAiFlowIntegration("themenradar")');
    expect(themenradar).toContain("aiOrchestration");

    expect(feeds).toContain('resolveAiFlowIntegration("feed_signal")');
    expect(feeds).toContain('resolveAiFlowIntegration("themenradar")');
    expect(feeds).toContain('resolveAiFlowIntegration("material_extraction")');
    expect(feeds).toContain("aiOrchestration");

    expect(material).toContain('resolveAiFlowIntegration("material_extraction")');
    expect(material).toContain("aiOrchestration");
  });
});

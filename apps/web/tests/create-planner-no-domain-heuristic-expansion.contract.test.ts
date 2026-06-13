import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildCreatePlanner } from "@/features/create/createPlanner";

describe("create planner no domain heuristic expansion contract", () => {
  it("keeps the documented quota fallback as a degraded technical fallback instead of a canonical planner result", async () => {
    const originalOpenAiKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const planner = await buildCreatePlanner({
        text: "ich bin gegen frauenquote aber für mehr gleichberechtigung, gibt es eine frauenquote müsste es auch quoten von anderen minderheiten geben, das kann nicht richtig und wirtschaftlich für ein unternehmen sein.",
        locale: "de",
      });

      expect(planner.source).toBe("planner_unavailable");
      expect(planner.plannerSource).toBe("planner_unavailable");
      expect(planner.plannerProvider).toBe("openai");
      expect(planner.providerPlan.plannerProvider).toBe("openai");
      expect(planner.plannerDegraded).toBe(true);
      expect(planner.degradedReason).toBe("missing_provider_key");
      expect(planner.providerCallAttempted).toBe(false);
      expect(planner.providerCallSucceeded).toBe(false);
      expect(planner.qualityStatus).toBe("failed");
      expect(planner.qualityIssues).toContain("planner_unavailable");
      expect(planner.plannerTopic).toBe("GPT-Einordnung nicht abgeschlossen");
      expect(planner.plannerClusters).toEqual([]);
      expect(planner.topicCandidates).toEqual([]);
      expect(planner.permissions.canPublish).toBe(false);
      expect(planner.permissions.canSave).toBe(false);
      expect(planner.permissions.canMerge).toBe(false);
      expect(planner.permissions.canDeepSearch).toBe(false);
      expect(planner.providerPlan.deepSearchUsed).toBe(false);
      expect(planner.providerPlan.graphMatch).toBe("after_structure");
    } finally {
      if (originalOpenAiKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalOpenAiKey;
    }
  });

  it("documents the quota fallback as technical fallback only, not canonical domain mapping", () => {
    const source = readFileSync(resolve(process.cwd(), "src/features/create/createPlanner.ts"), "utf8");

    expect(source).toContain("technical fallback only, not canonical domain mapping");
  });
});

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  isCreateFastIntakeText,
  resolveCreatePlannerMaxOutputTokens,
  resolveCreatePlannerTimeoutMs,
} from "@/features/create/createPlanner";

const REGRESSION_TEXT =
  "ich bin für mindestlohn bei behindertenwerkstätten, für mehr integration innerhalb der wirtschaft aber auch für stärkere kontrollen der vorstände der jeweiligen akteure";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("create fast-intake latency contract", () => {
  it("uses the small one-call planner profile for the regression input", () => {
    expect(isCreateFastIntakeText(REGRESSION_TEXT)).toBe(true);
    expect(resolveCreatePlannerTimeoutMs(REGRESSION_TEXT)).toBe(4_200);
    expect(resolveCreatePlannerMaxOutputTokens(REGRESSION_TEXT)).toBe(400);
  });

  it("keeps save-first safety and one five-second analysis deadline", () => {
    const client = source("src/app/create/CreateClient.tsx");
    const saveIndex = client.indexOf('fetch("/api/create/save"');
    const plannerIndex = client.indexOf('fetch("/api/create/intelligent-followup"');

    expect(client).toContain("const CREATE_FIRST_RESPONSE_HARD_LIMIT_MS = 5_000;");
    expect(saveIndex).toBeGreaterThan(-1);
    expect(plannerIndex).toBeGreaterThan(saveIndex);
    expect((client.match(/signal: firstResponseController\.signal/g) ?? [])).toHaveLength(1);
    expect(
      client.slice(saveIndex, plannerIndex),
    ).not.toContain("signal: firstResponseController.signal");
    expect(client).toContain("saveMs");
    expect(client).toContain("submitToResultMs");
  });

  it("keeps enrichment behind confirmation and reports stage timings", () => {
    const visualFollowup = source("src/features/create/CreateVisualFollowup.tsx");
    const planner = source("src/features/create/createPlanner.ts");
    const saveRoute = source("src/app/api/create/save/route.ts");
    const followupRoute = source("src/app/api/create/intelligent-followup/route.ts");
    const confirmationGate = visualFollowup.indexOf("if (!isConfirmed)");
    const runtimeMatch = visualFollowup.indexOf(
      "resolveExistingTopicMatchesFromRuntime({ result })",
    );

    expect(confirmationGate).toBeGreaterThan(-1);
    expect(runtimeMatch).toBeGreaterThan(confirmationGate);
    expect(planner).not.toContain("await recordCreatePlannerAiUsage({");
    expect(saveRoute).toContain("accessMs");
    expect(saveRoute).toContain("contextMs");
    expect(saveRoute).toContain("saveMs");
    expect(followupRoute).toContain("plannerMs");
    expect(followupRoute).toContain("contextMs");
    expect(followupRoute).toContain("totalMs");
  });
});

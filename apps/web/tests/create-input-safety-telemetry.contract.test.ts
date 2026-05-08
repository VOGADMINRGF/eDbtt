import { describe, expect, it } from "vitest";
import { evaluateCreateInputSafety } from "@/features/create/safety/createInputSafety";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

describe("create input safety telemetry contract", () => {
  it("stores telemetry with the issue-defined privacy fields only and no raw pii", () => {
    const result = evaluateCreateInputSafety({
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyPiiAccusation,
      locale: "de",
      routeStage: "save",
      runId: "run-123",
      correlationId: "corr-123",
    });

    expect(result.telemetry.schemaVersion).toBe("create_safety_telemetry_v1");
    expect(result.telemetry.routeStage).toBe("save");
    expect(result.telemetry.runId).toBe("run-123");
    expect(result.telemetry.correlationId).toBe("corr-123");
    expect(result.telemetry.redactionApplied).toBe(true);
    expect(result.telemetry.findingCounts.phone).toBe(1);
    expect(result.telemetry.factCheckCandidateCount).toBeGreaterThan(0);
    expect(JSON.stringify(result.telemetry)).not.toContain("9999999");
    expect(JSON.stringify(result.telemetry)).not.toContain("Musterstraße");
    expect(JSON.stringify(Object.keys(result.telemetry).sort())).toBe(
      JSON.stringify(
        [
          "correlationId",
          "crossLingualRisk",
          "decision",
          "factCheckCandidateCount",
          "findingCounts",
          "findingKinds",
          "graphReviewHintCount",
          "quality",
          "redactionApplied",
          "requiresHumanReview",
          "routeStage",
          "runId",
          "schemaVersion",
          "severity",
          "timestamp",
        ].sort(),
      ),
    );
  });

  it("keeps safe verification questions allow-level while preserving telemetry metadata", () => {
    const result = evaluateCreateInputSafety({
      text: CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim,
      locale: "de",
      routeStage: "analyze",
    });

    expect(result.decision).toBe("allow");
    expect(result.telemetry.requiresHumanReview).toBe(false);
    expect(result.telemetry.quality.overall).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import { resolveAiSmokeStatusCopy } from "@/features/ai/v2OrchestrationPolicy";

describe("ai smoke status copy contract", () => {
  it("distinguishes intentionally skipped paths from failures", () => {
    expect(
      resolveAiSmokeStatusCopy({
        status: "skipped",
        journeyDecision: "fallback_not_needed",
      }),
    ).toEqual({
      code: "skipped_not_needed",
      label: "Übersprungen, nicht nötig",
      description: "Der Provider wurde bewusst nicht gebraucht, weil der primäre Pfad gereicht hat.",
    });

    expect(
      resolveAiSmokeStatusCopy({
        status: "skipped",
        journeyDecision: "not_in_plan",
      }),
    ).toEqual({
      code: "skipped_not_in_lane",
      label: "Übersprungen, nicht in dieser Lane",
      description: "Der Provider gehört bewusst nicht zu diesem Lane-/Journey-Pfad.",
    });
  });

  it("exposes degraded, timeout and schema failures separately", () => {
    expect(
      resolveAiSmokeStatusCopy({
        status: "degraded",
        finalContractStatus: "repaired_degraded",
      }),
    ).toMatchObject({ code: "degraded", label: "Degradiert" });

    expect(
      resolveAiSmokeStatusCopy({
        status: "failed",
        errorKind: "TIMEOUT",
      }),
    ).toMatchObject({ code: "timeout", label: "Timeout" });

    expect(
      resolveAiSmokeStatusCopy({
        status: "failed",
        errorKind: "BAD_JSON",
      }),
    ).toMatchObject({ code: "schema_failed", label: "Schema fehlgeschlagen" });
  });

  it("marks built-valid paths as explicit fallback use instead of green success", () => {
    expect(
      resolveAiSmokeStatusCopy({
        status: "ok",
        finalContractStatus: "built_valid",
      }),
    ).toMatchObject({
      code: "fallback_used",
      label: "Fallback genutzt",
    });
  });
});

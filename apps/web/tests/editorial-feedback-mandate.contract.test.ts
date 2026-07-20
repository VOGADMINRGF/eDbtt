import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  formatEditorialStatus,
  resolveEditorialFeedbackReviewStatus,
  resolveEditorialStatus,
} from "../src/lib/editorial/status";

const routeSource = readFileSync(
  new URL("../src/app/api/editorial/feedback/route.ts", import.meta.url),
  "utf8",
);

describe("editorial feedback mandate contract", () => {
  it("accepts bounded mandate feedback categories", () => {
    const actionTypes = [
      "mandate_update_submit",
      "mandate_risk_submit",
      "mandate_responsibility_submit",
      "mandate_impact_submit",
    ];

    for (const actionType of actionTypes) {
      expect(routeSource).toContain(`z.literal("${actionType}")`);
    }

    expect(routeSource).toContain(
      "const MandateTitle = z.string().trim().min(1).max(120);",
    );
    expect(routeSource).toContain(
      "const MandateDescription = z.string().trim().min(1).max(800);",
    );

    const boundedSourceLists =
      routeSource.match(
        /sources: z\.array\(SourceUrl\)\.max\(5\)\.optional\(\)/g,
      ) ?? [];

    expect(boundedSourceLists).toHaveLength(4);
  });

  it("sends mandate and factcheck submissions into human review", () => {
    const reviewRequiredActions = [
      "manual_factcheck_submit",
      "manual_factcheck_update",
      "mandate_update_submit",
      "mandate_risk_submit",
      "mandate_responsibility_submit",
      "mandate_impact_submit",
    ];

    for (const actionType of reviewRequiredActions) {
      expect(resolveEditorialFeedbackReviewStatus(actionType)).toBe(
        "pending",
      );
    }

    expect(resolveEditorialFeedbackReviewStatus("confirm_flag")).toBeUndefined();
  });

  it("uses the proper German approved label and accepts both spellings", () => {
    expect(resolveEditorialStatus({ reviewStatus: "geprueft" })).toBe(
      "approved",
    );
    expect(resolveEditorialStatus({ reviewStatus: "geprüft" })).toBe(
      "approved",
    );

    expect(formatEditorialStatus({ reviewStatus: "approved" })).toEqual({
      status: "approved",
      label: "geprüft",
    });
  });
});

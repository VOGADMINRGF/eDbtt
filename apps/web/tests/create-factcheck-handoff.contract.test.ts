import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import {
  buildCreateFactcheckClaimPreview,
  buildCreateHandoffDraft,
  buildCreateHandoffTargetHref,
} from "@/features/create/createHandoff";

describe("create factcheck handoff contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "";
    mocks.analyzeContribution.mockRejectedValue(new Error("provider_failed"));
  });

  it("creates a factcheck request draft without auto deepsearch or seal", async () => {
    const followup = await buildCreateIntelligentFollowup({
      text:
        "Ich bin für besseren Tierschutz und Tierhaltung. Das sollte Europa und weltweit einheitlich umgesetzt werden, mindestens in den Ländern, aus denen wir importieren.",
      locale: "de",
      intent: "contribute",
    });
    const draft = buildCreateHandoffDraft({
      result: followup,
      selectedAction: "request_factcheck",
      id: "factcheck-1",
      sourceUrls: ["https://example.org/tierwohl-standard"],
    });
    const preview = buildCreateFactcheckClaimPreview(draft);

    expect(draft.selectedAction).toBe("request_factcheck");
    expect(draft.reviewState).toBe("factcheck_candidate");
    expect(draft.visibilityState).toBe("internal_review");
    expect(draft.plannerResult.providerPlan.researchUsed).toBe("none");
    expect(draft.plannerResult.providerPlan.deepSearchUsed).toBe(false);
    expect(draft.sourceGrounding).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "link_reference",
          detail: "https://example.org/tierwohl-standard",
        }),
      ]),
    );
    expect(preview.blockedClaims.some((claim) => claim.kind === "policy_claim" || claim.kind === "normative_claim")).toBe(true);
    expect(preview.eligibleClaims.every((claim) => claim.factcheckEligible)).toBe(true);
    expect(buildCreateHandoffTargetHref({ baseHref: "/factcheck", handoffId: draft.id, action: draft.selectedAction })).toContain(
      "handoffId=factcheck-1",
    );
  });
});

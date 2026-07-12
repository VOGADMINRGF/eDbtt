import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { REVIEW_SURFACE_GUARDRAILS } from "@/features/review/reviewSurfaceStatusLabels";

vi.mock("@/features/create/useCreateHandoffDraft", () => ({
  useCreateHandoffDraft: vi.fn(() => ({
    id: "handoff-1",
    plannerResult: {
      plannerCore: "Beispielhafte Behauptung",
      plannerTopic: "Beispiel",
      plannerClusters: [],
    },
    arguments: [],
    sourceText: "Beispiel",
    claims: [],
    topicSeed: {
      jurisdiction: "kommune",
      topicLabel: "Beispiel",
    },
    graphMatches: {
      matches: [],
    },
    sourceGrounding: [],
    openQuestions: [],
    reviewState: "factcheck_candidate",
    resumeHref: "/create?resume=create_handoff&handoffId=handoff-1",
  })),
}));

vi.mock("@/features/surfaces/factcheck", () => ({
  FactcheckSurface: () => <div>FactcheckSurface</div>,
}));

import { FactcheckHandoffShell } from "@/features/surfaces/factcheck/FactcheckHandoffShell";

describe("factcheck handoff shell contract", () => {
  it("keeps factcheck handoff guardrails review-first and non-automatic", () => {
    const html = renderToStaticMarkup(
      <FactcheckHandoffShell
        context={{
          mode: "live",
          audience: "buerger",
          viewerRole: "citizen",
          dataSource: "live",
        }}
        persona="citizen"
        handoffId="handoff-1"
        access={{
          isAuthenticated: true,
          canDeepResearch: false,
        }}
      />,
    );

    expect(html).toContain("Faktencheck-Handoff aus /create");
    expect(html).toContain(REVIEW_SURFACE_GUARDRAILS.factcheckNoAutoRun);
    expect(html).toContain("FactcheckSurface");
  });
});

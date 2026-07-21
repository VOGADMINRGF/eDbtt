import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSource = readFileSync(
  new URL(
    "../src/app/api/factcheck/result/[contributionId]/route.ts",
    import.meta.url,
  ),
  "utf8",
);

describe("factcheck result route contract", () => {
  it("keeps the canonical workflow repository and access controls", () => {
    expect(routeSource).toContain('export const runtime = "nodejs";');
    expect(routeSource).toContain(
      'export const dynamic = "force-dynamic";',
    );

    expect(routeSource).toContain("getFactcheckWorkflowRepo");
    expect(routeSource).toContain("listByContributionId");
    expect(routeSource).toContain("resolveRequestScopeContext");
    expect(routeSource).toContain("canViewFactcheckRecord");

    expect(routeSource).not.toContain("factcheckJobsCol");
    expect(routeSource).not.toContain(".find(");
  });

  it("exposes route classification without weakening result privacy", () => {
    expect(routeSource).toContain("resolveAiRouteClassification");
    expect(routeSource).toContain(
      'reason: "No job found for contributionId"',
    );
    expect(routeSource).toContain(
      'code: "FORBIDDEN"',
    );
    expect(routeSource).toContain(
      'lane: "sealed_factcheck"',
    );
    expect(routeSource).toContain(
      'journeyProfile: "sealed_factcheck"',
    );

    const classificationReferences =
      routeSource.match(/routeClassification/g) ?? [];

    expect(classificationReferences.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps conservative workflow and verification fields", () => {
    expect(routeSource).toContain("resolveSealedFactcheckStatusView");
    expect(routeSource).toContain("factcheckStatusLabel");
    expect(routeSource).toContain("truthStatus");
    expect(routeSource).toContain("sourceSupport");
    expect(routeSource).toContain("sourceStatus");
    expect(routeSource).toContain("sealGranted");
    expect(routeSource).toContain("publicSealVisible");
  });
});

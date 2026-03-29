import { describe, expect, it } from "vitest";
import {
  ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS,
  ORCHESTRATION_ENVELOPE_SYNC_REQUIREMENTS,
  ORCHESTRATION_MAINFLOW_STEP_CONTRACTS,
  ORCHESTRATION_PROVIDER_OPERATIONAL_BASELINE,
  isOrchestrationExceptionRoute,
  isStagedMainflowRoute,
} from "@/features/ai/orchestrationProductionContract";
import { ORCHESTRATION_ROUTE_CONTRACTS } from "@/features/ai/orchestrationRouteContract";
import { CREATE_ANALYZE_STAGE_KEYS } from "@/features/create/analyzeBoundaryContract";

describe("orchestration production contract", () => {
  it("keeps strict-staged mainflow steps explicit and ordered", () => {
    const ids = ORCHESTRATION_MAINFLOW_STEP_CONTRACTS.map((entry) => entry.id);
    expect(ids.slice(0, 4)).toEqual([
      "intake",
      "analyze_quality",
      "graph_match",
      "cta_handoff",
    ]);
  });

  it("keeps boundary required field baseline complete", () => {
    expect(ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS).toContain("runId");
    expect(ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS).toContain("matchSourceState");
    expect(ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS).toContain("noAutoPublish");
    expect(ORCHESTRATION_BOUNDARY_REQUIRED_FIELDS).toContain("noSilentMerge");
  });

  it("keeps stage keys synchronized with create analyze boundary contract", () => {
    expect(ORCHESTRATION_PROVIDER_OPERATIONAL_BASELINE.boundaryContract.stageKeys).toEqual(
      CREATE_ANALYZE_STAGE_KEYS,
    );
  });

  it("treats direct provider routes as explicit exception contract only", () => {
    expect(isStagedMainflowRoute("/api/contributions/analyze")).toBe(true);
    expect(isStagedMainflowRoute("/api/create/analyze")).toBe(true);
    expect(isOrchestrationExceptionRoute("/api/contributions/analyze/save")).toBe(true);
    expect(isOrchestrationExceptionRoute("/api/news/survey-topics")).toBe(true);
    expect(isOrchestrationExceptionRoute("/api/quality/polish")).toBe(true);
    expect(isOrchestrationExceptionRoute("/api/contributions/analyze")).toBe(false);
  });

  it("keeps staged and exception route predicates mutually exclusive for the full route contract", () => {
    for (const entry of ORCHESTRATION_ROUTE_CONTRACTS) {
      const staged = isStagedMainflowRoute(entry.route);
      const exception = isOrchestrationExceptionRoute(entry.route);
      if (entry.mode === "legacy_direct_provider_exception") {
        expect(staged).toBe(false);
        expect(exception).toBe(true);
      } else {
        expect(staged).toBe(true);
        expect(exception).toBe(false);
      }
    }
  });

  it("pins envelope sync rules and provider baseline against direct-first drift", () => {
    expect(ORCHESTRATION_ENVELOPE_SYNC_REQUIREMENTS).toContain(
      "meta.runId must equal createAnalyze.runId",
    );
    expect(ORCHESTRATION_PROVIDER_OPERATIONAL_BASELINE.stagedMainflow.route).toBe(
      "/api/contributions/analyze",
    );
    expect(ORCHESTRATION_PROVIDER_OPERATIONAL_BASELINE.stagedMainflow.wrapperRoute).toBe(
      "/api/create/analyze",
    );
    expect(
      ORCHESTRATION_PROVIDER_OPERATIONAL_BASELINE.directExceptionPolicy.allowedRoutes.includes(
        "/api/contributions/analyze",
      ),
    ).toBe(false);
  });
});

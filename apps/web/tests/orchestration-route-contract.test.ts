import { describe, expect, it } from "vitest";
import {
  LEGACY_DIRECT_PROVIDER_ROUTES,
  ORCHESTRATION_ROUTE_CONTRACTS,
  isLegacyDirectProviderRoute,
  resolveOrchestrationRouteContract,
} from "@/features/ai/orchestrationRouteContract";

describe("orchestration route contract", () => {
  it("keeps strict-staged mainflow routes separate from legacy direct-provider exceptions", () => {
    const modeByRoute = new Map(
      ORCHESTRATION_ROUTE_CONTRACTS.map((entry) => [entry.route, entry.mode]),
    );

    expect(modeByRoute.get("/api/contributions/analyze")).toBe("strict_staged_mainflow");
    expect(modeByRoute.get("/api/create/analyze")).toBe("strict_staged_wrapper");

    expect(modeByRoute.get("/api/contributions/analyze/save")).toBe("legacy_direct_provider_exception");
    expect(modeByRoute.get("/api/contributions/refine")).toBe("legacy_direct_provider_exception");
    expect(modeByRoute.get("/api/quality/clarify")).toBe("legacy_direct_provider_exception");
    expect(modeByRoute.get("/api/_diag/gpt")).toBe("legacy_direct_provider_exception");
    expect(modeByRoute.get("/api/admin/ai/orchestrator-smoke")).toBe("legacy_direct_provider_exception");
    expect(modeByRoute.get("/api/news/survey-topics")).toBe("legacy_direct_provider_exception");
    expect(modeByRoute.get("/api/quality/polish")).toBe("legacy_direct_provider_exception");
  });

  it("resolves contract metadata and legacy helpers deterministically", () => {
    const route = "/api/contributions/refine";
    const contract = resolveOrchestrationRouteContract(route);

    expect(contract?.route).toBe(route);
    expect(contract?.mode).toBe("legacy_direct_provider_exception");
    expect(isLegacyDirectProviderRoute(route)).toBe(true);
    expect(isLegacyDirectProviderRoute("/api/contributions/analyze")).toBe(false);
  });

  it("has no duplicates and keeps legacy routes disjoint from strict-staged routes", () => {
    const routeSet = new Set(ORCHESTRATION_ROUTE_CONTRACTS.map((entry) => entry.route));
    expect(routeSet.size).toBe(ORCHESTRATION_ROUTE_CONTRACTS.length);

    const stagedRoutes = ORCHESTRATION_ROUTE_CONTRACTS
      .filter((entry) => entry.mode !== "legacy_direct_provider_exception")
      .map((entry) => entry.route);
    expect(stagedRoutes.some((route) => LEGACY_DIRECT_PROVIDER_ROUTES.includes(route))).toBe(false);
  });
});

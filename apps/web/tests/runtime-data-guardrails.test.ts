import { describe, expect, it } from "vitest";
import {
  buildRuntimeDataGuardrail,
  isExplicitDemoDossierId,
  isRegionDraftDossierId,
  shouldAllowDemoDossierFallback,
  shouldAllowSwipeSeedFallback,
} from "@/features/runtimeDataGuardrails";

describe("runtime data guardrails", () => {
  it("keeps demo fallback restricted to explicit demo dossier ids", () => {
    expect(isExplicitDemoDossierId("demo")).toBe(true);
    expect(isExplicitDemoDossierId("dossier_demo_mobility_berlin")).toBe(true);
    expect(isExplicitDemoDossierId("demo-innencity-2026")).toBe(true);
    expect(shouldAllowDemoDossierFallback("dossier-draft-abc")).toBe(false);
    expect(shouldAllowDemoDossierFallback("berlin-reinickendorf-review")).toBe(false);
  });

  it("recognizes region draft dossier ids", () => {
    expect(isRegionDraftDossierId("dossier-draft-123")).toBe(true);
    expect(isRegionDraftDossierId("dossier-demo")).toBe(false);
  });

  it("blocks swipe seed fallback in admin, region and fromDraft contexts", () => {
    expect(shouldAllowSwipeSeedFallback({})).toBe(true);
    expect(shouldAllowSwipeSeedFallback({ fromDraftId: "abc" })).toBe(false);
    expect(shouldAllowSwipeSeedFallback({ regionId: "berlin-reinickendorf" })).toBe(false);
    expect(shouldAllowSwipeSeedFallback({ adminContext: true })).toBe(false);
    expect(shouldAllowSwipeSeedFallback({ reviewContext: true })).toBe(false);
  });

  it("marks fixture, demo and local storage provenance explicitly", () => {
    expect(buildRuntimeDataGuardrail("fixture")).toMatchObject({
      isFixture: true,
      isPilotFixture: true,
      notRealNews: true,
      notProductionData: true,
      demoOnly: false,
      localOnly: false,
      reviewRequired: true,
      sourceKind: "fixture",
    });
    expect(buildRuntimeDataGuardrail("demo")).toMatchObject({
      demoOnly: true,
      notProductionData: true,
      sourceKind: "demo",
    });
    expect(buildRuntimeDataGuardrail("local_storage")).toMatchObject({
      localOnly: true,
      reviewRequired: true,
      sourceKind: "local_storage",
    });
  });
});

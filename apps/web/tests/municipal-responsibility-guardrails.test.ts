import { describe, expect, it } from "vitest";
import { resolveMunicipalResponsibilityGuardrails } from "@features/anlassraum/municipalResponsibilityGuardrails";

describe("municipal responsibility guardrails", () => {
  it("enables responsibility context for institutional owner/room combinations", () => {
    const contract = resolveMunicipalResponsibilityGuardrails({
      ownerType: "municipality",
      roomType: "official",
    });

    expect(contract.institutionalContext).toBe(true);
    expect(contract.monitoringFirst).toBe(true);
    expect(contract.allowsResponsibilityContext).toBe(true);
    expect(contract.allowedScopes).toContain("dezernat");
    expect(contract.allowedStatuses).toContain("in_bearbeitung");
    expect(contract.deniesTruthPrivilege).toBe(true);
    expect(contract.deniesPriorityPrivilege).toBe(true);
    expect(contract.deniesScoringPrivilege).toBe(true);
    expect(contract.deniesOverrideOfAnlassraumDossierMandate).toBe(true);
    expect(contract.forbiddenInferences).toContain("hidden_opportunity_scoring");
  });

  it("keeps the same guardrails for non-institution contexts but disables responsibility context", () => {
    const contract = resolveMunicipalResponsibilityGuardrails({
      ownerType: "community",
      roomType: "community",
    });

    expect(contract.institutionalContext).toBe(false);
    expect(contract.allowsResponsibilityContext).toBe(false);
    expect(contract.requiresOpenQuestionsVisibility).toBe(true);
    expect(contract.requiresConflictVisibility).toBe(true);
    expect(contract.requiresMandateProgressTraceability).toBe(true);
    expect(contract.allowsDashboardMonitoringConnection).toBe(true);
    expect(contract.allowsInstitutionalToolingWhenTransparent).toBe(true);
  });
});

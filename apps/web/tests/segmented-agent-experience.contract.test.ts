import { describe, expect, it } from "vitest";
import {
  buildCreateSegmentHint,
  buildInstitutionalOnboardingSegmentHint,
  buildInstitutionalWorkspaceSegmentHint,
  buildPersonalAccountSegmentHint,
  buildPublicReadingGuardrailLines,
  getSegmentedAgentSurfaceByRoute,
  listSegmentedAgentExperiences,
  listSegmentedAgentSurfaces,
  resolveInstitutionalSegmentForOrganizationType,
} from "@/features/agenticRuntime/segmentedAgentExperienceContract";

describe("segmented agent experience contract", () => {
  it("maps the controlled runner routes to explicit surface contracts", () => {
    const routes = [
      "/account",
      "/account/organization",
      "/account/organization/dashboard",
      "/admin/access",
      "/admin/entitlements",
      "/admin/system",
      "/create",
      "/runden",
      "/dossier/[id]",
    ] as const;

    expect(listSegmentedAgentSurfaces()).toHaveLength(routes.length);

    for (const route of routes) {
      expect(getSegmentedAgentSurfaceByRoute(route)?.route).toBe(route);
    }
  });

  it("keeps B2B and B2G institutional without forcing Personal Voxy", () => {
    const experiences = listSegmentedAgentExperiences();
    const b2b = experiences.find((entry) => entry.id === "b2b");
    const b2g = experiences.find((entry) => entry.id === "b2g");
    const organizationSurface = getSegmentedAgentSurfaceByRoute("/account/organization");
    const dashboardSurface = getSegmentedAgentSurfaceByRoute("/account/organization/dashboard");

    expect(b2b?.personalVoxyForced).toBe(false);
    expect(b2g?.personalVoxyForced).toBe(false);
    expect(organizationSurface?.personalVoxyPolicy).toBe("separate_from_institutional");
    expect(dashboardSurface?.personalVoxyPolicy).toBe("separate_from_institutional");
    expect(buildInstitutionalOnboardingSegmentHint()).toContain(
      "Ein persönlicher Companion wird nicht erzwungen.",
    );
    expect(
      buildInstitutionalWorkspaceSegmentHint({
        organizationType: "association",
      }),
    ).toContain("B2B-Workbench");
    expect(
      buildInstitutionalWorkspaceSegmentHint({
        organizationType: "public_administration",
      }),
    ).toContain("B2G-Cockpit");
    expect(resolveInstitutionalSegmentForOrganizationType("public_body")).toBe("b2g");
    expect(resolveInstitutionalSegmentForOrganizationType("foundation")).toBe("b2b");
  });

  it("keeps public reading free and personalization unable to hide core debate truth", () => {
    const publicLines = buildPublicReadingGuardrailLines();
    const dossierSurface = getSegmentedAgentSurfaceByRoute("/dossier/[id]");
    const rundenSurface = getSegmentedAgentSurfaceByRoute("/runden");

    expect(buildPersonalAccountSegmentHint()).toContain("optionaler, consent-basierter");
    expect(buildCreateSegmentHint()).toContain("segmentneutral");
    expect(publicLines).toEqual([
      "Öffentlich lesbare Debattenstände bleiben frei zugänglich.",
      "Personalisierung blendet weder starke Gegenargumente noch Quellen- oder Evidenzgrenzen aus.",
    ]);
    expect(dossierSurface?.publicReadingRemainsFree).toBe(true);
    expect(rundenSurface?.publicReadingRemainsFree).toBe(true);
    expect(dossierSurface?.guardrails.personalizationCannotHideMaterialFacts).toBe(true);
    expect(dossierSurface?.guardrails.strongCounterargumentsRemainVisible).toBe(true);
    expect(dossierSurface?.guardrails.sourceLimitationsRemainVisible).toBe(true);
  });
});

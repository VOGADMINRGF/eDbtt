import { describe, expect, it } from "vitest";
import {
  buildMandateWorkbenchFamilyContract,
  getWorkbenchSurface,
  parseMandateWorkbenchFamily,
} from "@features/mandate";

describe("mandate workbench family contract", () => {
  it("defines a shared dossier/runde/mandat workbench family", () => {
    const family = buildMandateWorkbenchFamilyContract();

    expect(family.familyName).toBe("Dossier-Runde-Mandat Workbench Familie");
    expect(family.surfaces.map((surface) => surface.key).sort()).toEqual(["dossier", "mandat", "runde"]);

    family.surfaces.forEach((surface) => {
      expect(surface.allowsCommentColumnBehavior).toBe(false);
      expect(surface.exampleLabelRequiredWhenMockup).toBe(true);
      expect(surface.readOnlyEvidenceFirst).toBe(true);
    });
  });

  it("keeps mandate surface as implementation/status proof space instead of comment-column behavior", () => {
    const family = buildMandateWorkbenchFamilyContract();
    const mandateSurface = getWorkbenchSurface(family, "mandat");

    expect(mandateSurface.primaryFocus.toLowerCase()).toContain("nachweisraum");
    expect(mandateSurface.primaryFocus.toLowerCase()).toContain("nicht neue debattenspalte");
    expect(mandateSurface.allowsCommentColumnBehavior).toBe(false);
  });

  it("stays compatible with the regional anlassraum flow without routing-canon shift", () => {
    const family = buildMandateWorkbenchFamilyContract();

    expect(family.guardrails.noRoutingCanonChangeInThisSlice).toBe(true);
    expect(family.regionalAnlassraumCompatibility.keepsRundenAsOperationalSurface).toBe(true);
    expect(family.regionalAnlassraumCompatibility.allowsRegionalAnlassraumLinking).toBe(true);
    expect(family.regionalAnlassraumCompatibility.keepsDossierRoundMandateFlow).toBe(
      "anlassraum_to_dossier_to_runde_to_mandat",
    );
  });

  it("parses valid family payload and rejects missing compatibility block", () => {
    const family = buildMandateWorkbenchFamilyContract();
    const parsed = parseMandateWorkbenchFamily(family);

    expect(parsed.guardrails.mockupsMustBeMarkedAsExample).toBe(true);

    const invalid = { ...family } as any;
    delete invalid.regionalAnlassraumCompatibility;

    expect(() => parseMandateWorkbenchFamily(invalid)).toThrow();
  });
});

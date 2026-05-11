import { describe, expect, it } from "vitest";
import {
  getRegionalAdminCockpitById,
  parseRegionalAdminCockpit,
  REGIONAL_ADMIN_COCKPIT_MODULE_KEYS,
  supportsRegionalAdminAssociationScoring,
  supportsRegionalAdminCitizenScoring,
} from "@features/region";

describe("regional admin cockpit contract", () => {
  it("keeps the required module family and disables scoring", () => {
    expect(REGIONAL_ADMIN_COCKPIT_MODULE_KEYS).toEqual([
      "themenlage",
      "akteurskarte",
      "beteiligungsstatus",
      "offene_fragen",
      "teilhabegaps",
      "naechste_rueckmeldungen",
      "mandatsstatus",
    ]);
    expect(supportsRegionalAdminCitizenScoring()).toBe(false);
    expect(supportsRegionalAdminAssociationScoring()).toBe(false);
  });

  it("models reinickendorf as a participation-oriented regional cockpit", () => {
    const cockpit = getRegionalAdminCockpitById("admin-cockpit-reinickendorf");

    expect(cockpit).not.toBeNull();
    expect(cockpit?.regionId).toBe("bezirk-berlin-reinickendorf");
    expect(cockpit?.modules.themenlage.headline).toBe("Themenlage");
    expect(cockpit?.modules.teilhabegaps.summary).toContain("ohne");
    expect(cockpit?.guardrails.noCitizenScoring).toBe(true);
  });

  it("rejects missing modules and shadow scoring fields", () => {
    const cockpit = getRegionalAdminCockpitById("admin-cockpit-reinickendorf");
    if (!cockpit) throw new Error("missing_admin_cockpit_fixture");

    expect(() =>
      parseRegionalAdminCockpit({
        ...cockpit,
        id: "admin-cockpit-missing-module",
        modules: {
          themenlage: cockpit.modules.themenlage,
        },
      }),
    ).toThrow();

    expect(() =>
      parseRegionalAdminCockpit({
        ...cockpit,
        id: "admin-cockpit-shadow-score",
        modules: {
          ...cockpit.modules,
          risiko_score: {
            headline: "Risikoscore",
            summary: "Sollte nicht Teil des regionalen Lagebilds sein.",
          },
        },
      }),
    ).toThrow();
  });
});

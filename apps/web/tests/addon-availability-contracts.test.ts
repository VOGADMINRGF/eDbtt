import { describe, expect, it } from "vitest";
import {
  INSTITUTIONAL_SHARED_ADD_ONS,
  getInstitutionalAddOnsForSegment,
  getInstitutionalAddOnMaturityMeta,
} from "@features/pricing";

describe("addon availability contracts", () => {
  it("keeps add-ons as structured, orderable product blocks", () => {
    expect(INSTITUTIONAL_SHARED_ADD_ONS.length).toBeGreaterThan(0);

    INSTITUTIONAL_SHARED_ADD_ONS.forEach((addon) => {
      expect(addon.id.length).toBeGreaterThan(0);
      expect(addon.title.length).toBeGreaterThan(0);
      expect(addon.priceLabel.length).toBeGreaterThan(0);
      expect(addon.usp.length).toBeGreaterThan(0);
      expect(addon.whenUseful.length).toBeGreaterThan(0);
      expect(addon.recommendedFor.length).toBeGreaterThan(0);
      expect(addon.orderability.length).toBeGreaterThan(0);
      expect(addon.ctaLabel.length).toBeGreaterThan(0);
      expect(addon.relevantSegments.length).toBeGreaterThan(0);
      expect(addon.maturity.length).toBeGreaterThan(0);
      expect(addon.orderability).toMatch(/Bestellbar|bestellbar|ergänzbar/i);
      const maturity = getInstitutionalAddOnMaturityMeta(addon.maturity);
      expect(maturity.label.length).toBeGreaterThan(0);
      expect(maturity.publicHint.length).toBeGreaterThan(0);
      expect(maturity.defaultCtaLabel.length).toBeGreaterThan(0);
    });
  });

  it("keeps segment-specific availability coherent", () => {
    expect(getInstitutionalAddOnsForSegment("privat")).toEqual([]);

    const journalism = getInstitutionalAddOnsForSegment("journalismus");
    const organizations = getInstitutionalAddOnsForSegment("organisationen");
    const municipalities = getInstitutionalAddOnsForSegment("kommunen");

    expect(journalism.map((entry) => entry.id)).toContain("faktencheck_kontingent");
    expect(journalism.map((entry) => entry.id)).not.toContain("managed_governance");

    expect(organizations.map((entry) => entry.id)).toContain("managed_governance");
    expect(municipalities.map((entry) => entry.id)).toContain("moderation_assistenz");
  });

  it("keeps maturity states explicit for realistic public UX promises", () => {
    const levels = new Set(INSTITUTIONAL_SHARED_ADD_ONS.map((entry) => entry.maturity));
    expect(levels.has("direct_orderable")).toBe(true);
    expect(levels.has("orderable_review_required")).toBe(true);
    expect(levels.has("followup_required")).toBe(true);
    expect(levels.has("in_rollout")).toBe(false);

    INSTITUTIONAL_SHARED_ADD_ONS.forEach((addon) => {
      const maturity = getInstitutionalAddOnMaturityMeta(addon.maturity);
      expect(maturity.label).not.toMatch(/\+/);
      expect(maturity.label).toMatch(/Direkt bestellbar|Bestellbar, intern geprüft|Bestellbar, mit Folgeabstimmung|Schrittweise im Ausbau/);
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  getInstitutionalAddOnMaturityMeta,
  getInstitutionalSharedAddOns,
  type InstitutionalAddOnMaturity,
} from "@features/pricing";

const MATURITY: InstitutionalAddOnMaturity[] = [
  "direct_orderable",
  "orderable_review_required",
  "followup_required",
  "in_rollout",
];

describe("addon i18n contract", () => {
  it("keeps DE/EN add-on SSOT aligned by id and maturity", () => {
    const de = getInstitutionalSharedAddOns("de");
    const en = getInstitutionalSharedAddOns("en");

    expect(de.map((entry) => entry.id)).toEqual(en.map((entry) => entry.id));

    de.forEach((deAddOn, index) => {
      const enAddOn = en[index];
      expect(enAddOn).toBeTruthy();
      expect(deAddOn.maturity).toBe(enAddOn.maturity);

      expect(deAddOn.title.length).toBeGreaterThan(2);
      expect(enAddOn.title.length).toBeGreaterThan(2);
      expect(deAddOn.usp.length).toBeGreaterThan(10);
      expect(enAddOn.usp.length).toBeGreaterThan(10);
      expect(deAddOn.whenUseful.length).toBeGreaterThan(10);
      expect(enAddOn.whenUseful.length).toBeGreaterThan(10);
      expect(deAddOn.recommendedFor.length).toBeGreaterThan(10);
      expect(enAddOn.recommendedFor.length).toBeGreaterThan(10);
      expect(deAddOn.ctaLabel.length).toBeGreaterThan(2);
      expect(enAddOn.ctaLabel.length).toBeGreaterThan(2);
    });
  });

  it("maps maturity labels semantically in both locales without leaking internal keys", () => {
    const expectedLabels = {
      de: {
        direct_orderable: "Direkt bestellbar",
        orderable_review_required: "Bestellbar, intern geprüft",
        followup_required: "Bestellbar, mit Folgeabstimmung",
        in_rollout: "Schrittweise im Ausbau",
      },
      en: {
        direct_orderable: "Directly orderable",
        orderable_review_required: "Orderable, internally reviewed",
        followup_required: "Orderable, with follow-up coordination",
        in_rollout: "Rolling out gradually",
      },
    } as const;

    MATURITY.forEach((maturity) => {
      const deMeta = getInstitutionalAddOnMaturityMeta(maturity, "de");
      const enMeta = getInstitutionalAddOnMaturityMeta(maturity, "en");

      expect(deMeta.label).toBe(expectedLabels.de[maturity]);
      expect(enMeta.label).toBe(expectedLabels.en[maturity]);
      expect(deMeta.label).not.toContain(maturity);
      expect(enMeta.label).not.toContain(maturity);
      expect(deMeta.defaultCtaLabel.length).toBeGreaterThan(2);
      expect(enMeta.defaultCtaLabel.length).toBeGreaterThan(2);
    });
  });
});

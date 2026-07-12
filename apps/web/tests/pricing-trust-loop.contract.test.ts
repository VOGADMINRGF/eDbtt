import { describe, expect, it } from "vitest";
import {
  PRICING_PATH_CONTRACT,
  getPricingEntryTrustCopy,
  TRUST_LOOP_FORBIDDEN_PHRASES,
  getPricingPageContent,
  getPricingTrustLoop,
  getVormerkenPageContent,
} from "@features/pricing";

function flattenTexts(input: unknown): string[] {
  if (typeof input === "string") return [input];
  if (Array.isArray(input)) return input.flatMap((entry) => flattenTexts(entry));
  if (input && typeof input === "object") return Object.values(input).flatMap((entry) => flattenTexts(entry));
  return [];
}

describe("pricing trust loop contract", () => {
  it("keeps DE/EN trust loop variants semantic and complete", () => {
    const de = getPricingTrustLoop("de");
    const en = getPricingTrustLoop("en");

    expect(de.leitsatz).toContain("bewusst keine Partei");
    expect(en.leitsatz).toContain("deliberately not a political party");
    expect(de.medium).toContain("starke digitale Verifikation");
    expect(en.medium).toContain("strong digital verification");
    expect(de.long).toContain("papierhafte Trägheit");
    expect(en.long).toContain("paper-heavy inertia");
  });

  it("keeps pricing/vormerken trust copy sourced from central SSOT", () => {
    const deLoop = getPricingTrustLoop("de");
    const enLoop = getPricingTrustLoop("en");
    const pricingDe = getPricingPageContent("de");
    const pricingEn = getPricingPageContent("en");
    const vormerkenDe = getVormerkenPageContent("de");
    const vormerkenEn = getVormerkenPageContent("en");

    expect(pricingDe.initiativeLoopShort).toBe(deLoop.leitsatz);
    expect(pricingDe.initiativeLoopMedium).toBe(deLoop.medium);
    expect(pricingEn.initiativeLoopShort).toBe(enLoop.leitsatz);
    expect(pricingEn.initiativeLoopMedium).toBe(enLoop.medium);
    expect(vormerkenDe.registryGateHint).toBe(deLoop.context.registryVerificationHint);
    expect(vormerkenEn.registryGateHint).toBe(enLoop.context.registryVerificationHint);
    expect(vormerkenDe.packageAndMembershipHint).toBe(deLoop.context.orderActivationHint);
    expect(vormerkenEn.packageAndMembershipHint).toBe(enLoop.context.orderActivationHint);
  });

  it("keeps one canonical direct order path plus legacy fallback path metadata", () => {
    const deEntry = getPricingEntryTrustCopy("de");
    const enEntry = getPricingEntryTrustCopy("en");

    expect(PRICING_PATH_CONTRACT.primaryOrderPath).toBe("/order");
    expect(PRICING_PATH_CONTRACT.legacyFallbackPath).toBe("/vormerken");
    expect(deEntry.legacySurfaceBody).toContain("/order");
    expect(enEntry.legacySurfaceBody).toContain("/order");
  });

  it("avoids forbidden legal-risky phrases in trust SSOT", () => {
    const allTexts = [
      ...flattenTexts(getPricingTrustLoop("de")),
      ...flattenTexts(getPricingTrustLoop("en")),
    ].join("\n");

    for (const phrase of TRUST_LOOP_FORBIDDEN_PHRASES) {
      expect(allTexts.toLowerCase()).not.toContain(phrase.toLowerCase());
    }
  });

  it("prevents mixed-language drift in primary trust lines", () => {
    const de = getPricingTrustLoop("de");
    const en = getPricingTrustLoop("en");

    expect(de.leitsatz).not.toContain("deliberately not a political party");
    expect(en.leitsatz).not.toContain("bewusst keine Partei");
    expect(de.short).not.toContain("paper-heavy");
    expect(en.short).not.toContain("papierhafte");
  });
});

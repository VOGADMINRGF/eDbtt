import { describe, expect, it } from "vitest";
import {
  getMandateById,
  listMandates,
  normalizeConsentStatus,
  normalizeMandateStatus,
  normalizeMandateVisibility,
  normalizeVerificationStatus,
  parseMandate,
  supportsAutomaticAssignment,
  supportsMandateEditInPublicSurface,
  supportsMembershipHandoff,
} from "@features/mandate";

describe("mandate domain contract", () => {
  it("exposes fixture mandates with stable source references", () => {
    const fixtures = listMandates();

    expect(fixtures.length).toBeGreaterThan(0);
    expect(fixtures.every((entry) => entry.id.startsWith("vog-mandat-"))).toBe(true);
    expect(fixtures.some((entry) => entry.sourceDossierId !== null)).toBe(true);
    expect(fixtures.some((entry) => entry.sourceRoundId !== null)).toBe(true);
    expect(fixtures.every((entry) => entry.isReadOnlyPublic)).toBe(true);
  });

  it("normalizes status, visibility, consent and verification safely", () => {
    expect(normalizeMandateStatus("IN_UMSETZUNG")).toBe("in_umsetzung");
    expect(normalizeMandateStatus("unbekannt")).toBe("entwurf");

    expect(normalizeMandateVisibility("PUBLIC_READONLY")).toBe("public_readonly");
    expect(normalizeMandateVisibility("invalid")).toBe("restricted");

    expect(normalizeConsentStatus("GRANTED")).toBe("granted");
    expect(normalizeConsentStatus("invalid")).toBe("pending");

    expect(normalizeVerificationStatus("VERIFIED")).toBe("verified");
    expect(normalizeVerificationStatus("invalid")).toBe("unverified");
  });

  it("keeps read-only/public boundaries and avoids implicit operational behaviors", () => {
    const mandate = getMandateById("vog-mandat-001");

    expect(mandate).not.toBeNull();
    expect(mandate?.visibility).toBe("public_readonly");
    expect(mandate?.isReadOnlyPublic).toBe(true);
    expect(supportsMembershipHandoff()).toBe(false);
    expect(supportsAutomaticAssignment()).toBe(false);
    expect(supportsMandateEditInPublicSurface()).toBe(false);
  });

  it("parses mandate fixtures and keeps language away from parties-book wording", () => {
    const fixtures = listMandates();

    fixtures.forEach((entry) => {
      const parsed = parseMandate(entry);
      expect(parsed.provenance.registerLabel).toBe("VoiceOpenGov Mandatsregister");

      const corpus = [
        parsed.title,
        parsed.subject,
        parsed.publicSummary,
        parsed.provenance.sourceLabel,
        parsed.transparency.scopeNote,
      ]
        .join(" ")
        .toLowerCase();

      expect(corpus).not.toContain("parteienbuch");
      expect(corpus).not.toContain("fraktion");
      expect(corpus).not.toContain("lager");
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  PRIVACY_NOTICE_VERSION,
  buildDefaultConsent,
  buildDefaultOptionalConsent,
  hasRequiredPrivacyAcknowledgement,
  normalizeConsent,
  parseConsentCookie,
  serializeConsent,
} from "@/lib/privacy/consent";

describe("privacy consent contract", () => {
  it("keeps all optional categories disabled by default", () => {
    expect(buildDefaultOptionalConsent()).toEqual({
      comfort: false,
      analytics: false,
      externalMedia: false,
      productImprovement: false,
    });
  });

  it("requires the new notice even when a legacy analytics choice exists", () => {
    const migrated = normalizeConsent({ essential: true, analytics: true });

    expect(migrated?.optional.analytics).toBe(true);
    expect(migrated?.requiredNoticeAcknowledged).toBe(false);
    expect(hasRequiredPrivacyAcknowledgement(migrated)).toBe(false);
  });

  it("allows active processing with current version and only necessary settings", () => {
    const consent = buildDefaultConsent({
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      requiredNoticeAcknowledged: true,
      optional: buildDefaultOptionalConsent(),
      timestamp: "2026-05-11T09:00:00.000Z",
      source: "privacy-gate-necessary-only",
    });

    expect(hasRequiredPrivacyAcknowledgement(consent)).toBe(true);
    expect(consent.optional.analytics).toBe(false);
  });

  it("reopens the gate when the stored version no longer matches", () => {
    const outdated = buildDefaultConsent({
      privacyNoticeVersion: "2026-04-privacy-v0",
      requiredNoticeAcknowledged: true,
      timestamp: "2026-04-01T09:00:00.000Z",
      source: "privacy-gate",
    });

    expect(hasRequiredPrivacyAcknowledgement(outdated)).toBe(false);
  });

  it("round-trips the new consent payload through cookie serialization", () => {
    const consent = buildDefaultConsent({
      requiredNoticeAcknowledged: true,
      optional: {
        comfort: true,
        analytics: false,
        externalMedia: true,
        productImprovement: false,
      },
      timestamp: "2026-05-11T11:45:00.000Z",
      source: "settings",
    });

    expect(parseConsentCookie(serializeConsent(consent))).toEqual(consent);
  });
});

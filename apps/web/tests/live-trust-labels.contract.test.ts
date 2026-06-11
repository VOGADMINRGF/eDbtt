import { describe, expect, it } from "vitest";
import { getLiveTrustLabels } from "@/features/campaign/liveTrustLabels";

function labelTexts(input: Parameters<typeof getLiveTrustLabels>[0]) {
  return getLiveTrustLabels(input).map((label) => label.label);
}

describe("live trust labels contract", () => {
  it("keeps draft campaign entry labels conservative", () => {
    const labels = labelTexts({
      publicationStatus: "draft",
      sourceSupport: "none",
      reviewRecommended: true,
      contributionKind: "contribution",
      origin: "live_campaign",
    });

    expect(labels).toContain("Entwurf");
    expect(labels).toContain("Noch nicht veröffentlicht");
    expect(labels).toContain("Wird eingeordnet");
    expect(labels).toContain("Quellenlage offen");
    expect(labels).toContain("Prüfung empfohlen");
    expect(labels).toContain("Community-Beitrag");
    expect(labels).not.toContain("Verifiziert");
  });

  it("maps sourceSupport none and open to Quellenlage offen", () => {
    expect(labelTexts({ sourceSupport: "none" })).toContain("Quellenlage offen");
    expect(labelTexts({ sourceSupport: "open" })).toContain("Quellenlage offen");
  });

  it("reserves Verifiziert exclusively for sealed_verified", () => {
    expect(
      labelTexts({
        truthStatus: "sealed_verified",
        sourceSupport: "sealed",
        verificationLabel: "verifiziert",
        verificationMode: "sealed",
      }),
    ).toContain("Verifiziert");

    expect(
      labelTexts({
        truthStatus: "factcheck_passed",
        sourceSupport: "sourced",
        verificationLabel: "geprueft",
        verificationMode: "precheck",
      }),
    ).not.toContain("Verifiziert");
  });

  it("shows source-checked states without upgrading them to verified", () => {
    const labels = labelTexts({
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      verificationLabel: "geprueft",
      verificationMode: "precheck",
    });

    expect(labels).toContain("Quellen geprüft");
    expect(labels).not.toContain("Verifiziert");
  });

  it("shows review pending separately from verification", () => {
    const labels = labelTexts({
      publicationStatus: "review_pending",
      sourceSupport: "partial",
      reviewStatus: "pending",
    });

    expect(labels).toContain("Redaktionelle Prüfung ausstehend");
    expect(labels).toContain("Teilweise belegt");
    expect(labels).not.toContain("Verifiziert");
  });
});

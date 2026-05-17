import { describe, expect, it } from "vitest";
import {
  buildRegionIntelligencePrompt,
  mapRegionIntelligenceToSignals,
  parseCommunitySignal,
  REGION_FEED_SIGNAL_FIXTURES,
  runRegionIntelligencePreparation,
  getRegionById,
} from "@features/region";

describe("region intelligence preparation", () => {
  it("builds a guardrail-heavy prompt with region, organization and orientation context", () => {
    const region = getRegionById("bezirk-berlin-reinickendorf");
    if (!region) throw new Error("missing_region_fixture");

    const prompt = buildRegionIntelligencePrompt({
      region,
      organization: {
        primaryOrganizationId: "org-reinickendorf-1",
        organizationIds: ["org-reinickendorf-1"],
        actorRole: "admin",
        entitlementStatus: "admin_fallback",
        verificationStatus: "admin_fallback",
        regionalActorLabels: ["Bezirksamt Reinickendorf"],
      },
      orientation: {
        audience: "verwaltung_organisation",
        goal: "Reviewpflichtige regionale Startlage",
        focusTopics: ["Schulsanierung", "Schulwege"],
        expectedOutputs: [
          "topic_clusters",
          "dossier_suggestions",
          "anlassraum_suggestions",
          "open_questions",
        ],
      },
      sources: [
        {
          kind: "feed_signal",
          signal: REGION_FEED_SIGNAL_FIXTURES[0]!,
        },
      ],
    });

    expect(prompt).toContain("Reinickendorf");
    expect(prompt).toContain("Organisation/Rolle: admin");
    expect(prompt).toContain("Reviewpflichtige regionale Startlage");
    expect(prompt).toContain("keine Live-Crawler-Behauptung");
    expect(prompt).toContain("kein Scraping");
    expect(prompt).toContain("keine DeepSearch-Automatikkosten");
    expect(prompt).toContain("keine automatische amtliche Bewertung");
    expect(prompt).toContain("Quellenstatus:");
    expect(prompt).toContain("Gewichtung:");
  });

  it("prepares deterministic review-only intelligence and maps it back to region feed signals", async () => {
    const region = getRegionById("bezirk-berlin-reinickendorf");
    if (!region) throw new Error("missing_region_fixture");

    const communitySignal = parseCommunitySignal({
      id: "community-intel-1",
      regionId: "bezirk-berlin-reinickendorf",
      title: "Nachbarschaft meldet offene Fragen zu Schulwegen",
      summary: "Mehrere Hinweise betreffen Verkehr und Schulwegsicherheit im Bezirk.",
      signalType: "topic_proposal",
      reviewStatus: "submitted",
      sourceActorId: null,
      sourceUrls: [],
      submitter: {
        mode: "anonymous",
        displayName: null,
        contactChannel: null,
      },
      guardrails: {
        moderationRequired: true,
        noAutoPublish: true,
        noAutoMandate: true,
        noAutomaticDossierCreation: true,
      },
      createdAt: "2026-05-17T00:00:00.000Z",
      updatedAt: "2026-05-17T00:00:00.000Z",
    });

    const preparation = await runRegionIntelligencePreparation({
      region,
      organization: {
        primaryOrganizationId: "org-reinickendorf-1",
        organizationIds: ["org-reinickendorf-1"],
        actorRole: "admin",
        entitlementStatus: "admin_fallback",
        verificationStatus: "admin_fallback",
        regionalActorLabels: ["Bezirksamt Reinickendorf"],
      },
      orientation: {
        audience: "verwaltung_organisation",
        goal: "Reviewpflichtige regionale Startlage",
        focusTopics: ["Schulsanierung", "Verkehr"],
        expectedOutputs: [
          "topic_clusters",
          "dossier_suggestions",
          "anlassraum_suggestions",
          "open_questions",
        ],
      },
      sources: [
        {
          kind: "feed_signal",
          signal: REGION_FEED_SIGNAL_FIXTURES[1]!,
        },
        {
          kind: "community_signal",
          signal: communitySignal,
          regionName: "Reinickendorf",
          activeAnlassraumIds: ["regional-anlassraum-reinickendorf"],
          defaultAnlassraumTitle: "Bildung & Schulinfrastruktur Reinickendorf",
        },
      ],
    });

    expect(preparation.adapterId).toBe("deterministic_fixture");
    expect(preparation.mode).toBe("deterministic_fixture");
    expect(preparation.reviewRequired).toBe(true);
    expect(preparation.noAutoPublish).toBe(true);
    expect(preparation.noAutoCreateDossier).toBe(true);
    expect(preparation.noAutoCreateAnlassraum).toBe(true);
    expect(preparation.noOfficialRating).toBe(true);
    expect(preparation.noDeepSearchAutoCosts).toBe(true);
    expect(preparation.noTenderMonitoring).toBe(true);
    expect(preparation.noProcurementMonitoring).toBe(true);
    expect(preparation.configuredSources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          adapterId: "curated_starting_point",
          category: "curated",
          status: "connected",
        }),
        expect.objectContaining({
          adapterId: "manual_review_queue",
          category: "manual",
          status: "connected",
        }),
        expect.objectContaining({
          adapterId: "productive_regional_source",
          category: "productive",
          status: "missing",
        }),
      ]),
    );
    expect(preparation.sourceStatusSummary.productiveLabel).toContain("Keine produktive Quelle verbunden");
    expect(preparation.sourceStatusSummary.curatedLabel).toContain("kuratierte");
    expect(preparation.sourceStatusSummary.manualLabel).toContain("manuelle");
    expect(preparation.weightingSummary.label).toContain("Gewichtung vorbereitet");
    expect(preparation.reviewSuggestions.length).toBeGreaterThan(0);
    expect(preparation.reviewSuggestions[0]).toEqual(
      expect.objectContaining({
        visibilityState: "internal_review",
      }),
    );
    expect(preparation.topicClusterHints.length).toBeGreaterThan(0);
    expect(preparation.anlassraumSuggestionHints.length).toBeGreaterThan(0);

    const mappedSignals = mapRegionIntelligenceToSignals(preparation);
    expect(mappedSignals.length).toBe(2);
    expect(mappedSignals.every((signal) => signal.noAutoPublish)).toBe(true);
    expect(mappedSignals.every((signal) => signal.noAutoCreateDossier)).toBe(true);
    expect(mappedSignals.every((signal) => signal.noAutoCreateAnlassraum)).toBe(true);
    expect(mappedSignals.every((signal) => signal.noTenderMonitoring)).toBe(true);
    expect(mappedSignals.every((signal) => signal.noProcurementMonitoring)).toBe(true);
    expect(
      mappedSignals.some(
        (signal) =>
          signal.sourceType === "community_signal" &&
          signal.provenance.dataOrigin === "runtime_review_queue" &&
          signal.reviewStatus === "needs_review",
      ),
    ).toBe(true);
  });
});

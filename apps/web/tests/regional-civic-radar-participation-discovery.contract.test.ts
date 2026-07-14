import { describe, expect, it } from "vitest";
import {
  buildRegionSourceConnectionFeedSignals,
  getRegionById,
  parseCommunitySignal,
  REGION_FEED_SIGNAL_FIXTURES,
  runRegionIntelligencePreparation,
} from "@features/region";
import { buildRegionalCivicRadarParticipationDiscoveryContract } from "@/features/agenticRuntime/regionalCivicRadarParticipationDiscoveryContract";

describe("regional civic radar participation discovery contract", () => {
  it("keeps regional discovery review-first with source, organizer, jurisdiction and relevance reasons", async () => {
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

    const productiveSourceSignals = buildRegionSourceConnectionFeedSignals({
      connections: [
        {
          id: "source-1",
          regionId: "bezirk-berlin-reinickendorf",
          label: "Bezirksamt Reinickendorf News",
          sourceType: "municipal_news",
          adapterId: "productive_regional_source",
          url: "https://reinickendorf.example/aktuelles",
          notes: "Explizit verbundene kommunale Quelle",
          enabled: true,
          sampleItems: [
            {
              title: "Schulwegsicherheit im Bezirk",
              summary: "Explizit verbundene kommunale Quelle fuer die regionale Startlage.",
              url: "https://reinickendorf.example/aktuelles/schulwege",
              detectedTopics: ["Schule", "Verkehr"],
            },
          ],
          sourceSnapshotTemplate: {
            id: "region-source-snapshot-template-source-1",
            label: "Beispiel-Snapshot",
            mode: "template_plus_explicit_url",
            seedKind: "example_seed",
            seedKindLabel: "Beispiel-Seed",
            configuredUrl: "https://reinickendorf.example/aktuelles",
            isExampleSeed: true,
            reviewHint: "Explizite URL bleibt reviewpflichtig.",
            noLiveCrawlerClaim: true,
            noScraping: true,
            noDeepSearchAutoCosts: true,
            noAutoPublish: true,
            noPublicOfficial: true,
          },
          createdAt: "2026-05-17T00:00:00.000Z",
          updatedAt: "2026-05-17T00:00:00.000Z",
          createdBy: "admin-1",
          updatedBy: "admin-1",
          reviewRequired: true,
          noLiveCrawlerClaim: true,
          noScraping: true,
          noDeepSearchAutoCosts: true,
        },
      ],
      regionNameById: new Map([["bezirk-berlin-reinickendorf", "Reinickendorf"]]),
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
        ...productiveSourceSignals.map((signal) => ({
          kind: "feed_signal" as const,
          signal,
        })),
        {
          kind: "community_signal",
          signal: communitySignal,
          regionName: "Reinickendorf",
          activeAnlassraumIds: ["regional-anlassraum-reinickendorf"],
          defaultAnlassraumTitle: "Bildung & Schulinfrastruktur Reinickendorf",
        },
      ],
    });

    const model = buildRegionalCivicRadarParticipationDiscoveryContract({
      mode: "topic_watch",
      jurisdictionLabel: "Reinickendorf",
      preparation,
    });

    expect(model.items.length).toBeGreaterThan(0);
    expect(model.items[0]).toMatchObject({
      organizerLabel: expect.any(String),
      jurisdictionLabel: "Reinickendorf",
      deadline: { label: null, state: "missing_runtime_truth" },
      noAutoNotification: true,
    });
    expect(model.items[0]?.relevanceReasons.length).toBeGreaterThan(0);
    expect(model.items.some((item) => item.proactiveEligible)).toBe(true);
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "research_source",
      requiredHumanAction: "triage_regional_relevance",
    });
  });
});

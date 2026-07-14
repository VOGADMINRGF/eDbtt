import { describe, expect, it } from "vitest";
import { buildClaimsFactcheckAgentGraphIntegrationContract } from "@/features/agenticRuntime/claimsFactcheckAgentGraphIntegrationContract";
import { buildResearchSourceTransferabilityContract } from "@/features/agenticRuntime/researchSourceTransferabilityAgentContract";
import { buildCreateHandoffDraft } from "@/features/create/createHandoff";

describe("claims factcheck agent graph integration contract", () => {
  it("keeps claim, interpretation, factcheck candidate and graph candidate separate", () => {
    const draft = buildCreateHandoffDraft({
      id: "handoff-claims-1",
      selectedAction: "request_factcheck",
      result: {
        understanding: {
          summary: "Die Aussagen sollen als Claim- und Quellenbedarf geprueft werden.",
          categories: [],
          topics: [{ id: "t1", label: "Schulwege", confidence: "medium" }],
          statements: [
            {
              text: "Vor der Schule fehlen sichere Uebergaenge.",
              stance: "pro",
              sourceExcerpt: "Eltern berichten von gefaehrlichen Situationen.",
            },
            {
              text: "Die Stadt soll zuerst einen Zebrastreifen einrichten.",
              stance: "pro",
            },
          ],
          scopes: ["district"],
          confidence: "medium",
        },
        suggestions: [],
        sourceText:
          "Vor der Schule fehlen sichere Uebergaenge. Die Stadt soll zuerst einen Zebrastreifen einrichten.",
        generatedAt: "2026-07-14T08:30:00.000Z",
        meta: {
          planner: {
            source: "openai",
            plannerSource: "openai",
            plannerProvider: "openai",
            plannerRole: "planner_only",
            plannerTopic: "Schulwege",
            plannerCore:
              "Vor der Schule fehlen sichere Uebergaenge. Die Stadt soll zuerst einen Zebrastreifen einrichten.",
            plannerScope: ["district"],
            plannerStance: "pro",
            plannerClusters: ["Mobilitaet"],
            plannerOpenQuestions: ["Welche Querung zuerst?"],
            shortSummary:
              "Die Aussagen sollen als Claim- und Quellenbedarf geprueft werden.",
            topicCandidates: ["Schulwege"],
            clusterCandidates: ["Mobilitaet"],
            scopeCandidates: ["district"],
            stance: "pro",
            openQuestions: ["Welche Querung zuerst?"],
            graphSearchTerms: ["Schulwege"],
            materialSignals: [],
            recommendedLane: "create_fast_followup",
            providerPlan: {
              lane: "create_fast_followup",
              plannerProvider: "openai",
              plannerRole: "planner_only",
              structureProvider: "mistral",
              summaryProvider: "claude",
              researchUsed: "none",
              researchProvider: null,
              deepSearchUsed: false,
              graphMatch: "after_structure",
            },
            permissions: {
              nonMutative: true,
              canPublish: false,
              canSave: false,
              canMerge: false,
              canDeepSearch: false,
            },
            plannerDegraded: false,
            degradedReason: null,
            plannerDegradedReason: null,
            qualityStatus: "specific",
            qualityIssues: [],
            providerCallAttempted: true,
            providerCallSucceeded: true,
            plannerDebug: {
              attemptedProvider: "openai",
              usedProvider: "openai",
              providerAvailable: true,
              providerErrorCode: null,
              providerErrorMessage: null,
              errorMessage: null,
              rawPayloadValid: true,
              rawTextValid: true,
              normalizedPayloadValid: true,
              qualityGatePassed: true,
            },
          },
          graphMatch: {
            stage: "after_structure",
            prepared: true,
            requiresConfirmation: true,
            searchTerms: ["Schulwege"],
            matches: [],
            matchedTopics: [],
            matchedDossiers: [],
            matchedClaims: [],
            matchedAnlassraeume: [],
            matchedVotes: [],
            shouldCreateNewTopic: false,
          },
          researchUsed: "none",
          researchProvider: null,
          deepSearchUsed: false,
        },
      },
    });
    const research = buildResearchSourceTransferabilityContract({
      sourcePackId: "claims-pack-1",
      localRegionCode: "DE-BE",
      sources: [
        {
          sourceId: "source-1",
          title: "Bezirksdokument",
          url: "https://example.org/bezirk",
          sourceLocale: "de-DE",
          regionCode: "DE-BE",
          sourceType: "official",
          reliabilityHint: "primary",
          retrievedAt: "2026-07-14T08:00:00.000Z",
          originalSnippet: "Original",
          translationStatus: "not_needed",
          evidenceState: "supported",
          issuerLabel: "Bezirk",
          jurisdictionLabel: "Berlin",
        },
      ],
    });

    const model = buildClaimsFactcheckAgentGraphIntegrationContract({
      draft,
      research,
    });

    expect(model.claims[0]).toMatchObject({
      semanticType: "claim_candidate",
      claimIsFact: false,
      factcheckStatus: "candidate_only",
      graphWriteState: "candidate_only",
    });
    expect(model.claims[1]).toMatchObject({
      semanticType: "policy_candidate",
      factcheckStatus: "not_applicable",
    });
    expect(model.translationIsEvidence).toBe(false);
    expect(model.graphEdgeCandidates[0]).toMatchObject({
      candidateOnly: true,
    });
    expect(model.safeTrace[0]).toMatchObject({
      roleId: "claims_factcheck",
      requiredHumanAction: "verify_source_provenance",
    });
  });
});

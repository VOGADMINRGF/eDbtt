import { describe, expect, it } from "vitest";
import { buildClaimsFactcheckAgentGraphIntegrationContract } from "@/features/agenticRuntime/claimsFactcheckAgentGraphIntegrationContract";
import { buildDossierCauseEffectResponsibilityTransferGraphContract } from "@/features/agenticRuntime/dossierCauseEffectResponsibilityTransferGraphContract";
import { buildResearchSourceTransferabilityContract } from "@/features/agenticRuntime/researchSourceTransferabilityAgentContract";
import { buildCreateHandoffDraft } from "@/features/create/createHandoff";

describe("dossier cause effect responsibility transfer graph contract", () => {
  it("keeps cause, effect, responsibility and transferability as review-first candidates", () => {
    const draft = buildCreateHandoffDraft({
      id: "handoff-dossier-1",
      selectedAction: "append_to_dossier",
      result: {
        understanding: {
          summary: "Die Aussagen sollen im Dossier als Ursache-Wirkungs-Kandidaten geordnet werden.",
          categories: [],
          topics: [{ id: "t1", label: "Mobilitaet", confidence: "medium" }],
          statements: [
            {
              text: "Gefaehrliche Querungen fuehren morgens zu riskanten Ausweichmanoevern.",
              stance: "pro",
              sourceExcerpt: "Beobachtung aus dem Kiez.",
            },
          ],
          scopes: ["district"],
          confidence: "medium",
        },
        suggestions: [],
        sourceText:
          "Gefaehrliche Querungen fuehren morgens zu riskanten Ausweichmanoevern.",
        generatedAt: "2026-07-14T08:45:00.000Z",
        meta: {
          planner: {
            source: "openai",
            plannerSource: "openai",
            plannerProvider: "openai",
            plannerRole: "planner_only",
            plannerTopic: "Mobilitaet",
            plannerCore:
              "Gefaehrliche Querungen fuehren morgens zu riskanten Ausweichmanoevern.",
            plannerScope: ["district"],
            plannerStance: "pro",
            plannerClusters: ["Mobilitaet"],
            plannerOpenQuestions: ["Wer ist fuer die Querung zustaendig?"],
            shortSummary:
              "Die Aussagen sollen im Dossier als Ursache-Wirkungs-Kandidaten geordnet werden.",
            topicCandidates: ["Mobilitaet"],
            clusterCandidates: ["Mobilitaet"],
            scopeCandidates: ["district"],
            stance: "pro",
            openQuestions: ["Wer ist fuer die Querung zustaendig?"],
            graphSearchTerms: ["Querungen"],
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
            searchTerms: ["Querungen"],
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
      sourcePackId: "transfer-pack-1",
      localRegionCode: "DE-BE",
      sources: [
        {
          sourceId: "source-local",
          title: "Berliner Bericht",
          url: "https://example.org/berlin",
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
        {
          sourceId: "source-intl",
          title: "International Reference",
          url: "https://example.org/intl",
          sourceLocale: "en-GB",
          regionCode: "GB-LND",
          sourceType: "research",
          reliabilityHint: "secondary",
          retrievedAt: "2026-07-14T08:10:00.000Z",
          originalSnippet: "Original",
          translatedSnippet: "Reading support",
          translationStatus: "translated",
          evidenceState: "supported",
          issuerLabel: "City Lab",
          jurisdictionLabel: "London",
        },
      ],
    });
    const claims = buildClaimsFactcheckAgentGraphIntegrationContract({
      draft,
      research,
    });

    const model = buildDossierCauseEffectResponsibilityTransferGraphContract({
      claimsModel: claims,
      responsibilityHints: ["Bezirk und Schulverwaltung"],
    });

    expect(model.causeCandidates[0]).toMatchObject({ reviewState: "candidate_only" });
    expect(model.effectCandidates[0]).toMatchObject({ reviewState: "candidate_only" });
    expect(model.responsibilityCandidates[0]).toMatchObject({
      institutionalVerification: "required",
    });
    expect(model.transferabilityCandidates[0]).toMatchObject({
      approvedComparison: false,
      reviewState: "candidate_only",
    });
    expect(model.noAutoGraphWrite).toBe(true);
    expect(model.noAutoDossierPublish).toBe(true);
    expect(model.safeTrace[1]).toMatchObject({
      roleId: "dossier_briefing",
      requiredHumanAction: "assess_transferability",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInMemoryPersistedCreateHandoffRepo,
  setPersistedCreateHandoffRepoForTests,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSignalDraftPersistence,
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionSignalDraftPersistenceForTests,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier/server/studioPersistence";
import {
  createInMemoryFactcheckWorkflowRepo,
  getFactcheckWorkflowRepo,
  setFactcheckWorkflowRepoForTests,
} from "@features/factcheck/db";
import {
  createInMemorySocialDistributionRepo,
  getSocialDistributionRepo,
  setSocialDistributionRepoForTests,
} from "@features/outputEngine/socialDistributionRuntime";
import { buildReviewQueueReadModel } from "@features/reviewQueue";
import {
  applyReviewQueueOperation,
  createInMemoryReviewQueueOperationRepo,
  setReviewQueueOperationRepoForTests,
} from "@features/reviewQueueOperations";

const mocks = vi.hoisted(() => ({
  listCreatePrepareAttachDraftQueue: vi.fn(),
}));

vi.mock("@/features/create/attachDraftReviewQueue", () => ({
  listCreatePrepareAttachDraftQueue: (...args: unknown[]) =>
    mocks.listCreatePrepareAttachDraftQueue(...args),
}));

function participationRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "signal-open-1",
    regionId: "bezirk-berlin-reinickendorf",
    proposedRegionId: null,
    needsRegionReview: false,
    sourceClass: "participation",
    sourceType: "public_question",
    title: "Wie lösen wir die Schulsanierung im Bezirk?",
    summary: "Öffentliche Frage aus dem Anlassraum zur Schulsanierung.",
    publicSafeTitle: "Wie lösen wir die Schulsanierung im Bezirk?",
    publicSafeSummary: "Öffentliche Frage aus dem Anlassraum zur Schulsanierung.",
    detectedTopics: ["Bildung"],
    detectedPlaces: ["Reinickendorf"],
    matchedPlaces: ["Reinickendorf"],
    matchedRegionIds: ["bezirk-berlin-reinickendorf"],
    relatedClaimIds: [],
    relatedContributionIds: [],
    relatedStatementIds: [],
    relatedDossierIds: [],
    relatedAnlassraumIds: ["anlassraum-1"],
    aggregationMode: "single_review_item",
    privacyMode: "no_personal_data",
    reviewStatus: "needs_review",
    visibilityState: "public_unverified",
    confidence: 0.83,
    provenance: {
      sourceKind: "runtime",
      sourceCollection: "signals",
      sourceRefId: "signal-open-1",
      isFixture: false,
      isPilotFixture: false,
      notRealNews: false,
      notProductionData: false,
      notOfficial: true,
      notRepresentative: true,
    },
    createdAt: "2026-05-17T08:00:00.000Z",
    updatedAt: "2026-05-17T08:00:00.000Z",
    reviewedBy: null,
    reviewedAt: null,
    officialApproval: null,
    noAutoPublish: true,
    noAutoCreateDossier: true,
    noAutoCreateAnlassraum: true,
    noPersonalProfiling: true,
    noPoliticalScoring: true,
    noRepresentativeClaim: true,
    noTenderMonitoring: true,
    noProcurementMonitoring: true,
    ...overrides,
  };
}

describe("review queue readmodel", () => {
  beforeEach(async () => {
    mocks.listCreatePrepareAttachDraftQueue.mockResolvedValue({
      total: 1,
      items: [
        {
          draftId: "65f000000000000000000011",
          ctaId: "perspektive_anhaengen",
          matchType: "related_claim",
          matchEntityType: "claim",
          attachTargetType: "claim",
          attachTargetId: "claim-1",
          attachTargetLabel: "Create-Handoff Schulsanierung",
          sourceSummary: "Perspektive aus /create wartet auf manuelle Zuordnung.",
          reasons: ["Semantische Nähe"],
          duplicateRisk: false,
          requiresReview: true,
          reviewState: "pending",
          applyState: "not_applied",
          reviewNote: null,
          reviewedAt: null,
          reviewedBy: null,
          appliedAt: null,
          appliedBy: null,
          applyNote: null,
          applyError: null,
          version: 1,
          createdAt: "2026-05-17T11:00:00.000Z",
          updatedAt: "2026-05-17T11:00:00.000Z",
        },
      ],
    });

    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo({
        records: [
          participationRecord(),
          participationRecord({
            id: "signal-official-1",
            sourceType: "public_claim",
            title: "Sanierungsbedarf an Schulen ist bestätigt",
            summary: "Angenommenes Beteiligungssignal mit möglicher amtlicher Freigabe.",
            publicSafeTitle: "Sanierungsbedarf an Schulen ist bestätigt",
            publicSafeSummary: "Angenommenes Beteiligungssignal mit möglicher amtlicher Freigabe.",
            relatedAnlassraumIds: [],
            reviewStatus: "accepted",
            visibilityState: "public_reviewed",
            createdAt: "2026-05-17T09:00:00.000Z",
            updatedAt: "2026-05-17T09:00:00.000Z",
          }),
        ] as any,
      }),
    );

    const draftPersistence = createInMemoryRegionSignalDraftPersistence();
    await draftPersistence.saveRecord({
      id: "draft-record-dossier-1",
      uniqueKey: "region-signal-draft:bezirk-berlin-reinickendorf:dossier:signal-1",
      signalId: "signal-open-1",
      regionId: "bezirk-berlin-reinickendorf",
      draftId: "dossier-draft-1",
      draftType: "dossier",
      title: "Schulsanierung als Dossier-Entwurf",
      summary: "Reviewpflichtiger RegionSignalDraft aus Reinickendorf.",
      reviewStatus: "needs_review",
      createdByUserId: "user-1",
      createdByRole: "participation_officer",
      authoritySource: "verified_membership",
      adminFallback: false,
      relatedSignalIds: ["signal-open-1"],
      relatedTopics: ["Bildung"],
      relatedPlaces: ["Reinickendorf"],
      linkedTopicClusterIds: ["bildung"],
      openQuestions: ["Welche Standorte zuerst?"],
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoMandate: true,
        noTenderMonitoring: true,
        noProcurementMonitoring: true,
        reviewRequired: true,
      },
      provenance: {
        sourceSignalId: "signal-open-1",
        sourceRegionId: "bezirk-berlin-reinickendorf",
        createdFrom: "region_signal",
        sourceReviewStatus: "accepted",
        pilotFixture: false,
        notProductionData: false,
        notRealNews: false,
      },
      targetStatus: "draft",
      visibilityState: "internal_review",
      backingStore: "dossiers",
      createdAt: "2026-05-17T10:00:00.000Z",
      updatedAt: "2026-05-17T10:00:00.000Z",
    });
    setRegionSignalDraftPersistenceForTests(draftPersistence);

    const workspaceRepo = createInMemoryDossierStudioWorkspaceRepo();
    await workspaceRepo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-1",
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      source: "region_signal_draft",
      title: "Schulsanierung Studio",
      createdBy: "user-1",
      updatedBy: "user-1",
      seed: {
        status: "needs_review",
        audienceNotes: "Workspace für Verwaltung und Öffentlichkeit prüfen.",
        distributionDraft: {
          draftId: "distribution-1",
          dossierId: "dossier-1",
          packageId: "package-1",
          visibilityState: "internal_review",
          savedAt: "2026-05-17T10:30:00.000Z",
          status: "review_requested",
          scheduleMode: "manual",
          selectedChannels: ["website_update"],
          reviewRequired: true,
          backlinkTarget: "/dossier/dossier-1",
          queue: [
            {
              id: "queue-1",
              channel: "website_update",
              label: "Website-Update",
              recommendedWindow: "Sobald Review abgeschlossen ist",
              status: "review_requested",
              connectorStatus: "internal_available",
              actionLabel: "Review abschließen",
            },
          ],
          notes: ["Kein externes Posting."],
          externalPublish: false,
        },
      },
    });
    setDossierStudioWorkspaceRepoForTests(workspaceRepo);
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        results: [
          {
            id: "source-result-1",
            connectionId: "source-1",
            regionId: "bezirk-berlin-reinickendorf",
            connectionLabel: "Bezirksamt Reinickendorf News",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            resultMode: "dry_run",
            title: "Bezirksamt Reinickendorf News · Dry Run",
            summary: "Explizite URL vorbereitet und reviewpflichtig ausgewertet.",
            configuredUrl: "https://reinickendorf.example/aktuelles",
            detectedTopics: ["Schule", "Verkehr"],
            visibilityState: "internal_review",
            visibilityLabel: "reviewpflichtig",
            reviewStatus: "needs_review",
            confidence: 0.68,
            sourceSnapshotStatus: "fetched",
            sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
            sourceSnapshotSummary: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf.",
            sourceSnapshotExcerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
            sourceSnapshotTemplate: {
              id: "region-source-snapshot-template-source-1",
              label: "Beispiel-Snapshot",
              mode: "template_plus_explicit_url",
              seedKind: "example_seed",
              seedKindLabel: "Beispiel-Seed",
              configuredUrl: "https://reinickendorf.example/aktuelles",
              isExampleSeed: true,
              reviewHint:
                "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
              noLiveCrawlerClaim: true,
              noScraping: true,
              noDeepSearchAutoCosts: true,
              noAutoPublish: true,
              noPublicOfficial: true,
              claimCandidates: [],
              topicCandidates: [],
              evidenceHints: [],
              openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            },
            possibleClaims: [
              {
                text: "Schulsanierung in Reinickendorf",
                confidence: 0.74,
                basisLabel: "Titel",
                excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
                reviewRequired: true,
              },
            ],
            topicClusters: [
              {
                clusterKey: "bildung-schule",
                label: "Schule Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                suggestedAction: "ask_clarifying_question",
                reviewStatus: "needs_review",
              },
            ],
            dossierSuggestions: [
              {
                title: "Berlin Reinickendorf: Schule",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            anlassraumSuggestions: [
              {
                title: "Schule Berlin Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            evidenceReferences: [
              {
                label: "Seitenauszug · Schulsanierung in Reinickendorf",
                url: "https://reinickendorf.example/aktuelles",
                excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
              },
            ],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            affectedScope: {
              regionName: "Berlin Reinickendorf",
              detectedPlaces: ["Berlin Reinickendorf"],
              ortsteilHints: [],
              fachbereichHints: ["Schule/Bildung", "Schule", "Verkehr"],
            },
            reviewSuggestions: [
              {
                id: "region-intelligence-dossier-schule-reinickendorf",
                suggestionType: "dossier_suggestion",
                title: "Berlin Reinickendorf: Schule",
                summary: "1 Signal spricht für einen reviewpflichtigen Dossier-Vorschlag.",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                confidence: 0.68,
                reviewStatus: "needs_review",
                visibilityState: "internal_review",
                sourceCategories: ["productive"],
                sourceLabels: ["Bezirksamt Reinickendorf News"],
                sourceStatusLabel: "1 produktive Quelle verbunden",
              },
            ],
            reviewTaskSummary: {
              claimCount: 1,
              topicClusterCount: 1,
              dossierSuggestionCount: 1,
              anlassraumSuggestionCount: 1,
              openQuestionCount: 1,
              evidenceCount: 1,
              label: "1 mögliche Aussagen · 1 Themencluster · 1 Dossier-Vorschläge · 1 Anlassraum-Vorschläge · 1 offene Fragen",
            },
            createdAt: "2026-05-17T10:40:00.000Z",
            updatedAt: "2026-05-17T10:40:00.000Z",
            testedBy: "admin-1",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
          },
        ],
      }),
    );
    setPersistedCreateHandoffRepoForTests(
      createInMemoryPersistedCreateHandoffRepo({
        records: [
          {
            schemaVersion: "create_handoff_review_item.v1",
            id: "create-handoff-1",
            source: "create",
            sourceText: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
            plannerResult: {
              source: "heuristic_fallback",
              plannerSource: "heuristic_fallback",
              plannerProvider: "none",
              plannerRole: "planner_only",
              plannerTopic: "Schulsanierung im Bezirk",
              plannerCore: "Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
              plannerScope: ["district"],
              plannerStance: "open",
              plannerClusters: ["Bildung"],
              plannerOpenQuestions: ["Welche Standorte haben Priorität?"],
              shortSummary: "Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
              topicCandidates: ["Schulsanierung"],
              clusterCandidates: ["Bildung"],
              scopeCandidates: ["district"],
              stance: "open",
              openQuestions: ["Welche Standorte haben Priorität?"],
              graphSearchTerms: ["Schulsanierung Reinickendorf"],
              materialSignals: [],
              recommendedLane: "standard",
              providerPlan: {
                lane: "standard",
                plannerProvider: "none",
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
              providerCallAttempted: false,
              providerCallSucceeded: false,
              plannerDebug: {
                attemptedProvider: null,
                usedProvider: "none",
                providerAvailable: false,
                rawPayloadValid: true,
                rawTextValid: true,
                normalizedPayloadValid: true,
                qualityGatePassed: true,
              },
            } as any,
            graphMatches: {
              stage: "after_structure",
              prepared: true,
              requiresConfirmation: true,
              searchTerms: ["Schulsanierung Reinickendorf"],
              matches: [
                {
                  id: "match-dossier-1",
                  kind: "dossier",
                  label: "Schulsanierung Studio",
                  relation: "related",
                  requiresConfirmation: true,
                },
              ],
              matchedTopics: ["Schulsanierung"],
              matchedDossiers: ["dossier-1"],
              matchedClaims: [],
              matchedAnlassraeume: [],
              matchedVotes: [],
              shouldCreateNewTopic: true,
            },
            selectedAction: "create_dossier",
            claims: [
              {
                id: "claim-1",
                text: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
                kind: "factual_claim",
                factcheckEligible: true,
                sourceRefs: ["source-text"],
              },
            ],
            arguments: [],
            openQuestions: [
              {
                id: "question-1",
                question: "Welche Standorte haben Priorität?",
                requiredBeforePublish: true,
              },
            ],
            sourceGrounding: [
              {
                id: "source-text",
                label: "Ausgangstext",
                status: "source_text",
                detail: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
              },
            ],
            topicSeed: {
              topicKey: "schulsanierung-im-bezirk",
              topicLabel: "Schulsanierung im Bezirk",
              jurisdiction: "kommune",
              themenradarSourceType: "create_intake",
            },
            resumeHref: "/create?resume=create_handoff&handoffId=create-handoff-1",
            reviewState: "ready_for_confirmation",
            visibilityState: "internal_review",
            requiresConfirmation: true,
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noAutomaticOfficialResponse: true,
            noAutoFinalization: true,
            intakeClassification: "free_text",
            createdByUserId: "user-1",
            regionId: "bezirk-berlin-reinickendorf",
            organizationId: "org-reinickendorf-1",
            dossierId: "dossier-1",
            anlassraumId: null,
            requestScope: {
              organizationId: "org-reinickendorf-1",
              organizationLabel: "Bezirksamt Reinickendorf",
              membershipStatus: "verified",
              organizationRole: "reviewer",
              roleLabel: "Beteiligung",
              regionIds: ["bezirk-berlin-reinickendorf"],
              primaryRegionId: "bezirk-berlin-reinickendorf",
              isOperatorMode: false,
              operatorModeLabel: null,
              sourceOfTruth: "operator_verified_directory",
              confidence: "high",
            },
            accessDecision: {
              status: "allowed",
              reason: "allowed",
              title: "Produktiver Handoff ist freigeschaltet",
              body: "Membership, Vertrag, Billing-Status und Entitlements erlauben diesen review-first Organisations-Handoff.",
              requiredEntitlementScopes: ["review_queue", "content_release", "dossier_studio"],
              missingEntitlementScopes: [],
              requiredActions: ["create_dossier_draft", "submit_for_review"],
              missingActions: [],
              contractStatus: "active",
              billingStatus: "operator_verified_contract",
              entitlementStatus: "granted",
            },
            createdAt: "2026-05-19T08:00:00.000Z",
            updatedAt: "2026-05-19T08:00:00.000Z",
          },
        ],
      }),
    );
    setFactcheckWorkflowRepoForTests(
      createInMemoryFactcheckWorkflowRepo({
        records: [
          {
            jobId: "factcheck-1",
            sourceType: "factcheck_request",
            sourceId: "contribution-1",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            requestedByUserId: "user-1",
            requestedByRole: "Beteiligung",
            requestedInOperatorMode: false,
            sourceOfTruth: "operator_verified_directory",
            confidence: "high",
            accessContext: {
              scope: "organization",
              productionAccess: "allowed",
              reason: "none",
            },
            requestedAction: "sealed_factcheck",
            language: "de",
            inputText: "Behauptung zur Schulsanierung mit Quellenbezug",
            status: "seal_review_required",
            truthStatus: "review_required",
            sourceSupport: "partial",
            sourceStatus: "Siegelprüfung nach Quellenlage offen",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0,
            claims: [{ id: "claim-1", text: "Die Schulsanierung ist finanziert." }] as any,
            sourceRefs: [
              {
                id: "source-1",
                label: "https://reinickendorf.example/schule",
                url: "https://reinickendorf.example/schule",
                sourceType: "link",
              },
            ],
            materialRefs: [],
            serpResults: [],
            factcheckVerificationMode: "operator_verified",
            factcheckResearchMode: "manual_review",
            factcheckSealEligibility: "eligible",
            factcheckSealDecision: "requested",
            publicSealVisible: false,
            limitations: ["Kein automatisches Siegel und kein Auto-Publish."],
            verificationMode: "precheck",
            researchUsed: "lite",
            sealEligible: true,
            sealGranted: false,
            result: {
              jobId: "factcheck-1",
              claims: [{ id: "claim-1", text: "Die Schulsanierung ist finanziert." }] as any,
              sources: [
                {
                  id: "source-1",
                  label: "https://reinickendorf.example/schule",
                  url: "https://reinickendorf.example/schule",
                  sourceType: "link",
                },
              ],
              sourceSupport: "partial",
              sourceStatus: "Siegelprüfung nach Quellenlage offen",
              truthStatus: "review_required",
              verificationLabel: "analysiert",
              researchUsed: "lite",
              providerMatrix: null,
              disagreement: null,
              confidence: null,
              reviewRecommended: true,
              summary: "Arbeitsstand für eine manuelle Siegelentscheidung. Keine automatische Verifizierung oder Veröffentlichung.",
              openQuestions: ["Welche belastbaren Quellen tragen die Behauptung?"],
              limitations: ["Kein automatisches Siegel und kein Auto-Publish."],
              noTruthPromotion: true,
              noAutoGraphPromotion: true,
            },
            sealedAt: null,
            fallbackUsed: false,
            disagreement: null,
            orchestrationConfidence: null,
            auditEvents: [
              {
                id: "audit-1",
                eventType: "request-seal",
                actorId: "admin-1",
                actorLabel: "admin-1",
                actorMode: "operator",
                note: "Siegelprüfung angefordert",
                createdAt: "2026-05-24T10:00:00.000Z",
              },
            ],
            error: null,
            createdAt: new Date("2026-05-24T09:55:00.000Z"),
            updatedAt: new Date("2026-05-24T10:00:00.000Z"),
            finishedAt: null,
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            jobId: "factcheck-queued",
            sourceType: "factcheck_request",
            sourceId: "contribution-2",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            requestedByUserId: "user-1",
            language: "de",
            requestedAction: "source_check",
            inputText: "Bitte Quellen zur Schulwegsicherheit prüfen.",
            status: "queued",
            truthStatus: "factcheck_requested",
            sourceSupport: "open",
            sourceStatus: "Quellenprüfung angefragt",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0,
            claims: [{ id: "claim-2", text: "Die Schulwegsicherheit ist geklärt." }] as any,
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "intake_only",
            factcheckResearchMode: "provider_assisted",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Kein automatischer DeepSearch-Lauf."],
            auditEvents: [],
            createdAt: new Date("2026-05-24T10:05:00.000Z"),
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            jobId: "factcheck-running",
            sourceType: "factcheck_request",
            sourceId: "contribution-3",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            requestedByUserId: "user-1",
            language: "de",
            requestedAction: "factcheck",
            inputText: "Bitte laufende Quellenprüfung zur Turnhalle nachvollziehen.",
            status: "running",
            truthStatus: "factcheck_requested",
            sourceSupport: "open",
            sourceStatus: "Quellenprüfung läuft",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0,
            claims: [{ id: "claim-3", text: "Die Turnhalle wird im Herbst saniert." }] as any,
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "intake_only",
            factcheckResearchMode: "provider_assisted",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Kein automatischer DeepSearch-Lauf."],
            auditEvents: [],
            createdAt: new Date("2026-05-24T10:10:00.000Z"),
            updatedAt: new Date("2026-05-24T10:12:00.000Z"),
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            jobId: "factcheck-completed",
            sourceType: "factcheck_request",
            sourceId: "contribution-4",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            requestedByUserId: "user-1",
            language: "de",
            requestedAction: "factcheck",
            inputText: "Bitte Ergebnis zur Schulwegsicherheit als Arbeitsstand zeigen.",
            status: "completed",
            truthStatus: "review_required",
            sourceSupport: "partial",
            sourceStatus: "Ergebnis liegt vor",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0.32,
            claims: [{ id: "claim-4", text: "Vor der Schule fehlt ein sicherer Übergang." }] as any,
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "provider_assisted",
            factcheckResearchMode: "provider_assisted",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Kein Auto-Publish."],
            result: {
              jobId: "factcheck-completed",
              claims: [{ id: "claim-4", text: "Vor der Schule fehlt ein sicherer Übergang." }] as any,
              sources: [],
              sourceSupport: "partial",
              sourceStatus: "Ergebnis liegt vor",
              truthStatus: "review_required",
              verificationLabel: "analysiert",
              researchUsed: "search",
              providerMatrix: null,
              disagreement: null,
              confidence: { score: 0.32, bucket: "low", reasons: ["limited_sources"] },
              reviewRecommended: true,
              summary: "Ergebnis liegt als Arbeitsstand vor. Keine automatische Prüfung, Veröffentlichung oder Wahrheitspromotion.",
              openQuestions: ["Welche belastbaren Quellen bestätigen den Übergang?"],
              limitations: ["Kein Auto-Publish."],
              noTruthPromotion: true,
              noAutoGraphPromotion: true,
            },
            auditEvents: [],
            createdAt: new Date("2026-05-24T10:15:00.000Z"),
            updatedAt: new Date("2026-05-24T10:20:00.000Z"),
            completedAt: new Date("2026-05-24T10:20:00.000Z"),
            finishedAt: new Date("2026-05-24T10:20:00.000Z"),
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            jobId: "factcheck-manual",
            sourceType: "factcheck_request",
            sourceId: "contribution-5",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            requestedByUserId: "user-1",
            language: "de",
            requestedAction: "deep_research",
            inputText: "Bitte den Radweg manuell weiter prüfen.",
            status: "needs_manual_review",
            truthStatus: "review_required",
            sourceSupport: "open",
            sourceStatus: "Manuelle Prüfung erforderlich",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0.21,
            claims: [{ id: "claim-5", text: "Der Radweg ist beschlossen." }] as any,
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "manual_review",
            factcheckResearchMode: "deep_research_requested",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Kein automatischer DeepSearch-Lauf."],
            result: {
              jobId: "factcheck-manual",
              claims: [{ id: "claim-5", text: "Der Radweg ist beschlossen." }] as any,
              sources: [],
              sourceSupport: "open",
              sourceStatus: "Manuelle Prüfung erforderlich",
              truthStatus: "review_required",
              verificationLabel: "analysiert",
              researchUsed: "deep_search",
              providerMatrix: null,
              disagreement: null,
              confidence: { score: 0.21, bucket: "low", reasons: ["missing_sources"] },
              reviewRecommended: true,
              summary: "Manuelle Prüfung erforderlich. Der Job bleibt ein Arbeitsstand ohne automatische Folgeaktionen.",
              openQuestions: ["Welche belastbaren Quellen oder Dokumente fehlen noch?"],
              limitations: ["Kein automatischer DeepSearch-Lauf."],
              noTruthPromotion: true,
              noAutoGraphPromotion: true,
            },
            auditEvents: [],
            createdAt: new Date("2026-05-24T10:25:00.000Z"),
            updatedAt: new Date("2026-05-24T10:30:00.000Z"),
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
          {
            jobId: "factcheck-failed",
            sourceType: "factcheck_request",
            sourceId: "contribution-6",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            requestedByUserId: "user-1",
            language: "de",
            requestedAction: "factcheck",
            inputText: "Bitte fehlgeschlagene Prüfung erneut anstoßen.",
            status: "failed",
            truthStatus: "review_required",
            sourceSupport: "open",
            sourceStatus: "Prüfung fehlgeschlagen / erneut prüfen",
            verificationLabel: "analysiert",
            verdict: "UNDETERMINED",
            confidenceScore: 0,
            claims: [{ id: "claim-6", text: "Der Schulhof wird erweitert." }] as any,
            sourceRefs: [],
            materialRefs: [],
            factcheckVerificationMode: "manual_review",
            factcheckResearchMode: "manual_review",
            factcheckSealEligibility: "needs_review",
            factcheckSealDecision: "none",
            publicSealVisible: false,
            limitations: ["Erneuter Lauf nur nach manueller Entscheidung."],
            auditEvents: [],
            createdAt: new Date("2026-05-24T10:35:00.000Z"),
            updatedAt: new Date("2026-05-24T10:36:00.000Z"),
            error: "timeout",
            noAutoPublish: true,
            noAutoGraphPromotion: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoVote: true,
          },
        ],
      }),
    );
    setSocialDistributionRepoForTests(
      createInMemorySocialDistributionRepo({
        posts: [
          {
            id: "social-dist-1",
            organizationId: "org-reinickendorf-1",
            regionId: "bezirk-berlin-reinickendorf",
            dossierId: "dossier-1",
            sourceContextType: "dossier",
            sourceContextId: "dossier-1",
            sourceVisibilityState: "public_reviewed",
            sourceState: "approved_context",
            title: "Schulsanierung Studio",
            status: "review_requested",
            channels: ["website_update", "newsletter_draft"],
            scheduleMode: "manual",
            channelTexts: {
              website_update: "Sachlicher Update-Entwurf für das Dossier.",
              newsletter_draft: "Newsletter-Entwurf mit Review-Hinweis.",
            },
            channelNotes: {},
            assets: [
              {
                id: "asset-1",
                channel: "website_update",
                kind: "channel_text",
                label: "Website-Update",
                href: "/dossier/dossier-1",
                text: "Sachlicher Update-Entwurf für das Dossier.",
                verificationLabel: "analysiert",
                sealGranted: false,
                publicSafe: true,
              },
            ],
            approval: {
              reviewRequired: true,
              approvedByUserId: null,
              approvedAt: null,
              note: null,
            },
            sourceSummary: "Freigegebener Dossier-Kontext mit Review-first Verteilung.",
            limitations: ["Kein Auto-Publish."],
            noAutoPublish: true,
            noAutoPublicationApproved: true,
            noPublicOfficial: true,
            externalPosting: false,
            createdByUserId: "user-1",
            updatedByUserId: "user-1",
            createdAt: "2026-05-19T09:10:00.000Z",
            updatedAt: "2026-05-19T09:10:00.000Z",
          },
        ],
      }),
    );
    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
  });

  it("aggregates the existing review domains for the global operator queue", async () => {
    const readModel = await buildReviewQueueReadModel({
      mode: "global_operator",
      userId: "admin-1",
      isAdmin: true,
      visibleRegionIds: [],
      organizationIds: [],
      canApproveOfficial: true,
      governanceActor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["admin-1"],
        scopedEntityIds: ["admin-1"],
        personTrust: null,
      },
    });

    expect(readModel.summary.total).toBeGreaterThanOrEqual(6);
    expect(readModel.summary.byDomain).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ domain: "anlassraum_public_input" }),
        expect.objectContaining({ domain: "region_intelligence_suggestion" }),
        expect.objectContaining({ domain: "region_source_result" }),
        expect.objectContaining({ domain: "region_signal_draft" }),
        expect.objectContaining({ domain: "dossier_workspace" }),
        expect.objectContaining({ domain: "output_artifact" }),
        expect.objectContaining({ domain: "create_handoff" }),
        expect.objectContaining({ domain: "factcheck_request" }),
        expect.objectContaining({ domain: "public_official_approval" }),
      ]),
    );
    expect(readModel.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "create_handoff",
          title: "Create-Handoff Schulsanierung",
          operationalStatus: "open",
        }),
        expect.objectContaining({
          domain: "anlassraum_public_input",
          anlassraumContext: expect.objectContaining({
            anlassraumIds: ["anlassraum-1"],
            inputKindLabel: "Öffentliche Frage",
            reviewHint: expect.stringContaining("review-first"),
            publicShareHint: expect.stringContaining("Link und QR entstehen erst nach bewusster Sichtbarkeitsentscheidung"),
          }),
        }),
        expect.objectContaining({
          domain: "create_handoff",
          title: "Schulsanierung im Bezirk · Dossier-Entwurf",
          priorityBucket: expect.any(String),
          scopeLabel: expect.stringContaining("Berlin Reinickendorf"),
          createHandoffContext: expect.objectContaining({
            intakeClassification: "free_text",
            reviewState: "ready_for_confirmation",
            provenanceSummary: expect.stringContaining("operator_verified_directory"),
          }),
          v3ReviewContext: expect.objectContaining({
            sourcePack: expect.objectContaining({
              sourcePackId: "create-handoff-source-pack:create-handoff-1",
            }),
            primaryUnifiedItem: expect.objectContaining({
              source: "create_handoff",
              reviewRequired: true,
              publishReadyIsPublished: false,
            }),
            participationCandidates: expect.arrayContaining([
              expect.objectContaining({
                candidateType: "live_question_candidate",
              }),
            ]),
          }),
          contentReleaseWorkbench: expect.objectContaining({
            sourceKind: "create_handoff",
            sourceId: "create-handoff-1",
          }),
        }),
        expect.objectContaining({
          domain: "dossier_workspace",
          title: "Schulsanierung Studio",
          v3ReviewContext: expect.objectContaining({
            dossierWorkspaceSurface: expect.objectContaining({
              dossierId: "dossier-1",
              sections: expect.objectContaining({
                openQuestions: expect.arrayContaining(["Welche Standorte haben Priorität?"]),
                socialOutputDrafts: expect.arrayContaining(["website_update_draft"]),
                voxyBriefingCandidates: expect.arrayContaining([
                  "Schulsanierung Studio · Voxy-Briefing",
                ]),
              }),
            }),
            voxyRenderJob: expect.objectContaining({
              status: "ready_after_review",
            }),
            voxyPublishDraft: expect.objectContaining({
              status: "draft_only",
              publishReadyIsPublished: false,
            }),
          }),
        }),
        expect.objectContaining({
          id: "output_artifact:social_distribution:social-dist-1",
          v3ReviewContext: expect.objectContaining({
            sourcePack: expect.objectContaining({
              sourcePackId: "social-post-source-pack:social-dist-1",
            }),
            languageBridge: expect.objectContaining({
              original: expect.objectContaining({
                language: "de",
              }),
            }),
            socialOutputDrafts: expect.arrayContaining([
              expect.objectContaining({ kind: "website_update_draft" }),
              expect.objectContaining({ kind: "newsletter_draft" }),
            ]),
          }),
        }),
        expect.objectContaining({
          domain: "public_official_approval",
          reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
        }),
        expect.objectContaining({
          domain: "factcheck_request",
          workflowLabel: "Siegelentscheidung prüfen",
          factcheckContext: expect.objectContaining({
            researchMode: "manual_review",
            sealDecision: "requested",
            requestedAction: "sealed_factcheck",
            sourceRefCount: 1,
            scopeSummary: expect.stringContaining("org-reinickendorf-1"),
          }),
        }),
        expect.objectContaining({
          id: "factcheck_request:factcheck-queued",
          workflowLabel: "Quellenprüfung angefragt",
          summary: expect.stringContaining("Quellenprüfung angefragt"),
        }),
        expect.objectContaining({
          id: "factcheck_request:factcheck-running",
          workflowLabel: "Quellenprüfung läuft",
          summary: expect.stringContaining("Quellenprüfung läuft"),
        }),
        expect.objectContaining({
          id: "factcheck_request:factcheck-completed",
          workflowLabel: "Ergebnis liegt vor",
          summary: expect.stringContaining("Ergebnis liegt vor"),
        }),
        expect.objectContaining({
          id: "factcheck_request:factcheck-manual",
          workflowLabel: "Manuelle Prüfung erforderlich",
          summary: expect.stringContaining("Manuelle Prüfung erforderlich"),
        }),
        expect.objectContaining({
          id: "factcheck_request:factcheck-failed",
          workflowLabel: "Prüfung fehlgeschlagen / erneut prüfen",
          summary: expect.stringContaining("Prüfung fehlgeschlagen / erneut prüfen"),
        }),
        expect.objectContaining({
          domain: "region_intelligence_suggestion",
          visibilityState: "internal_review",
        }),
        expect.objectContaining({
          domain: "region_source_result",
          title: "Bezirksamt Reinickendorf News · Dry Run",
          summary: expect.stringContaining("1 mögliche Aussagen"),
          operationalStatusLabel: "Offen",
          noteCount: 0,
          sourceSnapshotTemplate: expect.objectContaining({
            label: "Beispiel-Snapshot",
            seedKindLabel: "Beispiel-Seed",
            isExampleSeed: true,
          }),
          contentReleaseWorkbench: expect.objectContaining({
            intro: expect.stringContaining("veröffentlichbare Inhalte"),
            targets: expect.arrayContaining([
              expect.objectContaining({
                targetType: "dossier",
                prepared: false,
                statusLabel: "Arbeitsstand",
              }),
              expect.objectContaining({
                targetType: "anlassraum",
                prepared: false,
                statusLabel: "Arbeitsstand",
              }),
              expect.objectContaining({
                targetType: "topic_page",
                prepared: false,
                statusLabel: "Arbeitsstand",
              }),
            ]),
          }),
        }),
      ]),
    );
    expect(readModel.filters.options.statuses).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: "open", label: "Offen" })]),
    );
  });

  it("keeps factcheck and distribution seeds in conservative working-state semantics", async () => {
    const factcheckJobs = await getFactcheckWorkflowRepo().list();
    const socialPosts = await getSocialDistributionRepo().listAllPosts();

    expect(factcheckJobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          jobId: "factcheck-1",
          requestedAction: "sealed_factcheck",
          truthStatus: "review_required",
          sourceSupport: "partial",
          sourceStatus: "Siegelprüfung nach Quellenlage offen",
          verificationLabel: "analysiert",
          result: expect.objectContaining({
            reviewRecommended: true,
            noTruthPromotion: true,
            noAutoGraphPromotion: true,
            summary: expect.stringContaining("Arbeitsstand"),
          }),
          noAutoPublish: true,
          noAutoGraphPromotion: true,
          noAutoDossier: true,
          noAutoAnlassraum: true,
          noAutoVote: true,
        }),
        expect.objectContaining({
          jobId: "factcheck-completed",
          truthStatus: "review_required",
          sourceSupport: "partial",
          sourceStatus: "Ergebnis liegt vor",
          verificationLabel: "analysiert",
          result: expect.objectContaining({
            reviewRecommended: true,
            noTruthPromotion: true,
            noAutoGraphPromotion: true,
            summary: expect.stringContaining("Keine automatische Prüfung"),
          }),
          noAutoPublish: true,
          noAutoGraphPromotion: true,
          noAutoDossier: true,
          noAutoAnlassraum: true,
          noAutoVote: true,
        }),
      ]),
    );
    expect(socialPosts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "social-dist-1",
          status: "review_requested",
          sourceState: "approved_context",
          noAutoPublish: true,
          noAutoPublicationApproved: true,
          noPublicOfficial: true,
          externalPosting: false,
          assets: expect.arrayContaining([
            expect.objectContaining({
              verificationLabel: "analysiert",
              sealGranted: false,
              publicSafe: true,
            }),
          ]),
          limitations: expect.arrayContaining(["Kein Auto-Publish."]),
        }),
      ]),
    );
  });

  it("filters the queue to visible organization scope and keeps only scoped persisted create handoffs", async () => {
    const readModel = await buildReviewQueueReadModel({
      mode: "organization",
      userId: "user-1",
      isAdmin: false,
      visibleRegionIds: ["bezirk-berlin-reinickendorf"],
      organizationIds: ["org-reinickendorf-1"],
      canApproveOfficial: false,
    });

    expect(
      readModel.items.some(
        (item) =>
          item.domain === "create_handoff" &&
          item.title === "Schulsanierung im Bezirk · Dossier-Entwurf",
      ),
    ).toBe(true);
    expect(
      readModel.items.some(
        (item) =>
          item.domain === "factcheck_request" &&
          item.factcheckContext?.scopeSummary.includes("org-reinickendorf-1"),
      ),
    ).toBe(true);
    expect(
      readModel.items.some(
        (item) => item.domain === "create_handoff" && item.title === "Create-Handoff Schulsanierung",
      ),
    ).toBe(false);
    expect(readModel.items.some((item) => item.domain === "public_official_approval")).toBe(false);
    expect(readModel.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "anlassraum_public_input",
          regionName: "Berlin Reinickendorf",
          anlassraumContext: expect.objectContaining({
            anlassraumIds: ["anlassraum-1"],
          }),
        }),
        expect.objectContaining({
          domain: "output_artifact",
          title: "Schulsanierung Studio · Distribution",
          socialDistributionContext: expect.objectContaining({
            channels: ["website_update", "newsletter_draft"],
            sourceState: "approved_context",
          }),
        }),
      ]),
    );
  });

  it("supports operational filters and assignment metadata without a second queue", async () => {
    setReviewQueueOperationRepoForTests(
      createInMemoryReviewQueueOperationRepo({
        records: [
          {
            itemId: "region_source_result:source-result-1",
            operationalStatus: "blocked",
            assignedToUserId: "admin-2",
            assignedByUserId: "admin-1",
            assignedAt: "2026-05-19T10:00:00.000Z",
            noteCount: 1,
            latestNote: "Regionenzuordnung vor Sichtbarkeit klären.",
            latestNoteAt: "2026-05-19T10:05:00.000Z",
            latestAction: "block",
            latestActionAt: "2026-05-19T10:05:00.000Z",
            latestActionByUserId: "admin-1",
            createdAt: "2026-05-19T10:00:00.000Z",
            updatedAt: "2026-05-19T10:05:00.000Z",
          },
        ],
        auditEvents: [
          {
            id: "review-queue-audit-1",
            itemId: "region_source_result:source-result-1",
            action: "block",
            byUserId: "admin-1",
            at: "2026-05-19T10:05:00.000Z",
            note: "Regionenzuordnung vor Sichtbarkeit klären.",
            previousOperationalStatus: "open",
            nextOperationalStatus: "blocked",
            previousAssignedToUserId: null,
            nextAssignedToUserId: "admin-2",
          },
        ],
      }),
    );

    const readModel = await buildReviewQueueReadModel(
      {
        mode: "global_operator",
        userId: "admin-1",
        isAdmin: true,
        visibleRegionIds: [],
        organizationIds: [],
        canApproveOfficial: true,
        governanceActor: {
          userId: "admin-1",
          role: "admin",
          isAdmin: true,
          scopedOwnerIds: ["admin-1"],
          scopedEntityIds: ["admin-1"],
          personTrust: null,
        },
      },
      {
        operationalStatus: "blocked",
        assignedToUserId: "admin-2",
        sort: "priority",
      },
    );

    expect(readModel.summary.total).toBe(1);
    expect(readModel.summary.blockedCount).toBe(1);
    expect(readModel.operationsPersistence).toMatchObject({
      mode: "in_memory_fallback",
      productionTruth: false,
    });
    expect(readModel.contentReleasePersistence).toMatchObject({
      mode: "in_memory_fallback",
      productionTruth: false,
    });
    expect(readModel.items[0]).toMatchObject({
      id: "region_source_result:source-result-1",
      operationalStatus: "blocked",
      assignedToUserId: "admin-2",
      noteCount: 1,
      latestNote: {
        text: "Regionenzuordnung vor Sichtbarkeit klären.",
      },
      priorityBucket: "high",
    });
    expect(readModel.items[0]?.activityTrail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "block",
          actionLabel: "Blockiert",
          note: "Regionenzuordnung vor Sichtbarkeit klären.",
          nextOperationalStatus: "blocked",
          nextAssignedToUserId: "admin-2",
        }),
      ]),
    );
    expect(readModel.items[0]?.unifiedAuditTrail).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "review_operation_applied",
          detail: "Blockiert",
        }),
      ]),
    );
  });

  it("changes operational status without ever turning review items into public_official", async () => {
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "request_changes",
      requestedByUserId: "admin-1",
      note: "Bitte offene Fragen vor Sichtbarkeit klären.",
    });

    let readModel = await buildReviewQueueReadModel({
      mode: "global_operator",
      userId: "admin-1",
      isAdmin: true,
      visibleRegionIds: [],
      organizationIds: [],
      canApproveOfficial: true,
      governanceActor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["admin-1"],
        scopedEntityIds: ["admin-1"],
        personTrust: null,
      },
    });

    expect(
      readModel.items.find((item) => item.id === "region_source_result:source-result-1"),
    ).toMatchObject({
      operationalStatus: "request_changes",
      visibilityState: "internal_review",
    });

    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "block",
      requestedByUserId: "admin-1",
      note: "Blockiert bis Zuständigkeit geklärt ist.",
    });

    readModel = await buildReviewQueueReadModel({
      mode: "global_operator",
      userId: "admin-1",
      isAdmin: true,
      visibleRegionIds: [],
      organizationIds: [],
      canApproveOfficial: true,
      governanceActor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["admin-1"],
        scopedEntityIds: ["admin-1"],
        personTrust: null,
      },
    });

    expect(
      readModel.items.find((item) => item.id === "region_source_result:source-result-1"),
    ).toMatchObject({
      operationalStatus: "blocked",
      visibilityState: "internal_review",
    });

    setReviewQueueOperationRepoForTests(createInMemoryReviewQueueOperationRepo());
    await applyReviewQueueOperation({
      itemId: "region_source_result:source-result-1",
      action: "archive",
      requestedByUserId: "admin-1",
    });

    readModel = await buildReviewQueueReadModel({
      mode: "global_operator",
      userId: "admin-1",
      isAdmin: true,
      visibleRegionIds: [],
      organizationIds: [],
      canApproveOfficial: true,
      governanceActor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["admin-1"],
        scopedEntityIds: ["admin-1"],
        personTrust: null,
      },
    });

    expect(
      readModel.items.find((item) => item.id === "region_source_result:source-result-1"),
    ).toMatchObject({
      operationalStatus: "archived",
      visibilityState: "internal_review",
    });
  });
});

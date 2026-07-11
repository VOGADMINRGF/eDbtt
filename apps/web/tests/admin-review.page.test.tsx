import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
  userIsAdminDashboard: vi.fn(),
  buildReviewQueueReadModel: vi.fn(),
  listEditorialReviewRequests: vi.fn(),
  factcheckList: vi.fn(),
  loadAdminGraphMergeSectionProps: vi.fn(),
  loadAdminCommunitySourceReviewSectionProps: vi.fn(),
  loadAdminTopicGraphApprovalSectionProps: vi.fn(),
  loadAdminDossierRuntimeCreationSectionProps: vi.fn(),
  loadAdminDossierPublishSectionProps: vi.fn(),
  loadAdminAnlassraumRuntimeCreationSectionProps: vi.fn(),
  loadAdminAnlassraumActivationSectionProps: vi.fn(),
  loadAdminParticipationSpaceRuntimeCreationSectionProps: vi.fn(),
  loadAdminParticipationSpacePublishSectionProps: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  userIsAdminDashboard: (...args: unknown[]) => mocks.userIsAdminDashboard(...args),
}));

vi.mock("@features/reviewQueue", () => ({
  buildReviewQueueReadModel: (...args: unknown[]) => mocks.buildReviewQueueReadModel(...args),
}));

vi.mock("@features/editorialReviewQueue", () => ({
  listEditorialReviewRequests: (...args: unknown[]) => mocks.listEditorialReviewRequests(...args),
  matchesEditorialReviewFilter: (request: any, filter: string) => {
    if (filter === "all") return true;
    if (filter === "source_open") return request.reason === "source_open";
    return true;
  },
  getEditorialReviewFilterLabel: (value: string) => value,
  getEditorialReviewNextStepLabel: (input: { sourceType: string; status: string }) =>
    `${input.sourceType}:${input.status}`,
  getEditorialReviewReasonLabel: (value: string) => value,
  getEditorialReviewSourceTypeLabel: (value: string) => value,
  getEditorialReviewStatusLabel: (value: string) => value,
}));

vi.mock("@/app/admin/review/loadAdminGraphMergeSectionProps", () => ({
  loadAdminGraphMergeSectionProps: (...args: unknown[]) =>
    mocks.loadAdminGraphMergeSectionProps(...args),
}));

vi.mock("@/app/admin/review/loadAdminCommunitySourceReviewSectionProps", () => ({
  loadAdminCommunitySourceReviewSectionProps: (...args: unknown[]) =>
    mocks.loadAdminCommunitySourceReviewSectionProps(...args),
}));

vi.mock("@/app/admin/review/loadAdminTopicGraphApprovalSectionProps", () => ({
  loadAdminTopicGraphApprovalSectionProps: (...args: unknown[]) =>
    mocks.loadAdminTopicGraphApprovalSectionProps(...args),
}));

vi.mock("@/app/admin/review/loadAdminDossierRuntimeCreationSectionProps", () => ({
  loadAdminDossierRuntimeCreationSectionProps: (...args: unknown[]) =>
    mocks.loadAdminDossierRuntimeCreationSectionProps(...args),
}));

vi.mock("@/app/admin/review/loadAdminDossierPublishSectionProps", () => ({
  loadAdminDossierPublishSectionProps: (...args: unknown[]) =>
    mocks.loadAdminDossierPublishSectionProps(...args),
}));

vi.mock("@/app/admin/review/loadAdminAnlassraumRuntimeCreationSectionProps", () => ({
  loadAdminAnlassraumRuntimeCreationSectionProps: (...args: unknown[]) =>
    mocks.loadAdminAnlassraumRuntimeCreationSectionProps(...args),
}));

vi.mock("@/app/admin/review/loadAdminAnlassraumActivationSectionProps", () => ({
  loadAdminAnlassraumActivationSectionProps: (...args: unknown[]) =>
    mocks.loadAdminAnlassraumActivationSectionProps(...args),
}));

vi.mock(
  "@/app/admin/review/loadAdminParticipationSpaceRuntimeCreationSectionProps",
  () => ({
    loadAdminParticipationSpaceRuntimeCreationSectionProps: (
      ...args: unknown[]
    ) => mocks.loadAdminParticipationSpaceRuntimeCreationSectionProps(...args),
  }),
);

vi.mock(
  "@/app/admin/review/loadAdminParticipationSpacePublishSectionProps",
  () => ({
    loadAdminParticipationSpacePublishSectionProps: (...args: unknown[]) =>
      mocks.loadAdminParticipationSpacePublishSectionProps(...args),
  }),
);

vi.mock("@features/factcheck/db", () => ({
  getFactcheckWorkflowRepo: () => ({
    list: (...args: unknown[]) => mocks.factcheckList(...args),
  }),
}));

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

import AdminReviewPage from "@/app/admin/review/page";

describe("/admin/review page", () => {
  it("renders the central review queue with clear guardrails", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      roles: ["admin"],
      sessionValid: true,
    });
    mocks.userIsAdminDashboard.mockReturnValue(true);
    mocks.factcheckList.mockResolvedValue([]);
    mocks.loadAdminGraphMergeSectionProps.mockResolvedValue({
      graphAuditMap: new Map(),
      graphCandidatePersistence: {
        mode: "persistent_primary",
        label: "Persistenter Graph-Candidate-Store",
        summary:
          "Graph-Kandidaten, Merge-Gates und auditierte Bestätigungen liegen dauerhaft vor.",
        repositoryInterface: "GraphMergeCandidatesRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      graphMergeCandidates: [],
    });
    mocks.loadAdminCommunitySourceReviewSectionProps.mockResolvedValue({
      communitySourceReviewRecords: [],
      communitySourceReviewAuditMap: new Map(),
      communitySourceReviewPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Community-Source-Review-Store",
        summary:
          "Community-Hinweise, Moderationsentscheidungen und Audit-Spuren liegen dauerhaft für die bestehende Admin-Review-Workbench vor.",
        repositoryInterface: "CommunitySourceReviewRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      submissionRuntimeStatus: "public_api_hardened",
    });
    mocks.loadAdminTopicGraphApprovalSectionProps.mockResolvedValue({
      graphRuntimeAvailable: true,
      topicGraphAuditMap: new Map(),
      topicGraphEdges: [],
      topicGraphPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Topic-Graph-Mutation-Store",
        summary:
          "Review-bestätigte Topic-Graph-Entwürfe und Audit-Spuren liegen dauerhaft vor.",
        repositoryInterface: "TopicGraphRuntimeRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
    });
    mocks.loadAdminDossierRuntimeCreationSectionProps.mockResolvedValue({
      dossierRuntimeRecords: [],
      dossierRuntimeAuditMap: new Map(),
      dossierRuntimePersistence: {
        mode: "persistent_primary",
        label: "Persistente Dossier-Runtime-Creation",
        summary:
          "Review-bestätigte Dossier-Creation-Drafts und Audit-Spuren liegen dauerhaft vor.",
        repositoryInterface: "DossierRuntimeRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
    });
    mocks.loadAdminDossierPublishSectionProps.mockResolvedValue({
      dossierPublicationRecords: [],
      dossierPublicationAuditMap: new Map(),
      dossierPublicationPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Dossier-Publish-Workflow",
        summary:
          "Separater Veröffentlichungsworkflow, Audit-Spuren und Public-Readmodel-Status liegen dauerhaft vor.",
        repositoryInterface: "DossierPublicationWorkflowRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
        publicRouteRuntime: "runtime_wired",
      },
    });
    mocks.loadAdminAnlassraumRuntimeCreationSectionProps.mockResolvedValue({
      anlassraumRuntimeRecords: [],
      anlassraumRuntimeAuditMap: new Map(),
      anlassraumRuntimePersistence: {
        mode: "persistent_primary",
        label: "Persistente Anlassraum-Runtime-Creation",
        summary:
          "Review-bestätigte Anlassraum-Creation-Drafts und Audit-Spuren liegen dauerhaft vor.",
        repositoryInterface: "AnlassraumRuntimeRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
    });
    mocks.loadAdminAnlassraumActivationSectionProps.mockResolvedValue({
      anlassraumActivationRecords: [],
      anlassraumActivationAuditMap: new Map(),
      anlassraumActivationPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Anlassraum-Aktivierungs-/Publish-Workflow",
        summary:
          "Aktivierungs- und Veröffentlichungsfreigaben liegen dauerhaft vor. Öffentliche Sichtbarkeit entsteht nur nach expliziter Freigabe, Audit und Guardrail-Prüfung; die öffentliche /runden-Lesart liest veröffentlichte Runtime-Anlassräume read-only.",
        repositoryInterface: "AnlassraumActivationWorkflowRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
        publicRouteRuntime: "runtime_wired",
      },
    });
    mocks.loadAdminParticipationSpaceRuntimeCreationSectionProps.mockResolvedValue({
      participationSpaceRuntimeRecords: [],
      participationSpaceRuntimeAuditMap: new Map(),
      participationSpaceRuntimePersistence: {
        mode: "persistent_primary",
        label: "Persistente Beteiligungsraum-Runtime-Creation",
        summary:
          "Review-bestätigte Beteiligungsraum-Creation-Drafts und Audit-Spuren liegen dauerhaft vor.",
        repositoryInterface: "ParticipationSpaceRuntimeRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
    });
    mocks.loadAdminParticipationSpacePublishSectionProps.mockResolvedValue({
      participationSpacePublishRecords: [],
      participationSpacePublishAuditMap: new Map(),
      participationSpacePublishPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Beteiligungsraum-Publish-/Activation-Workflow",
        summary:
          "Aktivierungs- und Veröffentlichungsfreigaben liegen dauerhaft vor. Öffentliche Sichtbarkeit entsteht nur nach expliziter Freigabe, Audit und Blocker-Prüfung; die öffentliche /beteiligung-Route liest veröffentlichte Runtime-Räume read-only und nutzt Fixtures nur noch als klar gekennzeichneten Fallback ohne Runtime-Mutation.",
        repositoryInterface: "ParticipationSpacePublishWorkflowRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
        publicRouteRuntime: "runtime_wired",
      },
    });
    mocks.listEditorialReviewRequests.mockResolvedValue([]);
    mocks.buildReviewQueueReadModel.mockResolvedValue({
      items: [
        {
          id: "public_official_approval:signal:1",
          domain: "public_official_approval",
          domainLabel: "Amtliche Freigabe",
          workflowState: "official_approval_required",
          workflowLabel: "Amtliche Freigabe prüfen",
          title: "Sanierungsbedarf an Schulen ist bestätigt",
          summary: "Expliziter menschlicher Freigabeschritt.",
          href: "/admin/region?regionId=bezirk-berlin-reinickendorf",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: null,
          dossierId: null,
          draftId: null,
          sourceType: "public_claim",
          visibilityState: "public_reviewed",
          visibilityLabel: "geprüft",
          scopeLabel: "Berlin Reinickendorf",
          priorityScore: 98,
          priorityBucket: "high",
          priorityLabel: "Hohe Priorität",
          pendingHours: 4,
          operationalStatus: "ready",
          operationalStatusLabel: "Bereit",
          assignedToUserId: "admin-1",
          assignedAt: "2026-05-19T09:30:00.000Z",
          assignedByUserId: "admin-1",
          noteCount: 1,
          latestNote: {
            text: "Freigabe nur nach expliziter Sichtprüfung.",
            at: "2026-05-19T09:35:00.000Z",
          },
          activityTrail: [
            {
              id: "activity-1",
              action: "mark_ready",
              actionLabel: "Als bereit markiert",
              byUserId: "admin-1",
              at: "2026-05-19T09:35:00.000Z",
              note: "Freigabe nur nach expliziter Sichtprüfung.",
              previousOperationalStatus: "in_review",
              previousOperationalStatusLabel: "In Review",
              nextOperationalStatus: "ready",
              nextOperationalStatusLabel: "Bereit",
              previousAssignedToUserId: "admin-1",
              nextAssignedToUserId: "admin-1",
            },
          ],
          unifiedAuditTrail: [
            {
              id: "unified-1",
              source: "official_release",
              type: "official_release_granted",
              itemId: "public_official_approval:signal:1",
              at: "2026-05-19T09:35:00.000Z",
              title: "Official Release erteilt",
              detail: "Sanierungsbedarf an Schulen ist bestätigt",
              note: "Freigabe nur nach expliziter Sichtprüfung.",
              actor: {
                userId: "admin-1",
                label: "admin-1 · district_office",
                authority: "district_office",
              },
              scope: {
                mode: "region",
                organizationId: null,
                regionId: "bezirk-berlin-reinickendorf",
                ownerUserId: null,
                operatorModeLabel: null,
                status: null,
                isGlobal: false,
              },
              regionId: "bezirk-berlin-reinickendorf",
              organizationId: null,
              ownerUserId: null,
              sourceRecordId: "signal-1",
              targetId: "signal-1",
              targetType: "participation_signal",
            },
          ],
          createdAt: "2026-05-17T09:00:00.000Z",
          updatedAt: "2026-05-17T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: true,
          reviewAuthority: "publication_approved_or_admin",
          reviewAuthorityLabel: "Nur Publikationsfreigabe oder Admin-Fallback",
          sourceSnapshotTemplate: null,
          contentReleaseWorkbench: null,
        },
        {
          id: "region_source_result:source-result-1",
          domain: "region_source_result",
          domainLabel: "Quellen-Testresultat",
          workflowState: "review_required",
          workflowLabel: "Review erforderlich",
          title: "Bezirksamt Reinickendorf News · Dry Run",
          summary: "1 mögliche Aussagen · 1 Themencluster. Explizite URL vorbereitet.",
          href: "/admin/region?regionId=bezirk-berlin-reinickendorf#source-results",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: null,
          dossierId: null,
          draftId: "source-1",
          sourceType: "municipal_news",
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          scopeLabel: "Berlin Reinickendorf",
          priorityScore: 81,
          priorityBucket: "medium",
          priorityLabel: "Mittlere Priorität",
          pendingHours: 12,
          operationalStatus: "in_review",
          operationalStatusLabel: "In Review",
          assignedToUserId: null,
          assignedAt: null,
          assignedByUserId: null,
          noteCount: 0,
          latestNote: null,
          activityTrail: [],
          unifiedAuditTrail: [],
          createdAt: "2026-05-18T09:00:00.000Z",
          updatedAt: "2026-05-18T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: false,
          reviewAuthority: "standard_review",
          reviewAuthorityLabel: "Reviewpflichtig",
          sourceSnapshotTemplate: {
            label: "Beispiel-Snapshot",
            seedKindLabel: "Beispiel-Seed",
            isExampleSeed: true,
            reviewHint:
              "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
          },
          contentReleaseWorkbench: {
            intro:
              "eDebatte bereitet aus deinem Link veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
            sourceKind: "region_source_result",
            sourceId: "source-result-1",
            targets: [
              {
                targetType: "dossier",
                targetLabel: "Dossier-Entwurf",
                suggestedTitle: "Berlin Reinickendorf: Schule",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                shareHref: null,
                qrHref: null,
                publicLink: null,
                publishStatus: "draft",
                publishStatusLabel: "Arbeitsstand",
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                statusHint: "Noch nicht übernommen.",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canRevokeVisibility: false,
                canArchive: false,
                canCreateQrLink: false,
                auditEvents: [],
              },
              {
                targetType: "anlassraum",
                targetLabel: "Anlassraum",
                suggestedTitle: "Schule Berlin Reinickendorf",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                shareHref: null,
                qrHref: null,
                publicLink: null,
                publishStatus: "draft",
                publishStatusLabel: "Arbeitsstand",
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                statusHint: "Noch nicht übernommen.",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canRevokeVisibility: false,
                canArchive: false,
                canCreateQrLink: false,
                auditEvents: [],
              },
              {
                targetType: "topic_page",
                targetLabel: "Öffentliche Themenseite",
                suggestedTitle: "Schule Reinickendorf",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                shareHref: null,
                qrHref: null,
                publicLink: null,
                publishStatus: "draft",
                publishStatusLabel: "Arbeitsstand",
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                statusHint: "Noch nicht übernommen.",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canRevokeVisibility: false,
                canArchive: false,
                canCreateQrLink: false,
                auditEvents: [],
              },
            ],
          },
          v3ReviewContext: {
            primaryUnifiedItem: {
              id: "create-handoff-1",
              source: "create_handoff",
              sourceId: "create-handoff-1",
              title: "Schulsanierung im Bezirk · Dossier-Entwurf",
              summary: "Review-first Handoff",
              queueState: "review_ready",
              requiredReviewType: "editorial_review",
              requiredReviewerRoles: ["editor", "editorial_actor", "admin"],
              lifecycleStatus: "review_ready",
              preparationStatus: "review_ready",
              reviewReadyIsApproved: false,
              publishReadyIsPublished: false,
              reviewRequired: true,
              autoPublish: false,
              publishGuard: {
                autoPublish: false,
                reviewRequired: true,
                publicOutputAllowed: false,
                publishActionEnabled: false,
                externalSocialApiTriggered: false,
              },
              sourcePackId: "source-pack-1",
              sourcePackEvidenceState: "partial",
              trustState: "partially_supported",
              languageSummary: {
                originalLanguage: "de",
                readingLanguage: "de",
              },
              nextAllowedActions: ["review"],
              reviewWorld: "existing_review_queue",
            },
            unifiedItems: [],
            sourcePack: {
              sourcePackId: "source-pack-1",
              sources: [
                {
                  sourceId: "source-1",
                  title: "Ausgangstext",
                  sourceLocale: "de",
                  sourceType: "user_supplied",
                  reliabilityHint: "secondary",
                  translationStatus: "not_needed",
                  evidenceState: "partial",
                  reviewState: "review_required",
                },
              ],
              openGaps: [],
              reviewState: "review_required",
              reviewRequired: true,
              autoPublish: false,
            },
            languageBridge: {
              languageContext: {
                sourceLanguage: "de",
                contentLanguage: "de",
                uiLocale: "de",
              },
              original: {
                language: "de",
                text: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
                preserved: true,
              },
              translation: {
                language: "de",
                text: null,
                state: "not_needed",
                replacesOriginal: false,
                rtl: false,
              },
              summary: {
                language: "de",
                text: "Schulsanierung im Bezirk",
                replacesOriginal: false,
                replacesSource: false,
              },
              voxyClassification: {
                language: "de",
                text: null,
                reviewRequired: true,
              },
              sourceGrounding: {
                trustState: "partially_supported",
                sourcePresent: true,
                summaryReplacesSource: false,
              },
              openQuestions: ["Welche Standorte haben Priorität?"],
              uncertaintyNotes: [],
              reviewRequired: true,
              autoPublish: false,
            },
            multilingualThread: null,
            multilingualEvidence: {
              sourcePackId: "source-pack-1",
              entries: [],
              overallTrustStatus: "partially_supported",
              overallUncertaintyReasons: [],
              reviewRequired: true,
              autoPublish: false,
            },
            participationCandidates: [],
            crossLingualSuggestions: [],
            socialOutputDrafts: [],
            dossierWorkspaceSurface: null,
            voxyBriefing: null,
            voxyScriptSegments: [],
            voxyReviewState: null,
            voxyRenderJob: null,
            voxyPublishDraft: null,
          },
        },
        {
          id: "create_handoff:persisted:create-handoff-1",
          domain: "create_handoff",
          domainLabel: "Create-Handoff",
          workflowState: "review_required",
          workflowLabel: "Review erforderlich",
          title: "Schulsanierung im Bezirk · Dossier-Entwurf",
          summary: "1 Aussagen · 1 offene Fragen · 1 Faktencheck-Kandidaten. Persistenter Create-Handoff.",
          href: "/create?resume=create_handoff&handoffId=create-handoff-1",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: "org-reinickendorf-1",
          dossierId: "dossier-1",
          draftId: "create-handoff-1",
          sourceType: "create_dossier",
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          scopeLabel: "Berlin Reinickendorf · Organisation",
          priorityScore: 77,
          priorityBucket: "medium",
          priorityLabel: "Mittlere Priorität",
          pendingHours: 2,
          operationalStatus: "open",
          operationalStatusLabel: "Offen",
          assignedToUserId: null,
          assignedAt: null,
          assignedByUserId: null,
          noteCount: 0,
          latestNote: null,
          activityTrail: [],
          unifiedAuditTrail: [],
          createdAt: "2026-05-19T09:00:00.000Z",
          updatedAt: "2026-05-19T09:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: false,
          reviewAuthority: "standard_review",
          reviewAuthorityLabel: "Reviewpflichtig",
          sourceSnapshotTemplate: null,
          contentReleaseWorkbench: {
            intro:
              "eDebatte bereitet aus deinem Arbeitsstand veröffentlichbare Inhalte vor. Du entscheidest, was als Dossier, Anlassraum oder öffentliche Themenseite sichtbar wird.",
            sourceKind: "create_handoff",
            sourceId: "create-handoff-1",
            targets: [
              {
                targetType: "dossier",
                targetLabel: "Dossier-Entwurf",
                suggestedTitle: "Schulsanierung im Bezirk",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                shareHref: null,
                qrHref: null,
                publicLink: null,
                publishStatus: "draft",
                publishStatusLabel: "Arbeitsstand",
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                statusHint: "Noch nicht übernommen.",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canRevokeVisibility: false,
                canArchive: false,
                canCreateQrLink: false,
                auditEvents: [],
              },
              {
                targetType: "anlassraum",
                targetLabel: "Anlassraum",
                suggestedTitle: "Schulsanierung im Bezirk",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                shareHref: null,
                qrHref: null,
                publicLink: null,
                publishStatus: "draft",
                publishStatusLabel: "Arbeitsstand",
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                statusHint: "Noch nicht übernommen.",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canRevokeVisibility: false,
                canArchive: false,
                canCreateQrLink: false,
                auditEvents: [],
              },
              {
                targetType: "topic_page",
                targetLabel: "Öffentliche Themenseite",
                suggestedTitle: "Schulsanierung im Bezirk",
                targetId: null,
                prepared: false,
                previewHref: null,
                publicHref: null,
                shareHref: null,
                qrHref: null,
                publicLink: null,
                publishStatus: "draft",
                publishStatusLabel: "Arbeitsstand",
                visibilityState: "internal_review",
                visibilityLabel: "reviewpflichtig",
                statusLabel: "Arbeitsstand",
                statusHint: "Noch nicht übernommen.",
                canPrepare: true,
                canMakeVisible: false,
                canPreparePublication: false,
                canRevokeVisibility: false,
                canArchive: false,
                canCreateQrLink: false,
                auditEvents: [],
              },
            ],
          },
        },
        {
          id: "create_handoff:persisted:create-handoff-2",
          domain: "create_handoff",
          domainLabel: "Create-Handoff",
          workflowState: "review_required",
          workflowLabel: "Review erforderlich",
          title: "Sichere Schulwege · Dossier-Aufbau",
          summary: "Persistierter Handoff mit Account-Resume-Bezug.",
          href: "/create?resume=create-handoff-2",
          regionId: "bezirk-berlin-reinickendorf",
          regionName: "Berlin Reinickendorf",
          organizationId: null,
          dossierId: "dossier-2",
          draftId: "create-handoff-2",
          sourceType: "create_dossier",
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          scopeLabel: "Berlin Reinickendorf",
          priorityScore: 70,
          priorityBucket: "medium",
          priorityLabel: "Mittlere Priorität",
          pendingHours: 5,
          operationalStatus: "ready",
          operationalStatusLabel: "Bereit",
          assignedToUserId: null,
          assignedAt: null,
          assignedByUserId: null,
          noteCount: 0,
          latestNote: null,
          activityTrail: [],
          unifiedAuditTrail: [],
          createdAt: "2026-05-19T10:00:00.000Z",
          updatedAt: "2026-05-19T10:00:00.000Z",
          reviewRequired: true,
          publicOfficialCandidate: false,
          reviewAuthority: "standard_review",
          reviewAuthorityLabel: "Reviewpflichtig",
          sourceSnapshotTemplate: null,
          contentReleaseWorkbench: null,
          createHandoffContext: {
            intakeClassification: "proposal",
            reviewState: "ready_for_confirmation",
            scopeSummary: "ohne Organisationslabel · Region bezirk-berlin-reinickendorf",
            sourceReferences: [],
            provenanceSummary: "existing_scope_source · review_only",
            correlationStrength: "missing",
            correlationBasis: "none",
            correlationLabel: "Rückverknüpfung zum ursprünglichen Beitrag noch offen",
            correlationReason:
              "Der persisted Handoff ist vorhanden, aber im aktuellen Bestand fehlt die harte Rück-ID zum ursprünglichen Draft-/Ledger-Ursprung.",
          },
        },
      ],
      operationsPersistence: {
        mode: "persistent_primary",
        label: "Persistenter Operations-Store",
        summary:
          "Zuweisungen, Notizen und Statuswechsel liegen dauerhaft in den Review-Queue-Collections und bleiben über Restart/Deployment rekonstruierbar.",
        repositoryInterface: "ReviewQueueOperationsRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      contentReleasePersistence: {
        mode: "persistent_primary",
        label: "Persistenter Content-Release-Store",
        summary:
          "Sichtbarkeit, Archivierung, Public Links und Workbench-Aktivität liegen dauerhaft in den Content-Release-Collections und bleiben über Restart/Deployment rekonstruierbar.",
        repositoryInterface: "ContentReleaseRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      },
      summary: {
        total: 4,
        totalBeforeFilters: 4,
        officialApprovalCount: 1,
        highPriorityCount: 1,
        assignedCount: 1,
        blockedCount: 0,
        readyCount: 1,
        byDomain: [
          {
            domain: "region_source_result",
            label: "Quellen-Testresultat",
            count: 1,
          },
          {
            domain: "region_intelligence_suggestion",
            label: "Region-Intelligence-Vorschlag",
            count: 1,
          },
          {
            domain: "public_official_approval",
            label: "Amtliche Freigabe",
            count: 1,
          },
          {
            domain: "create_handoff",
            label: "Create-Handoff",
            count: 1,
          },
        ],
        byOperationalStatus: [
          {
            status: "open",
            label: "Offen",
            count: 1,
          },
          {
            status: "in_review",
            label: "In Review",
            count: 1,
          },
          {
            status: "ready",
            label: "Bereit",
            count: 1,
          },
        ],
      },
      filters: {
        applied: {
          domain: "all",
          operationalStatus: "all",
          regionId: "all",
          organizationId: "all",
          priority: "all",
          assignedToUserId: "all",
          visibilityState: "all",
          sort: "priority",
        },
        options: {
          domains: [
            { value: "region_source_result", label: "Quellen-Testresultat", count: 1 },
            { value: "create_handoff", label: "Create-Handoff", count: 1 },
          ],
          statuses: [
            { value: "open", label: "Offen", count: 1 },
            { value: "in_review", label: "In Review", count: 1 },
          ],
          regions: [{ value: "bezirk-berlin-reinickendorf", label: "Berlin Reinickendorf", count: 3 }],
          organizations: [{ value: "org-reinickendorf-1", label: "org-reinickendorf-1", count: 1 }],
          priorities: [{ value: "high", label: "Hohe Priorität", count: 1 }],
          assignees: [{ value: "admin-1", label: "admin-1", count: 1 }],
          visibilities: [{ value: "internal_review", label: "reviewpflichtig", count: 2 }],
          sorts: [{ value: "priority", label: "Priorität", count: 3 }],
        },
      },
      guardrails: {
        noBulkApprove: true,
        noAutoOfficialClaim: true,
        noAutoPublish: true,
        noAutoDossierFinalization: true,
        noAutoAnlassraumFinalization: true,
      },
    });
    const html = renderToStaticMarkup(await AdminReviewPage());

    expect(html).toContain("Zentrale Review-Queue");
    expect(html).toContain("Review-to-Visible Journey");
    expect(html).toContain("Review, Vorschau, Sichtbarkeit und Widerruf laufen auf demselben Pfad");
    expect(html).toContain("Operations-Persistenz");
    expect(html).toContain("Persistenter Operations-Store");
    expect(html).toContain("Content-Release-Persistenz");
    expect(html).toContain("Persistenter Content-Release-Store");
    expect(html).toContain("Keine Sammelentscheidung");
    expect(html).toContain("Region-Intelligence-Vorschläge");
    expect(html).toContain("reviewpflichtige Source Results");
    expect(html).toContain("Factcheck-/Siegelentscheidungen");
    expect(html).toContain("Provider- oder Siegelpfade bleiben bewusste, auditierbare Einzelentscheidungen.");
    expect(html).toContain("Amtliche Freigabe");
    expect(html).toContain("Nur Publikationsfreigabe oder Admin-Fallback");
    expect(html).toContain("Arbeitsliste");
    expect(html).toContain("Hohe Priorität");
    expect(html).toContain("Zugewiesen");
    expect(html).toContain("Mir zuweisen");
    expect(html).toContain("Berlin Reinickendorf");
    expect(html).toContain("Prüfen");
    expect(html).toContain("Kompakter Verlauf");
    expect(html).toContain("Official Release erteilt");
    expect(html).toContain("Community Source Review");
    expect(html).toContain("Aktive Hinweise");
    expect(html).toContain("Ohne Bearbeiter");
    expect(html).toContain("Dossier erstellen prüfen");
    expect(html).toContain("Dossier-Veröffentlichung prüfen");
    expect(html).toContain("Anlassraum erstellen prüfen");
    expect(html).toContain("Anlassraum aktivieren/veröffentlichen prüfen");
    expect(html).toContain("Beteiligungsraum erstellen prüfen");
    expect(html).toContain("Beteiligungsraum aktivieren/veröffentlichen prüfen");
    expect(html).toContain("Review-to-Publish Workspace");
    expect(html).toContain("Persistierte Sichtbarkeit");
    expect(html).toContain("Beispiel-Snapshot");
    expect(html).toContain("Beispiel-Seed");
    expect(html).toContain("Create-/Account-Herkunft");
    expect(html).toContain("Bestehender Create-Arbeitsstand mit Account-Resume-Bezug.");
    expect(html).toContain("Account-Linkage: Rückverknüpfung zum ursprünglichen Beitrag noch offen · Keine belastbare Basis");
    expect(html).toContain("Warum noch nicht vollständig belastbar:");
    expect(html).toContain("Schulsanierung im Bezirk · Dossier-Entwurf");
    expect(html).toContain("V3-Review-Kontext");
    expect(html).toContain("V3-Arbeitsfluss über bestehende Flächen");
    expect(html).toContain("Downstream-KI-Transparenz");
    expect(html).toContain("Mit Voxy weiterdenken");
    expect(html).toContain("Quellen &amp; Faktencheck vorbereiten");
    expect(html).toContain("Dossier-Entscheidungslogik");
    expect(html).toContain("Beteiligungsraum vorbereiten");
    expect(html).toContain("Poll Question Review Summary");
    expect(html).toContain("Output Social Workbench Summary");
    expect(html).toContain("Voxy Script Candidate Summary");
    expect(html).toContain("Voxy Render Decision Summary");
    expect(html).toContain("Review-Entscheidung dokumentieren");
    expect(html).toContain("Render-Request-Draft");
    expect(html).toContain("Render-Queue-Vertrag");
    expect(html).toContain("Kosten &amp; Credits");
    expect(html).toContain("Render-Asset-Pack");
    expect(html).toContain("Provider-Auswahl");
    expect(html).toContain("Runtime Go/No-Go");
    expect(html).toContain("Runtime Enablement Backlog");
    expect(html).toContain("Preview Review");
    expect(html).toContain("Preview-Review-Entscheidung");
    expect(html).toContain("Preview Outcome Handoff");
    expect(html).toContain("Publish Readiness");
    expect(html).toContain("Social Distribution");
    expect(html).toContain("Approval Semantik");
    expect(html).toContain("Noch nicht veröffentlichungsbereit");
    expect(html).toContain("Noch kein Posting");
    expect(html).toContain("Approved ist nicht uploaded");
    expect(html).toContain("Publish-Readiness-Guard-Store");
    expect(html).toContain("Noch kein Preview-Video");
    expect(html).toContain("Keine Medien-Datei");
    expect(html).toContain("Voxy-Decision-Store");
    expect(html).toContain("Preview-Review-Decision-Store");
    expect(html).toContain("Preview-Review-Flows leben pro Prozess");
    expect(html).toContain("Queue-Preview-Store");
    expect(html).toContain("Cost-/Credit-Policy-Store");
    expect(html).toContain("Asset-Pack-Draft-Store");
    expect(html).toContain("Ohne Request-Draft blockiert");
    expect(html).toContain("Frage-Typ");
    expect(html).toContain("Mögliche Ausgabeformate");
    expect(html).toContain("Vorgeschlagenes Beteiligungsformat");
    expect(html).toContain("Script-Kandidat, noch kein Video");
    expect(html).toContain("Voxy Render/Provider Handoff Summary");
    expect(html).toContain("Voxy Render Preflight Summary");
    expect(html).toContain("Voxy Asset &amp; Provider Registry Summary");
    expect(html).toContain("Voxy Render Adapter Summary");
    expect(html).toContain("Handoff-Paket");
    expect(html).toContain("Was ist vorhanden?");
    expect(html).toContain("Warum noch nicht gerendert wird");
    expect(html).toContain("Noop-Ergebnis");
    expect(html).toContain("Nächste Entscheidung");
    expect(html).toContain("Belastbare Wahrheit");
    expect(html).toContain("Create / Handoff");
    expect(html).toContain("Nächster sinnvoller Review-Schritt");
    expect((html.match(/data-testid=\"admin-review-context-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-workflow-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-downstream-ki-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-/g) ?? []).length).toBe(20);
    expect((html.match(/data-testid=\"admin-review-source-factcheck-feed-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-dossier-decision-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-participation-activation-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-poll-question-options-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-output-social-workbench-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-briefing-script-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-decision-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-request-draft-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-queue-contract-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-cost-credit-policy-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-asset-pack-draft-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-provider-selection-draft-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-runtime-go-nogo-matrix-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-runtime-enablement-backlog-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-preview-review-flow-/g) ?? []).length).toBe(1);
    expect(
      (
        html.match(
          /data-testid=\"admin-review-voxy-render-preview-review-decision-persistence-/g,
        ) ?? []
      ).length,
    ).toBe(1);
    expect(
      (html.match(/data-testid=\"admin-review-voxy-render-preview-outcome-handoff-/g) ?? [])
        .length,
    ).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-provider-handoff-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-preflight-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-registry-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"admin-review-voxy-render-adapter-/g) ?? []).length).toBe(1);
    expect(html).toContain("Als Dossier-Entwurf übernehmen");
    expect(html).toContain("Als Anlassraum vorbereiten");
    expect(html).toContain("Als öffentliche Themenseite vorbereiten");
    expect(html).toContain("Öffentliche Themenseite");
    expect(html).toContain("Arbeitsstand");
    expect(html).toContain("Sichtbar heißt nicht automatisch amtlich.");
    expect(html).toContain("Sichtbarkeit kann später wieder zurückgenommen oder archiviert werden.");
    expect(html).not.toContain("direkt veröffentlichen");
    expect(html).not.toContain("blocked_by_provider");
  });
});

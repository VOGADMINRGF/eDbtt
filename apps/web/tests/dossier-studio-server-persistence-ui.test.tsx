import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<typeof import("@core/db/triMongo")>("@core/db/triMongo");
  return {
    ...actual,
    shouldUseInMemoryMongoFallback: () => false,
  };
});

vi.mock("@features/publicTopicPage", () => ({
  getRelatedTopicPageForDossier: vi.fn(async () => null),
}));

import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier";
import {
  createInMemoryPersistedCreateHandoffRepo,
  setPersistedCreateHandoffRepoForTests,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  buildDraftRecord,
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
  generateSocialCarouselOutput,
  getSocialPublishingPolicy,
} from "@features/outputEngine";

function buildWorkspaceSeed(dossierId = "dossier_demo_mobility_berlin") {
  const pkg = generateOutputPackage(
    {
      ...demoDossierForOutputEngine,
      id: dossierId,
    },
    {
      generatedAt: demoDossierForOutputEngine.updatedAt,
      baseUrl: "https://edebatte.org",
    },
  );
  const masterPost = generateMasterPost(pkg);
  const carouselDraft = generateSocialCarouselOutput(pkg);
  const plan = buildSocialDistributionPlan(masterPost, carouselDraft, {
    policy: getSocialPublishingPolicy(),
  });
  const distributionDraft = buildDraftRecord({
    plan,
    selectedChannels: plan.selectedChannels,
    reviewRequired: true,
  });
  return {
    id: "studio-workspace-seed-001",
    dossierId,
    source: "imported_demo" as const,
    status: "needs_review" as const,
    visibilityState: "internal_review" as const,
    title: "Demo Studio Workspace",
    masterPostDraft: masterPost,
    distributionDraft,
    carouselDraft,
    createdBy: "admin-1",
    updatedBy: "admin-1",
    createdAt: "2026-05-15T08:00:00.000Z",
    updatedAt: "2026-05-15T08:10:00.000Z",
    officialApproval: null,
    provenance: {
      notProductionData: true,
      fixture: true,
    },
    guardrails: {
      noAutoPublish: true,
      noSocialPublishing: true,
      noAutoMandate: true,
      noAutoVote: true,
      reviewRequired: true,
      localStorageIsNotProduction: true,
    },
  };
}

describe("dossier studio server persistence UI", () => {
  beforeEach(() => {
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    setPersistedCreateHandoffRepoForTests(createInMemoryPersistedCreateHandoffRepo());
  });

  it("shows honest empty-state persistence copy when no server workspace exists", async () => {
    const html = renderToStaticMarkup(
      await DossierOutputStudioPage({
        params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
      }),
    );

    expect(html).toContain("Noch kein serverseitiger Studio-Arbeitsstand.");
    expect(html).toContain("Browser-Arbeitsstände bleiben lokal und nicht produktiv");
    expect(html).toContain("LocalStorage-Arbeitsstände bleiben lokal im Browser");
  });

  it("shows persisted server workspace status without claiming publication", async () => {
    setDossierStudioWorkspaceRepoForTests(
      createInMemoryDossierStudioWorkspaceRepo({
        workspaces: [buildWorkspaceSeed()],
      }),
    );

    const html = renderToStaticMarkup(
      await DossierOutputStudioPage({
        params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
      }),
    );

    expect(html).toContain("Studio-Arbeitsstand serverseitig gespeichert");
    expect(html).toContain("reviewpflichtig und nicht veröffentlicht");
    expect(html).toContain("V3-Review-Kontext im Studio");
    expect(html).toContain("V3-Arbeitsfluss über bestehende Flächen");
    expect(html).toContain("Downstream-KI-Transparenz im Studio");
    expect(html).toContain("Mit Voxy weiterdenken");
    expect(html).toContain("Quellen &amp; Faktencheck vorbereiten");
    expect(html).toContain("Dossier-Entscheidungslogik im Studio");
    expect(html).toContain("Beteiligungsraum vorbereiten im Studio");
    expect(html).toContain("Poll/Frage-Arbeitsstand im Studio");
    expect(html).toContain("Frage-Typ");
    expect(html).toContain("Vorgeschlagenes Beteiligungsformat");
    expect(html).toContain("Nächste Entscheidung");
    expect(html).toContain('data-testid="dossier-studio-voxy-cocreation"');
    expect(html).toContain('data-testid="dossier-studio-downstream-ki-transparency"');
    expect(html).toContain('data-testid="dossier-studio-v3-workflow-surface"');
    expect(html).toContain('data-testid="dossier-studio-source-factcheck-feed-enrichment"');
    expect(html).toContain('data-testid="dossier-studio-dossier-decision"');
    expect(html).toContain('data-testid="dossier-studio-participation-activation-review"');
    expect(html).toContain('data-testid="dossier-studio-poll-question-options-review"');
    expect(html).toContain("Nächster sinnvoller Review-Schritt");
    expect(html).toContain("Sichtbarkeit: privater Entwurf");
    expect(html).toContain("Server-Workspace · needs_review · reviewpflichtig");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Live posten");
    expect(html).not.toContain("blocked_by_provider");
  });

  it("shows explicit human official approval when a workspace was freigegeben", async () => {
    setDossierStudioWorkspaceRepoForTests(
      createInMemoryDossierStudioWorkspaceRepo({
        workspaces: [
          {
            ...buildWorkspaceSeed(),
            visibilityState: "public_official",
            officialApproval: {
              approvedByUserId: "publisher-1",
              approvedAt: "2026-05-15T09:00:00.000Z",
              authority: "publication_approved",
              note: "Menschlich freigegeben.",
            },
          },
        ],
      }),
    );

    const html = renderToStaticMarkup(
      await DossierOutputStudioPage({
        params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
      }),
    );

    expect(html).toContain("Server-Workspace · needs_review · amtlich freigegeben");
    expect(html).toContain("Menschlich freigegeben · Publikationsfreigabe");
    expect(html).toContain("Öffentliche amtliche Freigabe wurde explizit durch einen berechtigten Menschen erteilt.");
  });

  it("shows create-origin provenance when a studio workspace is linked by sourceDraftId", async () => {
    setDossierStudioWorkspaceRepoForTests(
      createInMemoryDossierStudioWorkspaceRepo({
        workspaces: [
          {
            ...buildWorkspaceSeed(),
            provenance: {
              sourceDraftId: "create-handoff-1",
            },
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
            sourceText: "Wir brauchen sichere Schulwege.",
            plannerResult: {
              shortSummary: "Sichere Schulwege priorisieren.",
              topicCandidates: ["Schulwege"],
              openQuestions: ["Welche Kreuzung zuerst?"],
            },
            graphMatches: {
              matches: [],
              matchedDossiers: [],
              matchedAnlassraeume: [],
              matchedClaims: [],
              matchedTopics: [],
              matchedVotes: [],
            },
            selectedAction: "create_dossier",
            claims: [{ id: "claim-1", text: "Sichere Schulwege priorisieren.", factcheckEligible: true }],
            arguments: [],
            openQuestions: [{ id: "question-1", question: "Welche Kreuzung zuerst?", requiredBeforePublish: true }],
            sourceGrounding: [],
            topicSeed: {
              topicKey: "school-routes",
              topicLabel: "Sichere Schulwege",
              jurisdiction: "district",
              themenradarSourceType: "user_input",
            },
            resumeHref: "/create?resume=create-handoff-1",
            reviewState: "ready_for_confirmation",
            visibilityState: "internal_review",
            requiresConfirmation: true,
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noAutomaticOfficialResponse: true,
            noAutoFinalization: true,
            intakeClassification: "proposal",
            createdByUserId: "user-1",
            regionId: "region-1",
            organizationId: null,
            dossierId: "dossier_demo_mobility_berlin",
            anlassraumId: null,
            requestScope: null,
            accessDecision: null,
            createdAt: "2026-07-07T10:00:00.000Z",
            updatedAt: "2026-07-07T10:05:00.000Z",
          } as any,
        ],
      }),
    );

    const html = renderToStaticMarkup(
      await DossierOutputStudioPage({
        params: Promise.resolve({ id: "dossier_demo_mobility_berlin" }),
      }),
    );

    expect(html).toContain("Aus bestehendem Create-Arbeitsstand abgeleitet.");
    expect(html).toContain("Account-Linkage ist vorhanden");
    expect(html).toContain("Rückverknüpfung zum ursprünglichen Beitrag:");
    expect(html).toContain("Warum das noch nicht vollständig belastbar ist:");
  });
});

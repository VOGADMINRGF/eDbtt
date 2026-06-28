import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier/server/studioPersistence";
import {
  createInMemoryContentReleaseWorkbenchRepo,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";
import {
  buildDraftRecord,
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
  generateSocialCarouselOutput,
  getSocialPublishingPolicy,
} from "@features/outputEngine";
import {
  createInMemorySocialDistributionRepo,
  setSocialDistributionRepoForTests,
} from "@features/outputEngine/socialDistributionRuntime";

const mocks = vi.hoisted(() => ({
  loadSocialDistributionQueueReadModel: vi.fn(async () => ({
    generatedAt: "2026-06-28T00:00:00.000Z",
    summary: {
      total: 0,
      reviewOpen: 0,
      queued: 0,
      scheduledReady: 0,
      exported: 0,
      blocked: 0,
    },
    guardrails: {
      noAutoPublish: true,
      noOauthConnectors: true,
      noOfficialClaim: true,
      derivedQueue: true,
    },
    items: [],
  })),
  dossierStudioWorkspaceRepo: null as ReturnType<
    typeof createInMemoryDossierStudioWorkspaceRepo
  > | null,
}));

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<typeof import("@core/db/triMongo")>(
    "@core/db/triMongo",
  );
  return {
    ...actual,
    shouldUseInMemoryMongoFallback: () => false,
  };
});

vi.mock("@features/dossier/server/studioPersistence", async () => {
  const actual = await vi.importActual<
    typeof import("@features/dossier/server/studioPersistence")
  >("@features/dossier/server/studioPersistence");
  return {
    ...actual,
    getDossierStudioWorkspaceRepo: () =>
      mocks.dossierStudioWorkspaceRepo ??
      actual.createInMemoryDossierStudioWorkspaceRepo(),
    setDossierStudioWorkspaceRepoForTests: (
      repo: ReturnType<typeof actual.createInMemoryDossierStudioWorkspaceRepo> | null,
    ) => {
      mocks.dossierStudioWorkspaceRepo =
        repo ?? actual.createInMemoryDossierStudioWorkspaceRepo();
    },
  };
});

vi.mock("@features/outputEngine", async () => {
  const actual = await vi.importActual<typeof import("@features/outputEngine")>(
    "@features/outputEngine",
  );
  return {
    ...actual,
    loadSocialDistributionQueueReadModel: (...args: unknown[]) =>
      mocks.loadSocialDistributionQueueReadModel(...args),
  };
});

import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";

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
    mocks.dossierStudioWorkspaceRepo = createInMemoryDossierStudioWorkspaceRepo();
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
    setSocialDistributionRepoForTests(createInMemorySocialDistributionRepo());
    mocks.loadSocialDistributionQueueReadModel.mockResolvedValue({
      generatedAt: "2026-06-28T00:00:00.000Z",
      summary: {
        total: 0,
        reviewOpen: 0,
        queued: 0,
        scheduledReady: 0,
        exported: 0,
        blocked: 0,
      },
      guardrails: {
        noAutoPublish: true,
        noOauthConnectors: true,
        noOfficialClaim: true,
        derivedQueue: true,
      },
      items: [],
    });
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
    expect(html).toContain("Sichtbarkeit: privater Entwurf");
    expect(html).toContain("Server-Workspace · needs_review · reviewpflichtig");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Live posten");
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
});

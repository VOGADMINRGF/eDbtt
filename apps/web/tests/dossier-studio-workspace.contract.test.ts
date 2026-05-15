import { describe, expect, it } from "vitest";
import {
  createInMemoryDossierStudioWorkspaceRepo,
} from "@features/dossier";
import {
  buildDraftRecord,
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateOutputPackage,
  generateSocialCarouselOutput,
  getSocialPublishingPolicy,
} from "@features/outputEngine";

function buildStudioArtifacts(dossierId = "dossier-demo-studio-001") {
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
  const carousel = generateSocialCarouselOutput(pkg);
  const plan = buildSocialDistributionPlan(masterPost, carousel, {
    policy: getSocialPublishingPolicy(),
  });
  const distributionDraft = buildDraftRecord({
    plan,
    selectedChannels: plan.selectedChannels,
    reviewRequired: true,
  });
  return { masterPost, carousel, distributionDraft };
}

describe("dossier studio workspace contract", () => {
  it("creates a review-first workspace with hard no-publish guardrails", async () => {
    const repo = createInMemoryDossierStudioWorkspaceRepo();
    const artifacts = buildStudioArtifacts("dossier-draft-studio-001");

    const workspace = await repo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-001",
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      unitId: "unit-1",
      source: "region_signal_draft",
      title: "Studio-Arbeitsstand Reinickendorf",
      createdBy: "staff-1",
      updatedBy: "staff-1",
      provenance: {
        sourceSignalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        sourceRegionId: "bezirk-berlin-reinickendorf",
        sourceDraftId: "dossier-draft-studio-001",
      },
      seed: {
        masterPostDraft: artifacts.masterPost,
        distributionDraft: artifacts.distributionDraft,
        carouselDraft: artifacts.carousel,
        status: "draft",
      },
    });

    expect(workspace.guardrails).toMatchObject({
      noAutoPublish: true,
      noSocialPublishing: true,
      noAutoMandate: true,
      noAutoVote: true,
      reviewRequired: true,
      localStorageIsNotProduction: true,
    });
    expect(workspace.status).toBe("draft");
    expect(workspace.masterPostDraft?.publicationStatus).toBe("draft_review_required");
    expect(workspace.distributionDraft?.externalPublish).toBe(false);
  });

  it("keeps imported demo and fixture provenance explicitly notProductionData", async () => {
    const repo = createInMemoryDossierStudioWorkspaceRepo();
    const artifacts = buildStudioArtifacts("dossier_demo_mobility_berlin");

    const workspace = await repo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier_demo_mobility_berlin",
      source: "imported_demo",
      title: "Demo Studio",
      createdBy: "admin-1",
      updatedBy: "admin-1",
      provenance: {
        notProductionData: true,
        fixture: true,
      },
      seed: {
        masterPostDraft: artifacts.masterPost,
        distributionDraft: artifacts.distributionDraft,
        carouselDraft: artifacts.carousel,
        status: "draft",
      },
    });

    expect(workspace.source).toBe("imported_demo");
    expect(workspace.provenance).toMatchObject({
      notProductionData: true,
      fixture: true,
    });
  });

  it("updates, locks, unlocks and archives workspaces without crossing dossier boundaries", async () => {
    const repo = createInMemoryDossierStudioWorkspaceRepo();
    const artifacts = buildStudioArtifacts("dossier-draft-studio-002");
    await repo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-002",
      regionId: "bezirk-berlin-reinickendorf",
      source: "manual_admin",
      title: "Studio A",
      createdBy: "admin-1",
      updatedBy: "admin-1",
      seed: {
        masterPostDraft: artifacts.masterPost,
        distributionDraft: artifacts.distributionDraft,
        carouselDraft: artifacts.carousel,
      },
    });
    await repo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-003",
      regionId: "bezirk-berlin-spandau",
      source: "manual_admin",
      title: "Studio B",
      createdBy: "admin-1",
      updatedBy: "admin-1",
    });

    const updated = await repo.updateDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-002",
      updatedBy: "staff-1",
      patch: {
        reviewNotes: "Bitte Review priorisieren.",
        status: "needs_review",
      },
    });
    expect(updated.reviewNotes).toBe("Bitte Review priorisieren.");
    expect(updated.status).toBe("needs_review");

    const locked = await repo.lockDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-002",
      lockedBy: "staff-1",
    });
    expect(locked?.status).toBe("locked");
    await expect(
      repo.updateDossierStudioWorkspace({
        dossierId: "dossier-draft-studio-002",
        updatedBy: "staff-2",
        patch: { audienceNotes: "Neue Zielgruppe" },
      }),
    ).rejects.toThrow("studio_workspace_locked");

    const unlocked = await repo.unlockDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-002",
      unlockedBy: "staff-1",
    });
    expect(unlocked?.status).toBe("draft");

    const archived = await repo.archiveDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-002",
      archivedBy: "admin-1",
    });
    expect(archived?.status).toBe("archived");

    const other = await repo.getDossierStudioWorkspace("dossier-draft-studio-003");
    expect(other?.title).toBe("Studio B");
  });

  it("rejects unsupported published/public style statuses", async () => {
    const repo = createInMemoryDossierStudioWorkspaceRepo();
    const artifacts = buildStudioArtifacts("dossier-draft-studio-004");
    await repo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-draft-studio-004",
      source: "manual_editor",
      title: "Studio C",
      createdBy: "editor-1",
      updatedBy: "editor-1",
      seed: {
        masterPostDraft: artifacts.masterPost,
      },
    });

    await expect(
      repo.updateDossierStudioWorkspace({
        dossierId: "dossier-draft-studio-004",
        updatedBy: "editor-1",
        patch: { status: "published" as any },
      }),
    ).rejects.toThrow();
  });
});

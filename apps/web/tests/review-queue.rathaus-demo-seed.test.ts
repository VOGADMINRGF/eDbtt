import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSignalDraftPersistence,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionSignalDraftPersistenceForTests,
} from "@features/region";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier/server/studioPersistence";
import { buildReviewQueueReadModel } from "@features/reviewQueue";

const mocks = vi.hoisted(() => ({
  listCreatePrepareAttachDraftQueue: vi.fn(),
}));

vi.mock("@/features/create/attachDraftReviewQueue", () => ({
  listCreatePrepareAttachDraftQueue: (...args: unknown[]) =>
    mocks.listCreatePrepareAttachDraftQueue(...args),
}));

describe("review queue rathaus demo seed", () => {
  beforeEach(() => {
    mocks.listCreatePrepareAttachDraftQueue.mockResolvedValue({
      items: [],
      total: 0,
    });
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo({ records: [] }),
    );
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
  });

  it("surfaces all rathaus demo dossier and anlassraum seeds as review-required items", async () => {
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

    const rathausItems = readModel.items.filter((item) =>
      item.id.startsWith("region_intelligence_suggestion:rathaus_demo:"),
    );

    expect(rathausItems.length).toBe(18);
    expect(rathausItems.every((item) => item.reviewRequired)).toBe(true);
    expect(rathausItems.every((item) => item.visibilityState === "internal_review")).toBe(true);
    expect(
      rathausItems.some(
        (item) =>
          item.title ===
          "Bürgerbeteiligung Investitionsprogramm 2025-2029 / Haushalt 2026-2027 Reinickendorf",
      ),
    ).toBe(true);
    expect(
      rathausItems.some((item) => item.title === "Gezielte Zuweisungen erklären"),
    ).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCol,
  isStaticCollectionBuild,
  shouldUseInMemoryMongoFallback,
} from "@core/db/triMongo";
import { getDossierStudioWorkspaceRepo, setDossierStudioWorkspaceRepoForTests } from "@features/dossier/server/studioPersistence";
import { findDossierByAnyId } from "@features/dossier/lookup";
import { listOperationalRegions } from "@features/region";
import { listDerivedRegionParticipationSignals } from "@features/region/regionParticipationSignals";
import {
  listRegionSignalDraftRecords,
  setRegionSignalDraftPersistenceForTests,
} from "@features/region/regionSignalDrafts";
import {
  resetParticipationSignalReviewRuntimeForTests,
} from "@features/region/server/participationSignalReviewRuntime";
import {
  getRegionDataRepo,
  setRegionDataRepoForTests,
} from "@features/region/server/repo";
import {
  listRegionSourceConnections,
  listRegionSourceTestResults,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region/server/sourceConnectionRuntime";

function resetBuildGuardRepos() {
  setRegionDataRepoForTests(null);
  setRegionSourceConnectionRuntimeRepoForTests(null);
  setRegionSignalDraftPersistenceForTests(null);
  setDossierStudioWorkspaceRepoForTests(null);
  resetParticipationSignalReviewRuntimeForTests();
}

describe("static collection mongo guard", () => {
  beforeEach(() => {
    resetBuildGuardRepos();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetBuildGuardRepos();
  });

  it("detects the Next.js production build collection phase", () => {
    expect(isStaticCollectionBuild()).toBe(false);
    expect(shouldUseInMemoryMongoFallback()).toBe(true);

    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    expect(isStaticCollectionBuild()).toBe(true);
    expect(shouldUseInMemoryMongoFallback()).toBe(true);
  });

  it("uses in-memory fallbacks for region and studio runtime repos during static collection", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    const staticUsers = await getCol("users");
    const [manualActors, sourceConnections, sourceResults, signalDrafts, workspaces, userRows] =
      await Promise.all([
        getRegionDataRepo().listManualActors({}),
        listRegionSourceConnections(),
        listRegionSourceTestResults(),
        listRegionSignalDraftRecords(),
        getDossierStudioWorkspaceRepo().listDossierStudioWorkspaces(),
        staticUsers.find({}).limit(5).toArray(),
      ]);

    expect(manualActors).toEqual([]);
    expect(sourceConnections).toEqual([]);
    expect(sourceResults).toEqual([]);
    expect(signalDrafts).toEqual([]);
    expect(workspaces).toEqual([]);
    expect(await staticUsers.findOne({ _id: "user-1" } as never)).toBeNull();
    expect(userRows).toEqual([]);
  });

  it("keeps dossier lookup missing and participation signals fixture-safe during static collection", async () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");

    const regions = await listOperationalRegions();
    const signals = await listDerivedRegionParticipationSignals(regions);

    expect(await findDossierByAnyId("dossier-runtime-001")).toBeNull();
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.some((signal) => signal.source.sourceKind === "fixture")).toBe(true);
    expect(signals.some((signal) => signal.source.sourceKind === "runtime")).toBe(false);
  });
});

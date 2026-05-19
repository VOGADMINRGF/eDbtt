import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createManualAnlassraum: vi.fn(),
  dossiers: new Map<string, any>(),
  sources: new Map<string, any>(),
  logDossierRevision: vi.fn(),
  updateDossierCounts: vi.fn(),
  seedDossierFromAnalysis: vi.fn(),
}));

vi.mock("@features/anlassraum/service", () => ({
  createManualAnlassraum: (...args: unknown[]) => mocks.createManualAnlassraum(...args),
}));

vi.mock("@features/dossier/db", () => ({
  dossiersCol: async () => ({
    findOne: async (filter: any) => {
      const candidates = filter?.$or ?? [];
      for (const item of mocks.dossiers.values()) {
        if (
          candidates.some(
            (candidate: any) =>
              candidate?.dossierId === item.dossierId || candidate?.statementId === item.statementId,
          )
        ) {
          return item;
        }
      }
      return null;
    },
    insertOne: async (doc: any) => {
      mocks.dossiers.set(doc.dossierId, doc);
      return { insertedId: doc.dossierId };
    },
  }),
  dossierSourcesCol: async () => ({
    findOne: async (filter: any) => {
      const key = `${filter?.dossierId}:${filter?.canonicalUrlHash}`;
      return mocks.sources.get(key) ?? null;
    },
    insertOne: async (doc: any) => {
      const key = `${doc.dossierId}:${doc.canonicalUrlHash}`;
      mocks.sources.set(key, doc);
      return { insertedId: doc.sourceId };
    },
  }),
  updateDossierCounts: (...args: unknown[]) => mocks.updateDossierCounts(...args),
}));

vi.mock("@features/dossier/revisions", () => ({
  logDossierRevision: (...args: unknown[]) => mocks.logDossierRevision(...args),
}));

vi.mock("@features/dossier/seed", () => ({
  seedDossierFromAnalysis: (...args: unknown[]) => mocks.seedDossierFromAnalysis(...args),
}));

import {
  buildContentReleaseWorkbenchTargets,
  createInMemoryContentReleaseWorkbenchRepo,
  listContentReleaseAuditEvents,
  prepareContentReleaseTargetFromSourceResult,
  setContentReleaseWorkbenchRepoForTests,
  updateContentReleaseTargetFromSourceResult,
} from "@features/contentReleaseWorkbench";
import {
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier/server/studioPersistence";

const sourceResult = {
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
  sourceSnapshotSummary:
    "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf.",
  sourceSnapshotExcerpt:
    "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
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
      text: "Schulsanierung in Reinickendorf ist ein priorisiertes Thema.",
      confidence: 0.74,
      basisLabel: "Titel",
      excerpt:
        "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
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
      excerpt:
        "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
    },
  ],
  openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
  affectedScope: {
    regionName: "Berlin Reinickendorf",
    detectedPlaces: ["Berlin Reinickendorf"],
    ortsteilHints: [],
    fachbereichHints: ["Schule/Bildung", "Schule", "Verkehr"],
  },
  reviewSuggestions: [],
  reviewTaskSummary: {
    claimCount: 1,
    topicClusterCount: 1,
    dossierSuggestionCount: 1,
    anlassraumSuggestionCount: 1,
    openQuestionCount: 1,
    evidenceCount: 1,
    label: "1 mögliche Aussagen · 1 Themencluster · 1 Dossier-Vorschläge · 1 Anlassraum-Vorschläge · 1 offene Fragen",
  },
  createdAt: "2026-05-18T08:00:00.000Z",
  updatedAt: "2026-05-18T08:00:00.000Z",
  testedBy: "admin-1",
  reviewRequired: true,
  noAutoPublish: true,
  noPublicOfficial: true,
} as const;

describe("content release workbench", () => {
  beforeEach(() => {
    process.env.VITEST = "1";
    mocks.dossiers.clear();
    mocks.sources.clear();
    mocks.logDossierRevision.mockReset();
    mocks.updateDossierCounts.mockReset();
    mocks.seedDossierFromAnalysis.mockReset();
    setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        results: [sourceResult as any],
      }),
    );
    setDossierStudioWorkspaceRepoForTests(createInMemoryDossierStudioWorkspaceRepo());
    mocks.createManualAnlassraum.mockResolvedValue({
      anlassraumId: { toHexString: () => "anlassraum-release-1" },
    });
  });

  it("prepares a dossier draft from a review item without auto publication", async () => {
    const record = await prepareContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "dossier",
      requestedBy: "admin-1",
      organizationId: "org-reinickendorf-1",
    });

    expect(record.targetType).toBe("dossier");
    expect(record.title).toBe("Berlin Reinickendorf: Schule");
    expect(record.visibilityState).toBe("internal_review");
    expect(record.previewHref).toBe(`/dossier/${record.targetId}/studio`);
    expect(record.publicHref).toBe(`/dossier/${record.targetId}`);

    const targets = await buildContentReleaseWorkbenchTargets({
      result: sourceResult as any,
      canPrepare: true,
      canPreparePublication: true,
    });
    const dossierTarget = targets.find((target) => target.targetType === "dossier");
    expect(dossierTarget).toMatchObject({
      prepared: true,
      statusLabel: "Arbeitsstand",
      visibilityState: "internal_review",
      qrHref: null,
    });
  });

  it("prepares an anlassraum from a review item on the existing route family", async () => {
    const record = await prepareContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "anlassraum",
      requestedBy: "admin-1",
    });

    expect(record.targetType).toBe("anlassraum");
    expect(record.targetId).toBe("anlassraum-release-1");
    expect(record.previewHref).toBe("/runden?view=active&anlassraumId=anlassraum-release-1");
    expect(record.publicHref).toBe("/anlassraum?anlassraumId=anlassraum-release-1");
  });

  it("requires conscious visibility actions and never sets public_official automatically", async () => {
    const prepared = await prepareContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "dossier",
      requestedBy: "admin-1",
    });
    expect(prepared.visibilityState).toBe("internal_review");

    const visible = await updateContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "dossier",
      action: "make_visible",
      requestedBy: "admin-1",
    });
    expect(visible.visibilityState).toBe("public_unverified");

    const preparedForPublication = await updateContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "dossier",
      action: "prepare_publication",
      requestedBy: "admin-1",
    });
    expect(preparedForPublication.visibilityState).toBe("public_reviewed");
    expect(preparedForPublication.visibilityState).not.toBe("public_official");

    const auditEvents = await listContentReleaseAuditEvents(preparedForPublication.id);
    expect(auditEvents.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "prepared",
        "visibility_made_public",
        "publication_prepared",
      ]),
    );
  });

  it("offers QR only after a visible release state and shows the status correctly in preview metadata", async () => {
    await prepareContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "dossier",
      requestedBy: "admin-1",
    });

    const beforeVisible = await buildContentReleaseWorkbenchTargets({
      result: sourceResult as any,
      canPrepare: true,
      canPreparePublication: true,
    });
    expect(beforeVisible.find((target) => target.targetType === "dossier")?.qrHref).toBeNull();

    await updateContentReleaseTargetFromSourceResult({
      sourceResultId: sourceResult.id,
      targetType: "dossier",
      action: "make_visible",
      requestedBy: "admin-1",
    });

    const visibleTargets = await buildContentReleaseWorkbenchTargets({
      result: sourceResult as any,
      canPrepare: true,
      canPreparePublication: true,
    });
    expect(visibleTargets.find((target) => target.targetType === "dossier")).toMatchObject({
      statusLabel: "sichtbar, aber nicht geprüft",
      visibilityState: "public_unverified",
      canCreateQrLink: true,
    });
    expect(
      visibleTargets.find((target) => target.targetType === "dossier")?.qrHref,
    ).toContain("/qrcodegenerator?target=");
  });
});

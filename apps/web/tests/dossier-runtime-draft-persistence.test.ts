import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createInMemoryPersistedCreateHandoffRepo,
  setPersistedCreateHandoffRepoForTests,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  createInMemoryDossierRuntimeRepository,
  ensurePersistedDossierRuntimeDraft,
  getDossierRuntimeHandoffSummary,
  getDossierRuntimeRecord,
  setDossierRuntimeRepositoryForTests,
} from "@/features/create/dossierRuntimeServer";

function buildPersistedHandoff(
  overrides: Partial<PersistedCreateHandoffRecord> = {},
): PersistedCreateHandoffRecord {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "persisted-handoff-1",
    source: "create",
    sourceText: "Vor Schulen fehlen sichere Querungen und klare Temporegeln.",
    plannerResult: {
      shortSummary: "Sichere Schulwege sollen als Dossier strukturiert geprüft werden.",
      openQuestions: ["Welche Kreuzungen sind zuerst kritisch?"],
      topicCandidates: ["Sichere Schulwege"],
    } as any,
    graphMatches: {
      matches: [{ kind: "topic", label: "Sichere Schulwege" }],
      matchedTopics: ["Sichere Schulwege"],
      matchedDossiers: [],
      matchedAnlassraeume: [],
      shouldCreateNewTopic: true,
    } as any,
    selectedAction: "create_dossier",
    claims: [
      {
        id: "claim-1",
        text: "Vor Schulen fehlen sichere Querungen.",
        kind: "factual_claim",
        factcheckEligible: true,
        sourceRefs: ["source-text"],
      },
    ],
    arguments: [
      {
        id: "argument-1",
        text: "Kinder brauchen sichere Wege zum Unterricht.",
        stance: "pro",
        supportsClaimIds: ["claim-1"],
      },
    ],
    openQuestions: [
      {
        id: "question-1",
        question: "Welche Schulen sind besonders betroffen?",
        requiredBeforePublish: true,
      },
    ],
    sourceGrounding: [
      {
        id: "source-text",
        label: "Ausgangstext",
        status: "source_text",
        detail: "Vor Schulen fehlen sichere Querungen und klare Temporegeln.",
      },
    ],
    topicSeed: {
      topicKey: "sichere-schulwege",
      topicLabel: "Sichere Schulwege",
      jurisdiction: "kommune",
      themenradarSourceType: "create_intake",
    },
    resumeHref: "/create?resume=create_handoff&handoffId=persisted-handoff-1",
    reviewState: "manual_review_required",
    visibilityState: "internal_review",
    requiresConfirmation: true,
    reviewRequired: true,
    noAutoPublish: true,
    noPublicOfficial: true,
    noAutomaticOfficialResponse: true,
    noAutoFinalization: true,
    intakeClassification: "claim",
    createdByUserId: "user-1",
    regionId: "berlin-reinickendorf",
    organizationId: "org-1",
    dossierId: null,
    anlassraumId: null,
    requestScope: null,
    accessDecision: null,
    createdAt: "2026-07-04T08:00:00.000Z",
    updatedAt: "2026-07-04T08:00:00.000Z",
    ...overrides,
  };
}

describe("dossier runtime draft persistence", () => {
  beforeEach(() => {
    setDossierRuntimeRepositoryForTests(createInMemoryDossierRuntimeRepository());
    setPersistedCreateHandoffRepoForTests(
      createInMemoryPersistedCreateHandoffRepo({
        records: [buildPersistedHandoff()],
      }),
    );
  });

  it("persists a dossier runtime draft from an existing create_dossier handoff", async () => {
    const record = await ensurePersistedDossierRuntimeDraft("persisted-handoff-1");
    const persisted = await getDossierRuntimeRecord("persisted-handoff-1");
    const summary = await getDossierRuntimeHandoffSummary("persisted-handoff-1");

    expect(record).toMatchObject({
      id: "dossier-runtime:persisted-handoff-1",
      sourceHandoffId: "persisted-handoff-1",
      sourceReviewItemId: "create_handoff:persisted:persisted-handoff-1",
      status: "queued_for_review",
      visibility: "internal_review",
      createdDossierId: null,
      createdWorkspaceId: null,
    });
    expect(persisted).toMatchObject({
      id: "dossier-runtime:persisted-handoff-1",
      status: "queued_for_review",
    });
    expect(summary).toMatchObject({
      dossierRuntimeId: "dossier-runtime:persisted-handoff-1",
      dossierRuntimeState: "dossier_review_draft",
      dossierTargetState: "dossier_review_draft",
      persistenceState: "persisted_dossier_runtime_record",
      publishState: "not_published",
      graphTargetState: "planned_not_active",
    });
    expect(summary?.missingRuntimeTruth).toEqual([]);
  });

  it("does not create a runtime draft for non-dossier handoffs", async () => {
    setPersistedCreateHandoffRepoForTests(
      createInMemoryPersistedCreateHandoffRepo({
        records: [
          buildPersistedHandoff({
            id: "persisted-handoff-2",
            selectedAction: "request_review",
          }),
        ],
      }),
    );

    await expect(
      ensurePersistedDossierRuntimeDraft("persisted-handoff-2"),
    ).resolves.toBeNull();
    await expect(getDossierRuntimeRecord("persisted-handoff-2")).resolves.toBeNull();
  });
});

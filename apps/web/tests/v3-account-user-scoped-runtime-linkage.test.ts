import { describe, expect, it } from "vitest";
import {
  buildAccountUserScopedRuntimeLinkage,
} from "@features/account/loadAccountUserScopedRuntimeLinkage";

function buildHandoff(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: "create_handoff_review_item.v1",
    id: "create-handoff-1",
    source: "create",
    sourceText: "Wir brauchen sichere Schulwege rund um die Grundschule.",
    plannerResult: {
      shortSummary: "Sichere Schulwege im Bezirk priorisieren.",
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
    dossierId: "dossier-1",
    anlassraumId: null,
    requestScope: null,
    accessDecision: null,
    createdAt: "2026-07-07T10:00:00.000Z",
    updatedAt: "2026-07-07T10:05:00.000Z",
    ...overrides,
  } as any;
}

function buildWorkspace(overrides: Record<string, unknown> = {}) {
  return {
    id: "workspace-1",
    dossierId: "dossier-1",
    regionId: "region-1",
    organizationId: null,
    source: "manual_editor",
    status: "needs_review",
    visibilityState: "internal_review",
    title: "Sichere Schulwege · Workspace",
    masterPostDraft: {
      body: "Sichere Schulwege im Bezirk priorisieren.",
      overallPicture: "Der Bezirk prüft sichere Schulwege.",
      topic: "Sichere Schulwege",
      openQuestions: ["Welche Kreuzung zuerst?"],
      sourceSituation: "Quellenlage noch in Prüfung.",
      hook: "Schulwege zuerst sichern.",
      sourceState: {
        traces: [],
        notes: ["source_needed"],
        status: "missing",
      },
    },
    distributionDraft: {
      selectedChannels: ["linkedin_draft"],
      reviewRequired: true,
    },
    createdBy: "user-1",
    updatedBy: "user-1",
    createdAt: "2026-07-07T11:00:00.000Z",
    updatedAt: "2026-07-07T11:10:00.000Z",
    officialApproval: null,
    provenance: {
      sourceDraftId: "create-handoff-1",
    },
    guardrails: {
      noAutoPublish: true,
      noSocialPublishing: true,
      noAutoMandate: true,
      noAutoVote: true,
      reviewRequired: true,
      localStorageIsNotProduction: true,
    },
    ...overrides,
  } as any;
}

describe("V3 account user-scoped runtime linkage", () => {
  it("marks exact handoff-to-workspace/runtime linkage as real linked follow-up truth", () => {
    const linkage = buildAccountUserScopedRuntimeLinkage({
      handoff: buildHandoff(),
      linkedWorkspace: {
        workspace: buildWorkspace(),
        linkageMode: "workspace_source_draft",
      },
      dossierRuntimeRecord: {
        title: "Sichere Schulwege · Dossier-Runtime",
        status: "created",
      },
      dossierPublicationRecord: null,
      anlassraumRuntimeRecord: null,
      participationRuntimeRecord: null,
      participationPublishRecord: null,
    } as any);

    expect(linkage.linkageStatus).toBe("linked");
    expect(linkage.runtimeTruthLevel).toBe("runtime_confirmed");
    expect(linkage.userVisibleStatus).toContain("echte Folge-Runtime");
    expect(linkage.dossierWorkspaceRef?.stateLabel).toBe("Dossier-Runtime erstellt");
    expect(linkage.outputDraftRef?.stateLabel).toContain("Output-Entwürfe");
    expect(linkage.voxyBriefingRef?.stateLabel).toContain("Voxy-Briefing sichtbar");
  });

  it("keeps fallback dossier-owner linkage partial instead of faking exact source linkage", () => {
    const linkage = buildAccountUserScopedRuntimeLinkage({
      handoff: buildHandoff(),
      linkedWorkspace: {
        workspace: buildWorkspace({
          provenance: {},
        }),
        linkageMode: "workspace_owner_scope",
      },
      dossierRuntimeRecord: null,
      dossierPublicationRecord: null,
      anlassraumRuntimeRecord: null,
      participationRuntimeRecord: null,
      participationPublishRecord: null,
    } as any);

    expect(linkage.linkageStatus).toBe("blocked_by_review");
    expect(linkage.runtimeTruthLevel).toBe("output_readmodel");
    expect(linkage.adminReason).toContain("Dossier-ID und Owner-Scope");
    expect(linkage.dossierWorkspaceRef?.summary).toContain("nur über Dossier-ID");
  });

  it("shows review truth and participation candidates without inventing runtime linkage", () => {
    const linkage = buildAccountUserScopedRuntimeLinkage({
      handoff: buildHandoff({
        id: "create-handoff-2",
        dossierId: null,
        selectedAction: "prepare_participation_space",
      }),
      linkedWorkspace: null,
      dossierRuntimeRecord: null,
      dossierPublicationRecord: null,
      anlassraumRuntimeRecord: null,
      participationRuntimeRecord: null,
      participationPublishRecord: null,
    } as any);

    expect(linkage.linkageStatus).toBe("partially_linked");
    expect(linkage.runtimeTruthLevel).toBe("review_readmodel");
    expect(linkage.participationRef).toBeNull();
    expect(linkage.surfaces.find((surface) => surface.kind === "participation")).toMatchObject({
      status: "candidate",
    });
    expect(linkage.linkageGaps).toContain("Noch keine direkte Beteiligungsraum-Runtime sichtbar.");
    expect(linkage.userVisibleStatus).toContain("Persistierter Review-Handoff");
  });
});

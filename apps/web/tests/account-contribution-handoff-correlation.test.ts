import { describe, expect, it } from "vitest";
import {
  buildAccountContributionHandoffCorrelation,
} from "@features/account/buildContributionHandoffCorrelations";
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
    resumeHref: "/create?resume=create_handoff&handoffId=create-handoff-1",
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
      body: "Sichere Schulwege priorisieren.",
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

function buildRuntimeLinkage(overrides: Record<string, unknown> = {}) {
  return buildAccountUserScopedRuntimeLinkage({
    handoff: buildHandoff(),
    linkedWorkspace: null,
    dossierRuntimeRecord: null,
    dossierPublicationRecord: null,
    anlassraumRuntimeRecord: null,
    participationRuntimeRecord: null,
    participationPublishRecord: null,
    ...overrides,
  } as any);
}

describe("account contribution handoff correlation", () => {
  it("uses a shared identifier as exact correlation", () => {
    const correlation = buildAccountContributionHandoffCorrelation({
      contributionRef: {
        id: "ledger-1",
        kind: "ledger_branch",
        title: "Sicherer Schulweg",
        summary: "Branch",
        href: "/create?draftId=ledger-1&branchId=branch-1",
        sourceText: "Text",
        createdAt: null,
        updatedAt: null,
        userId: "user-1",
        sharedIds: ["create-handoff-1"],
      },
      runtimeLinkages: [buildRuntimeLinkage()],
    });

    expect(correlation.correlationStrength).toBe("exact");
    expect(correlation.correlationBasis).toBe("shared_id");
  });

  it("uses an explicit sourceHandoffId as strong correlation", () => {
    const correlation = buildAccountContributionHandoffCorrelation({
      contributionRef: {
        id: "ledger-2",
        kind: "ledger_branch",
        title: "Sicherer Schulweg",
        summary: "Branch",
        href: "/create?draftId=ledger-2&branchId=branch-1",
        sourceText: "Text",
        createdAt: null,
        updatedAt: null,
        userId: "user-1",
        sourceHandoffId: "create-handoff-1",
      },
      runtimeLinkages: [buildRuntimeLinkage()],
    });

    expect(correlation.correlationStrength).toBe("strong");
    expect(correlation.correlationBasis).toBe("source_handoff_id");
  });

  it("keeps same dossier plus same user only partial", () => {
    const correlation = buildAccountContributionHandoffCorrelation({
      contributionRef: {
        id: "ledger-3",
        kind: "ledger_branch",
        title: "Sicherer Schulweg",
        summary: "Branch",
        href: "/create?draftId=ledger-3&branchId=branch-1",
        sourceText: "Ein anderer Text",
        createdAt: null,
        updatedAt: null,
        userId: "user-1",
        dossierId: "dossier-1",
        selectedActionHint: "create_dossier",
      },
      runtimeLinkages: [
        buildRuntimeLinkage({
          linkedWorkspace: {
            workspace: buildWorkspace(),
            linkageMode: "workspace_source_draft",
          },
        }),
      ],
    });

    expect(correlation.correlationStrength).toBe("partial");
    expect(correlation.correlationBasis).toBe("existing_runtime_readmodel");
  });

  it("keeps text-only matches as suggested", () => {
    const correlation = buildAccountContributionHandoffCorrelation({
      contributionRef: {
        id: "ledger-4",
        kind: "ledger_branch",
        title: "Sicherer Schulweg",
        summary: "Branch",
        href: "/create?draftId=ledger-4&branchId=branch-1",
        sourceText: "Wir brauchen sichere Schulwege rund um die Grundschule.",
        createdAt: null,
        updatedAt: null,
        userId: "user-9",
      },
      runtimeLinkages: [buildRuntimeLinkage()],
    });

    expect(correlation.correlationStrength).toBe("suggested");
    expect(correlation.correlationBasis).toBe("text_similarity_suggestion");
  });

  it("does not upgrade text-only matches to exact or strong", () => {
    const correlation = buildAccountContributionHandoffCorrelation({
      contributionRef: {
        id: "ledger-5",
        kind: "ledger_branch",
        title: "Sicherer Schulweg",
        summary: "Branch",
        href: "/create?draftId=ledger-5&branchId=branch-1",
        sourceText: "Wir brauchen sichere Schulwege rund um die Grundschule.",
        createdAt: null,
        updatedAt: null,
        userId: "user-9",
      },
      runtimeLinkages: [buildRuntimeLinkage()],
    });

    expect(correlation.correlationStrength).not.toBe("exact");
    expect(correlation.correlationStrength).not.toBe("strong");
  });

  it("reports missing when no safe evidence exists", () => {
    const correlation = buildAccountContributionHandoffCorrelation({
      contributionRef: {
        id: "ledger-6",
        kind: "ledger_branch",
        title: "Parkplätze",
        summary: "Branch",
        href: "/create?draftId=ledger-6&branchId=branch-1",
        sourceText: "Mehr Parkplätze in der Innenstadt.",
        createdAt: null,
        updatedAt: null,
        userId: "user-2",
      },
      runtimeLinkages: [buildRuntimeLinkage()],
    });

    expect(correlation.correlationStrength).toBe("missing");
    expect(correlation.persistedHandoffRef).toBeNull();
  });
});

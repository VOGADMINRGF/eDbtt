import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryPersistedCreateHandoffRepo,
  getPersistedCreateHandoffRecord,
  setPersistedCreateHandoffRepoForTests,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  createInMemoryDossierStudioWorkspaceRepo,
  setDossierStudioWorkspaceRepoForTests,
} from "@features/dossier/server/studioPersistence";
import {
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

import { GET } from "@/app/api/create/handoffs/[handoffId]/route";
import { POST as persistRoute } from "@/app/api/create/handoffs/route";

const draftPayload = {
  id: "create-handoff-route-1",
  source: "create",
  sourceText: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
  plannerResult: {
    source: "heuristic_fallback",
    plannerSource: "heuristic_fallback",
    plannerProvider: "none",
    plannerRole: "planner_only",
    plannerTopic: "Schulsanierung im Bezirk",
    plannerCore: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
    plannerScope: ["district"],
    plannerStance: "open",
    plannerClusters: ["Bildung"],
    plannerOpenQuestions: ["Welche Standorte haben Priorität?"],
    shortSummary: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
    topicCandidates: ["Schulsanierung"],
    clusterCandidates: ["Bildung"],
    scopeCandidates: ["district"],
    stance: "open",
    openQuestions: ["Welche Standorte haben Priorität?"],
    graphSearchTerms: ["Schulsanierung Reinickendorf"],
    materialSignals: [],
    recommendedLane: "standard",
    providerPlan: {
      lane: "standard",
      plannerProvider: "none",
      plannerRole: "planner_only",
      structureProvider: "mistral",
      summaryProvider: "claude",
      researchUsed: "none",
      researchProvider: null,
      deepSearchUsed: false,
      graphMatch: "after_structure",
    },
    permissions: {
      nonMutative: true,
      canPublish: false,
      canSave: false,
      canMerge: false,
      canDeepSearch: false,
    },
    plannerDegraded: false,
    degradedReason: null,
    plannerDegradedReason: null,
    qualityStatus: "specific",
    qualityIssues: [],
    providerCallAttempted: false,
    providerCallSucceeded: false,
    plannerDebug: {
      attemptedProvider: null,
      usedProvider: "none",
      providerAvailable: false,
      rawPayloadValid: true,
      rawTextValid: true,
      normalizedPayloadValid: true,
      qualityGatePassed: true,
    },
  },
  graphMatches: {
    stage: "after_structure",
    prepared: true,
    requiresConfirmation: true,
    searchTerms: ["Schulsanierung Reinickendorf"],
    matches: [],
    matchedTopics: ["Schulsanierung"],
    matchedDossiers: [],
    matchedClaims: [],
    matchedAnlassraeume: [],
    matchedVotes: [],
    shouldCreateNewTopic: true,
  },
  selectedAction: "create_dossier",
  claims: [
    {
      id: "claim-1",
      text: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
      kind: "factual_claim",
      factcheckEligible: true,
      sourceRefs: ["source-text"],
    },
  ],
  arguments: [],
  openQuestions: [
    {
      id: "question-1",
      question: "Welche Standorte haben Priorität?",
      requiredBeforePublish: true,
    },
  ],
  sourceGrounding: [
    {
      id: "source-text",
      label: "Ausgangstext",
      status: "source_text",
      detail: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
    },
  ],
  topicSeed: {
    topicKey: "schulsanierung-im-bezirk",
    topicLabel: "Schulsanierung im Bezirk",
    jurisdiction: "kommune",
    themenradarSourceType: "create_intake",
  },
  resumeHref: "/create?resume=create_handoff&handoffId=create-handoff-route-1",
  reviewState: "ready_for_confirmation",
  visibilityState: "internal_review",
  requiresConfirmation: true,
  createdAt: "2026-05-19T09:00:00.000Z",
} as const;

describe("/api/create/handoffs", () => {
  beforeEach(async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "user-1" },
      roles: ["organization_member"],
      sessionValid: true,
    });
    setPersistedCreateHandoffRepoForTests(createInMemoryPersistedCreateHandoffRepo());
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [
          {
            id: "org-reinickendorf-1",
            name: "Bezirksamt Reinickendorf",
            type: "district_office",
            countryCode: "DE",
            primaryRegionId: "bezirk-berlin-reinickendorf",
            website: "https://reinickendorf.example",
            verificationStatus: "organization_verified",
            createdByUserId: "admin-1",
          },
        ],
        memberships: [
          {
            id: "membership-1",
            userId: "user-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: "unit-1",
            unitName: "Beteiligung",
            optionalLocation: null,
            roleLabel: "Beteiligung",
            roleType: "participation_officer",
            verificationStatus: "unit_verified",
            allowedActions: ["read_region_dashboard", "create_dossier_draft"],
            createdAt: "2026-05-19T08:00:00.000Z",
            updatedAt: "2026-05-19T08:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-19T08:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    const workspaceRepo = createInMemoryDossierStudioWorkspaceRepo();
    await workspaceRepo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-1",
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      source: "manual_editor",
      title: "Schulsanierung Studio",
      createdBy: "user-1",
      updatedBy: "user-1",
    });
    setDossierStudioWorkspaceRepoForTests(workspaceRepo);
  });

  it("persists a create handoff as a reviewpflichtiger working state", async () => {
    const req = new NextRequest("http://localhost/api/create/handoffs", {
      method: "POST",
      body: JSON.stringify({
        draft: draftPayload,
        dossierId: "dossier-1",
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await persistRoute(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.record).toMatchObject({
      id: "create-handoff-route-1",
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      dossierId: "dossier-1",
    });

    const stored = await getPersistedCreateHandoffRecord("create-handoff-route-1");
    expect(stored).toMatchObject({
      reviewRequired: true,
      noAutoPublish: true,
      noPublicOfficial: true,
      selectedAction: "create_dossier",
    });
  });

  it("loads the persisted handoff again for later continuation", async () => {
    await persistRoute(
      new NextRequest("http://localhost/api/create/handoffs", {
        method: "POST",
        body: JSON.stringify({ draft: draftPayload, dossierId: "dossier-1" }),
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await GET(new Request("http://localhost/api/create/handoffs/create-handoff-route-1"), {
      params: Promise.resolve({ handoffId: "create-handoff-route-1" }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.draft).toMatchObject({
      id: "create-handoff-route-1",
      sourceText: "Die Schulsanierung im Bezirk braucht einen belastbaren Überblick.",
      selectedAction: "create_dossier",
    });
    expect(body.context).toMatchObject({
      regionId: "bezirk-berlin-reinickendorf",
      organizationId: "org-reinickendorf-1",
      dossierId: "dossier-1",
    });
  });

  it("rejects persisting a handoff into a foreign organization workspace", async () => {
    const workspaceRepo = createInMemoryDossierStudioWorkspaceRepo();
    await workspaceRepo.createOrGetDossierStudioWorkspace({
      dossierId: "dossier-foreign",
      regionId: "bezirk-berlin-spandau",
      organizationId: "org-spandau-1",
      source: "manual_editor",
      title: "Spandau Studio",
      createdBy: "staff-2",
      updatedBy: "staff-2",
    });
    setDossierStudioWorkspaceRepoForTests(workspaceRepo);

    const response = await persistRoute(
      new NextRequest("http://localhost/api/create/handoffs", {
        method: "POST",
        body: JSON.stringify({
          draft: draftPayload,
          dossierId: "dossier-foreign",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "create_handoff_scope_forbidden",
    });
    expect(response.status).toBe(403);
  });
});

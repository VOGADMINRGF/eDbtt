import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
  entityCol: vi.fn(),
  createManualAnlassraum: vi.fn(),
  getAnlassraumPublishGate: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGovernanceActorOrResponse(...args),
}));

vi.mock("@features/entities/db", () => ({
  entityCol: (...args: unknown[]) => mocks.entityCol(...args),
}));

vi.mock("@features/anlassraum/service", () => ({
  createManualAnlassraum: (...args: unknown[]) => mocks.createManualAnlassraum(...args),
}));

vi.mock("@features/anlassraum/governance", () => ({
  getAnlassraumPublishGate: (...args: unknown[]) => mocks.getAnlassraumPublishGate(...args),
}));

import { POST as createAnlassraumPOST } from "@/app/api/admin/governance/anlassraum/route";

describe("admin governance anlassraum route journalism guardrails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "editor_1",
        role: "editorial_actor",
        isAdmin: false,
        scopedOwnerIds: [],
      },
    });
    mocks.entityCol.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue({
        type: "media",
        ownerType: "media",
        ownerId: "media_owner_1",
        stewardUserId: null,
      }),
    });
    mocks.createManualAnlassraum.mockResolvedValue({
      anlassraumId: new ObjectId("507f1f77bcf86cd799439011"),
    });
    mocks.getAnlassraumPublishGate.mockResolvedValue({
      ok: false,
      reasons: ["missing_structured_claims"],
      sourceCount: 0,
      requiredSourceCount: 2,
      evidence: {
        sourceCount: 0,
        primarySources: 0,
        supportingSources: 0,
        counterSources: 0,
        contextSources: 0,
        uniquePublishers: 0,
        weightedSourceScore: 0,
        claimCount: 0,
        questionCount: 0,
        noteCount: 0,
      },
    });
  });

  it("returns journalism truth guardrails for source_anchor context", async () => {
    const req = new NextRequest("http://localhost/api/admin/governance/anlassraum", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entityId: "507f1f77bcf86cd799439012",
        type: "policy",
        title: "Quellenlage zur Schulwegsicherheit",
        summary: "Start aus redaktionellem Beitrag.",
        topicKey: "schulwegsicherheit",
        scope: "local",
        decisionScope: "local",
        ownerType: "media",
        ownerId: "media_owner_1",
        originType: "source_anchor",
        roomType: "community",
      }),
    });

    const res = await createAnlassraumPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.ok).toBe(true);
    expect(body?.meta?.journalismTruthGuardrails?.sourceAnchorContext).toBe(true);
    expect(body?.meta?.journalismTruthGuardrails?.deniesTruthPrivilege).toBe(true);
    expect(body?.meta?.journalismTruthGuardrails?.deniesFactcheckStatusDerivation).toBe(true);
    expect(body?.meta?.journalismCompanionContract?.sourceAnchorContext).toBe(true);
    expect(body?.meta?.journalismCompanionContract?.publicConnection).toBe(true);
    expect(body?.meta?.journalismCompanionContract?.channels).toContain("open_dossier_companion");
    expect(body?.meta?.journalismCompanionContract?.channels).toContain("embed");
    expect(body?.meta?.journalismCompanionContract?.channels).toContain("qr");
    expect(body?.meta?.journalismRoleProfile?.roleProfile).toBe("editorial_team");
    expect(body?.meta?.journalismRoleProfile?.allowedActions).toContain("attach_companion_context");
    expect(body?.meta?.journalismRoleProfile?.forbidsTruthPrivilege).toBe(true);
    expect(body?.meta?.journalismConsistency?.ok).toBe(true);
    expect(body?.meta?.municipalResponsibilityGuardrails?.institutionalContext).toBe(false);
    expect(body?.meta?.municipalResponsibilityGuardrails?.monitoringFirst).toBe(true);
    expect(body?.meta?.municipalProcessStatus?.currentStatus).toBe("beobachtet");
    expect(body?.meta?.municipalProcessStatus?.guardrails?.requiresMonitoringFirst).toBe(true);
    expect(body?.meta?.municipalGovernanceMode?.governanceMode).toBe("monitoring_only");
    expect(body?.meta?.municipalGovernanceMode?.visibleGates).toEqual([
      "monitoring_first",
      "no_truth_or_priority_inference",
    ]);
    expect(body?.meta?.municipalRoleGovernance?.roleProfile).toBe("public_monitoring");
    expect(body?.meta?.municipalRoleGovernance?.allowedActions).toEqual(["view_monitoring_meta"]);
    expect(body?.meta?.municipalRoleGovernanceConsistency?.ok).toBe(true);
    expect(body?.meta?.fundingImpactLifecycle?.supportScope).toBe("anlassraum");
    expect(body?.meta?.fundingImpactLifecycle?.impactStatus).toBe("not_started");
    expect(body?.meta?.fundingImpactLifecycle?.refundingStatus).toBe("none");
    expect(body?.meta?.orgContextAttachment?.orgContextEnabled).toBe(true);
    expect(body?.meta?.orgContextAttachment?.orgContextProfile).toBe("media_house");
    expect(body?.meta?.orgContextAttachment?.attachmentMode).toBe("anlassraum_primary");
    expect(body?.meta?.orgContextAttachment?.guardrails?.forbidsParallelDomain).toBe(true);
    expect(body?.meta?.orgContextConsistency?.ok).toBe(true);
  });

  it("keeps guardrails active for non-source origins", async () => {
    const req = new NextRequest("http://localhost/api/admin/governance/anlassraum", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entityId: "507f1f77bcf86cd799439012",
        type: "policy",
        title: "Kommunaler Anlass ohne Quellenanker",
        summary: "Regulaerer Start.",
        topicKey: "kommunale-pruefung",
        scope: "local",
        ownerType: "media",
        ownerId: "media_owner_1",
        originType: "manual",
        roomType: "editorial",
      }),
    });

    const res = await createAnlassraumPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.meta?.journalismTruthGuardrails?.sourceAnchorContext).toBe(false);
    expect(body?.meta?.journalismTruthGuardrails?.deniesPriorityPrivilege).toBe(true);
    expect(body?.meta?.journalismTruthGuardrails?.allowsReviewQueueConnection).toBe(true);
    expect(body?.meta?.journalismCompanionContract?.publicConnection).toBe(false);
    expect(body?.meta?.journalismCompanionContract?.companionSurface).toBe("editorial_context");
    expect(body?.meta?.journalismCompanionContract?.allowsEmbedConnection).toBe(true);
    expect(body?.meta?.journalismCompanionContract?.allowsQrConnection).toBe(false);
    expect(body?.meta?.journalismRoleProfile?.roleProfile).toBe("publisher_context");
    expect(body?.meta?.journalismRoleProfile?.allowedActions).toContain("manage_format_context");
    expect(body?.meta?.journalismConsistency?.ok).toBe(true);
    expect(body?.meta?.municipalResponsibilityGuardrails?.institutionalContext).toBe(false);
    expect(body?.meta?.municipalResponsibilityGuardrails?.deniesScoringPrivilege).toBe(true);
    expect(body?.meta?.municipalProcessStatus?.allowedTransitions).toEqual(["beobachtet"]);
    expect(body?.meta?.municipalGovernanceMode?.governanceMode).toBe("monitoring_only");
    expect(body?.meta?.municipalRoleGovernance?.roleProfile).toBe("public_monitoring");
    expect(body?.meta?.municipalRoleGovernanceConsistency?.ok).toBe(true);
    expect(body?.meta?.fundingImpactLifecycle?.anlassraumId).toBe(body?.id);
    expect(body?.meta?.orgContextAttachment?.orgContextEnabled).toBe(true);
    expect(body?.meta?.orgContextAttachment?.orgContextProfile).toBe("media_house");
    expect(body?.meta?.orgContextAttachment?.compatibility?.supportsTeamContext).toBe(true);
    expect(body?.meta?.orgContextConsistency?.ok).toBe(true);
  });

  it("marks municipality/official contexts as institutional responsibility scope", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: {
        userId: "inst_1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: [],
      },
    });
    mocks.entityCol.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue({
        type: "organization",
        ownerType: "municipality",
        ownerId: "muni_owner_1",
        stewardUserId: null,
      }),
    });

    const req = new NextRequest("http://localhost/api/admin/governance/anlassraum", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        entityId: "507f1f77bcf86cd799439012",
        type: "policy",
        title: "Kommunaler Infrastrukturstatus",
        summary: "Monitoring-first Kontext.",
        topicKey: "infrastruktur",
        scope: "local",
        ownerType: "municipality",
        ownerId: "muni_owner_1",
        originType: "official",
        roomType: "official",
      }),
    });

    const res = await createAnlassraumPOST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body?.meta?.journalismCompanionContract?.companionSurface).toBe("restricted_context");
    expect(body?.meta?.journalismCompanionContract?.allowsQrConnection).toBe(false);
    expect(body?.meta?.journalismRoleProfile?.roleProfile).toBe("public_journalism_context");
    expect(body?.meta?.journalismConsistency?.ok).toBe(true);
    expect(body?.meta?.municipalResponsibilityGuardrails?.institutionalContext).toBe(true);
    expect(body?.meta?.municipalResponsibilityGuardrails?.allowsResponsibilityContext).toBe(true);
    expect(body?.meta?.municipalResponsibilityGuardrails?.allowedScopes).toContain("amt");
    expect(body?.meta?.municipalResponsibilityGuardrails?.deniesOverrideOfAnlassraumDossierMandate).toBe(true);
    expect(body?.meta?.municipalProcessStatus?.currentStatus).toBe("beobachtet");
    expect(body?.meta?.municipalProcessStatus?.allowedTransitions).toContain("in_pruefung");
    expect(body?.meta?.municipalGovernanceMode?.governanceMode).toBe("institutional_followup");
    expect(body?.meta?.municipalGovernanceMode?.visibleGates).toContain("release_reason_required");
    expect(body?.meta?.municipalGovernanceMode?.guardrails?.requiresAuditTrail).toBe(true);
    expect(body?.meta?.municipalRoleGovernance?.roleProfile).toBe("institution_leadership");
    expect(body?.meta?.municipalRoleGovernance?.allowedActions).toContain("approve_public_trace_release");
    expect(body?.meta?.municipalRoleGovernanceConsistency?.ok).toBe(true);
    expect(body?.meta?.fundingImpactLifecycle?.guardrails?.keepsProjectBasedMatching).toBe(true);
    expect(body?.meta?.orgContextAttachment?.orgContextEnabled).toBe(true);
    expect(body?.meta?.orgContextAttachment?.orgContextProfile).toBe("institutional_organization");
    expect(body?.meta?.orgContextAttachment?.compatibility?.supportsMunicipalContext).toBe(true);
    expect(body?.meta?.orgContextConsistency?.ok).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import {
  parseOrgContextAttachmentContract,
  resolveOrgContextAttachmentContract,
  validateOrgContextAttachmentConsistency,
} from "@features/anlassraum/orgContextAttachmentContract";

describe("org context attachment contract", () => {
  it("anchors media-house org context to anlassraum without parallel-domain privileges", () => {
    const contract = resolveOrgContextAttachmentContract({
      ownerType: "media",
      roomType: "editorial",
      actorRole: "editorial_actor",
      ownerId: "media_org_1",
      anlassraumId: "anlass_1",
      dossierId: null,
    });

    expect(contract.orgContextEnabled).toBe(true);
    expect(contract.orgContextProfile).toBe("media_house");
    expect(contract.attachmentMode).toBe("anlassraum_primary");
    expect(contract.compatibility.supportsJournalismContext).toBe(true);
    expect(contract.guardrails.forbidsTruthPrivilege).toBe(true);
    expect(contract.guardrails.forbidsPriorityPrivilege).toBe(true);
    expect(contract.guardrails.forbidsParallelDomain).toBe(true);
  });

  it("keeps non-organizational owners outside org context", () => {
    const contract = resolveOrgContextAttachmentContract({
      ownerType: "community",
      roomType: "community",
      actorRole: "community",
      ownerId: "community_owner_1",
      anlassraumId: null,
      dossierId: null,
    });

    expect(contract.orgContextEnabled).toBe(false);
    expect(contract.orgContextProfile).toBe("none");
    expect(contract.attachmentMode).toBe("none");
    expect(contract.compatibility.pricingSegmentHints).toEqual(["public_free"]);
  });

  it("flags cross-domain mismatch for institutional context when org profile is not institutional", () => {
    const contract = resolveOrgContextAttachmentContract({
      ownerType: "media",
      roomType: "community",
      actorRole: "editorial_actor",
      ownerId: "media_org_1",
      anlassraumId: "anlass_1",
      dossierId: null,
    });

    const consistency = validateOrgContextAttachmentConsistency({
      contract,
      municipalInstitutionalContext: true,
      pricingSegment: "team_organization",
      fundingSupportScope: "anlassraum",
    });

    expect(consistency.ok).toBe(false);
    expect(consistency.issues).toContain("institutional_context_requires_institutional_org_profile");
  });

  it("returns parse issues for invalid enabled contract states", () => {
    const parsed = parseOrgContextAttachmentContract({
      orgContextEnabled: true,
      ownerType: "organization",
      roomType: "community",
      actorRole: "admin",
      orgContextProfile: "none",
      attachmentMode: "none",
      contextRelationship: "owner_scoped",
      orgOwnerId: null,
      anlassraumId: null,
      dossierId: null,
      compatibility: {
        supportsJournalismContext: false,
        supportsMunicipalContext: false,
        supportsTeamContext: false,
        pricingSegmentHints: ["public_free"],
        fundingScopeHints: ["anlassraum"],
      },
      explainability: {
        reasonRequired: true,
        auditFieldsRequired: [
          "orgContextProfile",
          "attachmentMode",
          "orgOwnerId",
          "anlassraumId",
          "dossierId",
          "changedBy",
          "changedAt",
          "source",
        ],
      },
      guardrails: {
        keepsAnlassraumAsCore: true,
        keepsDossierAsUpperContext: true,
        forbidsParallelDomain: true,
        forbidsTruthPrivilege: true,
        forbidsPriorityPrivilege: true,
        forbidsVotingPrivilege: true,
        forbidsFactStatusPrivilege: true,
      },
    });

    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.issues).toContain("orgContextProfile:enabled_org_context_requires_non_none_profile");
      expect(parsed.issues).toContain("anlassraumId:enabled_org_context_requires_anlassraum_id");
    }
  });
});

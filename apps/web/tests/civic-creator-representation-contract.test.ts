import { describe, expect, it } from "vitest";
import {
  parseCivicCreatorRepresentationContract,
  resolveCivicCreatorRepresentationContract,
  validateCivicCreatorRepresentationConsistency,
} from "@features/anlassraum/civicCreatorRepresentationContract";

describe("civic creator representation contract", () => {
  it("keeps civic participants on non-privileged participation profile", () => {
    const contract = resolveCivicCreatorRepresentationContract({
      actorRole: "community",
      ownerType: "community",
      originType: "manual",
      roomType: "community",
    });

    expect(contract.workProfile).toBe("anlassraum_host");
    expect(contract.allowsAnlassraumOpen).toBe(true);
    expect(contract.allowsDossierCompanionCuration).toBe(false);
    expect(contract.representationAxes.topic).toBe("context_visible");
    expect(contract.representationAxes.region).toBe("none");
    expect(contract.guardrails.forbidsTruthPrivilege).toBe(true);
  });

  it("maps editorial source-anchor contexts to dossier companion profile", () => {
    const contract = resolveCivicCreatorRepresentationContract({
      actorRole: "editorial_actor",
      ownerType: "media",
      originType: "source_anchor",
      roomType: "editorial",
    });

    expect(contract.workProfile).toBe("publisher_team_context");
    expect(contract.workLevel).toBe("dossier_companion");
    expect(contract.allowsCompanionEmbedQrUsage).toBe(true);
    expect(contract.allowsDossierCompanionCuration).toBe(true);
    expect(contract.representationAxes.topic).toBe("context_curator");
  });

  it("keeps municipality/official contexts on org-context profile with region visibility", () => {
    const contract = resolveCivicCreatorRepresentationContract({
      actorRole: "admin",
      ownerType: "municipality",
      originType: "official",
      roomType: "official",
    });

    expect(contract.workProfile).toBe("org_context_actor");
    expect(contract.representationAxes.region).toBe("context_visible");
    expect(contract.guardrails.forbidsPriorityPrivilege).toBe(true);
    expect(contract.guardrails.forbidsFactStatusPrivilege).toBe(true);
  });

  it("flags consistency mismatch when institutional context misses region visibility", () => {
    const parsed = parseCivicCreatorRepresentationContract({
      actorRole: "institutional_actor",
      ownerType: "municipality",
      originType: "official",
      roomType: "official",
      workProfile: "org_context_actor",
      workLevel: "organization_followup",
      allowsAnlassraumOpen: true,
      allowsAnlassraumHosting: true,
      allowsAnlassraumContinuation: true,
      allowsDossierCompanionCuration: false,
      allowsCompanionEmbedQrUsage: false,
      allowsStreamCompanionUsage: false,
      allowsOnlyParticipation: false,
      representationAxes: {
        topic: "context_visible",
        region: "none",
        separatedAxes: true,
        forbidsCrossAxisShortcut: true,
      },
      compatibility: {
        supportsSmallFormats: true,
        supportsSoloCreators: true,
        supportsRegionalMedia: true,
        supportsPublisherTeams: true,
        supportsOrganizationContexts: true,
      },
      allowedActions: [
        "participate_publicly",
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
        "add_org_context_note",
      ],
      reasonAuditRequiredActions: [
        "open_anlassraum",
        "host_anlassraum_context",
        "continue_anlassraum_context",
        "add_org_context_note",
      ],
      explainability: {
        reasonRequired: true,
        auditFieldsRequired: [
          "workProfile",
          "workLevel",
          "topicRepresentation",
          "regionRepresentation",
          "changedBy",
          "changedAt",
          "source",
        ],
      },
      guardrails: {
        keepsAnlassraumInitiable: true,
        keepsDossierAsUpperContext: true,
        keepsCompanionBoundToOpenDossierCore: true,
        forbidsTruthPrivilege: true,
        forbidsPriorityPrivilege: true,
        forbidsVotingPrivilege: true,
        forbidsFactStatusPrivilege: true,
        forbidsReachPrivilege: true,
        forbidsParallelDomain: true,
      },
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const consistency = validateCivicCreatorRepresentationConsistency({
      contract: parsed.value,
      journalismRoleProfile: "public_journalism_context",
      orgContextProfile: "institutional_organization",
      municipalInstitutionalContext: true,
    });

    expect(consistency.ok).toBe(false);
    expect(consistency.issues).toContain("municipal_institutional_context_requires_region_representation_visibility");
  });
});

import { describe, expect, it } from "vitest";
import {
  parseOrgPublisherTeamContextContract,
  resolveOrgPublisherTeamContextContract,
  validateOrgPublisherTeamContextConsistency,
} from "@features/anlassraum/orgPublisherTeamContextContract";

describe("org publisher team context contract", () => {
  it("resolves publisher/editorial context without truth or priority privileges", () => {
    const contract = resolveOrgPublisherTeamContextContract({
      ownerType: "media",
      roomType: "editorial",
      actorRole: "editorial_actor",
      orgContextProfile: "media_house",
      journalismRoleProfile: "publisher_context",
      civicWorkProfile: "publisher_team_context",
      lifecycleStatus: "dossier_linked",
      topicRepresentation: "context_curator",
      regionRepresentation: "none",
      allowsCompanionBinding: true,
      allowsStreamBinding: true,
      allowsDossierBinding: true,
    });

    expect(contract.primaryContext).toBe("publisher_context");
    expect(contract.activeContexts).toContain("editorial_team_context");
    expect(contract.allowedBindings.anlassraum).toBe(true);
    expect(contract.guardrails.forbidsTruthPrivilege).toBe(true);
    expect(contract.guardrails.forbidsPriorityPrivilege).toBe(true);
  });

  it("keeps association contexts as civic-collective compatible without publisher mixing", () => {
    const contract = resolveOrgPublisherTeamContextContract({
      ownerType: "association",
      roomType: "community",
      actorRole: "community",
      orgContextProfile: "association",
      journalismRoleProfile: "public_journalism_context",
      civicWorkProfile: "anlassraum_host",
      lifecycleStatus: "accompanied",
      topicRepresentation: "context_visible",
      regionRepresentation: "none",
      allowsCompanionBinding: false,
      allowsStreamBinding: false,
      allowsDossierBinding: false,
    });

    expect(contract.primaryContext).toBe("association_context");
    expect(contract.activeContexts).toContain("civic_collective_context");
    expect(contract.activeContexts).not.toContain("publisher_context");
    expect(contract.guardrails.forbidsPublisherAsDossierHoheit).toBe(true);
  });

  it("flags consistency issues for region visibility without topic visibility", () => {
    const parsed = parseOrgPublisherTeamContextContract({
      ownerType: "organization",
      roomType: "official",
      actorRole: "institutional_actor",
      orgContextProfile: "institutional_organization",
      journalismRoleProfile: "public_journalism_context",
      civicWorkProfile: "org_context_actor",
      lifecycleStatus: "open_followup",
      primaryContext: "org_context",
      activeContexts: ["org_context"],
      allowedBindings: {
        anlassraum: true,
        dossier: false,
        companion: false,
        stream: false,
      },
      visibility: {
        contextVisible: true,
        carrierVisible: true,
        responsibilityVisible: true,
      },
      separation: {
        topicRepresentation: "none",
        regionRepresentation: "context_visible",
        separatedAxes: true,
        forbidsCrossAxisShortcut: true,
      },
      compatibility: {
        supportsSoloActors: true,
        supportsSmallCreators: true,
        supportsRegionalMedia: true,
        supportsEditorialTeams: true,
        supportsAssociations: true,
        supportsInstitutionalOrgs: true,
      },
      guardrails: {
        keepsAnlassraumOpen: true,
        keepsDossierAsUpperContext: true,
        keepsOrgContextAsCarrierNotTruth: true,
        keepsPublisherContextAsFormatNotPriority: true,
        keepsThemeRegionSeparated: true,
        forbidsTruthPrivilege: true,
        forbidsPriorityPrivilege: true,
        forbidsVotingPrivilege: true,
        forbidsFactStatusPrivilege: true,
        forbidsOrgAsThemeOwnership: true,
        forbidsOrgAsRegionOwnership: true,
        forbidsPublisherAsDossierHoheit: true,
        forbidsTeamAsPriorityAutomatism: true,
      },
      forbiddenShortcuts: [
        "org_context_is_not_truth",
        "org_context_is_not_priority",
        "publisher_context_is_not_dossier_hoheit",
        "team_context_is_not_priority_automation",
        "org_context_is_not_theme_or_region_ownership",
      ],
    });

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const consistency = validateOrgPublisherTeamContextConsistency({
      contract: parsed.value,
    });

    expect(consistency.ok).toBe(false);
    expect(consistency.issues).toContain(
      "region_representation_without_topic_representation_creates_axis_shortcut",
    );
  });

  it("rejects stream/companion lifecycle without companion binding", () => {
    const parsed = parseOrgPublisherTeamContextContract({
      ownerType: "media",
      roomType: "editorial",
      actorRole: "editorial_actor",
      orgContextProfile: "media_house",
      journalismRoleProfile: "editorial_team",
      civicWorkProfile: "editorial_dossier_host",
      lifecycleStatus: "stream_active",
      primaryContext: "editorial_team_context",
      activeContexts: ["editorial_team_context"],
      allowedBindings: {
        anlassraum: true,
        dossier: true,
        companion: false,
        stream: true,
      },
      visibility: {
        contextVisible: true,
        carrierVisible: true,
        responsibilityVisible: true,
      },
      separation: {
        topicRepresentation: "context_curator",
        regionRepresentation: "none",
        separatedAxes: true,
        forbidsCrossAxisShortcut: true,
      },
      compatibility: {
        supportsSoloActors: true,
        supportsSmallCreators: true,
        supportsRegionalMedia: true,
        supportsEditorialTeams: true,
        supportsAssociations: true,
        supportsInstitutionalOrgs: true,
      },
      guardrails: {
        keepsAnlassraumOpen: true,
        keepsDossierAsUpperContext: true,
        keepsOrgContextAsCarrierNotTruth: true,
        keepsPublisherContextAsFormatNotPriority: true,
        keepsThemeRegionSeparated: true,
        forbidsTruthPrivilege: true,
        forbidsPriorityPrivilege: true,
        forbidsVotingPrivilege: true,
        forbidsFactStatusPrivilege: true,
        forbidsOrgAsThemeOwnership: true,
        forbidsOrgAsRegionOwnership: true,
        forbidsPublisherAsDossierHoheit: true,
        forbidsTeamAsPriorityAutomatism: true,
      },
      forbiddenShortcuts: [
        "org_context_is_not_truth",
        "org_context_is_not_priority",
        "publisher_context_is_not_dossier_hoheit",
        "team_context_is_not_priority_automation",
        "org_context_is_not_theme_or_region_ownership",
      ],
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(
      parsed.issues.some((issue) =>
        issue.includes("companion_or_stream_lifecycle_requires_companion_binding"),
      ),
    ).toBe(true);
  });
});

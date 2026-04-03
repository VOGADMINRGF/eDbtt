import { describe, expect, it } from "vitest";
import {
  buildCivicCreatorImpactSupportBaseline,
  parseCivicCreatorImpactSupportContract,
  resolveCivicCreatorImpactSupportContract,
  validateCivicCreatorImpactSupportConsistency,
} from "@features/anlassraum/civicCreatorImpactSupportContract";
import { resolveCivicCreatorLifecycleContract } from "@features/anlassraum/civicCreatorLifecycleContract";
import { resolveCivicCreatorRepresentationContract } from "@features/anlassraum/civicCreatorRepresentationContract";

describe("civic creator impact support contract", () => {
  it("keeps initiated anlassraum contexts on lightweight support visibility", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "community",
      ownerType: "community",
      originType: "manual",
      roomType: "community",
    });
    const lifecycle = resolveCivicCreatorLifecycleContract({
      representationContract: representation,
      currentStatus: "initiated",
    });

    const support = buildCivicCreatorImpactSupportBaseline({
      lifecycleContract: lifecycle,
      representationContract: representation,
    });

    expect(support.lifecycleStatus).toBe("initiated");
    expect(support.supportTypes).toContain("participation_support");
    expect(support.supportTypes).toContain("documentation_support");
    expect(support.supportTypes).not.toContain("format_support");
    expect(support.supportTypes).not.toContain("followup_support");
  });

  it("enables dossier/format/followup support for editorial dossier-linked contexts", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "editorial_actor",
      ownerType: "media",
      originType: "source_anchor",
      roomType: "editorial",
    });
    const lifecycle = resolveCivicCreatorLifecycleContract({
      representationContract: representation,
      currentStatus: "dossier_linked",
      previousStatus: "accompanied",
    });

    const support = resolveCivicCreatorImpactSupportContract({
      lifecycleContract: lifecycle,
      representationContract: representation,
    });

    expect(support.supportTypes).toContain("format_support");
    expect(support.supportTypes).toContain("followup_support");
    expect(support.supportTypes).toContain("context_support");
    expect(support.supportTypes).not.toContain("regional_visibility_support");
    expect(support.impactContexts).toContain("dossier_followup_visible");
  });

  it("exposes stream context as trace only in stream_active lifecycle", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "editorial_actor",
      ownerType: "media",
      originType: "source_anchor",
      roomType: "editorial",
    });
    const lifecycle = resolveCivicCreatorLifecycleContract({
      representationContract: representation,
      currentStatus: "stream_active",
      previousStatus: "companion_active",
    });

    const support = resolveCivicCreatorImpactSupportContract({
      lifecycleContract: lifecycle,
      representationContract: representation,
    });

    expect(support.supportTypes).toContain("format_support");
    expect(support.impactContexts).toContain("stream_context_visible");
    expect(support.guardrails.forbidsTruthPrivilege).toBe(true);
    expect(support.guardrails.forbidsRankingBoostFromSupport).toBe(true);
  });

  it("rejects format/followup support in early lifecycle phases", () => {
    const parsed = parseCivicCreatorImpactSupportContract({
      lifecycleStatus: "open_followup",
      workProfile: "anlassraum_host",
      workLevel: "anlassraum_hosting",
      supportTypes: [
        "participation_support",
        "format_support",
        "followup_support",
        "documentation_support",
      ],
      impactContexts: ["participation_visible", "documentation_trace"],
      visibility: {
        publicCoreVisible: true,
        supportVisibleAsContext: true,
        impactVisibleAsTrace: true,
      },
      explainability: {
        reasonRequired: true,
        auditFieldsRequired: [
          "lifecycleStatus",
          "supportType",
          "impactContext",
          "changedBy",
          "changedAt",
          "source",
        ],
      },
      guardrails: {
        keepsAnlassraumOpen: true,
        keepsDossierAsUpperContext: true,
        keepsCompanionAsFormatNotTruth: true,
        keepsStreamAsFormatNotTruth: true,
        keepsSupportNonMonetaryByDefault: true,
        keepsTopicRegionSeparated: true,
        forbidsTruthPrivilege: true,
        forbidsPriorityPrivilege: true,
        forbidsVotingPrivilege: true,
        forbidsFactStatusPrivilege: true,
        forbidsAgendaMonopoly: true,
        forbidsRankingBoostFromSupport: true,
      },
      forbiddenMeanings: [
        "support_is_not_truth",
        "support_is_not_priority",
        "support_is_not_vote_weight",
        "support_is_not_fact_status",
        "support_is_not_institutional_hoheit",
      ],
    });

    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.issues.some((issue) => issue.includes("early_lifecycle_must_not_enable_format_or_followup_support"))).toBe(true);
  });

  it("flags institutional stream support as inconsistent", () => {
    const representation = resolveCivicCreatorRepresentationContract({
      actorRole: "editorial_actor",
      ownerType: "media",
      originType: "source_anchor",
      roomType: "editorial",
    });
    const lifecycle = resolveCivicCreatorLifecycleContract({
      representationContract: representation,
      currentStatus: "stream_active",
      previousStatus: "companion_active",
    });
    const support = resolveCivicCreatorImpactSupportContract({
      lifecycleContract: lifecycle,
      representationContract: representation,
    });

    const consistency = validateCivicCreatorImpactSupportConsistency({
      supportContract: support,
      lifecycleContract: lifecycle,
      representationContract: representation,
      journalismRoleProfile: "publisher_context",
      orgContextProfile: "institutional_organization",
    });

    expect(consistency.ok).toBe(false);
    expect(consistency.issues).toContain("institutional_organization_context_must_not_use_stream_active_support_mode");
  });
});

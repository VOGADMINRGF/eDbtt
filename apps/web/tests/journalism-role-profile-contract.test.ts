import { describe, expect, it } from "vitest";
import { resolveJournalismTruthGuardrails } from "@features/anlassraum/journalismGuardrails";
import { resolveJournalismCompanionContract } from "@features/anlassraum/journalismCompanionContract";
import {
  resolveJournalismRoleProfileContract,
  validateJournalismContractConsistency,
} from "@features/anlassraum/journalismRoleProfileContract";

describe("journalism role/profile contract", () => {
  it("maps editorial media contexts to publisher profile without truth privilege", () => {
    const contract = resolveJournalismRoleProfileContract({
      originType: "source_anchor",
      actorRole: "editorial_actor",
      ownerType: "media",
      roomType: "editorial",
    });

    expect(contract.roleProfile).toBe("publisher_context");
    expect(contract.allowedActions).toContain("manage_format_context");
    expect(contract.forbidsTruthPrivilege).toBe(true);
    expect(contract.forbidsFactcheckStatusDerivation).toBe(true);
    expect(contract.supportsSmallFormats).toBe(true);
  });

  it("keeps non-editorial actors in public journalism context", () => {
    const contract = resolveJournalismRoleProfileContract({
      originType: "manual",
      actorRole: "reviewer",
      ownerType: "community",
      roomType: "community",
    });

    expect(contract.roleProfile).toBe("public_journalism_context");
    expect(contract.allowedActions).toEqual(["view_open_dossier_context"]);
    expect(contract.reasonAuditRequiredActions).toEqual([]);
  });

  it("keeps small-format contexts on solo journalist profile", () => {
    const contract = resolveJournalismRoleProfileContract({
      originType: "source_anchor",
      actorRole: "editorial_actor",
      ownerType: "user",
      roomType: "community",
    });

    expect(contract.roleProfile).toBe("solo_journalist_creator");
    expect(contract.allowsSingleJournalistUsage).toBe(true);
    expect(contract.allowedActions).toContain("attach_companion_context");
  });

  it("validates consistency across truth, companion and role contracts", () => {
    const truth = resolveJournalismTruthGuardrails({ originType: "source_anchor" });
    const companion = resolveJournalismCompanionContract({
      originType: "source_anchor",
      roomType: "community",
    });
    const roleProfile = resolveJournalismRoleProfileContract({
      originType: "source_anchor",
      actorRole: "editorial_actor",
      ownerType: "media",
      roomType: "community",
    });

    const consistency = validateJournalismContractConsistency({
      truthGuardrails: truth,
      companionContract: companion,
      roleProfileContract: roleProfile,
    });

    expect(consistency.ok).toBe(true);
    expect(consistency.issues).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { resolveJournalismCompanionContract } from "@features/anlassraum/journalismCompanionContract";

describe("journalism companion contract", () => {
  it("keeps source_anchor companion flows public/open without truth or priority privilege", () => {
    const contract = resolveJournalismCompanionContract({
      originType: "source_anchor",
      roomType: "community",
    });

    expect(contract.sourceAnchorContext).toBe(true);
    expect(contract.publicConnection).toBe(true);
    expect(contract.companionSurface).toBe("public_open");
    expect(contract.channels).toContain("open_dossier_companion");
    expect(contract.channels).toContain("embed");
    expect(contract.channels).toContain("qr");
    expect(contract.forbidsTruthPrivilege).toBe(true);
    expect(contract.forbidsPriorityPrivilege).toBe(true);
  });

  it("keeps restricted contexts away from qr while preserving guardrails", () => {
    const contract = resolveJournalismCompanionContract({
      originType: "manual",
      roomType: "official",
    });

    expect(contract.publicConnection).toBe(false);
    expect(contract.companionSurface).toBe("restricted_context");
    expect(contract.allowsEmbedConnection).toBe(false);
    expect(contract.allowsQrConnection).toBe(false);
    expect(contract.channels).toEqual(["open_dossier_companion"]);
    expect(contract.forbidsParallelTruthChannel).toBe(true);
    expect(contract.requiresOpenDossierKernel).toBe(true);
  });

  it("allows embed in editorial contexts but keeps qr restricted", () => {
    const contract = resolveJournalismCompanionContract({
      originType: "source-anchor",
      roomType: "editorial",
    });

    expect(contract.sourceAnchorContext).toBe(true);
    expect(contract.companionSurface).toBe("editorial_context");
    expect(contract.allowsEmbedConnection).toBe(true);
    expect(contract.allowsQrConnection).toBe(false);
  });
});

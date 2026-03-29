import { describe, expect, it } from "vitest";
import { resolveJournalismTruthGuardrails } from "@features/anlassraum/journalismGuardrails";

describe("journalism truth guardrails", () => {
  it("keeps source_anchor as start context without truth or priority privilege", () => {
    const contract = resolveJournalismTruthGuardrails({ originType: "source_anchor" });

    expect(contract.sourceAnchorContext).toBe(true);
    expect(contract.anchorRole).toBe("journalistic_start_context");
    expect(contract.allowsWorkflowAccelerationOnly).toBe(true);
    expect(contract.deniesTruthPrivilege).toBe(true);
    expect(contract.deniesPriorityPrivilege).toBe(true);
    expect(contract.deniesFactcheckStatusDerivation).toBe(true);
    expect(contract.deniesFindingStatusDerivation).toBe(true);
    expect(contract.deniesDossierStatusDerivation).toBe(true);
    expect(contract.forbiddenInferences).toContain("truth_status_from_anchor");
  });

  it("treats non-source origins as standard context while preserving the same guardrails", () => {
    const contract = resolveJournalismTruthGuardrails({ originType: "manual" });

    expect(contract.sourceAnchorContext).toBe(false);
    expect(contract.anchorRole).toBe("standard_context");
    expect(contract.allowsWorkflowAccelerationOnly).toBe(false);
    expect(contract.requiresOpenQuestions).toBe(true);
    expect(contract.requiresCounterPerspectives).toBe(true);
    expect(contract.allowsFactcheckQueueConnection).toBe(true);
    expect(contract.allowsReviewQueueConnection).toBe(true);
    expect(contract.allowsDossierConnection).toBe(true);
  });

  it("normalizes source-anchor aliases case-insensitively", () => {
    const contract = resolveJournalismTruthGuardrails({ originType: "Source-Anchor" });
    expect(contract.sourceAnchorContext).toBe(true);
  });
});

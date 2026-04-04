import { describe, expect, it } from "vitest";
import {
  buildCreateIntentFallbackPath,
  parseCreateEntryIntent,
  parseCreateEntryMode,
  resolveCreateOrchestratorIntentContract,
} from "@/features/create/orchestratorIntentContract";

describe("create orchestrator intent contract", () => {
  it("keeps default create behavior stable without explicit entry intent", () => {
    const contract = resolveCreateOrchestratorIntentContract({
      canSubmitContribution: true,
      canSubmitStatement: true,
    });

    expect(contract.entryIntent).toBe("issue_signal");
    expect(contract.entryMode).toBe("guided");
    expect(contract.workspaceMode).toBe("contribution");
    expect(contract.createMode).toBe("source");
    expect(contract.routing.targetSurface).toBe("swipes");
  });

  it("maps explicit round setup to /runden oriented operating flow", () => {
    const contract = resolveCreateOrchestratorIntentContract({
      rawEntryIntent: "round_setup",
      rawEntryMode: "direct",
      canSubmitContribution: true,
      canSubmitStatement: true,
      selectedAnlassraumId: "65f000000000000000000011",
    });

    expect(contract.workspaceMode).toBe("contribution");
    expect(contract.createMode).toBe("manual");
    expect(contract.contextKind).toBe("round");
    expect(contract.goalKind).toBe("round_setup");
    expect(contract.routing.targetSurface).toBe("runden");
    expect(buildCreateIntentFallbackPath({ contract })).toBe("/runden");
  });

  it("keeps issue signal in statement/manual mode when explicit", () => {
    const contract = resolveCreateOrchestratorIntentContract({
      rawEntryIntent: "issue_signal",
      rawEntryMode: "guided",
      canSubmitContribution: true,
      canSubmitStatement: true,
    });

    expect(contract.workspaceMode).toBe("statement");
    expect(contract.createMode).toBe("manual");
    expect(contract.contextKind).toBe("anlassraum");
    expect(contract.analysisLayer.preservesOriginalInput).toBe(true);
    expect(contract.analysisLayer.suggestionsAreNonBinding).toBe(true);
    expect(contract.guardrails.forbidsTruthPrivilege).toBe(true);
    expect(contract.guardrails.forbidsPriorityPrivilege).toBe(true);
  });

  it("parses canonical entry intents and entry modes from aliases", () => {
    expect(parseCreateEntryIntent("source")).toBe("content_companion");
    expect(parseCreateEntryIntent("publisher_context")).toBe("org_context_setup");
    expect(parseCreateEntryMode("manual")).toBe("direct");
    expect(parseCreateEntryMode("ai")).toBe("guided");
  });
});

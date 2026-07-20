import { describe, expect, it } from "vitest";
import {
  VOXY_EXPERIENCE_LAYOUT_GUARD,
  buildVoxyExperienceShellContract,
  buildVoxyExperienceShellHint,
  buildVoxyExperienceShellSummaryCards,
} from "@/features/voxy/voxyExperienceShellContract";

describe("voxy experience shell contract", () => {
  it("keeps the shell tied to the completed slice and preserves the next codex_ready E2E follow-up", () => {
    const contract = buildVoxyExperienceShellContract();

    expect(contract.taskId).toBe("V3-VOXY-EXPERIENCE-SHELL-MOBILE-AGENTIC-INTEGRATION-01");
    expect(contract.statusInOpenTasks).toBe("done");
    expect(contract.nextCodexReadyTaskId).toBe("V3-AGENTIC-CIVIC-E2E-PILOT-01");
    expect(contract.integratedTaskIds).toContain("V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01");
    expect(contract.integratedTaskIds).toContain("V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01");
  });

  it("models passive, guided and active Voxy without forcing a personal companion on institutional segments", () => {
    const contract = buildVoxyExperienceShellContract();
    const passive = contract.modes.find((mode) => mode.id === "passive");
    const guided = contract.modes.find((mode) => mode.id === "guided");
    const active = contract.modes.find((mode) => mode.id === "active");

    expect(passive?.explicitUserActionRequired).toBe(false);
    expect(guided?.explicitUserActionRequired).toBe(false);
    expect(active?.explicitUserActionRequired).toBe(true);
    expect(contract.b2cPersonalCompanionConsentGated).toBe(true);
    expect(contract.b2bB2gNoPersonalCompanionForced).toBe(true);
    expect(active?.forcedForInstitutionalSegments).toBe(false);
  });

  it("keeps page, mobile and agentic shell semantics read-only and chip-first", () => {
    const contract = buildVoxyExperienceShellContract();
    const createSurface = contract.surfaces.find((surface) => surface.id === "create");
    const homeSurface = contract.surfaces.find((surface) => surface.id === "home");
    const themenSurface = contract.surfaces.find((surface) => surface.id === "themen");
    const adminSystemSurface = contract.surfaces.find((surface) => surface.id === "admin_system");

    expect(contract.pageShellVisible).toBe(true);
    expect(contract.mobileShellVisible).toBe(true);
    expect(contract.agenticFacadeVisible).toBe(true);
    expect(createSurface?.mobileShellPattern).toBe("chat_dock");
    expect(createSurface?.usesActionChips).toBe(true);
    expect(createSurface?.maxVisibleActionChips).toBe(4);
    expect(homeSurface?.pageShellRole).toBe("hero_guide_status");
    expect(themenSurface?.route).toBe("/themen");
    expect(themenSurface?.mobileShellPattern).toBe("assist_bar");
    expect(adminSystemSurface?.pageShellRole).toBe("operator_readiness_shell");
    expect(adminSystemSurface?.mayClaimRuntimeActive).toBe(false);
    expect(adminSystemSurface?.mayAutoPublish).toBe(false);
  });

  it("keeps agentic facade boundaries, layout guardrails and hints explicit", () => {
    const contract = buildVoxyExperienceShellContract();
    const summaryCards = buildVoxyExperienceShellSummaryCards(contract);

    expect(contract.noRuntimeActivation).toBe(true);
    expect(contract.noProviderLeaks).toBe(true);
    expect(contract.noPromptLeaks).toBe(true);
    expect(contract.noChainOfThoughtLeaks).toBe(true);
    expect(contract.noAutoPublish).toBe(true);
    expect(contract.noExternalNotification).toBe(true);
    expect(contract.noAutomaticEntitlementActivation).toBe(true);
    expect(contract.noAutomaticAdoption).toBe(true);
    expect(contract.noFakeAgentActivity).toBe(true);
    expect(VOXY_EXPERIENCE_LAYOUT_GUARD.noViewportOverflow).toBe(true);
    expect(VOXY_EXPERIENCE_LAYOUT_GUARD.mobileSafe).toBe(true);
    expect(VOXY_EXPERIENCE_LAYOUT_GUARD.noRawNavRegression).toBe(true);
    expect(VOXY_EXPERIENCE_LAYOUT_GUARD.safeHeightClassName).toBe("max-h-[70svh]");
    expect(summaryCards).toHaveLength(4);
    expect(summaryCards.map((card) => card.title)).toEqual([
      "Page Shell",
      "Mobile / PWA",
      "Agentic Fassade",
      "Grenzen",
    ]);
    expect(buildVoxyExperienceShellHint("home")).toContain("Hero, Guide und Status-Schicht");
    expect(buildVoxyExperienceShellHint("themen")).toContain("Andock-Schicht");
    expect(buildVoxyExperienceShellHint("dossier")).toContain("Status-Schicht");
  });
});

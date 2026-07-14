import { describe, expect, it } from "vitest";
import {
  buildAgenticBootstrapReadiness,
  enforceDeniedActions,
  enforceSharedRules,
  listAgentRoleCapabilities,
  loadAgentBootstrap,
  loadAgentRegistry,
  resolveTaskToAgentRoles,
} from "@/features/agenticRuntime/agentRegistryBootstrapContract";

describe("agent registry bootstrap contract", () => {
  it("validates registry, bootstrap and deterministic role mapping", () => {
    const registry = loadAgentRegistry();
    const bootstrap = loadAgentBootstrap();
    const readiness = buildAgenticBootstrapReadiness();

    expect(registry.mode).toBe("single-runner-multi-role");
    expect(registry.roles.map((role) => role.id)).toEqual([
      "personal_voxy",
      "intake_format",
      "research_source",
      "claims_factcheck",
      "participation_moderation",
      "dossier_briefing",
      "governance_compliance",
    ]);
    expect(bootstrap.bootstrapTask.id).toBe("V3-AGENT-REGISTRY-RUNNER-BOOTSTRAP-01");
    expect(bootstrap.followupTasks).toHaveLength(13);
    expect(readiness.registry.sharedRuleKeys).toContain("translationIsNotEvidence");
    expect(readiness.bootstrap.doneTaskIds).toContain(
      "V3-SEGMENTED-AGENT-EXPERIENCE-CONTRACT-01",
    );
    expect(readiness.bootstrap.doneTaskIds).toEqual(
      expect.arrayContaining([
        "V3-PERSONAL-VOXY-PROFILE-CONSENT-ONBOARDING-01",
        "V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01",
        "V3-AGENT-RUN-ARTIFACT-SAFE-TRACE-CONTRACT-01",
        "V3-INTAKE-FORMAT-AGENT-E2E-01",
        "V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01",
        "V3-RESEARCH-SOURCE-TRANSFERABILITY-AGENT-01",
        "V3-CLAIMS-FACTCHECK-AGENT-GRAPH-INTEGRATION-01",
        "V3-DOSSIER-CAUSE-EFFECT-RESPONSIBILITY-TRANSFER-GRAPH-01",
        "V3-PARTICIPATION-MODERATION-AGENT-RUNTIME-01",
        "V3-B2G-FIRST-LOGIN-JURISDICTION-COCKPIT-01",
        "V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01",
        "V3-AGENTIC-CIVIC-E2E-PILOT-01",
      ]),
    );
    expect(readiness.bootstrap.codexReadyTaskIds).toEqual([]);
    expect(readiness.bootstrap.needsDecisionTaskIds).toEqual([]);
  });

  it("keeps denied actions and shared rules enforceable without silent override", () => {
    const voxyGuard = enforceDeniedActions("personal_voxy", [
      "political_label_targeting",
      "vote_for_user",
      "topic_connection",
    ]);
    const governanceGuard = enforceDeniedActions("governance_compliance", [
      "auto_publish",
      "handoff_gate",
    ]);
    const sharedRuleGuard = enforceSharedRules({
      noAutoPublish: false,
      reviewFirst: false,
      safeTraceOnly: false,
    });

    expect(voxyGuard.ignoredRequestedAllows).toEqual([
      "political_label_targeting",
      "vote_for_user",
    ]);
    expect(voxyGuard.allowedActions).toEqual(["topic_connection"]);
    expect(governanceGuard.ignoredRequestedAllows).toEqual(["auto_publish"]);
    expect(governanceGuard.allowedActions).toEqual(["handoff_gate"]);
    expect(sharedRuleGuard.effectiveRules.noAutoPublish).toBe(true);
    expect(sharedRuleGuard.effectiveRules.reviewFirst).toBe(true);
    expect(sharedRuleGuard.effectiveRules.safeTraceOnly).toBe(true);
    expect(sharedRuleGuard.ignoredOverrides).toEqual([
      "noAutoPublish",
      "reviewFirst",
      "safeTraceOnly",
    ]);
  });

  it("maps bootstrap and follow-up tasks to the expected primary roles", () => {
    expect(
      resolveTaskToAgentRoles({
        id: "V3-AGENT-REGISTRY-RUNNER-BOOTSTRAP-01",
      }),
    ).toMatchObject({
      primaryRole: "governance_compliance",
      supportingRoles: [
        "personal_voxy",
        "intake_format",
        "research_source",
        "claims_factcheck",
        "participation_moderation",
        "dossier_briefing",
      ],
      matchedBy: "bootstrap_registry",
    });

    expect(
      resolveTaskToAgentRoles({
        id: "V3-INTAKE-FORMAT-AGENT-E2E-01",
      }),
    ).toMatchObject({
      primaryRole: "intake_format",
      supportingRoles: ["personal_voxy", "governance_compliance"],
    });

    expect(
      resolveTaskToAgentRoles({
        id: "custom-source-transferability-check",
        cluster: "Research / provenance / international transferability",
      }),
    ).toMatchObject({
      primaryRole: "research_source",
      supportingRoles: ["dossier_briefing", "governance_compliance"],
    });

    expect(
      resolveTaskToAgentRoles({
        id: "custom-auth-audit",
        cluster: "auth / access / publish / audit",
      }),
    ).toMatchObject({
      primaryRole: "governance_compliance",
      supportingRoles: [],
    });
  });

  it("keeps segment boundaries, daily impulses and screenshot intake explicit", () => {
    const readiness = buildAgenticBootstrapReadiness();
    const personalVoxy = listAgentRoleCapabilities("personal_voxy");

    expect(readiness.segments).toEqual([
      {
        id: "b2c",
        title: "B2C Personal Voxy",
        userFacingMode: "consented companion",
        forcedCompanion: false,
        optionalGuidance: true,
      },
      {
        id: "b2b",
        title: "B2B Workbench",
        userFacingMode: "team workbench",
        forcedCompanion: false,
        optionalGuidance: true,
      },
      {
        id: "b2g",
        title: "B2G Authority Cockpit",
        userFacingMode: "jurisdiction cockpit",
        forcedCompanion: false,
        optionalGuidance: true,
      },
    ]);
    expect(readiness.dailyCivicImpulses).toEqual({
      optional: true,
      maxPerDay: 3,
      framing: ["Was bewegt dich heute?", "Drei kurze Impulse", "Heute aufgefallen"],
    });
    expect(readiness.screenshotIntakeStages).toEqual([
      "visible_observation",
      "user_interpretation",
      "possible_hypothesis",
      "source_backed_fact",
      "affected_group_candidate",
      "jurisdiction_candidate",
      "possible_individual_action",
    ]);
    expect(personalVoxy.primaryDomains).toContain("notifications");
    expect(personalVoxy.allowedArtifacts).toContain("relevance_explanation");
  });
});

import { describe, expect, it } from "vitest";
import {
  ALPHA2_ORGANIZATION_ROLE_IDS,
  ALPHA2_PROVIDER_IDS,
  getAlpha2ControlPlaneLimits,
  getAlpha2DefaultEnabledProviders,
  loadAlpha2AgentFleetRegistry,
  resolveAlpha2CapabilityRoute,
  resolveAlpha2Role,
  selectAlpha2Provider,
} from "@/features/agenticRuntime/alpha2AgentFleetContract";
import {
  Alpha2RunRecordSchema,
  Alpha2SafeTraceStepRefSchema,
  alpha2ReviewCompletionGateRef,
  assertAlpha2RunEvolution,
  createAlpha2RunRecord,
  transitionAlpha2Run,
} from "@/features/agenticRuntime/alpha2RunLifecycleContract";

describe("Alpha-Foxtrott 2 organization agent fleet", () => {
  it("extends the canonical registry without replacing the existing V3 roles", () => {
    const fleet = loadAlpha2AgentFleetRegistry();
    expect(fleet.schemaVersion).toBe("alpha2.registry.v1");
    expect(fleet.organizationRoles.map((role) => role.id)).toEqual(
      ALPHA2_ORGANIZATION_ROLE_IDS,
    );
    expect(fleet.providers.map((provider) => provider.id)).toEqual(ALPHA2_PROVIDER_IDS);
    expect(getAlpha2ControlPlaneLimits()).toEqual({
      maxParallelWorkers: 8,
      workerSliceMaxTasks: 3,
      modelAgnostic: true,
      durableLedger: "mongodb",
      executionQueue: "bullmq_redis",
    });
  });

  it("keeps OpenAI/Codex default while allowing evidence-based provider fallbacks", () => {
    expect(getAlpha2DefaultEnabledProviders()).toEqual(["openai", "codex"]);

    expect(
      selectAlpha2Provider({
        capability: "engineering",
        availableProviders: ["codex", "openai"],
      }),
    ).toMatchObject({ providerId: "codex", selectedBy: "preferred_route" });

    expect(
      selectAlpha2Provider({
        capability: "engineering",
        availableProviders: ["openai"],
      }),
    ).toMatchObject({ providerId: "openai", selectedBy: "preferred_route" });

    expect(
      selectAlpha2Provider({
        capability: "engineering",
        availableProviders: ["oss"],
      }),
    ).toMatchObject({ providerId: "oss", selectedBy: "fallback_route" });

    expect(() =>
      selectAlpha2Provider({
        capability: "engineering",
        availableProviders: ["openai"],
        preferredProvider: "anthropic",
      }),
    ).toThrow("alpha2_provider_not_allowed_for_capability:anthropic");
  });

  it("resolves both legacy product roles and new organization roles", () => {
    expect(resolveAlpha2Role("research_source")).toMatchObject({
      id: "research_source",
      source: "v3_product_registry",
    });
    expect(resolveAlpha2Role("engineering_agent")).toMatchObject({
      id: "engineering_agent",
      source: "alpha2_organization_registry",
      capabilities: ["engineering"],
    });
    expect(resolveAlpha2Role("neutrality_red_team")).toMatchObject({
      id: "neutrality_red_team",
      defaultRisk: "green",
    });
  });

  it("allows durable runs to be owned by the organization fleet", () => {
    const run = createAlpha2RunRecord({
      runId: "fleet-run-1",
      idempotencyKey: "fleet-idem-1",
      taskId: "ALPHA2-DIRECT-ENGINEERING-WORKER-01",
      kind: "engineering_slice",
      primaryRole: "engineering_agent",
      supportingRoles: ["review_agent", "qa_agent", "risk_governor"],
      riskClass: "yellow",
      route: { mode: "automatic", capabilityClass: "engineering" },
      now: "2026-08-23T21:00:00.000Z",
    });

    expect(run.primaryRole).toBe("engineering_agent");
    expect(run.supportingRoles).toEqual(["review_agent", "qa_agent", "risk_governor"]);
    expect(() =>
      Alpha2RunRecordSchema.parse({
        ...run,
        primaryRole: "invented_super_agent",
      }),
    ).toThrow();
  });

  it("accepts organization roles in safe-trace refs while rejecting unknown roles", () => {
    expect(
      Alpha2SafeTraceStepRefSchema.parse({
        stepId: "alpha2:engineering:implementation",
        roleId: "engineering_agent",
      }),
    ).toEqual({
      stepId: "alpha2:engineering:implementation",
      roleId: "engineering_agent",
    });
    expect(
      Alpha2SafeTraceStepRefSchema.parse({
        stepId: "alpha2:legacy:research",
        roleId: "research_source",
      }),
    ).toEqual({
      stepId: "alpha2:legacy:research",
      roleId: "research_source",
    });
    expect(() =>
      Alpha2SafeTraceStepRefSchema.parse({
        stepId: "alpha2:unknown",
        roleId: "invented_super_agent",
      }),
    ).toThrow();
  });

  it("requires an independent reviewer assignment for review-gated capabilities", () => {
    expect(() =>
      createAlpha2RunRecord({
        runId: "fleet-run-missing-reviewer",
        idempotencyKey: "fleet-idem-missing-reviewer",
        taskId: "ALPHA2-DIRECT-ENGINEERING-WORKER-01",
        kind: "engineering_slice",
        primaryRole: "engineering_agent",
        supportingRoles: ["qa_agent"],
        riskClass: "yellow",
        route: { mode: "automatic", capabilityClass: "engineering" },
        now: "2026-09-02T08:00:00.000Z",
      }),
    ).toThrow("alpha2_independent_review_role_required");

    expect(() =>
      createAlpha2RunRecord({
        runId: "fleet-run-self-review",
        idempotencyKey: "fleet-idem-self-review",
        taskId: "ALPHA2-DIRECT-ENGINEERING-WORKER-01",
        kind: "engineering_slice",
        primaryRole: "review_agent",
        supportingRoles: ["review_agent"],
        riskClass: "yellow",
        route: { mode: "automatic", capabilityClass: "engineering" },
        now: "2026-09-02T08:00:00.000Z",
      }),
    ).toThrow("alpha2_independent_reviewer_must_differ_from_primary");
  });

  it("requires a bound review approval before review-gated runs complete", () => {
    const queued = createAlpha2RunRecord({
      runId: "fleet-run-review-required",
      idempotencyKey: "fleet-idem-review-required",
      taskId: "ALPHA2-DIRECT-ENGINEERING-WORKER-01",
      kind: "engineering_slice",
      primaryRole: "engineering_agent",
      supportingRoles: ["review_agent"],
      riskClass: "yellow",
      route: { mode: "automatic", capabilityClass: "engineering" },
      now: "2026-09-02T08:00:00.000Z",
    });
    const running = transitionAlpha2Run(queued, "running", {
      now: "2026-09-02T08:01:00.000Z",
    });

    expect(() =>
      transitionAlpha2Run(running, "completed", {
        now: "2026-09-02T08:02:00.000Z",
      }),
    ).toThrow("alpha2_independent_review_required_before_completion");

    const directCompletion = Alpha2RunRecordSchema.parse({
      ...running,
      status: "completed",
      updatedAt: "2026-09-02T08:02:00.000Z",
      finishedAt: "2026-09-02T08:02:00.000Z",
      preExecutorResumeMode: undefined,
    });
    expect(() => assertAlpha2RunEvolution(running, directCompletion)).toThrow(
      "alpha2_independent_review_required_before_completion",
    );

    const reviewed = transitionAlpha2Run(running, "review", {
      now: "2026-09-02T08:02:00.000Z",
    });
    const completed = transitionAlpha2Run(reviewed, "completed", {
      now: "2026-09-02T08:03:00.000Z",
      humanGate: {
        state: "approved",
        gateRef: alpha2ReviewCompletionGateRef(reviewed),
        decisionRef: "review:independent:approved",
        decidedAt: "2026-09-02T08:03:00.000Z",
      },
    });
    expect(completed.status).toBe("completed");

    const normalQueued = createAlpha2RunRecord({
      runId: "fleet-run-no-review-required",
      idempotencyKey: "fleet-idem-no-review-required",
      taskId: "ALPHA2-ORCHESTRATION-01",
      kind: "mission",
      primaryRole: "alpha_orchestrator",
      riskClass: "yellow",
      route: { mode: "automatic", capabilityClass: "orchestration" },
      now: "2026-09-02T08:00:00.000Z",
    });
    const normalRunning = transitionAlpha2Run(normalQueued, "running", {
      now: "2026-09-02T08:01:00.000Z",
    });
    expect(
      transitionAlpha2Run(normalRunning, "completed", {
        now: "2026-09-02T08:02:00.000Z",
      }).status,
    ).toBe("completed");
  });

  it("routes every capability advertised by an organization role", () => {
    const fleet = loadAlpha2AgentFleetRegistry();
    const availableProviders = getAlpha2DefaultEnabledProviders();
    const advertisedCapabilities = Array.from(
      new Set(fleet.organizationRoles.flatMap((role) => role.capabilities)),
    );

    for (const capability of advertisedCapabilities) {
      expect(resolveAlpha2CapabilityRoute(capability).capability).toBe(capability);
      expect(
        selectAlpha2Provider({ capability, availableProviders }).providerId,
      ).toBeTruthy();
    }
    expect(() => resolveAlpha2CapabilityRoute("invented_capability")).toThrow(
      "alpha2_capability_route_not_found:invented_capability",
    );
  });
});

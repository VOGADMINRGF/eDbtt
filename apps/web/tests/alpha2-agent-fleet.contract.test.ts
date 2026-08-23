import { describe, expect, it } from "vitest";
import {
  ALPHA2_ORGANIZATION_ROLE_IDS,
  ALPHA2_PROVIDER_IDS,
  getAlpha2ControlPlaneLimits,
  getAlpha2DefaultEnabledProviders,
  loadAlpha2AgentFleetRegistry,
  resolveAlpha2Role,
  selectAlpha2Provider,
} from "@/features/agenticRuntime/alpha2AgentFleetContract";
import {
  Alpha2RunRecordSchema,
  createAlpha2RunRecord,
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
});

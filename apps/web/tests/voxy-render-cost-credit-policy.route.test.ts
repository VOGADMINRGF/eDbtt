import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-cost-credit-policies/route";
import {
  createInMemoryVoxyRenderCostCreditPolicyRepository,
  setVoxyRenderCostCreditPolicyRepositoryForTests,
} from "@/features/create/voxyRenderCostCreditPolicyStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    policyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    scriptRef: null,
    contributionRef: {
      id: "review-item-1",
      title: "Sichere Schulwege",
      href: "/admin/review",
    },
    dossierRef: {
      id: "dossier-1",
      title: "Sichere Schulwege",
      href: "/dossier/demo",
    },
    accountRef: null,
    surface: "admin",
    videoFormat: "briefing_video",
    policyStatus: "needs_provider_pricing",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    providerRequirements: [],
    assetRequirements: [],
    costRequirements: [],
    runtimeRequirements: [],
    costEstimateStatus: "provider_pricing_needed",
    estimatedCostAmount: null,
    currency: null,
    costClaimAllowed: false,
    costDebitAllowed: false,
    invoiceAllowed: false,
    creditStatus: "credit_policy_needed",
    creditsRequired: null,
    creditsAvailable: null,
    creditDebitAllowed: false,
    limitStatus: "limit_policy_needed",
    perAccountLimit: null,
    perDayLimit: null,
    perDossierLimit: null,
    perProviderLimit: null,
    limitApprovalAllowed: false,
    accountContext: {
      status: "surface_scope_only",
      label: "Nur Review-/Workspace-Kontext vorhanden, kein Billing-Kontext.",
      planKey: null,
      planLabel: null,
      capabilityLabels: [],
      contributionCredits: null,
      monthlyContributionLimit: null,
      nextCreditIn: null,
      creditRequiredForContribution: null,
      evidence: ["Surface-Kontext statt Billing-Wahrheit."],
    },
    providerPricingStatus: "provider_interface_only",
    providerPricingLabel: "Provider ist nur als Interface sichtbar.",
    runtimeMeteringStatus: "runtime_required",
    runtimeMeteringLabel: "Keine per-run Metering-Wahrheit vorhanden.",
    policyEvidence: ["Voxy-Capability-Matrix vorhanden."],
    nextPolicyDecision: "configure_provider_pricing",
    userVisibleReason: "Nur Vorschau, keine Buchung.",
    reviewerVisibleReason: "Noop-Billing ohne Debit oder Providerlauf.",
    nextStep: "Provider-Pricing separat definieren",
    execution: {
      billingRuntimeAvailable: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      invoiceAllowed: false,
      paymentAllowed: false,
      queueEnabled: false,
      createsQueueJob: false,
      workerExecutionAllowed: false,
      providerExecutionAllowed: false,
      mediaFileCreationAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    createdBy: null,
    createdAt: "2026-07-09T14:00:00.000Z",
  } as const;
}

describe("voxy render cost credit policy admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderCostCreditPolicyRepositoryForTests(
      createInMemoryVoxyRenderCostCreditPolicyRepository(),
    );
  });

  it("persists an honest preview-only cost/credit policy with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-cost-credit-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildCommand()),
      }),
    );

    expect(postRes.status).toBe(200);
    await expect(postRes.json()).resolves.toMatchObject({
      ok: true,
      result: {
        ok: true,
        status: "preview_only",
        record: {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          policyStatus: "needs_provider_pricing",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "cost_credit_policy_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        policyStatus: "needs_provider_pricing",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-cost-credit-policies?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        policyStatus: "needs_provider_pricing",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          policyStatus: "needs_provider_pricing",
        },
      ],
      auditEvents: [
        {
          action: "cost_credit_policy_recorded",
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-cost-credit-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_cost_credit_policy_command",
    });
  });
});

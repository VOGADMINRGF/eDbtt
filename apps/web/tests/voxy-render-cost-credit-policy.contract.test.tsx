import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderCostCreditPolicyPanel from "@/features/create/VoxyRenderCostCreditPolicyPanel";
import {
  buildVoxyRenderCostCreditPolicyAccountContextFromPlan,
  buildVoxyRenderCostCreditPolicyPanelModel,
  buildVoxyRenderCostCreditPolicyPreviewFromReadmodels,
  type VoxyRenderCostCreditPolicyPersistenceState,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderDecisionReasonSet,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  buildVoxyRenderRequestDraftFromReadmodels,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildVoxyRenderQueuePreviewFromReadmodels,
} from "@/features/create/voxyRenderQueueContract";

function buildDecisionRecord(overrides?: Record<string, unknown>) {
  const reasons = buildVoxyRenderDecisionReasonSet({
    selectedDecision: "review_script",
    reviewerNote: "Alles bleibt review-first.",
  });
  return {
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
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
    scriptRef: null,
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    status: "persisted_review_decision",
    selectedDecision: "review_script",
    reviewerVisibleReason: reasons.reviewerVisibleReason,
    userVisibleReason: reasons.userVisibleReason,
    auditReason: reasons.auditReason,
    reviewerNote: "Alles bleibt review-first.",
    reviewerRole: "admin",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    originalPreserved: true,
    translationIsEvidence: false,
    persistedAt: "2026-07-09T12:00:00.000Z",
    persistedBy: "admin-1",
    executionFlags: {
      noRenderAction: true,
      noProviderExecution: true,
      noRenderQueue: true,
      noMediaCreation: true,
      noCostDebit: true,
      noPublishAction: true,
      noSocialPostAction: true,
      noRuntimeClaim: true,
    },
    idempotencyKey: "decision-idempotency-1",
    previousDecisionRef: null,
    supersedesDecisionRef: null,
    decisionVersion: 1,
    ...overrides,
  } as any;
}

function buildStoreState(
  overrides?: Partial<VoxyRenderCostCreditPolicyPersistenceState>,
): VoxyRenderCostCreditPolicyPersistenceState {
  return {
    mode: "persistent_primary",
    label: "Persistenter Voxy-Cost-/Credit-Policy-Store",
    summary: "Policy-Previews und Audit-Spuren liegen getrennt von Billing und Runtime.",
    repositoryInterface: "VoxyRenderCostCreditPolicyRepository",
    storeKind: "mongo_collection",
    productionTruth: true,
    restartReconstructable: true,
    deploymentReconstructable: true,
    adminWritePath: "admin_api_available",
    ...overrides,
  };
}

function buildGateFixture() {
  return {
    title: "Render-Entscheidung",
    summary: "Review-first Decision Gate",
    surface: "admin",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
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
    scriptRef: null,
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    languageLabel: "Quelle: Deutsch",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDecisionHint: null,
    decisionStatus: "decision_ready",
    decisionStatusLabel: "Entscheidung vorbereitet",
    reviewGates: [],
    decisionOptions: [],
    recommendedDecision: {
      id: "review_script",
      label: "Script prüfen",
      reviewerVisibleReason: "Script zuerst prüfen.",
      userVisibleReason: "Script zuerst prüfen.",
    },
    blockedReasons: [],
    decisionResultPreview: {
      resultKind: "decision_needed",
      resultKindLabel: "Entscheidung nötig",
      noRenderAction: true,
      noProviderExecution: true,
      noMediaCreation: true,
      noCostDebit: true,
      noPublishAction: true,
      noRuntimeClaim: true,
    },
    publicSafeLabel: "Review-first",
    userVisibleReason: "Nur Review, keine Ausführung.",
    reviewerVisibleReason: "Nur Review, keine Ausführung.",
    nextStep: "Review dokumentieren",
    noRuntimeClaim: true,
  } as any;
}

function buildDraft(overrides?: Record<string, unknown>) {
  const draft = buildVoxyRenderRequestDraftFromReadmodels({
    surface: "admin",
    latestDecisionRecord: buildDecisionRecord(),
    gate: buildGateFixture(),
    handoffModel: {
      providerTargets: [
        {
          id: "provider_target",
          label: "Provider-Zielbild",
          status: "ready",
          reason: "Nur als Handoff beschrieben.",
        },
      ],
      reviewGates: [],
      handoffStatus: "adapter_only",
      sourceLanguage: "de",
      readingLanguage: "de",
      scriptLanguage: "de",
    } as any,
    preflightModel: {
      requiredAssets: [
        {
          id: "brand_pack",
          label: "Brand-Pack",
          status: "ready",
          reason: "Repo-Asset vorhanden.",
        },
      ],
      costStatus: "requirement_only",
      costStatusLabel: "Cost-Policy separat",
      reviewerVisibleReason: "Kosten werden nur als Policy-Hinweis geführt.",
      reviewReadiness: [],
      preflightStatus: "preflight_ready",
      sourceLanguage: "de",
      readingLanguage: "de",
      renderLanguage: "de",
      subtitleLanguage: null,
    } as any,
    registryModel: {
      providerRegistry: [
        {
          id: "provider_registry",
          label: "Provider-Registry",
          status: "requirement_only",
          reviewerVisibleReason: "Nur Requirement, kein echter Providerlauf.",
        },
      ],
      assetInventory: [
        {
          id: "subtitle_template",
          label: "Subtitle-Template",
          status: "ready",
          reviewerVisibleReason: "Template ist im Repo bekannt.",
        },
      ],
      registryStatus: "registry_ready",
    } as any,
    adapterModel: {
      providerGateItems: [
        {
          id: "adapter_gate",
          label: "Adapter-Gate",
          status: "ready",
          reason: "Nur Noop-Vertrag, keine Ausführung.",
        },
      ],
      requiredAssets: [],
      costGateItems: [
        {
          id: "cost_gate",
          label: "Cost-Gate",
          status: "requirement_only",
          reason: "Nur Policy-Hinweis.",
        },
      ],
      adapterStatus: "adapter_ready",
    } as any,
  });
  return {
    ...draft,
    ...overrides,
  };
}

function buildQueuePreview(overrides?: Record<string, unknown>) {
  const preview = buildVoxyRenderQueuePreviewFromReadmodels({
    surface: "admin",
    requestDraft: buildDraft({
      requestStatus: "ready_for_future_runtime_review",
      providerRequirements: [],
      assetRequirements: [],
      costRequirements: [],
      reviewRequirements: [],
    }),
    latestDecisionRecord: buildDecisionRecord(),
    gate: buildGateFixture(),
  });
  return {
    ...preview,
    ...overrides,
  };
}

describe("voxy render cost credit policy", () => {
  it("blocks when no request draft exists", () => {
    const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: null,
      allowRequestDraftSynthesis: false,
      queuePreview: null,
      allowQueuePreviewSynthesis: false,
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview?.policyStatus).toBe("blocked_by_missing_request_draft");
    expect(preview?.execution).toMatchObject({
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
    });
  });

  it("blocks when no queue contract exists", () => {
    const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
      }),
      queuePreview: null,
      allowQueuePreviewSynthesis: false,
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview?.policyStatus).toBe("blocked_by_missing_queue_contract");
  });

  it("keeps script-only decisions out of billing", () => {
    const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft(),
      queuePreview: buildQueuePreview(),
      latestDecisionRecord: buildDecisionRecord({
        selectedDecision: "keep_as_script_only",
      }),
      gate: buildGateFixture(),
    });

    expect(preview?.policyStatus).toBe("keep_as_script_only");
    expect(preview?.costEstimateStatus).toBe("blocked");
    expect(preview?.creditStatus).toBe("blocked");
    expect(preview?.limitStatus).toBe("blocked");
  });

  it("maps missing provider and asset blockers", () => {
    const providerPreview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "blocked_by_missing_provider",
        providerRequirements: [
          {
            id: "voice",
            label: "Voice-Provider",
            status: "missing",
            statusLabel: "Fehlt",
            reason: "Kein Provider freigegeben.",
          },
        ],
      }),
      queuePreview: buildQueuePreview({
        queueStatus: "blocked_by_missing_provider",
        providerRequirements: [
          {
            id: "voice",
            label: "Voice-Provider",
            status: "missing",
            statusLabel: "Fehlt",
            reason: "Kein Provider freigegeben.",
          },
        ],
      }),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });
    const assetPreview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "blocked_by_missing_assets",
        assetRequirements: [
          {
            id: "brand_pack",
            label: "Brand-Pack",
            status: "missing",
            statusLabel: "Fehlt",
            reason: "Brand-Pack fehlt.",
          },
        ],
      }),
      queuePreview: buildQueuePreview({
        queueStatus: "blocked_by_missing_assets",
        assetRequirements: [
          {
            id: "brand_pack",
            label: "Brand-Pack",
            status: "missing",
            statusLabel: "Fehlt",
            reason: "Brand-Pack fehlt.",
          },
        ],
      }),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(providerPreview?.policyStatus).toBe("blocked_by_missing_provider");
    expect(assetPreview?.policyStatus).toBe("blocked_by_missing_assets");
  });

  it("requires account context on account surfaces", () => {
    const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "account",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
      }),
      queuePreview: buildQueuePreview(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview?.policyStatus).toBe("needs_account_context");
    expect(preview?.creditStatus).toBe("account_context_needed");
    expect(preview?.limitStatus).toBe("account_context_needed");
  });

  it("escalates missing provider pricing, credit policy and limit policy in order", () => {
    const accountContext = buildVoxyRenderCostCreditPolicyAccountContextFromPlan("operator");

    const pricingPreview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
      }),
      queuePreview: buildQueuePreview(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
      accountContext,
    });
    const creditPreview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
      }),
      queuePreview: buildQueuePreview(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
      accountContext,
      policyInputs: {
        providerPricing: {
          status: "available",
          label: "Provider-Pricing läge als Readmodel vor.",
        },
      },
    });
    const limitPreview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
      }),
      queuePreview: buildQueuePreview(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
      accountContext,
      policyInputs: {
        providerPricing: {
          status: "available",
          label: "Provider-Pricing läge als Readmodel vor.",
        },
        creditPolicy: {
          status: "available",
          label: "Credit-Policy wäre nur Preview.",
        },
      },
    });

    expect(pricingPreview?.policyStatus).toBe("needs_provider_pricing");
    expect(pricingPreview?.costEstimateStatus).toBe("provider_pricing_needed");
    expect(creditPreview?.policyStatus).toBe("needs_credit_policy");
    expect(limitPreview?.policyStatus).toBe("needs_limit_policy");
  });

  it("shows runtime metering as a separate noop-policy boundary", () => {
    const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
        sourceLanguage: "en",
        readingLanguage: "fr",
        scriptLanguage: "en",
        renderLanguage: "fr",
      }),
      queuePreview: buildQueuePreview({
        sourceLanguage: "en",
        readingLanguage: "fr",
        scriptLanguage: "en",
        renderLanguage: "fr",
      }),
      latestDecisionRecord: buildDecisionRecord({
        sourceLanguage: "en",
        readingLanguage: "fr",
        scriptLanguage: "en",
        renderLanguage: "fr",
      }),
      gate: buildGateFixture(),
      accountContext: buildVoxyRenderCostCreditPolicyAccountContextFromPlan("operator"),
      policyInputs: {
        providerPricing: {
          status: "available",
          label: "Provider-Pricing läge als Readmodel vor.",
        },
        creditPolicy: {
          status: "available",
          label: "Credit-Policy wäre nur Preview.",
        },
        limitPolicy: {
          status: "available",
          label: "Limit-Policy wäre nur Preview.",
        },
      },
    });

    expect(preview?.policyStatus).toBe("needs_runtime_metering");
    expect(preview?.limitStatus).toBe("runtime_metering_needed");
    expect(preview?.sourceLanguage).toBe("en");
    expect(preview?.readingLanguage).toBe("fr");
  });

  it("stays noop billing when formal policy inputs exist without enabling execution", () => {
    const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({
        requestStatus: "ready_for_future_runtime_review",
        providerRequirements: [],
        assetRequirements: [],
        costRequirements: [],
        reviewRequirements: [],
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "de",
        rtlRequired: true,
      }),
      queuePreview: buildQueuePreview({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "de",
        rtlRequired: true,
      }),
      latestDecisionRecord: buildDecisionRecord({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "de",
      }),
      gate: buildGateFixture(),
      accountContext: buildVoxyRenderCostCreditPolicyAccountContextFromPlan("admin", {
        label: "Admin-Plan nur als Preview-Kontext.",
      }),
      policyInputs: {
        providerPricing: {
          status: "available",
          label: "Provider-Pricing nur als Readmodel-Hinweis.",
          estimatedCostAmount: 12.5,
          currency: "EUR",
        },
        creditPolicy: {
          status: "available",
          label: "Credit-Policy nur als Preview.",
          creditsRequired: 2,
          creditsAvailable: 5,
        },
        limitPolicy: {
          status: "available",
          label: "Limit-Policy nur als Preview.",
          perAccountLimit: 3,
          perDayLimit: 1,
          perDossierLimit: 2,
          perProviderLimit: 5,
        },
        runtimeMetering: {
          status: "available",
          label: "Metering wäre separat auditierbar.",
        },
      },
    });
    const model = buildVoxyRenderCostCreditPolicyPanelModel({
      preview,
      storeState: buildStoreState(),
    });

    expect(preview?.policyStatus).toBe("noop_billing");
    expect(preview?.costEstimateStatus).toBe("estimate_not_claimed");
    expect(preview?.creditStatus).toBe("not_available");
    expect(preview?.limitStatus).toBe("not_available");
    expect(preview?.rtlRequired).toBe(true);

    const html = renderToStaticMarkup(
      <VoxyRenderCostCreditPolicyPanel model={model} />,
    );

    expect(html).toContain("Kosten &amp; Credits");
    expect(html).toContain("Noop Billing");
    expect(html).toContain("Noch keine Buchung");
    expect(html).toContain("Keine Credit-Abbuchung");
    expect(html).toContain("Keine Providerkosten behauptet");
    expect(html).toContain("Keine Queue-Ausführung");
    expect(html).toContain("Admin-Plan nur als Preview-Kontext.");
    expect(html).not.toContain("needs_runtime_metering");
    expect(html).not.toContain("noop_billing");
  });
});

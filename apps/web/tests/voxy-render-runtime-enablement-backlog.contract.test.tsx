import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderRuntimeEnablementBacklogPanel from "@/features/create/VoxyRenderRuntimeEnablementBacklogPanel";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromReadmodels,
  buildVoxyRenderRuntimeEnablementBacklogPanelModel,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";

function buildGate(overrides?: Record<string, unknown>) {
  return {
    gateKey: "review",
    label: "Review",
    status: "go",
    blockerSeverity: "none",
    reviewerVisibleReason: "Gate ist vorbereitet.",
    userVisibleReason: "Gate ist vorbereitet.",
    evidenceRefs: ["evidence-1"],
    nextAction: "review_script",
    executionAllowed: false,
    ...overrides,
  } as any;
}

function buildMatrix(overrides?: Record<string, unknown>) {
  return {
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:preview-1",
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    scriptRef: {
      id: "script-1",
      title: "Voxy Script",
      href: "/admin/review",
    },
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
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    surface: "admin",
    matrixStatus: "go_nogo_preview_only",
    reviewGate: buildGate({ gateKey: "review", label: "Review" }),
    providerGate: buildGate({ gateKey: "provider", label: "Provider" }),
    assetGate: buildGate({ gateKey: "assets", label: "Assets" }),
    queueGate: buildGate({ gateKey: "queue", label: "Queue" }),
    costCreditGate: buildGate({ gateKey: "cost_credit", label: "Kosten & Credits" }),
    languageGate: buildGate({ gateKey: "language", label: "Sprache & Untertitel" }),
    runtimeGate: buildGate({
      gateKey: "runtime",
      label: "Runtime",
      status: "no_go",
      blockerSeverity: "blocker",
      reviewerVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
      userVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
      nextAction: "wait_for_runtime",
    }),
    publishGate: buildGate({
      gateKey: "publish",
      label: "Veröffentlichung",
      status: "no_go",
      blockerSeverity: "warning",
      reviewerVisibleReason: "Publish bleibt gesperrt.",
      userVisibleReason: "Publish bleibt gesperrt.",
      nextAction: "wait_for_runtime",
    }),
    overallDecision: "runtime_not_available",
    topBlockers: ["Runtime-Wahrheit fehlt weiterhin."],
    nextRecommendedAction: "wait_for_runtime",
    nextStep: "Auf Runtime warten.",
    execution: {
      renderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    persistedAt: null,
    persistedBy: null,
    idempotencyKey: null,
    previousMatrixRef: null,
    supersedesMatrixRef: null,
    matrixVersion: null,
    ...overrides,
  } as any;
}

describe("voxy render runtime enablement backlog contract", () => {
  it("blocks when no runtime go/no-go matrix is available", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: null,
    });

    expect(preview.backlogStatus).toBe("blocked_by_missing_matrix");
    expect(preview.items).toHaveLength(0);
    expect(preview.nextRecommendedAction).toBe("blocked");
    expect(preview.execution.runtimeEnabled).toBe(false);
  });

  it("keeps explicit script-only decisions in planning mode without runtime tasks", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: buildMatrix({
        matrixStatus: "keep_as_script_only",
        overallDecision: "keep_as_script_only",
      }),
    });

    expect(preview.backlogStatus).toBe("keep_as_script_only");
    expect(preview.items).toHaveLength(0);
    expect(preview.nextRecommendedAction).toBe("keep_as_script_only");
  });

  it("derives provider, adapter, secret and pricing tasks from a provider no-go", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: buildMatrix({
        providerGate: buildGate({
          gateKey: "provider",
          label: "Provider",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Provider-Auswahl bleibt offen.",
          userVisibleReason: "Provider-Auswahl bleibt offen.",
          nextAction: "configure_provider",
        }),
        costCreditGate: buildGate({
          gateKey: "cost_credit",
          label: "Kosten & Credits",
          status: "go",
          blockerSeverity: "none",
        }),
        runtimeGate: buildGate({
          gateKey: "runtime",
          label: "Runtime",
          status: "warning",
          blockerSeverity: "warning",
          reviewerVisibleReason: "Runtime bleibt geplant.",
          userVisibleReason: "Runtime bleibt geplant.",
          nextAction: "wait_for_runtime",
        }),
        publishGate: buildGate({
          gateKey: "publish",
          label: "Veröffentlichung",
          status: "go",
          blockerSeverity: "none",
        }),
        matrixStatus: "blocked_by_provider",
        overallDecision: "review_needed",
      }),
    });

    expect(preview.items.map((item) => item.category)).toEqual(
      expect.arrayContaining(["provider", "adapter", "secrets", "cost_pricing"]),
    );
    expect(preview.topP0Items).toEqual(
      expect.arrayContaining([
        "Provider-Strategie für Avatar-, Voice- und Preview-Render definieren",
        "Secret- und Konfigurationspfad für spätere Provider-Freigabe definieren",
      ]),
    );
    expect(preview.nextRecommendedAction).toBe("define_provider_strategy");
    expect(preview.items.every((item) => item.implemented === false)).toBe(true);
  });

  it("derives asset tasks from an asset no-go", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: buildMatrix({
        assetGate: buildGate({
          gateKey: "assets",
          label: "Assets",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Templates fehlen.",
          userVisibleReason: "Templates fehlen.",
          nextAction: "prepare_assets",
        }),
        runtimeGate: buildGate({
          gateKey: "runtime",
          label: "Runtime",
          status: "warning",
          blockerSeverity: "warning",
          reviewerVisibleReason: "Runtime bleibt geplant.",
          userVisibleReason: "Runtime bleibt geplant.",
          nextAction: "wait_for_runtime",
        }),
        publishGate: buildGate({
          gateKey: "publish",
          label: "Veröffentlichung",
          status: "go",
          blockerSeverity: "none",
        }),
        matrixStatus: "blocked_by_assets",
        overallDecision: "review_needed",
      }),
    });

    expect(preview.items.map((item) => item.category)).toEqual(
      expect.arrayContaining([
        "assets",
        "voice",
        "subtitles",
        "lower_thirds",
        "source_captions",
        "export_preset",
      ]),
    );
    expect(preview.nextRecommendedAction).toBe("prepare_asset_templates");
  });

  it("derives queue and worker tasks from a queue no-go", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: buildMatrix({
        queueGate: buildGate({
          gateKey: "queue",
          label: "Queue",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Queue bleibt disabled.",
          userVisibleReason: "Queue bleibt disabled.",
          nextAction: "wait_for_runtime",
        }),
        runtimeGate: buildGate({
          gateKey: "runtime",
          label: "Runtime",
          status: "warning",
          blockerSeverity: "warning",
          reviewerVisibleReason: "Runtime bleibt geplant.",
          userVisibleReason: "Runtime bleibt geplant.",
          nextAction: "wait_for_runtime",
        }),
        publishGate: buildGate({
          gateKey: "publish",
          label: "Veröffentlichung",
          status: "go",
          blockerSeverity: "none",
        }),
        matrixStatus: "blocked_by_queue",
        overallDecision: "review_needed",
      }),
    });

    expect(preview.items.map((item) => item.category)).toEqual(
      expect.arrayContaining(["queue", "worker"]),
    );
    expect(preview.items.find((item) => item.category === "queue")?.status).toBe("needs_runtime");
  });

  it("derives cost, language, runtime and publish tasks while keeping all execution flags false", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: buildMatrix({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "de",
        subtitleLanguage: "ar",
        rtlRequired: true,
        costCreditGate: buildGate({
          gateKey: "cost_credit",
          label: "Kosten & Credits",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Pricing und Metering fehlen.",
          userVisibleReason: "Pricing und Metering fehlen.",
          nextAction: "define_cost_policy",
        }),
        languageGate: buildGate({
          gateKey: "language",
          label: "Sprache & Untertitel",
          status: "warning",
          blockerSeverity: "warning",
          reviewerVisibleReason: "RTL bleibt offen.",
          userVisibleReason: "RTL bleibt offen.",
          nextAction: "review_language",
        }),
        runtimeGate: buildGate({
          gateKey: "runtime",
          label: "Runtime",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
          userVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
          nextAction: "wait_for_runtime",
        }),
        publishGate: buildGate({
          gateKey: "publish",
          label: "Veröffentlichung",
          status: "no_go",
          blockerSeverity: "warning",
          reviewerVisibleReason: "Publish-Guard fehlt.",
          userVisibleReason: "Publish-Guard fehlt.",
          nextAction: "wait_for_runtime",
        }),
      }),
    });

    expect(preview.items.map((item) => item.category)).toEqual(
      expect.arrayContaining([
        "cost_pricing",
        "credits_limits",
        "metering",
        "language_rtl",
        "admin_gate",
        "security",
        "observability",
        "documentation",
        "preview_review",
        "publish_guard",
      ]),
    );
    expect(preview.items.find((item) => item.category === "language_rtl")?.priority).toBe("p0");
    expect(preview.execution.renderAllowed).toBe(false);
    expect(preview.execution.queueAllowed).toBe(false);
    expect(preview.execution.workerAllowed).toBe(false);
    expect(preview.execution.providerExecutionAllowed).toBe(false);
    expect(preview.execution.secretsAccessed).toBe(false);
    expect(preview.execution.mediaFileCreationAllowed).toBe(false);
    expect(preview.execution.costDebitAllowed).toBe(false);
    expect(preview.execution.creditDebitAllowed).toBe(false);
    expect(preview.execution.uploadAllowed).toBe(false);
    expect(preview.execution.publishAllowed).toBe(false);
    expect(preview.execution.socialPostAllowed).toBe(false);
    expect(preview.execution.schedulingAllowed).toBe(false);
    expect(preview.execution.runtimeClaimAllowed).toBe(false);
  });

  it("renders human-readable backlog labels without leaking raw enums", () => {
    const preview = buildVoxyRenderRuntimeEnablementBacklogFromReadmodels({
      surface: "admin",
      matrix: buildMatrix({
        providerGate: buildGate({
          gateKey: "provider",
          label: "Provider",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Provider-Auswahl bleibt offen.",
          userVisibleReason: "Provider-Auswahl bleibt offen.",
          nextAction: "configure_provider",
        }),
        assetGate: buildGate({
          gateKey: "assets",
          label: "Assets",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Templates fehlen.",
          userVisibleReason: "Templates fehlen.",
          nextAction: "prepare_assets",
        }),
        queueGate: buildGate({
          gateKey: "queue",
          label: "Queue",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Queue bleibt disabled.",
          userVisibleReason: "Queue bleibt disabled.",
          nextAction: "wait_for_runtime",
        }),
        costCreditGate: buildGate({
          gateKey: "cost_credit",
          label: "Kosten & Credits",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Pricing und Metering fehlen.",
          userVisibleReason: "Pricing und Metering fehlen.",
          nextAction: "define_cost_policy",
        }),
        languageGate: buildGate({
          gateKey: "language",
          label: "Sprache & Untertitel",
          status: "warning",
          blockerSeverity: "warning",
          reviewerVisibleReason: "RTL bleibt offen.",
          userVisibleReason: "RTL bleibt offen.",
          nextAction: "review_language",
        }),
        runtimeGate: buildGate({
          gateKey: "runtime",
          label: "Runtime",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
          userVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
          nextAction: "wait_for_runtime",
        }),
        publishGate: buildGate({
          gateKey: "publish",
          label: "Veröffentlichung",
          status: "no_go",
          blockerSeverity: "warning",
          reviewerVisibleReason: "Publish-Guard fehlt.",
          userVisibleReason: "Publish-Guard fehlt.",
          nextAction: "wait_for_runtime",
        }),
      }),
    });
    const html = renderToStaticMarkup(
      <VoxyRenderRuntimeEnablementBacklogPanel
        model={buildVoxyRenderRuntimeEnablementBacklogPanelModel({ preview })}
      />,
    );

    expect(html).toContain("Runtime Enablement Backlog");
    expect(html).toContain("Noch keine Runtime");
    expect(html).toContain("Provider &amp; Adapter");
    expect(html).toContain("Secrets &amp; Konfiguration");
    expect(html).toContain("Kosten, Credits &amp; Metering");
    expect(html).not.toContain("blocked_by_runtime_truth");
    expect(html).not.toContain("needs_runtime");
    expect(html).not.toContain("requires_worker");
  });
});

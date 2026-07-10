import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderProviderSelectionDraftPanel from "@/features/create/VoxyRenderProviderSelectionDraftPanel";
import {
  buildVoxyRenderProviderSelectionDraftFromReadmodels,
  buildVoxyRenderProviderSelectionDraftPanelModel,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";

function buildDecisionRecord(overrides?: Record<string, unknown>) {
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
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    ...overrides,
  } as any;
}

function buildGateFixture(overrides?: Record<string, unknown>) {
  return {
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
    rtlDecisionHint: null,
    ...overrides,
  } as any;
}

function buildRequestDraft(overrides?: Record<string, unknown>) {
  return {
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
    videoFormat: "briefing_video",
    requestStatus: "draft_only",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildQueuePreview(overrides?: Record<string, unknown>) {
  return {
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
    videoFormat: "briefing_video",
    queueStatus: "queue_contract_only",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildCostPolicyPreview(overrides?: Record<string, unknown>) {
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
    videoFormat: "briefing_video",
    policyStatus: "policy_preview_only",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    estimatedCostAmount: null,
    providerPricingStatus: "not_available",
    providerPricingLabel: "Kein Pricing",
    runtimeMeteringLabel: "Kein Metering",
    ...overrides,
  } as any;
}

function buildAssetPackDraft(overrides?: Record<string, unknown>) {
  return {
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
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
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    assetPackStatus: "requirements_only",
    blockers: [],
    assetEntries: [
      { assetKey: "brand_logo", status: "available" },
      { assetKey: "lower_third_template", status: "missing" },
      { assetKey: "source_caption_template", status: "missing" },
      { assetKey: "export_preset", status: "missing" },
    ],
    ...overrides,
  } as any;
}

function buildRegistryFixture(overrides?: Record<string, unknown>) {
  return {
    providerRegistry: [
      {
        id: "avatar_video",
        label: "Avatar-Video",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "Nur Requirement-Wahrheit.",
      },
      {
        id: "voiceover",
        label: "Voiceover",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "Nur Requirement-Wahrheit.",
      },
      {
        id: "subtitles",
        label: "Untertitel",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "Nur Requirement-Wahrheit.",
      },
      {
        id: "multilingual_voice",
        label: "Mehrsprachige Voice",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "Nur Requirement-Wahrheit.",
      },
      {
        id: "rtl_subtitles",
        label: "RTL-Untertitel",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "Nur Requirement-Wahrheit.",
      },
    ],
    ...overrides,
  } as any;
}

function buildAdapterFixture(overrides?: Record<string, unknown>) {
  return {
    adapterStatus: "noop_preview",
    providerGateItems: [
      {
        id: "provider_contract",
        label: "Providervertrag",
        status: "ready",
        statusLabel: "Bereit",
        reason: "Noop-Vertrag vorhanden.",
      },
      {
        id: "provider_configuration",
        label: "Provider-Konfiguration",
        status: "configuration_needed",
        statusLabel: "Konfiguration fehlt",
        reason: "Konfiguration fehlt.",
      },
      {
        id: "secret_runtime_truth",
        label: "Secrets & Runtime",
        status: "missing",
        statusLabel: "Fehlt",
        reason: "Secrets fehlen.",
      },
      {
        id: "render_queue_runtime",
        label: "Render-Queue-Runtime",
        status: "missing",
        statusLabel: "Fehlt",
        reason: "Queue fehlt.",
      },
    ],
    ...overrides,
  } as any;
}

function buildPreview(overrides?: {
  requestDraft?: any | null;
  queuePreview?: any | null;
  costPolicyPreview?: any | null;
  assetPackDraft?: any | null;
  registryModel?: any | null;
  adapterModel?: any | null;
  preflightModel?: any | null;
  latestDecisionRecord?: any | null;
  gate?: any | null;
}) {
  return buildVoxyRenderProviderSelectionDraftFromReadmodels({
    surface: "admin",
    requestDraft: overrides?.requestDraft === undefined ? buildRequestDraft() : overrides.requestDraft,
    queuePreview: overrides?.queuePreview === undefined ? buildQueuePreview() : overrides.queuePreview,
    costPolicyPreview:
      overrides?.costPolicyPreview === undefined
        ? buildCostPolicyPreview()
        : overrides.costPolicyPreview,
    assetPackDraft:
      overrides?.assetPackDraft === undefined ? buildAssetPackDraft() : overrides.assetPackDraft,
    registryModel:
      overrides?.registryModel === undefined ? buildRegistryFixture() : overrides.registryModel,
    adapterModel:
      overrides?.adapterModel === undefined ? buildAdapterFixture() : overrides.adapterModel,
    preflightModel:
      overrides?.preflightModel === undefined
        ? {
            preflightStatus: "needs_provider_configuration",
            providerSelectionStatus: "none_configured",
            providerSelectionStatusLabel: "Keine Auswahl",
          }
        : overrides.preflightModel,
    latestDecisionRecord:
      overrides?.latestDecisionRecord === undefined
        ? buildDecisionRecord()
        : overrides.latestDecisionRecord,
    gate: overrides?.gate === undefined ? buildGateFixture() : overrides.gate,
  });
}

describe("voxy render provider selection draft", () => {
  it("blocks without request, asset-pack, cost-policy or registry truth", () => {
    expect(buildPreview({ requestDraft: null }).providerSelectionStatus).toBe(
      "blocked_by_missing_request_draft",
    );
    expect(buildPreview({ assetPackDraft: null }).providerSelectionStatus).toBe(
      "blocked_by_missing_asset_pack",
    );
    expect(buildPreview({ costPolicyPreview: null }).providerSelectionStatus).toBe(
      "blocked_by_missing_cost_policy",
    );
    expect(buildPreview({ registryModel: null }).providerSelectionStatus).toBe(
      "blocked_by_missing_registry",
    );
  });

  it("keeps the draft script-only when upstream slices say keep_as_script_only", () => {
    const preview = buildPreview({
      requestDraft: buildRequestDraft({ requestStatus: "keep_as_script_only" }),
    });

    expect(preview.providerSelectionStatus).toBe("keep_as_script_only");
  });

  it("stays honest as requirements_only candidates and needs_provider_configuration without concrete provider config", () => {
    const preview = buildPreview();

    expect(preview.providerSelectionStatus).toBe("needs_provider_configuration");
    expect(preview.candidates.every((candidate) => candidate.status === "requirement_only" || candidate.status === "pricing_needed")).toBe(true);
    expect(preview.candidates.every((candidate) => candidate.providerCalled === false)).toBe(true);
    expect(preview.execution.providerExecutionAllowed).toBe(false);
    expect(preview.execution.secretsAccessed).toBe(false);
    expect(preview.execution.queueEnabled).toBe(false);
    expect(preview.execution.mediaFileCreationAllowed).toBe(false);
    expect(preview.execution.costDebitAllowed).toBe(false);
    expect(preview.execution.uploadAllowed).toBe(false);
    expect(preview.execution.publishAllowed).toBe(false);
    expect(preview.execution.schedulingAllowed).toBe(false);
  });

  it("marks missing adapter, secrets and pricing in dedicated states when prerequisites are otherwise present", () => {
    expect(buildPreview({ adapterModel: null }).providerSelectionStatus).toBe(
      "needs_adapter_contract",
    );

    const configuredRegistry = buildRegistryFixture({
      providerRegistry: [
        {
          id: "avatar_video",
          label: "Avatar-Video",
          status: "configuration_needed",
          statusLabel: "Konfiguration fehlt",
          providerName: "real-provider",
          executionAllowed: false,
          reviewerVisibleReason: "Konfiguration fehlt.",
        },
      ],
    });

    const previewWithSecretsGap = buildPreview({
      registryModel: configuredRegistry,
      preflightModel: {
        preflightStatus: "needs_review",
        providerSelectionStatus: "adapter_needed",
      },
      adapterModel: buildAdapterFixture({
        providerGateItems: [
          {
            id: "provider_contract",
            label: "Providervertrag",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
          {
            id: "provider_configuration",
            label: "Provider-Konfiguration",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
          {
            id: "secret_runtime_truth",
            label: "Secrets & Runtime",
            status: "missing",
            statusLabel: "Fehlt",
            reason: "Secrets fehlen.",
          },
          {
            id: "render_queue_runtime",
            label: "Render-Queue-Runtime",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
        ],
      }),
    });
    expect(previewWithSecretsGap.providerSelectionStatus).toBe("needs_secret_configuration");

    const previewWithPricingGap = buildPreview({
      registryModel: configuredRegistry,
      preflightModel: {
        preflightStatus: "needs_review",
        providerSelectionStatus: "adapter_needed",
      },
      adapterModel: buildAdapterFixture({
        providerGateItems: [
          {
            id: "provider_contract",
            label: "Providervertrag",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
          {
            id: "provider_configuration",
            label: "Provider-Konfiguration",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
          {
            id: "secret_runtime_truth",
            label: "Secrets & Runtime",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
          {
            id: "render_queue_runtime",
            label: "Render-Queue-Runtime",
            status: "ready",
            statusLabel: "Bereit",
            reason: "Bereit.",
          },
        ],
      }),
      costPolicyPreview: buildCostPolicyPreview({
        providerPricingStatus: "not_available",
        estimatedCostAmount: null,
      }),
    });
    expect(previewWithPricingGap.providerSelectionStatus).toBe("needs_provider_pricing");
  });

  it("requires subtitle capability for Arabic RTL and language capability for Turkish cross-lingual output", () => {
    const configuredRegistry = buildRegistryFixture({
      providerRegistry: [
        {
          id: "avatar_video",
          label: "Avatar-Video",
          status: "configuration_needed",
          statusLabel: "Konfiguration fehlt",
          providerName: "real-provider",
          executionAllowed: false,
          reviewerVisibleReason: "Belegt.",
        },
      ],
    });
    const readyAdapter = buildAdapterFixture({
      providerGateItems: [
        { id: "provider_contract", label: "Providervertrag", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
        { id: "provider_configuration", label: "Provider-Konfiguration", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
        { id: "secret_runtime_truth", label: "Secrets & Runtime", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
        { id: "render_queue_runtime", label: "Render-Queue-Runtime", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      ],
    });
    const pricedPolicy = buildCostPolicyPreview({
      providerPricingStatus: "available",
      estimatedCostAmount: 42,
    });

    const rtlPreview = buildPreview({
      registryModel: configuredRegistry,
      adapterModel: readyAdapter,
      costPolicyPreview: pricedPolicy,
      requestDraft: buildRequestDraft({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
      }),
      queuePreview: buildQueuePreview({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
      }),
      assetPackDraft: buildAssetPackDraft({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
      }),
      latestDecisionRecord: buildDecisionRecord({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
      }),
      gate: buildGateFixture({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlDecisionHint: "RTL nötig",
      }),
    });
    expect(rtlPreview.providerSelectionStatus).toBe("needs_subtitle_capability");

    const crossLingualPreview = buildPreview({
      registryModel: configuredRegistry,
      adapterModel: readyAdapter,
      costPolicyPreview: pricedPolicy,
      requestDraft: buildRequestDraft({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
      queuePreview: buildQueuePreview({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
      assetPackDraft: buildAssetPackDraft({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
      latestDecisionRecord: buildDecisionRecord({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
      gate: buildGateFixture({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
    });
    expect(crossLingualPreview.providerSelectionStatus).toBe("needs_language_capability");
  });

  it("renders a human-readable panel without raw enum leakage", () => {
    const preview = buildPreview();
    const html = renderToStaticMarkup(
      <VoxyRenderProviderSelectionDraftPanel
        model={buildVoxyRenderProviderSelectionDraftPanelModel({ preview })}
      />,
    );

    expect(html).toContain("Provider-Auswahl");
    expect(html).toContain("Noch kein Providerlauf");
    expect(html).toContain("Keine Secrets");
    expect(html).toContain("Keine API-Aufrufe");
    expect(html).toContain("Keine Kosten");
    expect(html).toContain("Provider-Kandidaten");
    expect(html).toContain("Repo-Wahrheit");
    expect(html).not.toContain("needs_provider_configuration");
    expect(html).not.toContain("requirement_only");
  });
});

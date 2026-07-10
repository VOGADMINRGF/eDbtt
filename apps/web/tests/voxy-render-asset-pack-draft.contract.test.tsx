import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderAssetPackDraftPanel from "@/features/create/VoxyRenderAssetPackDraftPanel";
import {
  buildVoxyRenderAssetPackDraftPanelModel,
  buildVoxyRenderAssetPackDraftPreviewFromReadmodels,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import {
  buildVoxyRenderDecisionReasonSet,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  buildVoxyRenderCostCreditPolicyPreviewFromReadmodels,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
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
    persistedAt: "2026-07-10T08:00:00.000Z",
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

function buildGateFixture(overrides?: Record<string, unknown>) {
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
    ...overrides,
  } as any;
}

function buildRegistryFixture(overrides?: Record<string, unknown>) {
  return {
    registryStatus: "inventory_preview",
    assetInventory: [
      {
        id: "voxy_avatar",
        label: "Voxy-Avatar",
        status: "available",
        statusLabel: "Vorhanden",
        source: "repo",
        sourceLabel: "Repo",
        publicPath: "/brand/voxy/voxy-confident.png",
        reviewerVisibleReason: "Repo-Asset vorhanden.",
      },
      {
        id: "voice_profile",
        label: "Voice-Profil",
        status: "missing",
        statusLabel: "Fehlt",
        source: "requirement",
        sourceLabel: "Anforderung",
        publicPath: null,
        reviewerVisibleReason: "Kein echtes Voice-Profil vorhanden.",
      },
      {
        id: "brand_logo",
        label: "Brand-Logo",
        status: "available",
        statusLabel: "Vorhanden",
        source: "repo",
        sourceLabel: "Repo",
        publicPath: "/brand/voxy/overlays/voxy-wordmark.svg",
        reviewerVisibleReason: "Overlay vorhanden.",
      },
      {
        id: "background_template",
        label: "Background-Template",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        source: "manifest",
        sourceLabel: "Manifest",
        publicPath: null,
        reviewerVisibleReason: "Nur Manifest-Hinweis.",
      },
      {
        id: "subtitle_template",
        label: "Subtitle-Template",
        status: "missing",
        statusLabel: "Fehlt",
        source: "requirement",
        sourceLabel: "Anforderung",
        publicPath: null,
        reviewerVisibleReason: "Keine Untertitelvorlage vorhanden.",
      },
      {
        id: "lower_third_template",
        label: "Lower-Third-Template",
        status: "missing",
        statusLabel: "Fehlt",
        source: "requirement",
        sourceLabel: "Anforderung",
        publicPath: null,
        reviewerVisibleReason: "Keine Lower-Third-Vorlage vorhanden.",
      },
      {
        id: "source_caption_template",
        label: "Source-Caption-Template",
        status: "missing",
        statusLabel: "Fehlt",
        source: "requirement",
        sourceLabel: "Anforderung",
        publicPath: null,
        reviewerVisibleReason: "Keine Source-Caption-Vorlage vorhanden.",
      },
      {
        id: "export_preset",
        label: "Export-Preset",
        status: "missing",
        statusLabel: "Fehlt",
        source: "requirement",
        sourceLabel: "Anforderung",
        publicPath: null,
        reviewerVisibleReason: "Kein Export-Preset vorhanden.",
      },
    ],
    providerRegistry: [
      {
        id: "rtl_subtitles",
        label: "RTL-Untertitel",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "RTL bleibt Requirement-only.",
      },
      {
        id: "multilingual_voice",
        label: "Mehrsprachige Voice",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        providerName: null,
        executionAllowed: false,
        reviewerVisibleReason: "Mehrsprachige Voice bleibt Requirement-only.",
      },
    ],
    ...overrides,
  } as any;
}

function buildDraft(overrides?: Record<string, unknown>) {
  const draft = buildVoxyRenderRequestDraftFromReadmodels({
    surface: "admin",
    latestDecisionRecord: buildDecisionRecord(),
    gate: buildGateFixture(),
    handoffModel: {
      providerTargets: [],
      reviewGates: [],
      handoffStatus: "handoff_preview",
      sourceLanguage: "de",
      readingLanguage: "de",
      scriptLanguage: "de",
    } as any,
    preflightModel: {
      requiredAssets: [
        { id: "voice_profile", label: "Voice-Profil", status: "missing", reason: "Fehlt" },
        { id: "subtitle_template", label: "Subtitle-Template", status: "missing", reason: "Fehlt" },
        { id: "lower_third_template", label: "Lower-Third-Template", status: "missing", reason: "Fehlt" },
        { id: "source_caption_template", label: "Source-Caption-Template", status: "missing", reason: "Fehlt" },
        { id: "export_preset", label: "Export-Preset", status: "missing", reason: "Fehlt" },
      ],
      costStatus: "credit_policy_needed",
      costStatusLabel: "Credit-Policy separat",
      reviewerVisibleReason: "Kosten bleiben separat.",
      reviewReadiness: [],
      preflightStatus: "needs_asset_configuration",
      sourceLanguage: "de",
      readingLanguage: "de",
      renderLanguage: "de",
      subtitleLanguage: "de",
    } as any,
    registryModel: buildRegistryFixture(),
    adapterModel: {
      providerGateItems: [],
      requiredAssets: [],
      costGateItems: [],
      adapterStatus: "adapter_preview_only",
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
      requestStatus: "draft_only",
      assetRequirements: [
        {
          id: "subtitle_template_missing",
          label: "Subtitle-Template",
          status: "missing",
          statusLabel: "Fehlt",
          reason: "Fehlt",
        },
        {
          id: "lower_third_template_missing",
          label: "Lower-Third-Template",
          status: "missing",
          statusLabel: "Fehlt",
          reason: "Fehlt",
        },
        {
          id: "source_caption_template_missing",
          label: "Source-Caption-Template",
          status: "missing",
          statusLabel: "Fehlt",
          reason: "Fehlt",
        },
        {
          id: "export_preset_missing",
          label: "Export-Preset",
          status: "missing",
          statusLabel: "Fehlt",
          reason: "Fehlt",
        },
      ],
      providerRequirements: [
        {
          id: "voice_profile_missing",
          label: "Voice-Profil",
          status: "missing",
          statusLabel: "Fehlt",
          reason: "Fehlt",
        },
      ],
      costRequirements: [],
      reviewRequirements: [],
      subtitleLanguage: "de",
      renderLanguage: "de",
    }),
    latestDecisionRecord: buildDecisionRecord(),
    gate: buildGateFixture(),
  });
  return {
    ...preview,
    ...overrides,
  };
}

function buildCostPolicyPreview(overrides?: Record<string, unknown>) {
  const preview = buildVoxyRenderCostCreditPolicyPreviewFromReadmodels({
    surface: "admin",
    requestDraft: buildDraft(),
    queuePreview: buildQueuePreview(),
    latestDecisionRecord: buildDecisionRecord(),
    gate: buildGateFixture(),
    registryModel: buildRegistryFixture(),
    preflightModel: {
      preflightStatus: "needs_asset_configuration",
      blockers: [],
    } as any,
  });
  return {
    ...preview,
    ...overrides,
  };
}

describe("voxy render asset pack draft", () => {
  it("blocks when no request draft exists", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      registryModel: buildRegistryFixture(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview.assetPackStatus).toBe("blocked_by_missing_request_draft");
  });

  it("blocks when no registry exists", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft(),
      queuePreview: buildQueuePreview(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview.assetPackStatus).toBe("blocked_by_missing_registry");
  });

  it("keeps the pack as script-only when the draft says so", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({ requestStatus: "keep_as_script_only" }),
      queuePreview: buildQueuePreview({ queueStatus: "keep_as_script_only" }),
      costPolicyPreview: buildCostPolicyPreview({ policyStatus: "keep_as_script_only" }),
      registryModel: buildRegistryFixture(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview.assetPackStatus).toBe("keep_as_script_only");
  });

  it("recognizes real repo and manifest assets honestly", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft(),
      queuePreview: buildQueuePreview(),
      costPolicyPreview: buildCostPolicyPreview(),
      registryModel: buildRegistryFixture(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview.assetEntries.find((item) => item.assetKey === "voxy_avatar")).toMatchObject({
      status: "available",
      source: "repo",
      publicPath: "/brand/voxy/voxy-confident.png",
    });
    expect(preview.assetEntries.find((item) => item.assetKey === "brand_logo")).toMatchObject({
      status: "available",
      publicPath: "/brand/voxy/overlays/voxy-wordmark.svg",
    });
    expect(preview.assetEntries.find((item) => item.assetKey === "background_template")).toMatchObject({
      status: "requirement_only",
      source: "manifest",
    });
  });

  it("marks missing voice, subtitle, lower third, source caption and export assets honestly", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft(),
      queuePreview: buildQueuePreview(),
      costPolicyPreview: buildCostPolicyPreview(),
      registryModel: buildRegistryFixture(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview.assetPackStatus).toBe("needs_voice_profile");
    expect(preview.assetEntries.find((item) => item.assetKey === "voice_profile")?.status).toBe("missing");
    expect(preview.assetEntries.find((item) => item.assetKey === "subtitle_template")?.status).toBe("missing");
    expect(preview.assetEntries.find((item) => item.assetKey === "lower_third_template")?.status).toBe("missing");
    expect(preview.assetEntries.find((item) => item.assetKey === "source_caption_template")?.status).toBe("missing");
    expect(preview.assetEntries.find((item) => item.assetKey === "export_preset")?.status).toBe("missing");
  });

  it("requires multilingual voice support for Turkish cross-lingual output", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({ sourceLanguage: "tr", readingLanguage: "de", scriptLanguage: "de" }),
      queuePreview: buildQueuePreview({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
      costPolicyPreview: buildCostPolicyPreview({
        sourceLanguage: "tr",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
      }),
      registryModel: buildRegistryFixture(),
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

    expect(preview.assetEntries.find((item) => item.assetKey === "multilingual_voice_support")).toMatchObject({
      status: "missing",
    });
  });

  it("requires rtl subtitle support for Arabic rtl output and keeps raw enums out of the panel", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft({ sourceLanguage: "ar", readingLanguage: "de", scriptLanguage: "ar", subtitleLanguage: "ar" }),
      queuePreview: buildQueuePreview({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
      }),
      costPolicyPreview: buildCostPolicyPreview({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
      }),
      registryModel: buildRegistryFixture(),
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
      }),
    });
    const panel = buildVoxyRenderAssetPackDraftPanelModel({ preview });
    const html = renderToStaticMarkup(<VoxyRenderAssetPackDraftPanel model={panel} />);

    expect(preview.rtlRequired).toBe(true);
    expect(preview.assetEntries.find((item) => item.assetKey === "rtl_subtitle_support")).toMatchObject({
      status: "missing",
    });
    expect(html).toContain("Render-Asset-Pack");
    expect(html).toContain("Noch keine Datei");
    expect(html).not.toContain("needs_voice_profile");
    expect(html).not.toContain("blocked_by_missing_request_draft");
  });

  it("keeps every execution flag disabled", () => {
    const preview = buildVoxyRenderAssetPackDraftPreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft(),
      queuePreview: buildQueuePreview(),
      costPolicyPreview: buildCostPolicyPreview(),
      registryModel: buildRegistryFixture(),
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview.execution).toMatchObject({
      createsMediaFile: false,
      createsSubtitleFile: false,
      createsVoiceFile: false,
      createsExportPreset: false,
      callsProvider: false,
      queueEnabled: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      runtimeClaimAllowed: false,
    });
  });
});

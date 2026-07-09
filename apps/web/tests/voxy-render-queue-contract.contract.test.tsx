import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderQueueContractPanel from "@/features/create/VoxyRenderQueueContractPanel";
import {
  buildVoxyRenderQueuePanelModel,
  buildVoxyRenderQueuePreviewFromReadmodels,
  type VoxyRenderQueuePersistenceState,
} from "@/features/create/voxyRenderQueueContract";
import { buildVoxyRenderDecisionReasonSet } from "@/features/create/voxyRenderDecisionPersistenceContract";
import { buildVoxyRenderRequestDraftFromReadmodels } from "@/features/create/voxyRenderRequestDraftContract";

function buildDecisionRecord(overrides?: Record<string, unknown>) {
  const reasons = buildVoxyRenderDecisionReasonSet({
    selectedDecision: "review_script",
    reviewerNote: "Alles nur review-first vorbereiten.",
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
    reviewerNote: "Alles nur review-first vorbereiten.",
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
  overrides?: Partial<VoxyRenderQueuePersistenceState>,
): VoxyRenderQueuePersistenceState {
  return {
    mode: "persistent_primary",
    label: "Persistenter Voxy-Queue-Preview-Store",
    summary: "Queue-Preview-Records und Audit-Spuren liegen dauerhaft getrennt von jeder Ausführung vor.",
    repositoryInterface: "VoxyRenderQueuePreviewRepository",
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
    reviewGates: [
      {
        id: "script_review",
        label: "Script-Review",
        status: "ready",
        statusLabel: "Bereit",
        reason: "Script wurde als Review-Artefakt vorbereitet.",
      },
    ],
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
      reviewGates: [
        {
          id: "publish_review",
          label: "Publish-Review",
          status: "requirement_only",
          reason: "Publishing bleibt separat.",
        },
      ],
      handoffStatus: "adapter_only",
      sourceLanguage: "ar",
      readingLanguage: "de",
      scriptLanguage: "ar",
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
      reviewReadiness: [
        {
          id: "sourceReview",
          label: "Quellen prüfen",
          status: "ready",
          reason: "Quellenhinweis sichtbar.",
        },
      ],
      preflightStatus: "preflight_ready",
      sourceLanguage: "ar",
      readingLanguage: "de",
      renderLanguage: "ar",
      subtitleLanguage: "de",
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

describe("voxy render queue contract", () => {
  it("blocks admin/workspace queue previews when no request draft record exists", () => {
    const preview = buildVoxyRenderQueuePreviewFromReadmodels({
      surface: "admin",
      requestDraft: null,
      allowRequestDraftSynthesis: false,
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview?.queueStatus).toBe("blocked_by_missing_request_draft");
    expect(preview?.execution).toMatchObject({
      queueEnabled: false,
      createsQueueJob: false,
      workerExecutionAllowed: false,
      providerExecutionAllowed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    });
  });

  it("inherits keep-as-script-only from the latest decision", () => {
    const preview = buildVoxyRenderQueuePreviewFromReadmodels({
      surface: "admin",
      requestDraft: buildDraft(),
      latestDecisionRecord: buildDecisionRecord({
        selectedDecision: "keep_as_script_only",
      }),
      gate: buildGateFixture(),
    });

    expect(preview?.queueStatus).toBe("keep_as_script_only");
  });

  it("maps request-draft blockers into queue blockers without creating runtime claims", () => {
    const preview = buildVoxyRenderQueuePreviewFromReadmodels({
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
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview?.queueStatus).toBe("blocked_by_missing_provider");
    expect(preview?.estimatedRuntimeRequirements.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "queue_runtime_missing",
        "worker_runtime_missing",
        "provider_runtime_missing",
        "media_runtime_missing",
        "cost_runtime_missing",
        "publish_runtime_missing",
      ]),
    );
  });

  it("stays queue-contract-only when the request draft is formally ready", () => {
    const preview = buildVoxyRenderQueuePreviewFromReadmodels({
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
      latestDecisionRecord: buildDecisionRecord(),
      gate: buildGateFixture(),
    });

    expect(preview?.queueStatus).toBe("queue_contract_only");
    expect(preview?.rtlRequired).toBe(true);
    expect(preview?.sourceLanguage).toBe("ar");
    expect(preview?.subtitleLanguage).toBe("de");
  });

  it("renders human UI copy instead of leaking raw enum values", () => {
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
    const model = buildVoxyRenderQueuePanelModel({
      preview,
      storeState: buildStoreState(),
    });

    const html = renderToStaticMarkup(<VoxyRenderQueueContractPanel model={model} />);

    expect(html).toContain("Render-Queue-Vertrag");
    expect(html).toContain("Nur Queue-Vertrag");
    expect(html).toContain("Noch keine Queue");
    expect(html).toContain("Kein Worker");
    expect(html).toContain("Request-Draft:");
    expect(html).not.toContain("queue_contract_only");
    expect(html).not.toContain("blocked_by_missing_provider");
  });
});

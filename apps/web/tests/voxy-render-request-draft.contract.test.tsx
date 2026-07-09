import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderRequestDraftPanel from "@/features/create/VoxyRenderRequestDraftPanel";
import {
  buildVoxyRenderRequestDraftFromReadmodels,
  buildVoxyRenderRequestDraftPanelModel,
  type VoxyRenderRequestDraftPersistenceState,
  type VoxyRenderRequestDraftRecord,
} from "@/features/create/voxyRenderRequestDraftContract";
import { buildVoxyRenderDecisionReasonSet } from "@/features/create/voxyRenderDecisionPersistenceContract";

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
  overrides?: Partial<VoxyRenderRequestDraftPersistenceState>,
): VoxyRenderRequestDraftPersistenceState {
  return {
    mode: "persistent_primary",
    label: "Persistenter Voxy-Request-Draft-Store",
    summary: "Request-Drafts und Audit-Spuren liegen dauerhaft getrennt von jeder Ausführung vor.",
    repositoryInterface: "VoxyRenderRequestDraftRepository",
    storeKind: "mongo_collection",
    productionTruth: true,
    restartReconstructable: true,
    deploymentReconstructable: true,
    adminWritePath: "admin_api_available",
    ...overrides,
  };
}

function buildGateFixture(surface: "create" | "admin" = "admin") {
  return {
    title: "Render-Entscheidung",
    summary: "Review-first Decision Gate",
    surface,
    decisionGateId: `voxy-render-review-decision-gate:${surface}-1`,
    contributionRef: {
      id: `review-item-${surface}-1`,
      title: "Sichere Schulwege",
      href: surface === "create" ? "/create" : "/admin/review",
    },
    dossierRef:
      surface === "admin"
        ? {
            id: "dossier-1",
            title: "Sichere Schulwege",
            href: "/dossier/demo",
          }
        : null,
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
    decisionStatus: surface === "admin" ? "needs_persistence" : "decision_preview",
    decisionStatusLabel:
      surface === "admin" ? "Entscheidung braucht Persistenz" : "Review-Entscheidung als Vorschau",
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
  return buildVoxyRenderRequestDraftFromReadmodels({
    surface: "admin",
    latestDecisionRecord: buildDecisionRecord(),
    gate: buildGateFixture("admin"),
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
      reviewReadiness: [
        {
          id: "sourceReview",
          label: "Quellen prüfen",
          status: "ready",
          reason: "Quellenhinweis sichtbar.",
        },
      ],
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
    ...overrides,
  });
}

describe("voxy render request draft contract", () => {
  it("keeps create surfaces as request-draft preview when no decision is persisted", () => {
    const draft = buildVoxyRenderRequestDraftFromReadmodels({
      surface: "create",
      latestDecisionRecord: null,
      gate: buildGateFixture("create"),
      handoffModel: {
        providerTargets: [],
        reviewGates: [],
        handoffStatus: "adapter_only",
      } as any,
      preflightModel: {
        requiredAssets: [],
        costStatus: "requirement_only",
        costStatusLabel: "Kosten separat",
        reviewerVisibleReason: "Nur Review.",
        reviewReadiness: [],
        preflightStatus: "preflight_ready",
      } as any,
      registryModel: {
        providerRegistry: [],
        assetInventory: [],
        registryStatus: "registry_ready",
      } as any,
      adapterModel: {
        providerGateItems: [],
        requiredAssets: [],
        costGateItems: [],
        adapterStatus: "adapter_ready",
      } as any,
    });
    const model = buildVoxyRenderRequestDraftPanelModel({ draft });

    expect(draft).not.toBeNull();
    expect(draft?.requestStatus).toBe("blocked_by_missing_decision");
    expect(model?.storeStateLabel).toBe("Kein Request-Draft-Store im Surface");
    expect(model?.blockedReasons).toContain(
      "Ohne persistierte Review-Entscheidung bleibt der Render-Request-Draft nur Vorschau.",
    );
    expect(model?.executionFlags.queueAllowed).toBe(false);
  });

  it("renders stored admin request drafts without pretending execution", () => {
    const draft = buildDraft();
    const latestRecord = {
      ...(draft as VoxyRenderRequestDraftRecord),
      requestDraftId: "voxy-render-request-draft:stored-1",
      persistedAt: "2026-07-09T12:30:00.000Z",
      persistedBy: "admin-1",
      idempotencyKey: "request-draft-idempotency-1",
      requestVersion: 2,
    };
    const model = buildVoxyRenderRequestDraftPanelModel({
      draft,
      latestRecord,
      storeState: buildStoreState(),
    });
    const html = renderToStaticMarkup(
      <VoxyRenderRequestDraftPanel model={model} dataTestId="voxy-render-request-draft-panel" />,
    );

    expect(draft?.requestStatus).toBe("ready_for_future_runtime_review");
    expect(model?.requestStatusLabel).toBe("Formal vorbereitet für spätere Runtime-Prüfung");
    expect(model?.latestRecord?.requestDraftId).toBe("voxy-render-request-draft:stored-1");
    expect(model?.storeStateLabel).toBe("Persistenter Voxy-Request-Draft-Store");
    expect(html).toContain("Render-Request-Draft");
    expect(html).toContain("Noch kein Renderjob");
    expect(html).toContain("Kein Providerlauf");
    expect(html).toContain("Keine Kostenbuchung");
    expect(html).toContain("Keine Veröffentlichung");
    expect(html).toContain("Store-Grenze");
    expect(html).toContain("Letzter Draft-Record");
  });
});

import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderReviewDecisionGatePanel from "@/features/create/VoxyRenderReviewDecisionGatePanel";
import {
  buildVoxyRenderDecisionExecutionFlags,
  buildVoxyRenderDecisionPersistencePanelModel,
  buildVoxyRenderDecisionReasonSet,
  type VoxyRenderDecisionPersistenceState,
  type VoxyRenderPersistedDecisionRecord,
} from "@/features/create/voxyRenderDecisionPersistenceContract";

function buildGateFixture(surface: "create" | "admin" | "workspace" = "create") {
  return {
    title: "Render-Entscheidung",
    summary: "Review-first Decision Gate",
    surface,
    decisionGateId: `voxy-render-review-decision-gate:${surface}-1`,
    contributionRef: {
      id: `contribution-${surface}-1`,
      title: "Sichere Schulwege",
      href: "/create?resume=handoff-1",
    },
    dossierRef:
      surface === "create"
        ? null
        : {
            id: `dossier-${surface}-1`,
            title: "Sichere Schulwege",
            href: "/dossier/demo",
          },
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    scriptRef: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    languageLabel: "Quelle: Deutsch · Lesefassung: Deutsch · Script: Deutsch · Render-Ziel: Deutsch",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDecisionHint: null,
    decisionStatus: surface === "create" ? "decision_preview" : "needs_persistence",
    decisionStatusLabel:
      surface === "create" ? "Review-Entscheidung als Vorschau" : "Entscheidung braucht Persistenz",
    reviewGates: [],
    decisionOptions: [
      {
        id: "review_script",
        label: "Script prüfen",
        reviewerVisibleReason: "Script muss zuerst geprüft werden.",
        userVisibleReason: "Das Script braucht zuerst menschliches Review.",
        enabled: true,
        executionAllowed: false,
        requiresHumanReview: true,
        createsRenderJob: false,
        callsProvider: false,
        createsMedia: false,
        debitsCost: false,
        publishes: false,
      },
    ],
    recommendedDecision: {
      id: "review_script",
      label: "Script prüfen",
      reviewerVisibleReason: "Script muss zuerst geprüft werden.",
      userVisibleReason: "Das Script braucht zuerst menschliches Review.",
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
    reviewerVisibleReason: "Nur Readmodel, keine Execution.",
    nextStep: "Render-Entscheidung prüfen",
    noRuntimeClaim: true,
  } as const;
}

function buildStoreState(
  overrides?: Partial<VoxyRenderDecisionPersistenceState>,
): VoxyRenderDecisionPersistenceState {
  return {
    mode: "persistent_primary",
    label: "Persistenter Voxy-Decision-Store",
    summary: "Decision-Records und Audit-Spuren liegen dauerhaft vor.",
    repositoryInterface: "VoxyRenderDecisionRepository",
    storeKind: "mongo_collection",
    productionTruth: true,
    restartReconstructable: true,
    deploymentReconstructable: true,
    adminWritePath: "admin_api_available",
    ...overrides,
  };
}

function buildLatestRecord(
  overrides?: Partial<VoxyRenderPersistedDecisionRecord>,
): VoxyRenderPersistedDecisionRecord {
  const reasons = buildVoxyRenderDecisionReasonSet({
    selectedDecision: "review_script",
    reviewerNote: "Script zuerst prüfen.",
  });
  return {
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    contributionRef: {
      id: "contribution-admin-1",
      title: "Sichere Schulwege",
      href: "/admin/review",
    },
    dossierRef: {
      id: "dossier-admin-1",
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
    reviewerNote: "Script zuerst prüfen.",
    reviewerRole: "admin",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    originalPreserved: true,
    translationIsEvidence: false,
    persistedAt: "2026-07-09T10:00:00.000Z",
    persistedBy: "admin-1",
    executionFlags: buildVoxyRenderDecisionExecutionFlags(),
    idempotencyKey: "idempotency-1",
    previousDecisionRef: null,
    supersedesDecisionRef: null,
    decisionVersion: 1,
    ...overrides,
  };
}

describe("voxy render decision persistence contract", () => {
  it("shows honest readmodel-only persistence status on create surfaces", () => {
    const gate = buildGateFixture("create");
    const model = buildVoxyRenderDecisionPersistencePanelModel({ gate });

    expect(model).not.toBeNull();
    expect(model?.persistenceStatus).toBe("readmodel_only");
    expect(model?.persistenceStatusLabel).toBe("Nur Readmodel");
    expect(model?.storeStateLabel).toBe("Kein Persistenz-Store im Surface");
    expect(model?.commandPreview.selectedDecision).toBe("review_script");
    expect(model?.auditLines.join(" ")).toContain("Audit- und Store-Preview");
  });

  it("shows persisted admin records without claiming execution", () => {
    const gate = buildGateFixture("admin");
    const latestRecord = buildLatestRecord();
    const model = buildVoxyRenderDecisionPersistencePanelModel({
      gate,
      latestRecord,
      storeState: buildStoreState(),
    });

    expect(model).not.toBeNull();
    expect(model?.persistenceStatus).toBe("persisted_review_decision");
    expect(model?.persistenceStatusLabel).toBe("Gespeichert");
    expect(model?.latestRecord?.decisionId).toBe(latestRecord.decisionId);
    expect(model?.latestRecord?.selectedDecisionLabel).toBe("Script prüfen");
    expect(model?.executionFlags).toEqual({
      noRenderAction: true,
      noProviderExecution: true,
      noRenderQueue: true,
      noMediaCreation: true,
      noCostDebit: true,
      noPublishAction: true,
      noSocialPostAction: true,
      noRuntimeClaim: true,
    });
  });

  it("renders the persistence section inside the review decision panel", () => {
    const gate = buildGateFixture("workspace");
    const persistenceModel = buildVoxyRenderDecisionPersistencePanelModel({
      gate,
      latestRecord: buildLatestRecord({
        decisionGateId: gate.decisionGateId,
      }),
      storeState: buildStoreState(),
    });
    const html = renderToStaticMarkup(
      <VoxyRenderReviewDecisionGatePanel
        model={gate as any}
        persistenceModel={persistenceModel}
        dataTestId="voxy-render-decision-panel"
      />,
    );

    expect(html).toContain("Review-Entscheidung dokumentieren");
    expect(html).toContain("Decision-Command");
    expect(html).toContain("Store-Grenze");
    expect(html).toContain("Letzter Record");
    expect(html).toContain("Keine Ausführung: kein Renderjob");
  });
});

import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { buildCanonicalLanguageBridgeRecord } from "@/features/create/languageBridgeTrustFormatContract";
import { buildCanonicalSourcePack } from "@/features/create/canonicalSourcePackContract";
import { buildDossierSocialOutputDraft } from "@/features/create/dossierSocialOutputDraftContract";
import { buildParticipationHandoffCandidate } from "@/features/create/participationHandoffContract";
import VoxyRenderReviewDecisionGatePanel from "@/features/create/VoxyRenderReviewDecisionGatePanel";
import {
  buildVoxyRenderReviewDecisionGateFromReadmodels,
  buildVoxyRenderReviewDecisionGateFromReviewContext,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyRenderAdapterNoopFromReviewContext,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromReviewContext,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyPublishDraft,
  buildVoxyReviewState,
  buildVoxyVideoBriefing,
  resolveVoxyRenderJob,
} from "@/features/voxyVideo";

function buildReviewContextFixture(input?: {
  sourceLanguage?: string;
  readingLanguage?: string;
  originalText?: string;
  summaryText?: string;
  openQuestions?: string[];
  sourceGaps?: string[];
  claims?: string[];
  counterPositions?: string[];
}) {
  const sourceLanguage = input?.sourceLanguage ?? "de";
  const readingLanguage = input?.readingLanguage ?? "de";
  const sourcePack = buildCanonicalSourcePack({
    sourcePackId: "source-pack-1",
    sources: [],
    openGaps: input?.sourceGaps ?? ["Es fehlt ein belastbarer Quellenhinweis."],
  });
  const languageBridge = buildCanonicalLanguageBridgeRecord({
    sourceLanguage,
    contentLanguage: readingLanguage,
    readingLocale: readingLanguage,
    uiLocale: "de",
    originalText:
      input?.originalText ??
      "Wir brauchen sichere Schulwege und klare Prioritäten.",
    summaryText:
      input?.summaryText ??
      input?.claims?.[0] ??
      "Sichere Schulwege priorisieren.",
    openQuestions: input?.openQuestions ?? ["Welche Kreuzung zuerst?"],
    trustState: "source_needed",
  });
  const voxyBriefing = buildVoxyVideoBriefing({
    briefingId: "briefing-1",
    sourceContextKind: "dossier",
    sourceContextId: "dossier-1",
    title: "Sichere Schulwege · Voxy-Briefing",
    summary: "Nur als interner Briefing-Entwurf sichtbar.",
    languageBridge,
    sourcePack,
  });

  return {
    primaryUnifiedItem: {
      id: "create-handoff-1",
      source: "create_handoff",
      sourceId: "create-handoff-1",
      title: "Arbeitsstand",
      summary: "Review-first Handoff",
      queueState: "review_ready",
      requiredReviewType: "editorial_review",
      requiredReviewerRoles: ["editor"],
      lifecycleStatus: "review_ready",
      preparationStatus: "review_ready",
      reviewReadyIsApproved: false,
      publishReadyIsPublished: false,
      reviewRequired: true,
      autoPublish: false,
      publishGuard: {
        autoPublish: false,
        reviewRequired: true,
        publicOutputAllowed: false,
        publishActionEnabled: false,
        externalSocialApiTriggered: false,
      },
      sourcePackId: "source-pack-1",
      sourcePackEvidenceState: "missing",
      trustState: "source_needed",
      languageSummary: {
        originalLanguage: sourceLanguage,
        readingLanguage,
      },
      nextAllowedActions: ["review"],
      reviewWorld: "existing_review_queue",
    },
    unifiedItems: [],
    sourcePack,
    languageBridge,
    multilingualThread: {
      readingLocale: readingLanguage,
    },
    multilingualEvidence: {
      overallTrustStatus: "source_needed",
    },
    participationCandidates: [
      buildParticipationHandoffCandidate({
        id: "candidate-1",
        recommendation: "statement_review",
        title: "Eltern und Schule einbeziehen",
        prompt: "Welche Erfahrung vor Ort fehlt noch?",
        options: [],
      }),
    ],
    crossLingualSuggestions: [],
    socialOutputDrafts: [
      buildDossierSocialOutputDraft({
        draftId: "draft-1",
        dossierId: "dossier-1",
        kind: "voxy_briefing_note",
        title: "Voxy Briefing Notiz",
        summary: "Nur interner Entwurf, noch kein Video.",
      }),
    ],
    dossierWorkspaceSurface: {
      title: "Arbeitsstand",
      sections: {
        claims: input?.claims ?? ["Sichere Schulwege sollen priorisiert werden."],
        counterPositions:
          input?.counterPositions ?? ["Lieferverkehr und Erreichbarkeit müssen mitgedacht werden."],
        openQuestions: input?.openQuestions ?? ["Welche Kreuzung zuerst?"],
      },
    },
    voxyBriefing,
    voxyScriptSegments: [],
    voxyReviewState: buildVoxyReviewState(),
    voxyRenderJob: resolveVoxyRenderJob({
      briefingId: "briefing-1",
      approvalGranted: true,
      providerConfigured: false,
    }),
    voxyPublishDraft: buildVoxyPublishDraft({
      briefingId: "briefing-1",
      publishApproved: false,
      runtimeReady: false,
      targetHints: ["voxy_briefing_note"],
    }),
  } as any;
}

function buildBaseModels(input?: {
  sourceLanguage?: string;
  readingLanguage?: string;
  originalText?: string;
  summaryText?: string;
  claims?: string[];
  counterPositions?: string[];
  openQuestions?: string[];
}) {
  const context = buildReviewContextFixture({
    sourceLanguage: input?.sourceLanguage,
    readingLanguage: input?.readingLanguage,
    originalText: input?.originalText,
    summaryText: input?.summaryText,
    claims: input?.claims,
    counterPositions: input?.counterPositions,
    openQuestions: input?.openQuestions,
  });

  const contributionRef = {
    id: "handoff-1",
    title: "Sichere Schulwege",
    href: "/create?resume=handoff-1",
  };

  return {
    context,
    contributionRef,
    scriptModel: buildVoxyBriefingScriptCandidateFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    handoffModel: buildVoxyRenderProviderHandoffFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    preflightModel: buildVoxyRenderPreflightReadinessFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    registryModel: buildVoxyRenderAssetProviderRegistryFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
    adapterModel: buildVoxyRenderAdapterNoopFromReviewContext(context, {
      audience: "admin",
      contributionRef,
    }),
  };
}

describe("voxy render review decision gate contract", () => {
  it("derives review-first decisions without creating execution", () => {
    const model = buildVoxyRenderReviewDecisionGateFromReviewContext(
      buildBaseModels().context,
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-1",
          title: "Sichere Schulwege",
          href: "/create?resume=handoff-1",
        },
      },
    );

    expect(model).not.toBeNull();
    expect(model?.decisionOptions.find((item) => item.id === "review_script")?.enabled).toBe(true);
    expect(model?.decisionOptions.find((item) => item.id === "request_sources")?.enabled).toBe(true);
    expect(model?.decisionOptions.find((item) => item.id === "review_factcheck")?.enabled).toBe(true);
    expect(model?.decisionOptions.find((item) => item.id === "prepare_assets")?.enabled).toBe(true);
    expect(model?.decisionOptions.find((item) => item.id === "configure_provider")?.enabled).toBe(true);
    expect(model?.decisionOptions.find((item) => item.id === "define_cost_policy")?.enabled).toBe(true);
    expect(model?.decisionOptions.find((item) => item.id === "check_credits")?.enabled).toBe(true);
    expect(model?.decisionOptions.every((item) => item.executionAllowed === false)).toBe(true);
    expect(model?.decisionOptions.every((item) => item.callsProvider === false)).toBe(true);
    expect(model?.decisionOptions.every((item) => item.createsRenderJob === false)).toBe(true);
    expect(model?.decisionOptions.every((item) => item.createsMedia === false)).toBe(true);
    expect(model?.decisionOptions.every((item) => item.debitsCost === false)).toBe(true);
    expect(model?.decisionOptions.every((item) => item.publishes === false)).toBe(true);
    expect(model?.decisionResultPreview).toEqual({
      resultKind: model?.decisionResultPreview.resultKind,
      resultKindLabel: model?.decisionResultPreview.resultKindLabel,
      noRenderAction: true,
      noProviderExecution: true,
      noMediaCreation: true,
      noCostDebit: true,
      noPublishAction: true,
      noRuntimeClaim: true,
    });
    expect(model?.decisionResultPreview.resultKind).not.toBe("blocked_preview");
  });

  it("enables language review for cross-lingual and RTL cases", () => {
    const crossLingualModel = buildVoxyRenderReviewDecisionGateFromReviewContext(
      buildBaseModels({
        sourceLanguage: "de",
        readingLanguage: "en",
      }).context,
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-1",
          title: "Cross Lingual",
          href: "/create?resume=handoff-1",
        },
      },
    );
    const rtlModel = buildVoxyRenderReviewDecisionGateFromReviewContext(
      buildBaseModels({
        sourceLanguage: "ar",
        readingLanguage: "de",
      }).context,
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-rtl",
          title: "RTL",
          href: "/create?resume=handoff-rtl",
        },
      },
    );

    expect(crossLingualModel?.decisionOptions.find((item) => item.id === "review_language")?.enabled).toBe(true);
    expect(rtlModel?.decisionOptions.find((item) => item.id === "review_language")?.enabled).toBe(true);
    expect(rtlModel?.rtlDecisionHint).toContain("RTL");
  });

  it("allows a deliberate keep-as-script-only recommendation for high-risk scripts", () => {
    const models = buildBaseModels();
    const highRiskScriptModel = models.scriptModel
      ? {
          ...models.scriptModel,
          scriptStatus: "needs_compliance_review" as const,
          scriptRisks: [
            {
              id: "legal_policy_sensitivity" as const,
              label: "Rechtlich/politisch sensibel",
              reason: "Der Fall ist regulatorisch sensibel.",
            },
            {
              id: "vulnerable_group_impact" as const,
              label: "Betroffenengruppen sensibel",
              reason: "Betroffene Gruppen brauchen vorsichtige Darstellung.",
            },
            {
              id: "public_misinterpretation_risk" as const,
              label: "Missverständnisrisiko",
              reason: "Öffentliche Verkürzung wäre wahrscheinlich.",
            },
            {
              id: "overclaiming_risk" as const,
              label: "Überdehnungsrisiko",
              reason: "Die Aussage wäre als Video zu zugespitzt.",
            },
          ],
        }
      : null;

    const model = buildVoxyRenderReviewDecisionGateFromReadmodels({
      surface: "admin",
      scriptModel: highRiskScriptModel,
      handoffModel: models.handoffModel,
      preflightModel: models.preflightModel,
      registryModel: models.registryModel,
      adapterModel: models.adapterModel,
      contributionRef: models.contributionRef,
    });

    expect(model?.decisionStatus).toBe("keep_as_script_only");
    expect(model?.decisionOptions.find((item) => item.id === "keep_as_script_only")?.enabled).toBe(true);
  });

  it("renders reviewer-facing copy without leaking raw enums", () => {
    const model = buildVoxyRenderReviewDecisionGateFromReviewContext(
      buildBaseModels({
        sourceLanguage: "ar",
        readingLanguage: "de",
      }).context,
      {
        audience: "admin",
        contributionRef: {
          id: "handoff-1",
          title: "Sichere Schulwege",
          href: "/create?resume=handoff-1",
        },
      },
    );

    const html = renderToStaticMarkup(
      React.createElement(VoxyRenderReviewDecisionGatePanel, {
        model,
        dataTestId: "voxy-render-review-decision-gate",
      }),
    );

    expect(html).toContain("Render-Entscheidung");
    expect(html).toContain("Was müsste zuerst geprüft werden?");
    expect(html).toContain("Script prüfen");
    expect(html).toContain("Quellen nachfordern");
    expect(html).toContain("Factcheck prüfen");
    expect(html).toContain("Sprache und Untertitel prüfen");
    expect(html).toContain("Keine Ausführung");
    expect(html).toContain("kein Renderjob, kein Providerlauf, keine Datei, keine Kosten, kein Publish");
    expect(html).toContain("Nächste empfohlene Entscheidung");
    expect(html).not.toContain("review_script");
    expect(html).not.toContain("request_sources");
    expect(html).not.toContain("blocked_by_runtime_truth");
  });
});

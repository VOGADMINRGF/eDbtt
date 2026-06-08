import type { LandingContributionRelevance } from "@/features/start/landingCreateLight";
import type { StartDraftContext, StartDraftTarget } from "@/features/start/startDraftContext";
import {
  getFactcheckEntitlementGateMessage,
  resolveFactcheckEntitlementGate,
} from "@features/factcheck/entitlementGate";

export type DraftNextAction =
  | "continue_draft"
  | "run_light_analysis"
  | "request_editorial_review"
  | "start_fact_check"
  | "prepare_dossier"
  | "prepare_round"
  | "attach_to_theme"
  | "require_login"
  | "require_pricing"
  | "blocked_spam"
  | "needs_reframe";

export type DraftNextActionStatus =
  | "draft"
  | "analysis_draft"
  | "review_pending"
  | "pricing_confirmation"
  | "reframe_required"
  | "blocked";

export type DraftNextActionOption = {
  kind: DraftNextAction;
  label: string;
  description: string;
  href: string;
  status: DraftNextActionStatus;
  statusLabel: string;
  loginRequired: boolean;
  costGateRequired: boolean;
  confirmationRequired: boolean;
};

export type DraftGateParams = {
  isAuthenticated: boolean;
  canDeepResearch: boolean;
};

export type DraftGateSummary = {
  statusLabel: string;
  actions: DraftNextActionOption[];
};

export type DraftResumeCategory = "Beitrag" | "Thema" | "Runde" | "Redaktion";

export type CreateDraftNextActionParam = "light_analysis" | "factcheck";

function buildLoginHref(next: string) {
  return `/login?next=${encodeURIComponent(next)}&draft=start`;
}

export function parseCreateDraftNextActionParam(
  value?: string | null,
): CreateDraftNextActionParam | null {
  if (value === "light_analysis" || value === "factcheck") return value;
  return null;
}

export function resolveDraftNextActionStatusLabel(status: DraftNextActionStatus): string {
  switch (status) {
    case "analysis_draft":
      return "Analyse-Entwurf · Noch nicht veröffentlicht · Keine Quellenprüfung gestartet";
    case "review_pending":
      return "Zur manuellen Prüfung vorgemerkt";
    case "pricing_confirmation":
      return "Vertiefte Prüfung benötigt Bestätigung";
    case "reframe_required":
      return "Öffentliche Relevanz klären";
    case "blocked":
      return "Kein weiterer Schritt ohne Überarbeitung";
    default:
      return "Entwurf";
  }
}

function normalizeDraftRelevance(
  draft: Pick<StartDraftContext, "origin" | "preview">,
): LandingContributionRelevance {
  if (draft.origin === "start_relevance_review") return "needs_reframe";
  const previewRelevance = draft.preview?.relevance;
  if (
    previewRelevance === "public_relevant" ||
    previewRelevance === "needs_reframe" ||
    previewRelevance === "personal_only" ||
    previewRelevance === "spam_suspected" ||
    previewRelevance === "abusive_or_empty"
  ) {
    return previewRelevance;
  }
  return "public_relevant";
}

function buildLightAnalysisAction(targetHint?: StartDraftTarget): DraftNextActionOption {
  const href =
    targetHint === "themes"
      ? "/create?startDraft=1&nextAction=light_analysis"
      : targetHint === "rounds"
        ? "/create?startDraft=1&from=rounds&nextAction=light_analysis"
        : "/create?startDraft=1&nextAction=light_analysis";
  return {
    kind: "run_light_analysis",
    label: "Leichte Einordnung starten",
    description:
      "Startet nur einen leichten Analyse-Entwurf. Keine vertiefte Recherche, keine Quellenprüfung und keine automatische Veröffentlichung.",
    href,
    status: "analysis_draft",
    statusLabel: resolveDraftNextActionStatusLabel("analysis_draft"),
    loginRequired: false,
    costGateRequired: false,
    confirmationRequired: true,
  };
}

function buildEditorialReviewAction(params: {
  isAuthenticated: boolean;
}): DraftNextActionOption {
  const href = params.isAuthenticated
    ? "/start?review=editorial"
    : buildLoginHref("/start?review=editorial");
  return {
    kind: "request_editorial_review",
    label: "Zur redaktionellen Prüfung geben",
    description:
      "Vormerkung für manuelle Prüfung. Keine Veröffentlichung, kein Dossier, kein Vote und keine automatische Recherche.",
    href,
    status: "review_pending",
    statusLabel: resolveDraftNextActionStatusLabel("review_pending"),
    loginRequired: !params.isAuthenticated,
    costGateRequired: false,
    confirmationRequired: true,
  };
}

function buildFactcheckAction(params: DraftGateParams): DraftNextActionOption {
  const factcheckHref = params.isAuthenticated
    ? "/create?startDraft=1&nextAction=factcheck"
    : buildLoginHref("/create?startDraft=1&nextAction=factcheck");
  const gate = resolveFactcheckEntitlementGate("deep_research", {
    isAuthenticated: params.isAuthenticated,
    hasEntitlement: params.canDeepResearch,
    hasPricingAccess: params.canDeepResearch,
    confirmationProvided: false,
  });
  return {
    kind: params.canDeepResearch ? "start_fact_check" : "require_pricing",
    label: params.canDeepResearch ? "Faktencheck starten" : "Faktencheck später starten",
    description: getFactcheckEntitlementGateMessage(gate),
    href: factcheckHref,
    status: "pricing_confirmation",
    statusLabel: resolveDraftNextActionStatusLabel("pricing_confirmation"),
    loginRequired: !params.isAuthenticated,
    costGateRequired: true,
    confirmationRequired: true,
  };
}

export function resolveDraftNextActionsForStartDraft(
  draft: Pick<StartDraftContext, "origin" | "preview" | "targetHint">,
  params: DraftGateParams,
): DraftGateSummary {
  const relevance = normalizeDraftRelevance(draft);

  if (relevance === "spam_suspected" || relevance === "abusive_or_empty") {
    return {
      statusLabel: resolveDraftNextActionStatusLabel("blocked"),
      actions: [],
    };
  }

  if (relevance === "needs_reframe" || relevance === "personal_only") {
    return {
      statusLabel: resolveDraftNextActionStatusLabel("reframe_required"),
      actions: [
        {
          kind: "needs_reframe",
          label: "Öffentliche Relevanz klären",
          description:
            "Beschreibe zuerst das öffentliche Problem, die Entscheidung oder die Regel hinter deinem Anliegen.",
          href: "/start",
          status: "reframe_required",
          statusLabel: resolveDraftNextActionStatusLabel("reframe_required"),
          loginRequired: false,
          costGateRequired: false,
          confirmationRequired: false,
        },
        buildEditorialReviewAction(params),
      ],
    };
  }

  return {
    statusLabel: resolveDraftNextActionStatusLabel("draft"),
    actions: [
      buildLightAnalysisAction(draft.targetHint),
      {
        kind: "attach_to_theme",
        label: "Thema suchen",
        description:
          "Prüfen, ob dein Anliegen an ein bestehendes Thema anschließt, ohne es automatisch zusammenzuführen.",
        href: "/themen?startDraft=1",
        status: "draft",
        statusLabel: resolveDraftNextActionStatusLabel("draft"),
        loginRequired: !params.isAuthenticated,
        costGateRequired: false,
        confirmationRequired: false,
      },
      {
        kind: "prepare_round",
        label: "Runde weiter vorbereiten",
        description:
          "Im Runden-Entwurf weiterarbeiten. Optionen bleiben bearbeitbar, ohne Stimmen oder Veröffentlichung.",
        href: "/runden/new?startDraft=1&from=account",
        status: "draft",
        statusLabel: resolveDraftNextActionStatusLabel("draft"),
        loginRequired: !params.isAuthenticated,
        costGateRequired: false,
        confirmationRequired: false,
      },
      buildEditorialReviewAction(params),
      buildFactcheckAction(params),
    ],
  };
}

export function resolveDraftNextActionsForResumeItem(params: {
  category: DraftResumeCategory;
  isAuthenticated: boolean;
  canDeepResearch: boolean;
  draft?: Pick<StartDraftContext, "origin" | "preview" | "targetHint"> | null;
}): DraftGateSummary {
  if (params.draft) {
    return resolveDraftNextActionsForStartDraft(params.draft, {
      isAuthenticated: params.isAuthenticated,
      canDeepResearch: params.canDeepResearch,
    });
  }

  if (params.category === "Redaktion") {
    return {
      statusLabel: resolveDraftNextActionStatusLabel("review_pending"),
      actions: [buildEditorialReviewAction(params)],
    };
  }

  if (params.category === "Runde") {
    return {
      statusLabel: resolveDraftNextActionStatusLabel("draft"),
      actions: [
        {
          kind: "prepare_round",
          label: "Runde weiter vorbereiten",
          description:
            "Beim vorhandenen Runden-Entwurf bleiben. Optionen bleiben bearbeitbar, ohne Stimmen oder Veröffentlichung.",
          href: "/runden/new",
          status: "draft",
          statusLabel: resolveDraftNextActionStatusLabel("draft"),
          loginRequired: false,
          costGateRequired: false,
          confirmationRequired: false,
        },
      ],
    };
  }

  if (params.category === "Thema") {
    return {
      statusLabel: resolveDraftNextActionStatusLabel("draft"),
      actions: [
        {
          kind: "attach_to_theme",
          label: "Thema suchen",
          description:
            "Im Themenraum weiterarbeiten, ohne den Entwurf automatisch zusammenzuführen.",
          href: "/themen",
          status: "draft",
          statusLabel: resolveDraftNextActionStatusLabel("draft"),
          loginRequired: false,
          costGateRequired: false,
          confirmationRequired: false,
        },
      ],
    };
  }

  return {
    statusLabel: resolveDraftNextActionStatusLabel("draft"),
    actions: [
      buildLightAnalysisAction("create"),
      buildEditorialReviewAction(params),
      buildFactcheckAction(params),
    ],
  };
}

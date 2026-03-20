import type {
  CreateAnalyzeCtaId,
  CreateAnalyzeMatchEntityType,
  CreateAnalyzeMatchItem,
  CreateAnalyzeMatchType,
  CreateAnalyzeResponse,
} from "@/features/create/analyzeContract";

export type CreateCtaHandoffId =
  | "anlassraum_oeffnen"
  | "dossier_oeffnen"
  | "perspektive_anhaengen"
  | "neu_anlegen"
  | "zustimmen"
  | "anders_sehen";

export type CreateCtaHandoffActionType = "open" | "prepare_attach" | "prepare_new";

export type CreateCtaHandoff = {
  ctaId: CreateCtaHandoffId;
  entityType?: CreateAnalyzeMatchEntityType;
  entityId?: string | null;
  targetRef?: string | null;
  requiresConfirm: true;
  actionType: CreateCtaHandoffActionType;
  noAutoPublish: true;
  noSilentMerge: true;
  summary: string;
  warning: string | null;
  guardrails: string[];
};

export type CreateCtaConfirmAction = { type: "none" } | { type: "navigate"; targetRef: string };

export type CreateCtaHandoffUiState = {
  pending: CreateCtaHandoff | null;
  confirmed: CreateCtaHandoff | null;
  confirmAction: CreateCtaConfirmAction;
};

type CreateAnalyzeCtaContext = Pick<
  CreateAnalyzeResponse,
  "matchType" | "matchEntityType" | "matches"
>;

function normalizeCtaId(value: CreateAnalyzeCtaId): CreateCtaHandoffId {
  if (value === "anlassraum_oeffnen") return "anlassraum_oeffnen";
  if (value === "dossier_oeffnen") return "dossier_oeffnen";
  if (value === "perspektive_anhaengen") return "perspektive_anhaengen";
  if (value === "neu_anlegen") return "neu_anlegen";
  if (value === "zustimmen") return "zustimmen";
  return "anders_sehen";
}

function pickPreferredMatch(ctaId: CreateCtaHandoffId, context: CreateAnalyzeCtaContext): CreateAnalyzeMatchItem | null {
  const matches = Array.isArray(context.matches) ? context.matches : [];
  if (matches.length === 0) return null;

  const findBy = (predicate: (item: CreateAnalyzeMatchItem) => boolean) =>
    matches.find(predicate) ?? null;

  if (ctaId === "anlassraum_oeffnen") {
    return (
      findBy((item) => item.matchEntityType === "anlassraum") ??
      findBy((item) => item.matchType === "same_anlassraum") ??
      matches[0]
    );
  }
  if (ctaId === "dossier_oeffnen") {
    return (
      findBy((item) => item.matchEntityType === "dossier") ??
      findBy((item) => item.matchType === "related_dossier") ??
      matches[0]
    );
  }
  if (ctaId === "perspektive_anhaengen") {
    return findBy((item) => item.matchType !== "no_match") ?? matches[0];
  }
  if (ctaId === "neu_anlegen") {
    return findBy((item) => item.matchType === "no_match") ?? null;
  }
  return matches[0];
}

function actionTypeForCta(ctaId: CreateCtaHandoffId): CreateCtaHandoffActionType {
  if (ctaId === "anlassraum_oeffnen" || ctaId === "dossier_oeffnen") return "open";
  if (ctaId === "neu_anlegen") return "prepare_new";
  return "prepare_attach";
}

function defaultTargetRef(
  ctaId: CreateCtaHandoffId,
  match: CreateAnalyzeMatchItem | null,
): string | null {
  if (match?.targetRef) return match.targetRef;
  if (!match?.entityId) return null;

  if (ctaId === "anlassraum_oeffnen") {
    return `/create?anlassraumId=${encodeURIComponent(match.entityId)}`;
  }
  if (ctaId === "dossier_oeffnen") {
    return `/dossier/${encodeURIComponent(match.entityId)}`;
  }
  return null;
}

function guardrailsForHandoff(matchType: CreateAnalyzeMatchType | undefined): string[] {
  const guardrails = [
    "Kein Auto-Merge.",
    "Kein Auto-Publish.",
    "Ursprung bleibt erhalten.",
    "Handoff ist vorbereitend und manuell bestaetigt.",
  ];
  if (matchType === "duplicate_risk") {
    guardrails.push("Duplikatrisiko: vor jeder Weiterfuehrung manuell pruefen.");
  }
  return guardrails;
}

function summaryForHandoff(input: {
  ctaId: CreateCtaHandoffId;
  matchType: CreateAnalyzeMatchType | undefined;
  entityType: CreateAnalyzeMatchEntityType | undefined;
}): string {
  if (input.ctaId === "neu_anlegen") {
    return "Neuen Strang vorbereiten, ohne stilles Andocken an bestehende Kontexte.";
  }
  if (input.ctaId === "perspektive_anhaengen") {
    return "Perspektive nur vorbereiten; kein direktes Speichern oder Attach in diesem Schritt.";
  }
  if (input.ctaId === "anlassraum_oeffnen") {
    return "Anlassraum manuell oeffnen und Handoff bewusst bestaetigen.";
  }
  if (input.ctaId === "dossier_oeffnen") {
    return "Dossier manuell oeffnen; kein implizites Dossier-Update.";
  }
  if (input.matchType === "duplicate_risk") {
    return "Konflikt-/Duplikat-Hinweis manuell pruefen, bevor eine Anschlussaktion erfolgt.";
  }
  return `CTA ${input.ctaId} wird als manueller Prepare-Handoff fuer ${input.entityType ?? "Kontext"} gefuehrt.`;
}

export function buildCreateCtaHandoff(params: {
  ctaId: CreateAnalyzeCtaId;
  createAnalyze: CreateAnalyzeCtaContext;
}): CreateCtaHandoff {
  const ctaId = normalizeCtaId(params.ctaId);
  const match = pickPreferredMatch(ctaId, params.createAnalyze);
  const actionType = actionTypeForCta(ctaId);
  const entityType = match?.matchEntityType ?? params.createAnalyze.matchEntityType;
  const matchType = match?.matchType ?? params.createAnalyze.matchType;
  const targetRef = defaultTargetRef(ctaId, match);
  const warning = matchType === "duplicate_risk"
    ? "Moegliches Duplikat erkannt. Kein Auto-Attach; bitte manuell pruefen."
    : null;

  return {
    ctaId,
    entityType,
    entityId: match?.entityId ?? null,
    targetRef,
    requiresConfirm: true,
    actionType,
    noAutoPublish: true,
    noSilentMerge: true,
    summary: summaryForHandoff({ ctaId, matchType, entityType }),
    warning,
    guardrails: guardrailsForHandoff(matchType),
  };
}

export function resolveCreateCtaConfirmAction(handoff: CreateCtaHandoff): CreateCtaConfirmAction {
  if (handoff.actionType === "open" && handoff.targetRef) {
    return { type: "navigate", targetRef: handoff.targetRef };
  }
  return { type: "none" };
}

export function createInitialCreateCtaHandoffState(): CreateCtaHandoffUiState {
  return {
    pending: null,
    confirmed: null,
    confirmAction: { type: "none" },
  };
}

export function selectCreateCtaHandoff(
  state: CreateCtaHandoffUiState,
  handoff: CreateCtaHandoff,
): CreateCtaHandoffUiState {
  return {
    pending: handoff,
    confirmed: state.confirmed,
    confirmAction: { type: "none" },
  };
}

export function cancelCreateCtaHandoff(
  state: CreateCtaHandoffUiState,
): CreateCtaHandoffUiState {
  return {
    pending: null,
    confirmed: state.confirmed,
    confirmAction: { type: "none" },
  };
}

export function confirmCreateCtaHandoff(
  state: CreateCtaHandoffUiState,
): CreateCtaHandoffUiState {
  if (!state.pending) return state;
  const confirmAction = resolveCreateCtaConfirmAction(state.pending);
  return {
    pending: null,
    confirmed: state.pending,
    confirmAction,
  };
}

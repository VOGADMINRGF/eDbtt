import type { Dossier, TruthGuardrails } from "./schemas";

const DEFAULT: TruthGuardrails = {
  framingStatus: "initial",
  sourceDivergence: {
    supports: 0,
    contradicts: 0,
    unclear: 0,
    mentions: 0,
    score: 0,
    status: "aligned",
  },
  factcheckIntervention: {
    status: "none",
  },
};

export function deriveTruthGuardrails(dossier: Dossier): TruthGuardrails {
  const findings = dossier.analyze.findings ?? [];
  const corrections = dossier.corrections ?? [];

  const supports = findings.filter((item) => item.finding === "supports").length;
  const contradicts = findings.filter((item) => item.finding === "contradicts").length;
  const unclear = findings.filter((item) => item.finding === "unclear").length;
  const mentions = findings.filter((item) => item.finding === "mentions").length;

  const denominator = supports + contradicts;
  const score = denominator > 0 ? contradicts / denominator : 0;

  const hasOpenObjection = corrections.some(
    (item) => item.kind === "objection" && item.status === "open",
  );
  const hasAcceptedCorrection = corrections.some((item) => item.status === "accepted");

  const divergenceStatus =
    contradicts > 0 ? (score >= 0.4 ? "contested" : "mixed") : unclear > 0 ? "mixed" : "aligned";

  const framingStatus: TruthGuardrails["framingStatus"] =
    divergenceStatus === "contested" || hasAcceptedCorrection || hasOpenObjection
      ? contradicts >= supports || hasAcceptedCorrection
        ? "relativized"
        : "contested"
      : "initial";

  const factcheckStatus: TruthGuardrails["factcheckIntervention"]["status"] = hasOpenObjection
    ? "in_review"
    : hasAcceptedCorrection || contradicts > 0
      ? "intervened"
      : "none";

  const summary =
    framingStatus === "initial"
      ? "Aktuell keine belastbare Gegenquelle mit hoher Priorität."
      : framingStatus === "contested"
        ? "Gegenquellen liegen vor. Das Erstframing wird als Perspektive markiert."
        : "Gegenbelege/Intervention relativieren das Erstframing sichtbar.";

  const factcheckSummary =
    factcheckStatus === "in_review"
      ? "Widerspruch offen, Redaktion prüft Gegenquellen."
      : factcheckStatus === "intervened"
        ? "Factcheck-Intervention aktiv, Framing wurde relativiert."
        : "Keine aktive Intervention.";

  return {
    framingStatus,
    summary,
    sourceDivergence: {
      supports,
      contradicts,
      unclear,
      mentions,
      score,
      status: divergenceStatus,
    },
    factcheckIntervention: {
      status: factcheckStatus,
      summary: factcheckSummary,
      lastUpdatedAt: dossier.meta.updatedAt ?? dossier.meta.createdAt,
    },
  };
}

export function resolveTruthGuardrails(dossier: Dossier): TruthGuardrails {
  const derived = deriveTruthGuardrails(dossier);
  const custom = dossier.truthGuardrails;
  if (!custom) return derived;

  return {
    ...derived,
    ...custom,
    sourceDivergence: {
      ...derived.sourceDivergence,
      ...(custom.sourceDivergence ?? {}),
    },
    factcheckIntervention: {
      ...derived.factcheckIntervention,
      ...(custom.factcheckIntervention ?? {}),
    },
  };
}

export function hasTruthIntervention(guardrails: TruthGuardrails) {
  return guardrails.framingStatus !== "initial" || guardrails.factcheckIntervention.status !== "none";
}

export { DEFAULT as DEFAULT_TRUTH_GUARDRAILS };

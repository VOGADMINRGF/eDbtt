import type { TruthGuardrails } from "@features/dossier";

export type TruthSignalBadge =
  | "kritisch"
  | "in_pruefung"
  | "bestaetigt"
  | "widerspruechlich"
  | "korrigiert";

export function deriveTruthSignalBadges(args: {
  guardrails: TruthGuardrails;
  hasAcceptedCorrection: boolean;
  hasOpenObjection: boolean;
}): TruthSignalBadge[] {
  const { guardrails, hasAcceptedCorrection, hasOpenObjection } = args;
  const badges: TruthSignalBadge[] = [];

  if (guardrails.sourceDivergence.status === "contested") {
    badges.push("kritisch");
  }
  if (
    guardrails.factcheckIntervention.status === "in_review" ||
    guardrails.factcheckIntervention.status === "queued" ||
    hasOpenObjection
  ) {
    badges.push("in_pruefung");
  }
  if (
    guardrails.sourceDivergence.status === "mixed" ||
    guardrails.factcheckIntervention.status === "intervened"
  ) {
    badges.push("widerspruechlich");
  }
  if (guardrails.framingStatus === "relativized" || hasAcceptedCorrection) {
    badges.push("korrigiert");
  }
  if (badges.length === 0) {
    badges.push("bestaetigt");
  }

  return Array.from(new Set(badges));
}

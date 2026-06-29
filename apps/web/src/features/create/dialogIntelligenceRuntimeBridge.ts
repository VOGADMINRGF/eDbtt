import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import type {
  DialogHandoffTarget,
  DialogOutcome,
} from "@/features/dialog/dialogIntelligenceContract";
import { buildDialogOutcomePreviewFromCreateFollowup } from "@/features/dialog/dialogIntelligenceFixtures";

export const DIALOG_INTELLIGENCE_RUNTIME_SOURCE_KINDS = [
  "runtime_ai",
  "runtime_readmodel",
  "preview",
  "blocked_unwired",
  "error",
] as const;

export type DialogIntelligenceRuntimeSourceKind =
  (typeof DIALOG_INTELLIGENCE_RUNTIME_SOURCE_KINDS)[number];

export const DIALOG_INTELLIGENCE_RUNTIME_BLOCKERS = [
  "missing_followup_summary",
  "missing_followup_planner",
  "missing_followup_graph_match",
  "planner_not_runtime_ai",
  "planner_degraded",
  "unsafe_runtime_side_effects",
] as const;

export type DialogIntelligenceRuntimeBlocker =
  (typeof DIALOG_INTELLIGENCE_RUNTIME_BLOCKERS)[number];

export type DialogIntelligenceRuntimeContext = {
  result: CreateIntelligentFollowupResult;
  isConfirmed?: boolean;
};

export type DialogIntelligenceRuntimeResult = {
  status: DialogIntelligenceRuntimeSourceKind;
  outcome: DialogOutcome;
  blockers: DialogIntelligenceRuntimeBlocker[];
  usedSources: string[];
  sourceLabel: string;
  detail: string;
  guardrails: {
    noTruthConfirmation: true;
    noSourceInvention: true;
    noSourceAutoEvaluation: true;
    noAutoPublish: true;
    noAutoMerge: true;
    noAutoDossier: true;
    noAutoAnlassraum: true;
    noAutoParticipationSpace: true;
    noAutoGraph: true;
    noDeepSearch: true;
    noExternalResearch: true;
  };
  error?: string | null;
};

const DIALOG_INTELLIGENCE_RUNTIME_GUARDRAILS = {
  noTruthConfirmation: true,
  noSourceInvention: true,
  noSourceAutoEvaluation: true,
  noAutoPublish: true,
  noAutoMerge: true,
  noAutoDossier: true,
  noAutoAnlassraum: true,
  noAutoParticipationSpace: true,
  noAutoGraph: true,
  noDeepSearch: true,
  noExternalResearch: true,
} as const;

const BLOCKED_UNWIRED_FALLBACK_BLOCKERS = new Set<DialogIntelligenceRuntimeBlocker>([
  "missing_followup_summary",
  "missing_followup_planner",
  "missing_followup_graph_match",
  "unsafe_runtime_side_effects",
]);

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildDialogOutcomeFromFollowup(
  context: DialogIntelligenceRuntimeContext,
): DialogOutcome {
  // The existing mapper remains structural only; the runtime claim comes from the
  // planner-backed follow-up payload and its provider metadata.
  return buildDialogOutcomePreviewFromCreateFollowup({
    result: context.result,
    isConfirmed: context.isConfirmed,
  });
}

function normalizeRuntimeOutcomeGuardrails(outcome: DialogOutcome): DialogOutcome {
  const argumentsList = outcome.arguments.map((argument) =>
    argument.verificationStatus === "reviewed"
      ? {
          ...argument,
          verificationStatus: "needs_source" as const,
        }
      : argument,
  );
  const hasNeedsSourceArgument = argumentsList.some(
    (argument) => argument.verificationStatus === "needs_source",
  );
  const handoffTargets: DialogHandoffTarget[] =
    hasNeedsSourceArgument &&
      !outcome.handoffTargets.includes("factcheck_request")
      ? [...outcome.handoffTargets, "factcheck_request"]
      : outcome.handoffTargets;
  const openQuestions = hasNeedsSourceArgument &&
    !outcome.openQuestions.includes("Welche überprüfbaren Quellen oder Belege fehlen noch?")
    ? [...outcome.openQuestions, "Welche überprüfbaren Quellen oder Belege fehlen noch?"]
    : outcome.openQuestions;

  return {
    ...outcome,
    arguments: argumentsList,
    handoffTargets,
    openQuestions,
  };
}

function resolveRuntimeLabels(
  status: DialogIntelligenceRuntimeSourceKind,
  blockers: DialogIntelligenceRuntimeBlocker[],
  error?: string | null,
): { sourceLabel: string; detail: string } {
  if (status === "runtime_ai") {
    return {
      sourceLabel: "KI-Auswertung aus Runtime",
      detail:
        "Der Ergebnisstand wird auf den bestehenden Dialog-Contract gemappt und bleibt ein review-first Vorschlag ohne Wahrheits-, Quellen- oder Veröffentlichungsclaim.",
    };
  }
  if (status === "runtime_readmodel") {
    return {
      sourceLabel: "KI-Auswertung vorbereitet",
      detail:
        "Vorhandene Runtime-Readmodels liefern Anschlusskontext; die eigentliche Dialoganalyse bleibt bis zu einer sicheren AI-Verdrahtung ein vorbereitender Vorschlag.",
    };
  }
  if (status === "preview") {
    return {
      sourceLabel: "Preview-Auswertung – noch keine echte Runtime-KI",
      detail:
        "Die sichtbare Dialogauswertung nutzt weiterhin den bestehenden Preview-Mapping-Pfad und behauptet keine produktive Runtime-AI.",
    };
  }
  if (status === "blocked_unwired") {
    const reason = blockers.length > 0 ? ` Blocker: ${blockers.join(", ")}.` : "";
    return {
      sourceLabel: "KI-Auswertung derzeit nicht verfügbar",
      detail:
        `Es wurde bewusst kein unsicherer Runtime-Pfad aktiviert.${reason} Die UI bleibt bei review-first Preview oder zeigt nur vorhandenen Anschlusskontext an.`,
    };
  }
  return {
    sourceLabel: "KI-Auswertung derzeit nicht verfügbar",
    detail:
      `Der Runtime-Pfad konnte nicht sicher ausgewertet werden${error ? ` (${error})` : ""}. Es wird kein Fake-AI-Ergebnis als produktive Analyse ausgegeben.`,
  };
}

export function blocksUnsafeDialogIntelligenceSideEffects(
  context: DialogIntelligenceRuntimeContext,
): boolean {
  const planner = context.result.meta?.planner;
  const meta = context.result.meta;
  if (!planner || !meta) return false;

  return (
    planner.plannerRole === "planner_only" &&
    planner.permissions.nonMutative === true &&
    planner.permissions.canPublish === false &&
    planner.permissions.canSave === false &&
    planner.permissions.canMerge === false &&
    planner.permissions.canDeepSearch === false &&
    planner.providerPlan.plannerRole === "planner_only" &&
    planner.providerPlan.researchUsed === "none" &&
    planner.providerPlan.researchProvider === null &&
    planner.providerPlan.deepSearchUsed === false &&
    meta.researchUsed === "none" &&
    meta.researchProvider === null &&
    meta.deepSearchUsed === false
  );
}

export function getDialogIntelligenceRuntimeBlockers(
  context: DialogIntelligenceRuntimeContext,
): DialogIntelligenceRuntimeBlocker[] {
  const blockers: DialogIntelligenceRuntimeBlocker[] = [];
  const summary = String(context.result.understanding.summary ?? "").trim();
  const planner = context.result.meta?.planner;
  const graphMatch = context.result.meta?.graphMatch;

  if (!summary) {
    blockers.push("missing_followup_summary");
  }
  if (!planner) {
    blockers.push("missing_followup_planner");
  }
  if (!graphMatch) {
    blockers.push("missing_followup_graph_match");
  }
  if (planner) {
    const plannerUsesRuntimeAi =
      planner.source === "openai" &&
      planner.plannerSource === "openai" &&
      planner.plannerProvider === "openai" &&
      planner.providerCallSucceeded === true &&
      planner.providerCallAttempted === true;
    if (!plannerUsesRuntimeAi) {
      blockers.push("planner_not_runtime_ai");
    }
    if (
      context.result.degraded === true ||
      planner.plannerDegraded === true ||
      planner.degradedReason !== null ||
      planner.plannerDegradedReason !== null
    ) {
      blockers.push("planner_degraded");
    }
  }
  if (!blocksUnsafeDialogIntelligenceSideEffects(context)) {
    blockers.push("unsafe_runtime_side_effects");
  }

  return unique(blockers) as DialogIntelligenceRuntimeBlocker[];
}

export function canRunDialogIntelligenceRuntime(
  context: DialogIntelligenceRuntimeContext,
): boolean {
  return getDialogIntelligenceRuntimeBlockers(context).length === 0;
}

export function normalizeDialogIntelligenceRuntimeResult(input: {
  context: DialogIntelligenceRuntimeContext;
  outcome: DialogOutcome;
  status: DialogIntelligenceRuntimeSourceKind;
  blockers?: DialogIntelligenceRuntimeBlocker[];
  usedSources?: string[];
  error?: string | null;
}): DialogIntelligenceRuntimeResult {
  const blockers = input.blockers ?? [];
  const usedSources = unique(input.usedSources ?? []);
  const labels = resolveRuntimeLabels(input.status, blockers, input.error);

  return {
    status: input.status,
    outcome: normalizeRuntimeOutcomeGuardrails(input.outcome),
    blockers,
    usedSources,
    sourceLabel: labels.sourceLabel,
    detail: labels.detail,
    guardrails: DIALOG_INTELLIGENCE_RUNTIME_GUARDRAILS,
    error: input.error ?? null,
  };
}

export function fallbackToDialogIntelligencePreview(
  context: DialogIntelligenceRuntimeContext,
): DialogIntelligenceRuntimeResult {
  const blockers = getDialogIntelligenceRuntimeBlockers(context);
  const status = blockers.some((blocker) => BLOCKED_UNWIRED_FALLBACK_BLOCKERS.has(blocker))
    ? "blocked_unwired"
    : "preview";

  return normalizeDialogIntelligenceRuntimeResult({
    context,
    outcome: buildDialogOutcomeFromFollowup(context),
    status,
    blockers,
    usedSources: [
      "create_intelligent_followup_contract",
      "dialog_intelligence_preview_mapper",
    ],
  });
}

export function runDialogIntelligenceRuntime(
  context: DialogIntelligenceRuntimeContext,
): DialogIntelligenceRuntimeResult {
  try {
    if (!canRunDialogIntelligenceRuntime(context)) {
      return fallbackToDialogIntelligencePreview(context);
    }

    return normalizeDialogIntelligenceRuntimeResult({
      context,
      outcome: buildDialogOutcomeFromFollowup(context),
      status: "runtime_ai",
      blockers: [],
      usedSources: [
        "create_planner_openai_runtime",
        "create_intelligent_followup_contract",
        "dialog_intelligence_contract",
      ],
    });
  } catch (error) {
    return normalizeDialogIntelligenceRuntimeResult({
      context,
      outcome: buildDialogOutcomeFromFollowup(context),
      status: "error",
      blockers: getDialogIntelligenceRuntimeBlockers(context),
      usedSources: ["dialog_intelligence_preview_mapper"],
      error: error instanceof Error ? error.message : "runtime_error",
    });
  }
}

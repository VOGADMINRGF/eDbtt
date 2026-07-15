"use client";

import * as React from "react";
import { VoxyAvatar } from "@/components/voxy/VoxyGuide";
import {
  buildCreateVisualSections,
  buildCreateStructureBranches,
  dedupeCreateFollowupSections,
  deriveDominantUnderstandingStance,
  type CreateConnectionSuggestion,
  type CreateIntelligentFollowupResult,
  type CreateStructureBranch,
  type CreateVisualNode,
} from "@/features/create/intelligentFollowupContract";
import CreateHandoffDraftSummary from "@/features/create/CreateHandoffDraftSummary";
import ExistingTopicMatchesPanel from "@/features/create/ExistingTopicMatchesPanel";
import {
  createHandoffDraftFromDialogOutcome,
  createHandoffDraftFromExistingTopicMatch,
  mapDialogHandoffTargetToCreateHandoffDraftTarget,
  type CreateHandoffDraft,
  type CreateHandoffDraftTarget,
} from "@/features/create/createHandoffDrafts";
import {
  createReviewQueueItemFromHandoffDraft,
  canQueueHandoffDraftForReview,
  markReviewQueueItemQueued,
  markReviewQueueItemSubmittedToRuntime,
  type CreateHandoffReviewQueueItem,
} from "@/features/create/createHandoffReviewQueue";
import {
  submitCreateHandoffReviewQueueItemToRuntime,
} from "@/features/create/createHandoffReviewQueueRuntimeBridge";
import {
  createExistingTopicMatchPanelPreviewFromDialogOutcome,
  type ExistingTopicMatch,
  type ExistingTopicMatchPanelModel,
} from "@/features/create/existingTopicMatches";
import {
  resolveExistingTopicMatchesFromRuntime,
  type ResolveExistingTopicMatchesFromRuntimeResult,
} from "@/features/create/existingTopicMatchesRuntimeBridge";
import {
  runDialogIntelligenceRuntime,
  type DialogIntelligenceRuntimeResult,
  type DialogIntelligenceRuntimeSourceKind,
} from "@/features/create/dialogIntelligenceRuntimeBridge";
import {
  buildTopicDeduplicationCandidates,
  canQueueTopicDeduplicationReview,
  createTopicDeduplicationReviewDraft,
  summarizeTopicDeduplicationReviewState,
} from "@/features/create/topicDeduplicationReview";
import {
  mapDeduplicationCandidateToGraphEdgeDraft,
  summarizeTopicGraphMutationState,
} from "@/features/create/topicGraphRuntime";
import DialogResultsHandoffPanel from "@/features/dialog/DialogResultsHandoffPanel";
import type { NormalizedMaterialItem } from "@/features/create/materialRouting";
import type { DialogHandoffTarget } from "@/features/dialog/dialogIntelligenceContract";
type CreateVisualFollowupProps = {
  result: CreateIntelligentFollowupResult;
  actionNotice?: string | null;
  isConfirmed?: boolean;
  embedInWorkspaceShell?: boolean;
  reviewRequestState?: "idle" | "saving" | "saved" | "error";
  reviewRequestMessage?: string | null;
  factcheckMessage?: string | null;
  showCorrectionComposer?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onPrepareSubmission: () => void;
  onPrepareAnlassraum: () => void;
  onOpenDossierAppend: () => void;
  onOpenDossierCreate: () => void;
  onPrepareVote: () => void;
  onRequestEditorialReview?: () => void;
  onStartOptionalService?: () => void;
  onDeepenAllTopics?: () => void;
  onDeepenTopic?: (topicLabel: string) => void;
  onContinueInAccount?: () => void;
  onRetryPlanner?: () => void;
  isRetryPlannerPending?: boolean;
  onSaveOnly?: () => void;
  onSkipPlaceClarification?: () => void;
  continuationValue: string;
  onContinuationChange: (value: string) => void;
  onContinueConversation: () => void;
  continueConversationDisabled?: boolean;
  handoffRuntimeDossierId?: string | null;
  handoffRuntimeAnlassraumId?: string | null;
  handoffRuntimeSourceUrls?: string[];
  handoffRuntimeMaterialItems?: NormalizedMaterialItem[];
};

export const CREATE_VISUAL_FOLLOWUP_COPY = {
  headline: "Ich sehe einen gemeinsamen Kern.",
  headlineProvisional: "Ich sehe einen möglichen Kern.",
  headlineNeedsClarification: "Ich sehe mehrere mögliche Themenstränge.",
  structureTitle: "Vorläufig verstanden",
  structureTitleNeedsClarification: "Einordnung offen",
  coreTitle: "Kern erkannt",
  graphTitle: "So könnte der Arbeitsstand aussehen",
  overviewTitle: "Deine Struktur auf einen Blick",
  confirmTitle: "Wie willst du damit weitergehen?",
  guardrail:
    "Keine automatische Stimme. Keine automatische Veröffentlichung. Du bestätigst jeden nächsten Schritt selbst.",
  freeWriteHint: "Schreib einfach weiter. eDebatte passt den Arbeitsstand an, wenn etwas anders gemeint war.",
  pendingPreparationHint:
    "Nach deiner Bestätigung kann eDebatte passende Themen, Abstimmungen oder einen neuen Arbeitsstand vorbereiten.",
} as const;

// Contract marker for light/dark readability regressions:
// color-mix(in_oklab,white_58%,rgb(var(--card))_42%)

type FocusAreaId = "priorities" | "clusters" | "questions" | "sections" | "next_steps";

const FOCUS_AREA_ORDER: readonly FocusAreaId[] = ["priorities", "clusters", "questions", "next_steps"] as const;

type FocusOverviewCard = {
  id: FocusAreaId;
  title: string;
  lead: string;
  status: string;
};

type NextStepChecklistItem = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
};

type FollowupStageId = "input" | "understanding" | "topics" | "sources" | "draft";

type FollowupStage = {
  id: FollowupStageId;
  title: string;
  lead: string;
  status: "done" | "active" | "planned";
};

type ContentModuleTone = "source" | "vote" | "topic" | "context" | "stats";

type CreateFollowupContentModule = {
  id: string;
  title: string;
  lead: string;
  detail: string;
  tone: ContentModuleTone;
};

type CreateReviewRequestState = "idle" | "saving" | "saved" | "error";

type DialogIntelligenceUiSourceState = {
  kind: DialogIntelligenceRuntimeSourceKind;
  title: string;
  detail: string;
};

export type CreateStructureOverviewProps = {
  locale?: "de" | "en";
  prioritiesCount: number;
  clustersCount: number;
  questionsCount: number;
  nextStepsCount: number;
  showOpenLabels?: boolean;
  onOpenSection?: (section: "priorities" | "clusters" | "questions" | "next_steps") => void;
};

const BROAD_TOPIC_FIELD_ORDER = [
  "Wohnen",
  "Verkehr",
  "Klima",
  "Bildung",
  "Migration/Integration",
  "Sicherheit/Rechtsstaat",
  "Gesundheit/Pflege",
  "kommunale Finanzen",
  "Bürgerbeteiligung",
] as const;

function resolveDialogIntelligenceUiSourceState(input: {
  runtimeResult: DialogIntelligenceRuntimeResult;
  existingTopicMatchesRuntimeStatus: ResolveExistingTopicMatchesFromRuntimeResult["status"];
}): DialogIntelligenceUiSourceState {
  if (input.runtimeResult.status === "runtime_ai") {
    return {
      kind: "runtime_ai",
      title: input.runtimeResult.sourceLabel,
      detail: input.runtimeResult.detail,
    };
  }
  if (
    input.existingTopicMatchesRuntimeStatus === "runtime" ||
    input.existingTopicMatchesRuntimeStatus === "hybrid"
  ) {
    return {
      kind: "runtime_readmodel",
      title: "KI-Auswertung vorbereitet",
      detail:
        "Anschlussvorschläge kommen bereits aus vorhandenen Runtime-Readmodels. Die Dialoganalyse selbst bleibt bis zu einer sicheren AI-Verdrahtung vorbereitend.",
    };
  }
  if (input.runtimeResult.status === "preview") {
    return {
      kind: "preview",
      title: input.runtimeResult.sourceLabel,
      detail: input.runtimeResult.detail,
    };
  }
  if (input.runtimeResult.status === "blocked_unwired") {
    return {
      kind: "blocked_unwired",
      title: input.runtimeResult.sourceLabel,
      detail: input.runtimeResult.detail,
    };
  }
  return {
    kind: "error",
    title: input.runtimeResult.sourceLabel,
    detail: input.runtimeResult.detail,
  };
}

const BROAD_TOPIC_QUESTION_BY_FIELD: Record<(typeof BROAD_TOPIC_FIELD_ORDER)[number], string> = {
  Wohnen: "Soll bezahlbarer Wohnraum Vorrang vor neuen Einzelprojekten bekommen?",
  Verkehr: "Welche Verkehrsmaßnahmen sollen zuerst umgesetzt werden?",
  Klima: "Wie sollen Klimaziele und soziale Tragfähigkeit ausbalanciert werden?",
  Bildung: "Welche Bildungsmaßnahmen haben aktuell die höchste Priorität?",
  "Migration/Integration": "Welche Integrationsmaßnahmen sollten zuerst gestärkt werden?",
  "Sicherheit/Rechtsstaat": "Wie soll Sicherheit gestärkt werden, ohne den Rechtsstaat auszuhöhlen?",
  "Gesundheit/Pflege": "Welche Pflege- und Gesundheitsmaßnahmen sind kurzfristig am dringendsten?",
  "kommunale Finanzen": "Welche Prioritäten sind unter den aktuellen kommunalen Finanzen tragfähig?",
  "Bürgerbeteiligung": "Wie kann Bürgerbeteiligung verbindlicher in Entscheidungen einfließen?",
};

function isPlaceClarificationQuestion(question: string | null | undefined): boolean {
  const normalized = String(question ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return /\bort\b|\bbezirk\b|\bkommune\b|\bgemeinde\b|\bstadt\b|\bkiez\b|\bviertel\b|\bregion\b|\bpostleitzahl\b|\bplz\b/.test(
    normalized,
  );
}

function resolveNodeTone(kind: CreateVisualNode["kind"]): string {
  if (kind === "source_text") {
    return "border-cyan-500/35 bg-cyan-50 text-cyan-950 dark:border-cyan-300/60 dark:bg-cyan-500/15 dark:text-cyan-50";
  }
  if (kind === "statement") {
    return "border-sky-500/30 bg-sky-50 text-sky-950 dark:border-sky-300/45 dark:bg-sky-500/10 dark:text-sky-50";
  }
  if (kind === "topic") {
    return "border-violet-500/30 bg-violet-50 text-violet-950 dark:border-violet-300/45 dark:bg-violet-500/10 dark:text-violet-50";
  }
  if (kind === "stance") {
    return "border-emerald-500/30 bg-emerald-50 text-emerald-950 dark:border-emerald-300/45 dark:bg-emerald-500/10 dark:text-emerald-50";
  }
  if (kind === "scope") {
    return "border-amber-500/35 bg-amber-50 text-amber-950 dark:border-amber-300/45 dark:bg-amber-500/10 dark:text-amber-50";
  }
  if (kind === "dossier" || kind === "anlassraum") {
    return "border-blue-500/30 bg-blue-50 text-blue-950 dark:border-blue-300/45 dark:bg-blue-500/10 dark:text-blue-50";
  }
  if (kind === "vote") {
    return "border-fuchsia-500/30 bg-fuchsia-50 text-fuchsia-950 dark:border-fuchsia-300/45 dark:bg-fuchsia-500/10 dark:text-fuchsia-50";
  }
  return "border-slate-300/45 bg-slate-50 text-slate-900 dark:border-slate-300/45 dark:bg-slate-500/10 dark:text-slate-100";
}

function resolveStanceLead(label: string): string {
  if (label === "eher dafür") return "eher dafür";
  if (label === "eher dagegen") return "eher dagegen";
  return "offen/unklar";
}

function resolveScopeLabel(scope: string): string {
  if (scope === "local") return "lokal";
  if (scope === "district") return "Bezirk";
  if (scope === "municipal") return "Kommune";
  if (scope === "state") return "Land";
  if (scope === "federal") return "Bund";
  if (scope === "eu") return "EU";
  if (scope === "international") return "international";
  return "unklar";
}

function resolveSuggestionBadge(kind: CreateConnectionSuggestion["kind"]): string {
  if (kind === "dossier") return "Dossier";
  if (kind === "vote") return "Abstimmung";
  if (kind === "anlassraum") return "Anlassraum";
  if (kind === "new_anlassraum") return "Neuer Anlassraum";
  return "Themenfeld";
}

function FocusAreaIcon(props: { area: FocusAreaId | "branch"; active?: boolean }) {
  const className = props.active ? "text-cyan-950 dark:text-cyan-50" : "text-slate-600 dark:text-slate-200";

  if (props.area === "priorities") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 5h12" />
        <path d="M4 10h9" />
        <path d="M4 15h6" />
      </svg>
    );
  }
  if (props.area === "clusters" || props.area === "branch") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="5" height="5" rx="1.5" />
        <rect x="12" y="4" width="5" height="5" rx="1.5" />
        <rect x="7.5" y="11" width="5" height="5" rx="1.5" />
      </svg>
    );
  }
  if (props.area === "questions") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7.2 7.1a2.8 2.8 0 1 1 5 1.7c-.8.8-1.7 1.3-1.7 2.6" />
        <circle cx="10" cy="14.8" r=".8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (props.area === "sections") {
    return (
      <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 5.5h10" />
        <path d="M5 10h10" />
        <path d="M5 14.5h7" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 8 14l8-8" />
      <path d="M4 5h12" />
    </svg>
  );
}

function toSentenceList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} und ${labels[1]}`;
  const head = labels.slice(0, -1).join(", ");
  const last = labels[labels.length - 1];
  return `${head} und ${last}`;
}

function resolveLoopedIndex(currentIndex: number, offset: number, total: number): number {
  return (currentIndex + offset + total) % total;
}

function resolveExistingTopicMatchDraftTarget(
  match: ExistingTopicMatch,
): CreateHandoffDraftTarget {
  if (match.kind === "opinion_cluster") return "opinion_count";
  if (match.kind === "source_question") return "factcheck_request";
  if (match.kind === "dossier") return "dossier_candidate";
  if (match.kind === "participation_space") {
    return "participation_space_candidate";
  }
  return "existing_branch_connection";
}

function resolveNextIndexFromKey(currentIndex: number, key: string, total: number): number | null {
  if (total <= 0) return null;
  if (key === "ArrowRight" || key === "ArrowDown") return resolveLoopedIndex(currentIndex, 1, total);
  if (key === "ArrowLeft" || key === "ArrowUp") return resolveLoopedIndex(currentIndex, -1, total);
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  return null;
}

function resolveReviewRequestLabel(
  state: CreateReviewRequestState,
  variant: "full" | "compact" = "full",
): string {
  if (state === "saving") return variant === "compact" ? "Wird angefragt …" : "Prüfung wird angefragt …";
  if (state === "saved") return variant === "compact" ? "Prüfung angefragt" : "Redaktionelle Prüfung angefragt";
  if (state === "error") return variant === "compact" ? "Erneut anfragen" : "Prüfung erneut anfragen";
  return variant === "compact" ? "Prüfung anfragen" : "Redaktionell prüfen lassen";
}

function needsPlannerClarification(result: CreateIntelligentFollowupResult): boolean {
  const planner = result.meta?.planner;
  if (!planner) return false;
  if (hasUsablePlannerStructure(result)) return false;
  return (
    planner.qualityIssues.includes("technical_fallback_only") ||
    planner.qualityStatus === "generic" ||
    planner.qualityStatus === "needs_confirmation" ||
    planner.qualityStatus === "failed"
  );
}

function hasProvisionalPlannerStructure(result: CreateIntelligentFollowupResult): boolean {
  const planner = result.meta?.planner;
  if (!planner) return false;
  return planner.plannerDegraded && hasUsablePlannerStructure(result);
}

function isTechnicalPlannerFallback(result: CreateIntelligentFollowupResult): boolean {
  const planner = result.meta?.planner;
  if (!planner) return false;
  return planner.qualityIssues.includes("technical_fallback_only") || planner.qualityStatus === "failed";
}

function hasTechnicalPlannerFallbackMeta(result?: CreateIntelligentFollowupResult | null): boolean {
  if (!result) return false;
  const planner = result.meta?.planner;
  if (!planner) return false;
  return planner.qualityIssues.includes("technical_fallback_only") || planner.qualityStatus === "failed";
}

function hasUsablePlannerStructure(result: CreateIntelligentFollowupResult): boolean {
  const planner = result.meta?.planner;
  if (!planner || planner.source !== "openai") return false;
  const uniqueTopics = Array.from(new Set([planner.plannerTopic, ...planner.topicCandidates].map((value) => value.trim()).filter(Boolean)));
  const uniqueClusters = Array.from(new Set(planner.plannerClusters.map((value) => value.trim()).filter(Boolean)));
  const nonGenericTopics = uniqueTopics.filter((value) => !isGenericPlannerLabel(value));
  const nonGenericClusters = uniqueClusters.filter((value) => !isGenericPlannerLabel(value));
  return nonGenericTopics.length > 0 && (nonGenericClusters.length >= 3 || planner.graphSearchTerms.length >= 4);
}

function resolvePlannerClarificationReason(result: CreateIntelligentFollowupResult): string {
  const planner = result.meta?.planner;
  if (!planner) {
    return "Wähle selbst ein Thema oder bereite den Beitrag zur Prüfung vor.";
  }
  if (isTechnicalPlannerFallback(result)) {
    return "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.";
  }
  if (planner.qualityStatus === "generic" || planner.qualityStatus === "needs_confirmation") {
    return "Wähle selbst ein Thema oder bereite den Beitrag zur Prüfung vor.";
  }
  return "Du kannst manuell fortfahren und den nächsten Schritt selbst wählen.";
}

function resolvePlannerClarificationDetails(result: CreateIntelligentFollowupResult): string | null {
  const planner = result.meta?.planner;
  if (!planner) return null;
  if (planner.degradedReason === "missing_provider_key") {
    return "Die automatische Einordnung ist gerade nicht verfügbar.";
  }
  if (planner.degradedReason === "timeout") {
    return "Die automatische Einordnung hat nicht rechtzeitig geantwortet.";
  }
  if (
    planner.degradedReason === "invalid_json" ||
    planner.degradedReason === "invalid_provider_payload" ||
    planner.degradedReason === "normalization_failed"
  ) {
    return "Die automatische Einordnung konnte nicht sauber verarbeitet werden.";
  }
  if (planner.degradedReason === "quality_gate_failed") {
    return "Der Text enthält mehrere mögliche Themen oder braucht eine genauere Auswahl.";
  }
  if (planner.degradedReason === "rate_limited") {
    return "Die automatische Einordnung ist gerade ausgelastet.";
  }
  if (planner.degradedReason === "provider_error") {
    return "Die automatische Einordnung konnte gerade nicht geladen werden.";
  }
  if (planner.qualityStatus === "generic" || planner.qualityStatus === "needs_confirmation") {
    return "Der Text enthält mehrere mögliche Themen oder braucht eine genauere Auswahl.";
  }
  return null;
}

function resolvePlannerProvisionalNotice(result: CreateIntelligentFollowupResult): string | null {
  const planner = result.meta?.planner;
  if (!planner || !hasProvisionalPlannerStructure(result)) return null;
  return "Du kannst ein Thema auswählen oder den Beitrag weiter sortieren.";
}

function isGenericPlannerLabel(label: string): boolean {
  const normalized = label.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized === "aussage" ||
    normalized === "beitrag" ||
    normalized === "hinweis" ||
    normalized === "öffentliches anliegen" ||
    normalized === "öffentliches anliegen mit klärungsbedarf" ||
    normalized === "oeffentliches anliegen mit klaerungsbedarf" ||
    normalized === "neues öffentliches thema strukturieren" ||
    normalized === "neues oeffentliches thema strukturieren"
  );
}

function extractDegradedStartPoints(result: CreateIntelligentFollowupResult): string[] {
  const planner = result.meta?.planner;
  const fromPlanner = [
    ...(planner?.plannerClusters ?? []),
    ...(planner?.clusterCandidates ?? []),
    ...(planner?.topicCandidates ?? []),
    ...(result.understanding.topics ?? []).map((topic) => topic.label),
  ]
    .map((value) => String(value ?? "").trim())
    .filter((value) => value.length > 0 && !isGenericPlannerLabel(value));
  const seen = new Set<string>();
  const startPoints: string[] = [];
  for (const entry of fromPlanner) {
    const key = entry.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    startPoints.push(entry);
    if (startPoints.length === 4) break;
  }
  return startPoints;
}

function buildMultiTopicActionTopics(result: CreateIntelligentFollowupResult): string[] {
  return Array.from(
    new Set(
      result.understanding.topics
        .map((topic) => topic.label.trim())
        .filter(Boolean),
    ),
  ).slice(0, 5);
}

function shouldShowMultiTopicActionPanel(actionTopics: string[]): boolean {
  return actionTopics.length >= 3;
}

export function deriveCreateStructureOverviewMetrics(params: {
  result?: CreateIntelligentFollowupResult | null;
  isConfirmed?: boolean;
}): {
  prioritiesCount: number;
  clustersCount: number;
  questionsCount: number;
  nextStepsCount: number;
} {
  const result = params.result ?? null;
  if (hasTechnicalPlannerFallbackMeta(result)) {
    return {
      prioritiesCount: 0,
      clustersCount: 0,
      questionsCount: 0,
      nextStepsCount: 0,
    };
  }
  const structureBranches = result ? buildCreateStructureBranches(result, 3) : [];
  const voteQuestions = result
    ? buildVoteQuestions({
        dossierContext: result.understanding.dossierContext,
        broadTopicFields: deriveBroadTopicFields(result.understanding.topics.map((topic) => topic.label)),
        suggestions: result.suggestions,
        fallbackTopic:
          result.understanding.dossierContext ?? result.understanding.topics[0]?.label ?? "Öffentliches Thema",
      })
    : [];

  return {
    prioritiesCount: result ? Math.min(Math.max(result.understanding.topics.length, 1), 3) : 0,
    clustersCount: result ? Math.max(structureBranches.length, 1) : 0,
    questionsCount: result ? Math.max(voteQuestions.length, 1) : 0,
    nextStepsCount: result ? 1 : 0,
  };
}

function normalizeTopicLabel(label: string): string {
  return label.trim().toLowerCase();
}

function normalizeDenseText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ");
}

function isSimilarDenseText(a?: string | null, b?: string | null): boolean {
  const left = normalizeDenseText(String(a ?? ""));
  const right = normalizeDenseText(String(b ?? ""));
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length < 18 || right.length < 18) return false;
  return left.includes(right) || right.includes(left);
}

function shouldShowAssistantLead(summary: string, assistantLead: string, coreClaim: string): boolean {
  if (!assistantLead.trim()) return false;
  if (isSimilarDenseText(assistantLead, summary)) return false;
  if (isSimilarDenseText(assistantLead, coreClaim)) return false;
  return true;
}

function buildNextStepChecklist(params: {
  isConfirmed: boolean;
  structureBranches: CreateStructureBranch[];
  voteQuestions: string[];
  sortedSuggestions: CreateConnectionSuggestion[];
}): NextStepChecklistItem[] {
  const clusterLabel =
    params.structureBranches.length > 1
      ? `${params.structureBranches.length} Themencluster prüfen`
      : "Themencluster prüfen";
  const questionLabel =
    params.voteQuestions.length > 1 ? `${params.voteQuestions.length} Fragen formulieren` : "1 Frage formulieren";
  const handoffLabel =
    params.sortedSuggestions[0]?.kind === "vote"
      ? "Abstimmung vorbereiten"
      : params.sortedSuggestions[0]?.kind === "dossier"
        ? "Thema öffnen"
        : "Ja, so einreichen";

  return [
    {
      id: "confirm",
      label: "Tiefer ins Thema gehen",
      detail: "Der vorgeschlagene Arbeitsstand wird geprüft und noch nicht veröffentlicht.",
      done: params.isConfirmed,
    },
    {
      id: "clusters",
      label: clusterLabel,
      detail: "Die wichtigsten Themen bleiben kompakt als Focus Cards zusammengefasst.",
      done: params.isConfirmed,
    },
    {
      id: "questions",
      label: questionLabel,
      detail: "Die Leitfragen werden erst nach deiner Bestätigung weiter vorbereitet.",
      done: false,
    },
    {
      id: "handoff",
      label: handoffLabel,
      detail: "Der nächste Schritt bleibt bewusst gewählt und startet nicht automatisch.",
      done: false,
    },
  ];
}

function buildWorkflowStages(params: { isConfirmed: boolean; hasSuggestions: boolean }): FollowupStage[] {
  return [
    {
      id: "input",
      title: "Eingabe",
      lead: "Beitrag aufgenommen",
      status: "done",
    },
    {
      id: "understanding",
      title: "Verstehen",
      lead: "Kern erkannt",
      status: "done",
    },
    {
      id: "topics",
      title: "Themen ordnen",
      lead: params.isConfirmed ? "Hauptthema gewählt" : "Hauptthema bestimmen",
      status: params.isConfirmed ? "done" : "active",
    },
    {
      id: "sources",
      title: "Quellen prüfen",
      lead: params.hasSuggestions ? "Hinweise sichtbar" : "Optional ergänzen",
      status: params.isConfirmed ? "active" : "planned",
    },
    {
      id: "draft",
      title: "Entwurf vorbereiten",
      lead: params.isConfirmed ? "Als Nächstes speichern" : "Danach speichern",
      status: "planned",
    },
  ];
}

function resolveContentModuleToneClass(tone: ContentModuleTone): string {
  if (tone === "source") {
    return "border-cyan-300/35 bg-cyan-500/[0.08] text-cyan-50";
  }
  if (tone === "vote") {
    return "border-fuchsia-300/25 bg-fuchsia-500/[0.08] text-fuchsia-50";
  }
  if (tone === "topic") {
    return "border-violet-300/25 bg-violet-500/[0.08] text-violet-50";
  }
  if (tone === "stats") {
    return "border-amber-300/25 bg-amber-500/[0.08] text-amber-50";
  }
  return "border-slate-300/25 bg-slate-500/[0.08] text-slate-50";
}

function buildContentModules(params: {
  result: CreateIntelligentFollowupResult;
  sections: ReturnType<typeof buildCreateVisualSections>;
  sortedSuggestions: CreateConnectionSuggestion[];
}): CreateFollowupContentModule[] {
  const modules: CreateFollowupContentModule[] = [];
  const seen = new Set<string>();
  const sourceText = params.result.sourceText.toLowerCase();
  const statements = params.result.understanding.statements;
  const push = (module: CreateFollowupContentModule) => {
    if (seen.has(module.title)) return;
    seen.add(module.title);
    modules.push(module);
  };

  const sourceStatement = statements.find((statement) => statement.kind === "source");
  if (
    sourceStatement ||
    /https?:\/\/|www\.|quelle|quellen|artikel|bericht|studie|interview|dokument/.test(sourceText)
  ) {
    push({
      id: "sources",
      title: "Quellen & Kontext",
      lead: sourceStatement?.text ?? "Der Beitrag bringt mindestens einen Quellen- oder Kontextbezug mit.",
      detail: "Bleibt sichtbar als Kontextsignal. Es wird hier nichts automatisch veröffentlicht.",
      tone: "source",
    });
  }

  if (/youtube|youtu\.be|video|videosequenz|clip/.test(sourceText)) {
    push({
      id: "video",
      title: "Videosequenz",
      lead: "Im Beitrag steckt ein Video- oder Clip-Hinweis.",
      detail: "Die Oberfläche behandelt das als gesonderten Kontexttyp statt wie Freitext.",
      tone: "source",
    });
  }

  if (/artikel|bericht|meldung|story|interview|studie|zeitung/.test(sourceText)) {
    push({
      id: "article",
      title: "Artikel / Bericht",
      lead: "Textnahe Quellen lassen sich als eigener Arbeitskontext lesen.",
      detail: "So bleibt erkennbar, ob ein Hinweis eher Nachricht, Beobachtung oder Position ist.",
      tone: "context",
    });
  }

  const questionStatement = statements.find((statement) => statement.kind === "question" || statement.kind === "option");
  const voteSuggestion = params.sortedSuggestions.find((suggestion) => suggestion.kind === "vote");
  if (questionStatement || voteSuggestion) {
    push({
      id: "choices",
      title: "Fragen / Multiple Choice",
      lead: questionStatement?.text ?? voteSuggestion?.title ?? "Es gibt einen klaren Entscheidungspunkt.",
      detail: "Optionen und Leitfragen bleiben als eigener Baustein sichtbar statt im Freitext zu verschwinden.",
      tone: "vote",
    });
  }

  if (/\d|\bprozent\b|%|€|euro|million|milliarde/.test(sourceText)) {
    push({
      id: "stats",
      title: "Zahlen / Statistik",
      lead: "Im Beitrag tauchen quantifizierende Signale auf.",
      detail: "Zahlenhinweise werden als eigener Prüfkontext behandelt.",
      tone: "stats",
    });
  }

  if (params.sections.length > 1) {
    push({
      id: "sections",
      title: "Gelesene Sinnabschnitte",
      lead: `${params.sections.length} Abschnitte wurden getrennt gelesen.`,
      detail: "So bleibt sichtbar, welche Aussagen zusammengehören und was nur Zusatzkontext ist.",
      tone: "context",
    });
  }

  if (modules.length === 0) {
    push({
      id: "context",
      title: "Kontextsignal",
      lead: params.result.understanding.summary,
      detail: "Die Oberfläche hält den Beitrag zunächst als kompakten Arbeitskontext zusammen.",
      tone: "topic",
    });
  }

  return modules.slice(0, 4);
}

function deriveBroadTopicFields(topicLabels: string[]): string[] {
  const normalized = new Set(topicLabels.map(normalizeTopicLabel));
  return BROAD_TOPIC_FIELD_ORDER.filter((label) => normalized.has(normalizeTopicLabel(label)));
}

function buildVoteQuestions(params: {
  dossierContext?: string;
  broadTopicFields: string[];
  suggestions: CreateConnectionSuggestion[];
  fallbackTopic: string;
}): string[] {
  const questions: string[] = [];
  const pushQuestion = (value?: string | null) => {
    const normalized = String(value ?? "").trim();
    if (!normalized || questions.includes(normalized)) return;
    questions.push(normalized);
  };

  if (params.dossierContext === "Kommunale Prioritäten und Zielkonflikte") {
    pushQuestion("Welche kommunalen Prioritäten sollen zuerst bearbeitet werden?");
    for (const field of params.broadTopicFields) {
      pushQuestion(BROAD_TOPIC_QUESTION_BY_FIELD[field as (typeof BROAD_TOPIC_FIELD_ORDER)[number]]);
    }
  }

  for (const suggestion of params.suggestions) {
    if (suggestion.kind !== "vote") continue;
    pushQuestion(suggestion.title);
  }
  if (questions.length === 0) {
    pushQuestion(`Welche Prioritäten sollen im Kontext ${params.fallbackTopic} zuerst bearbeitet werden?`);
  }
  return questions;
}

function resolveAssistantLead(params: {
  topicLabels: string[];
  summary: string;
  statementText: string;
  dossierContext?: string;
  plannerTopic?: string | null;
}): string {
  if (params.plannerTopic === "Tierschutz, Tierhaltung und Agrarstandards") {
    return "Ich erkenne eine normative Forderung nach strengeren Tierwohl-, Tierhaltungs- und Agrarstandards mit Blick auf Import, Export, Kennzeichnung und EU-Regeln.";
  }
  if (params.dossierContext === "Kommunale Prioritäten und Zielkonflikte") {
    return "Ich sehe einen breiten kommunalen Prioritätenkonflikt. Es geht nicht um ein einzelnes Thema, sondern um mehrere Zielkonflikte, die zusammen priorisiert werden müssen.";
  }
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (
    /\bamtstr[aä]ger\b|\bpolitiker\b|\bmandatstr[aä]ger\b|\bminister\b|\babgeordnete?\b|\bpolitische [aä]mter\b/.test(lowered) &&
    lowered.includes("politische verantwortung") &&
    lowered.includes("amtsträger") &&
    lowered.includes("qualifikation") &&
    lowered.includes("sanktionen") &&
    lowered.includes("gesetzgebung")
  ) {
    return "Ich erkenne eine Forderung nach klareren Mindestanforderungen und Konsequenzen für Amtsträger. Dein Beitrag berührt außerdem Gesetzgebung und mögliche Abstimmungsoptionen.";
  }
  const topicSentence = toSentenceList(params.topicLabels.slice(0, 4).map((label) => label.toLowerCase()));
  if (topicSentence) return `Du sprichst vor allem über ${topicSentence}.`;
  if (params.summary.trim().length > 0) return params.summary.trim();
  return params.statementText.trim();
}

function resolveCoreClaim(params: {
  topicLabels: string[];
  fallback: string;
  dossierContext?: string;
  plannerCore?: string | null;
}): string {
  if (params.plannerCore?.trim()) {
    return params.plannerCore.trim();
  }
  if (params.dossierContext === "Kommunale Prioritäten und Zielkonflikte") {
    return "Du beschreibst mehrere kommunale Zielkonflikte, die gemeinsam priorisiert und nachvollziehbar abgewogen werden sollen.";
  }
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (
    /\bamtstr[aä]ger\b|\bpolitiker\b|\bmandatstr[aä]ger\b|\bminister\b|\babgeordnete?\b|\bpolitische [aä]mter\b/.test(lowered) &&
    lowered.includes("qualifikation") &&
    lowered.includes("sanktionen")
  ) {
    return "Du forderst klare Mindestanforderungen und Konsequenzen für Amtsträger.";
  }
  return params.fallback;
}

function sortSuggestions(
  suggestions: CreateConnectionSuggestion[],
): CreateConnectionSuggestion[] {
  const priority: Record<CreateConnectionSuggestion["kind"], number> = {
    dossier: 0,
    vote: 1,
    anlassraum: 2,
    new_anlassraum: 3,
    topic: 9,
  };
  return [...suggestions].sort((a, b) => priority[a.kind] - priority[b.kind]);
}

function derivePositionClusters(result: CreateIntelligentFollowupResult): string[] {
  if (result.understanding.positionClusters?.length) {
    return result.understanding.positionClusters.map((cluster) => cluster.label);
  }
  const haystack = `${result.understanding.summary} ${result.sourceText} ${result.understanding.topics
    .map((topic) => topic.label)
    .join(" ")}`.toLowerCase();
  const clusters: string[] = [];
  if (/bezahlbar|chancen|entlast|sozial|pflege|schutz/.test(haystack)) clusters.push("sozial/ausgleichend");
  if (/regel|leistung|sprachf[oö]rderung|sanktion|verantwort|rechtsstaat/.test(haystack)) {
    clusters.push("ordnungs-/leistungsorientiert");
  }
  if (/abw[aä]g|pragmatisch|zust[aä]ndigkeit|kosten|umsetzung|option/.test(haystack)) {
    clusters.push("pragmatisch/abwägend");
  }
  if (clusters.length === 0) clusters.push("pragmatisch/abwägend");
  return clusters.slice(0, 3);
}

function UserContributionBubble(props: { text: string }) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400 ring-4 ring-white dark:bg-slate-500 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-3xl min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Du</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-slate-200/90 bg-[color-mix(in_oklab,white_76%,rgb(var(--card))_24%)] px-4 py-3 shadow-sm shadow-slate-950/5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">{props.text}</p>
        </div>
      </div>
    </div>
  );
}

function AssistantUnderstandingBubble(props: {
  eyebrow: string;
  headline: string;
  summary: string;
  assistantLead: string;
  coreClaim: string;
  showCoreBlock: boolean;
  showAssistantLead: boolean;
  stanceLabel: string;
  scopeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-1 shrink-0">
        <VoxyAvatar appearance="inline" compact variant="miniAvatar" />
      </div>
      <div className="max-w-5xl min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-[rgb(var(--muted))]">Assistent</p>
        <div className="mt-2 rounded-[30px] rounded-tl-sm border border-cyan-500/18 bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-4 py-4 shadow-[0_22px_52px_rgba(2,6,23,0.06)] md:px-6 md:py-6 dark:border-cyan-300/20 dark:bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200">{props.eyebrow}</p>
          <p className="mt-1 text-lg font-semibold text-cyan-950 md:text-[1.4rem] dark:text-cyan-50">{props.headline}</p>
          <p className="mt-4 text-base leading-relaxed text-cyan-950 md:text-[1.15rem] dark:text-cyan-100">{props.summary || props.assistantLead}</p>
          {props.showAssistantLead ? (
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-cyan-900/80 dark:text-cyan-100/80">{props.assistantLead}</p>
          ) : null}
          {props.showCoreBlock ? (
            <div className="mt-5 rounded-3xl border border-cyan-200/40 bg-cyan-500/[0.07] px-4 py-4 dark:border-cyan-300/20 dark:bg-cyan-500/[0.08]">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.coreTitle}</p>
              <p className="mt-2 text-base font-semibold leading-relaxed text-cyan-950 md:text-xl dark:text-cyan-50">{props.coreClaim}</p>
            </div>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2 opacity-90">
            <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-sm text-emerald-950 dark:border-emerald-300/40 dark:bg-emerald-500/10 dark:text-emerald-50">
              Haltung: {props.stanceLabel}
            </span>
            <span className="rounded-full border border-amber-500/35 bg-amber-50 px-3 py-1 text-sm text-amber-950 dark:border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-50">
              Ebene: {props.scopeLabel}
            </span>
          </div>
          {props.children}
        </div>
      </div>
    </div>
  );
}

function TopicFieldList(props: { labels: string[]; onPick: (label: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {props.labels.map((label) => (
        <button
          key={`topic-${label}`}
          type="button"
          onClick={() => props.onPick(`Thema: ${label}`)}
          className={`rounded-full border px-2.5 py-1 text-sm ${resolveNodeTone("topic")}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function PositionClusterList(props: { labels: string[]; onPick: (label: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {props.labels.map((cluster) => (
        <button
          key={cluster}
          type="button"
          onClick={() => props.onPick(`Blickrichtung: ${cluster}`)}
          className={`rounded-full border px-2.5 py-1 text-sm ${resolveNodeTone("stance")}`}
        >
          {cluster}
        </button>
      ))}
    </div>
  );
}

function VoteQuestionList(props: { questions: string[] }) {
  return (
    <ol className="mt-2 space-y-1 text-sm text-[rgb(var(--fg))]">
      {props.questions.map((question, index) => (
        <li key={`vote-question-${index}`}>{index + 1}. {question}</li>
      ))}
    </ol>
  );
}

function StructureBranchCard(props: {
  branch: CreateStructureBranch;
  onEdit: (focus: string) => void;
}) {
  const primaryClaim = props.branch.claims[0] ?? props.branch.need;
  const primaryQuestion = props.branch.voteQuestions[0] ?? "Welche Leitfrage soll zuerst geklärt werden?";
  const visibleTopicTags = props.branch.topicTags.slice(0, 3);
  const visiblePositionClusters = props.branch.positionClusters.slice(0, 2);
  const visibleVoteQuestions = props.branch.voteQuestions.slice(0, 2);
  const showNeedBlock =
    props.branch.need.trim().length > 0 &&
    !isSimilarDenseText(props.branch.need, props.branch.title) &&
    !isSimilarDenseText(props.branch.need, props.branch.claims[0] ?? "");
  const statusLabel = `${Math.max(1, visibleTopicTags.length)} Schwerpunkte · ${props.branch.openReviewPoints.length} Prüfpunkte`;

  return (
    <article
      data-focus-card-detail
      className="overflow-hidden rounded-[28px] border border-cyan-200/45 bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-4 py-5 shadow-[0_24px_56px_rgba(8,145,178,0.08)] transition-all duration-300 ease-out dark:border-cyan-300/20 dark:bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] dark:shadow-none sm:rounded-[32px]"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">Focus Card</p>
            <p className="break-words text-lg font-semibold text-cyan-950 md:text-[1.75rem] dark:text-cyan-50">{props.branch.title}</p>
            {visibleTopicTags.length ? (
              <p className="max-w-3xl text-sm leading-relaxed text-cyan-900/85 dark:text-cyan-100/85">
                Schwerpunkt: {toSentenceList(visibleTopicTags)}
              </p>
            ) : null}
          </div>
          <span className="self-start rounded-full border border-cyan-300/50 bg-cyan-500/[0.07] px-3 py-1.5 text-left text-[11px] font-semibold leading-relaxed text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100 sm:max-w-[12rem] sm:text-right">
            {statusLabel}
          </span>
        </div>
        {visiblePositionClusters.length ? (
          <div className="flex flex-wrap gap-2">
            {visiblePositionClusters.map((cluster) => (
              <span
                key={`${props.branch.id}-cluster-${cluster}`}
                className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("stance")}`}
              >
                {cluster}
              </span>
            ))}
          </div>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,0.9fr)]">
          <div className="rounded-[24px] border border-slate-200/40 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-4 py-4 dark:border-white/10 dark:bg-[rgb(var(--card))]/70">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">Knapper Bedarf</p>
            <p className="mt-2 break-words text-sm leading-7 text-cyan-950 dark:text-cyan-50">{showNeedBlock ? props.branch.need : primaryClaim}</p>
          </div>
          <div className="rounded-[24px] border border-cyan-200/45 bg-cyan-500/[0.08] px-4 py-4 dark:border-cyan-300/25 dark:bg-cyan-500/12">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">Wichtigste Frage</p>
            <p className="mt-2 break-words text-sm font-medium leading-7 text-cyan-950 dark:text-cyan-50">{primaryQuestion}</p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {props.branch.part06CategoryLabels.map((label) => (
          <span
            key={`${props.branch.id}-part06-${label}`}
            className={`rounded-full border px-2.5 py-1 text-xs opacity-80 ${resolveNodeTone("dossier")}`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-5 space-y-3 border-t border-slate-200/80 pt-4 dark:border-[rgb(var(--border))]">
        <div className="rounded-2xl border border-slate-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Wichtige Abstimmungsfragen</p>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
            {visibleVoteQuestions.map((question) => (
              <li
                key={`${props.branch.id}-question-${question}`}
                className="rounded-xl border border-slate-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
              >
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <details className="mt-4 rounded-2xl border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Ast bearbeiten</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Thema ändern", "Haltung ändern", "Ebene ändern", "Aussage ergänzen", "Abstimmungsfrage bearbeiten"].map((label) => (
            <button
              key={`${props.branch.id}-${label}`}
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs text-[rgb(var(--fg))] hover:border-cyan-300/60"
              onClick={() => props.onEdit(`${props.branch.title}: ${label}`)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">Änderungsvorschläge werden zur Prüfung vorbereitet.</p>
      </details>
      <details className="mt-3 rounded-2xl border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">Weitere Details zum Ast</summary>
        <div className="mt-3 space-y-3">
          {visibleTopicTags.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Einordnung im Themenkatalog</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {visibleTopicTags.map((topic) => (
                  <span
                    key={`${props.branch.id}-topic-${topic}`}
                    className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("topic")}`}
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themenfelder im Ast</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {props.branch.topics.map((topic) => (
                <span
                  key={`${props.branch.id}-field-${topic}`}
                  className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs text-[rgb(var(--muted))]"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Mögliche Aussagen</p>
            <ul className="mt-2 space-y-1.5 text-sm text-[rgb(var(--fg))]">
              {props.branch.claims.map((claim) => (
                <li key={`${props.branch.id}-claim-${claim}`}>{claim}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Offene Prüfpunkte</p>
            <ul className="mt-2 space-y-1.5 text-sm text-[rgb(var(--muted))]">
              {props.branch.openReviewPoints.map((point) => (
                <li key={`${props.branch.id}-review-${point}`}>{point}</li>
              ))}
            </ul>
          </div>
          {props.branch.overflowTopics?.length ? (
            <details className="rounded-lg border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-2 dark:bg-[rgb(var(--card))]">
              <summary className="cursor-pointer text-xs font-semibold text-[rgb(var(--muted))]">
                + weitere Themen
              </summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {props.branch.overflowTopics.map((topic) => (
                  <span
                    key={`${props.branch.id}-overflow-${topic}`}
                    className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </details>
    </article>
  );
}

function StructureBranchList(props: {
  branches: CreateStructureBranch[];
  onEdit: (focus: string) => void;
  resetKey: string;
}) {
  const [activeBranchId, setActiveBranchId] = React.useState<string | null>(props.branches[0]?.id ?? null);
  const branchTabRefs = React.useRef<Record<string, React.ElementRef<"button"> | null>>({});

  React.useEffect(() => {
    if (!props.branches.some((branch) => branch.id === activeBranchId)) {
      setActiveBranchId(props.branches[0]?.id ?? null);
    }
  }, [activeBranchId, props.branches]);

  React.useEffect(() => {
    setActiveBranchId(props.branches[0]?.id ?? null);
  }, [props.branches, props.resetKey]);

  const handleBranchTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<React.ElementRef<"button">>, branchId: string) => {
      const currentIndex = props.branches.findIndex((branch) => branch.id === branchId);
      const nextIndex = resolveNextIndexFromKey(currentIndex, event.key, props.branches.length);
      if (nextIndex === null) return;
      event.preventDefault();
      const nextBranch = props.branches[nextIndex];
      if (!nextBranch) return;
      setActiveBranchId(nextBranch.id);
      window.requestAnimationFrame(() => {
        branchTabRefs.current[nextBranch.id]?.focus();
      });
    },
    [props.branches],
  );

  if (props.branches.length === 0) return null;
  const activeBranch =
    props.branches.find((branch) => branch.id === activeBranchId) ?? props.branches[0] ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Strukturäste</p>
        <p className="text-xs text-[rgb(var(--muted))]">Ein Ast im Detail, die anderen als Auswahl</p>
      </div>
      <div
        data-focus-card-rail
        className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
        role="tablist"
        aria-label="Fokusbereiche der Struktur"
      >
        {props.branches.map((branch) => (
          <button
            key={branch.id}
            data-focus-card-branch-selector
            type="button"
            ref={(node) => {
              branchTabRefs.current[branch.id] = node;
            }}
            onClick={() => setActiveBranchId(branch.id)}
            onKeyDown={(event) => handleBranchTabKeyDown(event, branch.id)}
            role="tab"
            id={`create-branch-tab-${branch.id}`}
            aria-selected={activeBranch?.id === branch.id}
            aria-controls={`create-branch-panel-${branch.id}`}
            tabIndex={activeBranch?.id === branch.id ? 0 : -1}
            className={`w-full rounded-[24px] border px-3 py-3 text-left transition-all duration-300 ease-out ${
              activeBranch?.id === branch.id
                ? "border-cyan-400/70 bg-cyan-500/[0.08] shadow-[0_18px_40px_rgba(8,145,178,0.12)] dark:border-cyan-300/45 dark:bg-cyan-500/12"
                : "border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/[0.06] dark:border-cyan-300/30 dark:bg-cyan-500/10">
                <FocusAreaIcon area="branch" active={activeBranch?.id === branch.id} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-[rgb(var(--muted))]">Focus Card</p>
                  <span className="rounded-full border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                    {Math.max(1, branch.topicTags.length)} Schwerpunkte
                  </span>
                </div>
                <p className="mt-2 break-words text-lg font-semibold leading-snug text-[rgb(var(--fg))]">{branch.title}</p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{branch.need}</p>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span>{branch.voteQuestions.length} Fragen</span>
                  <span>·</span>
                  <span>{branch.openReviewPoints.length} Prüfpunkte</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      {props.branches.map((branch) => {
        const isActive = activeBranch?.id === branch.id;
        return (
          <div
            key={branch.id}
            className="pt-1"
            role="tabpanel"
            id={`create-branch-panel-${branch.id}`}
            aria-labelledby={`create-branch-tab-${branch.id}`}
            hidden={!isActive}
          >
            <StructureBranchCard branch={branch} onEdit={props.onEdit} />
          </div>
        );
      })}
    </div>
  );
}

function CreateStructureOverviewCard(props: {
  title: string;
  description: string;
  pillLabel: string;
  unreadLabel?: string;
  area: "priorities" | "clusters" | "questions" | "next_steps";
  onClick?: () => void;
}) {
  const content = (
    <div data-mobile-structure-card className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-300/45 bg-cyan-500/[0.05] dark:border-cyan-300/20 dark:bg-cyan-500/10">
        <FocusAreaIcon area={props.area} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{props.title}</p>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] font-semibold text-[rgb(var(--muted))]">
            {props.pillLabel}
          </span>
          {props.unreadLabel ? (
            <span className="rounded-full border border-cyan-300/45 px-2 py-0.5 text-[10px] font-semibold text-cyan-800 dark:text-cyan-100">
              {props.unreadLabel}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-[rgb(var(--muted))]">{props.description}</p>
      </div>
      {props.onClick ? (
        <span className="text-sm text-[rgb(var(--muted))]" aria-hidden="true">
          ·
        </span>
      ) : null}
    </div>
  );

  const className =
    "inline-flex min-h-[3rem] items-center rounded-full border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_82%,rgb(var(--bg))_18%)] px-3 py-2";

  if (!props.onClick) {
    return <article className={className}>{content}</article>;
  }

  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`${className} text-left transition hover:border-cyan-300/45 hover:text-[rgb(var(--fg))]`}
    >
      {content}
    </button>
  );
}

export function CreateStructureOverview(props: CreateStructureOverviewProps) {
  const isEnglish = props.locale === "en";
  const openLabel = isEnglish ? "open" : "offen";
  return (
    <section data-mobile-structure-overview className="space-y-3 border-t border-[rgb(var(--border))] px-0 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          {isEnglish ? "Your structure at a glance" : CREATE_VISUAL_FOLLOWUP_COPY.overviewTitle}
        </p>
        <p className="text-xs leading-relaxed text-[rgb(var(--muted))]">
          {isEnglish
            ? "Compact first, details only on demand."
            : "Kompakt zuerst, Details bei Bedarf."}
        </p>
      </div>
      <div data-structure-overview-grid className="flex flex-wrap items-center gap-2.5">
        <CreateStructureOverviewCard
          area="priorities"
          title={isEnglish ? "Priorities" : "Prioritäten"}
          description={isEnglish ? "What matters most?" : "Was zählt zuerst?"}
          pillLabel={String(props.prioritiesCount)}
          unreadLabel={
            props.prioritiesCount > 0 ? (isEnglish ? "new" : "neu") : props.showOpenLabels ? openLabel : undefined
          }
          onClick={props.onOpenSection ? () => props.onOpenSection?.("priorities") : undefined}
        />
        <CreateStructureOverviewCard
          area="clusters"
          title={isEnglish ? "Topics" : "Themen"}
          description={isEnglish ? "Recognized clusters" : "Erkannte Schwerpunkte"}
          pillLabel={String(props.clustersCount)}
          unreadLabel={props.clustersCount > 0 ? (isEnglish ? "new" : "neu") : props.showOpenLabels ? openLabel : undefined}
          onClick={props.onOpenSection ? () => props.onOpenSection?.("clusters") : undefined}
        />
        <CreateStructureOverviewCard
          area="questions"
          title={isEnglish ? "Questions" : "Fragen"}
          description={isEnglish ? "Open questions" : "Offene Fragen"}
          pillLabel={String(props.questionsCount)}
          unreadLabel={props.questionsCount > 0 ? (isEnglish ? "new" : "neu") : props.showOpenLabels ? openLabel : undefined}
          onClick={props.onOpenSection ? () => props.onOpenSection?.("questions") : undefined}
        />
        <CreateStructureOverviewCard
          area="next_steps"
          title={isEnglish ? "Next step" : "Nächster Schritt"}
          description={isEnglish ? "What happens next" : "Was als Nächstes folgt"}
          pillLabel={String(props.nextStepsCount)}
          unreadLabel={props.nextStepsCount > 0 ? (isEnglish ? "new" : "neu") : props.showOpenLabels ? openLabel : undefined}
          onClick={props.onOpenSection ? () => props.onOpenSection?.("next_steps") : undefined}
        />
      </div>
    </section>
  );
}

function StructureOverviewRail(props: {
  cards: FocusOverviewCard[];
  activeCardId: FocusAreaId;
  onSelect: (id: FocusAreaId) => void;
}) {
  const overviewTabRefs = React.useRef<Record<FocusAreaId, React.ElementRef<"button"> | null>>({
    priorities: null,
    clusters: null,
    questions: null,
    sections: null,
    next_steps: null,
  });

  const handleOverviewTabKeyDown = React.useCallback(
    (event: React.KeyboardEvent<React.ElementRef<"button">>, cardId: FocusAreaId) => {
      const currentIndex = FOCUS_AREA_ORDER.indexOf(cardId);
      const nextIndex = resolveNextIndexFromKey(currentIndex, event.key, FOCUS_AREA_ORDER.length);
      if (nextIndex === null) return;
      event.preventDefault();
      const nextCardId = FOCUS_AREA_ORDER[nextIndex];
      props.onSelect(nextCardId);
      window.requestAnimationFrame(() => {
        overviewTabRefs.current[nextCardId]?.focus();
      });
    },
    [props],
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {CREATE_VISUAL_FOLLOWUP_COPY.overviewTitle}
      </p>
      <div
        data-focus-card-overview
        className="grid gap-2 sm:grid-cols-2"
        role="tablist"
        aria-label="Überblick über den vorgeschlagenen Arbeitsstand"
      >
        {props.cards.map((card) => {
          const isActive = props.activeCardId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              ref={(node) => {
                overviewTabRefs.current[card.id] = node;
              }}
              onClick={() => props.onSelect(card.id)}
              onKeyDown={(event) => handleOverviewTabKeyDown(event, card.id)}
              role="tab"
              id={`create-overview-tab-${card.id}`}
              aria-selected={isActive}
              aria-controls={`create-overview-panel-${card.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`w-full rounded-[22px] border px-4 py-3 text-left transition-all duration-300 ease-out ${
                isActive
                  ? "border-cyan-400/70 bg-cyan-500/[0.08] shadow-[0_16px_36px_rgba(8,145,178,0.12)] dark:border-cyan-300/45 dark:bg-cyan-500/12"
                  : "border-slate-200/75 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
              }`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/60 bg-cyan-500/[0.06] dark:border-cyan-300/30 dark:bg-cyan-500/10">
                    <FocusAreaIcon area={card.id} active={isActive} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-[rgb(var(--fg))]">{card.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{card.lead}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                    {card.status}
                  </span>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M7 4.5 13 10l-6 5.5" />
                  </svg>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SummarySnapshotCard(props: {
  keyStatement: string;
  rootTopic: string;
  positionClusters: string[];
  topicLabels: string[];
  voteQuestionCount: number;
  sectionCount: number;
}) {
  return (
    <div className="rounded-[30px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,20,46,0.92),rgba(13,25,49,0.96))] px-4 py-4 shadow-[0_20px_48px_rgba(2,6,23,0.28)] dark:border-cyan-300/16 dark:bg-[linear-gradient(180deg,rgba(8,20,46,0.92),rgba(13,25,49,0.96))]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-200/80">Kurzfassung</p>
      <p className="mt-3 text-lg font-semibold leading-tight text-white">{props.keyStatement}</p>
      <p className="mt-3 text-sm leading-relaxed text-slate-300">
        Der Arbeitsstand wird jetzt entlang eines Hauptthemas geführt und hält Nebensignale bewusst im Hintergrund.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("topic")}`}>{props.rootTopic}</span>
        {props.positionClusters.slice(0, 2).map((cluster) => (
          <span key={`summary-cluster-${cluster}`} className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("stance")}`}>
            {cluster}
          </span>
        ))}
      </div>
      <div className="mt-5 rounded-[24px] border border-white/8 bg-slate-950/20 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">Signalbild</p>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="rounded-full border border-white/10 px-2 py-1">{props.voteQuestionCount} Fragen</span>
            <span className="rounded-full border border-white/10 px-2 py-1">{props.sectionCount} Abschnitte</span>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {props.topicLabels.slice(0, 4).map((label, index) => (
            <div key={`signal-${label}`} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs text-slate-300">
                <span className="truncate">{label}</span>
                <span>{Math.max(1, 4 - index)}/4</span>
              </div>
              <div className="h-2 rounded-full bg-white/6">
                <div
                  className="h-2 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(45,212,191,0.75),rgba(168,85,247,0.7))] transition-all duration-500 ease-out"
                  style={{ width: `${88 - index * 18}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkflowStageStrip(props: { stages: FollowupStage[] }) {
  return (
    <div className="rounded-[30px] border border-slate-200/75 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Status</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Wo du gerade bist</p>
        </div>
        <span className="rounded-full border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Geführter Ablauf
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {props.stages.map((stage, index) => {
          const isActive = stage.status === "active";
          const isDone = stage.status === "done";
          return (
            <div
              key={stage.id}
              className={`rounded-2xl border px-3 py-3 transition-all duration-300 ease-out ${
                isActive
                  ? "border-cyan-300/45 bg-cyan-500/[0.08]"
                  : isDone
                    ? "border-emerald-300/30 bg-emerald-500/[0.08]"
                    : "border-slate-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    isActive
                      ? "border-cyan-300/60 text-cyan-100"
                      : isDone
                        ? "border-emerald-300/60 text-emerald-100"
                        : "border-slate-300/50 text-slate-300"
                  }`}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{stage.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{stage.lead}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceStageRail(props: { stages: FollowupStage[] }) {
  return (
    <div
      data-create-pipeline-rail
      className="overflow-x-auto rounded-[24px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Voxy Pilotpfad</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Vom Eingang bis zur bewussten nächsten Aktion</p>
        </div>
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]">
          review-first
        </span>
      </div>
      <div className="flex min-w-max items-stretch gap-2">
        {props.stages.map((stage) => {
          const toneClass =
            stage.status === "done"
              ? "border-emerald-300/35 bg-emerald-500/[0.08]"
              : stage.status === "active"
                ? "border-cyan-300/45 bg-cyan-500/[0.08]"
                : "border-slate-200/75 bg-[rgb(var(--bg))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]";
          const badge =
            stage.status === "done" ? "bereit" : stage.status === "active" ? "jetzt" : "danach";

          return (
            <article
              key={stage.id}
              className={`min-w-[9.75rem] rounded-[20px] border px-3 py-3 transition-all duration-300 ease-out ${toneClass}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{stage.title}</p>
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                  {badge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{stage.lead}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function WorkspaceMetricRail(props: {
  items: Array<{
    label: string;
    value: string;
    detail: string;
  }>;
}) {
  return (
    <div
      data-create-structure-rail
      data-create-workspace-kpis
      className="overflow-x-auto rounded-[24px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
    >
      <div className="flex min-w-max flex-wrap items-center gap-2">
        {props.items.map((item, index) => (
          <React.Fragment key={item.label}>
            <article className="rounded-full border border-slate-200/75 bg-[rgb(var(--bg))] px-3 py-2 dark:border-[rgb(var(--border))]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                {item.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{item.value}</p>
              <p className="text-[11px] leading-relaxed text-[rgb(var(--muted))]">{item.detail}</p>
            </article>
            {index < props.items.length - 1 ? (
              <span className="text-sm text-[rgb(var(--muted))]" aria-hidden="true">
                ·
              </span>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function TopicBranchPreviewGrid(props: {
  rootTopic: string;
  branches: CreateStructureBranch[];
}) {
  if (props.branches.length === 0) return null;

  return (
    <div
      data-create-topic-branches
      className="space-y-4 rounded-[24px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Erkannte Themenzweige</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{props.branches.length} Hauptthemen identifiziert</p>
        </div>
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]">
          vom Ursprung aus
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted))]">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-300/45 bg-cyan-500/[0.08] font-semibold text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-500/12 dark:text-cyan-50">
          1
        </span>
        <div>
          <p className="font-semibold text-[rgb(var(--fg))]">{props.rootTopic}</p>
          <p className="text-xs leading-relaxed">Themen können zusammenbleiben oder getrennt weitergeführt werden.</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {props.branches.slice(0, 3).map((branch, index) => (
          <article
            key={branch.id}
            data-create-topic-branch-card=""
            className="rounded-[22px] border border-cyan-200/45 bg-cyan-500/[0.05] px-4 py-4 dark:border-cyan-300/20 dark:bg-cyan-500/[0.08]"
          >
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-900 dark:text-cyan-100">
              <span className="rounded-full border border-cyan-300/40 px-2 py-0.5">Themenzweig</span>
              <span className="text-[rgb(var(--muted))]">{branch.claims.length || 1} Aussagen</span>
            </div>
            <p className="mt-3 text-base font-semibold leading-snug text-[rgb(var(--fg))]">{branch.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{branch.need || branch.claims[0] || "Dieser Zweig bleibt als eigenständiger Arbeitsstrang sichtbar."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {branch.topicTags.slice(0, 3).map((topic) => (
                <span
                  key={`${branch.id}-${topic}`}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${resolveNodeTone("topic")}`}
                >
                  {topic}
                </span>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 text-xs leading-relaxed text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
              <p className="font-semibold text-[rgb(var(--fg))]">Empfohlene Aktion</p>
              <p className="mt-1">{index === 0 ? "Hauptthema wählen" : "Als Zweig parken"}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function OpenQuestionCards(props: { questions: string[] }) {
  if (props.questions.length === 0) return null;
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Offene Fragen</p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {props.questions.slice(0, 5).map((question) => (
          <article
            key={question}
            className="rounded-[20px] border border-amber-200/70 bg-amber-500/[0.08] px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-300/20 dark:bg-amber-500/[0.1] dark:text-amber-50"
          >
            {question}
          </article>
        ))}
      </div>
    </div>
  );
}

function SourceHintsAndNextStepsGrid(props: {
  modules: CreateFollowupContentModule[];
  nextStepTitles: string[];
}) {
  const sourceHints = props.modules
    .filter((module) => module.tone === "source" || module.tone === "context" || module.tone === "stats")
    .slice(0, 3);
  const nextSteps = props.nextStepTitles.slice(0, 4);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-[22px] border border-slate-200/75 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Quellen & Hinweise</p>
        <div className="mt-3 space-y-2">
          {sourceHints.length > 0 ? (
            sourceHints.map((module) => (
              <article
                key={module.id}
                className="rounded-2xl border border-slate-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{module.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{module.lead}</p>
              </article>
            ))
          ) : (
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
              Zusätzliche Quellen bleiben optional und werden erst nach deiner Auswahl ergänzt.
            </p>
          )}
        </div>
      </div>
      <div className="rounded-[22px] border border-slate-200/75 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Vorgeschlagene nächste Schritte</p>
        <ol className="mt-3 space-y-2">
          {nextSteps.length > 0 ? (
            nextSteps.map((step, index) => (
              <li
                key={`${step}-${index}`}
                className="rounded-2xl border border-slate-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 text-sm leading-relaxed text-[rgb(var(--fg))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
              >
                {step}
              </li>
            ))
          ) : (
            <li className="text-sm leading-relaxed text-[rgb(var(--muted))]">
              Hauptthema wählen und danach den Entwurf bewusst weiterführen.
            </li>
          )}
        </ol>
      </div>
    </div>
  );
}

function SectionFlowDiagram(props: { sections: ReturnType<typeof buildCreateVisualSections> }) {
  if (props.sections.length === 0) return null;
  return (
    <div className="rounded-[24px] border border-slate-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Lesefluss</p>
      <div className="mt-3 space-y-3">
        {props.sections.map((section, index) => (
          <div key={`flow-${section.id}`} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-0.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/45 text-[11px] font-semibold text-cyan-100">
                {index + 1}
              </span>
              {index < props.sections.length - 1 ? <span className="mt-1 h-6 w-px bg-[rgb(var(--border))]" /> : null}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{section.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">
                {section.statementLabel ?? section.topicLabel ?? "Einordnung"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentModuleGrid(props: { modules: CreateFollowupContentModule[] }) {
  if (props.modules.length === 0) return null;
  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Lesemodus</p>
          <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Was der Beitrag außerdem mitbringt</p>
        </div>
        <span className="rounded-full border border-slate-200/80 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Modular gelesen
        </span>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {props.modules.map((module) => (
          <article
            key={module.id}
            className={`rounded-[24px] border px-4 py-4 ${resolveContentModuleToneClass(module.tone)}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] opacity-80">{module.title}</p>
            <p className="mt-2 text-base font-semibold leading-snug">{module.lead}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{module.detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SecondaryFollowupNote(props: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-[color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%)] px-4 py-3 text-xs leading-relaxed text-[rgb(var(--muted))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      {props.children}
    </div>
  );
}

function NextStepChecklist(props: { items: NextStepChecklistItem[] }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Deine nächsten Schritte</p>
      <div className="space-y-2">
        {props.items.map((item) => (
          <div
            key={item.id}
            className={`rounded-2xl border px-3 py-3 ${
              item.done
                ? "border-emerald-300/60 bg-emerald-500/[0.08] dark:border-emerald-300/30 dark:bg-emerald-500/10"
                : "border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                  item.done
                    ? "border-emerald-400/70 bg-emerald-100 text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-500/20 dark:text-emerald-100"
                    : "border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-500/60 dark:bg-slate-500/10 dark:text-slate-200"
                }`}
              >
                {item.done ? "✓" : "○"}
              </span>
              <div>
                <p className="text-sm font-medium text-[rgb(var(--fg))]">{item.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[rgb(var(--muted))]">{item.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StructureFocusPanel(props: {
  activeFocusArea: FocusAreaId;
  rootTopic: string;
  topicLabels: string[];
  positionClusters: string[];
  voteQuestions: string[];
  keyStatement: string;
  structureBranches: CreateStructureBranch[];
  checklistItems: NextStepChecklistItem[];
  onEdit: (focus: string) => void;
  resultChangeKey: string;
  sections: ReturnType<typeof buildCreateVisualSections>;
  modules: CreateFollowupContentModule[];
}) {
  if (props.activeFocusArea === "priorities") {
    return (
      <div className="space-y-4 rounded-[30px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-5 shadow-[0_20px_48px_rgba(2,6,23,0.06)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Einordnung</p>
          <p className="text-base font-semibold text-[rgb(var(--fg))]">Was im Beitrag gerade die Richtung vorgibt</p>
        </div>
        <div className={`rounded-[24px] border px-4 py-4 ${resolveNodeTone("topic")}`}>
          <p className="text-sm font-semibold">Übergeordnetes Thema</p>
          <p className="mt-1 text-base font-semibold">{props.rootTopic}</p>
        </div>
        <div className={`rounded-[24px] border px-4 py-4 ${resolveNodeTone("statement")}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]">Kern erkannt</p>
          <p className="mt-2 text-base font-semibold leading-relaxed">{props.keyStatement}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themenfelder</p>
          <TopicFieldList labels={props.topicLabels.slice(0, 6)} onPick={props.onEdit} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Blickrichtungen</p>
          <PositionClusterList labels={props.positionClusters} onPick={props.onEdit} />
        </div>
        <ContentModuleGrid modules={props.modules.slice(0, 2)} />
      </div>
    );
  }

  if (props.activeFocusArea === "clusters") {
    return props.structureBranches.length > 0 ? (
      <StructureBranchList branches={props.structureBranches} onEdit={props.onEdit} resetKey={props.resultChangeKey} />
    ) : (
      <div className="space-y-3 rounded-[30px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-5 shadow-[0_20px_48px_rgba(2,6,23,0.06)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Themencluster</p>
        <p className="text-sm text-[rgb(var(--muted))]">Für diesen Beitrag reicht zunächst ein kompakter Themenfokus statt mehrerer Cluster.</p>
        <TopicFieldList labels={props.topicLabels.slice(0, 6)} onPick={props.onEdit} />
      </div>
    );
  }

  if (props.activeFocusArea === "questions") {
    return (
      <div className="space-y-4 rounded-[30px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-5 shadow-[0_20px_48px_rgba(2,6,23,0.06)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <div className="rounded-[24px] border border-fuchsia-200/70 bg-fuchsia-50/70 px-4 py-4 dark:border-fuchsia-300/25 dark:bg-fuchsia-500/10">
          <p className="text-sm font-semibold text-fuchsia-950 dark:text-fuchsia-50">Fragen & Abstimmung</p>
          <p className="mt-2 text-sm leading-relaxed text-fuchsia-900 dark:text-fuchsia-100">
            Diese Leitfragen bleiben sichtbar, aber erst nach deiner Bestätigung werden sie weiter vorbereitet.
          </p>
        </div>
        <VoteQuestionList questions={props.voteQuestions} />
        <ContentModuleGrid modules={props.modules.filter((module) => module.tone === "vote" || module.tone === "stats").slice(0, 2)} />
      </div>
    );
  }

  if (props.activeFocusArea === "sections") {
    return (
      <div className="space-y-4 rounded-[30px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-5 shadow-[0_20px_48px_rgba(2,6,23,0.06)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <div className="rounded-[24px] border border-sky-200/60 bg-sky-500/[0.06] px-4 py-4 dark:border-sky-300/25 dark:bg-sky-500/10">
          <p className="text-sm font-semibold text-sky-950 dark:text-sky-50">Gelesene Sinnabschnitte</p>
          <p className="mt-2 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
            Hier siehst du, welche Abschnitte ich getrennt gelesen und wie ich sie jeweils eingeordnet habe.
          </p>
        </div>
        <div className="space-y-2">
          {props.sections.length > 0 ? (
            props.sections.map((section) => (
              <details
                key={section.id}
                className="rounded-2xl border border-slate-200/75 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
              >
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                  {section.label}
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-[rgb(var(--fg))]"><span className="font-semibold">Du sagst:</span> {section.sourceText}</p>
                  {section.statementLabel ? (
                    <p className="text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Erkannt als:</span> {section.statementLabel}</p>
                  ) : null}
                  {section.topicLabel ? (
                    <p className="text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Gehört zu:</span> {section.topicLabel}</p>
                  ) : null}
                  {section.connectionLabel ? (
                    <p className="text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Passender nächster Schritt:</span> {section.connectionLabel}</p>
                  ) : null}
                </div>
              </details>
            ))
          ) : (
            <SecondaryFollowupNote>
              Für diesen Beitrag reichen im Moment kompakte Sinnabschnitte ohne weitere Unterteilung.
            </SecondaryFollowupNote>
          )}
        </div>
        <SectionFlowDiagram sections={props.sections} />
        <ContentModuleGrid modules={props.modules.filter((module) => module.tone === "source" || module.tone === "context")} />
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-[30px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-5 shadow-[0_20px_48px_rgba(2,6,23,0.06)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
      <NextStepChecklist items={props.checklistItems} />
      <SecondaryFollowupNote>
        Guardrails bleiben kompakt sichtbar: keine automatische Stimme, keine automatische Veröffentlichung, keine automatische Kostenbuchung.
      </SecondaryFollowupNote>
    </div>
  );
}

function StructuredWorkstateBlock(props: {
  rootTopic: string;
  topicLabels: string[];
  positionClusters: string[];
  voteQuestions: string[];
  keyStatement: string;
  structureBranches: CreateStructureBranch[];
  sortedSuggestions: CreateConnectionSuggestion[];
  isConfirmed: boolean;
  onEdit: (focus: string) => void;
  resultChangeKey: string;
  sections: ReturnType<typeof buildCreateVisualSections>;
  modules: CreateFollowupContentModule[];
}) {
  const initialFocusArea: FocusAreaId = props.structureBranches.length > 0 ? "clusters" : "priorities";
  const [activeFocusArea, setActiveFocusArea] = React.useState<FocusAreaId>(initialFocusArea);
  const stages = React.useMemo(
    () =>
      buildWorkflowStages({
        isConfirmed: props.isConfirmed,
        hasSuggestions: props.sortedSuggestions.length > 0,
      }),
    [props.isConfirmed, props.sortedSuggestions.length],
  );
  const overviewCards = React.useMemo<FocusOverviewCard[]>(
    () => {
      const checklist = buildNextStepChecklist({
        isConfirmed: props.isConfirmed,
        structureBranches: props.structureBranches,
        voteQuestions: props.voteQuestions,
        sortedSuggestions: props.sortedSuggestions,
      });
      const doneChecklistCount = checklist.filter((item) => item.done).length;
      return [
        {
          id: "priorities",
          title: "Prioritäten",
          lead: "Was ist dir besonders wichtig?",
          status: `${Math.max(1, Math.min(props.topicLabels.length, 3))} Prioritäten`,
        },
        {
          id: "clusters",
          title: "Themencluster",
          lead: "Deine Schwerpunkte im Detail",
          status: `${Math.max(1, props.structureBranches.length || 1)} Cluster`,
        },
        {
          id: "questions",
          title: "Fragen & Abstimmung",
          lead: "Was denkst du? Mach mit!",
          status: `${Math.max(1, props.voteQuestions.length)} Fragen`,
        },
        {
          id: "next_steps",
          title: "Nächste Schritte",
          lead: "So geht es weiter",
          status: `${Math.min(doneChecklistCount, 3)}/3 erledigt`,
        },
      ];
    },
    [
      props.isConfirmed,
      props.sortedSuggestions,
      props.structureBranches,
      props.topicLabels.length,
      props.voteQuestions,
    ],
  );
  const checklistItems = React.useMemo(
    () =>
      buildNextStepChecklist({
        isConfirmed: props.isConfirmed,
        structureBranches: props.structureBranches,
        voteQuestions: props.voteQuestions,
        sortedSuggestions: props.sortedSuggestions,
      }),
    [props.isConfirmed, props.sortedSuggestions, props.structureBranches, props.voteQuestions],
  );

  React.useEffect(() => {
    setActiveFocusArea(initialFocusArea);
  }, [initialFocusArea, props.resultChangeKey]);

  return (
    <div className="mt-5 min-w-0 space-y-5 border-t border-slate-200 pt-5 dark:border-[rgb(var(--border))]">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">Vorgeschlagener Arbeitsstand</p>
        <p className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
          {CREATE_VISUAL_FOLLOWUP_COPY.graphTitle}
        </p>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(18rem,0.82fr)_minmax(0,1.18fr)]">
        <div className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <SummarySnapshotCard
            keyStatement={props.keyStatement}
            rootTopic={props.rootTopic}
            positionClusters={props.positionClusters}
            topicLabels={props.topicLabels}
            voteQuestionCount={props.voteQuestions.length}
            sectionCount={props.sections.length}
          />
          <WorkflowStageStrip stages={stages} />
          <StructureOverviewRail cards={overviewCards} activeCardId={activeFocusArea} onSelect={setActiveFocusArea} />
        </div>

        {FOCUS_AREA_ORDER.map((focusArea) => {
          const isActive = activeFocusArea === focusArea;
          return (
            <div
              key={focusArea}
              role="tabpanel"
              id={`create-overview-panel-${focusArea}`}
              aria-labelledby={`create-overview-tab-${focusArea}`}
              className="space-y-4"
              hidden={!isActive}
            >
              <StructureFocusPanel
                activeFocusArea={focusArea}
                rootTopic={props.rootTopic}
                topicLabels={props.topicLabels}
                positionClusters={props.positionClusters}
                voteQuestions={props.voteQuestions}
                keyStatement={props.keyStatement}
                structureBranches={props.structureBranches}
                checklistItems={checklistItems}
                onEdit={props.onEdit}
                resultChangeKey={props.resultChangeKey}
                sections={props.sections}
                modules={props.modules}
              />
              {focusArea !== "priorities" ? <ContentModuleGrid modules={props.modules.slice(0, 4)} /> : null}
              <details className="rounded-[24px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                  Gelesene Sinnabschnitte und Lesemodus
                </summary>
                <div className="mt-4 space-y-4">
                  <div className="rounded-[24px] border border-sky-200/60 bg-sky-500/[0.06] px-4 py-4 dark:border-sky-300/25 dark:bg-sky-500/10">
                    <p className="text-sm font-semibold text-sky-950 dark:text-sky-50">Gelesene Sinnabschnitte</p>
                    <p className="mt-2 text-sm leading-relaxed text-sky-900 dark:text-sky-100">
                      Diese Analysebausteine bleiben bewusst hinter Details und tauchen nicht im ersten Bürger-Flow auf.
                    </p>
                  </div>
                  <SectionFlowDiagram sections={props.sections} />
                  <div className="space-y-2">
                    {props.sections.map((section) => (
                      <details
                        key={section.id}
                        className="rounded-2xl border border-slate-200/75 bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
                      >
                        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{section.label}</summary>
                        <div className="mt-3 space-y-2 text-sm">
                          <p className="text-[rgb(var(--fg))]"><span className="font-semibold">Du sagst:</span> {section.sourceText}</p>
                          {section.statementLabel ? (
                            <p className="text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Erkannt als:</span> {section.statementLabel}</p>
                          ) : null}
                          {section.topicLabel ? (
                            <p className="text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Gehört zu:</span> {section.topicLabel}</p>
                          ) : null}
                          {section.connectionLabel ? (
                            <p className="text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Passender nächster Schritt:</span> {section.connectionLabel}</p>
                          ) : null}
                        </div>
                      </details>
                    ))}
                  </div>
                  <ContentModuleGrid modules={props.modules} />
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlaceClarificationPanel(props: {
  question: string;
  privacyHint?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSkip?: () => void;
  submitDisabled: boolean;
}) {
  return (
    <div className="rounded-[24px] border border-amber-300/55 bg-amber-500/[0.09] px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900 dark:text-amber-100">Ortsklärung</p>
      <p className="mt-2 text-lg font-semibold text-amber-950 dark:text-amber-50">Um welchen Ort geht es?</p>
      <p className="mt-2 text-sm leading-relaxed text-amber-950/90 dark:text-amber-100/90">{props.question}</p>
      {props.privacyHint ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-900/80 dark:text-amber-100/80">{props.privacyHint}</p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          placeholder="Ort, Bezirk oder Kommune ergänzen"
          className="min-w-0 flex-1 rounded-xl border border-amber-300/60 bg-white/80 px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 dark:bg-slate-950/50 dark:text-white"
        />
        <button
          type="button"
          className="btn-primary min-h-[42px] px-4 py-2 text-sm"
          onClick={props.onSubmit}
          disabled={props.submitDisabled}
          aria-disabled={props.submitDisabled}
        >
          Ort ergänzen
        </button>
      </div>
      {props.onSkip ? (
        <button
          type="button"
          className="mt-3 text-sm font-medium text-amber-900 underline-offset-4 hover:underline dark:text-amber-100"
          onClick={props.onSkip}
        >
          Ort später ergänzen
        </button>
      ) : null}
    </div>
  );
}

function StructureProposalPanel(props: {
  onConfirm: () => void;
  onEdit: () => void;
  onStartOptionalService: () => void;
  onPrepareSubmission: () => void;
  onRequestEditorialReview: () => void;
  reviewRequestState: CreateReviewRequestState;
  reviewRequestMessage?: string | null;
}) {
  return (
    <div data-mobile-inline-create-actions className="space-y-3 border-t border-slate-200/80 pt-4 dark:border-[rgb(var(--border))]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Nächster Schritt</p>
          <p className="text-base font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
          <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
            Halte alles kurz und steuerbar: Hauptthema festlegen, den Beitrag weiterentwickeln, Quellen ergänzen oder den Entwurf bewusst speichern.
          </p>
        </div>
        <div className="flex flex-col gap-2 lg:items-end">
          <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[32rem]">
            <button
              type="button"
              className="btn-primary min-h-[46px] px-4 py-2 text-sm"
              onClick={props.onConfirm}
            >
              Hauptthema wählen
            </button>
            <button type="button" className="btn-primary min-h-[46px] px-4 py-2 text-sm" onClick={props.onEdit}>
              Beitrag weiterentwickeln
            </button>
            <button type="button" className="btn-primary min-h-[46px] px-4 py-2 text-sm" onClick={props.onStartOptionalService}>
              Quellen ergänzen
            </button>
            <button type="button" className="btn-primary min-h-[46px] px-4 py-2 text-sm" onClick={props.onPrepareSubmission}>
              Entwurf speichern
            </button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            <button
              type="button"
              className="btn-secondary min-h-[42px] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              onClick={props.onRequestEditorialReview}
              disabled={props.reviewRequestState === "saving"}
              aria-disabled={props.reviewRequestState === "saving"}
            >
              {resolveReviewRequestLabel(props.reviewRequestState, "compact")}
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[rgb(var(--muted))] lg:text-right">
            Keine automatische Veröffentlichung. Keine automatische Kostenbuchung.
          </p>
        </div>
      </div>
      {props.reviewRequestMessage ? (
        <p className="rounded-xl border border-emerald-300/25 bg-emerald-500/[0.08] px-3 py-2 text-xs leading-relaxed text-emerald-900 dark:text-emerald-100">
          {props.reviewRequestMessage}
        </p>
      ) : null}
    </div>
  );
}

function PlannerClarificationPanel(props: {
  reason: string;
  details?: string | null;
  startPoints: string[];
  technicalFallback?: boolean;
  onRetryPlanner?: () => void;
  isRetryPlannerPending?: boolean;
  onEdit: () => void;
  onPrepareSubmission: () => void;
  onPrepareAnlassraum: () => void;
  reviewRequestState: CreateReviewRequestState;
  reviewRequestMessage?: string | null;
}) {
  return (
    <div className="space-y-3 rounded-[28px] border border-amber-300/30 bg-amber-500/[0.08] px-4 py-4 dark:border-amber-300/20 dark:bg-amber-500/[0.1]">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900 dark:text-amber-100">
          So kannst du weitermachen
        </p>
        <p className="text-sm leading-relaxed text-amber-950/85 dark:text-amber-100/85">
          {props.technicalFallback
            ? "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen."
            : "Wähle selbst ein Thema oder bereite den Beitrag zur Prüfung vor."}
        </p>
      </div>
      {props.startPoints.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900 dark:text-amber-100">Mögliche Startpunkte</p>
          <div className="flex flex-wrap gap-2">
            {props.startPoints.map((label) => (
              <span
                key={`degraded-start-${label}`}
                className="rounded-full border border-amber-400/30 bg-amber-500/[0.12] px-2.5 py-1 text-xs text-amber-950 dark:border-amber-300/30 dark:bg-amber-500/[0.14] dark:text-amber-50"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="btn-primary min-h-[46px] px-4 py-2 text-sm"
          onClick={props.onEdit}
        >
          Hauptthema wählen
        </button>
        <button
          type="button"
          className="btn-primary min-h-[46px] px-4 py-2 text-sm"
          onClick={props.onEdit}
        >
          Beitrag weiterentwickeln
        </button>
        <button type="button" className="btn-primary min-h-[46px] px-4 py-2 text-sm" onClick={props.onPrepareSubmission}>
          Entwurf speichern
        </button>
        <button type="button" className="btn-secondary min-h-[42px] px-3 py-2 text-sm" onClick={props.onPrepareAnlassraum}>
          Anlassraum vorbereiten
        </button>
      </div>
      <details className="rounded-2xl border border-amber-300/25 bg-amber-500/[0.06] px-3 py-3">
        <summary className="cursor-pointer text-sm font-medium text-amber-950 dark:text-amber-100">
          Details ansehen
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button type="button" className="btn-secondary min-h-[42px] px-3 py-2 text-sm" onClick={props.onEdit}>
            Thema selbst wählen
          </button>
          <button
            type="button"
            className="btn-secondary min-h-[42px] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={props.onRetryPlanner}
            disabled={!props.onRetryPlanner || props.isRetryPlannerPending}
          aria-disabled={!props.onRetryPlanner || props.isRetryPlannerPending}
          >
            {props.isRetryPlannerPending
              ? "Einordnung wird erneut versucht …"
              : "Einordnung erneut versuchen"}
          </button>
        </div>
      </details>
      {props.reviewRequestMessage ? (
        <p className="rounded-xl border border-amber-300/25 bg-amber-500/[0.08] px-3 py-2 text-xs leading-relaxed text-amber-950 dark:text-amber-100">
          {props.reviewRequestMessage}
        </p>
      ) : null}
      <p className="text-xs leading-relaxed text-amber-950/85 dark:text-amber-100/85">
        Keine automatische Veröffentlichung. Keine automatische Kostenbuchung.
      </p>
      {props.details ? <p className="text-xs leading-relaxed text-amber-950/75 dark:text-amber-100/75">{props.details}</p> : null}
    </div>
  );
}

function NextStepPanel(props: {
  multiTopicActionTopics: string[];
  showMultiTopicActionPanel: boolean;
  onDeepenAllTopics: () => void;
  onDeepenTopic: (topicLabel: string) => void;
  onContinueInAccount: () => void;
  onPrepareSubmission: () => void;
  onPrepareAnlassraum: () => void;
  onOpenDossierAppend: () => void;
  onOpenDossierCreate: () => void;
  onPrepareVote: () => void;
  onRequestEditorialReview: () => void;
  onStartOptionalService: () => void;
  onSaveOnly: () => void;
  reviewRequestState: CreateReviewRequestState;
  reviewRequestMessage?: string | null;
  factcheckMessage?: string | null;
}) {
  return (
    <div className="space-y-4 rounded-[28px] border border-cyan-300/28 bg-[linear-gradient(180deg,rgba(9,20,42,0.98),rgba(11,24,46,0.95))] px-4 py-4 shadow-[0_18px_42px_rgba(8,145,178,0.12)]">
      <div className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/75">Nächster Schritt</p>
        <p className="text-base font-semibold text-white">Wie möchtest du tiefer ins Thema gehen?</p>
        <p className="text-sm leading-relaxed text-slate-300">
          Alles bleibt Entwurf und review-first. Themenstränge werden weder automatisch aufgeteilt noch zusammengeführt.
        </p>
      </div>
      {props.showMultiTopicActionPanel ? (
        <div
          data-create-multitheme-actions
          className="space-y-4 rounded-[24px] border border-cyan-300/18 bg-white/[0.03] px-4 py-4"
        >
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">
              Mehrthemen-Follow-up
            </p>
            <p className="text-sm font-semibold text-white">Darin stecken mehrere Themenstränge</p>
            <p className="text-sm leading-relaxed text-slate-300">
              Du entscheidest, ob diese Themen zusammenbleiben, als Schwerpunkt getrennt werden oder erst als Nebenthema geparkt bleiben.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              "Schwerpunkt wählen",
              "Zusammen lassen",
              "Als Zweig parken",
              "An Debatte anknüpfen",
              "Dossier prüfen",
              "Beteiligung vorbereiten",
            ].map((label) => (
              <span
                key={`multitopic-choice-${label}`}
                className="rounded-full border border-cyan-300/20 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-cyan-50"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="btn-primary min-h-[46px] px-4 py-2 text-sm"
              onClick={() => props.onDeepenTopic(props.multiTopicActionTopics[0] ?? "")}
            >
              Hauptthema wählen
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[42px] px-3 py-2 text-sm"
              onClick={props.onContinueInAccount}
            >
              Als Zweig parken
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[42px] px-3 py-2 text-sm"
              onClick={props.onPrepareVote}
            >
              Beteiligung vorbereiten
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[42px] px-3 py-2 text-sm"
              onClick={props.onStartOptionalService}
            >
              Quelle prüfen
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[42px] px-3 py-2 text-sm"
              onClick={props.onPrepareAnlassraum}
            >
              An Debatte anknüpfen
            </button>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {props.multiTopicActionTopics.map((topicLabel) => (
              <article
                key={`deepen-topic-${topicLabel}`}
                className="rounded-2xl border border-cyan-300/18 bg-slate-950/25 px-3 py-3"
              >
                <p className="text-sm font-semibold text-white">{topicLabel}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Dieser Themenstrang bleibt im Draft und kann gezielt weitergeführt werden.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-300/20 bg-white/[0.05] px-2.5 py-1 text-[11px] text-cyan-50">
                    Schwerpunkt wählen
                  </span>
                  <span className="rounded-full border border-cyan-300/20 bg-white/[0.05] px-2.5 py-1 text-[11px] text-cyan-50">
                    Aufteilen
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secondary mt-3 min-h-[40px] px-3 py-2 text-sm"
                  onClick={() => props.onDeepenTopic(topicLabel)}
                >
                  Schwerpunkt wählen
                </button>
              </article>
            ))}
          </div>
        </div>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          className="btn-primary min-h-[46px] px-4 py-2 text-sm"
          onClick={props.showMultiTopicActionPanel ? () => props.onDeepenTopic(props.multiTopicActionTopics[0] ?? "") : props.onContinueInAccount}
        >
          Hauptthema wählen
        </button>
        <button type="button" className="btn-primary min-h-[46px] px-4 py-2 text-sm" onClick={props.onContinueInAccount}>
          Beitrag weiterentwickeln
        </button>
        <button
          type="button"
          className="btn-primary min-h-[46px] px-4 py-2 text-sm"
          onClick={props.onStartOptionalService}
          aria-label="Quellen ergänzen"
          title="Quellen ergänzen"
        >
          Quellen ergänzen
        </button>
        <button type="button" className="btn-primary min-h-[46px] px-4 py-2 text-sm" onClick={props.onSaveOnly}>
          Entwurf speichern
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button type="button" className="btn-secondary min-h-[42px] px-3 py-2 text-sm" onClick={props.onPrepareAnlassraum}>
          Anlassraum vorbereiten
        </button>
        <button type="button" className="btn-secondary min-h-[42px] px-3 py-2 text-sm" onClick={props.onOpenDossierAppend}>
          Anschluss prüfen
        </button>
        <button type="button" className="btn-secondary min-h-[42px] px-3 py-2 text-sm" onClick={props.onOpenDossierCreate}>
          Dossier prüfen
        </button>
        <button type="button" className="btn-secondary min-h-[42px] px-3 py-2 text-sm" onClick={props.onPrepareVote}>
          Beteiligung vorbereiten
        </button>
        <button
          type="button"
          className="btn-secondary min-h-[42px] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          onClick={props.onRequestEditorialReview}
          disabled={props.reviewRequestState === "saving"}
          aria-disabled={props.reviewRequestState === "saving"}
          aria-label="Redaktionelle Prüfung anfragen"
          title="Redaktionelle Prüfung anfragen"
        >
          Redaktionell prüfen lassen
        </button>
      </div>
      <p className="text-xs leading-relaxed text-slate-400">
        Kein Auto-Publish, kein Auto-Dossier, kein Auto-Anlassraum und kein Auto-Graph.
      </p>
      {props.reviewRequestMessage ? (
        <p className="rounded-xl border border-cyan-300/20 bg-cyan-500/[0.08] px-3 py-2 text-xs leading-relaxed text-cyan-100">
          {props.reviewRequestMessage}
        </p>
      ) : null}
      {props.factcheckMessage ? (
        <p className="text-xs leading-relaxed text-slate-400">{props.factcheckMessage}</p>
      ) : null}
    </div>
  );
}

function ContinueWritingComposer(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitDisabled: boolean;
}) {
  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400 ring-4 ring-white dark:bg-slate-500 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-5xl min-w-0 flex-1 rounded-[24px] rounded-tl-sm border border-slate-200/75 bg-[color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--bg))_12%)] px-4 py-4 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Korrektur oder Ergänzung</p>
        <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">Schreib einfach weiter</p>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Ergänze hier, was anders gemeint war, welche Quelle noch fehlt oder welchen nächsten Schritt ich anpassen soll.
        </p>
        <textarea
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          rows={4}
          placeholder="Bitte ändere das Thema auf Pflege. Formuliere die Abstimmungsfrage neutraler. Ich möchte noch eine Quelle ergänzen."
          className="mt-3 w-full resize-y rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] shadow-sm focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn-secondary min-h-[40px] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            onClick={props.onSubmit}
            disabled={props.submitDisabled}
            aria-disabled={props.submitDisabled}
          >
            Antwort fortsetzen
          </button>
          <span className="text-xs text-[rgb(var(--muted))]">Dein neuer Hinweis ergänzt den bisherigen Chatverlauf.</span>
        </div>
      </div>
    </div>
  );
}

export default function CreateVisualFollowup({
  result,
  actionNotice,
  isConfirmed = false,
  embedInWorkspaceShell = false,
  reviewRequestState = "idle",
  reviewRequestMessage = null,
  factcheckMessage = null,
  showCorrectionComposer = false,
  onConfirm,
  onEdit,
  onPrepareSubmission,
  onPrepareAnlassraum,
  onOpenDossierAppend,
  onOpenDossierCreate,
  onPrepareVote,
  onRequestEditorialReview = () => {},
  onStartOptionalService = () => {},
  onDeepenAllTopics = () => {},
  onDeepenTopic = () => {},
  onContinueInAccount = () => {},
  onRetryPlanner,
  isRetryPlannerPending = false,
  onSaveOnly = () => {},
  onSkipPlaceClarification = () => {},
  continuationValue,
  onContinuationChange,
  onContinueConversation,
  continueConversationDisabled = false,
  handoffRuntimeDossierId = null,
  handoffRuntimeAnlassraumId = null,
  handoffRuntimeSourceUrls,
  handoffRuntimeMaterialItems,
}: CreateVisualFollowupProps) {
  const sections = React.useMemo(() => buildCreateVisualSections(result, 4), [result]);
  const resultChangeKey = React.useMemo(
    () =>
      [
        result.generatedAt,
        result.understanding.summary,
        result.sourceText,
        result.understanding.dossierContext,
      ]
        .filter(Boolean)
        .join("::"),
    [
      result.generatedAt,
      result.sourceText,
      result.understanding.dossierContext,
      result.understanding.summary,
    ],
  );

  const topicLabels = result.understanding.topics.map((topic) => topic.label);
  const broadTopicFields = React.useMemo(() => deriveBroadTopicFields(topicLabels), [topicLabels]);
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const sortedSuggestions = sortSuggestions(result.suggestions)
    .filter((suggestion) => suggestion.kind !== "topic")
    .slice(0, 4);
  const structureBranches = React.useMemo(() => buildCreateStructureBranches(result, 3), [result]);
  const multiTopicActionTopics = React.useMemo(() => buildMultiTopicActionTopics(result), [result]);
  const showMultiTopicActionPanel = shouldShowMultiTopicActionPanel(multiTopicActionTopics);
  const contentModules = React.useMemo(
    () =>
      buildContentModules({
        result,
        sections,
        sortedSuggestions,
      }),
    [result, sections, sortedSuggestions],
  );
  const voteQuestions = React.useMemo(
    () =>
      buildVoteQuestions({
        dossierContext: result.understanding.dossierContext,
        broadTopicFields,
        suggestions: sortedSuggestions,
        fallbackTopic: result.understanding.dossierContext ?? topicLabels[0] ?? "Öffentliches Thema",
      }),
    [broadTopicFields, result.understanding.dossierContext, sortedSuggestions, topicLabels],
  );
  const scopeChip = result.understanding.scopes[0] ?? "unclear";
  const plannerClarificationRequired = needsPlannerClarification(result);
  const plannerClarificationReason = resolvePlannerClarificationReason(result);
  const plannerClarificationDetails = resolvePlannerClarificationDetails(result);
  const plannerProvisionalNotice = resolvePlannerProvisionalNotice(result);
  const plannerUsesProvisionalStructure = Boolean(plannerProvisionalNotice);
  const plannerTechnicalFallback = isTechnicalPlannerFallback(result);
  const degradedStartPoints = React.useMemo(() => extractDegradedStartPoints(result), [result]);
  const dialogIntelligenceRuntimeResult = React.useMemo(
    () => runDialogIntelligenceRuntime({ result, isConfirmed }),
    [isConfirmed, result],
  );
  const dialogOutcomePreview = dialogIntelligenceRuntimeResult.outcome;
  const existingTopicMatchesPreview = React.useMemo(
    () => createExistingTopicMatchPanelPreviewFromDialogOutcome(dialogOutcomePreview),
    [dialogOutcomePreview],
  );
  const [existingTopicMatchesRuntimeResult, setExistingTopicMatchesRuntimeResult] =
    React.useState<ResolveExistingTopicMatchesFromRuntimeResult>({
      status: "preview",
      blockers: [],
      usedSources: ["preview"],
      model: existingTopicMatchesPreview,
    });
  const existingTopicMatchesModel: ExistingTopicMatchPanelModel =
    existingTopicMatchesRuntimeResult.model;
  const topicDeduplicationCandidates = React.useMemo(
    () =>
      buildTopicDeduplicationCandidates({
        existingMatches: existingTopicMatchesModel.matches,
        dialogOutcome: dialogOutcomePreview,
      }),
    [dialogOutcomePreview, existingTopicMatchesModel.matches],
  );
  const primaryTopicDeduplicationCandidate = topicDeduplicationCandidates[0] ?? null;
  const primaryTopicDeduplicationState = React.useMemo(
    () =>
      primaryTopicDeduplicationCandidate
        ? summarizeTopicDeduplicationReviewState(primaryTopicDeduplicationCandidate)
        : null,
    [primaryTopicDeduplicationCandidate],
  );
  const primaryTopicGraphEdgeDraft = React.useMemo(
    () =>
      primaryTopicDeduplicationCandidate
        ? mapDeduplicationCandidateToGraphEdgeDraft(primaryTopicDeduplicationCandidate)
        : null,
    [primaryTopicDeduplicationCandidate],
  );
  const primaryTopicGraphMutationState = React.useMemo(
    () =>
      primaryTopicGraphEdgeDraft
        ? summarizeTopicGraphMutationState(primaryTopicGraphEdgeDraft)
        : null,
    [primaryTopicGraphEdgeDraft],
  );
  const dialogIntelligenceUiSource = React.useMemo(
    () =>
      resolveDialogIntelligenceUiSourceState({
        runtimeResult: dialogIntelligenceRuntimeResult,
        existingTopicMatchesRuntimeStatus: existingTopicMatchesRuntimeResult.status,
      }),
    [dialogIntelligenceRuntimeResult, existingTopicMatchesRuntimeResult.status],
  );
  const plannerClarificationLeadText = plannerTechnicalFallback
    ? "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen."
    : "Du kannst trotzdem weitermachen.";
  const assistantLead = resolveAssistantLead({
    topicLabels,
    summary: result.understanding.summary,
    statementText: result.understanding.statements[0]?.text ?? "",
    dossierContext: result.understanding.dossierContext,
    plannerTopic: result.meta?.planner?.plannerTopic ?? null,
  });
  const positionClusters = React.useMemo(() => derivePositionClusters(result), [result]);
  const keyStatement = resolveCoreClaim({
    topicLabels,
    fallback: result.understanding.statements[0]?.text ?? result.understanding.summary,
    dossierContext: result.understanding.dossierContext,
    plannerCore: result.meta?.planner?.plannerCore ?? null,
  });
  const dedupedCopy = dedupeCreateFollowupSections({
    summary: result.understanding.summary,
    coreClaim: keyStatement,
    sourceText: result.sourceText,
    statementText: result.understanding.statements[0]?.text ?? "",
  });
  const showCoreBlock = dedupedCopy.prominentCoreClaim !== dedupedCopy.prominentSummary;
  const showAssistantLeadText = shouldShowAssistantLead(
    dedupedCopy.prominentSummary,
    assistantLead,
    dedupedCopy.prominentCoreClaim,
  );
  const rootTopic = result.understanding.dossierContext ?? topicLabels[0] ?? "Öffentliches Thema";
  const openQuestion = result.understanding.openQuestion ?? null;
  const placeClarification = isPlaceClarificationQuestion(openQuestion)
    ? {
        kind: "place" as const,
        question: openQuestion,
        requiredBeforeFinalize: true,
        privacyHint:
          "Bitte nenne Ort, Bezirk oder Kommune nur so genau wie nötig. Private Wohnadressen werden nicht öffentlich übernommen.",
      }
    : null;
  const nextStepTitles = sortedSuggestions.map((suggestion) => suggestion.title).filter(Boolean);
  const followupStages = React.useMemo(
    () =>
      buildWorkflowStages({
        isConfirmed,
        hasSuggestions: sortedSuggestions.length > 0,
      }),
    [isConfirmed, sortedSuggestions.length],
  );
  const workspaceMetrics = React.useMemo(
    () => [
      {
        label: "Prioritäten",
        value: String(Math.max(1, Math.min(topicLabels.length, 3))),
        detail: "Was du zuerst schärfen solltest",
      },
      {
        label: "Themenäste",
        value: String(Math.max(1, structureBranches.length)),
        detail: "Sichtbar getrennte Anschlusslinien",
      },
      {
        label: "Offene Fragen",
        value: String(Math.max(1, voteQuestions.length)),
        detail: "Bleiben review-first sichtbar",
      },
      {
        label: "Nächster Schritt",
        value: plannerClarificationRequired
          ? "Thema selbst wählen"
          : showMultiTopicActionPanel
            ? "Hauptthema wählen"
            : isConfirmed
              ? "Entwurf speichern"
              : "Beitrag weiterentwickeln",
        detail: "Nur nach bewusster Entscheidung",
      },
    ],
    [
      isConfirmed,
      plannerClarificationRequired,
      showMultiTopicActionPanel,
      structureBranches.length,
      topicLabels.length,
      voteQuestions.length,
    ],
  );
  const [detailsOpen, setDetailsOpen] = React.useState(false);
  const [preparedHandoffDraft, setPreparedHandoffDraft] = React.useState<CreateHandoffDraft | null>(null);
  const [preparedReviewQueueItem, setPreparedReviewQueueItem] =
    React.useState<CreateHandoffReviewQueueItem | null>(null);
  const [reviewQueueRuntimeState, setReviewQueueRuntimeState] = React.useState<
    "idle" | "submitting" | "submitted" | "blocked" | "error"
  >("idle");
  const [reviewQueueRuntimeMessage, setReviewQueueRuntimeMessage] =
    React.useState<string | null>(null);

  const openCorrection = React.useCallback(
    (_focus: string) => {
      onEdit();
    },
    [onEdit],
  );

  React.useEffect(() => {
    setDetailsOpen(false);
  }, [resultChangeKey]);

  React.useEffect(() => {
    setPreparedHandoffDraft(null);
    setPreparedReviewQueueItem(null);
    setReviewQueueRuntimeState("idle");
    setReviewQueueRuntimeMessage(null);
  }, [resultChangeKey]);

  React.useEffect(() => {
    let cancelled = false;
    setExistingTopicMatchesRuntimeResult({
      status: "preview",
      blockers: [],
      usedSources: ["preview"],
      model: existingTopicMatchesPreview,
    });

    void resolveExistingTopicMatchesFromRuntime({ result }).then((resolved) => {
      if (cancelled) return;
      setExistingTopicMatchesRuntimeResult(resolved);
    }).catch(() => {
      if (cancelled) return;
      setExistingTopicMatchesRuntimeResult({
        status: "blocked",
        blockers: [],
        usedSources: [],
        model: existingTopicMatchesPreview,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [existingTopicMatchesPreview, result]);

  const prepareDialogHandoffDraft = React.useCallback(
    (target: DialogHandoffTarget) => {
      setPreparedReviewQueueItem(null);
      setReviewQueueRuntimeState("idle");
      setReviewQueueRuntimeMessage(null);
      setPreparedHandoffDraft(
        createHandoffDraftFromDialogOutcome(
          dialogOutcomePreview,
          mapDialogHandoffTargetToCreateHandoffDraftTarget(target),
        ),
      );
    },
    [dialogOutcomePreview],
  );

  const prepareDialogBranchDraft = React.useCallback(
    (branchId: string) => {
      const branch = dialogOutcomePreview.branches.find((entry) => entry.id === branchId);
      const baseDraft = createHandoffDraftFromDialogOutcome(
        dialogOutcomePreview,
        "existing_branch_connection",
      );

      setPreparedReviewQueueItem(null);
      setReviewQueueRuntimeState("idle");
      setReviewQueueRuntimeMessage(null);
      setPreparedHandoffDraft({
        ...baseDraft,
        title: branch
          ? `An bestehenden Zweig anknüpfen: ${branch.title}`
          : baseDraft.title,
        summary: branch?.reason ?? baseDraft.summary,
        selectedBranchIds: branch ? [branch.id] : [],
      });
    },
    [dialogOutcomePreview],
  );

  const prepareExistingMatchDraft = React.useCallback(
    (matchId: string, explicitTarget?: CreateHandoffDraftTarget) => {
      const match = existingTopicMatchesModel.matches.find((entry) => entry.id === matchId);
      if (!match) return;

      setPreparedReviewQueueItem(null);
      setReviewQueueRuntimeState("idle");
      setReviewQueueRuntimeMessage(null);
      setPreparedHandoffDraft(
        createHandoffDraftFromExistingTopicMatch(
          match,
          explicitTarget ?? resolveExistingTopicMatchDraftTarget(match),
        ),
      );
    },
    [existingTopicMatchesModel.matches],
  );

  const prepareNewBranchDraft = React.useCallback(() => {
    setPreparedReviewQueueItem(null);
    setReviewQueueRuntimeState("idle");
    setReviewQueueRuntimeMessage(null);
    setPreparedHandoffDraft(
      createHandoffDraftFromDialogOutcome(dialogOutcomePreview, "new_branch"),
    );
  }, [dialogOutcomePreview]);

  const prepareTopicDeduplicationDraft = React.useCallback(() => {
    if (!primaryTopicDeduplicationCandidate) return;
    setPreparedReviewQueueItem(null);
    setReviewQueueRuntimeState("idle");
    setReviewQueueRuntimeMessage(null);
    setPreparedHandoffDraft(
      createTopicDeduplicationReviewDraft(primaryTopicDeduplicationCandidate),
    );
  }, [primaryTopicDeduplicationCandidate]);

  const queuePreparedHandoffDraftForReview = React.useCallback(async () => {
    if (!preparedHandoffDraft) return;
    if (!canQueueHandoffDraftForReview(preparedHandoffDraft)) return;
    const localReviewQueueItem = createReviewQueueItemFromHandoffDraft(preparedHandoffDraft);
    setReviewQueueRuntimeState("submitting");
    setReviewQueueRuntimeMessage(null);

    const submission = await submitCreateHandoffReviewQueueItemToRuntime(
      localReviewQueueItem,
      {
        result,
        dossierId: handoffRuntimeDossierId ?? null,
        anlassraumId: handoffRuntimeAnlassraumId ?? null,
        sourceUrls: handoffRuntimeSourceUrls,
        materialItems: handoffRuntimeMaterialItems,
      },
    );

    if (submission.ok === true) {
      setPreparedReviewQueueItem(
        markReviewQueueItemSubmittedToRuntime(
          markReviewQueueItemQueued(localReviewQueueItem),
        ),
      );
      setReviewQueueRuntimeState("submitted");
      setReviewQueueRuntimeMessage(null);
      return;
    }

    setPreparedReviewQueueItem(null);
    setReviewQueueRuntimeState(submission.blocked ? "blocked" : "error");
    setReviewQueueRuntimeMessage(submission.message);
  }, [
    preparedHandoffDraft,
    result,
    handoffRuntimeDossierId,
    handoffRuntimeAnlassraumId,
    handoffRuntimeSourceUrls,
    handoffRuntimeMaterialItems,
  ]);

  return (
    <section
      data-create-embedded-followup={embedInWorkspaceShell ? "true" : undefined}
      className={`create-chat-workspace relative mx-auto min-w-0 max-w-full overflow-x-clip ${embedInWorkspaceShell ? "space-y-4" : "pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] md:pb-10"}`}
    >
      <div
        className={
          embedInWorkspaceShell
            ? "space-y-4"
            : "grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,22rem)] lg:gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,24rem)]"
        }
      >
        <div className="space-y-4">
          <div
            className={
              embedInWorkspaceShell
                ? "space-y-4"
                : "rounded-[28px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-4 py-4 shadow-[0_18px_42px_rgba(2,6,23,0.06)] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
            }
          >
            {!embedInWorkspaceShell ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <VoxyAvatar appearance="inline" compact variant="miniAvatar" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                        Dein KI-Assistent
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">
                        {plannerClarificationRequired
                          ? plannerTechnicalFallback
                            ? "Automatische Einordnung nicht abgeschlossen"
                            : CREATE_VISUAL_FOLLOWUP_COPY.headlineNeedsClarification
                          : plannerUsesProvisionalStructure
                            ? CREATE_VISUAL_FOLLOWUP_COPY.headlineProvisional
                            : "Chat-Arbeitsstand für deinen Beitrag"}
                      </p>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))]">
                        {plannerClarificationRequired
                          ? plannerClarificationReason
                          : "Ich halte Eingabe, Themenzweige, Fragen und nächste Schritte in einem gemeinsamen Workspace zusammen."}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-cyan-300/35 bg-cyan-500/[0.08] px-3 py-1 text-[11px] font-semibold text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-500/[0.12] dark:text-cyan-100">
                    Noch nicht veröffentlicht
                  </span>
                </div>

                {actionNotice ? (
                  <p className="mt-3 rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.08] px-3 py-2 text-xs leading-relaxed text-cyan-950 dark:border-cyan-300/25 dark:bg-cyan-500/12 dark:text-cyan-100">
                    {actionNotice}
                  </p>
                ) : null}

                <div className="mt-4 space-y-4">
                  <WorkspaceStageRail stages={followupStages} />
                  <WorkspaceMetricRail items={workspaceMetrics} />
                </div>
              </>
            ) : null}

            <div
              data-create-chat-thread
              className={`create-chat-spine relative min-w-0 space-y-5 before:absolute before:left-[27px] before:top-8 before:h-[calc(100%-3rem)] before:w-px before:bg-slate-200 dark:before:bg-[rgb(var(--border))] ${embedInWorkspaceShell ? "" : "mt-5"}`}
            >
              <UserContributionBubble text={dedupedCopy.userBubbleText} />
              <AssistantUnderstandingBubble
                eyebrow={plannerClarificationRequired ? "Einordnung offen" : "Verstanden"}
                headline={
                  plannerClarificationRequired
                    ? CREATE_VISUAL_FOLLOWUP_COPY.headlineNeedsClarification
                    : CREATE_VISUAL_FOLLOWUP_COPY.headline
                }
                summary={plannerClarificationRequired ? plannerClarificationLeadText : dedupedCopy.prominentSummary}
                assistantLead={assistantLead}
                coreClaim={dedupedCopy.prominentCoreClaim}
                showCoreBlock={showCoreBlock && !plannerClarificationRequired}
                showAssistantLead={showAssistantLeadText && !plannerClarificationRequired}
                stanceLabel={resolveStanceLead(dominantStance)}
                scopeLabel={resolveScopeLabel(scopeChip)}
              >
                {plannerUsesProvisionalStructure ? (
                  <p className="mt-3 text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                    {plannerProvisionalNotice}
                  </p>
                ) : null}
                {plannerClarificationRequired ? (
                  <div className="mt-4 space-y-3">
                    <SecondaryFollowupNote>{plannerClarificationDetails ?? "Du kannst jetzt selbst wählen, wie du weitermachen willst."}</SecondaryFollowupNote>
                    {degradedStartPoints.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {degradedStartPoints.map((label) => (
                          <span
                            key={`degraded-start-${label}`}
                            className="rounded-full border border-amber-400/30 bg-amber-500/[0.12] px-2.5 py-1 text-xs text-amber-950 dark:border-amber-300/30 dark:bg-amber-500/[0.14] dark:text-amber-50"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    <TopicBranchPreviewGrid rootTopic={rootTopic} branches={structureBranches} />
                    <OpenQuestionCards questions={voteQuestions} />
                    <SourceHintsAndNextStepsGrid modules={contentModules} nextStepTitles={nextStepTitles} />
                  </div>
                )}
              </AssistantUnderstandingBubble>
            </div>

            {!isConfirmed && !placeClarification && !plannerClarificationRequired ? (
              <div className="mt-4">
                <StructureProposalPanel
                  onConfirm={onConfirm}
                  onEdit={() => openCorrection("Thema")}
                  onStartOptionalService={onStartOptionalService}
                  onPrepareSubmission={onPrepareSubmission}
                  onRequestEditorialReview={onRequestEditorialReview}
                  reviewRequestState={reviewRequestState}
                  reviewRequestMessage={reviewRequestMessage}
                />
              </div>
            ) : null}
            {!isConfirmed && !placeClarification && plannerClarificationRequired ? (
              <div className="mt-4">
                <PlannerClarificationPanel
                  reason={plannerClarificationReason}
                  details={plannerClarificationDetails}
                  startPoints={degradedStartPoints}
                  technicalFallback={plannerTechnicalFallback}
                  onRetryPlanner={onRetryPlanner}
                  isRetryPlannerPending={isRetryPlannerPending}
                  onEdit={() => openCorrection("Thema")}
                  onPrepareSubmission={onPrepareSubmission}
                  onPrepareAnlassraum={onPrepareAnlassraum}
                  reviewRequestState={reviewRequestState}
                  reviewRequestMessage={reviewRequestMessage}
                />
              </div>
            ) : null}
          </div>

          {placeClarification ? (
            <PlaceClarificationPanel
              question={placeClarification.question}
              privacyHint={placeClarification.privacyHint}
              value={continuationValue}
              onChange={onContinuationChange}
              onSubmit={onContinueConversation}
              onSkip={onSkipPlaceClarification}
              submitDisabled={continueConversationDisabled}
            />
          ) : null}

          {isConfirmed && !plannerClarificationRequired ? (
            <NextStepPanel
              multiTopicActionTopics={multiTopicActionTopics}
              showMultiTopicActionPanel={showMultiTopicActionPanel}
              onDeepenAllTopics={onDeepenAllTopics}
              onDeepenTopic={onDeepenTopic}
              onContinueInAccount={onContinueInAccount}
              onPrepareSubmission={onPrepareSubmission}
              onPrepareAnlassraum={onPrepareAnlassraum}
              onOpenDossierAppend={onOpenDossierAppend}
              onOpenDossierCreate={onOpenDossierCreate}
              onPrepareVote={onPrepareVote}
              onRequestEditorialReview={onRequestEditorialReview}
              onStartOptionalService={onStartOptionalService}
              onSaveOnly={onSaveOnly}
              reviewRequestState={reviewRequestState}
              reviewRequestMessage={reviewRequestMessage}
              factcheckMessage={factcheckMessage}
            />
          ) : null}

          {showCorrectionComposer && !placeClarification && !embedInWorkspaceShell ? (
            <ContinueWritingComposer
              value={continuationValue}
              onChange={onContinuationChange}
              onSubmit={onContinueConversation}
              submitDisabled={continueConversationDisabled}
            />
          ) : null}

          <div className="rounded-[24px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[rgb(var(--fg))]"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((current) => !current)}
            >
              <span>Details ansehen</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${detailsOpen ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M7 4.5 13 10l-6 5.5" />
              </svg>
            </button>
            {detailsOpen ? (
              <div className="mt-4 space-y-4">
                {plannerClarificationRequired ? (
                  <div className="rounded-[24px] border border-amber-300/30 bg-amber-500/[0.08] px-4 py-4 text-sm leading-relaxed text-amber-950 dark:border-amber-300/20 dark:bg-amber-500/[0.1] dark:text-amber-50">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-900 dark:text-amber-100">
                      {plannerTechnicalFallback ? "Vorläufige Einordnung" : "Einordnung offen"}
                    </p>
                    <p className="mt-1 text-base font-semibold">Warum wir hier noch nicht weiter automatisieren</p>
                    <p className="mt-2">
                      Wir zeigen hier bewusst keine normale Struktur mit Kern, Thema und Anschlüssen, solange die
                      automatische Einordnung noch nicht belastbar genug ist.
                    </p>
                    {plannerClarificationDetails ? <p className="mt-2">{plannerClarificationDetails}</p> : null}
                    {degradedStartPoints.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {degradedStartPoints.map((label) => (
                          <span
                            key={`degraded-detail-start-${label}`}
                            className="rounded-full border border-amber-400/30 bg-amber-500/[0.12] px-2.5 py-1 text-xs text-amber-950 dark:border-amber-300/30 dark:bg-amber-500/[0.14] dark:text-amber-50"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <StructuredWorkstateBlock
                    rootTopic={rootTopic}
                    topicLabels={topicLabels}
                    positionClusters={positionClusters}
                    voteQuestions={voteQuestions}
                    keyStatement={dedupedCopy.prominentCoreClaim}
                    structureBranches={structureBranches}
                    sortedSuggestions={sortedSuggestions}
                    isConfirmed={isConfirmed}
                    onEdit={openCorrection}
                    resultChangeKey={resultChangeKey}
                    sections={sections}
                    modules={contentModules}
                  />
                )}
                <div className="space-y-3">
                  <div
                    className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-3 dark:border-[rgb(var(--border))]"
                    data-dialog-runtime-status={dialogIntelligenceUiSource.kind}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
                      Dialog Intelligence
                    </p>
                    <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">
                      {dialogIntelligenceUiSource.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                      {dialogIntelligenceUiSource.detail}
                    </p>
                  </div>

                  <DialogResultsHandoffPanel
                    outcome={dialogOutcomePreview}
                    onConfirmStandpoint={onConfirm}
                    onSelectHandoff={prepareDialogHandoffDraft}
                    onSelectBranch={prepareDialogBranchDraft}
                  />
                </div>

                <div className="mt-4">
                  <ExistingTopicMatchesPanel
                    model={existingTopicMatchesModel}
                    onSelectMatch={(matchId) => prepareExistingMatchDraft(matchId)}
                    onCountSimilarOpinion={(matchId) =>
                      prepareExistingMatchDraft(matchId, "opinion_count")
                    }
                    onPrepareReview={(matchId) => prepareExistingMatchDraft(matchId)}
                    onStartNewBranch={prepareNewBranchDraft}
                  />
                </div>

                {primaryTopicDeduplicationCandidate ? (
                  <div className="mt-4 rounded-[24px] border border-amber-300/35 bg-amber-500/[0.08] px-4 py-4 text-sm dark:border-amber-300/20 dark:bg-amber-500/[0.1]">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-950 dark:text-amber-100">
                      Mögliche Dopplung erkannt
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">
                      {primaryTopicDeduplicationCandidate.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
                      Ähnliche Beiträge können redaktionell zusammengeführt oder getrennt gehalten werden.
                      Es wurde noch nichts automatisch zusammengeführt.
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                      {primaryTopicDeduplicationCandidate.summary}
                    </p>
                    {primaryTopicDeduplicationState ? (
                      <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                        {primaryTopicDeduplicationState}
                      </p>
                    ) : null}
                    {primaryTopicGraphMutationState ? (
                      <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
                        {primaryTopicGraphMutationState}
                      </p>
                    ) : null}
                    {canQueueTopicDeduplicationReview(primaryTopicDeduplicationCandidate) ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={prepareTopicDeduplicationDraft}
                          className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/[0.14] px-3 py-1.5 text-xs font-medium text-amber-950 transition hover:bg-amber-500/[0.2] dark:border-amber-300/30 dark:bg-amber-500/[0.18] dark:text-amber-50"
                        >
                          Mögliche Zusammenführung prüfen
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {preparedHandoffDraft ? (
                  <div className="mt-4">
                    <CreateHandoffDraftSummary
                      draft={preparedHandoffDraft}
                      reviewQueueItem={preparedReviewQueueItem}
                      onQueueForReview={queuePreparedHandoffDraftForReview}
                      runtimeSubmissionState={reviewQueueRuntimeState}
                      runtimeSubmissionMessage={reviewQueueRuntimeMessage}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

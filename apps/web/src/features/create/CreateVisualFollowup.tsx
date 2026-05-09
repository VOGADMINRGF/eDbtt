"use client";

import * as React from "react";
import Link from "next/link";
import {
  buildCreateVisualMap,
  buildCreateVisualSections,
  buildCreateStructureBranches,
  dedupeCreateFollowupSections,
  deriveDominantUnderstandingStance,
  type CreateConnectionSuggestion,
  type CreateIntelligentFollowupResult,
  type CreateStructureBranch,
  type CreateVisualNode,
} from "@/features/create/intelligentFollowupContract";
import {
  buildCreateFollowupPrimaryCtaHref,
  buildCreateFollowupTargetHref,
} from "@/features/create/followupTargetHref";

type CreateVisualFollowupProps = {
  result: CreateIntelligentFollowupResult;
  ctaHref: string;
  actionNotice?: string | null;
  isConfirmed?: boolean;
  saveState?: "idle" | "saving" | "saved" | "error" | "unavailable";
  saveMessage?: string | null;
  factcheckMessage?: string | null;
  onConfirm: () => void;
  onEdit: () => void;
  onOpenNewAnlassraum: () => void;
  onSaveForLater?: () => void;
  onStartOptionalService?: () => void;
  continuationValue: string;
  onContinuationChange: (value: string) => void;
  onContinueConversation: () => void;
  continueConversationDisabled?: boolean;
};

export const CREATE_VISUAL_FOLLOWUP_COPY = {
  headline: "So würde eDebatte deinen Beitrag einordnen",
  structureTitle: "Ich ordne das kurz ein",
  coreTitle: "Kern erkannt",
  graphTitle: "So könnte der Arbeitsstand aussehen",
  overviewTitle: "Deine Struktur auf einen Blick",
  impactTitle: "Was ich nach deiner Bestätigung vorbereiten kann",
  confirmTitle: "Soll ich das so übernehmen?",
  guardrail:
    "Keine automatische Stimme. Keine automatische Veröffentlichung. Du bestätigst jeden nächsten Schritt selbst.",
  freeWriteHint: "Schreib einfach weiter. eDebatte passt den Arbeitsstand an, wenn etwas anders gemeint war.",
  pendingPreparationHint:
    "Nach deiner Bestätigung kann eDebatte passende Themen, Abstimmungen oder einen neuen Arbeitsstand vorbereiten.",
} as const;

type FocusAreaId = "priorities" | "clusters" | "questions" | "next_steps";

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

function resolveSuggestionCta(kind: CreateConnectionSuggestion["kind"]): string {
  if (kind === "dossier") return "Ansehen";
  if (kind === "vote") return "Abstimmungen ansehen";
  if (kind === "anlassraum") return "Ansehen";
  if (kind === "new_anlassraum") return "Vorschlagen";
  return "Ansehen";
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
        : "Beitrag einreichen";

  return [
    {
      id: "confirm",
      label: "Struktur übernehmen",
      detail: "Der vorgeschlagene Arbeitsstand bleibt reviewbar und unveröffentlicht.",
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
}): string {
  if (params.dossierContext === "Kommunale Prioritäten und Zielkonflikte") {
    return "Ich sehe einen breiten kommunalen Prioritätenkonflikt. Es geht nicht um ein einzelnes Thema, sondern um mehrere Zielkonflikte, die zusammen priorisiert werden müssen.";
  }
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (
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
}): string {
  if (params.dossierContext === "Kommunale Prioritäten und Zielkonflikte") {
    return "Du beschreibst mehrere kommunale Zielkonflikte, die gemeinsam priorisiert und nachvollziehbar abgewogen werden sollen.";
  }
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (lowered.includes("amtsträger") && lowered.includes("qualifikation") && lowered.includes("sanktionen")) {
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
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Du</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">Dein Beitrag wurde aufgenommen.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-slate-700 dark:text-[rgb(var(--muted))]">Original oben anzeigen</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--fg))]">
              {props.text}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

function AssistantUnderstandingBubble(props: {
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
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-600 ring-4 ring-white dark:bg-cyan-300 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-5xl flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-[rgb(var(--muted))]">eDebatte</p>
        <div className="mt-2 rounded-2xl rounded-tl-sm border border-cyan-500/25 bg-white px-4 py-4 shadow-sm md:px-5 md:py-5 dark:border-cyan-300/30 dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.structureTitle}</p>
          <p className="mt-1 text-base font-semibold text-cyan-950 md:text-lg dark:text-cyan-50">{CREATE_VISUAL_FOLLOWUP_COPY.headline}</p>
          <p className="mt-3 text-base text-cyan-900 md:text-lg dark:text-cyan-100">{props.summary || props.assistantLead}</p>
          {props.showAssistantLead ? (
            <p className="mt-2 text-sm text-cyan-900/85 dark:text-cyan-100/85">{props.assistantLead}</p>
          ) : null}
          {props.showCoreBlock ? (
            <div className="mt-4 border-l-2 border-cyan-500/45 pl-3 dark:border-cyan-300/50">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.coreTitle}</p>
              <p className="mt-1 text-base font-semibold text-cyan-950 md:text-xl dark:text-cyan-50">{props.coreClaim}</p>
            </div>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
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
      className="rounded-[28px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-sm shadow-slate-950/5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none"
    >
      <div className="rounded-[24px] border border-cyan-200/70 bg-gradient-to-br from-cyan-50 via-white to-sky-50 px-3 py-3 dark:border-cyan-300/25 dark:from-cyan-500/12 dark:via-[rgb(var(--card))] dark:to-sky-500/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">Focus Card</p>
            <p className="mt-1 text-lg font-semibold text-cyan-950 md:text-xl dark:text-cyan-50">{props.branch.title}</p>
          </div>
          <span className="rounded-full border border-cyan-300/70 bg-white/80 px-2.5 py-1 text-xs font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">
            {statusLabel}
          </span>
        </div>
        {visibleTopicTags.length ? (
          <p className="mt-2 text-sm text-cyan-900/90 dark:text-cyan-100/90">
            Schwerpunkt: {toSentenceList(visibleTopicTags)}
          </p>
        ) : null}
        {visiblePositionClusters.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
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
        <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 px-3 py-3 dark:border-white/10 dark:bg-[rgb(var(--card))]/65">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">Knapper Bedarf</p>
          <p className="mt-2 text-sm leading-relaxed text-cyan-950 dark:text-cyan-50">{showNeedBlock ? props.branch.need : primaryClaim}</p>
        </div>
        <div className="mt-3 rounded-2xl border border-cyan-200/70 bg-cyan-100/70 px-3 py-3 dark:border-cyan-300/25 dark:bg-cyan-500/12">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">Wichtigste Frage</p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-cyan-950 dark:text-cyan-50">{primaryQuestion}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {props.branch.part06CategoryLabels.map((label) => (
          <span
            key={`${props.branch.id}-part06-${label}`}
            className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("dossier")}`}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Wichtige Abstimmungsfragen</p>
          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[rgb(var(--fg))]">
            {visibleVoteQuestions.map((question) => (
              <li
                key={`${props.branch.id}-question-${question}`}
                className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-2 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
              >
                {question}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <details className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
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
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">Änderungsvorschläge werden reviewbar vorbereitet.</p>
      </details>
      <details className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
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
            <details className="rounded-lg border border-[rgb(var(--border))] bg-white/80 px-3 py-2 dark:bg-[rgb(var(--card))]">
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
}) {
  const [activeBranchId, setActiveBranchId] = React.useState<string | null>(props.branches[0]?.id ?? null);

  React.useEffect(() => {
    if (!props.branches.some((branch) => branch.id === activeBranchId)) {
      setActiveBranchId(props.branches[0]?.id ?? null);
    }
  }, [activeBranchId, props.branches]);

  if (props.branches.length === 0) return null;
  const activeBranch =
    props.branches.find((branch) => branch.id === activeBranchId) ?? props.branches[0] ?? null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Strukturäste</p>
        <p className="text-xs text-[rgb(var(--muted))]">Mobile-first als swipebare Focus Cards</p>
      </div>
      <div
        data-focus-card-rail
        className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2"
      >
        {props.branches.map((branch) => (
          <button
            key={branch.id}
            data-focus-card-branch-selector
            type="button"
            onClick={() => setActiveBranchId(branch.id)}
            aria-pressed={activeBranch?.id === branch.id}
            className={`min-w-[248px] snap-start rounded-[24px] border px-4 py-4 text-left transition ${
              activeBranch?.id === branch.id
                ? "border-cyan-400/70 bg-cyan-50 shadow-sm shadow-cyan-950/5 dark:border-cyan-300/45 dark:bg-cyan-500/12"
                : "border-slate-200/80 bg-white/85 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/60 bg-white/80 dark:border-cyan-300/30 dark:bg-cyan-500/10">
                  <FocusAreaIcon area="branch" active={activeBranch?.id === branch.id} />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:text-[rgb(var(--muted))]">Focus Card</p>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{branch.title}</p>
                </div>
              </div>
              <span className="rounded-full border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                {Math.max(1, branch.topicTags.length)} Schwerpunkte
              </span>
            </div>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[rgb(var(--fg))]">{branch.need}</p>
            <p className="mt-3 text-xs font-medium text-slate-700 dark:text-slate-200">Leitfrage: {branch.voteQuestions[0] ?? "Frage wird vorbereitet."}</p>
            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
              {branch.voteQuestions.length} Fragen · {branch.openReviewPoints.length} Prüfpunkte
            </p>
          </button>
        ))}
      </div>
      {activeBranch ? <StructureBranchCard branch={activeBranch} onEdit={props.onEdit} /> : null}
    </div>
  );
}

function StructureOverviewRail(props: {
  cards: FocusOverviewCard[];
  activeCardId: FocusAreaId;
  onSelect: (id: FocusAreaId) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {CREATE_VISUAL_FOLLOWUP_COPY.overviewTitle}
      </p>
      <div
        data-focus-card-overview
        className="mt-3 flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 xl:grid-cols-4"
      >
        {props.cards.map((card) => {
          const isActive = props.activeCardId === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => props.onSelect(card.id)}
              aria-pressed={isActive}
              className={`min-w-[220px] snap-start rounded-[24px] border px-4 py-4 text-left transition ${
                isActive
                  ? "border-cyan-400/70 bg-cyan-50 shadow-sm shadow-cyan-950/5 dark:border-cyan-300/45 dark:bg-cyan-500/12"
                  : "border-slate-200/80 bg-white/85 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-300/60 bg-white/80 dark:border-cyan-300/30 dark:bg-cyan-500/10">
                  <FocusAreaIcon area={card.id} active={isActive} />
                </span>
                <span className="rounded-full border border-slate-200/80 px-2 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                  {card.status}
                </span>
              </div>
              <p className="mt-3 text-base font-semibold text-[rgb(var(--fg))]">{card.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{card.lead}</p>
            </button>
          );
        })}
      </div>
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
                ? "border-emerald-300/60 bg-emerald-50/80 dark:border-emerald-300/30 dark:bg-emerald-500/10"
                : "border-slate-200/80 bg-white/85 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
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
}) {
  const initialFocusArea: FocusAreaId = props.structureBranches.length > 0 ? "clusters" : "priorities";
  const [activeFocusArea, setActiveFocusArea] = React.useState<FocusAreaId>(initialFocusArea);
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
          lead: props.keyStatement,
          status: `${Math.max(1, Math.min(props.topicLabels.length, 3))} Prioritäten`,
        },
        {
          id: "clusters",
          title: "Themencluster",
          lead: props.structureBranches[0]?.title ?? props.rootTopic,
          status: `${Math.max(1, props.structureBranches.length || 1)} Themencluster`,
        },
        {
          id: "questions",
          title: "Fragen & Abstimmung",
          lead: props.voteQuestions[0] ?? "Leitfragen werden im nächsten Schritt vorbereitet.",
          status: `${Math.max(1, props.voteQuestions.length)} Fragen`,
        },
        {
          id: "next_steps",
          title: "Nächste Schritte",
          lead: checklist[0]?.label ?? "Struktur übernehmen",
          status: `${doneChecklistCount}/${checklist.length} erledigt`,
        },
      ];
    },
    [
      props.isConfirmed,
      props.keyStatement,
      props.rootTopic,
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

  return (
    <div className="mt-5 space-y-5 border-t border-slate-200 pt-5 dark:border-[rgb(var(--border))]">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">Vorgeschlagener Arbeitsstand</p>
        <p className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
          {CREATE_VISUAL_FOLLOWUP_COPY.graphTitle}
        </p>
      </div>

      <StructureOverviewRail cards={overviewCards} activeCardId={activeFocusArea} onSelect={setActiveFocusArea} />

      <div className="rounded-[28px] border border-slate-200/80 bg-white/95 px-4 py-4 shadow-sm shadow-slate-950/5 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        {activeFocusArea === "priorities" ? (
          <div className="space-y-4">
            <div className={`rounded-2xl border px-4 py-3 ${resolveNodeTone("topic")}`}>
              <p className="text-sm font-semibold">Übergeordnetes Thema</p>
              <p className="mt-1 text-base font-semibold">{props.rootTopic}</p>
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${resolveNodeTone("statement")}`}>
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
          </div>
        ) : null}

        {activeFocusArea === "clusters" ? (
          props.structureBranches.length > 0 ? (
            <StructureBranchList branches={props.structureBranches} onEdit={props.onEdit} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Themencluster</p>
              <p className="text-sm text-[rgb(var(--muted))]">Für diesen Beitrag reicht zunächst ein kompakter Themenfokus statt mehrerer Cluster.</p>
              <TopicFieldList labels={props.topicLabels.slice(0, 6)} onPick={props.onEdit} />
            </div>
          )
        ) : null}

        {activeFocusArea === "questions" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-fuchsia-200/70 bg-fuchsia-50/70 px-4 py-3 dark:border-fuchsia-300/25 dark:bg-fuchsia-500/10">
              <p className="text-sm font-semibold text-fuchsia-950 dark:text-fuchsia-50">Fragen & Abstimmung</p>
              <p className="mt-2 text-sm leading-relaxed text-fuchsia-900 dark:text-fuchsia-100">
                Diese Leitfragen bleiben sichtbar, aber erst nach deiner Bestätigung werden sie weiter vorbereitet.
              </p>
            </div>
            <VoteQuestionList questions={props.voteQuestions} />
          </div>
        ) : null}

        {activeFocusArea === "next_steps" ? (
          <div className="space-y-4">
            <NextStepChecklist items={checklistItems} />
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs leading-relaxed text-[rgb(var(--muted))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
              Guardrails bleiben kompakt sichtbar: keine automatische Stimme, keine automatische Veröffentlichung, keine automatische Kostenbuchung.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FollowupActionRail(props: {
  onConfirm: () => void;
  onStartOptionalService: () => void;
  onSaveForLater: () => void;
  setCorrectionOpen: (focus: string) => void;
  showCorrectionRow: boolean;
  correctionFocus: string | null;
  saveState: "idle" | "saving" | "saved" | "error" | "unavailable";
  saveMessage?: string | null;
  factcheckMessage?: string | null;
}) {
  const saveDisabled = props.saveState === "saving" || props.saveState === "unavailable";
  const saveLabel =
    props.saveState === "saving"
      ? "Arbeitsstand wird gespeichert …"
      : "Arbeitsstand speichern";

  return (
    <div className="create-chat-message flex gap-3">
      <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600 ring-4 ring-white dark:bg-emerald-300 dark:ring-[rgb(var(--bg))]" />
      <div className="max-w-5xl flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-[rgb(var(--muted))]">Nächster Schritt</p>
        <div className="mt-2 space-y-4 rounded-2xl rounded-tl-sm border border-emerald-200/70 bg-white px-4 py-4 shadow-sm dark:border-emerald-300/20 dark:bg-[rgb(var(--card))] dark:shadow-none">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
            <p className="max-w-3xl text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
              Bestätige den Vorschlag, ändere einzelne Punkte oder schreib einfach weiter.
            </p>
            <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">{CREATE_VISUAL_FOLLOWUP_COPY.freeWriteHint}</p>
          </div>
          <button type="button" className="btn-primary min-h-[48px] w-full px-4 py-3 text-sm md:text-base" onClick={props.onConfirm}>
            Ja, Struktur übernehmen
          </button>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={() => props.setCorrectionOpen("Thema")}>
              Ändern
            </button>
            <button
              type="button"
              className="btn-secondary min-h-[40px] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              onClick={props.onSaveForLater}
              disabled={saveDisabled}
              aria-disabled={saveDisabled}
            >
              {saveLabel}
            </button>
            <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={props.onStartOptionalService}>
              Faktencheck / Deep Search starten
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <span className="rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-1 dark:border-emerald-300/25 dark:bg-emerald-500/10">
              Primär: Struktur übernehmen
            </span>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 dark:border-[rgb(var(--border))]">
              Optional: Faktencheck / Deep Search
            </span>
          </div>
          <div className="grid gap-2 text-xs text-[rgb(var(--muted))] md:grid-cols-2">
            <p>{props.saveMessage ?? "Arbeitsstand speichern ist in diesem Schritt verfügbar."}</p>
            <p>{props.factcheckMessage ?? "Optional. Startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."}</p>
          </div>
          {props.showCorrectionRow ? (
            <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3">
              <p className="text-sm text-[rgb(var(--fg))]">
                Was soll anders eingeordnet werden{props.correctionFocus ? `: ${props.correctionFocus}` : ""}?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[
                  "Thema ändern",
                  "Haltung ändern",
                  "Ebene ändern",
                  "Nächsten Schritt ändern",
                  "Aussage fehlt",
                  "Abstimmungsfrage bearbeiten",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--fg))] hover:border-cyan-300/60"
                    onClick={() => props.setCorrectionOpen(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">Änderungsvorschläge werden im nächsten Schritt reviewbar gespeichert.</p>
            </div>
          ) : null}
          <div className="space-y-1 text-xs text-[rgb(var(--muted))]">
            <p>Keine automatische Stimme.</p>
            <p>Keine automatische Veröffentlichung.</p>
            <p>Keine automatische Kostenbuchung.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsAccordion(props: {
  result: CreateIntelligentFollowupResult;
  sections: ReturnType<typeof buildCreateVisualSections>;
  sortedSuggestions: CreateConnectionSuggestion[];
  isConfirmed: boolean;
}) {
  const showSectionFlow = props.result.sourceText.length > 500 || props.sections.length > 1;
  const hasFutureModules = false;

  return (
    <div className="max-w-4xl space-y-2 pl-5 md:pl-8 lg:pl-10">
      {showSectionFlow ? (
        <details className="border-t border-slate-200 py-3 dark:border-[rgb(var(--border))]">
          <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
            Gelesene Sinnabschnitte ({props.sections.length})
          </summary>
          <div className="mt-3 space-y-2">
            {props.sections.map((section) => (
              <details
                key={section.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
              >
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
                  {section.label}
                </summary>
                <p className="mt-2 text-sm text-[rgb(var(--fg))] md:text-base"><span className="font-semibold">Du sagst:</span> {section.sourceText}</p>
                {section.statementLabel ? (
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Erkannt als:</span> {section.statementLabel}</p>
                ) : null}
                {section.topicLabel ? (
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Gehört zu:</span> {section.topicLabel}</p>
                ) : null}
                {section.connectionLabel ? (
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Passender nächster Schritt:</span> {section.connectionLabel}</p>
                ) : null}
              </details>
            ))}
          </div>
        </details>
      ) : null}

      <details className="border-t border-slate-200 py-3 dark:border-[rgb(var(--border))]">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
          {CREATE_VISUAL_FOLLOWUP_COPY.impactTitle}
        </summary>
        {!props.isConfirmed ? (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm text-[rgb(var(--fg))] dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
            <p>{CREATE_VISUAL_FOLLOWUP_COPY.pendingPreparationHint}</p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">Wird erst nach deiner Bestätigung vorbereitet.</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-3">
            {props.sortedSuggestions.map((suggestion) => {
              const toneKind: CreateVisualNode["kind"] =
                suggestion.kind === "dossier"
                  ? "dossier"
                  : suggestion.kind === "vote"
                    ? "vote"
                    : suggestion.kind === "anlassraum"
                      ? "anlassraum"
                      : suggestion.kind === "new_anlassraum"
                        ? "new_anlassraum"
                        : "topic";
              return (
                <article key={suggestion.id} className={`rounded-xl border px-3 py-3 ${resolveNodeTone(toneKind)}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">{resolveSuggestionBadge(suggestion.kind)}</p>
                  <p className="mt-1 text-sm font-semibold md:text-base">{suggestion.title}</p>
                  <p className="mt-1 text-sm opacity-85">Warum passt das? {suggestion.reason}</p>
                  <p className="mt-3 text-xs opacity-80">
                    {suggestion.kind === "new_anlassraum"
                      ? "Wird jetzt nur als nächster Schritt vorgemerkt."
                      : `Kann jetzt unter ${resolveSuggestionCta(suggestion.kind)} geöffnet werden.`}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </details>

      {hasFutureModules ? (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-[rgb(var(--muted))] shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
          Erweiterbare Module: Quellen, Statistik, Artikel, Video, Faktencheck.
        </div>
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
      <div className="max-w-5xl flex-1 rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Schreib einfach weiter</p>
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
  ctaHref,
  actionNotice,
  isConfirmed = false,
  saveState = "unavailable",
  saveMessage = null,
  factcheckMessage = null,
  onConfirm,
  onEdit,
  onSaveForLater = () => {},
  onStartOptionalService = () => {},
  continuationValue,
  onContinuationChange,
  onContinueConversation,
  continueConversationDisabled = false,
}: CreateVisualFollowupProps) {
  const visualMap = React.useMemo(() => buildCreateVisualMap(result), [result]);
  const sections = React.useMemo(() => buildCreateVisualSections(result, 4), [result]);
  const [showCorrectionRow, setShowCorrectionRow] = React.useState(false);
  const [correctionFocus, setCorrectionFocus] = React.useState<string | null>(null);

  const topicLabels = result.understanding.topics.map((topic) => topic.label);
  const broadTopicFields = React.useMemo(() => deriveBroadTopicFields(topicLabels), [topicLabels]);
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const statementNodes = visualMap.nodes.filter((node) => node.kind === "statement").slice(0, 4);
  const sortedSuggestions = sortSuggestions(result.suggestions)
    .filter((suggestion) => suggestion.kind !== "topic")
    .slice(0, 4);
  const structureBranches = React.useMemo(() => buildCreateStructureBranches(result, 3), [result]);
  const voteSuggestion = sortedSuggestions.find((suggestion) => suggestion.kind === "vote");
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
  const assistantLead = resolveAssistantLead({
    topicLabels,
    summary: result.understanding.summary,
    statementText: result.understanding.statements[0]?.text ?? "",
    dossierContext: result.understanding.dossierContext,
  });
  const positionClusters = React.useMemo(() => derivePositionClusters(result), [result]);
  const keyStatement = resolveCoreClaim({
    topicLabels,
    fallback: statementNodes[0]?.label ?? result.understanding.summary,
    dossierContext: result.understanding.dossierContext,
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
  const primaryActionHref = buildCreateFollowupPrimaryCtaHref({
    ctaHref,
    topics: result.understanding.topics,
    statements: result.understanding.statements,
    suggestions: sortedSuggestions,
  });
  const voteActionHref = voteSuggestion
    ? buildCreateFollowupTargetHref({
        kind: "vote",
        ctaHref,
        topics: result.understanding.topics,
        statements: result.understanding.statements,
        suggestionTitle: voteSuggestion.title,
        suggestionHref: voteSuggestion.href ?? null,
      })
    : primaryActionHref;

  const openCorrection = React.useCallback(
    (focus: string) => {
      setCorrectionFocus(focus);
      setShowCorrectionRow(true);
      onEdit();
    },
    [onEdit],
  );

  return (
    <section className="create-chat-workspace relative -mt-3 mx-auto max-w-6xl pb-24 md:pb-10">
      <div className="create-chat-spine relative space-y-5 before:absolute before:left-[5px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-slate-200 md:space-y-6 dark:before:bg-[rgb(var(--border))]">
      <UserContributionBubble text={dedupedCopy.userBubbleText} />

      <AssistantUnderstandingBubble
        summary={dedupedCopy.prominentSummary}
        assistantLead={assistantLead}
        coreClaim={dedupedCopy.prominentCoreClaim}
        showCoreBlock={showCoreBlock}
        showAssistantLead={showAssistantLeadText}
        stanceLabel={resolveStanceLead(dominantStance)}
        scopeLabel={resolveScopeLabel(scopeChip)}
      >
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
        />
      </AssistantUnderstandingBubble>

      <FollowupActionRail
        onConfirm={onConfirm}
        onStartOptionalService={onStartOptionalService}
        onSaveForLater={onSaveForLater}
        setCorrectionOpen={openCorrection}
        showCorrectionRow={showCorrectionRow}
        correctionFocus={correctionFocus}
        saveState={saveState}
        saveMessage={saveMessage}
        factcheckMessage={factcheckMessage}
      />

      {isConfirmed ? (
        <div className="create-chat-message flex gap-3">
          <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-600 ring-4 ring-white dark:bg-emerald-300 dark:ring-[rgb(var(--bg))]" />
          <div className="max-w-4xl flex-1 rounded-2xl rounded-tl-sm border border-emerald-300/45 bg-emerald-50 px-4 py-3 dark:border-emerald-300/35 dark:bg-emerald-500/10">
            <p className="text-sm text-emerald-900 dark:text-emerald-100">
              Einordnung bestätigt. Dein Beitrag ist noch nicht veröffentlicht. Wähle jetzt den nächsten Schritt.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={primaryActionHref} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                Thema öffnen
              </Link>
              {voteSuggestion ? (
              <Link
                  href={voteActionHref}
                  className="btn-secondary min-h-[40px] px-3 py-2 text-sm"
                >
                  Aussagen / Abstimmungen prüfen
                </Link>
              ) : (
                <Link href={primaryActionHref} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                  Abstimmungsfragen prüfen
                </Link>
              )}
              <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={onStartOptionalService}>
                Faktencheck / Deep Search starten
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[40px] px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onSaveForLater}
                disabled={saveState === "saving" || saveState === "unavailable"}
                aria-disabled={saveState === "saving" || saveState === "unavailable"}
              >
                Arbeitsstand speichern
              </button>
            </div>
            <div className="mt-3 space-y-1 text-xs text-emerald-900/85 dark:text-emerald-100/85">
              <p>Ich würde jetzt Folgendes vorbereiten: {toSentenceList(sortedSuggestions.slice(0, 3).map((item) => resolveSuggestionBadge(item.kind).toLowerCase()))}.</p>
              <p>{saveMessage ?? "Arbeitsstand speichern ist in diesem Schritt verfügbar."}</p>
              <p>{factcheckMessage ?? "Optional. Startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."}</p>
            </div>
          </div>
        </div>
      ) : null}

      <DetailsAccordion
        result={result}
        sections={sections}
        sortedSuggestions={sortedSuggestions}
        isConfirmed={isConfirmed}
      />

      <ContinueWritingComposer
        value={continuationValue}
        onChange={onContinuationChange}
        onSubmit={onContinueConversation}
        submitDisabled={continueConversationDisabled}
      />

      {actionNotice ? (
        <div className="create-chat-message flex gap-3">
          <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-600 ring-4 ring-white dark:bg-cyan-300 dark:ring-[rgb(var(--bg))]" />
          <p className="max-w-3xl rounded-2xl rounded-tl-sm border border-cyan-500/35 bg-white px-3 py-2 text-xs text-cyan-900 shadow-sm dark:border-cyan-300/35 dark:bg-[rgb(var(--card))] dark:text-cyan-100 dark:shadow-none">
            {actionNotice}
          </p>
        </div>
      ) : null}
      </div>

      <div
        data-mobile-sticky-create-actions
        className="sticky bottom-2 z-10 rounded-2xl border border-cyan-500/30 bg-white/95 px-3 py-3 shadow-xl shadow-cyan-950/10 backdrop-blur md:hidden dark:border-cyan-300/45 dark:bg-[rgb(var(--card))]/95 dark:shadow-black/20"
      >
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">
          {isConfirmed ? "Nächster Schritt" : CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          {isConfirmed
            ? "Die wichtigste Aktion bleibt unten erreichbar."
            : CREATE_VISUAL_FOLLOWUP_COPY.freeWriteHint}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {isConfirmed ? (
            <>
              <Link href={primaryActionHref} className="btn-primary min-h-[40px] px-2 py-2 text-center text-sm">
                Thema öffnen
              </Link>
              <Link href={voteActionHref} className="btn-secondary min-h-[40px] px-2 py-2 text-center text-sm">
                Prüfen
              </Link>
              <button
                type="button"
                className="btn-secondary min-h-[40px] px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onSaveForLater}
                disabled={saveState === "saving" || saveState === "unavailable"}
                aria-disabled={saveState === "saving" || saveState === "unavailable"}
              >
                Speichern
              </button>
              <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={onStartOptionalService}>
                Faktencheck
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-primary min-h-[40px] px-2 py-2 text-sm" onClick={onConfirm}>
                Ja, Struktur übernehmen
              </button>
              <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={() => openCorrection("Thema")}>
                Ändern
              </button>
              <button
                type="button"
                className="btn-secondary min-h-[40px] px-2 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onSaveForLater}
                disabled={saveState === "saving" || saveState === "unavailable"}
                aria-disabled={saveState === "saving" || saveState === "unavailable"}
              >
                Speichern
              </button>
              <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={onStartOptionalService}>
                Faktencheck
              </button>
            </>
          )}
        </div>
        <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
          Keine automatische Stimme. Keine automatische Veröffentlichung. Keine automatische Kostenbuchung.
        </p>
      </div>
    </section>
  );
}

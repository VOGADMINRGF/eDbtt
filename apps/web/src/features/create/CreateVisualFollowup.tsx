"use client";

import * as React from "react";
import Link from "next/link";
import {
  buildCreateVisualMap,
  buildCreateVisualSections,
  dedupeCreateFollowupSections,
  deriveDominantUnderstandingStance,
  type CreateConnectionSuggestion,
  type CreateIntelligentFollowupResult,
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
  onConfirm: () => void;
  onEdit: () => void;
  onOpenNewAnlassraum: () => void;
  onSaveForLater?: () => void;
  onStartOptionalService?: () => void;
};

export const CREATE_VISUAL_FOLLOWUP_COPY = {
  headline: "eDebatte hat deinen Beitrag strukturiert",
  structureTitle: "Vorläufige Struktur",
  coreTitle: "Kern erkannt",
  graphTitle: "So hängt dein Beitrag zusammen",
  impactTitle: "Dort würden wir deinen Beitrag anschließen",
  confirmTitle: "Stimmt diese Einordnung?",
  guardrail:
    "Keine automatische Stimme. Keine automatische Veröffentlichung. Du bestätigst jeden nächsten Schritt selbst.",
} as const;

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
  if (label === "eher dafür") return "eher dafür: klare Mindestanforderungen und Konsequenzen";
  if (label === "eher dagegen") return "eher dagegen: deutlicher Widerspruch im Beitrag";
  return "offen/unklar: gemischte oder noch unklare Haltung";
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
  if (kind === "vote") return "Abstimmung ansehen";
  if (kind === "anlassraum") return "Anlassraum ansehen";
  if (kind === "new_anlassraum") return "Vorschlagen";
  return "Ansehen";
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
    return "Ich sehe einen breiten kommunalen Prioritätenkonflikt. Es geht nicht um ein einzelnes Thema, sondern um mehrere Zielkonflikte: Wohnen, Verkehr, Klima, Bildung, Integration, Sicherheit, Pflege, Finanzen und Beteiligung. Ich fasse das zunächst als Dossier-Kontext zusammen und leite daraus mögliche Claims und Abstimmungsfragen ab.";
  }
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (
    lowered.includes("politische verantwortung") &&
    lowered.includes("amtsträger") &&
    lowered.includes("qualifikation") &&
    lowered.includes("sanktionen") &&
    lowered.includes("gesetzgebung")
  ) {
    return "Ich erkenne darin eine Forderung nach klareren Mindestanforderungen und Konsequenzen für Amtsträger. Außerdem berührt dein Text Gesetzgebung und mögliche Abstimmungsoptionen.";
  }
  const topicSentence = toSentenceList(params.topicLabels.slice(0, 4).map((label) => label.toLowerCase()));
  if (topicSentence) return `Ich erkenne darin vor allem ${topicSentence}.`;
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

export default function CreateVisualFollowup({
  result,
  ctaHref,
  actionNotice,
  isConfirmed = false,
  onConfirm,
  onEdit,
  onOpenNewAnlassraum,
  onSaveForLater = () => {},
  onStartOptionalService = () => {},
}: CreateVisualFollowupProps) {
  const visualMap = React.useMemo(() => buildCreateVisualMap(result), [result]);
  const sections = React.useMemo(() => buildCreateVisualSections(result, 4), [result]);
  const [showCorrectionRow, setShowCorrectionRow] = React.useState(false);
  const [correctionFocus, setCorrectionFocus] = React.useState<string | null>(null);

  const topicLabels = result.understanding.topics.map((topic) => topic.label);
  const broadTopicFields = React.useMemo(() => deriveBroadTopicFields(topicLabels), [topicLabels]);
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const statementNodes = visualMap.nodes.filter((node) => node.kind === "statement").slice(0, 4);
  const topicNodes = visualMap.nodes.filter((node) => node.kind === "topic");
  const sortedSuggestions = sortSuggestions(result.suggestions)
    .filter((suggestion) => suggestion.kind !== "topic")
    .slice(0, 4);
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
  const showSectionFlow = result.sourceText.length > 500 || sections.length > 1;
  const showCompactUserBubble = result.sourceText.length <= 420 && !showSectionFlow;
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
  const rootTopic = result.understanding.dossierContext ?? topicNodes[0]?.label ?? "Öffentliches Thema";
  const branchTopics = topicLabels.filter((label) => label !== rootTopic);
  const primaryActionHref = buildCreateFollowupPrimaryCtaHref({
    ctaHref,
    topics: result.understanding.topics,
    statements: result.understanding.statements,
    suggestions: sortedSuggestions,
  });

  const openCorrection = React.useCallback(
    (focus: string) => {
      setCorrectionFocus(focus);
      setShowCorrectionRow(true);
      onEdit();
    },
    [onEdit],
  );

  return (
    <section className="relative space-y-5 rounded-2xl border border-slate-300/55 bg-slate-50/90 p-4 pb-24 md:space-y-6 md:p-6 md:pb-20 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]">
      {showCompactUserBubble ? (
        <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Du</p>
          <p className="mt-2 text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">
            {dedupedCopy.userBubbleText.slice(0, 260)}
            {dedupedCopy.userBubbleText.length > 260 ? " …" : ""}
          </p>
        </div>
      ) : (
        <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Du</p>
          <p className="mt-2 text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">Dein Beitrag wurde aufgenommen.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-slate-700 dark:text-[rgb(var(--muted))]">Originaltext anzeigen</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--fg))]">
              {result.sourceText}
            </pre>
          </details>
        </div>
      )}

      <div className="mr-auto max-w-4xl rounded-2xl rounded-tl-md border border-cyan-500/25 bg-white px-4 py-4 shadow-sm dark:border-cyan-300/35 dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-700 dark:text-[rgb(var(--muted))]">eDebatte</p>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.structureTitle}</p>
        <p className="mt-1 text-base font-semibold text-cyan-950 md:text-lg dark:text-cyan-50">{CREATE_VISUAL_FOLLOWUP_COPY.headline}</p>
        <p className="mt-3 text-base text-cyan-900 md:text-lg dark:text-cyan-100">{dedupedCopy.prominentSummary || assistantLead}</p>
        <p className="mt-2 text-sm text-cyan-900/85 dark:text-cyan-100/85">Fortlaufender Struktur-Chat: Wir halten den Dossier-Kontext, Themenfelder und Claims im selben Arbeitsfenster zusammen.</p>
        {showCoreBlock ? (
          <div className="mt-4 rounded-xl border border-cyan-500/35 bg-cyan-50 px-4 py-3 dark:border-cyan-300/40 dark:bg-cyan-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.coreTitle}</p>
            <p className="mt-1 text-base font-semibold text-cyan-950 md:text-xl dark:text-cyan-50">
              {dedupedCopy.prominentCoreClaim}
            </p>
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-sm text-emerald-950 dark:border-emerald-300/40 dark:bg-emerald-500/10 dark:text-emerald-50">
            Haltung: {resolveStanceLead(dominantStance)}
          </span>
          <span className="rounded-full border border-amber-500/35 bg-amber-50 px-3 py-1 text-sm text-amber-950 dark:border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-50">
            Ebene: {resolveScopeLabel(scopeChip)}
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4 md:py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">Vorgeschlagener Arbeitsstand</p>

        <div className="space-y-3 md:hidden">
          <div className="rounded-lg border border-cyan-500/35 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">1. Dein Beitrag</div>
          <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone(visualMap.center.kind)}`}>
            <p className="text-sm font-semibold">{visualMap.center.label}</p>
            <p className="mt-1 text-sm opacity-80">Originaltext bleibt im Detail einsehbar.</p>
          </div>
          <div className="rounded-lg border border-cyan-500/35 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">2. Kern erkannt</div>
          <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone("statement")}`}>
            <p className="text-sm font-semibold">{keyStatement}</p>
          </div>
          <div className="rounded-lg border border-cyan-500/35 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">3. Themenfelder</div>
          <div className="flex flex-wrap gap-2">
            {topicLabels.map((label) => (
              <span key={`mobile-topic-${label}`} className={`rounded-full border px-2.5 py-1 text-sm ${resolveNodeTone("topic")}`}>
                {label}
              </span>
            ))}
          </div>
          <div className="rounded-lg border border-cyan-500/35 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">4. Dossier-Kontext</div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-slate-100">
            <p className="font-semibold">Dossier-Kontext / Oberthema</p>
            <p className="mt-1">{rootTopic}</p>
            <p className="mt-2 font-semibold">Themenfelder</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {topicLabels.map((label) => (
                <button
                  key={`topic-correction-${label}`}
                  type="button"
                  onClick={() => openCorrection(`Thema: ${label}`)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("topic")}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-semibold">Blickrichtungen</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {positionClusters.map((cluster) => (
                <button
                  key={cluster}
                  type="button"
                  onClick={() => openCorrection(`Position: ${cluster}`)}
                  className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("stance")}`}
                >
                  {cluster}
                </button>
              ))}
            </div>
            <p className="mt-2 font-semibold">Mögliche Claims</p>
            <div className="mt-1 space-y-1">
              {statementNodes.slice(0, 2).map((node) => (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => openCorrection(`Claim: ${node.label}`)}
                  className="block w-full rounded-lg border border-sky-500/30 bg-sky-50 px-2.5 py-1.5 text-left text-xs text-sky-950 dark:border-sky-300/35 dark:bg-sky-500/10 dark:text-sky-50"
                >
                  {node.label}
                </button>
              ))}
            </div>
            <p className="mt-2 font-semibold">Mögliche Abstimmungsfragen</p>
            <ol className="mt-1 space-y-1">
              {voteQuestions.map((question, index) => (
                <li key={`mobile-vote-question-${index}`} className="text-xs">
                  {index + 1}. {question}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="space-y-3">
            <div className={`max-w-2xl rounded-xl border px-4 py-3 ${resolveNodeTone("source_text")}`}>
              <p className="text-sm font-semibold">Dein Beitrag</p>
              <p className="mt-1 text-sm opacity-85">Originaltext bleibt im Detail einsehbar.</p>
            </div>
            <div className="ml-5 border-l-2 border-cyan-500/35 pl-4 dark:border-cyan-300/40">
              <div className={`max-w-2xl rounded-xl border px-4 py-3 ${resolveNodeTone("statement")}`}>
                <p className="text-sm font-semibold">Kernforderung</p>
                <p className="mt-1 text-base font-semibold">{keyStatement}</p>
              </div>
              <div className="ml-6 mt-3 border-l-2 border-violet-500/30 pl-4 dark:border-violet-300/35">
                <div className={`max-w-2xl rounded-xl border px-4 py-3 ${resolveNodeTone("topic")}`}>
                  <p className="text-sm font-semibold">Hauptthema</p>
                  <p className="mt-1 text-base font-semibold">{rootTopic}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {branchTopics.map((label) => (
                    <button
                      key={`branch-topic-${label}`}
                      type="button"
                      onClick={() => openCorrection(`Thema: ${label}`)}
                      className={`rounded-full border px-3 py-1 text-sm ${resolveNodeTone("topic")}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Blickrichtungen</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {positionClusters.map((cluster) => (
                      <button
                        key={cluster}
                        type="button"
                        onClick={() => openCorrection(`Position: ${cluster}`)}
                        className={`rounded-full border px-2.5 py-1 text-xs ${resolveNodeTone("stance")}`}
                      >
                        {cluster}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Mögliche Abstimmungsfragen</p>
                  <ol className="mt-2 space-y-1 text-sm">
                    {voteQuestions.map((question, index) => (
                      <li key={`desktop-vote-question-${index}`}>
                        {index + 1}. {question}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
          {CREATE_VISUAL_FOLLOWUP_COPY.impactTitle} (optional)
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {sortedSuggestions.map((suggestion) => {
            const href = buildCreateFollowupTargetHref({
              kind: suggestion.kind,
              ctaHref,
              topics: result.understanding.topics,
              statements: result.understanding.statements,
              stance: suggestion.suggestedStance ?? null,
              suggestionTitle: suggestion.title,
              suggestionHref: suggestion.href ?? null,
            });
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
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestion.kind === "new_anlassraum" ? (
                    <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={onOpenNewAnlassraum}>
                      {resolveSuggestionCta(suggestion.kind)}
                    </button>
                  ) : (
                    <Link href={href} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                      {resolveSuggestionCta(suggestion.kind)}
                    </Link>
                  )}
                  <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={() => openCorrection("Anschluss")}>
                    Nicht passend
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </details>

      {showSectionFlow ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">Wir haben deinen Text in {sections.length} Sinnabschnitte gegliedert.</p>
          <div className="space-y-2">
            {sections.map((section) => (
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
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Möglicher Anschluss:</span> {section.connectionLabel}</p>
                ) : null}
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-cyan-500/30 bg-white px-3 py-3 shadow-sm dark:border-cyan-300/45 dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <p className="text-sm text-[rgb(var(--muted))] md:text-base">
          Du kannst bestätigen, einzelne Punkte ändern oder den Arbeitsstand für später speichern.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-300/45 bg-emerald-50 px-3 py-2 dark:border-emerald-300/35 dark:bg-emerald-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900 dark:text-emerald-100">
              Kostenlose nächste Schritte
            </p>
            <ul className="mt-1 list-disc pl-4 text-xs text-emerald-900/90 dark:text-emerald-100/90">
              <li>Dossiers lesen und abstimmbare Claims prüfen</li>
              <li>In Swipes aktiv zustimmen, ablehnen oder offen bleiben</li>
              <li>Als neues Thema vorschlagen</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-300/55 bg-slate-50 px-3 py-2 dark:border-slate-300/30 dark:bg-slate-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-slate-100">
              Zusatzservice (optional)
            </p>
            <p className="mt-1 text-xs text-slate-800 dark:text-slate-200">
              Erweiterte Prüfung oder Begleitung startest du nur bewusst im nächsten Schritt. Keine automatische Kostenbuchung.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary min-h-[40px] px-3 py-2 text-sm" onClick={onConfirm}>
            Ja, Struktur übernehmen
          </button>
          <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={() => openCorrection("Thema")}>
            Ein Thema ändern
          </button>
          <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={onSaveForLater}>
            Für später speichern
          </button>
        </div>
        {showCorrectionRow ? (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            <p className="text-sm text-[rgb(var(--fg))]">
              Was soll anders eingeordnet werden{correctionFocus ? `: ${correctionFocus}` : ""}?
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Thema ändern", "Haltung ändern", "Anschluss ändern", "Aussage fehlt"].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--fg))] hover:border-cyan-300/60"
                  onClick={onEdit}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <p className="text-xs text-[rgb(var(--muted))]">{CREATE_VISUAL_FOLLOWUP_COPY.guardrail}</p>
        {isConfirmed ? (
          <div className="space-y-2 rounded-lg border border-emerald-300/45 bg-emerald-50 px-3 py-2 dark:border-emerald-300/35 dark:bg-emerald-500/10">
            <p className="text-sm text-emerald-900 dark:text-emerald-100">
              Einordnung bestätigt. Dein Beitrag ist noch nicht veröffentlicht. Wähle jetzt den nächsten Schritt.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={primaryActionHref} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                Dossier-Kontext öffnen
              </Link>
              {voteSuggestion ? (
                <Link
                  href={buildCreateFollowupTargetHref({
                    kind: "vote",
                    ctaHref,
                    topics: result.understanding.topics,
                    statements: result.understanding.statements,
                    suggestionTitle: voteSuggestion.title,
                    suggestionHref: voteSuggestion.href ?? null,
                  })}
                  className="btn-secondary min-h-[40px] px-3 py-2 text-sm"
                >
                  Claims/Abstimmungen prüfen
                </Link>
              ) : (
                <Link href={primaryActionHref} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                  Abstimmungsfragen prüfen
                </Link>
              )}
              <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={onStartOptionalService}>
                Faktencheck / Deep Search starten
              </button>
              <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={onSaveForLater}>
                Arbeitsstand speichern
              </button>
            </div>
          </div>
        ) : null}
        {actionNotice ? (
          <p className="rounded-lg border border-cyan-500/35 bg-cyan-50 px-3 py-2 text-xs text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">
            {actionNotice}
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-2 z-10 rounded-xl border border-cyan-500/30 bg-white/95 px-3 py-2 shadow-xl shadow-cyan-950/10 backdrop-blur md:hidden dark:border-cyan-300/45 dark:bg-[rgb(var(--card))]/95 dark:shadow-black/20">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <p className="text-xs text-[rgb(var(--muted))]">Keine automatische Stimme oder Veröffentlichung.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary min-h-[40px] px-2 py-2 text-sm" onClick={onConfirm}>
            Ja, Struktur übernehmen
          </button>
          <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={() => openCorrection("Thema")}>
            Ändern
          </button>
          <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={onSaveForLater}>
            Speichern
          </button>
          <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={onStartOptionalService}>
            Service
          </button>
        </div>
      </div>
    </section>
  );
}

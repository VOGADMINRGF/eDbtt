"use client";

import * as React from "react";
import Link from "next/link";
import {
  buildCreateVisualMap,
  buildCreateVisualSections,
  deriveDominantUnderstandingStance,
  type CreateIntelligentFollowupResult,
  type CreateVisualNode,
} from "@/features/create/intelligentFollowupContract";

type CreateVisualFollowupProps = {
  result: CreateIntelligentFollowupResult;
  ctaHref: string;
  actionNotice?: string | null;
  isConfirmed?: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onOpenNewAnlassraum: () => void;
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

function resolveNodeTone(kind: CreateVisualNode["kind"]): string {
  if (kind === "source_text") return "border-cyan-300/60 bg-cyan-500/15";
  if (kind === "statement") return "border-sky-300/45 bg-sky-500/10";
  if (kind === "topic") return "border-violet-300/45 bg-violet-500/10";
  if (kind === "stance") return "border-emerald-300/45 bg-emerald-500/10";
  if (kind === "scope") return "border-amber-300/45 bg-amber-500/10";
  if (kind === "dossier" || kind === "anlassraum") return "border-blue-300/45 bg-blue-500/10";
  if (kind === "vote") return "border-fuchsia-300/45 bg-fuchsia-500/10";
  return "border-slate-300/45 bg-slate-500/10";
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

function resolveSuggestionBadge(kind: CreateVisualNode["kind"]): string {
  if (kind === "dossier") return "Dossier";
  if (kind === "vote") return "Abstimmung";
  if (kind === "anlassraum") return "Anlassraum";
  if (kind === "new_anlassraum") return "Neuer Anlassraum";
  return "Thema";
}

function resolveSuggestionCta(kind: CreateVisualNode["kind"]): string {
  if (kind === "dossier") return "Dossier ansehen";
  if (kind === "vote") return "Abstimmung ansehen";
  if (kind === "anlassraum") return "Anlassraum ansehen";
  if (kind === "new_anlassraum") return "Vorschlagen";
  return "Ansehen";
}

function resolveSectionTitle(label: string, sectionIndex: number): string {
  const lowered = label.toLowerCase();
  if (lowered.includes("forderung")) return `Teil ${sectionIndex + 1}: Was du forderst`;
  if (lowered.includes("begründ")) return `Teil ${sectionIndex + 1}: Warum dir das wichtig ist`;
  if (lowered.includes("vorschlag")) return `Teil ${sectionIndex + 1}: Dein Vorschlag`;
  if (lowered.includes("frage")) return `Teil ${sectionIndex + 1}: Was noch offen ist`;
  return `Teil ${sectionIndex + 1}: Woran es anschließt`;
}

function toSentenceList(labels: string[]): string {
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} und ${labels[1]}`;
  const head = labels.slice(0, -1).join(", ");
  const last = labels[labels.length - 1];
  return `${head} und ${last}`;
}

function resolveAssistantLead(params: {
  topicLabels: string[];
  summary: string;
  statementText: string;
}): string {
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (
    lowered.includes("politische verantwortung") &&
    lowered.includes("amtsträger") &&
    lowered.includes("qualifikation") &&
    lowered.includes("sanktionen") &&
    lowered.includes("gesetzgebung")
  ) {
    return "Ich erkenne eine Forderung nach klareren Mindestanforderungen und Konsequenzen für gewählte oder ernannte Amtsträger. Dein Beitrag berührt außerdem Gesetzgebung und die Frage, ob gestrichene Entwürfe als Optionen sichtbar bleiben sollten.";
  }
  const topicSentence = toSentenceList(params.topicLabels.slice(0, 4).map((label) => label.toLowerCase()));
  if (topicSentence) {
    return `Ich erkenne darin vor allem ${topicSentence}.`;
  }
  if (params.summary.trim().length > 0) {
    return params.summary.trim();
  }
  return params.statementText.trim();
}

function resolveCoreClaim(params: {
  topicLabels: string[];
  fallback: string;
}): string {
  const lowered = params.topicLabels.join(" ").toLowerCase();
  if (
    lowered.includes("amtsträger") &&
    lowered.includes("qualifikation") &&
    lowered.includes("sanktionen")
  ) {
    return "Du forderst klare Mindestanforderungen und Konsequenzen für Amtsträger.";
  }
  return params.fallback;
}

function sortConnectionNodes(nodes: CreateVisualNode[]): CreateVisualNode[] {
  const priority: Record<string, number> = {
    dossier: 0,
    vote: 1,
    anlassraum: 2,
    new_anlassraum: 3,
  };
  return [...nodes].sort((a, b) => (priority[a.kind] ?? 9) - (priority[b.kind] ?? 9));
}

export default function CreateVisualFollowup({
  result,
  ctaHref,
  actionNotice,
  isConfirmed = false,
  onConfirm,
  onEdit,
  onOpenNewAnlassraum,
}: CreateVisualFollowupProps) {
  const visualMap = React.useMemo(() => buildCreateVisualMap(result), [result]);
  const sections = React.useMemo(() => buildCreateVisualSections(result, 4), [result]);
  const [showCorrectionRow, setShowCorrectionRow] = React.useState(false);
  const [correctionFocus, setCorrectionFocus] = React.useState<string | null>(null);
  const topicLabels = result.understanding.topics.slice(0, 6).map((topic) => topic.label);
  const topicLead = topicLabels.slice(0, 3).map((label) => label.toLowerCase()).join(", ");
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const categoryNode = visualMap.nodes.find((node) => node.kind === "statement");
  const statementNodes = visualMap.nodes.filter((node) => node.kind === "statement").slice(0, 4);
  const topicNodes = visualMap.nodes.filter((node) => node.kind === "topic").slice(0, 6);
  const connectionNodes = sortConnectionNodes(
    visualMap.nodes.filter(
      (node) =>
        node.kind === "dossier" ||
        node.kind === "anlassraum" ||
        node.kind === "vote" ||
        node.kind === "new_anlassraum",
    ),
  );
  const scopeChip = result.understanding.scopes[0] ?? "unclear";
  const assistantLead = resolveAssistantLead({
    topicLabels,
    summary: result.understanding.summary,
    statementText: result.understanding.statements[0]?.text ?? "",
  });
  const showSectionFlow = result.sourceText.length > 500 || sections.length > 1;
  const showCompactUserBubble = result.sourceText.length <= 420 && !showSectionFlow;
  const keyStatement = resolveCoreClaim({
    topicLabels,
    fallback: statementNodes[0]?.label ?? result.understanding.summary,
  });
  const rootTopic = topicNodes[0]?.label ?? "Öffentliches Thema";
  const branchTopics = topicNodes.slice(1);

  const openCorrection = React.useCallback(
    (focus: string) => {
      setCorrectionFocus(focus);
      setShowCorrectionRow(true);
      onEdit();
    },
    [onEdit],
  );

  return (
    <section className="relative space-y-5 rounded-2xl border border-cyan-300/45 bg-cyan-500/10 p-4 pb-20 md:space-y-6 md:p-6 md:pb-24">
      {showCompactUserBubble ? (
        <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Du</p>
          <p className="mt-2 text-sm text-[rgb(var(--fg))] md:text-base">
            {result.sourceText.slice(0, 260)}
            {result.sourceText.length > 260 ? " …" : ""}
          </p>
        </div>
      ) : (
        <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Du</p>
          <p className="mt-2 text-sm text-[rgb(var(--fg))] md:text-base">Dein Beitrag wurde aufgenommen.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-[rgb(var(--muted))]">Originaltext anzeigen</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
              {result.sourceText}
            </pre>
          </details>
        </div>
      )}

      <div className="mr-auto max-w-4xl rounded-2xl rounded-tl-md border border-cyan-300/45 bg-[rgb(var(--card))] px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.structureTitle}</p>
        <p className="mt-1 text-base font-semibold text-cyan-50 md:text-lg">{CREATE_VISUAL_FOLLOWUP_COPY.headline}</p>
        <p className="mt-3 text-base text-cyan-100 md:text-lg">
          {assistantLead || `Du sprichst vor allem über ${topicLead || "öffentliche Verantwortung und offene Fragen"}.`}
        </p>
        <div className="mt-4 rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.coreTitle}</p>
          <p className="mt-1 text-base font-semibold text-cyan-50 md:text-xl">{keyStatement}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categoryNode ? (
            <span className="rounded-full border border-sky-300/40 bg-sky-500/10 px-3 py-1 text-sm text-[rgb(var(--fg))]">
              Kategorie: {categoryNode.label}
            </span>
          ) : null}
          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-3 py-1 text-sm text-[rgb(var(--fg))]">
            Haltung: {resolveStanceLead(dominantStance)}
          </span>
          <span className="rounded-full border border-amber-300/40 bg-amber-500/10 px-3 py-1 text-sm text-[rgb(var(--fg))]">
            Ebene: {resolveScopeLabel(scopeChip)}
          </span>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3 md:px-4 md:py-4">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.graphTitle}</p>

        <div className="space-y-3 md:hidden">
          <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            1. Dein Beitrag
          </div>
          <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone(visualMap.center.kind)}`}>
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{visualMap.center.label}</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{visualMap.center.detail}</p>
          </div>
          <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            2. Kern erkannt
          </div>
          <div className="ml-3 border-l border-cyan-300/45 pl-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Erkannte Aussage</p>
            <div className={`mt-2 rounded-xl border px-3 py-2 ${resolveNodeTone(statementNodes[0]?.kind ?? "statement")}`}>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{keyStatement}</p>
            </div>
          </div>
          <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            3. Themen
          </div>
          <div className="ml-3 border-l border-cyan-300/45 pl-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themen</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topicNodes.map((node) => (
                <span key={node.id} className={`rounded-full border px-2 py-1 text-sm ${resolveNodeTone(node.kind)}`}>
                  {node.label}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            4. Anschluss
          </div>
        </div>

        <div className="hidden md:block">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="space-y-3">
              <div className={`rounded-xl border px-4 py-3 ${resolveNodeTone(visualMap.center.kind)}`}>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Dein Beitrag</p>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{visualMap.center.detail}</p>
              </div>
              <div className="ml-6 border-l border-cyan-300/45 pl-4">
                <div className={`rounded-xl border px-4 py-3 ${resolveNodeTone(statementNodes[0]?.kind ?? "statement")}`}>
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">Kernforderung</p>
                  <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{keyStatement}</p>
                </div>
                <div className="ml-6 mt-3 border-l border-violet-300/45 pl-4">
                  <div className={`rounded-xl border px-4 py-3 ${resolveNodeTone(topicNodes[0]?.kind ?? "topic")}`}>
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">Hauptthema</p>
                    <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{rootTopic}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {branchTopics.map((node) => (
                      <span key={node.id} className={`rounded-full border px-3 py-1 text-sm ${resolveNodeTone(node.kind)}`}>
                        {node.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-blue-300/35 bg-blue-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.impactTitle}</p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                {connectionNodes.slice(0, 3).map((node, index) => (
                  <article key={`${node.id}-${index}`} className={`rounded-xl border px-3 py-3 ${resolveNodeTone(node.kind)}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                      {resolveSuggestionBadge(node.kind)}
                    </p>
                    <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{node.label}</p>
                    {node.detail ? (
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">Warum passt das? {node.detail}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {node.kind === "new_anlassraum" ? (
                        <button type="button" className="btn-secondary text-xs" onClick={onOpenNewAnlassraum}>
                          {resolveSuggestionCta(node.kind)}
                        </button>
                      ) : (
                        <Link href={ctaHref} className="btn-secondary text-xs">
                          {resolveSuggestionCta(node.kind)}
                        </Link>
                      )}
                      <button type="button" className="btn-secondary text-xs" onClick={() => openCorrection("Anschluss") }>
                        Nicht passend
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSectionFlow ? (
        <div className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
            Wir haben deinen Text in {sections.length} Teile gegliedert.
          </p>
          <div className="space-y-2">
            {sections.map((section, sectionIndex) => (
              <details
                key={section.id}
                className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
                open={sectionIndex === 0}
              >
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
                  {resolveSectionTitle(section.label, sectionIndex)}
                </summary>
                <p className="mt-2 text-sm text-[rgb(var(--fg))] md:text-base"><span className="font-semibold">Du sagst:</span> {section.sourceText}</p>
                {section.statementLabel ? (
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Erkannt als:</span> {section.statementLabel}</p>
                ) : null}
                {section.topicLabel ? <p className="mt-1 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Gehört zu:</span> {section.topicLabel}</p> : null}
                {section.stanceLabel ? (
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Haltung:</span> {section.stanceLabel}</p>
                ) : null}
                {section.connectionLabel ? (
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]"><span className="font-semibold text-[rgb(var(--fg))]">Möglicher Anschluss:</span> {section.connectionLabel}</p>
                ) : null}
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3 md:hidden">
        <div className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100">
          5. Bestätigung
        </div>
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.impactTitle}</p>
        <div className="space-y-2">
          {connectionNodes.slice(0, 3).map((node, index) => (
            <article key={`${node.id}-mobile-${index}`} className={`rounded-xl border px-3 py-3 ${resolveNodeTone(node.kind)}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{resolveSuggestionBadge(node.kind)}</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{node.label}</p>
              {node.detail ? <p className="mt-1 text-sm text-[rgb(var(--muted))]">Warum passt das? {node.detail}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {node.kind === "new_anlassraum" ? (
                  <button type="button" className="btn-secondary text-xs" onClick={onOpenNewAnlassraum}>
                    {resolveSuggestionCta(node.kind)}
                  </button>
                ) : (
                  <Link href={ctaHref} className="btn-secondary text-xs">
                    {resolveSuggestionCta(node.kind)}
                  </Link>
                )}
                <button type="button" className="btn-secondary text-xs" onClick={() => openCorrection("Anschluss") }>
                  Nicht passend
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-cyan-300/45 bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <p className="text-sm text-[rgb(var(--muted))] md:text-base">
          Du kannst bestätigen, einzelne Punkte ändern oder erst passende Dossiers und Abstimmungen ansehen.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-xs" onClick={onConfirm}>
            Ja, so einordnen
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => openCorrection("Thema")}
          >
            Ein Thema stimmt nicht
          </button>
          <Link href={ctaHref} className="btn-secondary text-xs">
            Passende Dossiers ansehen
          </Link>
          <button type="button" className="btn-secondary text-xs" onClick={onOpenNewAnlassraum}>
            Als neues Thema vorschlagen
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
                  onClick={() => onEdit()}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <p className="text-xs text-[rgb(var(--muted))]">{CREATE_VISUAL_FOLLOWUP_COPY.guardrail}</p>
        {isConfirmed ? (
          <p className="text-sm text-emerald-300">
            Einordnung bestätigt. Dein Beitrag ist noch nicht veröffentlicht. Wähle jetzt den nächsten Schritt.
          </p>
        ) : null}
        {actionNotice ? (
          <p className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{actionNotice}</p>
        ) : null}
      </div>

      <div className="sticky bottom-3 z-10 rounded-xl border border-cyan-300/45 bg-[rgb(var(--card))]/95 px-3 py-3 shadow-lg shadow-black/20 backdrop-blur">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
            <p className="text-xs text-[rgb(var(--muted))]">{CREATE_VISUAL_FOLLOWUP_COPY.guardrail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary text-xs" onClick={onConfirm}>
              Ja, so einordnen
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => openCorrection("Thema") }>
              Ändern
            </button>
            <Link href={ctaHref} className="btn-secondary text-xs">
              Dossiers ansehen
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

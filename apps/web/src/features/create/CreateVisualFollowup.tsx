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
  const topicLabels = result.understanding.topics.slice(0, 6).map((topic) => topic.label);
  const topicLead = topicLabels.slice(0, 3).map((label) => label.toLowerCase()).join(", ");
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const categoryNode = visualMap.nodes.find((node) => node.kind === "statement");
  const statementNodes = visualMap.nodes.filter((node) => node.kind === "statement").slice(0, 3);
  const topicNodes = visualMap.nodes.filter((node) => node.kind === "topic").slice(0, 8);
  const connectionNodes = visualMap.nodes.filter(
    (node) =>
      node.kind === "dossier" ||
      node.kind === "anlassraum" ||
      node.kind === "vote" ||
      node.kind === "new_anlassraum",
  );
  const scopeChip = result.understanding.scopes[0] ?? "unclear";
  const assistantLead = resolveAssistantLead({
    topicLabels,
    summary: result.understanding.summary,
    statementText: result.understanding.statements[0]?.text ?? "",
  });
  const showSectionFlow = result.sourceText.length > 500 || sections.length > 1;

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-300/45 bg-cyan-500/10 p-4 md:p-5">
      <div className="max-w-3xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Dein Beitrag</p>
        <p className="mt-2 text-sm text-[rgb(var(--fg))]">{result.sourceText.slice(0, 240)}{result.sourceText.length > 240 ? " …" : ""}</p>
      </div>

      <div className="ml-2 max-w-3xl rounded-2xl border border-cyan-300/45 bg-[rgb(var(--card))] px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{CREATE_VISUAL_FOLLOWUP_COPY.structureTitle}</p>
        <p className="mt-1 text-base font-semibold text-cyan-50">{CREATE_VISUAL_FOLLOWUP_COPY.headline}</p>
        <p className="mt-2 text-sm text-cyan-100">
          {assistantLead || `Du sprichst vor allem über ${topicLead || "öffentliche Verantwortung und offene Fragen"}.`}
        </p>
        <p className="mt-2 text-xs text-cyan-100">
          Wir haben deinen Text in Aussagen, Themen und mögliche Anschlussstellen zerlegt. Bitte bestätige kurz, ob das so passt.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.graphTitle}</p>

        <div className="space-y-3 md:hidden">
          <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone(visualMap.center.kind)}`}>
            <p className="text-xs font-semibold text-[rgb(var(--fg))]">{visualMap.center.label}</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">{visualMap.center.detail}</p>
          </div>
          <div className="ml-3 border-l border-cyan-300/45 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Erkannte Aussage</p>
            {statementNodes.slice(0, 1).map((node) => (
              <div key={node.id} className={`mt-2 rounded-xl border px-3 py-2 ${resolveNodeTone(node.kind)}`}>
                <p className="text-xs font-semibold text-[rgb(var(--fg))]">{node.label}</p>
              </div>
            ))}
          </div>
          <div className="ml-3 border-l border-cyan-300/45 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themen</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {topicNodes.map((node) => (
                <span key={node.id} className={`rounded-full border px-2 py-1 text-xs ${resolveNodeTone(node.kind)}`}>
                  {node.label}
                </span>
              ))}
            </div>
          </div>
          <div className="ml-3 border-l border-cyan-300/45 pl-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Anschluss</p>
            <div className="mt-2 space-y-2">
              {connectionNodes.slice(0, 4).map((node) => (
                <div key={node.id} className={`rounded-xl border px-3 py-2 ${resolveNodeTone(node.kind)}`}>
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">{node.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden gap-3 md:grid md:grid-cols-[minmax(180px,1fr)_auto_minmax(180px,1fr)_auto_minmax(220px,1.2fr)]">
          <article className={`rounded-xl border px-3 py-2 ${resolveNodeTone(visualMap.center.kind)}`}>
            <p className="text-xs font-semibold text-[rgb(var(--fg))]">{visualMap.center.label}</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">{visualMap.center.detail}</p>
          </article>
          <div className="flex items-center justify-center text-xl text-cyan-200">→</div>
          <div className="space-y-2">
            {statementNodes.slice(0, 2).map((node) => (
              <article key={node.id} className={`rounded-xl border px-3 py-2 ${resolveNodeTone(node.kind)}`}>
                <p className="text-xs font-semibold text-[rgb(var(--fg))]">{node.label}</p>
              </article>
            ))}
            {categoryNode ? (
              <span className="inline-flex rounded-full border border-sky-300/40 bg-sky-500/10 px-2 py-1 text-xs text-[rgb(var(--fg))]">
                {categoryNode.label}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-center text-xl text-cyan-200">→</div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {topicNodes.map((node) => (
                <span key={node.id} className={`rounded-full border px-2 py-1 text-xs ${resolveNodeTone(node.kind)}`}>
                  {node.label}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {connectionNodes.slice(0, 3).map((node) => (
                <span key={node.id} className={`rounded-full border px-2 py-1 text-xs ${resolveNodeTone(node.kind)}`}>
                  {node.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-300/40 bg-emerald-500/10 px-2 py-1 text-xs text-[rgb(var(--fg))]">
            Haltung: {resolveStanceLead(dominantStance)}
          </span>
          <span className="rounded-full border border-amber-300/40 bg-amber-500/10 px-2 py-1 text-xs text-[rgb(var(--fg))]">
            Ebene: {scopeChip}
          </span>
        </div>
      </div>

      {showSectionFlow ? (
        <div className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            Wir haben deinen Text in {sections.length} Sinnabschnitte zerlegt.
          </p>
          <details>
            <summary className="cursor-pointer text-sm text-[rgb(var(--muted))]">Originaltext anzeigen</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
              {result.sourceText}
            </pre>
          </details>
          <div className="space-y-2">
            {sections.map((section, sectionIndex) => (
              <details
                key={section.id}
                className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
                open={sectionIndex === 0}
              >
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{section.label}</summary>
                <p className="mt-2 text-sm text-[rgb(var(--fg))]">{section.sourceText}</p>
                {section.statementLabel ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">Aussage: {section.statementLabel}</p>
                ) : null}
                {section.topicLabel ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">Thema: {section.topicLabel}</p> : null}
                {section.stanceLabel ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">Haltung: {section.stanceLabel}</p>
                ) : null}
                {section.connectionLabel ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">Anschluss: {section.connectionLabel}</p>
                ) : null}
              </details>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.impactTitle}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
          {result.suggestions.slice(0, 3).map((suggestion) => (
            <li key={suggestion.id}>
              <span className="font-medium text-[rgb(var(--fg))]">{suggestion.title}</span>{" "}
              <span className="text-[rgb(var(--muted))]">({suggestion.reason})</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 rounded-xl border border-cyan-300/45 bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-xs" onClick={onConfirm}>
            Ja, passt so
          </button>
          <button
            type="button"
            className="btn-secondary text-xs"
            onClick={() => {
              setShowCorrectionRow((current) => !current);
              onEdit();
            }}
          >
            Einen Punkt ändern
          </button>
          <Link href={ctaHref} className="btn-secondary text-xs">
            Dossier/Abstimmungen anzeigen
          </Link>
          <button type="button" className="btn-secondary text-xs" onClick={onOpenNewAnlassraum}>
            Neuen Anlassraum vorschlagen
          </button>
        </div>
        {showCorrectionRow ? (
          <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
            <p className="text-xs text-[rgb(var(--fg))]">Was soll anders eingeordnet werden?</p>
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
          <p className="text-xs text-emerald-300">Einordnung bestätigt. Du kannst jetzt den nächsten Schritt wählen.</p>
        ) : null}
        {actionNotice ? (
          <p className="rounded-lg border border-cyan-300/35 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{actionNotice}</p>
        ) : null}
      </div>
    </section>
  );
}

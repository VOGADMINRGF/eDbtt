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
  graphTitle: "Aus deinem Text entsteht diese Struktur",
  impactTitle: "Dort könnte dein Beitrag Wirkung bekommen",
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
  const topicLead = result.understanding.topics
    .slice(0, 3)
    .map((topic) => topic.label.toLowerCase())
    .join(", ");
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const compactNodes = visualMap.nodes.filter((node) => node.kind !== "scope");

  return (
    <section className="space-y-4 rounded-2xl border border-cyan-300/45 bg-cyan-500/10 p-4 md:p-5">
      <div className="space-y-2 rounded-xl border border-cyan-300/45 bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">Systemprüfung</p>
        <p className="text-base font-semibold text-cyan-50">{CREATE_VISUAL_FOLLOWUP_COPY.headline}</p>
        <p className="text-sm text-cyan-100">
          Wir haben deinen Text in Aussagen, Themen und mögliche Anschlussstellen zerlegt. Bitte bestätige kurz,
          ob das so passt.
        </p>
        <p className="text-sm text-cyan-100">
          Du sprichst vor allem über {topicLead || "öffentliche Verantwortung und offene Fragen"}.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.graphTitle}</p>

        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <article className={`rounded-xl border px-3 py-2 ${resolveNodeTone(visualMap.center.kind)}`}>
            <p className="text-xs font-semibold text-[rgb(var(--fg))]">{visualMap.center.label}</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">{visualMap.center.detail}</p>
          </article>
          <div className="grid gap-2 sm:grid-cols-2">
            {compactNodes.map((node) => (
              <article key={node.id} className={`rounded-xl border px-3 py-2 ${resolveNodeTone(node.kind)}`}>
                <p className="text-xs font-semibold text-[rgb(var(--fg))]">{node.label}</p>
                {node.detail ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{node.detail}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Wir haben deinen Beitrag in {sections.length} Sinnabschnitte zerlegt.</p>
        <details>
          <summary className="cursor-pointer text-sm text-[rgb(var(--muted))]">Originaltext anzeigen</summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]">
            {result.sourceText}
          </pre>
        </details>
        <div className="space-y-2">
          {sections.map((section) => (
            <details key={section.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2" open={sections.length <= 2}>
              <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{section.label}</summary>
              <p className="mt-2 text-sm text-[rgb(var(--fg))]">{section.sourceText}</p>
              {section.statementLabel ? (
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">Aussage: {section.statementLabel}</p>
              ) : null}
              {section.topicLabel ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">Thema: {section.topicLabel}</p> : null}
              {section.connectionLabel ? (
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">Anschluss: {section.connectionLabel}</p>
              ) : null}
            </details>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.impactTitle}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
          {result.suggestions.slice(0, 3).map((suggestion) => (
            <li key={suggestion.id}>{suggestion.title}</li>
          ))}
        </ul>
        <p className="text-xs text-[rgb(var(--muted))]">Haltung: {resolveStanceLead(dominantStance)}</p>
      </div>

      <div className="space-y-3 rounded-xl border border-cyan-300/45 bg-[rgb(var(--card))] px-3 py-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-primary text-xs" onClick={onConfirm}>
            Passt so
          </button>
          <button type="button" className="btn-secondary text-xs" onClick={onEdit}>
            Einordnung ändern
          </button>
          <Link href={ctaHref} className="btn-secondary text-xs">
            Dossier/Abstimmungen anzeigen
          </Link>
          <button type="button" className="btn-secondary text-xs" onClick={onOpenNewAnlassraum}>
            Neuen Anlassraum vorschlagen
          </button>
        </div>
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

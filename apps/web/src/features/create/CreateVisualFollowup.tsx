"use client";

import * as React from "react";
import Link from "next/link";
import {
  buildCreateVisualSections,
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

function resolveSuggestionBadge(kind: CreateConnectionSuggestion["kind"]): string {
  if (kind === "dossier") return "Dossier";
  if (kind === "vote") return "Abstimmung";
  if (kind === "anlassraum") return "Anlassraum";
  if (kind === "new_anlassraum") return "Neuer Anlassraum";
  return "Thema";
}

function resolveSuggestionCta(kind: CreateConnectionSuggestion["kind"]): string {
  if (kind === "dossier") return "Dossier öffnen";
  if (kind === "vote") return "Claims/Abstimmungen prüfen";
  if (kind === "anlassraum") return "Anlassraum ansehen";
  if (kind === "new_anlassraum") return "Vorschlagen";
  return "Dossierkontext öffnen";
}

function resolveStanceLabel(
  value: ReturnType<typeof deriveDominantUnderstandingStance>,
): string {
  if (value === "eher dafür") return "eher dafür";
  if (value === "eher dagegen") return "eher dagegen";
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

function resolveAssistantLead(params: {
  summary: string;
  rootTopic: string;
  statement: string;
}): string {
  const summary = params.summary.trim();
  if (summary.length > 0) return summary;
  if (params.statement.trim().length > 0) return `Ich erkenne darin vor allem ${params.statement.trim()}.`;
  return `Ich erkenne darin vor allem einen Beitrag zum Thema ${params.rootTopic}.`;
}

function sortSuggestions(
  suggestions: CreateConnectionSuggestion[],
): CreateConnectionSuggestion[] {
  const priority: Record<CreateConnectionSuggestion["kind"], number> = {
    dossier: 0,
    topic: 1,
    vote: 2,
    anlassraum: 3,
    new_anlassraum: 4,
  };
  return [...suggestions].sort((a, b) => priority[a.kind] - priority[b.kind]);
}

function normalizePositionClusterLabel(label: string): string {
  if (label.trim().length === 0) return "Perspektiv-Cluster";
  return label;
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
  const sections = React.useMemo(() => buildCreateVisualSections(result, 4), [result]);
  const [showCorrectionRow, setShowCorrectionRow] = React.useState(false);
  const [correctionFocus, setCorrectionFocus] = React.useState<string | null>(null);

  const sortedSuggestions = sortSuggestions(result.suggestions).slice(0, 4);
  const dossierSuggestion = sortedSuggestions.find((item) => item.kind === "dossier") ?? null;
  const voteSuggestion = sortedSuggestions.find((item) => item.kind === "vote") ?? null;
  const rootTopic = result.understanding.topics[0]?.label ?? "Öffentliches Thema";
  const subTopics = result.understanding.topics.slice(1, 8);
  const claimItems = result.understanding.statements.slice(0, 4);
  const dominantStance = deriveDominantUnderstandingStance(result.understanding);
  const scopeChip = result.understanding.scopes[0] ?? "unclear";
  const assistantLead = resolveAssistantLead({
    summary: result.understanding.summary,
    rootTopic,
    statement: claimItems[0]?.text ?? "",
  });
  const showSectionFlow = result.sourceText.length > 500 || sections.length > 1;
  const showCompactUserBubble = result.sourceText.length <= 380 && !showSectionFlow;

  const primaryActionHref = buildCreateFollowupPrimaryCtaHref({
    ctaHref,
    topics: result.understanding.topics,
    statements: result.understanding.statements,
    suggestions: result.suggestions,
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
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Dein Beitrag</p>
          <p className="mt-2 text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">
            {result.sourceText.slice(0, 260)}
            {result.sourceText.length > 260 ? " …" : ""}
          </p>
        </div>
      ) : (
        <div className="ml-auto max-w-3xl rounded-2xl rounded-tr-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-[rgb(var(--muted))]">Dein Beitrag</p>
          <p className="mt-2 text-sm text-slate-900 md:text-base dark:text-[rgb(var(--fg))]">Dein Beitrag wurde aufgenommen.</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-slate-700 dark:text-[rgb(var(--muted))]">Originaltext anzeigen</summary>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-[rgb(var(--fg))]">
              {result.sourceText}
            </pre>
          </details>
        </div>
      )}

      <article className="mr-auto max-w-5xl rounded-2xl rounded-tl-md border border-cyan-500/25 bg-white px-4 py-4 shadow-sm dark:border-cyan-300/30 dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 dark:text-cyan-200">
          {CREATE_VISUAL_FOLLOWUP_COPY.structureTitle}
        </p>
        <p className="mt-1 text-base font-semibold text-slate-950 md:text-lg dark:text-cyan-50">
          {CREATE_VISUAL_FOLLOWUP_COPY.headline}
        </p>
        <p className="mt-3 text-sm text-slate-900 md:text-base dark:text-cyan-100">{assistantLead}</p>

        <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-50 px-4 py-3 dark:border-cyan-300/40 dark:bg-cyan-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-800 dark:text-cyan-200">
            {CREATE_VISUAL_FOLLOWUP_COPY.coreTitle}
          </p>
          <p className="mt-1 text-base font-semibold text-cyan-950 md:text-lg dark:text-cyan-50">
            {claimItems[0]?.text ?? result.understanding.summary}
          </p>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <span className="rounded-full border border-violet-500/30 bg-violet-50 px-3 py-1 text-sm text-violet-950 dark:border-violet-300/40 dark:bg-violet-500/10 dark:text-violet-50">
            Dossier-Kontext: {rootTopic}
          </span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-sm text-emerald-950 dark:border-emerald-300/40 dark:bg-emerald-500/10 dark:text-emerald-50">
            Haltung: {resolveStanceLabel(dominantStance)}
          </span>
          <span className="rounded-full border border-amber-500/35 bg-amber-50 px-3 py-1 text-sm text-amber-950 dark:border-amber-300/40 dark:bg-amber-500/10 dark:text-amber-50">
            Ebene: {resolveScopeLabel(scopeChip)}
          </span>
        </div>
      </article>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm md:px-4 md:py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.graphTitle}</p>

        <div className="space-y-3 md:hidden">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">1. Beitrag</div>
          <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone("source_text")}`}>
            <p className="text-sm font-semibold">{result.sourceText.slice(0, 140)}{result.sourceText.length > 140 ? " …" : ""}</p>
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">2. Dossier-Kontext / Oberthema</div>
          <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone("dossier")}`}>
            <p className="text-sm font-semibold">{dossierSuggestion?.title ?? rootTopic}</p>
            <p className="mt-1 text-sm opacity-85">{dossierSuggestion?.reason ?? "Das ist der übergeordnete Themenkontext deines Beitrags."}</p>
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">3. Positionen und Claims</div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(result.understanding.positionClusters ?? []).map((cluster) => (
                <span key={cluster.id} className="rounded-full border border-sky-500/30 bg-sky-50 px-2.5 py-1 text-sm text-sky-950 dark:border-sky-300/40 dark:bg-sky-500/10 dark:text-sky-50">
                  {normalizePositionClusterLabel(cluster.label)}
                </span>
              ))}
            </div>
            {claimItems.map((item) => (
              <div key={item.id} className={`rounded-xl border px-3 py-2 ${resolveNodeTone("statement")}`}>
                <p className="text-sm font-semibold">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">4. Abstimmungsfragen / Swipes</div>
          {voteSuggestion ? (
            <div className={`rounded-xl border px-3 py-2 ${resolveNodeTone("vote")}`}>
              <p className="text-sm font-semibold">{voteSuggestion.title}</p>
              <p className="mt-1 text-sm opacity-85">{voteSuggestion.reason}</p>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))] dark:text-slate-200">
              Noch kein klar abstimmbarer Claim erkannt. Du kannst erst Claims prüfen und dann Abstimmungsfragen ableiten.
            </p>
          )}
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">5. Bestätigung</div>
        </div>

        <div className="hidden md:block">
          <div className="pl-4">
            <div className={`max-w-3xl rounded-xl border px-4 py-3 ${resolveNodeTone("source_text")}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Beitrag</p>
              <p className="mt-1 text-sm">{result.sourceText.slice(0, 220)}{result.sourceText.length > 220 ? " …" : ""}</p>
            </div>
            <div className="ml-6 border-l-2 border-cyan-500/30 pl-5 dark:border-cyan-300/35">
              <div className={`mt-3 max-w-3xl rounded-xl border px-4 py-3 ${resolveNodeTone("dossier")}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Dossier-Kontext / Oberthema</p>
                <p className="mt-1 text-base font-semibold">{dossierSuggestion?.title ?? rootTopic}</p>
              </div>

              <div className="ml-6 mt-3 border-l-2 border-violet-500/30 pl-4 dark:border-violet-300/35">
                <div className={`max-w-3xl rounded-xl border px-4 py-3 ${resolveNodeTone("topic")}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Unterthemen</p>
                  <p className="mt-1 text-base font-semibold">{rootTopic}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subTopics.map((topic) => (
                      <span key={topic.id} className="rounded-full border border-violet-500/30 bg-violet-50 px-2.5 py-1 text-sm text-violet-950 dark:border-violet-300/40 dark:bg-violet-500/10 dark:text-violet-50">
                        {topic.label}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div className={`rounded-xl border px-4 py-3 ${resolveNodeTone("statement")}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Positionen und Claims</p>
                    <div className="mt-2 space-y-2">
                      {(result.understanding.positionClusters ?? []).map((cluster) => (
                        <div key={cluster.id} className="rounded-lg border border-sky-500/30 bg-sky-50 px-3 py-2 text-sm text-sky-950 dark:border-sky-300/35 dark:bg-sky-500/10 dark:text-sky-50">
                          <p className="font-semibold">{normalizePositionClusterLabel(cluster.label)}</p>
                          <p className="mt-1 opacity-85">{cluster.reason}</p>
                        </div>
                      ))}
                      {claimItems.map((item) => (
                        <p key={item.id} className="rounded-lg border border-slate-300/45 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-300/30 dark:bg-[rgb(var(--bg))] dark:text-slate-100">
                          {item.text}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className={`rounded-xl border px-4 py-3 ${resolveNodeTone(voteSuggestion ? "vote" : "scope")}`}>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-80">Abstimmungsfragen / Swipes</p>
                    {voteSuggestion ? (
                      <>
                        <p className="mt-2 text-base font-semibold">{voteSuggestion.title}</p>
                        <p className="mt-1 text-sm opacity-85">{voteSuggestion.reason}</p>
                      </>
                    ) : (
                      <>
                        <p className="mt-2 text-sm font-semibold">Noch kein klar abstimmbarer Claim erkannt.</p>
                        <p className="mt-1 text-sm opacity-85">Erst Claims prüfen oder präzisieren, dann als Abstimmungsfrage öffnen.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showSectionFlow ? (
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
          <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">Wir haben deinen Text in {sections.length} Sinnabschnitte gegliedert.</p>
          <div className="space-y-2">
            {sections.map((section, sectionIndex) => (
              <details
                key={section.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
                open={sectionIndex === 0}
              >
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))] md:text-base">
                  {section.label.replace("Abschnitt", "Teil")}
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
        </section>
      ) : null}

      <section className="space-y-3 rounded-xl border border-slate-300/55 bg-white px-3 py-3 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.impactTitle}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
      </section>

      <section className="space-y-3 rounded-xl border border-cyan-500/30 bg-white px-3 py-3 shadow-sm dark:border-cyan-300/45 dark:bg-[rgb(var(--card))] dark:shadow-none">
        <p className="text-sm font-semibold text-[rgb(var(--fg))] md:text-base">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <p className="text-sm text-[rgb(var(--muted))] md:text-base">
          Du kannst bestätigen, einzelne Punkte ändern oder erst Claims und Abstimmungen prüfen.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-emerald-300/45 bg-emerald-50 px-3 py-2 dark:border-emerald-300/35 dark:bg-emerald-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-900 dark:text-emerald-100">
              Kostenlose nächste Schritte
            </p>
            <ul className="mt-1 list-disc pl-4 text-xs text-emerald-900/90 dark:text-emerald-100/90">
              <li>Dossierkontext öffnen und Themenlage prüfen</li>
              <li>Abstimmbare Claims bewusst bestätigen</li>
              <li>Bei Bedarf als neues Thema vorschlagen</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-300/55 bg-slate-50 px-3 py-2 dark:border-slate-300/30 dark:bg-slate-500/10">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-slate-100">
              Zusatzservice (optional)
            </p>
            <p className="mt-1 text-xs text-slate-800 dark:text-slate-200">
              Faktencheck oder Deep Search startest du nur bewusst im nächsten Schritt. Keine automatische Kostenbuchung.
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
          <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={() => openCorrection("Claims")}>
            Claims/Abstimmungen prüfen
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

        {isConfirmed ? (
          <div className="space-y-3 rounded-xl border border-emerald-400/40 bg-emerald-50 px-3 py-3 dark:border-emerald-300/40 dark:bg-emerald-500/10">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              Einordnung bestätigt. Dein Beitrag ist noch nicht veröffentlicht.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href={buildCreateFollowupTargetHref({
                kind: "dossier",
                ctaHref,
                topics: result.understanding.topics,
                statements: result.understanding.statements,
                suggestionTitle: dossierSuggestion?.title ?? rootTopic,
                suggestionHref: dossierSuggestion?.href ?? null,
              })} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                Dossier-Kontext öffnen
              </Link>
              <Link href={primaryActionHref} className="btn-secondary min-h-[40px] px-3 py-2 text-sm">
                Claims/Abstimmungen prüfen
              </Link>
              <button type="button" className="btn-secondary min-h-[40px] px-3 py-2 text-sm" onClick={onOpenNewAnlassraum}>
                Als neues Thema vorschlagen
              </button>
            </div>
          </div>
        ) : null}

        <p className="text-xs text-[rgb(var(--muted))]">{CREATE_VISUAL_FOLLOWUP_COPY.guardrail}</p>
        {actionNotice ? (
          <p className="rounded-lg border border-cyan-500/35 bg-cyan-50 px-3 py-2 text-xs text-cyan-900 dark:border-cyan-300/35 dark:bg-cyan-500/10 dark:text-cyan-100">
            {actionNotice}
          </p>
        ) : null}
      </section>

      <div className="sticky bottom-2 z-10 rounded-xl border border-slate-300/55 bg-white/95 px-3 py-2 shadow-xl shadow-slate-900/10 backdrop-blur md:hidden dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]/95 dark:shadow-black/20">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{CREATE_VISUAL_FOLLOWUP_COPY.confirmTitle}</p>
        <p className="text-xs text-[rgb(var(--muted))]">Keine automatische Stimme oder Veröffentlichung.</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" className="btn-primary min-h-[40px] px-2 py-2 text-sm" onClick={onConfirm}>
            Ja, Struktur übernehmen
          </button>
          <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={() => openCorrection("Thema")}>
            Ein Thema ändern
          </button>
          <Link href={primaryActionHref} className="btn-secondary min-h-[40px] px-2 py-2 text-sm">
            Claims prüfen
          </Link>
          <button type="button" className="btn-secondary min-h-[40px] px-2 py-2 text-sm" onClick={onOpenNewAnlassraum}>
            Neues Thema
          </button>
        </div>
      </div>
    </section>
  );
}

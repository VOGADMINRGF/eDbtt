"use client";

import * as React from "react";
import Link from "next/link";
import type { CreateHandoffDraft } from "@/features/create/createHandoff";
import { buildCreateFactcheckClaimPreview } from "@/features/create/createHandoff";
import {
  publicationVisibilityLabel,
  resolveCreateHandoffVisibilityState,
} from "@features/region/publicationRiskLadder";
import {
  resolveCreateHandoffJourneySummary,
  toneClassForB2CStatus,
} from "@/features/b2cJourney/statusContract";
import { createHandoffReviewStateLabel } from "@/features/review/reviewSurfaceStatusLabels";

type CreateHandoffPanelProps = {
  draft: CreateHandoffDraft;
  title?: string;
  showClaimPreview?: boolean;
  onSaveOnly?: () => void;
};

function readableMatchRelation(value: string): string {
  switch (value) {
    case "new":
      return "neuer möglicher Anschluss";
    case "duplicate_risk":
      return "ähnlicher bestehender Anlass";
    case "needs_review":
      return "vor Freigabe prüfen";
    case "related":
      return "passt thematisch dazu";
    case "supports":
      return "stützt die Aussage";
    case "contradicts":
      return "spricht dagegen";
    default:
      return value.replaceAll("_", " ");
  }
}

function readableClaimKind(value: CreateHandoffDraft["claims"][number]["kind"]): string {
  switch (value) {
    case "factual_claim":
      return "Tatsachenbehauptung";
    case "policy_claim":
      return "Vorschlag";
    case "normative_claim":
      return "Bewertung";
    default:
      return value;
  }
}

function readableJurisdiction(value: CreateHandoffDraft["topicSeed"]["jurisdiction"]): string {
  switch (value) {
    case "kommune":
      return "Kommune";
    case "land":
      return "Land";
    case "bund":
      return "Bund";
    default:
      return "Mehrere Ebenen";
  }
}

function readableSourceStatus(value: CreateHandoffDraft["sourceGrounding"][number]["status"]): string {
  switch (value) {
    case "source_text":
      return "Ausgangstext";
    case "source_excerpt":
      return "Quellenausschnitt";
    case "link_reference":
      return "Link oder Material";
    case "missing":
      return "keine Zusatzquelle";
    default:
      return value;
  }
}

export function CreateHandoffPanel({
  draft,
  title = "Aus deinem Beitrag vorbereitet",
  showClaimPreview = false,
  onSaveOnly,
}: CreateHandoffPanelProps) {
  const preview = showClaimPreview ? buildCreateFactcheckClaimPreview(draft) : null;
  const visibilityState =
    draft.visibilityState ??
    resolveCreateHandoffVisibilityState({ reviewState: draft.reviewState });
  const journeySummary = resolveCreateHandoffJourneySummary({
    ...draft,
    visibilityState,
  });

  return (
    <section className="rounded-3xl border border-cyan-200/70 bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-4 py-4 shadow-[0_18px_42px_rgba(2,6,23,0.06)] dark:border-cyan-300/20 dark:bg-[rgb(var(--card))]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">{title}</p>
          <p className="text-lg font-semibold text-[rgb(var(--fg))]">{draft.plannerResult.plannerCore}</p>
          <p className="text-sm text-[rgb(var(--muted))]">Prüfstatus: {createHandoffReviewStateLabel(draft.reviewState)}</p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Sichtbarkeit: {publicationVisibilityLabel(visibilityState)}
          </p>
        </div>
        <span className="rounded-full border border-cyan-300/50 bg-cyan-500/[0.08] px-3 py-1 text-xs font-semibold text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-500/12 dark:text-cyan-100">
          Bestätigung nötig
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {journeySummary.statusChips.map((chip) => (
          <span
            key={`${draft.id}-${chip.key}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClassForB2CStatus(chip.tone)}`}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Verstanden</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{draft.plannerResult.plannerTopic}</p>
          <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">
            {draft.arguments[0]?.text ?? draft.sourceText}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Geht jetzt weiter nach</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{journeySummary.destinationLabel}</p>
          <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{journeySummary.destinationLead}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Nächster Schritt</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{journeySummary.nextStepTitle}</p>
          <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{journeySummary.nextStepBody}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Review und Veröffentlichung</p>
        <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--fg))]">{journeySummary.reviewLead}</p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Kern</p>
          <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{draft.plannerResult.plannerTopic}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {draft.plannerResult.plannerClusters.slice(0, 5).map((cluster) => (
              <span key={cluster} className="rounded-full border border-violet-300/50 px-2.5 py-1 text-xs text-[rgb(var(--fg))]">
                {cluster}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Mögliche Anschlüsse</p>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--fg))]">
            {draft.graphMatches.matches.slice(0, 5).map((match) => (
              <li key={match.id}>
                {match.label} · {readableMatchRelation(match.relation)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Argumente</p>
          <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
            {draft.arguments.map((argument) => (
              <li key={argument.id}>
                {argument.text} <span className="text-[rgb(var(--muted))]">({argument.stance})</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Prüfbare Behauptungen</p>
          <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
            {draft.claims.map((claim) => (
              <li key={claim.id}>
                {claim.text}
                <span className="ml-2 text-[rgb(var(--muted))]">
                  {readableClaimKind(claim.kind)} · {claim.factcheckEligible ? "prüfbar" : "nicht automatisch prüfbar"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Thema</p>
          <div className="mt-2 space-y-1 text-sm text-[rgb(var(--fg))]">
            <p><span className="font-semibold">Thema:</span> {draft.topicSeed.topicLabel}</p>
            <p><span className="font-semibold">Ebene:</span> {readableJurisdiction(draft.topicSeed.jurisdiction)}</p>
            <p className="text-[rgb(var(--muted))]">
              Review-first anschlussfähig für Themenaufbau, Feed-Weiterführung und adminseitigen Themenradar-Import.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Weiterbearbeiten</p>
          <p className="mt-2 text-sm text-[rgb(var(--fg))]">
            Du kannst den Arbeitsstand jederzeit wieder in `/create` öffnen, anpassen und erneut in die Review-Kette geben.
          </p>
          <div className="mt-3">
            <Link
              href={draft.resumeHref}
              className="inline-flex items-center justify-center rounded-full border border-cyan-300/50 px-3 py-1 text-xs font-semibold text-cyan-900 dark:border-cyan-300/30 dark:text-cyan-100"
            >
              In /create weiter bearbeiten
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Offene Fragen</p>
          <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
            {draft.openQuestions.map((question) => (
              <li key={question.id}>
                {question.question}
                {question.requiredBeforePublish ? <span className="ml-2 text-[rgb(var(--muted))]">vor Veröffentlichung klären</span> : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Quellenstatus</p>
          <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--fg))]">
            {draft.sourceGrounding.map((source) => (
              <li key={source.id}>
                <div>
                  <span>
                    {source.label} <span className="text-[rgb(var(--muted))]">({readableSourceStatus(source.status)})</span>
                  </span>
                  {source.detail ? (
                    <p className="mt-1 break-all text-xs text-[rgb(var(--muted))]">{source.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {preview ? (
        <div className="mt-4 rounded-2xl border border-fuchsia-200/70 bg-fuchsia-50/70 px-3 py-3 dark:border-fuchsia-300/20 dark:bg-fuchsia-500/10">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-900 dark:text-fuchsia-100">Claim-Auswahl</p>
          <p className="mt-1 text-sm text-fuchsia-900 dark:text-fuchsia-100">
            Recherche startet nicht automatisch. Erst nach Bestätigung wird entschieden, welche Claims geprüft werden.
          </p>
          <ul className="mt-2 space-y-1 text-sm text-fuchsia-950 dark:text-fuchsia-50">
            {preview.eligibleClaims.map((claim) => (
              <li key={claim.id}>Prüfbar: {claim.text}</li>
            ))}
            {preview.blockedClaims.map((claim) => (
              <li key={claim.id}>Nicht automatisch prüfen: {claim.text}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {journeySummary.followupLinks.map((link) => (
          <Link
            key={`${draft.id}-${link.href}-${link.label}`}
            href={link.href}
            className="inline-flex items-center justify-center rounded-full border border-cyan-300/50 px-3 py-1.5 text-xs font-semibold text-cyan-900 dark:border-cyan-300/30 dark:text-cyan-100"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200/80 px-3 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Keine automatische Veröffentlichung
        </span>
        <span className="rounded-full border border-slate-200/80 px-3 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Keine automatische Stimme
        </span>
        <span className="rounded-full border border-slate-200/80 px-3 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Kein stiller Graph-Merge
        </span>
        {onSaveOnly ? (
          <button type="button" onClick={onSaveOnly} className="rounded-full border border-cyan-300/50 px-3 py-1 text-xs font-semibold text-cyan-900 dark:border-cyan-300/30 dark:text-cyan-100">
            Nur speichern
          </button>
        ) : null}
      </div>
    </section>
  );
}

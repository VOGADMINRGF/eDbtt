"use client";

import type { LiveReportHandoff } from "@/features/campaign/liveReportHandoff";
import type { LiveTrustLabelTone } from "@/features/campaign/liveTrustLabels";

type LiveReportHandoffClientProps = {
  campaignId: string;
  report: LiveReportHandoff | null;
};

const REPORT_STATUS_LABEL: Record<LiveReportHandoff["status"], string> = {
  draft: "Entwurf",
  ready_for_review: "Review nötig",
  closed: "Geschlossener Kontext",
};

function trustLabelClassName(tone: LiveTrustLabelTone) {
  switch (tone) {
    case "pending":
      return "border-sky-300/60 bg-sky-50/90 text-sky-900 dark:border-sky-400/35 dark:bg-sky-500/10 dark:text-sky-100";
    case "caution":
      return "border-amber-300/60 bg-amber-50/90 text-amber-900 dark:border-amber-400/35 dark:bg-amber-500/10 dark:text-amber-100";
    case "verified":
      return "border-emerald-300/60 bg-emerald-50/90 text-emerald-900 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-100";
    default:
      return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]/82";
  }
}

export default function LiveReportHandoffClient({
  campaignId,
  report,
}: LiveReportHandoffClientProps) {
  if (!report) {
    return (
      <section
        className="landing-canvas public-canvas public-start-canvas"
        data-testid="live-report-handoff-missing"
      >
        <div className="landing-shell public-shell public-start-shell py-12">
          <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
            <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
              Live Report
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))]">
              Report-Entwurf nicht gefunden
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--fg))]/80 sm:text-base">
              Für diese `campaignId` liegt aktuell kein sicherer Report-Handoff vor. Prüfe zuerst
              das Host-Cockpit oder den Kampagnenkontext.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/live/${encodeURIComponent(campaignId)}/host`}
                className="landing-cta-primary public-cta-primary vog-btn-brand"
              >
                Host-Cockpit öffnen
              </a>
              <a href={`/live/${encodeURIComponent(campaignId)}`} className="vog-btn-secondary landing-cta-secondary">
                Campaign Entry öffnen
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="landing-canvas public-canvas public-start-canvas"
      data-testid="live-report-handoff"
      data-live-campaign-id={report.campaignId}
      data-live-report-status={report.status}
    >
      <div className="landing-shell public-shell public-start-shell py-10">
        <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="landing-soft-pill public-soft-pill">Report-Entwurf</span>
              <span className="landing-soft-pill public-soft-pill">{REPORT_STATUS_LABEL[report.status]}</span>
              <span className="landing-soft-pill public-soft-pill">Nicht veröffentlicht</span>
              {report.fixture ? (
                <span className="landing-soft-pill public-soft-pill">Preview-Readmodel</span>
              ) : null}
            </div>
            <div>
              <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
                Live Report Handoff
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
                {report.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--fg))]/82 sm:text-base">
                Aus dem Host-Cockpit abgeleiteter review-first Report-Arbeitsstand. Kein Publish,
                kein Dossier, kein Anlassraum und kein Graph-Merge ohne separaten Review-Pfad.
              </p>
            </div>
          </div>

          <dl className="public-start-preview-grid mt-6" data-testid="live-report-handoff-summary">
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Signale
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">{report.summary.signalCount}</dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Review nötig
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {report.summary.reviewRecommendedCount}
              </dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Offene Fragen
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {report.summary.openQuestionsCount}
              </dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Quellenlage offen
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {report.summary.sourceOpenCount}
              </dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Gegenpositionen
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {report.summary.counterpointCount}
              </dd>
            </div>
          </dl>

          <dl className="public-start-preview-grid mt-6">
            {report.contextLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Kontext</dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{report.contextLabel}</dd>
              </div>
            ) : null}
            {report.regionLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Ort / Region</dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{report.regionLabel}</dd>
              </div>
            ) : null}
            {report.organizerLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Träger</dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{report.organizerLabel}</dd>
              </div>
            ) : null}
            {report.sourceLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Herkunft</dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{report.sourceLabel}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 space-y-4">
            {report.sections.map((section) => (
              <article
                key={section.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                data-live-report-section={section.id}
              >
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{section.title}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.trustLabels.map((label) => (
                    <span
                      key={`${section.id}-${label.id}`}
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${trustLabelClassName(label.tone)}`}
                      title={label.description}
                      data-live-report-trust-label={label.id}
                    >
                      {label.label}
                    </span>
                  ))}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[rgb(var(--fg))]/82">
                  {section.body}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Nächste Schritte</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {report.recommendedNextActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  disabled
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] opacity-80"
                  data-live-report-action={action.id}
                  data-guarded="true"
                >
                  {action.label}
                </button>
              ))}
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--fg))]/82">
              {report.recommendedNextActions.map((action) => (
                <li key={`desc-${action.id}`}>
                  {action.label}: {action.description} guarded: {String(action.guarded)}.
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]/82">
            <p className="font-semibold text-[rgb(var(--fg))]">Guardrails</p>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
              {report.guardrails.map((guardrail) => (
                <li key={guardrail}>{guardrail}.</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

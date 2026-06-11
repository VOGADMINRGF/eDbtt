"use client";

import type {
  LiveHostCockpit,
  LiveHostCockpitSignal,
  LiveHostSignalStatus,
  LiveHostSuggestedAction,
} from "@/features/campaign/liveHostCockpit";
import type { LiveTrustLabelTone } from "@/features/campaign/liveTrustLabels";

type LiveHostCockpitClientProps = {
  campaignId: string;
  cockpit: LiveHostCockpit | null;
};

const STATUS_LABEL: Record<LiveHostSignalStatus, string> = {
  draft: "Entwurf",
  review_pending: "Review ausstehend",
  needs_clarification: "Rückfrage nötig",
  ready_for_review: "Bereit zur Prüfung",
};

const ACTION_LABEL: Record<LiveHostSuggestedAction, string> = {
  review: "Prüfen",
  bundle: "Bündeln",
  ask_clarification: "Rückfrage vorbereiten",
  prepare_report: "Für Bericht vormerken",
  watch: "Beobachten",
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

function renderSignalCard(signal: LiveHostCockpitSignal) {
  return (
    <article
      key={signal.id}
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
      data-live-host-signal={signal.id}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="landing-soft-pill public-soft-pill">
          {signal.kind === "question"
            ? "Frage"
            : signal.kind === "source"
              ? "Quelle"
              : signal.kind === "counterpoint"
                ? "Gegenposition"
                : "Beitrag"}
        </span>
        <span className="landing-soft-pill public-soft-pill">{STATUS_LABEL[signal.status]}</span>
      </div>
      <div className="mt-3 space-y-1">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</h2>
        <p className="text-sm leading-7 text-[rgb(var(--fg))]/82">{signal.excerpt}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {signal.trustLabels.map((label) => (
          <span
            key={`${signal.id}-${label.id}`}
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${trustLabelClassName(label.tone)}`}
            title={label.description}
            data-live-host-trust-label={label.id}
          >
            {label.label}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))]">
          {ACTION_LABEL[signal.suggestedAction]}
        </span>
      </div>
    </article>
  );
}

export default function LiveHostCockpitClient({
  campaignId,
  cockpit,
}: LiveHostCockpitClientProps) {
  if (!cockpit) {
    return (
      <section
        className="landing-canvas public-canvas public-start-canvas"
        data-testid="live-host-cockpit-missing"
      >
        <div className="landing-shell public-shell public-start-shell py-12">
          <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
            <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
              Live Host
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))]">
              Host-Cockpit nicht gefunden
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--fg))]/80 sm:text-base">
              Für diese `campaignId` liegt aktuell kein sicherer Host-Kontext vor. Prüfe zuerst
              den Kampagnenlink oder gehe über die bestehenden review-first Einstiege weiter.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={`/live/${encodeURIComponent(campaignId)}`} className="landing-cta-primary public-cta-primary vog-btn-brand">
                Campaign Entry öffnen
              </a>
              <a href="/start" className="vog-btn-secondary landing-cta-secondary">
                Über Start weiterarbeiten
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const openQuestions = cockpit.signals.filter((signal) => signal.kind === "question");
  const reviewHints = cockpit.signals.filter((signal) =>
    signal.trustLabels.some(
      (label) =>
        label.id === "review_recommended" ||
        label.id === "review_pending" ||
        label.id === "source_open",
    ),
  );
  const nextActions = Array.from(new Set(cockpit.signals.map((signal) => ACTION_LABEL[signal.suggestedAction])));

  return (
    <section
      className="landing-canvas public-canvas public-start-canvas"
      data-testid="live-host-cockpit"
      data-live-campaign-id={cockpit.campaignId}
      data-live-campaign-status={cockpit.status}
    >
      <div className="landing-shell public-shell public-start-shell py-10">
        <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="landing-soft-pill public-soft-pill">Host-Cockpit</span>
              <span className="landing-soft-pill public-soft-pill">{cockpit.statusLabel}</span>
              {cockpit.fixture ? (
                <span className="landing-soft-pill public-soft-pill">Preview-Readmodel</span>
              ) : null}
            </div>
            <div>
              <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
                Moderationssicht
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
                {cockpit.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--fg))]/82 sm:text-base">
                {cockpit.description}
              </p>
            </div>
          </div>

          <dl className="public-start-preview-grid mt-6" data-testid="live-host-cockpit-summary">
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Eingänge
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {cockpit.summary.incomingCount}
              </dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Prüfung empfohlen
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {cockpit.summary.reviewRecommendedCount}
              </dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Offene Fragen
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {cockpit.summary.openQuestionsCount}
              </dd>
            </div>
            <div className="landing-proof-column">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Quellenlage offen
              </dt>
              <dd className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                {cockpit.summary.sourceOpenCount}
              </dd>
            </div>
          </dl>

          <dl className="public-start-preview-grid mt-6">
            {cockpit.contextLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Kontext
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{cockpit.contextLabel}</dd>
              </div>
            ) : null}
            {cockpit.regionLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Ort / Region
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{cockpit.regionLabel}</dd>
              </div>
            ) : null}
            {cockpit.organizerLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Träger
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{cockpit.organizerLabel}</dd>
              </div>
            ) : null}
            {cockpit.sourceLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Herkunft
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{cockpit.sourceLabel}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Eingang / neue Beiträge</h2>
              <div className="mt-3 space-y-3">{cockpit.signals.map(renderSignalCard)}</div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Offene Fragen</h2>
                {openQuestions.length === 0 ? (
                  <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
                    Aktuell liegen keine offenen Fragen vor, die separat gebündelt werden müssen.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--fg))]/82">
                    {openQuestions.map((signal) => (
                      <li key={`open-question-${signal.id}`}>{signal.title}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Prüfhinweise</h2>
                {reviewHints.length === 0 ? (
                  <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
                    Keine zusätzlichen Prüfhinweise sichtbar.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--fg))]/82">
                    {reviewHints.map((signal) => (
                      <li key={`review-hint-${signal.id}`}>
                        {signal.title}:{" "}
                        {signal.trustLabels
                          .filter((label) =>
                            label.id === "review_recommended" ||
                            label.id === "review_pending" ||
                            label.id === "source_open",
                          )
                          .map((label) => label.label)
                          .join(" · ")}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Nächste Schritte</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {nextActions.map((action) => (
                    <span
                      key={`next-action-${action}`}
                      className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))]"
                    >
                      {action}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
                  Das Cockpit bleibt review-first: keine automatische Veröffentlichung und keine
                  produktiven Schreibpfade aus dieser Oberfläche.
                </p>
                <div className="mt-3">
                  <a
                    href={`/live/${encodeURIComponent(cockpit.campaignId)}/report`}
                    className="vog-btn-secondary landing-cta-secondary"
                  >
                    Report-Entwurf ansehen
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]/82">
            <p className="font-semibold text-[rgb(var(--fg))]">Guardrails</p>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
              {cockpit.guardrails.map((guardrail) => (
                <li key={guardrail}>{guardrail}.</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

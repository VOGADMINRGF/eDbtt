"use client";

import {
  createLiveCampaignStartDraft,
  type LiveCampaignEntryModel,
} from "@/features/campaign/liveCampaignEntryClient";
import { getLiveTrustLabels, type LiveTrustLabelTone } from "@/features/campaign/liveTrustLabels";
import { saveStartDraftContext, type StartDraftOrigin } from "@/features/start/startDraftContext";

type LiveCampaignEntryClientProps = {
  campaignId: string;
  campaign: LiveCampaignEntryModel | null;
  origin: StartDraftOrigin;
  sessionId?: string;
};

function buildCampaignQuery(campaignId: string, sessionId?: string) {
  const params = new URLSearchParams({ campaign: campaignId });
  if (sessionId) params.set("session", sessionId);
  return params.toString();
}

export default function LiveCampaignEntryClient({
  campaignId,
  campaign,
  origin,
  sessionId,
}: LiveCampaignEntryClientProps) {
  const campaignQuery = buildCampaignQuery(campaignId, sessionId);
  const ctaStackClassName =
    "inline-flex w-full items-center justify-center sm:w-auto";

  function persistDraft(mode: "contribution" | "question") {
    if (!campaign || campaign.status === "closed") return;
    const draft = createLiveCampaignStartDraft(campaign, mode, origin);
    saveStartDraftContext(draft);
  }

  if (!campaign) {
    return (
      <section
        className="landing-canvas public-canvas public-start-canvas"
        data-testid="live-campaign-entry-missing"
      >
        <div className="landing-shell public-shell public-start-shell py-12">
          <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
            <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
              Live-Kampagne
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))]">
              Live-Kampagne nicht gefunden
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--fg))]/80 sm:text-base">
              Dieser Kampagnenlink ist nicht mehr verfügbar oder wurde noch nicht vorbereitet. Du
              kannst trotzdem über die bestehenden review-first Einstiege weiterarbeiten.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="/start"
                className={`landing-cta-primary public-cta-primary vog-btn-brand ${ctaStackClassName}`}
              >
                Über Start einsteigen
              </a>
              <a
                href="/themen"
                className={`vog-btn-secondary landing-cta-secondary ${ctaStackClassName}`}
              >
                Themen ansehen
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const trustLabels = getLiveTrustLabels({
    ...campaign.trustSignal,
    contributionKind: "contribution",
    origin,
  });
  const ctaBlocked = campaign.status === "closed";
  const livePathBase = `/live/${encodeURIComponent(campaign.campaignId)}`;

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

  return (
    <section
      className="landing-canvas public-canvas public-start-canvas"
      data-testid="live-campaign-entry"
      data-live-campaign-id={campaign.campaignId}
      data-live-campaign-status={campaign.status}
    >
      <div className="landing-shell public-shell public-start-shell py-10">
        <div className="landing-section public-section public-reader-grid rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="landing-soft-pill public-soft-pill">{campaign.statusLabel}</span>
              {campaign.fixture ? (
                <span className="landing-soft-pill public-soft-pill">Demo-/Fixture-Kontext</span>
              ) : null}
              {origin === "campaign_qr" ? (
                <span className="landing-soft-pill public-soft-pill">QR-Einstieg</span>
              ) : null}
            </div>

            <div>
              <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
                Live-Kampagne
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
                {campaign.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--fg))]/82 sm:text-base">
                {campaign.description}
              </p>
            </div>

            <div
              className="flex flex-wrap gap-2"
              data-testid="live-campaign-trust-labels"
            >
              {trustLabels.map((trustLabel) => (
                <span
                  key={trustLabel.id}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${trustLabelClassName(trustLabel.tone)}`}
                  title={trustLabel.description}
                  data-live-trust-label={trustLabel.id}
                >
                  {trustLabel.label}
                </span>
              ))}
            </div>

            <p className="max-w-3xl text-sm font-semibold text-[rgb(var(--fg))]">
              {campaign.statusNote}
            </p>
          </div>

          <dl className="public-start-preview-grid mt-6">
            {campaign.contextLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Kontext
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{campaign.contextLabel}</dd>
              </div>
            ) : null}
            {campaign.regionLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Ort / Region
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{campaign.regionLabel}</dd>
              </div>
            ) : null}
            {campaign.organizerLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Träger
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{campaign.organizerLabel}</dd>
              </div>
            ) : null}
            {campaign.sourceLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Herkunft
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{campaign.sourceLabel}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {ctaBlocked ? (
              <span
                className={`landing-cta-primary public-cta-primary vog-btn-brand ${ctaStackClassName} opacity-70`}
              >
                Neue Beiträge sind hier gerade geschlossen
              </span>
            ) : (
              <>
                <a
                  href={`/create?startDraft=1&${campaignQuery}`}
                  className={`landing-cta-primary public-cta-primary vog-btn-brand ${ctaStackClassName}`}
                  data-requires-privacy-gate="true"
                  onClick={() => persistDraft("contribution")}
                >
                  Beitrag einbringen
                </a>
                <a
                  href={`/themen?startDraft=1&${campaignQuery}`}
                  className={`vog-btn-secondary landing-cta-secondary ${ctaStackClassName}`}
                  data-requires-privacy-gate="true"
                  onClick={() => persistDraft("question")}
                >
                  Frage stellen
                </a>
              </>
            )}
            <a
              href="/themen"
              className={`vog-btn-secondary landing-cta-secondary ${ctaStackClassName}`}
            >
              Bestehende Themen ansehen
            </a>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
              Weitere Live-Oberflächen
            </h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={`${livePathBase}/host`}
                className={`vog-btn-secondary landing-cta-secondary ${ctaStackClassName}`}
              >
                Host-Cockpit öffnen
              </a>
              <a
                href={`${livePathBase}/report`}
                className={`vog-btn-secondary landing-cta-secondary ${ctaStackClassName}`}
              >
                Report-Entwurf öffnen
              </a>
              <a
                href={`${livePathBase}/media-kit`}
                className={`vog-btn-secondary landing-cta-secondary ${ctaStackClassName}`}
              >
                Media-Kit ansehen
              </a>
            </div>
            <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
              Host-Cockpit, Report-Entwurf und Media-Kit bleiben in diesem Slice read-only oder
              Vorschaupfade. Es gibt kein Auto-Publish und keine versteckten Folgeaktionen.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]/82">
            <p className="font-semibold text-[rgb(var(--fg))]">
              Live-Einstieg ist nur Vorschau und Draft-Handoff.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
              <li>Keine automatische Veröffentlichung.</li>
              <li>Keine Stimme aus dem Entwurf.</li>
              <li>Kein Auto-Graph, kein Auto-Dossier, kein Auto-Anlassraum.</li>
              <li>Keine Quellenprüfung ohne bestehenden Gate-Pfad.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

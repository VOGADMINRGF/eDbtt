import type { LiveMediaKit } from "@/features/campaign/liveMediaKit";
import type { LiveTrustLabelTone } from "@/features/campaign/liveTrustLabels";

type LiveMediaKitClientProps = {
  campaignId: string;
  mediaKit: LiveMediaKit | null;
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

function renderTrustLabels(
  labels: LiveMediaKit["trustLabels"],
  attributeName: "data-live-media-trust-label" | "data-live-media-embed-trust-label",
) {
  return labels.map((label) => (
    <span
      key={`${attributeName}-${label.id}`}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${trustLabelClassName(label.tone)}`}
      title={label.description}
      {...{ [attributeName]: label.id }}
    >
      {label.label}
    </span>
  ));
}

export default function LiveMediaKitClient({
  campaignId,
  mediaKit,
}: LiveMediaKitClientProps) {
  if (!mediaKit) {
    return (
      <section
        className="landing-canvas public-canvas public-start-canvas"
        data-testid="live-media-kit-missing"
      >
        <div className="landing-shell public-shell public-start-shell py-12">
          <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
            <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
              Live Media-Kit
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))]">
              Media-Kit-Vorschau nicht gefunden
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--fg))]/80 sm:text-base">
              Für diese `campaignId` liegt aktuell kein sicheres Media-Kit vor. Prüfe zuerst den
              Live-Einstieg oder das Host-Cockpit.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`/live/${encodeURIComponent(campaignId)}`}
                className="landing-cta-primary public-cta-primary vog-btn-brand"
              >
                Live-Einstieg öffnen
              </a>
              <a
                href={`/live/${encodeURIComponent(campaignId)}/host`}
                className="vog-btn-secondary landing-cta-secondary"
              >
                Host-Cockpit öffnen
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
      data-testid="live-media-kit"
      data-live-campaign-id={mediaKit.campaignId}
      data-live-media-kit-status={mediaKit.status}
    >
      <div className="landing-shell public-shell public-start-shell py-10">
        <div className="landing-section public-section rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="landing-soft-pill public-soft-pill">Media-Kit</span>
              <span className="landing-soft-pill public-soft-pill">{mediaKit.statusLabel}</span>
              <span className="landing-soft-pill public-soft-pill">Vorschau / Entwurf</span>
              <span className="landing-soft-pill public-soft-pill">Keine Drittanbieter-Tracker</span>
              {mediaKit.fixture ? (
                <span className="landing-soft-pill public-soft-pill">Preview-Readmodel</span>
              ) : null}
            </div>

            <div>
              <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.2em]">
                Partner- und Medienvorschau
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
                {mediaKit.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[rgb(var(--fg))]/82 sm:text-base">
                {mediaKit.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2" data-testid="live-media-kit-trust-labels">
              {renderTrustLabels(mediaKit.trustLabels, "data-live-media-trust-label")}
            </div>
          </div>

          <dl className="public-start-preview-grid mt-6">
            {mediaKit.contextLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Kontext
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{mediaKit.contextLabel}</dd>
              </div>
            ) : null}
            {mediaKit.regionLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Ort / Region
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{mediaKit.regionLabel}</dd>
              </div>
            ) : null}
            {mediaKit.organizerLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Träger
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{mediaKit.organizerLabel}</dd>
              </div>
            ) : null}
            {mediaKit.sourceLabel ? (
              <div className="landing-proof-column">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Herkunft
                </dt>
                <dd className="mt-2 text-sm text-[rgb(var(--fg))]">{mediaKit.sourceLabel}</dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <article
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              data-live-media-section="links"
            >
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
                Link- und QR-Vorschau
              </h2>
              <dl className="mt-3 space-y-3 text-sm text-[rgb(var(--fg))]/82">
                <div>
                  <dt className="font-semibold text-[rgb(var(--fg))]">Kampagnenlink</dt>
                  <dd className="mt-1 break-all">
                    <a href={mediaKit.campaignUrl} className="underline underline-offset-4">
                      {mediaKit.campaignUrl}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[rgb(var(--fg))]">QR-/Kurzlink-Ziel</dt>
                  <dd className="mt-1 break-all">
                    <a href={mediaKit.qrUrl} className="underline underline-offset-4">
                      {mediaKit.qrUrl}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[rgb(var(--fg))]">Host-Link</dt>
                  <dd className="mt-1 break-all">
                    <a href={mediaKit.hostUrl} className="underline underline-offset-4">
                      {mediaKit.hostUrl}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-[rgb(var(--fg))]">Report-Link</dt>
                  <dd className="mt-1 break-all">
                    <a href={mediaKit.reportUrl} className="underline underline-offset-4">
                      {mediaKit.reportUrl}
                    </a>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
                Alle Links bleiben in diesem Slice relative Vorschaupfade. Es gibt keine neue
                QR-Generierung, keinen externen Redirect-Service und kein Drittanbieter-Skript.
              </p>
            </article>

            <article
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              data-live-media-section="embed-preview"
            >
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Artikel-Embed-Preview</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {renderTrustLabels(
                  mediaKit.embedPreview.statusLabels,
                  "data-live-media-embed-trust-label",
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[rgb(var(--fg))]">
                {mediaKit.embedPreview.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-[rgb(var(--fg))]/82">
                {mediaKit.embedPreview.description}
              </p>
              <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                CTA: {mediaKit.embedPreview.callToAction}
              </p>
            </article>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <article
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              data-live-media-section="newsletter"
            >
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Newsletter-Link-Text</h2>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Betreff
              </p>
              <p className="mt-1 text-sm text-[rgb(var(--fg))]">{mediaKit.newsletterSnippet.subject}</p>
              <pre className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[rgb(var(--fg))]/82">
                {mediaKit.newsletterSnippet.body}
              </pre>
            </article>

            <article
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              data-live-media-section="social"
            >
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Social-Karten-Text</h2>
              <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                {mediaKit.socialSnippet.title}
              </p>
              <p className="mt-3 text-sm leading-7 text-[rgb(var(--fg))]/82">
                {mediaKit.socialSnippet.body}
              </p>
            </article>

            <article
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              data-live-media-section="print"
            >
              <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Print-/Poster-Hinweis</h2>
              <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">
                {mediaKit.printSnippet.headline}
              </p>
              <p className="mt-3 text-sm leading-7 text-[rgb(var(--fg))]/82">
                {mediaKit.printSnippet.body}
              </p>
              <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
                {mediaKit.printSnippet.qrInstruction}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Oberflächen öffnen</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <a href={mediaKit.campaignUrl} className="landing-cta-primary public-cta-primary vog-btn-brand">
                Live-Einstieg öffnen
              </a>
              <a href={mediaKit.qrUrl} className="vog-btn-secondary landing-cta-secondary">
                QR-Vorschau öffnen
              </a>
              <a href={mediaKit.hostUrl} className="vog-btn-secondary landing-cta-secondary">
                Host-Cockpit öffnen
              </a>
              <a href={mediaKit.reportUrl} className="vog-btn-secondary landing-cta-secondary">
                Report-Entwurf öffnen
              </a>
            </div>
            <p className="mt-3 text-sm text-[rgb(var(--fg))]/82">
              Newsletter-, Social- und Print-Texte bleiben Entwurfsbausteine. Dieser Slice löst
              keinen Versand, kein Posting und keinen Embed-Rollout aus.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]/82">
            <p className="font-semibold text-[rgb(var(--fg))]">Guardrails</p>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
              {mediaKit.guardrails.map((guardrail) => (
                <li key={guardrail}>{guardrail}.</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildShareMetadata } from "@/features/share/metadata";
import SocialOutputPreviewPanel from "@/components/share/SocialOutputPreviewPanel";
import {
  buildNeutralCarouselDraft,
  buildShareOutputAsset,
  buildStreamPreparationOutput,
} from "@features/share/socialOutputContract";
import { BRAND } from "@/lib/brand";
import { buildStreamPublicRuntime, buildStreamShareContext } from "@features/stream/publicRuntime";
import StreamPublicInputPanel from "../StreamPublicInputPanel";
import RundenShareActions from "@/app/runden/RundenShareActions";
import { getStreamPublicStatusMeta } from "@features/stream/statusContract";

export const dynamic = "force-dynamic";

function isVideoUrl(value: string) {
  return /\.(mp4|webm|m3u8)(\?|#|$)/i.test(value);
}

function isEmbedUrl(value: string) {
  return (
    value.includes("youtube.com/embed") ||
    value.includes("player.twitch.tv") ||
    value.includes("player.vimeo.com")
  );
}

function toneClass(tone: ReturnType<typeof getStreamPublicStatusMeta>["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "danger":
      return "border-rose-300 bg-rose-50 text-rose-900";
    case "info":
      return "border-sky-300 bg-sky-50 text-sky-900";
    case "neutral":
    default:
      return "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]";
  }
}

function formatDateTime(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const runtime = await buildStreamPublicRuntime(slug);
  if (!runtime) {
    return {
      title: "Stream nicht gefunden",
      description: "Der angefragte Stream ist nicht verfügbar.",
      robots: { index: false },
    };
  }
  return buildShareMetadata({
    objectType: "stream",
    pathOrUrl: `/stream/${runtime.session.slugOrId}`,
    title: `${runtime.session.title} · Event-Beteiligung`,
    description:
      runtime.session.description ??
      "Öffentlicher Event- und Streamkontext mit reviewpflichtigen Fragen, Quellen und Perspektiven.",
    ogType: "video.other",
  });
}

export default async function StreamDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const runtime = await buildStreamPublicRuntime(slug);
  if (!runtime) return notFound();

  const canonicalPath = `/stream/${runtime.session.slugOrId}`;
  const streamPreparation = buildStreamPreparationOutput({
    title: runtime.session.title,
    summary: runtime.session.description,
    highlights: [
      runtime.context.anlassraumTitle ? `Anlassraum: ${runtime.context.anlassraumTitle}` : null,
      runtime.recap.dossierUpdateHint,
      runtime.recap.socialDraftHint,
    ].filter((value): value is string => Boolean(value)),
    transcriptSnippets: runtime.participation.items.slice(0, 2).map((item) => item.text),
    quoteCandidate: runtime.recap.latestFollowUp?.note ?? runtime.session.liveBoard?.summary ?? null,
  });
  const shareAsset = buildShareOutputAsset({
    baseUrl: BRAND.baseUrl,
    canonicalPathOrUrl: canonicalPath,
    objectType: "stream",
    title: runtime.session.title,
    subtitle:
      runtime.session.description ??
      "Öffentlicher Event-Kontext mit reviewpflichtiger Beteiligung und Anschluss an Anlassraum und Dossier.",
    lane: "standard",
    verificationMode: "none",
    researchUsed: "none",
    sealEligible: false,
    sealGranted: false,
    topic: runtime.session.topicKey ?? null,
    region: runtime.session.regionCode ?? null,
    neutralCtaLabel: "Event öffnen",
    deepLinkPath: canonicalPath,
  });
  const shareCarousel = buildNeutralCarouselDraft(shareAsset, {
    highlights: [
      runtime.session.statusLabel,
      runtime.context.anlassraumTitle ? `Beteiligung im Anlassraum` : null,
      runtime.context.dossierHref ? "Dossier-Kontext verfügbar" : null,
    ].filter((value): value is string => Boolean(value)),
  });
  const shareContext = buildStreamShareContext(runtime);
  const eventInputBaseHref = canonicalPath;
  const resultHref =
    runtime.context.anlassraumHref ??
    runtime.context.dossierHref ??
    runtime.context.swipesHref ??
    canonicalPath;
  const resultLabel = runtime.context.anlassraumHref
    ? "Ergebnis später im Anlassraum sehen"
    : runtime.context.dossierHref
      ? "Ergebnis später im Dossier sehen"
      : "Ergebnis später sehen";

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl space-y-8 px-4 py-12">
        <header className="space-y-4">
          <Link
            href="/stream"
            className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600"
          >
            Zur Stream-Übersicht
          </Link>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-[rgb(var(--fg))] md:text-4xl">
              {runtime.session.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-[rgb(var(--muted))] md:text-lg">
              {runtime.session.description ??
                "Dieser Stream ist vor allem eine öffentliche Beteiligungsfläche: Fragen, Quellen und Perspektiven gehen reviewpflichtig in Anlassraum, Dossier und Nachbereitung ein."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className={`rounded-full border px-3 py-1 font-semibold ${toneClass(runtime.session.statusTone)}`}>
              {runtime.session.statusLabel}
            </span>
            {runtime.session.topicKey ? (
              <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
                Thema: {runtime.session.topicKey}
              </span>
            ) : null}
            {runtime.session.regionCode ? (
              <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
                Region: {runtime.session.regionCode}
              </span>
            ) : null}
            {runtime.session.startsAt ? (
              <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
                Start: {formatDateTime(runtime.session.startsAt)}
              </span>
            ) : null}
            {runtime.participation.openForInput ? (
              <span className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sky-900">
                Öffentliche Beteiligung offen
              </span>
            ) : null}
          </div>
          <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            {runtime.session.statusDescription} {runtime.session.nextAction}
          </p>
        </header>

        <section className="rounded-3xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-800">
                QR-first Eventmodus
              </p>
              <h2 className="text-2xl font-bold text-sky-950">
                Mit dem QR-Code direkt in denselben Beteiligungspfad
              </h2>
              <p className="text-sm leading-6 text-sky-900/90">
                Mobile Teilnahme läuft auf derselben Stream-Seite: Frage stellen, Quelle oder Hinweis
                geben, Option vorschlagen, Dossier öffnen und den Ergebnisstand später wiederfinden.
              </p>
              <p className="text-sm leading-6 text-sky-900/90">
                Kein Live-Chat, keine automatische Veröffentlichung und keine ungeprüfte Event-Wahrheit.
                Alles bleibt reviewpflichtig.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`${eventInputBaseHref}?kind=question#event-input`}
                className="inline-flex items-center justify-center rounded-full bg-sky-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Frage stellen
              </Link>
              <Link
                href={`${eventInputBaseHref}?kind=source_hint#event-input`}
                className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
              >
                Quelle/Hinweis geben
              </Link>
              <Link
                href={`${eventInputBaseHref}?kind=option#event-input`}
                className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
              >
                Option vorschlagen
              </Link>
              {runtime.context.dossierHref ? (
                <Link
                  href={runtime.context.dossierHref}
                  className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
                >
                  Dossier öffnen
                </Link>
              ) : null}
              <Link
                href={resultHref}
                className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
              >
                {resultLabel}
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Worum geht es?
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              Der Stream ist kein eigener Abschlussraum. Er sammelt Fragen und Hinweise für denselben
              Thema-Kontext weiter, der im Anlassraum und Dossier sichtbar bleibt.
            </p>
          </article>
          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Was passiert mit deinem Beitrag?
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              Beiträge gehen reviewpflichtig ein. Erst danach können sie als Anlassraum-Hinweis,
              Dossier-Update oder Kommunikationsentwurf weitergeführt werden.
            </p>
          </article>
          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Wo findest du später Ergebnisse?
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              Öffentliche Ergebnisse erscheinen später im Anlassraum oder Dossier. Nichts wird aus dem
              Stream automatisch als amtliche Wahrheit veröffentlicht.
            </p>
          </article>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {runtime.session.playerUrl && isEmbedUrl(runtime.session.playerUrl) ? (
              <div className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
                <div className="aspect-video w-full">
                  <iframe
                    title={`Stream ${runtime.session.title}`}
                    src={runtime.session.playerUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : null}

            {runtime.session.playerUrl && !isEmbedUrl(runtime.session.playerUrl) && isVideoUrl(runtime.session.playerUrl) ? (
              <video
                className="w-full rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm"
                controls
                preload="metadata"
                src={runtime.session.playerUrl}
              />
            ) : null}

            {runtime.session.playerUrl && !isEmbedUrl(runtime.session.playerUrl) && !isVideoUrl(runtime.session.playerUrl) ? (
              <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  Externer Stream-Link
                </p>
                <a
                  href={runtime.session.playerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex text-sm font-semibold text-sky-700 underline underline-offset-4"
                >
                  Stream in neuem Fenster öffnen
                </a>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  Video ist optional. Der zentrale öffentliche Mehrwert liegt in der reviewpflichtigen
                  Beteiligung und der späteren Nachbereitung.
                </p>
              </div>
            ) : null}

            {!runtime.session.playerUrl ? (
              <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  Event ohne Videozwang
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  Dieser Pfad funktioniert auch ohne eingebettetes Video. Entscheidender sind
                  Fragen, Quellen, Perspektiven und die reviewpflichtige Nachbereitung.
                </p>
              </div>
            ) : null}

            <StreamPublicInputPanel
              streamId={runtime.session.id}
              streamTitle={runtime.session.title}
              entryHref={eventInputBaseHref}
              anlassraumHref={runtime.context.anlassraumHref}
              dossierHref={runtime.context.dossierHref}
              swipesHref={runtime.context.swipesHref}
              openForInput={runtime.participation.openForInput}
            />
          </div>

          <div className="space-y-4">
            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Anschlussflächen
              </p>
              <div className="mt-3 space-y-3 text-sm">
                {runtime.context.anlassraumHref ? (
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="font-semibold text-[rgb(var(--fg))]">Anlassraum</p>
                    <p className="mt-1 leading-6 text-[rgb(var(--muted))]">
                      {runtime.context.anlassraumTitle ?? "Öffentlicher Anlassraum"} hält Beteiligung,
                      Review und spätere Ergebnisse im selben Bürgerpfad zusammen.
                    </p>
                    <Link
                      href={runtime.context.anlassraumHref}
                      className="mt-2 inline-flex font-semibold text-[rgb(var(--fg))] hover:text-[rgb(var(--grad-from))]"
                    >
                      Zum Anlassraum
                    </Link>
                  </div>
                ) : null}
                {runtime.context.dossierHref ? (
                  <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="font-semibold text-[rgb(var(--fg))]">Dossier</p>
                    <p className="mt-1 leading-6 text-[rgb(var(--muted))]">
                      Quellenlage, offene Fragen und verschiedene Perspektiven bleiben im Dossier nachvollziehbar.
                    </p>
                    <Link
                      href={runtime.context.dossierHref}
                      className="mt-2 inline-flex font-semibold text-[rgb(var(--fg))] hover:text-[rgb(var(--grad-from))]"
                    >
                      Zum Dossier
                    </Link>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="font-semibold text-[rgb(var(--fg))]">Swipes</p>
                  <p className="mt-1 leading-6 text-[rgb(var(--muted))]">
                    Zustimmung, Gegenposition oder Vertiefung laufen in die bestehende Swipe-Fläche,
                    ohne falsche Auto-Matches zu behaupten.
                  </p>
                  <Link
                    href={runtime.context.swipesHref ?? "/swipes"}
                    className="mt-2 inline-flex font-semibold text-[rgb(var(--fg))] hover:text-[rgb(var(--grad-from))]"
                  >
                    Zu Swipes
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Beteiligungsstand
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">Fragen & Hinweise</p>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                    {runtime.participation.pendingCount} in Prüfung, {runtime.participation.visibleCount} sichtbar
                    {runtime.participation.latestAt ? ` · zuletzt ${formatDateTime(runtime.participation.latestAt)}` : ""}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">Nachbereitung</p>
                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                    {runtime.recap.reviewHint}
                  </p>
                </div>
              </div>
              {runtime.recap.dossierUpdateHint || runtime.recap.anlassraumUpdateHint || runtime.recap.socialDraftHint ? (
                <div className="mt-4 space-y-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {runtime.recap.dossierUpdateHint ? <p>{runtime.recap.dossierUpdateHint}</p> : null}
                  {runtime.recap.anlassraumUpdateHint ? <p>{runtime.recap.anlassraumUpdateHint}</p> : null}
                  {runtime.recap.socialDraftHint ? <p>{runtime.recap.socialDraftHint}</p> : null}
                </div>
              ) : null}
            </section>

            {shareContext ? (
              <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                  Teilen / QR
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  Link und QR öffnen dieselbe mobile Teilnahmefläche für Frage, Quelle, Option und
                  spätere Nachbereitung. Sie behaupten keine veröffentlichte Wahrheit und bleiben bei
                  blockierten oder archivierten Zuständen deaktiviert.
                </p>
                <div className="mt-3">
                  <RundenShareActions share={shareContext} />
                </div>
              </section>
            ) : null}
          </div>
        </section>

        <SocialOutputPreviewPanel
          asset={shareAsset}
          carousel={shareCarousel}
          streamPreparation={streamPreparation}
        />

        {runtime.participation.items.length > 0 ? (
          <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Hinweise aus dem Event
              </p>
              <h2 className="text-xl font-bold text-[rgb(var(--fg))]">
                Was bereits reviewpflichtig eingegangen ist
              </h2>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                Die Liste zeigt Eingaben als Bürgerhinweise, nicht als endgültige Aussage oder Ergebnis.
              </p>
            </div>
            <div className="mt-4 space-y-3">
              {runtime.participation.items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 font-semibold text-[rgb(var(--fg))]">
                      {item.kindLabel}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                      {item.publicVisibilityLabel}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">{item.text}</p>
                  {item.sourceUrl ? (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-semibold text-sky-700 underline underline-offset-4"
                    >
                      Quelle öffnen
                    </a>
                  ) : null}
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{item.riskHint}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {runtime.session.liveBoard?.options?.length ? (
          <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Live-Dossier
              </p>
              <h2 className="text-xl font-bold text-[rgb(var(--fg))]">
                {runtime.session.liveBoard.title}
              </h2>
              {runtime.session.liveBoard.summary ? (
                <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                  {runtime.session.liveBoard.summary}
                </p>
              ) : null}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {runtime.session.liveBoard.options.map((option) => (
                <article
                  key={option.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{option.title}</h3>
                  {option.openQuestions.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                        Offene Fragen
                      </p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-[rgb(var(--muted))]">
                        {option.openQuestions.map((entry, index) => (
                          <li key={`${option.id}-question-${index}`}>{entry}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

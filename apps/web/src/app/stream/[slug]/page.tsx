// apps/web/src/app/stream/[slug]/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import {
  resolveSessionStatus,
  type StreamFollowUpState,
  type StreamFollowUpUpdate,
  type StreamLiveBoardOption,
  type StreamLiveBoardState,
  type StreamSessionDoc,
} from "@features/stream/types";

export const dynamic = "force-dynamic";

function isObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

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

async function fetchSessionBySlug(slug: string, projection?: Record<string, 1 | 0>) {
  const sessions = await streamSessionsCol();
  const query: Record<string, unknown> = {
    visibility: { $in: ["public", "unlisted"] },
  };
  if (isObjectId(slug)) {
    query._id = new ObjectId(slug);
  } else {
    query.slug = slug;
  }
  return (await sessions.findOne(query, projection ? { projection } : undefined)) as StreamSessionDoc | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await fetchSessionBySlug(slug, {
    title: 1,
    description: 1,
    topicKey: 1,
    regionCode: 1,
  });
  if (!session) {
    return {
      title: "Stream nicht gefunden",
      description: "Der angefragte Stream ist nicht verfügbar.",
      robots: { index: false },
    };
  }
  const title = `${session.title} · Stream`;
  const description =
    session.description ??
    `Live-Stream zu ${session.topicKey ?? "aktuellen Themen"}${session.regionCode ? ` in ${session.regionCode}` : ""}.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StreamDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await fetchSessionBySlug(slug);
  if (!session) return notFound();

  const status = resolveSessionStatus(session);
  const startsAt = session.startsAt ? new Date(session.startsAt) : null;
  const playerUrl = session.playerUrl ?? null;
  const liveBoard: StreamLiveBoardState | null = session.liveBoard ?? null;
  const followUp: StreamFollowUpState | null = session.followUp ?? null;
  const recordingAllowed = Boolean(session.recordingAllowed);
  const requireVerifiedParticipants = session.requireVerifiedParticipants !== false;
  const supportEnabled = Boolean(session.supportEnabled);
  const supportBlind = Boolean(session.supportBlind);
  const hideViewerCount = session.hideViewerCount !== false;
  const policyCards = [
    requireVerifiedParticipants && {
      title: "Teilnahme nur verifiziert",
      body: "Abstimmungen und Einreichungen sind nur mit verifiziertem Konto moeglich.",
      ctaLabel: "Verifizierung starten",
      ctaHref: "/verify",
      tone: "amber",
    },
    recordingAllowed && {
      title: "Mitschnitt erlaubt",
      body: "Dieser Stream darf aufgezeichnet und nachbereitet werden.",
      tone: "slate",
    },
    supportEnabled && {
      title: supportBlind ? "Support (blind)" : "Support aktiv",
      body: supportBlind
        ? "Unterstuetzung laeuft im Hintergrund, ohne oeffentliche Anzeige."
        : "Unterstuetzung ist sichtbar und kann die Nachbereitung foerdern.",
      tone: "emerald",
    },
    hideViewerCount && {
      title: "Zuschauerzahl verborgen",
      body: "Die Zuschauerzahl ist fuer die Oeffentlichkeit ausgeblendet.",
      tone: "neutral",
    },
  ].filter(Boolean) as Array<{
    title: string;
    body: string;
    tone: "amber" | "slate" | "emerald" | "neutral";
    ctaLabel?: string;
    ctaHref?: string;
  }>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--brand-from)] via-white to-white pb-16">
      <section className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        <div className="space-y-3">
          <Link href="/stream" className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
            Zur Übersicht
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
            {session.title}
          </h1>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            {session.regionCode && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Region: {session.regionCode}
              </span>
            )}
            {session.topicKey && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Thema: {session.topicKey}
              </span>
            )}
            {startsAt && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Start:{" "}
                {new Intl.DateTimeFormat("de-DE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(startsAt)}
              </span>
            )}
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
              Status: {status}
            </span>
            {requireVerifiedParticipants && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-800">
                Verifizierung erforderlich
              </span>
            )}
            {recordingAllowed && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                Mitschnitt erlaubt
              </span>
            )}
          </div>
        </div>

        {playerUrl && isEmbedUrl(playerUrl) && (
          <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="aspect-video w-full">
              <iframe
                title={`Stream ${session.title}`}
                src={playerUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {playerUrl && !isEmbedUrl(playerUrl) && isVideoUrl(playerUrl) && (
          <video
            className="w-full rounded-3xl border border-slate-100 bg-white shadow-sm"
            controls
            preload="metadata"
            src={playerUrl}
          />
        )}

        {playerUrl && !isEmbedUrl(playerUrl) && !isVideoUrl(playerUrl) && (
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 text-sm text-slate-700">
            <p className="font-semibold">Stream-Link</p>
            <p className="mt-1 break-all">
              <a
                href={playerUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-sky-600 underline underline-offset-4"
              >
                {playerUrl}
              </a>
            </p>
          </div>
        )}

        {session.description && (
          <p className="text-base text-slate-700 md:text-lg">{session.description}</p>
        )}

        {policyCards.length > 0 && (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Leitlinien</p>
              <h2 className="text-xl font-bold text-slate-900">Hinweise zum Stream</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {policyCards.map((item, idx) => (
                <div
                  key={`${item.title}-${idx}`}
                  className={`rounded-2xl border px-4 py-3 text-sm ${
                    item.tone === "amber"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : item.tone === "emerald"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : item.tone === "slate"
                          ? "border-slate-200 bg-slate-50 text-slate-800"
                          : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.body}</p>
                  {item.ctaLabel && item.ctaHref && (
                    <Link
                      href={item.ctaHref}
                      className="mt-2 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:border-slate-300"
                    >
                      {item.ctaLabel}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {supportEnabled && !supportBlind && (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Support</p>
              <h2 className="text-xl font-bold text-slate-900">Unterstützen</h2>
              <p className="text-sm text-slate-600">
                Unterstütze die Moderation und Nachbereitung dieses Streams. Keine Stimme,
                keine Priorität – nur Transparenz.
              </p>
            </div>
            <Link
              href="/unterstuetzen"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300"
            >
              Unterstützen
            </Link>
          </section>
        )}

        {liveBoard?.options?.length ? (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live-Dossier</p>
              <h2 className="text-2xl font-bold text-slate-900">{liveBoard.title ?? "Live-Dossier"}</h2>
              {liveBoard.summary && <p className="text-sm text-slate-600">{liveBoard.summary}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {liveBoard.options.map((opt: StreamLiveBoardOption, index: number) => (
                <div key={opt.id ?? index} className="rounded-2xl border border-slate-100 p-4 space-y-3">
                  <h3 className="text-lg font-semibold text-slate-900">{opt.title}</h3>
                  <div className="grid gap-3 text-sm text-slate-700">
                    {Array.isArray(opt.pros) && opt.pros.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Pro</p>
                        <ul className="mt-1 list-disc pl-4">
                          {opt.pros.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(opt.cons) && opt.cons.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Contra</p>
                        <ul className="mt-1 list-disc pl-4">
                          {opt.cons.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(opt.sources) && opt.sources.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quellen</p>
                        <ul className="mt-1 space-y-1">
                          {opt.sources.map((item: string, idx: number) => (
                            <li key={idx}>
                              <a
                                className="text-sky-700 underline"
                                href={item}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {item}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(opt.openQuestions) && opt.openQuestions.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Offene Fragen</p>
                        <ul className="mt-1 list-disc pl-4">
                          {opt.openQuestions.map((item: string, idx: number) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {followUp?.updates?.length ? (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Follow-up</p>
              <h2 className="text-2xl font-bold text-slate-900">Status & Wirkung</h2>
              {followUp.nextReminderAt && (
                <p className="text-xs text-slate-500">
                  Nächste Erinnerung:{" "}
                  {new Date(followUp.nextReminderAt).toLocaleDateString("de-DE", { dateStyle: "medium" })}
                </p>
              )}
            </div>
            <div className="space-y-3">
              {followUp.updates.map((update: StreamFollowUpUpdate, idx: number) => (
                <div key={update.id ?? idx} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                      {update.status === "submitted"
                        ? "Eingereicht"
                        : update.status === "in_review"
                          ? "In Prüfung"
                          : update.status === "accepted"
                            ? "Angenommen"
                            : update.status === "partial"
                              ? "Teilweise"
                              : "Abgelehnt"}
                    </span>
                    {update.createdAt && (
                      <span className="text-slate-500">
                        {new Date(update.createdAt).toLocaleString("de-DE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{update.note}</p>
                  {update.link && (
                    <a className="mt-2 block text-xs text-sky-700 underline" href={update.link} target="_blank" rel="noreferrer">
                      {update.link}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

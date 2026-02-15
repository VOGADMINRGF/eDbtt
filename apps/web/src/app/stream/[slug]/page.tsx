// apps/web/src/app/stream/[slug]/page.tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import { resolveSessionStatus } from "@features/stream/types";

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

export default async function StreamDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sessions = await streamSessionsCol();

  const query: Record<string, any> = {
    visibility: { $in: ["public", "unlisted"] },
  };
  if (isObjectId(slug)) {
    query._id = new ObjectId(slug);
  } else {
    query.slug = slug;
  }

  const session = await sessions.findOne(query);
  if (!session) return notFound();

  const status = resolveSessionStatus(session);
  const startsAt = session.startsAt ? new Date(session.startsAt) : null;
  const playerUrl = (session as any)?.playerUrl ?? null;
  const liveBoard = (session as any)?.liveBoard ?? null;

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

        {liveBoard?.options?.length ? (
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live-Dossier</p>
              <h2 className="text-2xl font-bold text-slate-900">{liveBoard.title ?? "Live-Dossier"}</h2>
              {liveBoard.summary && <p className="text-sm text-slate-600">{liveBoard.summary}</p>}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {liveBoard.options.map((opt: any, index: number) => (
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
      </section>
    </main>
  );
}

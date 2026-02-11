// apps/web/src/app/stream/[slug]/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import { resolveSessionStatus } from "@features/stream/types";
import { StreamViewerClient } from "./StreamViewerClient";
import { BRAND } from "@/lib/brand";

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

async function loadSession(slug: string) {
  const sessions = await streamSessionsCol();
  const query: Record<string, any> = {
    visibility: { $in: ["public", "unlisted"] },
  };
  if (isObjectId(slug)) {
    query._id = new ObjectId(slug);
  } else {
    query.slug = slug;
  }
  return sessions.findOne(query);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const session = await loadSession(slug);
  if (!session) {
    return {
      title: `Stream – ${BRAND.name}`,
      description: BRAND.tagline_de,
    };
  }
  const title = `${session.title} – Stream – ${BRAND.name}`;
  const description =
    session.description?.trim() || "Live-Stream mit Agenda, Abstimmungen und Report-Kontext.";
  const sessionId = (session._id as ObjectId)?.toHexString?.() ?? "";
  const url = `${BRAND.baseUrl}/stream/${sessionId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND.name,
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
  const session = await loadSession(slug);
  if (!session) return notFound();

  const status = resolveSessionStatus(session);
  const startsAt = session.startsAt ? new Date(session.startsAt) : null;
  const playerUrl = (session as any)?.playerUrl ?? null;
  const sessionId = (session._id as ObjectId)?.toHexString?.() ?? "";

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

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
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
          </div>

          {sessionId && <StreamViewerClient sessionId={sessionId} />}
        </div>
      </section>
    </main>
  );
}

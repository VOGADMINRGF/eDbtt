import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  parseDistributionContext,
  roundTypeToDistributionSource,
  withDistributionQuery,
} from "@/features/surfaces/topic-round";
import PublicFollowUpBlock from "@/features/surfaces/topic-round/PublicFollowUpBlock";
import {
  findCompanionContextByRoundSlug,
  findCompanionContextByTopicAndType,
  getRoundBySlug,
  getTopicBySlug,
} from "@features/topicRound";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const round = getRoundBySlug(slug);
  if (!round) return { title: "Embed Round nicht gefunden", robots: { index: false, follow: false } };
  return {
    title: `${round.title} · Embed`,
    description: round.summary,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedRoundPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const round = getRoundBySlug(slug);
  if (!round) notFound();
  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) notFound();
  const resolved = searchParams ? await searchParams : {};
  const distribution = parseDistributionContext(resolved, roundTypeToDistributionSource(round.type));
  const companion =
    findCompanionContextByRoundSlug(round.slug) ??
    findCompanionContextByTopicAndType(topic.slug, distribution.source);

  const fullRoundPath = withDistributionQuery(`/round/${round.slug}`, distribution);
  const fullTopicPath = withDistributionQuery(`/topic/${topic.slug}`, distribution);
  const companionPath = companion
    ? withDistributionQuery(`/companion/${companion.slug}`, distribution)
    : null;

  return (
    <main className="min-h-screen bg-[rgb(var(--card))] px-4 py-6 text-[rgb(var(--fg))]">
      <header className="space-y-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Embed · Rundenvorschau</p>
        <h1 className="text-lg font-semibold">{round.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{round.summary}</p>
        <p className="text-xs text-[rgb(var(--muted))]">
          {companion
            ? "Kontextzugang läuft über den Begleitraum; diese Embed zeigt die konkrete Runde."
            : distribution.framing}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {companionPath ? (
            <Link href={companionPath} className="btn btn-primary text-xs">
              Zum Begleitraum
            </Link>
          ) : null}
          <Link href={fullRoundPath} className="btn-secondary text-xs">
            Vollansicht Runde
          </Link>
        </div>
      </header>

      <section className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Verknüpftes Topic</p>
        <p className="text-sm font-semibold">{topic.title}</p>
        <p className="text-sm text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
        <Link href={fullTopicPath} className="btn-secondary text-xs">
          Zum Topic-Hub
        </Link>
      </section>

      <section className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Offene Punkte</p>
        <div className="space-y-2">
          {round.openPoints.map((item) => (
            <div key={item} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm text-[rgb(var(--muted))]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <div className="mt-4">
        <PublicFollowUpBlock title="Folgebeitrag (Embed)" returnPath={fullTopicPath} />
      </div>

      <footer className="mt-5 text-xs text-[rgb(var(--muted))]">Embed-Vorschau für den öffentlichen Kontext.</footer>
    </main>
  );
}

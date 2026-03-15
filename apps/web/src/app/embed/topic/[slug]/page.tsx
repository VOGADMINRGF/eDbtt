import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseDistributionContext, withDistributionQuery } from "@/features/surfaces/topic-round";
import PublicFollowUpBlock from "@/features/surfaces/topic-round/PublicFollowUpBlock";
import { getTopicBySlug, listRoundsByTopicSlug } from "@features/topicRound";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return { title: "Embed Topic nicht gefunden", robots: { index: false, follow: false } };
  return {
    title: `${topic.title} · Embed`,
    description: topic.framingQuestion,
    robots: { index: false, follow: false },
  };
}

export default async function EmbedTopicPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const resolved = searchParams ? await searchParams : {};
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const rounds = listRoundsByTopicSlug(topic.slug).slice(0, 5);
  const distribution = parseDistributionContext(resolved);

  const fullTopicPath = withDistributionQuery(`/topic/${topic.slug}`, distribution);
  const followUpPath = withDistributionQuery(`/topic/${topic.slug}`, distribution);

  return (
    <main className="min-h-screen bg-[rgb(var(--card))] px-4 py-6 text-[rgb(var(--fg))]">
      <header className="space-y-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Embed Topic</p>
        <h1 className="text-lg font-semibold">{topic.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
        <p className="text-xs text-[rgb(var(--muted))]">{distribution.framing}</p>
      </header>

      <section className="mt-4 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Latest Rounds</h2>
        <div className="space-y-2">
          {rounds.map((round) => (
            <article key={round.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-sm font-semibold">{round.title}</p>
              <p className="text-xs text-[rgb(var(--muted))]">{round.summary}</p>
              <Link
                href={withDistributionQuery(`/round/${round.slug}`, distribution)}
                className="mt-2 inline-flex text-xs underline"
              >
                Round oeffnen
              </Link>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-4">
        <PublicFollowUpBlock title="Public Follow-up (Embed)" returnPath={followUpPath} />
      </div>

      <footer className="mt-5 text-xs text-[rgb(var(--muted))]">
        <Link href={fullTopicPath} className="underline">
          Vollansicht Topic oeffnen
        </Link>
      </footer>
    </main>
  );
}

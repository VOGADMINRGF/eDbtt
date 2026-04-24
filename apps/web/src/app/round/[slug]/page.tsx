import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { resolveSurfaceContext } from "@/features/surface";
import {
  parseDistributionContext,
  roundTypeToDistributionSource,
  RoundSurface,
  withDistributionQuery,
} from "@/features/surfaces/topic-round";
import {
  findCompanionContextByRoundSlug,
  findCompanionContextByTopicAndType,
  getRoundBySlug,
  getTopicBySlug,
} from "@features/topicRound";
import { buildShareMetadata } from "@/features/share/metadata";

type Params = {
  params: Promise<{ slug: string }>;
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const round = getRoundBySlug(slug);
  if (!round) return { title: "Round nicht gefunden" };
  const topic = getTopicBySlug(round.topicSlug);
  return buildShareMetadata({
    objectType: "topic_round",
    pathOrUrl: `/round/${round.slug}`,
    title: round.title,
    description: topic ? `${round.summary} · Thema: ${topic.title}` : round.summary,
    ogType: "article",
  });
}

export default async function RoundPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: SearchParamsShape;
}) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const round = getRoundBySlug(slug);
  if (!round) notFound();

  const topic = getTopicBySlug(round.topicSlug);
  if (!topic) notFound();
  const distribution = parseDistributionContext(
    resolvedSearch,
    roundTypeToDistributionSource(round.type),
  );
  const companion =
    findCompanionContextByRoundSlug(round.slug) ??
    findCompanionContextByTopicAndType(topic.slug, distribution.source);

  if (distribution.entry === "qr" && companion) {
    redirect(withDistributionQuery(`/companion/${companion.slug}`, distribution));
  }

  const context = resolveSurfaceContext({
    mode: "live",
    audience: "none",
    viewerRole: "public",
    dataSource: "live",
  });

  return (
    <>
      <h1 className="sr-only">Round</h1>
      <RoundSurface
        context={context}
        topic={topic}
        round={round}
        basePath={`/round/${round.slug}`}
        distribution={distribution}
        companion={companion}
      />
    </>
  );
}

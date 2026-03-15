import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSurfaceContext } from "@/features/surface";
import {
  parseDistributionContext,
  roundTypeToDistributionSource,
  RoundSurface,
} from "@/features/surfaces/topic-round";
import { getRoundBySlug, getTopicBySlug } from "@features/topicRound";
import { BRAND } from "@/lib/brand";

type Params = {
  params: Promise<{ slug: string }>;
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const round = getRoundBySlug(slug);
  if (!round) return { title: "Round nicht gefunden" };
  const topic = getTopicBySlug(round.topicSlug);
  return {
    title: round.title,
    description: round.summary,
    alternates: {
      canonical: `/round/${round.slug}`,
    },
    openGraph: {
      title: round.title,
      description: round.summary,
      url: `${BRAND.baseUrl}/round/${round.slug}`,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title: round.title,
      description: topic ? `${round.summary} · Topic: ${topic.title}` : round.summary,
    },
  };
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
      />
    </>
  );
}

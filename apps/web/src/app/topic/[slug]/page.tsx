import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveSurfaceContext } from "@/features/surface";
import { parseDistributionContext, TopicSurface } from "@/features/surfaces/topic-round";
import { getTopicBySlug, listRoundsByTopicSlug } from "@features/topicRound";
import { BRAND } from "@/lib/brand";

type Params = {
  params: Promise<{ slug: string }>;
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return { title: "Topic nicht gefunden" };
  return {
    title: topic.title,
    description: topic.framingQuestion,
    alternates: {
      canonical: `/topic/${topic.slug}`,
    },
    openGraph: {
      title: topic.title,
      description: topic.currentState,
      url: `${BRAND.baseUrl}/topic/${topic.slug}`,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title: topic.title,
      description: topic.currentState,
    },
  };
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: SearchParamsShape;
}) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const rounds = listRoundsByTopicSlug(topic.slug);
  const distribution = parseDistributionContext(resolvedSearch);
  const context = resolveSurfaceContext({
    mode: "live",
    audience: "none",
    viewerRole: "public",
    dataSource: "live",
  });

  return (
    <>
      <h1 className="sr-only">Topic</h1>
      <TopicSurface
        context={context}
        topic={topic}
        rounds={rounds}
        basePath={`/topic/${topic.slug}`}
        distribution={distribution}
      />
    </>
  );
}

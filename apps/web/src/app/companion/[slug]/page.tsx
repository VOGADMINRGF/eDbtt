import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { resolveSurfaceContext } from "@/features/surface";
import {
  companionTypeToDistributionSource,
  CompanionSurface,
  parseDistributionContext,
} from "@/features/surfaces/topic-round";
import {
  getCompanionContextBySlug,
  getRoundBySlug,
  getTopicBySlug,
  listRoundsByTopicSlug,
} from "@features/topicRound";

type Params = {
  params: Promise<{ slug: string }>;
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const companion = getCompanionContextBySlug(slug);
  if (!companion) return { title: "Begleitraum nicht gefunden" };
  const topic = getTopicBySlug(companion.linkedTopicSlug);
  return {
    title: companion.title,
    description: companion.intro,
    alternates: {
      canonical: `/companion/${companion.slug}`,
    },
    openGraph: {
      title: companion.title,
      description: companion.mainQuestion,
      url: `${BRAND.baseUrl}/companion/${companion.slug}`,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title: companion.title,
      description: topic ? `${companion.mainQuestion} · Thema: ${topic.title}` : companion.mainQuestion,
    },
  };
}

export default async function CompanionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: SearchParamsShape;
}) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};

  const companion = getCompanionContextBySlug(slug);
  if (!companion) notFound();

  const topic = getTopicBySlug(companion.linkedTopicSlug);
  if (!topic) notFound();

  const linkedRound = companion.linkedRoundSlug ? getRoundBySlug(companion.linkedRoundSlug) : null;
  const rounds = listRoundsByTopicSlug(topic.slug);

  const distribution = parseDistributionContext(
    resolvedSearch,
    companionTypeToDistributionSource(companion.type),
  );

  const context = resolveSurfaceContext({
    mode: "live",
    audience: "none",
    viewerRole: "public",
    dataSource: "live",
  });

  return (
    <>
      <h1 className="sr-only">Begleitraum</h1>
      <CompanionSurface
        context={context}
        companion={companion}
        topic={topic}
        rounds={rounds}
        linkedRound={linkedRound}
        distribution={distribution}
      />
    </>
  );
}

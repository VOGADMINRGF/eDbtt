import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { buildShareMetadata } from "@/features/share/metadata";

type Params = {
  params: Promise<{ slug: string }>;
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const companion = getCompanionContextBySlug(slug);
  if (!companion) return { title: "Begleitraum nicht gefunden" };
  const topic = getTopicBySlug(companion.linkedTopicSlug);
  return buildShareMetadata({
    objectType: "companion",
    pathOrUrl: `/companion/${companion.slug}`,
    title: companion.title,
    description: topic ? `${companion.mainQuestion} · Thema: ${topic.title}` : companion.intro,
    ogType: "article",
  });
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

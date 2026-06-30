import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { PublicParticipationSpaceShell } from "@/features/participation/publicParticipationSpaceShell";
import { getPublishedParticipationSpaceBySlugOrId } from "@/features/participation/publicParticipationSpaceRuntime";

/* page-contract: delegated-h1 */

type Params = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { detail } = await getPublishedParticipationSpaceBySlugOrId(slug);

  if (!detail) {
    return {
      title: "Beteiligungsraum nicht gefunden",
    };
  }

  return {
    title: detail.title,
    description: detail.summary,
    alternates: {
      canonical: `/beteiligung/${detail.slug}`,
    },
    openGraph: {
      title: detail.title,
      description: detail.summary,
      url: `${BRAND.baseUrl}/beteiligung/${detail.slug}`,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title: detail.title,
      description: detail.summary,
    },
  };
}

export default async function PublicParticipationSpacePage({ params }: Params) {
  const { slug } = await params;
  const { detail } = await getPublishedParticipationSpaceBySlugOrId(slug);

  if (!detail) {
    notFound();
  }

  return <PublicParticipationSpaceShell detail={detail} />;
}

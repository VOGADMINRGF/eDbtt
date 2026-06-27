import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BRAND } from "@/lib/brand";
import { getPublicParticipationSpaceFixtureBySlug } from "@/features/participation/fixtures/publicParticipationSpace";
import { PublicParticipationSpaceShell } from "@/features/participation/publicParticipationSpaceShell";

/* page-contract: delegated-h1 */

type Params = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const fixture = getPublicParticipationSpaceFixtureBySlug(slug);

  if (!fixture) {
    return {
      title: "Beteiligungsraum nicht gefunden",
    };
  }

  return {
    title: fixture.space.title,
    description: fixture.space.summary,
    alternates: {
      canonical: `/beteiligung/${fixture.space.slug}`,
    },
    openGraph: {
      title: fixture.space.title,
      description: fixture.space.summary,
      url: `${BRAND.baseUrl}/beteiligung/${fixture.space.slug}`,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title: fixture.space.title,
      description: fixture.space.summary,
    },
  };
}

export default async function PublicParticipationSpacePage({ params }: Params) {
  const { slug } = await params;
  const fixture = getPublicParticipationSpaceFixtureBySlug(slug);

  if (!fixture) {
    notFound();
  }

  return <PublicParticipationSpaceShell fixture={fixture} />;
}

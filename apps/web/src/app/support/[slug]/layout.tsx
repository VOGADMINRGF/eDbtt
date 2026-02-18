import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Unterstuetzen · ${slug}`,
    description: "Unterstuetzung fuer Kampagnen und Projekte mit transparenter Fortschrittsanzeige.",
  };
}

export default function SupportCampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}

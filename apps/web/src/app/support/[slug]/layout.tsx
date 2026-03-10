import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Unterstützen · ${slug}`,
    description: "Unterstützung für Kampagnen und Projekte mit transparenter Fortschrittsanzeige.",
  };
}

export default function SupportCampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    title: `Unterstuetzen · ${params.slug}`,
    description: "Unterstuetzung fuer Kampagnen und Projekte mit transparenter Fortschrittsanzeige.",
  };
}

export default function SupportCampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}

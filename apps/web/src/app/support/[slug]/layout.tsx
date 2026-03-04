import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = `Unterstuetzen · ${slug}`;
  const description = "Unterstuetzung fuer Kampagnen und Projekte mit transparenter Fortschrittsanzeige.";
  const url = `${BRAND.baseUrl.replace(/\/$/, "")}/support/${encodeURIComponent(slug)}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title,
      description,
    },
  };
}

export default function SupportCampaignLayout({ children }: { children: React.ReactNode }) {
  return children;
}

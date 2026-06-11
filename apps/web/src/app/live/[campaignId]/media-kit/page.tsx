import type { Metadata } from "next";
import LiveMediaKitClient from "./LiveMediaKitClient";
import { readLiveMediaKit } from "@/features/campaign/liveMediaKit";

type PageProps = {
  params: Promise<{ campaignId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { campaignId } = await params;
  const mediaKit = await readLiveMediaKit(campaignId);
  return {
    title: mediaKit ? `${mediaKit.title} · Media-Kit · eDebatte` : "Live Media-Kit · eDebatte",
    description:
      mediaKit?.description
        ? `Media-Kit-Vorschau für ${mediaKit.title}.`
        : "Review-first Media-Kit-Vorschau für Live-Kampagnen bei eDebatte.",
  };
}

export default async function LiveMediaKitPage({ params }: PageProps) {
  const { campaignId } = await params;
  const mediaKit = await readLiveMediaKit(campaignId);

  return (
    <main className="min-h-[100svh]">
      <h1 className="sr-only">Live Media-Kit</h1>
      <LiveMediaKitClient campaignId={campaignId} mediaKit={mediaKit} />
    </main>
  );
}

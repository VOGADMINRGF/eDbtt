import type { Metadata } from "next";
import LiveHostCockpitClient from "./LiveHostCockpitClient";
import { readLiveHostCockpit } from "@/features/campaign/liveHostCockpit";

type PageProps = {
  params: Promise<{ campaignId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { campaignId } = await params;
  const cockpit = await readLiveHostCockpit(campaignId);
  return {
    title: cockpit ? `${cockpit.title} · Host · eDebatte` : "Live Host · eDebatte",
    description:
      cockpit?.description ??
      "Review-first Host- und Moderationssicht für Live-Kampagnen bei eDebatte.",
  };
}

export default async function LiveHostCockpitPage({ params }: PageProps) {
  const { campaignId } = await params;
  const cockpit = await readLiveHostCockpit(campaignId);

  return (
    <main className="min-h-[100svh]">
      <h1 className="sr-only">Live Host-Cockpit</h1>
      <LiveHostCockpitClient campaignId={campaignId} cockpit={cockpit} />
    </main>
  );
}

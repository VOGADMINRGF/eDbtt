import type { Metadata } from "next";
import LiveCampaignEntryClient from "./LiveCampaignEntryClient";
import { readLiveCampaignEntry } from "@/features/campaign/liveCampaignEntry";

type PageProps = {
  params: Promise<{ campaignId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { campaignId } = await params;
  const campaign = await readLiveCampaignEntry(campaignId);
  return {
    title: campaign ? `${campaign.title} · Live · eDebatte` : "Live-Kampagne · eDebatte",
    description:
      campaign?.description ??
      "Review-first Einstieg für Kampagnen, QR-Codes und Live-Kontexte bei eDebatte.",
  };
}

export default async function LiveCampaignPage({
  params,
  searchParams,
}: PageProps) {
  const { campaignId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const source = readSingleSearchParam(resolvedSearchParams.source);
  const sessionId = readSingleSearchParam(resolvedSearchParams.session);
  const campaign = await readLiveCampaignEntry(campaignId);

  return (
    <main className="min-h-[100svh]">
      <h1 className="sr-only">Live-Kampagne</h1>
      <LiveCampaignEntryClient
        campaignId={campaignId}
        campaign={campaign}
        origin={source === "qr" ? "campaign_qr" : "live_campaign"}
        sessionId={sessionId}
      />
    </main>
  );
}

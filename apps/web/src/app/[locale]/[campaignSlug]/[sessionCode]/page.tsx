import { notFound } from "next/navigation";
import { getCampaignById, getCampaignBySlug } from "@core/campaigns";
import CampaignQrClient from "./CampaignQrClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignQrPageProps = {
  params: { campaignSlug: string; sessionCode: string };
};

export default async function CampaignQrPage({ params }: CampaignQrPageProps) {
  const slug = params?.campaignSlug?.trim();
  const sessionCode = params?.sessionCode?.trim();
  if (!slug || !sessionCode) notFound();

  const campaign = (await getCampaignBySlug(slug)) ?? (await getCampaignById(slug));
  if (!campaign) notFound();

  return <CampaignQrClient campaign={campaign} sessionCode={sessionCode} />;
}

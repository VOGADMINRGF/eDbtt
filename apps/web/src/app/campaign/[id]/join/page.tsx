import { notFound } from "next/navigation";
import { getCampaignById, getCampaignBySlug } from "@core/campaigns";
import CampaignJoinClient from "./CampaignJoinClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CampaignJoinPageProps = {
  params: { id: string };
};

export default async function CampaignJoinPage({ params }: CampaignJoinPageProps) {
  const rawId = params?.id?.trim();
  if (!rawId) notFound();

  const campaign = (await getCampaignById(rawId)) ?? (await getCampaignBySlug(rawId));
  if (!campaign) notFound();

  return <CampaignJoinClient campaign={campaign} />;
}

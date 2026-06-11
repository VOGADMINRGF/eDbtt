import type { Metadata } from "next";
import LiveReportHandoffClient from "./LiveReportHandoffClient";
import { readLiveReportHandoff } from "@/features/campaign/liveReportHandoff";

type PageProps = {
  params: Promise<{ campaignId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { campaignId } = await params;
  const report = await readLiveReportHandoff(campaignId);
  return {
    title: report ? `${report.title} · Report · eDebatte` : "Live Report · eDebatte",
    description:
      report?.title
        ? `Review-first Report-Handoff für ${report.title}.`
        : "Review-first Report-Handoff für Live-Kampagnen bei eDebatte.",
  };
}

export default async function LiveReportHandoffPage({ params }: PageProps) {
  const { campaignId } = await params;
  const report = await readLiveReportHandoff(campaignId);

  return (
    <main className="min-h-[100svh]">
      <h1 className="sr-only">Live Report Handoff</h1>
      <LiveReportHandoffClient campaignId={campaignId} report={report} />
    </main>
  );
}

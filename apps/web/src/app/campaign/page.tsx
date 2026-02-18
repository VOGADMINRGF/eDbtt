import type { Metadata } from "next";
import Link from "next/link";
import { campaignsCol } from "@features/campaign/db";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "Aktive Kampagnen, Beteiligung und QR-Teilnahmen bei eDebatte.",
  openGraph: {
    title: "Campaigns",
    description: "Aktive Kampagnen, Beteiligung und QR-Teilnahmen bei eDebatte.",
    url: `${BRAND.baseUrl}/campaign`,
    siteName: BRAND.name,
  },
  twitter: {
    title: "Campaigns",
    description: "Aktive Kampagnen, Beteiligung und QR-Teilnahmen bei eDebatte.",
  },
};

export default async function CampaignIndexPage() {
  const col = await campaignsCol();
  const campaigns = await col.find({ status: "active" }).sort({ createdAt: -1 }).limit(50).toArray();

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Campaigns</p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Aktive Kampagnen</h1>
        <p className="text-sm text-[rgb(var(--muted))]">Hier findest du laufende Kampagnen und kannst direkt teilnehmen.</p>
      </header>

      {campaigns.length === 0 && (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))] shadow-sm">
          Aktuell sind keine Kampagnen aktiv.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <Link
            key={campaign._id?.toString()}
            href={`/campaign/${encodeURIComponent(campaign._id?.toString() ?? "")}`}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Campaign</p>
            <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{campaign.title}</h2>
            <p className="mt-2 text-[rgb(var(--muted))]">{campaign.description ?? "Keine Beschreibung."}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

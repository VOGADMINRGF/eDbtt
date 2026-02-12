import Link from "next/link";
import { campaignsCol } from "@features/campaign/db";
import { ObjectId } from "@core/db/triMongo";

type PageProps = { params: { id: string } };

export default async function CampaignPage({ params }: PageProps) {
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Campaign nicht gefunden</h1>
        <p className="text-slate-600">Ungültige ID.</p>
      </main>
    );
  }

  const col = await campaignsCol();
  const campaign = await col.findOne({ _id: new ObjectId(id) });
  if (!campaign) {
    return (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Campaign nicht gefunden</h1>
        <p className="text-slate-600">Diese Kampagne existiert nicht oder wurde entfernt.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign</p>
        <h1 className="text-3xl font-bold text-slate-900">{campaign.title}</h1>
        <p className="text-sm text-slate-600">{campaign.description ?? "Keine Beschreibung hinterlegt."}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail label="Status" value={campaign.status} />
          <Detail label="Region" value={campaign.regionCode ?? "–"} />
          <Detail label="Topic" value={campaign.topicKey ?? "–"} />
          <Detail label="Zeitfenster" value={formatRange(campaign.startsAt, campaign.endsAt)} />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        {campaign.status === "active" ? (
          <Link
            href={`/campaign/${encodeURIComponent(id)}/join`}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Teilnahme starten
          </Link>
        ) : (
          <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            Kampagne ist derzeit nicht aktiv.
          </span>
        )}
        {campaign.supportEnabled && campaign.supportSlug ? (
          <Link
            href={`/support/${encodeURIComponent(campaign.supportSlug)}`}
            className="rounded-full border border-emerald-300 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-800"
          >
            Unterstuetzen
          </Link>
        ) : null}
        <Link href="/stream" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
          Zurueck zu Streams
        </Link>
      </div>

      {campaign.supportEnabled && campaign.supportSlug ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Unterstuetzung dient nur der Transparenz und Ermöglichung: keine Stimmen, keine XP, keine Credits.
        </p>
      ) : null}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function formatRange(start?: Date | null, end?: Date | null) {
  if (!start && !end) return "–";
  const fmt = (d?: Date | null) => (d ? d.toLocaleDateString("de-DE") : "offen");
  return `${fmt(start)} → ${fmt(end)}`;
}

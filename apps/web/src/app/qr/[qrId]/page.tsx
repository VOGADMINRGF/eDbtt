import { notFound } from "next/navigation";
import { publicOrigin } from "@/utils/publicOrigin";
import { QuestionSetClient } from "./QuestionSetClient";

export default async function QRScanPage({ params }: any) {
  const { qrId } = params;

  // Call to API (server or client) to resolve QR-Entry
  const base = process.env.NEXT_PUBLIC_API_URL || publicOrigin();
  const res = await fetch(`${base}/api/qr/resolve?qrId=${qrId}`, { cache: "no-store" });
  const { success, data } = await res.json();
  if (!success || !data) return notFound();

  // Route je nach Typ
  if (data.targetType === "statement") {
    return <RedirectToStatement id={data.targetIds[0]} />;
  }
  if (data.targetType === "contribution") {
    return <RedirectToContribution id={data.targetIds[0]} />;
  }
  if (data.targetType === "stream") {
    return <RedirectToStream id={data.targetIds[0]} />;
  }
  if (data.targetType === "campaign") {
    return <CampaignQrLanding id={data.targetIds[0]} title={data.title} />;
  }
  if (data.targetType === "campaign_session") {
    return <CampaignQrLanding id={data.targetIds[0]} sessionId={data.targetIds[1]} title={data.title} />;
  }
  if (data.targetType === "set") {
    const code = data.targetIds?.[0];
    if (!code) return notFound();
    return <QuestionSetClient code={code} />;
  }
  if (data.targetType === "custom") {
    return <CustomFlow data={data} />;
  }

  return notFound();
}

// Dummy-Komponenten für das Beispiel
function RedirectToStatement({ id }: any) {
  // Hier Voting-Komponente rendern
  return <div>Statement Voting für ID: {id}</div>;
}
function RedirectToContribution({ id }: any) {
  // Beitrag anzeigen
  return <div>Beitrag ID: {id}</div>;
}
function RedirectToStream({ id }: any) {
  // Stream-Komponente einbinden
  return <div>Stream ID: {id}</div>;
}
function CampaignQrLanding({
  id,
  sessionId,
  title,
}: {
  id: string;
  sessionId?: string;
  title?: string | null;
}) {
  const query = sessionId ? `?session=${encodeURIComponent(sessionId)}` : "";
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign QR</p>
        <h1 className="text-2xl font-bold text-slate-900">{title ?? "Kampagne"}</h1>
        <p className="text-sm text-slate-600">
          Du bist über einen QR-Code hierher gekommen. Starte die Teilnahme oder öffne die Kampagnenseite.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        {sessionId ? (
          <p className="text-slate-600">
            Session: <span className="font-semibold text-slate-800">{sessionId}</span>
          </p>
        ) : (
          <p className="text-slate-600">Keine Session-ID übergeben.</p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <a
          href={`/campaign/${id}/join${query}`}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Teilnahme starten
        </a>
        <a
          href={`/campaign/${id}`}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          Kampagne öffnen
        </a>
      </div>

      <p className="text-xs text-slate-500">
        Hinweis: Falls Unterstuetzen aktiv ist, findest du den Link direkt auf der Kampagnenseite.
      </p>
    </main>
  );
}
function CustomFlow({ data }: any) {
  // Individueller Flow
  return <div>Individuelle Aktion: {JSON.stringify(data)}</div>;
}

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { publicOrigin } from "@/utils/publicOrigin";
import { QuestionSetClient } from "./QuestionSetClient";

type PageProps = {
  params: Promise<{ qrId: string }>;
};

type QrResolved = {
  targetType: "statement" | "contribution" | "stream" | "campaign" | "campaign_session" | "set" | "custom" | string;
  targetIds: string[];
  title?: string | null;
  meta?: Record<string, string | number | boolean | null>;
};

type QrResolveResponse = {
  success: boolean;
  data?: QrResolved | null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { qrId } = await params;
  return {
    title: `QR Teilnahme · ${qrId}`,
    description: "Teilnahme an einer Abstimmung oder Kampagne per QR-Code.",
  };
}

export default async function QRScanPage({ params }: PageProps) {
  const { qrId } = await params;

  // Call to API (server or client) to resolve QR-Entry
  const base = process.env.NEXT_PUBLIC_API_URL || publicOrigin();
  const res = await fetch(`${base}/api/qr/resolve?qrId=${encodeURIComponent(qrId)}`, { cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as QrResolveResponse;
  if (!body?.success || !body?.data) return notFound();
  const data = body.data;

  // Route je nach Typ
  if (data.targetType === "statement") {
    const id = data.targetIds?.[0];
    if (!id) return notFound();
    return redirect(`/statements/${encodeURIComponent(id)}`);
  }
  if (data.targetType === "contribution") {
    const id = data.targetIds?.[0];
    if (!id) return notFound();
    return redirect(`/contribute?source=qr&target=${encodeURIComponent(id)}`);
  }
  if (data.targetType === "stream") {
    const id = data.targetIds?.[0];
    if (!id) return notFound();
    return redirect(`/stream/${encodeURIComponent(id)}`);
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
function CampaignQrLanding({
  id,
  sessionId,
  title,
}: {
  id: string;
  sessionId?: string;
  title?: string | null;
}) {
  const params = new URLSearchParams({ source: "qr" });
  if (sessionId) params.set("session", sessionId);
  const liveHref = `/live/${encodeURIComponent(id)}?${params.toString()}`;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Campaign QR</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{title ?? "Kampagne"}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Du bist über einen QR-Code hierher gekommen. Starte die Teilnahme oder öffne die Kampagnenseite.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm shadow-sm">
        {sessionId ? (
          <div className="space-y-1 text-[rgb(var(--muted))]">
            <p>
              Session: <span className="font-semibold text-[rgb(var(--fg))]">{sessionId}</span>
            </p>
            <p className="text-xs text-[rgb(var(--muted))]">Hinweis: QR-Session kann lokal aushaengen oder im Stream eingebunden sein.</p>
          </div>
        ) : (
          <p className="text-[rgb(var(--muted))]">Keine Session-ID übergeben.</p>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <a
          href={liveHref}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Draft-Einstieg öffnen
        </a>
        <a
          href={`/campaign/${id}`}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
        >
          Kampagne öffnen
        </a>
      </div>

      <p className="text-xs text-[rgb(var(--muted))]">
        Hinweis: Der QR-Code öffnet nur einen Entwurfs- und Review-Einstieg. Es wird nichts
        automatisch veröffentlicht oder gezählt.
      </p>
    </main>
  );
}

function CustomFlow({ data }: { data: QrResolved }) {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10">
      <h1 className="text-xl font-semibold text-[rgb(var(--fg))]">Individuelle Aktion</h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        Dieser QR-Code führt zu einem benutzerdefinierten Flow. Bitte folge den Hinweisen der
        Veranstaltung oder Organisation.
      </p>
      <pre className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
        {JSON.stringify({ targetType: data.targetType, meta: data.meta ?? null }, null, 2)}
      </pre>
    </main>
  );
}

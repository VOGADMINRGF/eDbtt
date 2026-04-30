import Link from "next/link";
import {
  OutputPackageSchema,
  demoDossierForOutputEngine,
  generateOutputPackage,
  type OutputFormat,
} from "@features/outputEngine";

type PageProps = { params: Promise<{ id: string }> };

const FORMAT_LABELS: Record<OutputFormat, string> = {
  web_article: "Web Article",
  short_briefing: "Short Briefing",
  social_carousel: "Social Carousel",
  reel_script: "Reel Script",
  voiceover_text: "Voiceover Text",
  podcast_script: "Podcast Script",
  qr_poster: "QR Poster",
  citizen_letter: "Citizen Letter",
  administrative_note: "Administrative Note",
  mandate_summary: "Mandate Summary",
};

const REVIEW_REQUIRED_STATUSES = new Set(["draft", "needs_review"]);

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default async function DossierOutputStudioPage({ params }: PageProps) {
  const { id } = await params;

  const outputPackage = generateOutputPackage(
    {
      ...demoDossierForOutputEngine,
      id,
      title: `Dossier ${id} · Output Studio Vorschau`,
      updatedAt: demoDossierForOutputEngine.updatedAt,
    },
    {
      generatedAt: demoDossierForOutputEngine.updatedAt,
      baseUrl: "https://edebatte.org",
    },
  );

  const parsedPackage = OutputPackageSchema.safeParse(outputPackage);

  if (!parsedPackage.success) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-4 text-[rgb(var(--fg))]">
        <h1 className="text-2xl font-semibold">Output Studio</h1>
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          OutputPackage konnte nicht validiert werden. Bitte Dossierdaten und Quellenlage prüfen.
        </p>
      </main>
    );
  }

  const pkg = parsedPackage.data;
  const reviewRequired = REVIEW_REQUIRED_STATUSES.has(pkg.reviewStatus);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 text-[rgb(var(--fg))] sm:px-6 lg:px-8">
      <h1 className="sr-only">Dossier Output Studio</h1>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          eDebatte Studio · Output Engine
        </p>
        <h2 className="mt-2 text-2xl font-semibold">{pkg.title}</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Dossier: {id}</p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Status: {pkg.reviewStatus}
          </span>
          {reviewRequired ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-semibold text-amber-300">
              Review erforderlich
            </span>
          ) : null}
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Vollständigkeit: {pkg.completenessStatus}
          </span>
        </div>

        <p className="mt-3 text-sm text-[rgb(var(--muted))]">{pkg.shortSummary}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={pkg.cta.target}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold hover:bg-[rgb(var(--card-hover,240_242_247))]"
          >
            Vorschau prüfen
          </Link>
          <Link
            href={`/dossier/${encodeURIComponent(id)}`}
            className="inline-flex items-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Zurück zum Dossier
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <h3 className="text-base font-semibold">Quellenlage</h3>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Quelle-Status: <span className="font-semibold text-[rgb(var(--fg))]">{pkg.sourceState.status}</span> · {" "}
            {pkg.sourceState.sourceCount} verknüpfte Quellen
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {pkg.sourceTraces.map((trace) => (
              <li key={trace.sourceId} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="font-medium">{trace.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">{trace.url}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <h3 className="text-base font-semibold">Offene Fragen & Eingabehinweise</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--fg))]">
            {pkg.openQuestions.length > 0 ? (
              pkg.openQuestions.map((question) => <li key={question}>{question}</li>)
            ) : (
              <li>Keine offenen Fragen vorhanden.</li>
            )}
          </ul>

          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm">
            <p className="font-semibold">Needs-Input Marker</p>
            {pkg.needsInputMarkers.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
                {pkg.needsInputMarkers.map((marker) => (
                  <li key={marker}>{marker}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[rgb(var(--muted))]">Keine offenen Eingabewarnungen.</p>
            )}
          </div>
        </article>
      </section>

      <section className="mt-5 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-base font-semibold">Verfügbare Output-Formate</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pkg.distributionOutputs.map((entry) => (
            <article key={entry.format} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-sm font-semibold">{FORMAT_LABELS[entry.format]}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Kanal: {entry.channel}</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Mapper-Status: ausstehend</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <h3 className="text-base font-semibold">CTA und Dossier-Backlink</h3>
          <p className="mt-2 text-sm">{pkg.cta.label}</p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">Ziel: {pkg.dossierBacklinkTarget}</p>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <h3 className="text-base font-semibold">QR Ziel</h3>
          <p className="mt-2 text-sm">{pkg.qrCodeTarget.label}</p>
          <p className="mt-1 break-all text-xs text-[rgb(var(--muted))]">{pkg.qrCodeTarget.target}</p>
        </article>
      </section>

      <section className="mt-5 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-base font-semibold">Preview-Metadaten</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[rgb(var(--muted))]">Generiert am</dt>
            <dd className="font-medium">{formatDateTime(pkg.generatedAt)}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted))]">Paket-ID</dt>
            <dd className="font-medium">{pkg.packageId}</dd>
          </div>
          <div>
            <dt className="text-[rgb(var(--muted))]">Dossier-ID</dt>
            <dd className="font-medium">{pkg.dossierId}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}

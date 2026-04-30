import Link from "next/link";
import MasterPostActions from "@/components/outputEngine/MasterPostActions";
import SocialCarouselPreview from "@/components/outputEngine/SocialCarouselPreview";
import SocialDistributionPanel from "@/components/outputEngine/SocialDistributionPanel";
import {
  OutputPackageSchema,
  buildSocialDistributionPlan,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateSocialCarouselOutput,
  generateOutputPackage,
  getSocialPublishingPolicy,
} from "@features/outputEngine";

type PageProps = { params: Promise<{ id: string }> };

const REVIEW_REQUIRED_STATUSES = new Set(["draft", "needs_review"]);

function reviewStatusLabel(value: string): string {
  if (value === "draft") return "Entwurf";
  if (value === "needs_review") return "Review erforderlich";
  if (value === "approved") return "Freigegeben";
  if (value === "rejected") return "Abgelehnt";
  if (value === "published") return "Veröffentlicht";
  if (value === "archived") return "Archiviert";
  return value;
}

function completenessLabel(value: string): string {
  if (value === "complete") return "vollständig";
  if (value === "needs_input") return "Eingaben fehlen";
  return value;
}

function sourceStateLabel(value: string): string {
  if (value === "sufficient") return "ausreichend";
  if (value === "missing") return "unvollständig";
  return value;
}

export default async function DossierOutputStudioPage({ params }: PageProps) {
  const { id } = await params;

  const outputPackage = generateOutputPackage(
    {
      ...demoDossierForOutputEngine,
      id,
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
        <h1 className="text-2xl font-semibold">eDebatte Studio</h1>
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          OutputPackage konnte nicht validiert werden. Bitte Dossierdaten und Quellenlage prüfen.
        </p>
      </main>
    );
  }

  const pkg = parsedPackage.data;
  const reviewRequired = REVIEW_REQUIRED_STATUSES.has(pkg.reviewStatus);
  const carousel = generateSocialCarouselOutput(pkg);
  const masterPost = generateMasterPost(pkg);
  const policy = getSocialPublishingPolicy();
  const distributionPlan = buildSocialDistributionPlan(masterPost, carousel, { policy });
  const sourceNarrative =
    pkg.sourceState.notes[0] ??
    "Quellenlage ist vorhanden, bleibt aber lokal einzuordnen und nicht automatisch übertragbar.";
  const reviewStateLabel = reviewRequired ? "Review erforderlich" : "Review abgeschlossen";

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 text-[rgb(var(--fg))] sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">eDebatte Studio</h1>
        <p className="mt-2 text-base text-[rgb(var(--muted))]">
          Vom Dossier zum fertigen Beitrag, Kanal-Versionen und Veröffentlichungsplan.
        </p>
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">
          Für Beteiligungsbüros, Moderations- und Dialogprofis: Dossier-Inhalte in professionelle Kommunikation
          übersetzen — ohne automatische Live-Veröffentlichung.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">Dossier bleibt Quelle</span>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1">{reviewStateLabel}</span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">Noch nicht live veröffentlicht</span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            Externe Kanäle nur Export/Kopieren, solange nicht verbunden
          </span>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Studio-Kontext
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Dossier-Kontext</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Thema: {pkg.title}
        </p>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Region/Vergleichsraum: {carousel.regionalContext}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Status: {reviewStatusLabel(pkg.reviewStatus)}
          </span>
          {reviewRequired ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-semibold text-amber-300">
              Review erforderlich
            </span>
          ) : null}
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Vollständigkeit: {completenessLabel(pkg.completenessStatus)}
          </span>
        </div>

        <p className="mt-3 text-sm text-[rgb(var(--muted))]">{pkg.shortSummary}</p>
        <div className="mt-4">
          <Link
            href={pkg.dossierBacklinkTarget}
            className="inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-sm font-semibold"
          >
            Zurück zum Dossier
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Fertiger Post-Entwurf</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Finaler Master-Post vor Veröffentlichungsvorbereitung.
        </p>
        <article className="mt-4 space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[linear-gradient(145deg,rgba(8,47,73,0.9),rgba(3,7,18,0.92))] p-4 text-slate-100">
          <header>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Titel</p>
            <h4 className="mt-1 text-2xl font-semibold text-white">{masterPost.title}</h4>
            <p className="mt-2 text-sm text-cyan-100">{masterPost.hook}</p>
          </header>

          <section>
            <p className="text-xs uppercase tracking-wide text-cyan-200">Regionaler Kontext</p>
            <p className="mt-1 text-sm text-slate-100">{masterPost.regionalContext}</p>
            <p className="mt-1 text-sm text-slate-200">{masterPost.body}</p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-cyan-200">Quellenlage</p>
            <p className="mt-1 text-sm text-slate-100">{sourceNarrative}</p>
            <p className="mt-1 text-xs text-slate-300">
              Quellen bisher: {masterPost.sourceState.sourceCount} · Status:{" "}
              {sourceStateLabel(masterPost.sourceState.status)}
            </p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Offene Fragen</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {pkg.openQuestions.slice(0, 6).map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Eventualitäten / Optionen</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {pkg.options.slice(0, 6).map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Beteiligungsfrage</p>
            <p className="mt-1 text-sm text-white">{masterPost.participationQuestion}</p>
          </section>

          <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">CTA</p>
            <p className="mt-1 text-sm font-semibold text-emerald-100">{masterPost.cta}</p>
            <p className="mt-2 text-xs text-emerald-100">
              Dossier-Link: {masterPost.backlinkTarget}
            </p>
            <p className="mt-1 text-xs text-emerald-100">
              QR-Ziel: {pkg.qrCodeTarget.target}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {masterPost.suggestedHashtags.map((entry) => (
                <span
                  key={entry.tag}
                  className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-200"
                >
                  {entry.tag}
                </span>
              ))}
            </div>
          </section>
          {masterPost.reviewGuardrails.length > 0 ? (
            <section className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-100">Review-Hinweise</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-50">
                {masterPost.reviewGuardrails.map((entry) => (
                  <li key={entry.id}>{entry.message}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </section>

      <section className="mt-5">
        <MasterPostActions
          dossierId={id}
          initialText={`${masterPost.title}\n\n${masterPost.hook}\n\n${masterPost.body}\n\n${masterPost.participationQuestion}\n\nCTA: ${masterPost.cta}\nLink: ${masterPost.backlinkTarget}`}
          suggestedSlots={masterPost.suggestedPostingWindows.map((entry) => entry.window)}
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <SocialDistributionPanel
          plan={distributionPlan}
          dossierId={id}
          reviewRequired={reviewRequired}
          dossierBacklink={pkg.dossierBacklinkTarget}
        />
        <SocialCarouselPreview carousel={carousel} reviewRequired={reviewRequired} />
      </section>

      <details className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <summary className="cursor-pointer list-none text-base font-semibold">Dossier-Qualität & Hinweise</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h4 className="text-sm font-semibold">Quellenlage</h4>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Quelle-Status: <span className="font-semibold text-[rgb(var(--fg))]">{sourceStateLabel(pkg.sourceState.status)}</span> · {" "}
              {pkg.sourceState.sourceCount} verknüpfte Quellen
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {pkg.sourceTraces.map((trace) => (
                <li key={trace.sourceId} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2">
                  <p className="font-medium">{trace.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{trace.url}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h4 className="text-sm font-semibold">Offene Fragen & Eingabehinweise</h4>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--fg))]">
              {pkg.openQuestions.length > 0 ? (
                pkg.openQuestions.map((question) => <li key={question}>{question}</li>)
              ) : (
                <li>Keine offenen Fragen vorhanden.</li>
              )}
            </ul>
            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] p-3 text-sm">
              <p className="font-semibold">Eingabehinweise</p>
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
        </div>

      </details>
    </main>
  );
}

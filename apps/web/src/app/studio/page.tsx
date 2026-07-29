import type { Metadata } from "next";
import Link from "next/link";
import { buildCanonicalDossierHref } from "@/components/dossier/runtimeTruth";
import StudioCodeWorkspaceClient from "./StudioCodeWorkspaceClient";
import {
  buildQrEntryMetadata,
  renderResolvedQrTargetEntry,
} from "@/features/qr/publicEntry";

/* page-contract: delegated-h1 */

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value[0]?.trim() ?? "";
  return "";
}

const PRODUCT_AREAS = [
  {
    href: buildCanonicalDossierHref(null, { allowIndexFallback: true }) ?? "/dossier",
    title: "Dossier",
    lead: "Akte, Quellen, Positionen, Evidenzen, offene Fragen und Entscheidungsraum.",
  },
  {
    href: "/runden",
    title: "Runden",
    lead: "Konkrete Beteiligungsphasen innerhalb eines Anlass- und Themenkontexts.",
  },
  {
    href: "/beteiligung",
    title: "Beteiligung",
    lead: "Reduzierter öffentlicher Einstieg in freigegebene Beteiligungsräume.",
  },
  {
    href: "/abstimmungen",
    title: "Abstimmungen",
    lead: "Optionen, Mehrheiten und Status in einer klaren Surface.",
  },
  {
    href: "/mandat",
    title: "Mandat",
    lead: "Zuständigkeit, Umsetzungsstand, Wirkung und Risiken.",
  },
  {
    href: "/factcheck",
    title: "Factcheck",
    lead: "Mehrkanal-Intake und prüfbare Interventionen.",
  },
  {
    href: "/swipes",
    title: "Swipes",
    lead: "Schneller Modus derselben freigegebenen Beteiligungsphase.",
  },
  {
    href: "/mitwirken",
    title: "Mitwirken",
    lead: "Einheitlicher Einstieg für Quelle, Frage, Perspektive und Widerspruch.",
  },
] as const;

export const metadata: Metadata = buildQrEntryMetadata("Verteilen, Event und Live");

function StudioLanding() {
  const flow = [
    ["/create", "versteht und strukturiert den Ausgangstext"],
    ["/anlassraum", "hält Anlass, Kontext, Region, Beteiligte und Ziel"],
    ["/dossier", "ordnet Quellen, Positionen, Evidenzen und offene Fragen"],
    ["/runden", "bereitet die konkrete Beteiligungsphase vor"],
    ["/studio", "steuert Zugang, QR, Event, Live und Auswertung"],
    ["/beteiligung", "öffnet die reduzierte direkte Teilnahme"],
  ] as const;

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] px-4 py-8 text-[rgb(var(--fg))] md:py-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm md:p-9">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Studio · Betreiber-, Event- und Distributionsebene
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              Beteiligung verteilen, einladen und live begleiten
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))] md:text-base">
              Das Studio ist kein zweiter Inhaltseditor. Inhalte werden in Create verstanden,
              im Anlassraum und Dossier eingeordnet und in einer Runde oder einem
              Beteiligungsraum vorbereitet. Hier werden Zugang, QR, Event, Auftritt und
              Auswertung gesteuert.
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/runden" className="btn btn-primary text-sm">
              Bestehende Runde auswählen
            </Link>
            <Link
              href="/create?intent=participation&returnTo=%2Fstudio"
              className="btn-secondary text-sm"
            >
              Neuen Beteiligungsentwurf vorbereiten
            </Link>
            <Link href="/dashboard/streams" className="btn-secondary text-sm">
              Live- oder Event-Session öffnen
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Ein Produktfluss
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Studio steht nach der Beteiligungsvorbereitung
            </h2>
            <div className="mt-5 space-y-3">
              {flow.map(([route, description], index) => (
                <div key={route} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/10 text-xs font-bold text-cyan-200">
                      {index + 1}
                    </span>
                    {index < flow.length - 1 ? (
                      <span className="h-full min-h-5 w-px bg-[rgb(var(--border))]" />
                    ) : null}
                  </div>
                  <div className="pb-3">
                    <p className="font-semibold">{route}</p>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Für Organisationen und Veranstaltungen
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Ein Studio, drei Einsatzarten</h2>
            <div className="mt-5 space-y-3">
              {[
                [
                  "Öffentlich",
                  "Bürgerdialog, Kampagne, offene Runde oder Initiative mit freigegebenem Teilnahmepfad.",
                ],
                [
                  "Intern",
                  "Unternehmen, Verein, Verband, Team oder Gremium mit Organisations- und Rollenbezug.",
                ],
                [
                  "Event & live",
                  "Workshop, Townhall, Mitgliederversammlung, Konferenz oder moderierte Bühne.",
                ],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm leading-5 text-[rgb(var(--muted))]">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[rgb(var(--muted))]">
              Rollen, Einladungen, Branding, Moderation und Ergebnisfreigabe bleiben in den
              bestehenden Organisations-, Runden- und Live-Kontexten. Das Studio führt sie
              zusammen, ohne eine parallele Runtime zu eröffnen.
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-7">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              [
                "Zielgebunden",
                "QR und Link verweisen auf einen bestehenden Anlass, eine Runde, ein Dossier oder einen Beteiligungsraum.",
              ],
              [
                "Review-first",
                "Keine Aktivierung, Veröffentlichung oder Ergebnissichtbarkeit entsteht still als Seiteneffekt.",
              ],
              [
                "Direkte Teilnahme",
                "Der öffentliche QR-Code öffnet /qr/[code] oder das kanonische Ziel – ohne erneute Inhaltseingabe.",
              ],
            ].map(([title, text]) => (
              <article key={title}>
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Bestehende Fachbereiche
              </p>
              <h2 className="mt-1 text-2xl font-semibold">Kontext bearbeiten und vertiefen</h2>
            </div>
            <Link href="/demo" className="text-sm font-semibold underline">
              Demo-Portal öffnen
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {PRODUCT_AREAS.map((area) => (
              <Link
                key={area.href}
                href={area.href}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/40"
              >
                <h3 className="font-semibold">{area.title}</h3>
                <p className="mt-2 text-sm leading-5 text-[rgb(var(--muted))]">{area.lead}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function StudioPage({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const code = readParam(resolved.code);
  const target = readParam(resolved.target);
  const caller = readParam(resolved.caller);

  if (code) return <StudioCodeWorkspaceClient code={code} />;
  if (target) return renderResolvedQrTargetEntry(target, { caller });
  if (
    readParam(resolved.invalidTarget) ||
    readParam(resolved.targetState) === "blocked"
  ) {
    return renderResolvedQrTargetEntry("", { caller });
  }

  return <StudioLanding />;
}

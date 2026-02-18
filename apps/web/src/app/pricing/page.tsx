import Link from "next/link";
import PackagesGrid from "@/components/pricing/PackagesGrid";
import { B2B_PACKAGE_IDS, B2G_PACKAGE_IDS, getPackagesByIds, PRIVATE_PACKAGE_IDS } from "@features/pricing";

export default function PricingPage() {
  const privatePackages = getPackagesByIds(PRIVATE_PACKAGE_IDS);
  const b2bPackages = getPackagesByIds(B2B_PACKAGE_IDS);
  const b2gPackages = getPackagesByIds(B2G_PACKAGE_IDS);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--bg))] pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-100/45 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Pakete</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[rgb(var(--fg))]">Pakete & Preise</h1>
          <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
            Wir unterscheiden klar zwischen Privatpersonen und professionellen Organisationen. Privatpakete kannst du
            unverbindlich vormerken. B2B- und B2G-Pakete starten mit Basis oder Pro und werden im Setup abgestimmt.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/unterstuetzen"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Initiative unterstützen
            </Link>
            <span className="text-xs text-[rgb(var(--muted))]">
              Unterstützung läuft über VoiceOpenGov – ohne Stimmvorteile.
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-[rgb(var(--muted))]">
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
              Mehrere Projekte &amp; Teams
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
              Admin- &amp; Rollenlogik
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
              Reports, Export &amp; Schnittstellen
            </span>
          </div>
        </header>

        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Privat</p>
              <h2 className="text-2xl font-bold text-[rgb(var(--fg))]">Basis, Start &amp; Pro</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Für Bürger:innen, Initiativen und Teams – mit klaren Features und transparenten Add-ons.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Unverbindlich vormerken
            </span>
          </div>
          <PackagesGrid packages={privatePackages} />
        </section>

        <section className="mt-14 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Professionell</p>
              <h2 className="text-2xl font-bold text-[rgb(var(--fg))]">B2B &amp; B2G Pakete</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Für Verwaltungen, Medien, Verbaende und Unternehmen: Basis &amp; Pro mit klaren Rollen, Reports und
                Schnittstellen.
              </p>
            </div>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Vormerkung
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">B2B</p>
                <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Organisationen &amp; Unternehmen</h3>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Teams, Redaktionen, Verbaende: Projekt-Setup, Rollen und klare Exporte.
                </p>
              </div>
            </div>
            <PackagesGrid packages={b2bPackages} />
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">B2G</p>
                <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Kommunen &amp; Verwaltungen</h3>
                <p className="text-sm text-[rgb(var(--muted))]">
                  Kommunale Bereiche, Admin-Steuerung und Reports fuer Verwaltungen.
                </p>
              </div>
            </div>
            <PackagesGrid packages={b2gPackages} />
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 text-sm text-amber-900 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Ablauf</p>
                <h3 className="text-lg font-semibold">Setup &amp; Onboarding</h3>
                <p className="mt-1 text-sm text-amber-900">
                  Nach der Vormerkung klaeren wir Setup, Umfang und Starttermin. Basis/Pro wird dann passend
                  freigeschaltet.
                </p>
              </div>
              <span className="rounded-full border border-amber-200 bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold text-amber-700">
                Vormerkung
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href="/vormerken?paket=b2b_pro"
                className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-90"
              >
                B2B vormerken
              </a>
              <a
                href="/vormerken?paket=b2g_pro"
                className="rounded-full border border-amber-200 bg-[rgb(var(--card))] px-4 py-2 text-xs font-semibold text-amber-900 shadow-sm hover:bg-[rgb(var(--card))]"
              >
                B2G vormerken
              </a>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "B2G Fokus",
                text: "Kommunale Beteiligung mit transparentem Berichtswesen, Sitzungen und klarer Zuständigkeitslogik.",
              },
              {
                title: "B2B Fokus",
                text: "Medienformate & Team-Formate mit Live-Trends, NPS-Abfragen und Exporten für Redaktion/Management.",
              },
              {
                title: "Ablauf",
                text: "Vormerkung, Setup, danach Pro-Optionen (Automationen, Support, KI-Kontingent).",
              },
            ].map((b) => (
              <div key={b.title} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{b.title}</p>
                <p className="mt-2 text-[rgb(var(--muted))]">{b.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Szenarien</p>
                <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Wofür brauche ich das?</h3>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                  Je nach Umfeld kannst du B2B/B2G-Pakete unterschiedlich einsetzen. Hier die häufigsten Szenarien – klar
                  getrennt und sofort verständlich.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Event / Veranstaltung (Abstimmung vor Ort)",
                  text:
                    "Ein Abstimmungslink für die Bühne oder den Einlass. Teilnehmer stimmen live ab, du siehst Trends in Echtzeit – ideal für Bürgerversammlungen, Vereinsabende, Stadtteilforen.",
                  tag: "Live-Event",
                },
                {
                  title: "Regionale Blätter / Kommune",
                  text:
                    "Abstimmungslink im Amtsblatt, Newsletter oder Vereinsheft. Ein Set fasst alle Fragen der Ausgabe zusammen – inklusive Auswertung für die Verwaltung.",
                  tag: "Regional",
                },
                {
                  title: "Media-Haus / Artikel mit mehreren Fragen",
                  text:
                    "Abstimmungslink im Artikel oder Online-Story. Ein Set bündelt mehrere Fragen (z.B. Pro/Contra + NPS). Redaktion sieht sofort die Tendenzen.",
                  tag: "Presse",
                },
                {
                  title: "TV / Talkshow mit Live-Auswertung",
                  text:
                    "Pro Frage ein Link oder ein Set für die ganze Sendung. Live-Trends und NPS machen die Richtung sichtbar, ohne das Format zu stören.",
                  tag: "Broadcast",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{card.title}</p>
                    <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                      {card.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Add-ons (Professionell)</h2>
          <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Zusatzelemente sind bewusst transparent gehalten: keine Stimmen, keine XP, keine Prioritaet gegen Geld.
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[rgb(var(--bg))] text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                <tr>
                  <th className="px-4 py-3">Baustein</th>
                  <th className="px-4 py-3">Preis</th>
                  <th className="px-4 py-3">Hinweis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                <tr>
                  <td className="px-4 py-3 font-medium text-[rgb(var(--fg))]">Zusatzthema (Projekt)</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">1,99 EUR je Thema</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">Zusatzthemen ueber 10 hinaus (nur eDebatte Pro, 24 Monate).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[rgb(var(--fg))]">Agenda &amp; Umfragen</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">max. 2,99 EUR je Teilnehmer</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">Preisstaffel je Team/Projekt, keine Hidden Fees.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[rgb(var(--fg))]">Faktencheck (optional)</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">Preisstaffel (Stufe 0/1/2)</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">Budget, Freigaben und Run-Receipts je Kandidat.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[rgb(var(--fg))]">Contributions-Hilfe (optional)</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">Preisstaffel</td>
                  <td className="px-4 py-3 text-[rgb(var(--muted))]">Alternativen, Eventualitaeten und Quellenarbeit.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Voranmeldung",
              text: "Professionelle Pakete werden nach Vormerkung und Freigabe gestartet.",
            },
            {
              title: "Setup",
              text: "Gefuehrte Schritte fuer Themen, Fragen und Alternativen – passend fuer Teams und Verwaltungen.",
            },
            {
              title: "Pro-Optionen",
              text: "Nach Freigabe: Automationen, Support und KI-Assistenz (kontingentiert).",
            },
          ].map((b) => (
            <div key={b.title} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{b.title}</p>
              <p className="mt-2 text-[rgb(var(--muted))]">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

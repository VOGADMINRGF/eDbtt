import PackagesGrid from "@/components/pricing/PackagesGrid";
import { getPackagesByIds, PILOT_PACKAGE_IDS, PRIVATE_PACKAGE_IDS } from "@features/pricing";

export default function PricingPage() {
  const privatePackages = getPackagesByIds(PRIVATE_PACKAGE_IDS);
  const pilotPackages = getPackagesByIds(PILOT_PACKAGE_IDS);

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[var(--brand-from)] via-white to-white pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-100/45 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <header className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pakete</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Pakete & Preise</h1>
          <p className="text-sm leading-relaxed text-slate-600">
            Wir unterscheiden klar zwischen Privatpersonen und Pilot-Partnern aus Verwaltung, Medien und Organisationen.
            Alle Pakete sind unverbindlich vormerkbar – keine Zahlung, kein Abo.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
              5–10 Themen pro Projekt (Pilot)
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
              QR pro Frage oder geschlossene Sitzung
            </span>
            <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">
              Faktencheck &amp; Contributions optional
            </span>
          </div>
        </header>

        <section className="mt-10 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Privat</p>
              <h2 className="text-2xl font-bold text-slate-900">Basis, Start &amp; Pro</h2>
              <p className="text-sm text-slate-600">
                Für Bürger:innen, Initiativen und Teams – mit klaren Features und transparenten Add-ons.
              </p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Unverbindlich vormerken
            </span>
          </div>
          <PackagesGrid packages={privatePackages} />
        </section>

        <section className="mt-14 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">B2G / B2B</p>
              <h2 className="text-2xl font-bold text-slate-900">Pilotpakete zur Anmeldung</h2>
              <p className="text-sm text-slate-600">
                Für Verwaltungen, Medien, Verbände und Unternehmen: 12-Wochen-Pilot mit klarer Methodik.
              </p>
            </div>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              Pilotplätze begrenzt
            </span>
          </div>
          <PackagesGrid packages={pilotPackages} />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "B2G Fokus",
                text: "Kommunale Beteiligung mit transparentem Berichtswesen, QR-Sitzungen und klarer Zuständigkeitslogik.",
              },
              {
                title: "B2B Fokus",
                text: "Medienformate & Team-Formate mit Live-Trends, NPS-Abfragen und Exporten für Redaktion/Management.",
              },
              {
                title: "Pilot-Ablauf",
                text: "Kick-off, Themenauswahl (5–10), Moderation & Auswertung – inklusive Abschlussbericht.",
              },
            ].map((b) => (
              <div key={b.title} className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{b.title}</p>
                <p className="mt-2 text-slate-700">{b.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Szenarien</p>
                <h3 className="text-lg font-semibold text-slate-900">Wofür brauche ich das?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Je nach Umfeld kannst du QR-Sets und Pilotpakete unterschiedlich einsetzen. Hier die häufigsten
                  Szenarien – klar getrennt und sofort verständlich.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                QR pro Frage oder geschlossenes Set
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                {
                  title: "Event / Veranstaltung (QR vor Ort)",
                  text:
                    "Ein QR für die Bühne oder den Einlass. Teilnehmer stimmen live ab, du siehst Trends in Echtzeit – ideal für Bürgerversammlungen, Vereinsabende, Stadtteilforen.",
                  tag: "Live-Event",
                },
                {
                  title: "Regionale Blätter / Kommune",
                  text:
                    "QR im Amtsblatt, Newsletter oder Vereinsheft. Ein Set fasst alle Fragen der Ausgabe zusammen – inklusive Auswertung für die Verwaltung.",
                  tag: "Regional",
                },
                {
                  title: "Media-Haus / Artikel mit mehreren Fragen",
                  text:
                    "QR im Artikel oder Online-Story. Ein Set bündelt mehrere Fragen (z.B. Pro/Contra + NPS). Redaktion sieht sofort die Tendenzen.",
                  tag: "Presse",
                },
                {
                  title: "TV / Talkshow mit Live-Auswertung",
                  text:
                    "Pro Frage ein QR oder ein Set für die ganze Sendung. Live-Trends und NPS machen die Richtung sichtbar, ohne das Format zu stören.",
                  tag: "Broadcast",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900">{card.title}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                      {card.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-sm font-semibold text-slate-900">Add-ons (Pilot)</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Zusatzelemente sind bewusst transparent gehalten: keine Stimmen, keine XP, keine Prioritaet gegen Geld.
          </p>
          <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Baustein</th>
                  <th className="px-4 py-3">Preis</th>
                  <th className="px-4 py-3">Hinweis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Zusatzthema (Projekt)</td>
                  <td className="px-4 py-3 text-slate-700">1,99 EUR je Thema</td>
                  <td className="px-4 py-3 text-slate-600">Zusatzthemen ueber 10 hinaus (nur eDebatte Pro).</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Agenda &amp; Umfragen</td>
                  <td className="px-4 py-3 text-slate-700">max. 2,99 EUR je Teilnehmer</td>
                  <td className="px-4 py-3 text-slate-600">Preisstaffel je Team/Projekt, keine Hidden Fees.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Faktencheck (optional)</td>
                  <td className="px-4 py-3 text-slate-700">Preisstaffel (Stufe 0/1/2)</td>
                  <td className="px-4 py-3 text-slate-600">Budget, Freigaben und Run-Receipts je Kandidat.</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">Contributions-Hilfe (optional)</td>
                  <td className="px-4 py-3 text-slate-700">Preisstaffel</td>
                  <td className="px-4 py-3 text-slate-600">Alternativen, Eventualitaeten und Quellenarbeit.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { title: "Unverbindlich", text: "Vormerken heißt: kein Abo, keine Zahlung. Nur Interesse speichern." },
            { title: "Start-Info", text: "Wenn der Starttermin steht, bekommst du die Details (optional per Mail)." },
            { title: "Später anpassen", text: "Paketwechsel jederzeit möglich – im Konto oder erneut per Vormerkung." },
          ].map((b) => (
            <div key={b.title} className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{b.title}</p>
              <p className="mt-2 text-slate-700">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

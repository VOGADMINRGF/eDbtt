import type { Metadata } from "next";
import Link from "next/link";
import { buildPublicPageMetadata } from "@/lib/seo/publicDiscovery";

const TITLE = "eDebatte vs. CONSUL & Decidim – Wo Beteiligung beginnt";
const DESCRIPTION =
  "CONSUL und Decidim ermöglichen starke digitale Beteiligung. eDebatte setzt noch früher an: beim ungeklärten Anliegen, vor Verfahren und fertiger Forderung.";

export const metadata: Metadata = {
  ...buildPublicPageMetadata({
    path: "/vergleich/consul",
    title: TITLE,
    description: DESCRIPTION,
    ogType: "website",
  }),
  title: { absolute: TITLE },
};

const rows = [
  {
    dimension: "Startpunkt",
    established: "Debatte, Proposal, Initiative oder bereits eingerichteter Beteiligungsprozess",
    edebatte: "Anliegen, Problem, Beobachtung, offene Frage oder Quelle – auch ohne fertige Forderung",
  },
  {
    dimension: "Problemdefinition",
    established: "Der Gegenstand ist häufig bereits benannt oder als Vorschlag formuliert",
    edebatte: "Problem, Kontext und offene Fragen sollen vor einer fertigen Lösung gemeinsam geklärt werden können",
  },
  {
    dimension: "Evidenz",
    established: "Informationen, Dokumente und Diskussionen können Teil des Verfahrens sein",
    edebatte: "Quellen, Aussagen, Widersprüche und Unsicherheiten sollen mit dem Debattenstand nachvollziehbar verbunden bleiben",
  },
  {
    dimension: "Optionen",
    established: "Beteiligung findet oft innerhalb eines definierten Prozesses, Vorschlags oder Initiativrahmens statt",
    edebatte: "Handlungsoptionen und Zielkonflikte sollen aus dem Problemverständnis heraus sichtbar werden können",
  },
  {
    dimension: "Institutioneller Anschluss",
    established: "Institutionen können Betreiber, Adressaten oder Bearbeitungsinstanz des Prozesses sein",
    edebatte: "Institutionen bleiben Partner für Wissen, Verfahren und Umsetzung, müssen aber nicht den ersten Impuls setzen",
  },
];

export default function ConsulComparisonPage() {
  return (
    <main id="main-content" className="min-h-[100svh] bg-[color:var(--background)] text-[color:var(--foreground)]">
      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
            Vergleich ohne künstliche Feature-Schlacht
          </p>
          <h1 className="mt-4 max-w-5xl text-balance text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            eDebatte vs. CONSUL & Decidim: Der Unterschied liegt vor dem Verfahren.
          </h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
            CONSUL DEMOCRACY und Decidim sind leistungsfähige Open-Source-Systeme für digitale Bürgerbeteiligung. Bürgerinnen und Bürger können dort auch selbst Debatten, Proposals oder Initiativen anstoßen. eDebatte behauptet deshalb nicht, dass nur hier Themen von Bürgern ausgehen können.
          </p>
          <p className="mt-4 max-w-4xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">
            Die Abgrenzung liegt einen Schritt früher: <strong className="text-[color:var(--foreground)]">Ein ungeklärtes Anliegen darf der Anfang sein.</strong> Problem, Forderung und Lösungsrahmen müssen noch nicht feststehen.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/warum-edebatte" className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-black text-slate-950">
              Warum eDebatte? →
            </Link>
            <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--border)] px-6 py-3 font-black">
              Anliegen einbringen
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Die erste demokratische Frage</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-5xl">
              Nicht nur: Welche Option wählst du? Sondern zuerst: Welches Problem müssen wir überhaupt lösen?
            </h2>
          </div>
          <div className="space-y-4 text-base leading-7 text-[color:var(--muted)]">
            <p>
              CONSUL und Decidim decken wichtige Teile digitaler Demokratie ab: Debatten, Vorschläge, Initiativen, Beteiligungsprozesse und weitere Verfahren. Das ist keine Schwäche, sondern eine Stärke dieser Systeme.
            </p>
            <p>
              eDebatte setzt einen zusätzlichen Schwerpunkt auf den Raum davor: Problemdefinition, Agenda-Setting, Quellen, Perspektiven, Widersprüche und mögliche Alternativen – bevor aus einem gesellschaftlichen Signal bereits eine fertige Vorlage oder Forderung geworden ist.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Vergleich im Kern</p>
          <div className="mt-7 overflow-x-auto rounded-[1.5rem] border border-slate-700">
            <table className="w-full min-w-[780px] border-collapse text-left text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="p-4 font-black">Dimension</th>
                  <th className="p-4 font-black">CONSUL / Decidim</th>
                  <th className="p-4 font-black text-cyan-300">eDebatte-Zielbild</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.dimension} className="border-t border-slate-800 align-top">
                    <th className="p-4 font-black text-white">{row.dimension}</th>
                    <td className="p-4 leading-6 text-slate-300">{row.established}</td>
                    <td className="p-4 leading-6 text-slate-300">{row.edebatte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-[1.5rem] border border-[color:var(--border)] p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--muted)]">Klassische Verfahren</p>
            <h2 className="mt-3 text-2xl font-black">Verfahren zuerst</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Viele kommunale Lösungen sind besonders stark, wenn eine Verwaltung oder Organisation bereits ein Beteiligungsprojekt eröffnet hat und Beiträge, Kartenhinweise, Kommentare oder Bewertungen sammeln möchte.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-[color:var(--border)] p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[color:var(--muted)]">CONSUL / Decidim</p>
            <h2 className="mt-3 text-2xl font-black">Vorschlag oder Initiative zuerst</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Bürger können selbst Themen, Proposals oder Initiativen anstoßen. Damit beginnt Beteiligung bereits deutlich näher am Bürger als in rein institutionell eröffneten Verfahren.
            </p>
          </article>
          <article className="rounded-[1.5rem] border border-cyan-500/45 bg-cyan-500/6 p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">eDebatte</p>
            <h2 className="mt-3 text-2xl font-black">Anliegen zuerst</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Der Mensch darf noch davor beginnen: „Hier stimmt etwas nicht“, „Diese Frage fehlt“ oder „Diese Quelle sollten wir berücksichtigen“. Erst danach werden Problem, Evidenz und mögliche Handlungswege strukturiert.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-[color:var(--border)] px-5 py-14 text-center sm:py-16">
        <h2 className="mx-auto max-w-4xl text-3xl font-black tracking-[-0.03em] sm:text-5xl">
          eDebatte ist kein Ersatz für Verwaltung. Es erweitert, wo demokratische Beteiligung beginnen kann.
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-base leading-7 text-[color:var(--muted)]">
          Citizen-first bedeutet nicht citizen-only. Institutionen bleiben unverzichtbar für Fachwissen, formelle Verfahren, Recht, Ressourcen und Umsetzung. Der Unterschied: Die gesellschaftliche Agenda muss nicht erst auf eine institutionelle Einladung warten.
        </p>
      </section>
    </main>
  );
}

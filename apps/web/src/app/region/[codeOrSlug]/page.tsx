import Link from "next/link";
import { getRegionName } from "@core/regions/regionTranslations";
import { DEFAULT_LOCALE } from "@/config/locales";
import { getRegionSummaryWithFallback } from "@/lib/region/summary";

export const dynamic = "force-dynamic";

export default async function RegionLandingPage({
  params,
}: {
  params: Promise<{ codeOrSlug: string }>;
}) {
  const { codeOrSlug } = await params;
  const regionParam = decodeURIComponent(codeOrSlug);
  const { summary, requestedRegionKey, usedRegionKey, fallbackUsed } =
    await getRegionSummaryWithFallback({ regionCode: regionParam, limit: 5 });
  const regionLabel = await resolveRegionLabel(usedRegionKey, regionParam);
  const requestedLabel = await resolveRegionLabel(requestedRegionKey, regionParam);
  const lastUpdated = summary.lastUpdated
    ? new Date(summary.lastUpdated).toLocaleDateString("de-DE")
    : "n/a";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Region Landing
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{regionLabel}</h1>
        <div className="flex flex-wrap gap-3 text-xs text-[rgb(var(--muted))]">
          <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
            {usedRegionKey ?? regionParam}
          </span>
          <span>Letzte Aktualisierung: {lastUpdated}</span>
        </div>
      </header>

      {fallbackUsed && (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <p className="text-sm text-[rgb(var(--muted))]">
            Fuer <span className="font-semibold">{requestedLabel}</span> liegen noch keine Daten vor. Wir zeigen
            dir stattdessen die naechsthoehere Ebene:{" "}
            <span className="font-semibold">{regionLabel}</span>.
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Sei der Erste, der fuer deine Heimatregion etwas zur Abstimmung vorbringen will.
          </p>
          <Link
            href="/thema-einreichen"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Thema einreichen
          </Link>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <ModuleCard
          title="Dossier"
          description="Dossiers mit Claims, Quellen und Findings."
          href="/reports"
        />
        <ModuleCard
          title="Votes"
          description="Abstimmungen und Entscheidungsbaeume."
          href="/votes"
        />
        <ModuleCard
          title="Mandat"
          description="Umsetzung, Verantwortung und Wirkung."
          href="/howtoworks/edebatte/mandat"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Evidence-Claims" value={summary.claimCount} />
        <StatCard label="Decisions" value={summary.decisionCount} />
        <StatCard label="News-Quellen" value={summary.newsSourceCount} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
              Aktuelles aus der Region
            </h2>
            <span className="text-xs text-[rgb(var(--muted))]">Top 5</span>
          </div>
          {summary.feedItems.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              Noch keine Feed-Items fuer diese Region.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {summary.feedItems.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">
                      {item.source ?? "Quelle"}
                    </span>
                    {item.publishedAt && (
                      <span className="text-xs text-[rgb(var(--muted))]">
                        {new Date(item.publishedAt).toLocaleDateString("de-DE")}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-[rgb(var(--fg))]">
                    {item.url ? (
                      <a href={item.url} className="hover:underline">
                        {item.title}
                      </a>
                    ) : (
                      item.title
                    )}
                  </div>
                  {item.summary && (
                    <p className="text-xs text-[rgb(var(--muted))]">{item.summary}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Top Themen</h2>
            <span className="text-xs text-[rgb(var(--muted))]">Evidence Summary</span>
          </div>
          {summary.topics.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted))]">
              Keine Themencluster verfuegbar.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {summary.topics.map((topic) => (
                <span
                  key={topic.topicKey}
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs text-[rgb(var(--muted))]"
                >
                  {topic.topicKey || "allgemein"} - {topic.claimCount}
                </span>
              ))}
            </div>
          )}
          <div className="text-xs text-[rgb(var(--muted))]">
            Mehr Details im <Link href="/reports" className="underline">Report Hub</Link>.
          </div>
        </div>
      </section>
    </main>
  );
}

function ModuleCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[rgb(var(--border))] hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h3>
        <span className="text-xs font-semibold text-[rgb(var(--muted))]">Oeffnen {"->"}</span>
      </div>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{description}</p>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

async function resolveRegionLabel(regionKey: string | null, fallback: string): Promise<string> {
  if (!regionKey) return fallback;
  if (regionKey === "global") return "International";
  const name = await getRegionName(regionKey, DEFAULT_LOCALE);
  return name ?? regionKey;
}

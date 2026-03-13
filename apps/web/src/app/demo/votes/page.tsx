import Link from "next/link";
import { demoVotes, type DemoVote, type DemoVoteStatus } from "@features/votes/demoVotes";
import { getDemoPersonaConfig, parseDemoPersona, withPersona } from "@/features/demo/personas";
import {
  DEMO_STATUS_GLOSSARY,
  getDemoStatusLabel,
  mapVoteStatusToDemoKey,
} from "@/features/demo/statusLanguage";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type SortMode = "new" | "updated" | "controversial" | "reactions";

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function themeForVote(title: string) {
  const text = title.toLowerCase();
  if (text.includes("rad") || text.includes("tempo") || text.includes("verkehr")) return "Mobilität";
  if (text.includes("schule") || text.includes("bildung")) return "Bildung";
  if (text.includes("klima") || text.includes("energie")) return "Klima";
  if (text.includes("steuer") || text.includes("budget")) return "Finanzen";
  return "Kommunalpolitik";
}

function parseParticipationTarget(input: string) {
  const hit = input.replace(/\./g, "").match(/(\d{1,3}(?:\d{3})?)/);
  if (!hit) return 0;
  return Number(hit[1]);
}

function buildVotePool() {
  const labels = ["Update", "Review-Fassung", "Folgestand"] as const;
  const synthetic: DemoVote[] = demoVotes.slice(0, 3).map((vote, idx) => ({
    ...vote,
    id: `${vote.id}-update-${idx + 1}`,
    title: `${vote.title} · ${labels[idx]}`,
    status: idx === 0 ? "review" : idx === 1 ? "published" : "draft",
    updatedAt: new Date(new Date(vote.updatedAt).getTime() + (idx + 2) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  }));
  return [...demoVotes, ...synthetic];
}

function defaultSortForPersona(persona: "journalist" | "administration" | "citizen"): SortMode {
  if (persona === "journalist") return "updated";
  if (persona === "administration") return "controversial";
  return "new";
}

export default async function DemoVotesPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));
  const personaCfg = getDemoPersonaConfig(persona);
  const votePool = buildVotePool();

  const q = (readParam(resolved?.q) ?? "").trim().toLowerCase();
  const statusFilter = (readParam(resolved?.status) ?? "all") as "all" | DemoVoteStatus;
  const regionFilter = (readParam(resolved?.region) ?? "all").trim();
  const themeFilter = (readParam(resolved?.theme) ?? "all").trim();
  const sort = ((readParam(resolved?.sort) as SortMode | undefined) ?? defaultSortForPersona(persona)) as SortMode;

  const regionOptions = Array.from(new Set(votePool.map((vote) => vote.regionLabel))).sort((a, b) =>
    a.localeCompare(b),
  );
  const themeOptions = Array.from(new Set(votePool.map((vote) => themeForVote(vote.title)))).sort((a, b) =>
    a.localeCompare(b),
  );

  const filtered = votePool.filter((vote) => {
    if (statusFilter !== "all" && vote.status !== statusFilter) return false;
    if (regionFilter !== "all" && vote.regionLabel !== regionFilter) return false;
    const theme = themeForVote(vote.title);
    if (themeFilter !== "all" && theme !== themeFilter) return false;
    if (!q) return true;
    const hay = `${vote.title} ${vote.summary} ${vote.regionLabel} ${theme}`.toLowerCase();
    return hay.includes(q);
  });

  const sortedVotes = [...filtered].sort((a, b) => {
    if (sort === "new") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    if (sort === "reactions") {
      return parseParticipationTarget(b.participationTarget) - parseParticipationTarget(a.participationTarget);
    }
    const controversialScore = (vote: DemoVote) => vote.options.length * 2 + vote.claims.length - vote.evidence.length;
    return controversialScore(b) - controversialScore(a);
  });

  const roleHint =
    persona === "journalist"
      ? "Journalistischer Fokus: strittige, offene und aktualisierte Abstimmungen mit klaren Signalen."
      : persona === "administration"
        ? "Verwaltungsfokus: priorisiert nach Konflikt-/Umsetzungsdruck und Status."
        : "Bürgerfokus: klare Optionen, Status und nachvollziehbare Evidenzhinweise.";

  const reviewCount = sortedVotes.filter((item) => item.status === "review").length;
  const draftCount = sortedVotes.filter((item) => item.status === "draft").length;
  const publishedCount = sortedVotes.filter((item) => item.status === "published").length;

  const newestUpdated = sortedVotes.reduce((max, item) => {
    const ts = new Date(item.updatedAt).getTime();
    return Number.isFinite(ts) ? Math.max(max, ts) : max;
  }, 0);
  const enrichedVotes = sortedVotes.map((vote) => {
    const updatedTs = new Date(vote.updatedAt).getTime();
    const isNew = newestUpdated > 0 && updatedTs >= newestUpdated - 10 * 24 * 60 * 60 * 1000;
    const isControversial = vote.options.length >= 3 || vote.claims.length >= 3;
    const isRelevant = vote.evidence.length >= 3 || parseParticipationTarget(vote.participationTarget) >= 8000;
    return { vote, isNew, isControversial, isRelevant };
  });
  const signalSummary = enrichedVotes.reduce(
    (acc, item) => {
      if (item.vote.status === "review") acc.inReview += 1;
      if (item.isRelevant) acc.relevant += 1;
      if (item.isNew) acc.newCount += 1;
      if (item.isControversial) acc.controversial += 1;
      return acc;
    },
    { inReview: 0, relevant: 0, newCount: 0, controversial: 0 },
  );

  function hrefWith(next: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("persona", persona);
    if (q) params.set("q", q);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (regionFilter !== "all") params.set("region", regionFilter);
    if (themeFilter !== "all") params.set("theme", themeFilter);
    if (sort) params.set("sort", sort);
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === "all") params.delete(key);
      else params.set(key, value);
    });
    return `/demo/abstimmungen?${params.toString()}`;
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Demo - Abstimmungen
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Abstimmungsübersicht · {personaCfg.label}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {roleHint} Statussprache im Demo-Flow:{" "}
          {DEMO_STATUS_GLOSSARY.filter((item) => ["open", "in_review", "confirmed", "verified"].includes(item.key))
            .map((item) => item.label)
            .join(" · ")}
          .
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
        <form method="GET" action="/demo/abstimmungen" className="grid gap-3 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <input type="hidden" name="persona" value={persona} />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Suche nach Thema, Region, Stichwort..."
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          />
          <select
            name="region"
            defaultValue={regionFilter}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Region: alle</option>
            {regionOptions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          <select
            name="theme"
            defaultValue={themeFilter}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="all">Thema: alle</option>
            {themeOptions.map((theme) => (
              <option key={theme} value={theme}>
                {theme}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
          >
            <option value="new">Sortierung: neu</option>
            <option value="updated">Sortierung: zuletzt geändert</option>
            <option value="controversial">Sortierung: kontrovers</option>
            <option value="reactions">Sortierung: viele Reaktionen</option>
          </select>
        </form>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <Link
            href={hrefWith({ status: "all" })}
            aria-current={statusFilter === "all" ? "page" : undefined}
            className={`vog-tab ${statusFilter === "all" ? "vog-tab--active" : ""}`}
          >
            Status: alle
          </Link>
          <Link
            href={hrefWith({ status: "draft" })}
            aria-current={statusFilter === "draft" ? "page" : undefined}
            className={`vog-tab ${statusFilter === "draft" ? "vog-tab--active" : ""}`}
          >
            {getDemoStatusLabel("open")}
          </Link>
          <Link
            href={hrefWith({ status: "review" })}
            aria-current={statusFilter === "review" ? "page" : undefined}
            className={`vog-tab ${statusFilter === "review" ? "vog-tab--active" : ""}`}
          >
            {getDemoStatusLabel("in_review")}
          </Link>
          <Link
            href={hrefWith({ status: "published" })}
            aria-current={statusFilter === "published" ? "page" : undefined}
            className={`vog-tab ${statusFilter === "published" ? "vog-tab--active" : ""}`}
          >
            {getDemoStatusLabel("confirmed")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip vog-chip--status">
            {getDemoStatusLabel("in_review")}: {reviewCount}
          </span>
          <span className="vog-chip vog-chip--status">
            {getDemoStatusLabel("open")}: {draftCount}
          </span>
          <span className="vog-chip vog-chip--status">
            {getDemoStatusLabel("confirmed")}: {publishedCount}
          </span>
          <span className="vog-chip vog-chip--status">Gesamt: {sortedVotes.length}</span>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
          Redaktioneller Schnellblick: {signalSummary.inReview} in Prüfung · {signalSummary.relevant} relevant ·{" "}
          {signalSummary.newCount} neu · {signalSummary.controversial} strittig
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {enrichedVotes.map(({ vote, isNew, isControversial, isRelevant }) => {
          const detailId = vote.id.includes("-update-") ? vote.id.split("-update-")[0] : vote.id;
          const theme = themeForVote(vote.title);
          return (
            <article
              key={vote.id}
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
                  {vote.regionLabel}
                </span>
                <span>Status: {getDemoStatusLabel(mapVoteStatusToDemoKey(vote.status))}</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{vote.title}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{vote.summary}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="vog-chip">{theme}</span>
                <span className="vog-chip">{vote.options.length} Optionen</span>
                <span className="vog-chip">{vote.evidence.length} Evidenzpunkte</span>
                <span className="vog-chip">{Math.max(1, vote.claims.length - 1)} offene Fragen</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px]">
                {isNew ? (
                  <span className="vog-chip border-cyan-300 bg-cyan-100 text-cyan-800 dark:border-cyan-400/40 dark:bg-cyan-500/12 dark:text-cyan-200">
                    neu
                  </span>
                ) : null}
                {vote.status === "review" ? (
                  <span className="vog-chip border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/45 dark:bg-amber-500/10 dark:text-amber-200">
                    in Prüfung
                  </span>
                ) : null}
                {isControversial ? (
                  <span className="vog-chip border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-400/45 dark:bg-rose-500/10 dark:text-rose-200">
                    strittig
                  </span>
                ) : null}
                {isRelevant ? (
                  <span className="vog-chip border-emerald-300 bg-emerald-100 text-emerald-800 dark:border-emerald-400/45 dark:bg-emerald-500/10 dark:text-emerald-200">
                    relevant
                  </span>
                ) : null}
              </div>
              <div className="text-xs text-[rgb(var(--muted))]">
                <p>{vote.participationTarget}</p>
                <p>Letztes Update: {new Date(vote.updatedAt).toLocaleDateString("de-DE")}</p>
              </div>
              <Link
                href={withPersona(`/demo/abstimmungen/${detailId}`, persona)}
                className="btn btn-primary text-sm"
              >
                Details ansehen
              </Link>
            </article>
          );
        })}
      </section>

      {sortedVotes.length === 0 ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-6 text-sm text-[rgb(var(--muted))]">
          Keine Treffer für die aktuelle Filterkombination.
        </section>
      ) : null}
    </main>
  );
}

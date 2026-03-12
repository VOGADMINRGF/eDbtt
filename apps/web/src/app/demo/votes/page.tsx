import Link from "next/link";
import { demoVotes } from "@features/votes/demoVotes";
import { getDemoPersonaConfig, parseDemoPersona, withPersona } from "@/features/demo/personas";
import {
  DEMO_STATUS_GLOSSARY,
  getDemoStatusLabel,
  mapVoteStatusToDemoKey,
} from "@/features/demo/statusLanguage";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function themeForVote(title: string) {
  const text = title.toLowerCase();
  if (text.includes("rad") || text.includes("tempo")) return "Mobilitaet";
  if (text.includes("schule")) return "Bildung";
  if (text.includes("klima")) return "Klima";
  return "Kommunalpolitik";
}

export default async function DemoVotesPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));
  const personaCfg = getDemoPersonaConfig(persona);

  const sortedVotes = [...demoVotes].sort((a, b) => {
    if (persona === "journalist") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    if (persona === "administration") {
      const order = { review: 0, draft: 1, published: 2 } as const;
      return order[a.status] - order[b.status];
    }
    const order = { published: 0, review: 1, draft: 2 } as const;
    return order[a.status] - order[b.status];
  });

  const roleHint =
    persona === "journalist"
      ? "Sortiert nach zuletzt geaendert. Fokus auf strittige und offene Abstimmungen."
      : persona === "administration"
        ? "Sortiert nach Handlungsdruck (review -> draft -> published)."
        : "Sortiert nach Beteiligungsreife (published zuerst).";

  const reviewCount = sortedVotes.filter((item) => item.status === "review").length;
  const draftCount = sortedVotes.filter((item) => item.status === "draft").length;
  const publishedCount = sortedVotes.filter((item) => item.status === "published").length;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Demo - Abstimmungen
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Abstimmungsuebersicht · {personaCfg.label}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {roleHint} Statussprache im Demo-Flow:{" "}
          {DEMO_STATUS_GLOSSARY.filter((item) => ["open", "in_review", "confirmed", "verified"].includes(item.key))
            .map((item) => item.label)
            .join(" · ")}
          .
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">
            {getDemoStatusLabel("in_review")}: {reviewCount}
          </span>
          <span className="vog-chip">
            {getDemoStatusLabel("open")}: {draftCount}
          </span>
          <span className="vog-chip">
            {getDemoStatusLabel("confirmed")}: {publishedCount}
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {sortedVotes.map((vote) => (
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
              <span className="vog-chip">{themeForVote(vote.title)}</span>
              <span className="vog-chip">{vote.options.length} Optionen</span>
              <span className="vog-chip">{vote.evidence.length} Evidenzpunkte</span>
              <span className="vog-chip">{Math.max(1, vote.claims.length - 1)} offene Fragen</span>
            </div>
            <div className="text-xs text-[rgb(var(--muted))]">
              <p>{vote.participationTarget}</p>
              <p>Letztes Update: {new Date(vote.updatedAt).toLocaleDateString("de-DE")}</p>
            </div>
            <Link
              href={withPersona(`/demo/votes/${vote.id}`, persona)}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Details ansehen
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

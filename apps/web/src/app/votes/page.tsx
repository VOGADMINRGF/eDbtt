import { cookies } from "next/headers";
import Link from "next/link";
import { listPublicVotes } from "@features/votes/service";

export const dynamic = "force-dynamic";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function VotesPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const userId = (await cookies()).get("u_id")?.value ?? null;
  const { items } = await listPublicVotes({ limit: 50, includeDraft: false, userId });
  const resolved = searchParams ? await searchParams : {};
  const q = (readParam(resolved?.q) ?? "").trim().toLowerCase();
  const statementId = (readParam(resolved?.statementId) ?? "").trim().toLowerCase();

  const withSearchBlob = items.map((vote) => {
    const claimsText = (vote.claims ?? [])
      .map((claim) => {
        if (typeof claim === "string") return claim;
        try {
          return JSON.stringify(claim);
        } catch {
          return String(claim);
        }
      })
      .join(" ");
    return {
      vote,
      haystack: `${vote.title} ${vote.summary ?? ""} ${claimsText}`.toLowerCase(),
    };
  });

  const directStatementMatches = statementId
    ? withSearchBlob.filter((item) => item.haystack.includes(statementId))
    : [];
  const topicMatches = q ? withSearchBlob.filter((item) => item.haystack.includes(q)) : withSearchBlob;

  const filtered =
    statementId && directStatementMatches.length > 0
      ? directStatementMatches.map((item) => item.vote)
      : statementId && q
        ? topicMatches.map((item) => item.vote)
        : q
          ? topicMatches.map((item) => item.vote)
          : items;
  const usingTopicFallback = statementId && directStatementMatches.length === 0 && Boolean(q);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Evidenz · Abstimmungen</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Öffentliche Abstimmungen &amp; Umfragevorlagen</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Diese Abstimmungen wurden redaktionell geprüft. Jede Vorlage verlinkt auf belegte Aussagen, damit du direkt
          sehen kannst, welche Quellen und Entscheidungen dahinter stehen. eDebatte macht Quellen, Minderheitenberichte
          und Datenpakete sichtbar, damit Politik, Verbände und Medien belastbare Entscheidungen begleiten können.
        </p>
      </header>
      {q || statementId ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Gefiltert nach Thema: <span className="font-semibold text-[rgb(var(--fg))]">{q || statementId}</span>
          {usingTopicFallback ? (
            <p className="mt-1 text-xs">
              Keine direkte Statement-Verknüpfung gefunden. Es werden thematisch passende Abstimmungen gezeigt.
            </p>
          ) : null}
        </section>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((vote) => (
          <article key={vote.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-[rgb(var(--muted))]">
              <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">
                {vote.regionLabel || vote.regionCode || "GLOBAL"}
              </span>
              <span>{new Date(vote.createdAt).toLocaleDateString("de-DE")}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{vote.title}</h2>
              {vote.summary && <p className="text-sm text-[rgb(var(--muted))] mt-2">{vote.summary}</p>}
            </div>
            <div className="text-xs text-[rgb(var(--muted))]">
              <p>Eingehende Aussagen: {vote.claimCount ?? vote.claims.length}</p>
              <p>Status: {vote.status === "published" ? "Veröffentlicht" : vote.status}</p>
            </div>
            <Link
              href={`/votes/${vote.id}`}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Abstimmung ansehen
            </Link>
          </article>
        ))}
      </div>
      {filtered.length === 0 ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Keine thematisch passenden Abstimmungen gefunden. Du kannst im Dossier weiterarbeiten oder den Filter entfernen.
        </section>
      ) : null}
    </main>
  );
}

import { cookies } from "next/headers";
import Link from "next/link";
import { getPublicVoteDetail } from "@features/votes/service";
import { VoteButtons } from "./VoteButtons";

export const dynamic = "force-dynamic";

export default async function VoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = (await cookies()).get("u_id")?.value ?? null;
  const result = await getPublicVoteDetail(id, userId);
  if (!result.ok) {
    const levelHint =
      result.error === "login_required"
        ? "Bitte melde dich an, um an Abstimmungen teilzunehmen."
        : result.error === "insufficient_level"
        ? "Diese Abstimmung erfordert eine bestätigte Identität (E-Mail-Level oder höher)."
        : "Abstimmung konnte nicht geladen werden.";
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center gap-3 px-4 text-center text-[rgb(var(--muted))]">
        <p className="text-sm">{levelHint}</p>
        <Link href="/register/identity" className="text-sm font-semibold text-sky-600 underline">
          Verifizierung starten
        </Link>
      </main>
    );
  }

  const vote = result.vote;
  return (
    <main className="mx-auto min-h-screen max-w-4xl space-y-6 px-4 py-8">
      <header className="space-y-2">
        <Link href="/votes" className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">
          &larr; Zur Übersicht
        </Link>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Abstimmung · Evidenz</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{vote.title}</h1>
        {vote.summary && <p className="text-sm text-[rgb(var(--muted))] max-w-3xl">{vote.summary}</p>}
        <p className="text-xs text-[rgb(var(--muted))]">
          Status: {vote.status} · Erstellt am {new Date(vote.createdAt).toLocaleDateString("de-DE")}
        </p>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Kernaussagen dieser Abstimmung</h2>
        {vote.claims.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Keine Aussagen hinterlegt.</p>
        ) : (
          <ol className="space-y-3">
            {vote.claims.map((claim, idx) => (
              <li key={idx} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
                <span className="text-xs font-semibold text-[rgb(var(--muted))]">Aussage #{idx + 1}</span>
                <p>{claim.text}</p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Evidenz & Quellen</h3>
          {vote.regionCode && (
            <p className="text-sm text-[rgb(var(--muted))]">
              Region: {String(vote.regionCode)} –{" "}
              <Link href={`/evidence/${vote.regionCode}`} className="text-sky-600 underline">
                Evidenz-Ansicht öffnen
              </Link>
            </p>
          )}
          {vote.sourceUrl ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              Quelle:{" "}
              <a href={vote.sourceUrl} target="_blank" rel="noreferrer" className="text-sky-600 underline">
                {vote.sourceUrl}
              </a>
            </p>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">Keine externe Quelle verlinkt.</p>
          )}
        </div>
        {vote.statementId ? (
          <VoteButtons statementId={vote.statementId} />
        ) : (
          <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 text-sm text-[rgb(var(--muted))]">
            Abstimmung ist noch nicht live geschaltet.
          </div>
        )}
      </section>
    </main>
  );
}

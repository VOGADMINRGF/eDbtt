import Link from "next/link";
import { notFound } from "next/navigation";
import { getDemoPersonaConfig, parseDemoPersona, withPersona } from "@/features/demo/personas";
import { readStringParam, resolveSurfaceContext } from "@/features/surface";
import { listRoundsByTopicSlug, listTopics } from "@features/topicRound";

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

function roundTypeLabel(type: string) {
  if (type === "event") return "Event";
  if (type === "livestream") return "Livestream";
  if (type === "video") return "Video";
  if (type === "article") return "Artikel";
  if (type === "podcast") return "Podcast";
  if (type === "session") return "Session";
  return "Open Round";
}

function roundSourceParam(type: string) {
  if (type === "article") return "article";
  if (type === "video") return "video";
  if (type === "podcast") return "podcast";
  if (type === "session") return "session";
  if (type === "event") return "event";
  if (type === "livestream") return "livestream";
  return "session";
}

export default async function DemoRoundsPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readStringParam(resolved?.persona));
  const personaCfg = getDemoPersonaConfig(persona);
  const context = resolveSurfaceContext({
    mode: "demo",
    audience:
      persona === "journalist" ? "journalist" : persona === "administration" ? "verwaltung" : "buerger",
    dataSource: "seed",
  });

  const topics = listTopics();
  const topic = topics[0];
  if (!topic) notFound();

  const rounds = listRoundsByTopicSlug(topic.slug);
  const featuredRound = rounds[0] ?? null;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Demo - Runden
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Gefuehrter Topic-Round Einstieg</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Persona: {personaCfg.label}. Diese Demo ist nur ein Wrapper. Die kanonische Logik liegt auf den
          produktiven Routen <span className="font-semibold">/topic/[slug]</span> und{" "}
          <span className="font-semibold">/round/[slug]</span>.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">Modus: {context.mode}</span>
          <span className="vog-chip">Datenquelle: {context.dataSource}</span>
          <span className="vog-chip">Topic: 1 kanonischer Hub</span>
          <span className="vog-chip">Runden: {rounds.length}</span>
        </div>
      </header>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Kanonisches Topic</h2>
          <Link href={`/topic/${topic.slug}`} className="btn btn-primary text-xs">
            Produktive Topic-Seite oeffnen
          </Link>
        </div>
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{topic.title}</p>
        <p className="text-sm text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Guardrail: Jede Runde fuehrt sichtbar auf dieses Topic zurueck.
        </p>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Runden ueber mehrere Medien</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {rounds.map((round) => (
            <article key={round.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="vog-chip">{roundTypeLabel(round.type)}</span>
                <span className="vog-chip vog-chip--status">{round.status === "open" ? "offen" : "abgeschlossen"}</span>
              </div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{round.title}</p>
              <p className="text-sm text-[rgb(var(--muted))]">{round.summary}</p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/round/${round.slug}?entry=qr&source=${roundSourceParam(round.type)}&persona=${persona}`}
                  className="btn-secondary text-xs"
                >
                  Produktive Round oeffnen
                </Link>
                <Link href={`/round/manage/${round.slug}/merge`} className="btn-secondary text-xs">
                  Merge-Assist Review
                </Link>
                <Link href={`/topic/${topic.slug}`} className="btn-secondary text-xs">
                  Zum Topic
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Roadmap-Vorschau</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Manuell gepflegte naechste Schritte im Topic-Hub, ohne KI-Abhaengigkeit.
          </p>
          <ul className="space-y-2 text-sm">
            {topic.roadmap.slice(0, 4).map((item) => (
              <li key={item.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                <p className="font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                <p className="text-[rgb(var(--muted))]">{item.unresolved}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Beteiligung aus den Runden</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Fragen, Quellen, Widersprueche und Follow-ups laufen in dieselbe produktive Struktur zurueck.
          </p>
          <ul className="space-y-2 text-sm">
            {rounds.slice(0, 4).map((round) => (
              <li key={`${round.id}-count`} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                <p className="font-semibold text-[rgb(var(--fg))]">{round.title}</p>
                <p className="text-[rgb(var(--muted))]">
                  Beitraege: {round.contributions.length} · Offene Punkte: {round.openPoints.length}
                </p>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Distribution Demo (QR / Embed / Share Entry)</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Beispiele mit `entry=qr`, `source=*` und `persona=*` auf produktiven Routen.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/topic/${topic.slug}?entry=qr&source=article&persona=${persona}`}
            className="btn-secondary text-xs"
          >
            Topic via QR-Entry
          </Link>
          <Link
            href={`/embed/topic/${topic.slug}?entry=qr&source=article&persona=${persona}`}
            className="btn-secondary text-xs"
          >
            Embed Topic Preview
          </Link>
          {featuredRound ? (
            <Link
              href={`/embed/round/${featuredRound.slug}?entry=qr&source=${roundSourceParam(featuredRound.type)}&persona=${persona}`}
              className="btn-secondary text-xs"
            >
              Embed Round Preview
            </Link>
          ) : (
            <span className="btn-secondary text-xs opacity-70">Embed Round Preview (keine Runde)</span>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Governance Demo (Reviewlog / Source Classes)</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Demo zeigt nur die produktive Governance-Route mit Reviewtrail, Konfliktmarkern und Mandat-Bruecke.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/topic/manage/${topic.slug}/governance`} className="btn-secondary text-xs">
            Topic Governance oeffnen
          </Link>
          {rounds[0] ? (
            <Link href={`/round/manage/${rounds[0].slug}/merge`} className="btn-secondary text-xs">
              Round Merge Review oeffnen
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Weiter im Demo-Studio</h2>
        <div className="flex flex-wrap gap-2">
          <Link href={withPersona("/demo", persona)} className="btn-secondary text-xs">
            Demo-Studio
          </Link>
          <Link href={withPersona("/demo/create", persona)} className="btn-secondary text-xs">
            Demo Mitwirken
          </Link>
          <Link href={withPersona("/demo/dossier", persona)} className="btn-secondary text-xs">
            Demo Dossier
          </Link>
        </div>
      </section>
    </main>
  );
}

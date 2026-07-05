import Link from "next/link";
import type { Metadata } from "next";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import { listRoundsByTopicSlug, listTopics, type Topic } from "@features/topicRound";
import ThemenStartDraftAssistant from "./ThemenStartDraftAssistant";

export const metadata: Metadata = {
  title: "Themen · eDebatte",
  description: "Aktuelle, geplante und archivierte Themen mit klaren Anschlusswegen.",
};

type ThemenStage = "aktuell" | "geplant" | "archiv";

const AKTUELL_READINESS = new Set([
  "opened",
  "gathering_questions",
  "evidence_growing",
  "conflicts_visible",
  "options_clarifying",
]);

const GEPLANT_READINESS = new Set(["next_round_needed", "ready_for_vote_check", "in_implementation"]);

function mapTopicStage(topic: Topic): ThemenStage {
  if (AKTUELL_READINESS.has(topic.readiness)) return "aktuell";
  if (GEPLANT_READINESS.has(topic.readiness)) return "geplant";
  return "archiv";
}

function topicReadinessLabel(topic: Topic) {
  switch (topic.readiness) {
    case "ready_for_vote_check":
      return "Prüfung für Abstimmung";
    case "next_round_needed":
      return "Nächste Runde vorgesehen";
    case "in_implementation":
      return "In Umsetzung";
    case "monitoring_impact":
      return "Wirkung wird beobachtet";
    default:
      return "In Bearbeitung";
  }
}

function sortTopicsByWorkload(topics: Topic[]) {
  return [...topics].sort((a, b) => {
    const roundsA = listRoundsByTopicSlug(a.slug).length;
    const roundsB = listRoundsByTopicSlug(b.slug).length;
    if (roundsA !== roundsB) return roundsB - roundsA;
    return a.title.localeCompare(b.title, "de");
  });
}

function StageSection({
  title,
  subtitle,
  topics,
  emptyText,
}: {
  title: string;
  subtitle: string;
  topics: Topic[];
  emptyText: string;
}) {
  return (
    <section className="space-y-3 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
          <p className="text-sm text-[rgb(var(--muted))]">{subtitle}</p>
        </div>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">
          {topics.length}
        </span>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm leading-6 text-[rgb(var(--muted))]">
          {emptyText}
        </div>
      ) : (
        <ul className="grid gap-3">
          {topics.map((topic) => {
            const rounds = listRoundsByTopicSlug(topic.slug);
            const openRounds = rounds.filter((round) => round.status === "open").length;
            const closedRounds = rounds.length - openRounds;
            return (
              <li key={topic.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{topic.title}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
                  </div>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                    {topicReadinessLabel(topic)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1">
                    Offene Runden: {openRounds}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1">
                    Abgeschlossene Runden: {closedRounds}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/topic/${topic.slug}`} className="btn-secondary inline-flex">
                    Themenraum öffnen
                  </Link>
                  <Link href={`/runden?topic=${encodeURIComponent(topic.slug)}`} className="btn-secondary inline-flex">
                    Anlassraum nutzen
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default function ThemenPage() {
  const sortedTopics = sortTopicsByWorkload(listTopics());
  const aktuell = sortedTopics.filter((topic) => mapTopicStage(topic) === "aktuell");
  const geplant = sortedTopics.filter((topic) => mapTopicStage(topic) === "geplant");
  const archiv = sortedTopics.filter((topic) => mapTopicStage(topic) === "archiv");

  return (
    <ProductSurfaceShell>
      <header className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Themen</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">Themen, an die dein Beitrag anknüpfen kann.</h1>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base">
          eDebatte sammelt Anliegen nicht als lose Kommentare. Themen zeigen, welche Fragen bereits sichtbar sind, welche Beteiligungsräume vorbereitet werden und wo ein Beitrag weiterhelfen kann.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/create?intent=issue_signal" className="btn-primary inline-flex">
            Beitrag einordnen
          </Link>
          <Link href="/runden" className="btn-secondary inline-flex">
            Anlassräume ansehen
          </Link>
          <Link href="/create?intent=round_setup" className="btn-secondary inline-flex">
            Abstimmungsfähigkeit prüfen
          </Link>
        </div>
      </header>

      <ThemenStartDraftAssistant
        topics={sortedTopics.map((topic) => ({
          slug: topic.slug,
          title: topic.title,
          framingQuestion: topic.framingQuestion,
        }))}
      />

      <div className="mt-8 space-y-4">
        <StageSection
          title="Aktuell"
          subtitle="Themen mit sichtbarem Arbeitsstand und möglicher Beteiligung."
          topics={aktuell}
          emptyText="Hier erscheinen Themen, sobald ein Anliegen ausreichend eingeordnet wurde. Bis dahin kannst du einen eigenen Beitrag starten oder vorhandene Anlassräume ansehen."
        />
        <StageSection
          title="Geplant"
          subtitle="Nächste Runden, Prüfungen oder strukturierte Umsetzungsschritte."
          topics={geplant}
          emptyText="Noch ist kein nächster öffentlicher Schritt geplant. Ein Thema wandert hierher, wenn offene Fragen, Zuständigkeit und möglicher Beteiligungsrahmen geklärt sind."
        />
        <StageSection
          title="Archiv"
          subtitle="Abgeschlossene oder beobachtete Themen mit nachvollziehbarem Verlauf."
          topics={archiv}
          emptyText="Archivierte Themen erscheinen hier erst, wenn eine Runde abgeschlossen oder eine Wirkung nachvollziehbar beobachtet wurde."
        />
      </div>
    </ProductSurfaceShell>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  canManageTopicRoundGovernance,
  getTopicBySlug,
  listRoundsByTopicSlug,
  listTopicReviewLog,
} from "@features/topicRound";
import { getSessionUser } from "@/lib/server/auth/sessionUser";

const REVIEW_STATUS_LABELS = {
  submitted: "eingereicht",
  under_review: "in Review",
  merged_into_existing_item: "in bestehendes Item gemerged",
  accepted_as_new_draft: "als neuer Draft akzeptiert",
  marked_duplicate: "als Duplikat markiert",
  deferred_to_next_round: "auf nächste Runde vertagt",
  rejected: "abgelehnt",
} as const;

const SOURCE_CLASS_LABELS = {
  primary_source: "Primärquelle",
  secondary_report: "Sekundärbericht",
  official_document: "Offizielles Dokument",
  eyewitness_or_affected_account: "Betroffenen-/Zeugenbericht",
  media_report: "Medienbericht",
  unverified_claim: "Unverifizierte Behauptung",
  creator_media_source: "Creator-Medienquelle",
  community_note: "Community-Notiz",
} as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Params = {
  params: Promise<{ slug: string }>;
};

export default async function TopicGovernancePage({ params }: Params) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const rounds = listRoundsByTopicSlug(topic.slug);

  const sessionUser = await getSessionUser().catch(() => null);
  const roles = Array.isArray(sessionUser?.roles) ? sessionUser.roles.map((item) => String(item).toLowerCase()) : [];
  const canManage = canManageTopicRoundGovernance(roles);
  const visibleLog = listTopicReviewLog(topic.slug, canManage);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Topic Manage · Governance</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{topic.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Reviewlog, Source Classes, Konfliktlage und Export-/Handoff-Readiness für operative Nutzung.
        </p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">Rounds: {rounds.length}</span>
          <span className="vog-chip">Reviewlog Entries: {visibleLog.length}</span>
          <span className="vog-chip">{canManage ? "Management Details aktiv" : "Public Detailansicht"}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/topic/${topic.slug}`} className="btn btn-primary text-xs">
            Zum Topic
          </Link>
          {rounds[0] ? (
            <Link href={`/round/${rounds[0].slug}`} className="btn-secondary text-xs">
              Letzte Round
            </Link>
          ) : null}
        </div>
      </header>

      {!canManage ? (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Management-Only Felder (interne Begründung, interne Rationale) sind ausgeblendet.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Reviewlog / Provenance Trail</h2>
          <div className="space-y-2 text-sm">
            {visibleLog.map((entry) => (
              <article key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-1">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="vog-chip">{REVIEW_STATUS_LABELS[entry.status]}</span>
                  <span className="vog-chip">{entry.scope}</span>
                  <span className="text-[rgb(var(--muted))]">{formatDate(entry.reviewedAt)}</span>
                </div>
                <p className="font-semibold text-[rgb(var(--fg))]">{entry.title}</p>
                <p className="text-[rgb(var(--muted))]">{entry.summary}</p>
                {entry.publicReason ? <p className="text-[rgb(var(--muted))]">Öffentlicher Grund: {entry.publicReason}</p> : null}
                {canManage && entry.internalReason ? (
                  <p className="text-[rgb(var(--muted))]">Interne Begründung: {entry.internalReason}</p>
                ) : null}
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Source Classes + Konfliktlage</h2>
          <div className="space-y-2 text-sm">
            {topic.sources.map((source) => (
              <article key={source.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="vog-chip">{SOURCE_CLASS_LABELS[source.sourceClass]}</span>
                  <span className="text-[rgb(var(--muted))]">{source.publisher}</span>
                </div>
                <p className="font-semibold text-[rgb(var(--fg))]">{source.title}</p>
              </article>
            ))}
          </div>
          <div className="space-y-2">
            {topic.conflicts.map((conflict) => (
              <article key={conflict.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm space-y-1">
                <p className="font-semibold text-[rgb(var(--fg))]">{conflict.title}</p>
                <p className="text-[rgb(var(--muted))]">{conflict.details}</p>
                <p className="text-xs text-[rgb(var(--muted))]">Status: {conflict.unresolved ? "unresolved" : "geklärt"}</p>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Readiness + Export</h2>
          <p className="text-sm text-[rgb(var(--muted))]">{topic.exportSnapshot.conciseSummary}</p>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[rgb(var(--fg))]">Nächste-Runde-Agenda</p>
            <ul className="space-y-1 text-[rgb(var(--muted))]">
              {topic.exportSnapshot.nextRoundAgenda.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">{topic.exportSnapshot.handoffNote}</p>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Mandat-Brücke</h2>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[rgb(var(--fg))]">Klar genug für Umsetzung</p>
            <ul className="space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.clarifiedNow.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[rgb(var(--fg))]">Vorher noch offen</p>
            <ul className="space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.openBeforeImplementation.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-[rgb(var(--fg))]">Monitoring-Fokus</p>
            <ul className="space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.monitoringFocus.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </main>
  );
}

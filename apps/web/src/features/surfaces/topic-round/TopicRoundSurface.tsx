import Link from "next/link";
import type { SurfaceContext } from "@/features/surface";
import type { Round, Topic, TopicRoadmapItem } from "@features/topicRound";
import type { DistributionContext } from "./distribution";
import { absoluteUrl, withDistributionQuery } from "./distribution";
import SharePanel from "./SharePanel";
import PublicFollowUpBlock from "./PublicFollowUpBlock";

const ROUND_TYPE_LABELS: Record<Round["type"], string> = {
  event: "Event",
  livestream: "Livestream",
  video: "Video",
  article: "Artikel",
  podcast: "Podcast",
  session: "Session",
  open_round: "Open Round",
};

const ROUND_STATUS_LABELS: Record<Round["status"], string> = {
  open: "offen",
  closed: "abgeschlossen",
};

const ROADMAP_CATEGORY_LABELS: Record<TopicRoadmapItem["category"], string> = {
  evidence_missing: "Evidenz fehlt",
  counterposition_missing: "Gegenposition fehlt",
  authority_response_needed: "Antwort der zuständigen Stelle nötig",
  option_needs_detail: "Option braucht mehr Details",
  implementation_question: "Umsetzungsfrage offen",
  legal_check_needed: "Rechtliche Prüfung nötig",
  moderation_followup: "Moderations-Follow-up",
  next_round_question: "Nächster Rundenfokus",
  ready_for_vote_check: "Vote-Check vorbereiten",
};

const TOPIC_READINESS_LABELS: Record<Topic["readiness"], string> = {
  opened: "Thema geöffnet",
  gathering_questions: "Fragen werden gesammelt",
  evidence_growing: "Evidenz wächst",
  conflicts_visible: "Konflikte sind sichtbar",
  options_clarifying: "Optionen werden geklärt",
  next_round_needed: "Nächste Runde nötig",
  ready_for_vote_check: "Bereit für Vote-Check",
  in_implementation: "In Umsetzung",
  monitoring_impact: "Wirkung wird beobachtet",
};

const ROADMAP_STATUS_LABELS: Record<TopicRoadmapItem["status"], string> = {
  open: "offen",
  in_progress: "in Arbeit",
  blocked: "blockiert",
  done: "erledigt",
};

const SOURCE_CLASS_LABELS: Record<Topic["sources"][number]["sourceClass"], string> = {
  primary_source: "Primärquelle",
  secondary_report: "Sekundärbericht",
  official_document: "Offizielles Dokument",
  eyewitness_or_affected_account: "Betroffenen-/Zeugenbericht",
  media_report: "Medienbericht",
  unverified_claim: "Unverifizierte Behauptung",
  creator_media_source: "Creator-Medienquelle",
  community_note: "Community-Notiz",
};

const CONFLICT_KIND_LABELS: Record<Topic["conflicts"][number]["kind"], string> = {
  claim_contradiction: "Claim-Widerspruch",
  evidence_conflict: "Evidenzkonflikt",
  option_disagreement: "Optionskonflikt",
  unresolved_dispute: "Ungeklärter Streitpunkt",
  counterposition_missing: "Gegenposition fehlt",
};

const REVIEW_STATUS_LABELS: Record<Exclude<Topic["reviewLog"][number]["status"], undefined>, string> = {
  submitted: "eingereicht",
  under_review: "in Review",
  merged_into_existing_item: "in bestehendes Item gemerged",
  accepted_as_new_draft: "als neuer Draft akzeptiert",
  marked_duplicate: "als Duplikat markiert",
  deferred_to_next_round: "auf nächste Runde vertagt",
  rejected: "abgelehnt",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function roadmapSignalLabel(signal?: TopicRoadmapItem["voteReadinessSignal"]) {
  if (signal === "ready_for_check") return "Vote-Check möglich";
  if (signal === "review_needed") return "Vote-Check nach Review";
  return "Noch nicht vote-ready";
}

function contributionTypeLabel(round: Round, id: string) {
  const item = round.contributions.find((entry) => entry.id === id);
  if (!item) return "Beitrag";
  if (item.type === "question") return "Frage";
  if (item.type === "source") return "Quelle";
  if (item.type === "objection") return "Widerspruch";
  if (item.type === "perspective") return "Perspektive";
  if (item.type === "option") return "Option";
  if (item.type === "summary_note") return "Summary";
  if (item.type === "protocol_note") return "Protokoll";
  return "Follow-up";
}

type TopicSurfaceProps = {
  context: SurfaceContext;
  topic: Topic;
  rounds: Round[];
  basePath: string;
  distribution: DistributionContext;
};

export function TopicSurface({ context, topic, rounds, basePath, distribution }: TopicSurfaceProps) {
  const sourceById = new Map(topic.sources.map((source) => [source.id, source]));
  const unresolvedRoadmap = topic.roadmap.filter((item) => item.status !== "done");
  const evidenceMissingCount = topic.roadmap.filter((item) => Boolean(item.evidenceMissing)).length;
  const hasReadyVoteCheck = topic.roadmap.some((item) => item.voteReadinessSignal === "ready_for_check");
  const topicPublicPath = withDistributionQuery(basePath, distribution);
  const topicEmbedPath = withDistributionQuery(`/embed/topic/${topic.slug}`, distribution);
  const topicFollowUpPath = withDistributionQuery(basePath, distribution);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {context.mode === "demo" ? "Demo - Topic" : "Topic"}
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{topic.title}</h1>
        <p className="text-sm font-medium text-[rgb(var(--fg))]">{topic.framingQuestion}</p>
        <p className="text-sm text-[rgb(var(--muted))]">{topic.currentState}</p>
        <p className="text-sm text-[rgb(var(--muted))]">{distribution.framing}</p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip vog-chip--active">Status: {TOPIC_READINESS_LABELS[topic.readiness]}</span>
          <span className="vog-chip">{rounds.length} Runden verknüpft</span>
          <span className="vog-chip">Roadmap offen: {unresolvedRoadmap.length}</span>
          <span className="vog-chip">Fehlende Evidenz: {evidenceMissingCount}</span>
          <span className="vog-chip">{hasReadyVoteCheck ? "Vote-Check in Sicht" : "Vote-Check noch offen"}</span>
          <span className="vog-chip">Entry: {distribution.entry}</span>
          {distribution.source ? <span className="vog-chip">Source: {distribution.source}</span> : null}
          {distribution.persona ? <span className="vog-chip">Persona: {distribution.persona}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={withDistributionQuery(`/topic/manage/${topic.slug}/governance`, distribution)} className="btn-secondary text-xs">
            Governance-Reviewlog
          </Link>
        </div>
      </header>

      <SharePanel
        title={topic.title}
        description={topic.currentState}
        publicUrl={absoluteUrl(topicPublicPath)}
        canonicalTopicUrl={absoluteUrl(`/topic/${topic.slug}`)}
        embedUrl={absoluteUrl(topicEmbedPath)}
        followUpUrl={absoluteUrl(topicFollowUpPath)}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Optionen</h2>
          <ul className="space-y-2 text-sm">
            {topic.options.map((option) => (
              <li key={option.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                <p className="font-semibold text-[rgb(var(--fg))]">{option.title}</p>
                <p className="text-[rgb(var(--muted))]">{option.summary}</p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Offene Fragen und Einwände</h2>
          <ul className="space-y-2 text-sm">
            {topic.openQuestions.map((item) => (
              <li key={item} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[rgb(var(--fg))]">
                {item}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Einwände</p>
            <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
              {topic.objections.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Claims und Quellen</h2>
        <div className="space-y-3">
          {topic.claims.map((claim) => (
            <article key={claim.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.text}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {claim.sourceIds.map((sourceId) => {
                  const source = sourceById.get(sourceId);
                  if (!source) return null;
                  return (
                    <a
                      key={`${claim.id}-${source.id}`}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="vog-chip"
                    >
                      Quelle: {source.publisher} · {SOURCE_CLASS_LABELS[source.sourceClass]}
                    </a>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Runden-Timeline</h2>
          <span className="text-xs text-[rgb(var(--muted))]">Round ist kontextuell, Topic bleibt kanonisch.</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {rounds.map((round) => (
            <article key={round.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="vog-chip">{ROUND_TYPE_LABELS[round.type]}</span>
                <span className="vog-chip vog-chip--status">{ROUND_STATUS_LABELS[round.status]}</span>
                <span className="text-[rgb(var(--muted))]">{formatDate(round.startedAt)}</span>
              </div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{round.title}</p>
              <p className="text-sm text-[rgb(var(--muted))]">{round.summary}</p>
              <Link href={withDistributionQuery(`/round/${round.slug}`, distribution)} className="btn-secondary text-xs">
                Runde ansehen
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Roadmap / Nächste Schritte</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Manuell gepflegt, ohne KI-Zwang: Was ist noch ungeklärt, welche Evidenz fehlt, und was muss in die nächste
          Runde.
        </p>
        <div className="space-y-3">
          {topic.roadmap.map((item) => (
            <article key={item.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="vog-chip">{ROADMAP_CATEGORY_LABELS[item.category]}</span>
                <span className="vog-chip vog-chip--status">{ROADMAP_STATUS_LABELS[item.status]}</span>
                <span className="vog-chip">{roadmapSignalLabel(item.voteReadinessSignal)}</span>
              </div>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
              <p className="text-sm text-[rgb(var(--muted))]">{item.unresolved}</p>
              {item.evidenceMissing ? (
                <p className="text-sm text-[rgb(var(--muted))]">Fehlende Evidenz: {item.evidenceMissing}</p>
              ) : null}
              {item.askNext ? (
                <p className="text-sm text-[rgb(var(--muted))]">Nächste Frage: {item.askNext}</p>
              ) : null}
              {item.responderHint ? (
                <p className="text-sm text-[rgb(var(--muted))]">Mögliche Antwortstelle: {item.responderHint}</p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Konflikte und Gegenpositionen</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Das Topic modelliert offene Widersprüche explizit. Konsens wird nicht stillschweigend vorausgesetzt.
          </p>
          <div className="space-y-2 text-sm">
            {topic.conflicts.map((conflict) => (
              <article key={conflict.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-1">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="vog-chip">{CONFLICT_KIND_LABELS[conflict.kind]}</span>
                  <span className="vog-chip vog-chip--status">{conflict.unresolved ? "unresolved" : "geklärt"}</span>
                </div>
                <p className="font-semibold text-[rgb(var(--fg))]">{conflict.title}</p>
                <p className="text-[rgb(var(--muted))]">{conflict.details}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Reviewlog (öffentlich sichtbar)</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Herkunft und Entscheidungen bleiben nachvollziehbar: was einging, wie entschieden wurde und warum.
          </p>
          <div className="space-y-2 text-sm">
            {topic.reviewLog
              .filter((entry) => entry.visibility === "public")
              .slice(0, 5)
              .map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-1">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="vog-chip">{REVIEW_STATUS_LABELS[entry.status]}</span>
                    <span className="vog-chip">{entry.scope}</span>
                    <span className="text-[rgb(var(--muted))]">{formatDate(entry.reviewedAt)}</span>
                  </div>
                  <p className="font-semibold text-[rgb(var(--fg))]">{entry.title}</p>
                  <p className="text-[rgb(var(--muted))]">{entry.summary}</p>
                  {entry.publicReason ? <p className="text-[rgb(var(--muted))]">Grund: {entry.publicReason}</p> : null}
                </article>
              ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Maturity / Readiness</h2>
          <p className="text-sm text-[rgb(var(--muted))]">
            Reifestand wird explizit festgehalten, inklusive begründeter Entscheidungen zur Vote- oder Handoff-Reife.
          </p>
          <div className="space-y-2 text-sm">
            {topic.readinessChecks.map((check) => (
              <article key={check.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 space-y-1">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="vog-chip">{check.decision}</span>
                  <span className="text-[rgb(var(--muted))]">{formatDate(check.createdAt)}</span>
                  <span className="text-[rgb(var(--muted))]">by {check.decidedBy}</span>
                </div>
                <p className="text-[rgb(var(--muted))]">{check.rationale}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Export / Handoff-Snapshot</h2>
          <p className="text-sm text-[rgb(var(--muted))]">{topic.exportSnapshot.conciseSummary}</p>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Nächste Runde Agenda</p>
            <ul className="space-y-1 text-sm text-[rgb(var(--muted))]">
              {topic.exportSnapshot.nextRoundAgenda.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-[rgb(var(--muted))]">{topic.exportSnapshot.handoffNote}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Mandat-Brücke</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Topic/Round bleibt eigenständig, markiert aber klar, was für Umsetzung und Monitoring bereit ist.
        </p>
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="font-semibold text-[rgb(var(--fg))]">Jetzt geklärt</p>
            <ul className="mt-2 space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.clarifiedNow.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="font-semibold text-[rgb(var(--fg))]">Owner benötigt</p>
            <ul className="mt-2 space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.ownerNeeded.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="font-semibold text-[rgb(var(--fg))]">Vor Umsetzung noch offen</p>
            <ul className="mt-2 space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.openBeforeImplementation.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="font-semibold text-[rgb(var(--fg))]">Monitoring-Fokus</p>
            <ul className="mt-2 space-y-1 text-[rgb(var(--muted))]">
              {topic.mandateBridge.monitoringFocus.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <PublicFollowUpBlock returnPath={topicFollowUpPath} />
    </main>
  );
}

type RoundSurfaceProps = {
  context: SurfaceContext;
  topic: Topic;
  round: Round;
  basePath: string;
  distribution: DistributionContext;
};

export function RoundSurface({ context, topic, round, basePath, distribution }: RoundSurfaceProps) {
  const roundPublicPath = withDistributionQuery(basePath, distribution);
  const roundEmbedPath = withDistributionQuery(`/embed/round/${round.slug}`, distribution);
  const topicCanonicalPath = `/topic/${topic.slug}`;
  const topicPathWithDistribution = withDistributionQuery(topicCanonicalPath, distribution);
  const followUpPath = topicPathWithDistribution;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {context.mode === "demo" ? "Demo - Round" : "Round"} · {ROUND_TYPE_LABELS[round.type]}
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{round.title}</h1>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">{ROUND_TYPE_LABELS[round.type]}</span>
          <span className="vog-chip vog-chip--status">{ROUND_STATUS_LABELS[round.status]}</span>
          <span className="vog-chip">{formatDate(round.startedAt)}</span>
        </div>
        <p className="text-sm text-[rgb(var(--muted))]">
          Diese Runde ist kontextuell und führt in das kanonische Topic zurück.
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">{distribution.framing}</p>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">Entry: {distribution.entry}</span>
          {distribution.source ? <span className="vog-chip">Source: {distribution.source}</span> : null}
          {distribution.persona ? <span className="vog-chip">Persona: {distribution.persona}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={topicPathWithDistribution} className="btn btn-primary text-xs w-fit">
            Zurück zum Topic
          </Link>
          <Link href={`/round/manage/${round.slug}/merge`} className="btn-secondary text-xs">
            Merge-Review Workspace
          </Link>
          <Link href={withDistributionQuery(`/topic/manage/${topic.slug}/governance`, distribution)} className="btn-secondary text-xs">
            Topic Governance
          </Link>
        </div>
      </header>

      <SharePanel
        title={round.title}
        description={round.summary}
        publicUrl={absoluteUrl(roundPublicPath)}
        canonicalTopicUrl={absoluteUrl(topicCanonicalPath)}
        embedUrl={absoluteUrl(roundEmbedPath)}
        followUpUrl={absoluteUrl(followUpPath)}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Verknüpftes Topic</h2>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{topic.title}</p>
          <p className="text-sm text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
          <Link href={topicPathWithDistribution} className="btn-secondary text-xs">
            Topic-Hub öffnen
          </Link>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Medium-Metadaten</h2>
          <p className="text-sm text-[rgb(var(--fg))]">Typ: {ROUND_TYPE_LABELS[round.type]}</p>
          <p className="text-sm text-[rgb(var(--fg))]">Quelle: {round.sourceLabel}</p>
          {round.sourcePublisher ? (
            <p className="text-sm text-[rgb(var(--fg))]">Publisher: {round.sourcePublisher}</p>
          ) : null}
          {round.sourceUrl ? (
            <a href={round.sourceUrl} target="_blank" rel="noreferrer" className="text-sm underline text-[rgb(var(--muted))]">
              Quelle öffnen
            </a>
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Keine externe URL hinterlegt.</p>
          )}
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Round-Zusammenfassung</h2>
        <p className="text-sm text-[rgb(var(--muted))]">{round.summary}</p>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Rundenbeiträge</h2>
        <div className="space-y-3">
          {round.contributions.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="vog-chip">{contributionTypeLabel(round, entry.id)}</span>
                {entry.reviewStatus ? <span className="vog-chip">{REVIEW_STATUS_LABELS[entry.reviewStatus]}</span> : null}
                <span className="text-[rgb(var(--muted))]">{entry.authorLabel}</span>
                <span className="text-[rgb(var(--muted))]">{formatDate(entry.createdAt)}</span>
              </div>
              <p className="text-sm text-[rgb(var(--fg))]">{entry.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Offene Punkte aus dieser Runde</h2>
        <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
          {round.openPoints.map((item) => (
            <li key={item} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <PublicFollowUpBlock returnPath={followUpPath} />
    </main>
  );
}

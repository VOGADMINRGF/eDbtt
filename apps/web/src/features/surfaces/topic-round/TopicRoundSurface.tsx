import Link from "next/link";
import type { ReactNode } from "react";
import type { SurfaceContext } from "@/features/surface";
import type { CompanionContext, Round, Topic, TopicRoadmapItem } from "@features/topicRound";
import type { DistributionContext } from "./distribution";
import {
  absoluteUrl,
  distributionSourceLabel,
  withDistributionQuery,
} from "./distribution";
import SharePanel from "./SharePanel";
import PublicFollowUpBlock from "./PublicFollowUpBlock";

const ROUND_TYPE_LABELS: Record<Round["type"], string> = {
  event: "Event",
  livestream: "Livestream",
  video: "Video",
  article: "Artikel",
  podcast: "Podcast",
  session: "Session",
  open_round: "Offene Runde",
};

const ROUND_STATUS_LABELS: Record<Round["status"], string> = {
  open: "offen",
  closed: "abgeschlossen",
};

const COMPANION_TYPE_LABELS: Record<CompanionContext["type"], string> = {
  article: "Artikel",
  print: "Print",
  tv_show: "TV-Sendung",
  talkshow: "Talkshow",
  radio: "Radiosendung",
  podcast: "Podcast",
  author_column: "Autor:innenbeitrag",
  letter_to_editor: "Leserbrief",
  event: "Veranstaltung",
  livestream: "Livestream",
};

const ROADMAP_CATEGORY_LABELS: Record<TopicRoadmapItem["category"], string> = {
  evidence_missing: "Evidenz fehlt",
  counterposition_missing: "Gegenposition fehlt",
  authority_response_needed: "Antwort der zuständigen Stelle nötig",
  option_needs_detail: "Option braucht mehr Details",
  implementation_question: "Umsetzungsfrage offen",
  legal_check_needed: "Rechtliche Prüfung nötig",
  moderation_followup: "Moderations-Follow-up",
  next_round_question: "Nächste Runde vorbereiten",
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
  if (item.type === "objection") return "Einwand";
  if (item.type === "perspective") return "Perspektive";
  if (item.type === "option") return "Option";
  if (item.type === "summary_note") return "Zusammenfassung";
  if (item.type === "protocol_note") return "Protokoll";
  return "Follow-up";
}

type TopicSurfaceProps = {
  context: SurfaceContext;
  topic: Topic;
  rounds: Round[];
  basePath: string;
  distribution: DistributionContext;
  companionContexts?: CompanionContext[];
};

export function TopicSurface({
  context,
  topic,
  rounds,
  basePath,
  distribution,
  companionContexts = [],
}: TopicSurfaceProps) {
  const sourceById = new Map(topic.sources.map((source) => [source.id, source]));
  const unresolvedRoadmap = topic.roadmap.filter((item) => item.status !== "done");
  const primaryCompanion = companionContexts[0] ?? null;

  const topicPublicPath = withDistributionQuery(basePath, distribution);
  const topicEmbedPath = withDistributionQuery(`/embed/topic/${topic.slug}`, distribution);
  const topicFollowUpPath = withDistributionQuery(basePath, distribution);

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-5 px-4 py-8 md:py-10">
      <TopicContextHero
        context={context}
        topic={topic}
        distribution={distribution}
        primaryCompanion={primaryCompanion}
      />

      <TopicActionRail
        actions={[
          { href: "#offen", label: "Was ist offen?" },
          { href: "#optionen", label: "Optionen prüfen" },
          { href: "#quellen", label: "Quellen & Claims" },
          { href: "#runden", label: "Weitere Runden" },
          primaryCompanion
            ? {
                href: withDistributionQuery(`/companion/${primaryCompanion.slug}`, distribution),
                label: "Zum Begleitraum",
              }
            : { href: `/dossier?topic=${encodeURIComponent(topic.title)}`, label: "Im Dossier vertiefen" },
        ]}
      />

      <TopicQuestionsPanel topic={topic} unresolvedRoadmap={unresolvedRoadmap} />

      <TopicOptionsPanel topic={topic} />

      <TopicClaimsPanel topic={topic} sourceById={sourceById} />

      <TopicRoundsPanel rounds={rounds} distribution={distribution} />

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Konfliktlage</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Konflikte bleiben sichtbar. Der Themenraum erzwingt keinen künstlichen Konsens.
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {topic.conflicts.map((conflict) => (
              <article key={conflict.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="vog-chip">{CONFLICT_KIND_LABELS[conflict.kind]}</span>
                  <span className="vog-chip vog-chip--status">{conflict.unresolved ? "offen" : "geklärt"}</span>
                </div>
                <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{conflict.title}</p>
                <p className="text-[rgb(var(--muted))]">{conflict.details}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Readiness und Handoff</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{topic.exportSnapshot.conciseSummary}</p>
          <div className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
            <p className="font-semibold text-[rgb(var(--fg))]">Nächste-Runde-Agenda</p>
            <ul className="space-y-1">
              {topic.exportSnapshot.nextRoundAgenda.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <p>{topic.exportSnapshot.handoffNote}</p>
          </div>
        </article>
      </section>

      <TopicOpenSpaceCta
        topicSlug={topic.slug}
        topicTitle={topic.title}
        companion={primaryCompanion}
        distribution={distribution}
      />

      <CompanionDistributionPanel
        title="Verteilung & Teilen (sekundär)"
        hint="QR-, Share- und Embed-Werkzeuge sind bewusst nachgelagert und gehören primär in den Distribution-/Manage-Kontext."
        manageHref={withDistributionQuery(`/topic/manage/${topic.slug}/governance`, distribution)}
      >
        <SharePanel
          title={topic.title}
          description={topic.currentState}
          publicUrl={absoluteUrl(topicPublicPath)}
          canonicalTopicUrl={absoluteUrl(`/topic/${topic.slug}`)}
          embedUrl={absoluteUrl(topicEmbedPath)}
          followUpUrl={absoluteUrl(topicFollowUpPath)}
          compact
        />
      </CompanionDistributionPanel>

      <PublicFollowUpBlock title="Fragen, Einwände und Optionen einreichen" returnPath={topicFollowUpPath} />
    </main>
  );
}

type RoundSurfaceProps = {
  context: SurfaceContext;
  topic: Topic;
  round: Round;
  basePath: string;
  distribution: DistributionContext;
  companion?: CompanionContext | null;
};

export function RoundSurface({
  context,
  topic,
  round,
  basePath,
  distribution,
  companion,
}: RoundSurfaceProps) {
  const roundPublicPath = withDistributionQuery(basePath, distribution);
  const roundEmbedPath = withDistributionQuery(`/embed/round/${round.slug}`, distribution);
  const topicCanonicalPath = `/topic/${topic.slug}`;
  const topicPathWithDistribution = withDistributionQuery(topicCanonicalPath, distribution);

  return (
    <main className="mx-auto min-h-screen max-w-5xl space-y-5 px-4 py-8 md:py-10">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {context.mode === "demo" ? "Demo" : "Produktiv"} · Runde im Kontext
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{round.title}</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Runde ist die konkrete Session-Ebene. Das offene Thema bleibt der kanonische Raum.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="vog-chip">Typ: {ROUND_TYPE_LABELS[round.type]}</span>
          <span className="vog-chip vog-chip--status">Status: {ROUND_STATUS_LABELS[round.status]}</span>
          <span className="vog-chip">Datum: {formatDate(round.startedAt)}</span>
          <span className="vog-chip">Einstieg: {distribution.entry === "qr" ? "QR" : "Direkt"}</span>
          <span className="vog-chip">Quelle: {distributionSourceLabel(distribution.source)}</span>
          {companion ? <span className="vog-chip vog-chip--active">Begleitraum verknüpft</span> : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {companion ? (
            <Link href={withDistributionQuery(`/companion/${companion.slug}`, distribution)} className="btn btn-primary text-xs">
              Zum Begleitraum
            </Link>
          ) : null}
          <Link href={topicPathWithDistribution} className="btn-secondary text-xs">
            Zum offenen Themenraum
          </Link>
          <Link href={`/round/manage/${round.slug}/merge`} className="btn-secondary text-xs">
            Merge-Review (Manage)
          </Link>
        </div>
      </header>

      <section id="anlass" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Anlass und Hauptfrage</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{round.summary}</p>
        <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Kontextquelle</p>
            <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{round.sourceLabel}</p>
            {round.sourcePublisher ? <p className="text-[rgb(var(--muted))]">{round.sourcePublisher}</p> : null}
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Verknüpftes Thema</p>
            <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{topic.title}</p>
            <p className="text-[rgb(var(--muted))]">{topic.framingQuestion}</p>
          </div>
        </div>
      </section>

      <section id="fragen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Fragen & Einwände aus dieser Runde</h2>
        <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
          {round.openPoints.map((item) => (
            <li key={item} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section id="optionen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Optionen für den nächsten Schritt</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {topic.options.slice(0, 4).map((option) => (
            <article key={option.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="font-semibold text-[rgb(var(--fg))]">{option.title}</p>
              <p className="text-sm text-[rgb(var(--muted))]">{option.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="beitraege" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Rundenbeiträge</h2>
        <div className="mt-3 space-y-2">
          {round.contributions.map((entry) => (
            <article key={entry.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="vog-chip">{contributionTypeLabel(round, entry.id)}</span>
                {entry.reviewStatus ? <span className="vog-chip">{REVIEW_STATUS_LABELS[entry.reviewStatus]}</span> : null}
                <span className="text-[rgb(var(--muted))]">{entry.authorLabel}</span>
                <span className="text-[rgb(var(--muted))]">{formatDate(entry.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-[rgb(var(--fg))]">{entry.text}</p>
            </article>
          ))}
        </div>
      </section>

      <TopicOpenSpaceCta topicSlug={topic.slug} topicTitle={topic.title} companion={companion ?? null} distribution={distribution} />

      <CompanionDistributionPanel
        title="Distribution-Werkzeuge (sekundär)"
        hint="QR/Share/Embed bleiben verfügbar, sind hier aber bewusst kein Hauptcontentblock."
        manageHref={`/round/manage/${round.slug}/merge`}
      >
        <SharePanel
          title={round.title}
          description={round.summary}
          publicUrl={absoluteUrl(roundPublicPath)}
          canonicalTopicUrl={absoluteUrl(topicCanonicalPath)}
          embedUrl={absoluteUrl(roundEmbedPath)}
          followUpUrl={absoluteUrl(topicPathWithDistribution)}
          compact
        />
      </CompanionDistributionPanel>

      <PublicFollowUpBlock title="Im Anschluss strukturiert beitragen" returnPath={topicPathWithDistribution} />
    </main>
  );
}

type CompanionSurfaceProps = {
  context: SurfaceContext;
  companion: CompanionContext;
  topic: Topic;
  rounds: Round[];
  linkedRound: Round | null;
  distribution: DistributionContext;
};

export function CompanionSurface({
  context,
  companion,
  topic,
  rounds,
  linkedRound,
  distribution,
}: CompanionSurfaceProps) {
  const sourceById = new Map(topic.sources.map((source) => [source.id, source]));
  const canonicalTopicPath = withDistributionQuery(`/topic/${topic.slug}`, distribution);

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-5 px-4 py-8 md:py-10">
      <CompanionContextHeader context={context} companion={companion} distribution={distribution} />

      <TopicActionRail
        actions={[
          { href: "#anlass", label: "Anlass verstehen" },
          { href: "#fragen", label: "Fragen & Einwände" },
          { href: "#optionen", label: "Optionen prüfen" },
          {
            href: canonicalTopicPath,
            label: "Zum offenen Themenraum",
          },
          linkedRound
            ? {
                href: withDistributionQuery(`/round/${linkedRound.slug}`, distribution),
                label: "Zur verknüpften Runde",
              }
            : { href: canonicalTopicPath, label: "Zum Topic" },
        ]}
      />

      <section id="anlass" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Warum bin ich hier?</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">{companion.intro}</p>
        <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">Hauptfrage: {companion.mainQuestion}</p>
        {linkedRound ? (
          <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm">
            <p className="font-semibold text-[rgb(var(--fg))]">Verknüpfte Runde: {linkedRound.title}</p>
            <p className="text-[rgb(var(--muted))]">{linkedRound.summary}</p>
          </div>
        ) : null}
      </section>

      <section id="fragen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Fragen & Einwände</h2>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Offene Fragen</p>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
              {topic.openQuestions.slice(0, 6).map((question) => (
                <li key={question}>- {question}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Einwände</p>
            <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
              {topic.objections.slice(0, 6).map((objection) => (
                <li key={objection}>- {objection}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <TopicOptionsPanel topic={topic} />

      <section id="quellen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Quellen & Claims</h2>
        <div className="mt-3 space-y-2">
          {topic.claims.slice(0, 4).map((claim) => (
            <article key={claim.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.text}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {claim.sourceIds.map((sourceId) => {
                  const source = sourceById.get(sourceId);
                  if (!source) return null;
                  return (
                    <a key={`${claim.id}-${source.id}`} href={source.url} target="_blank" rel="noreferrer" className="vog-chip">
                      {source.publisher} · {SOURCE_CLASS_LABELS[source.sourceClass]}
                    </a>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </section>

      <TopicRoundsPanel rounds={rounds} distribution={distribution} />

      <TopicOpenSpaceCta topicSlug={topic.slug} topicTitle={topic.title} companion={companion} distribution={distribution} />

      <CompanionDistributionPanel
        title="Companion-Link teilen (sekundär)"
        hint="Der Begleitraum ist der erste Kontextzugang. Offener Topic-Einstieg bleibt als nächster Schritt sichtbar."
        manageHref={withDistributionQuery(`/topic/manage/${topic.slug}/governance`, distribution)}
      >
        <SharePanel
          title={companion.title}
          description={companion.intro}
          publicUrl={absoluteUrl(withDistributionQuery(`/companion/${companion.slug}`, distribution))}
          canonicalTopicUrl={absoluteUrl(`/topic/${topic.slug}`)}
          embedUrl={absoluteUrl(withDistributionQuery(`/embed/topic/${topic.slug}`, distribution))}
          followUpUrl={absoluteUrl(canonicalTopicPath)}
          compact
        />
      </CompanionDistributionPanel>

      <PublicFollowUpBlock title="Zum Anlass strukturiert beitragen" returnPath={canonicalTopicPath} />
    </main>
  );
}

function TopicContextHero({
  context,
  topic,
  distribution,
  primaryCompanion,
}: {
  context: SurfaceContext;
  topic: Topic;
  distribution: DistributionContext;
  primaryCompanion: CompanionContext | null;
}) {
  return (
    <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        {context.mode === "demo" ? "Demo" : "Produktiv"} · Offener Themenraum
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{topic.title}</h1>
      <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">Hauptfrage: {topic.framingQuestion}</p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{topic.currentState}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="vog-chip vog-chip--active">Status: {TOPIC_READINESS_LABELS[topic.readiness]}</span>
        <span className="vog-chip">Einstieg: {distribution.entry === "qr" ? "QR" : "Direkt"}</span>
        <span className="vog-chip">Kontext: {distribution.framing}</span>
        {primaryCompanion ? <span className="vog-chip">Begleitraum vorhanden</span> : null}
      </div>
      {primaryCompanion ? (
        <p className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--muted))]">
          Hinweis: Für mediumgebundene Einstiege (QR aus Artikel, TV, Podcast, Print etc.) startet der Flow im
          Begleitraum, danach folgt die Öffnung in diesen Themenraum.
        </p>
      ) : null}
    </header>
  );
}

function CompanionContextHeader({
  context,
  companion,
  distribution,
}: {
  context: SurfaceContext;
  companion: CompanionContext;
  distribution: DistributionContext;
}) {
  return (
    <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        {context.mode === "demo" ? "Demo" : "Produktiv"} · Begleitraum
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{companion.title}</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{companion.intro}</p>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="vog-chip vog-chip--active">Anlass: {COMPANION_TYPE_LABELS[companion.type]}</span>
        <span className="vog-chip">Medium: {companion.medium}</span>
        <span className="vog-chip">Format: {companion.format}</span>
        <span className="vog-chip">Datum: {formatDate(companion.publishedAt)}</span>
        <span className="vog-chip">Einstieg: {distribution.entry === "qr" ? "QR" : "Direkt"}</span>
        <span className="vog-chip">Quelle: {distributionSourceLabel(distribution.source)}</span>
      </div>
      <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Herkunft</p>
          <p>Referenz: {companion.reference ?? "–"}</p>
          {companion.issue ? <p>Ausgabe: {companion.issue}</p> : null}
          {companion.episode ? <p>Episode: {companion.episode}</p> : null}
          {companion.page ? <p>Seite: {companion.page}</p> : null}
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Verantwortung</p>
          {companion.author ? <p>Autor: {companion.author}</p> : null}
          {companion.host ? <p>Host: {companion.host}</p> : null}
          {companion.editorialOwner ? <p>Redaktion: {companion.editorialOwner}</p> : null}
          <p>Moderation: {companion.moderationMode}</p>
        </div>
      </div>
    </header>
  );
}

function TopicActionRail({ actions }: { actions: Array<{ href: string; label: string }> }) {
  return (
    <nav className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Schnelle Wege</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((action) => (
          <Link key={`${action.href}-${action.label}`} href={action.href} className="btn-secondary text-xs">
            {action.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function TopicQuestionsPanel({
  topic,
  unresolvedRoadmap,
}: {
  topic: Topic;
  unresolvedRoadmap: TopicRoadmapItem[];
}) {
  return (
    <section id="offen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Was ist offen?</h2>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Offene Fragen</p>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
            {topic.openQuestions.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Einwände</p>
          <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
            {topic.objections.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </article>
      </div>
      <div className="mt-3 space-y-2">
        {unresolvedRoadmap.slice(0, 4).map((item) => (
          <article key={item.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="vog-chip">{ROADMAP_CATEGORY_LABELS[item.category]}</span>
              <span className="vog-chip">{roadmapSignalLabel(item.voteReadinessSignal)}</span>
            </div>
            <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{item.title}</p>
            <p className="text-sm text-[rgb(var(--muted))]">{item.unresolved}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TopicOptionsPanel({ topic }: { topic: Topic }) {
  return (
    <section id="optionen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Optionen / Varianten</h2>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        Optionen sind als Entscheidungsraum formuliert und nicht als rein technische Liste.
      </p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {topic.options.map((option) => (
          <article key={option.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="font-semibold text-[rgb(var(--fg))]">{option.title}</p>
            <p className="text-sm text-[rgb(var(--muted))]">{option.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function TopicClaimsPanel({
  topic,
  sourceById,
}: {
  topic: Topic;
  sourceById: Map<string, Topic["sources"][number]>;
}) {
  return (
    <section id="quellen" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Quellen & Claims</h2>
      <div className="mt-3 space-y-2">
        {topic.claims.map((claim) => (
          <article key={claim.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.text}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {claim.sourceIds.map((sourceId) => {
                const source = sourceById.get(sourceId);
                if (!source) return null;
                return (
                  <a key={`${claim.id}-${source.id}`} href={source.url} target="_blank" rel="noreferrer" className="vog-chip">
                    {source.publisher} · {SOURCE_CLASS_LABELS[source.sourceClass]}
                  </a>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TopicRoundsPanel({
  rounds,
  distribution,
}: {
  rounds: Round[];
  distribution: DistributionContext;
}) {
  return (
    <section id="runden" className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Weitere Runden</h2>
        <span className="text-xs text-[rgb(var(--muted))]">Runde = konkrete Folgeform, Topic = langfristiger Raum</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {rounds.map((round) => (
          <article key={round.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="vog-chip">{ROUND_TYPE_LABELS[round.type]}</span>
              <span className="vog-chip vog-chip--status">{ROUND_STATUS_LABELS[round.status]}</span>
              <span className="text-[rgb(var(--muted))]">{formatDate(round.startedAt)}</span>
            </div>
            <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{round.title}</p>
            <p className="text-sm text-[rgb(var(--muted))]">{round.summary}</p>
            <Link href={withDistributionQuery(`/round/${round.slug}`, distribution)} className="btn-secondary mt-2 text-xs">
              Runde öffnen
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

function TopicOpenSpaceCta({
  topicSlug,
  topicTitle,
  companion,
  distribution,
}: {
  topicSlug: string;
  topicTitle: string;
  companion: CompanionContext | null;
  distribution: DistributionContext;
}) {
  return (
    <section className="rounded-3xl border border-sky-300/45 bg-gradient-to-r from-sky-500/12 to-cyan-500/6 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Zum offenen Themenraum</h2>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        Der Begleitraum bleibt am Anlass. Der offene Themenraum sammelt zusätzliche Quellen, weitere Runden und
        langfristige Klärung.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={withDistributionQuery(`/topic/${topicSlug}`, distribution)} className="btn btn-primary text-xs">
          Offenen Themenraum öffnen
        </Link>
        <Link href={`/dossier?topic=${encodeURIComponent(topicTitle)}`} className="btn-secondary text-xs">
          Im Dossier vertiefen
        </Link>
        {companion ? (
          <Link href={withDistributionQuery(`/companion/${companion.slug}`, distribution)} className="btn-secondary text-xs">
            Zum Begleitraum zurück
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function CompanionDistributionPanel({
  title,
  hint,
  manageHref,
  children,
}: {
  title: string;
  hint: string;
  manageHref: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>
      <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
        <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--fg))]">Werkzeuge anzeigen</summary>
        <div className="mt-3 space-y-3">{children}</div>
        <div className="mt-3">
          <Link href={manageHref} className="btn-secondary text-xs">
            In den Manage-/Distribution-Bereich
          </Link>
        </div>
      </details>
    </section>
  );
}

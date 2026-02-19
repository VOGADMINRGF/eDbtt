import Link from "next/link";
import type { Dossier } from "@features/dossier";
import DossierPageShell from "./DossierPageShell";
import GraphCanvas from "./GraphCanvas";
import VotePanel from "./VotePanel";
import {
  SECTION_TITLES,
  STATUS_LABELS,
  STANCE_LABELS,
  VOTE_POLICY_LABELS,
  OPTION_TYPE_LABELS,
  JURISDICTION_LABELS,
} from "./labels";

type PresentationStream = { id: string; title: string; date: string };

type PresentationContribution = {
  id: string;
  title: string;
  date: string;
  streamId?: string;
};

type PresentationVoteOption = { id: string; label: string };

type PresentationMajority = { id: string; pct: number };

type PresentationOption = {
  id: string;
  label: string;
  type?: string;
  touchesStatements?: string[];
};

type PresentationCluster = { label: string; count: number };

type PresentationPayload = {
  topic?: { id?: string; label?: string; municipality?: string; windowDays?: number };
  inputs?: Record<string, unknown>;
  statementStats?: {
    total?: number;
    pro?: number;
    neutral?: number;
    contra?: number;
    clusters?: PresentationCluster[];
  };
  clusters?: PresentationCluster[];
  options?: PresentationOption[];
  vote?: {
    options?: PresentationVoteOption[];
    majorityDemo?: PresentationMajority[];
  };
};

type PresentationNote = {
  id?: string;
  text?: string;
  kind?: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("de-DE", { year: "numeric", month: "short", day: "2-digit" });
}

function labelList(items?: string[] | null) {
  if (!items || items.length === 0) return "-";
  return items.join(", ");
}

function parsePresentationNotes(notes: PresentationNote[]) {
  const result: PresentationPayload = {};
  const options: PresentationOption[] = [];
  const streams: PresentationStream[] = [];
  const contributions: PresentationContribution[] = [];
  const voteOptions: PresentationVoteOption[] = [];
  const majorityDemo: PresentationMajority[] = [];

  for (const note of notes) {
    if (note.kind !== "presentation" || !note.text) continue;
    try {
      const parsed = JSON.parse(note.text) as PresentationPayload;
      if (parsed.topic) result.topic = parsed.topic;
      if (parsed.inputs) result.inputs = { ...result.inputs, ...parsed.inputs };
      if (parsed.statementStats) result.statementStats = parsed.statementStats;
      if (parsed.clusters) result.clusters = parsed.clusters;
      if (Array.isArray(parsed.options)) options.push(...parsed.options);
      if (parsed.vote?.options) voteOptions.push(...parsed.vote.options);
      if (parsed.vote?.majorityDemo) majorityDemo.push(...parsed.vote.majorityDemo);

      const inputStreams = parsed.inputs?.streams;
      if (Array.isArray(inputStreams)) {
        for (const stream of inputStreams) streams.push(stream as PresentationStream);
      }

      const inputContrib = parsed.inputs?.contributions;
      if (Array.isArray(inputContrib)) {
        for (const contrib of inputContrib) contributions.push(contrib as PresentationContribution);
      }
    } catch {
      continue;
    }
  }

  return {
    presentation: { ...result, options: options.length ? options : result.options },
    streams,
    contributions,
    voteOptions,
    majorityDemo,
  };
}

function deriveStatementStats(claims: Dossier["analyze"]["claims"]) {
  const total = claims.length;
  let pro = 0;
  let neutral = 0;
  let contra = 0;

  for (const claim of claims) {
    if (claim.stance === "pro") pro += 1;
    else if (claim.stance === "contra") contra += 1;
    else neutral += 1;
  }

  return { total, pro, neutral, contra };
}

function buildOptionTouches(claims: Dossier["analyze"]["claims"]) {
  const touches = new Map<string, string[]>();
  for (const claim of claims) {
    const touchLabel = claim.title ?? claim.id;
    const options = claim.debateFrame?.options ?? [];
    for (const option of options) {
      const list = touches.get(option.id) ?? [];
      if (!list.includes(touchLabel)) list.push(touchLabel);
      touches.set(option.id, list);
    }
  }
  return touches;
}

function groupOption(option: PresentationOption) {
  const label = option.label.toLowerCase();
  if (option.type === "reform_strong" || option.type === "reform_moderate" || option.type === "status_quo") {
    return "reform";
  }
  if (option.type === "pilot") return "pilot";
  if (label.includes("kooperation")) return "kooperation";
  if (label.includes("gutachten") || label.includes("vorab")) return "vorarbeiten";
  return "weitere";
}

const OPTION_GROUP_LABELS: Record<string, string> = {
  reform: "Reform (stark/moderat)",
  pilot: "Pilot & Übergang",
  kooperation: "Kooperation",
  vorarbeiten: "Vorarbeiten (Gutachten)",
  weitere: "Weitere Optionen",
};

const OPTION_GROUP_ORDER = ["reform", "pilot", "kooperation", "vorarbeiten", "weitere"];

function getInputValue(inputs: Record<string, unknown> | undefined, keys: string[]) {
  if (!inputs) return undefined;
  for (const key of keys) {
    const value = inputs[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

export function DossierViewer({ dossier }: { dossier: Dossier }) {
  const { meta, analyze, voteConfig } = dossier;
  const { presentation, streams, contributions, voteOptions, majorityDemo } = parsePresentationNotes(
    analyze.notes ?? [],
  );

  const statementTitleById = new Map(analyze.claims.map((claim) => [claim.id, claim.title ?? claim.id]));

  const derivedStats = deriveStatementStats(analyze.claims);
  const statementStats = presentation.statementStats ?? derivedStats;
  const clusters = presentation.clusters ?? presentation.statementStats?.clusters ?? [];

  const inputs = presentation.inputs ?? {};
  const timeWindow =
    getInputValue(inputs, ["zeitfenster", "updatedWindow"]) ??
    (presentation.topic?.windowDays ? `${presentation.topic.windowDays} Tage` : "-");

  const rawStreamCount = getInputValue(inputs, ["streams"]);
  const rawContributionCount = getInputValue(inputs, ["beiträge", "beitraege", "contributions"]);
  const streamCount = streams.length || (typeof rawStreamCount === "number" ? rawStreamCount : 0);
  const contributionCount =
    contributions.length || (typeof rawContributionCount === "number" ? rawContributionCount : 0);

  const sources = dossier.sourceSet.length ? dossier.sourceSet : analyze.runReceipt?.sourceSet ?? [];

  const optionTouches = buildOptionTouches(analyze.claims);
  const optionTouchedById = new Map<string, string[]>();

  for (const option of presentation.options ?? []) {
    if (option.touchesStatements?.length) {
      optionTouchedById.set(
        option.id,
        option.touchesStatements.map((id) => statementTitleById.get(id) ?? id),
      );
    }
  }

  for (const [optionId, titles] of optionTouches.entries()) {
    if (!optionTouchedById.has(optionId)) optionTouchedById.set(optionId, titles);
  }

  const votingOptions = voteOptions.length
    ? voteOptions
    : (presentation.options ?? []).map((option) => ({ id: option.id, label: option.label }));

  const groupedOptions = votingOptions.reduce<Record<string, PresentationOption[]>>((acc, option) => {
    const fullOption =
      (presentation.options ?? []).find((item) => item.id === option.id) ??
      ({ id: option.id, label: option.label } as PresentationOption);
    const key = groupOption(fullOption);
    if (!acc[key]) acc[key] = [];
    acc[key].push(fullOption);
    return acc;
  }, {});

  const coreClaims = analyze.claims.filter((claim) => claim.importance === 5);
  const secondaryClaims = analyze.claims.filter((claim) => claim.importance !== 5);

  const metaChips = [
    { label: "Thema", value: presentation.topic?.label ?? "-" },
    { label: "Status", value: STATUS_LABELS[meta.status] ?? meta.status },
    { label: "Geltungsbereich", value: JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction },
    { label: "Region", value: meta.region ?? "-" },
    { label: "Zeitfenster", value: String(timeWindow) },
    { label: "Stand", value: formatDate(meta.updatedAt ?? meta.createdAt) },
  ];

  const claimNodes = analyze.claims.map((claim) => ({ id: claim.id, label: claim.title ?? claim.id }));
  const graphNodes = analyze.evidenceGraph?.nodes ?? [];
  const sourceNodes = graphNodes
    .filter((node) => node.type === "evidence")
    .map((node) => ({ id: node.id, label: node.label }));

  const graphEdges = analyze.evidenceGraph?.edges ?? [];

  const left = (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={streams[0] ? `/streams/${streams[0].id}` : "/dossier/demo"}
          className="vog-card p-4 space-y-2 transition hover:shadow-soft"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Themenströme</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{streamCount || "-"}</div>
          <div className="text-[11px] text-[rgb(var(--muted))]">Alle Themenströme anzeigen</div>
        </Link>
        <Link
          href={contributions[0] ? `/beitraege/${contributions[0].id}` : "/dossier/demo"}
          className="vog-card p-4 space-y-2 transition hover:shadow-soft"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beiträge</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{contributionCount || "-"}</div>
          <div className="text-[11px] text-[rgb(var(--muted))]">Alle Beiträge anzeigen</div>
        </Link>
        <div className="vog-card p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Statements</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{statementStats.total ?? derivedStats.total}</div>
          <div className="text-[11px] text-[rgb(var(--muted))]">
            Pro/Neutral/Contra: {statementStats.pro ?? derivedStats.pro}/
            {statementStats.neutral ?? derivedStats.neutral}/{statementStats.contra ?? derivedStats.contra}
          </div>
        </div>
        <div className="vog-card p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{sources.length}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <div className="vog-card p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Material</div>
          <div className="space-y-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Themenströme</p>
              <div className="space-y-2 text-sm">
                {streams.length ? (
                  streams.map((stream) => (
                    <Link
                      key={stream.id}
                      href={`/streams/${stream.id}`}
                      className="block rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[rgb(var(--fg))]"
                    >
                      <div className="text-sm font-semibold">{stream.title}</div>
                      <div className="text-[11px] text-[rgb(var(--muted))]">{formatDate(stream.date)}</div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">Keine Themenströme hinterlegt.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="vog-card p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beiträge</div>
          <div className="space-y-2 text-sm">
            {contributions.length ? (
              contributions.map((item) => (
                <Link
                  key={item.id}
                  href={`/beitraege/${item.id}`}
                  className="block rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-[rgb(var(--fg))]"
                >
                  <div className="text-sm font-semibold">{item.title}</div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">{formatDate(item.date)}</div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-[rgb(var(--muted))]">Keine Beiträge hinterlegt.</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.graph}
        </div>
        <GraphCanvas claims={claimNodes} sources={sourceNodes} edges={graphEdges} />
        <div className="text-[11px] text-[rgb(var(--muted))]">
          Statements: {analyze.evidenceGraph?.summary.claimCount ?? claimNodes.length} · Quellen: {analyze.evidenceGraph?.summary.evidenceCount ?? sourceNodes.length} · Kanten: {graphEdges.length}
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.options}
        </div>
        <VotePanel
          dossierId={meta.id}
          options={votingOptions}
          majorityDemo={majorityDemo.length ? majorityDemo : votingOptions.map((opt) => ({ id: opt.id, pct: 0 }))}
        />
        {OPTION_GROUP_ORDER.filter((key) => groupedOptions[key]?.length).map((groupKey) => (
          <div key={groupKey} className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{OPTION_GROUP_LABELS[groupKey]}</h3>
            <div className="grid gap-3">
              {groupedOptions[groupKey].map((option) => (
                <div key={option.id} className="vog-card p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="vog-chip">{option.label}</span>
                    <span className="vog-chip">{OPTION_TYPE_LABELS[option.type ?? "custom"] ?? "Maßnahme"}</span>
                  </div>
                  <div className="text-[11px] text-[rgb(var(--muted))]">
                    Berührt Statements: {labelList(optionTouchedById.get(option.id) ?? null)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {SECTION_TITLES.statements}
          </div>
          {clusters.length ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {SECTION_TITLES.clusters}
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
                {clusters.map((cluster) => (
                  <span key={cluster.label} className="vog-chip">
                    {cluster.label} ({cluster.count})
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Kernpositionen</div>
          <div className="grid gap-3">
            {coreClaims.map((claim) => (
              <article key={claim.id} className="vog-card p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span className="vog-chip">Position: {STANCE_LABELS[claim.stance ?? ""] ?? "-"}</span>
                  <span className="vog-chip">Wichtigkeit: {claim.importance ?? "-"}</span>
                  <span className="vog-chip">Zuständigkeit: {claim.responsibility ?? "-"}</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-[rgb(var(--fg))]">
                    {claim.title ?? "Statement"}
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{claim.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-[rgb(var(--fg))]">Teilaspekte</div>
          <div className="grid gap-3">
            {secondaryClaims.map((claim) => (
              <article key={claim.id} className="vog-card p-5 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-[rgb(var(--muted))]">
                  <span className="vog-chip">Position: {STANCE_LABELS[claim.stance ?? ""] ?? "-"}</span>
                  <span className="vog-chip">Wichtigkeit: {claim.importance ?? "-"}</span>
                  <span className="vog-chip">Zuständigkeit: {claim.responsibility ?? "-"}</span>
                </div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {claim.title ?? "Statement"}
                </p>
                <p className="text-sm text-[rgb(var(--muted))]">{claim.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.report}
        </div>
        <div className="vog-card p-5 space-y-4">
          <p className="text-sm text-[rgb(var(--fg))]">{analyze.report.summary ?? "-"}</p>
          <div className="text-[11px] text-[rgb(var(--muted))]">
            Spannungen: {labelList(analyze.report.keyConflicts)}
          </div>
          <div className="text-[11px] text-[rgb(var(--muted))]">
            Erkenntnisse: {labelList(analyze.report.takeaways)}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.decisionTrees}
        </div>
        <div className="grid gap-4">
          {analyze.decisionTrees.map((tree) => (
            <div key={tree.id ?? tree.rootStatementId} className="vog-card p-5 space-y-3">
              <div className="text-sm text-[rgb(var(--fg))]">
                Ausgangspunkt: <span className="font-semibold">{tree.rootStatementId}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">Pro</p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{tree.options.pro.narrative}</p>
                </div>
                <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <p className="text-xs font-semibold text-[rgb(var(--fg))]">Contra</p>
                  <p className="text-[11px] text-[rgb(var(--muted))]">{tree.options.contra.narrative}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  const right = (
    <>
      <section className="vog-card p-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.metadata}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Status: {STATUS_LABELS[meta.status] ?? meta.status}</div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Zuständigkeitsbereich: {JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Region: {meta.region ?? "-"}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Zeitfenster: {timeWindow as string}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Letztes Update: {formatDate(meta.updatedAt ?? meta.createdAt)}</div>
        {voteConfig ? (
          <>
            <div className="text-sm text-[rgb(var(--fg))]">
              Abstimmungsmodus: {VOTE_POLICY_LABELS[voteConfig.policy] ?? voteConfig.policy}
            </div>
            <div className="text-sm text-[rgb(var(--fg))]">Mindestoptionen: {voteConfig.minOptions}</div>
          </>
        ) : null}
      </section>

      <section className="vog-card p-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.methodology}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Methodische Hinweise: Das Dossier folgt dem E150-Schema und dokumentiert Statements, Optionen und Evidenzbezüge nachvollziehbar.
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Analysemodus: {analyze.mode}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Sprache: {analyze.language.toUpperCase()}</div>
        {analyze.runReceipt ? (
          <>
            <div className="text-sm text-[rgb(var(--fg))]">Analyse-Pipeline: {analyze.runReceipt.pipelineVersion}</div>
            <div className="text-sm text-[rgb(var(--fg))]">Protokoll: {analyze.runReceipt.id}</div>
            <div className="text-sm text-[rgb(var(--fg))]">Erstellt: {formatDate(analyze.runReceipt.createdAt)}</div>
          </>
        ) : (
          <div className="text-sm text-[rgb(var(--muted))]">Kein Analyseprotokoll vorhanden.</div>
        )}
      </section>

      <section className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.sources}
        </div>
        <ul className="space-y-2 text-sm text-[rgb(var(--fg))]">
          {sources.map((src, idx) => (
            <li key={`${src.canonicalUrl}-${idx}`}>
              {src.title ?? src.canonicalUrl} <span className="text-[rgb(var(--muted))]">({src.publisher ?? "-"})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="vog-card p-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Evidenz-Überblick
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Statements: {analyze.evidenceGraph?.summary.claimCount ?? analyze.claims.length}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Quellen: {analyze.evidenceGraph?.summary.evidenceCount ?? sources.length}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Kanten: {graphEdges.length}</div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Verknüpfte Statements: {analyze.evidenceGraph?.summary.linkedClaimCount ?? "-"}
        </div>
      </section>

      <section className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.questions}
        </div>
        <ul className="space-y-2 text-sm text-[rgb(var(--fg))]">
          {analyze.questions.map((q) => (
            <li key={q.id}>{q.text}</li>
          ))}
        </ul>
      </section>

      <section className="vog-card p-5 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.responsibilityPaths}
        </div>
        <div className="space-y-3 text-sm text-[rgb(var(--fg))]">
          {analyze.responsibilityPaths.map((path) => (
            <div key={path.id} className="space-y-1">
              <div className="text-[11px] text-[rgb(var(--muted))]">
                {statementTitleById.get(path.statementId) ?? path.statementId}
              </div>
              <div className="text-sm text-[rgb(var(--fg))]">
                {path.nodes.map((node) => node.displayName).join(" → ")}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  return (
    <DossierPageShell
      eyebrow="Dossier (Demonstrationsfall)"
      title={meta.title}
      lead={
        `${analyze.sourceText ?? "Fragestellung des Dossiers."} Dieses Demonstrationsdossier zeigt die E150-Entscheidungsakte mit strukturierten Statements, Optionenraum, Evidenzbezügen und Zuständigkeitswegen.`
      }
      note="Die Abstimmungsdarstellung ist in dieser Demo simuliert und dient der Veranschaulichung der Beteiligungsebene."
      metaChips={metaChips}
      left={left}
      right={right}
    />
  );
}

export default DossierViewer;

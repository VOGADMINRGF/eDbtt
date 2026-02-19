import Link from "next/link";
import type { Dossier } from "@features/dossier";
import DossierLayout from "./DossierLayout";
import EvidenceField from "./EvidenceField";
import OptionMatrix from "./OptionMatrix";
import VotePanel from "./VotePanel";
import MajorityTrend from "./MajorityTrend";
import {
  SECTION_TITLES,
  STATUS_LABELS,
  STANCE_LABELS,
  VOTE_POLICY_LABELS,
  JURISDICTION_LABELS,
} from "./labels";
import {
  getPresentation,
  type PresentationCluster,
  type PresentationOption,
  type PresentationVoteOption,
} from "./presentation";

type DimensionKey = "haushalt" | "paedagogik" | "klima" | "bauzeit";

type DimensionMeta = { key: DimensionKey; label: string };

type OptionCard = {
  id: string;
  label: string;
  type?: string;
  narrative: string;
  touches: string[];
  dimensions: { key: string; label: string; value: number }[];
  chips: string[];
};

const DIMENSIONS: DimensionMeta[] = [
  { key: "haushalt", label: "Haushalt" },
  { key: "paedagogik", label: "Pädagogik" },
  { key: "klima", label: "Klima" },
  { key: "bauzeit", label: "Bauzeit" },
];

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

function getInputValue(inputs: Record<string, unknown> | undefined, keys: string[]) {
  if (!inputs) return undefined;
  for (const key of keys) {
    const value = inputs[key];
    if (value !== undefined) return value;
  }
  return undefined;
}

function normalizeText(value?: string | null) {
  return (value ?? "").toLowerCase();
}

function inferClusterFromClaim(claim: Dossier["analyze"]["claims"][number]) {
  const haystack = `${claim.title ?? ""} ${claim.domain ?? ""} ${(claim.domains ?? []).join(" ")}`;
  const text = normalizeText(haystack);
  if (text.includes("haushalt") || text.includes("kosten") || text.includes("finanz")) {
    return "Kosten/Haushalt";
  }
  if (text.includes("pädagog") || text.includes("raum") || text.includes("bildung")) {
    return "Pädagogik/Raumkonzept";
  }
  if (text.includes("klima") || text.includes("energie") || text.includes("co₂") || text.includes("co2")) {
    return "Klima/Energie";
  }
  if (text.includes("bau") || text.includes("übergang") || text.includes("infrastruktur")) {
    return "Bauzeit/Übergang";
  }
  return undefined;
}

function inferDimensionsFromClaim(claim: Dossier["analyze"]["claims"][number]) {
  const dimensions = new Set<DimensionKey>();
  const haystack = `${claim.title ?? ""} ${claim.domain ?? ""} ${(claim.domains ?? []).join(" ")}`;
  const text = normalizeText(haystack);

  if (text.includes("haushalt") || text.includes("kosten") || text.includes("finanz")) {
    dimensions.add("haushalt");
  }
  if (text.includes("pädagog") || text.includes("raum") || text.includes("bildung")) {
    dimensions.add("paedagogik");
  }
  if (text.includes("klima") || text.includes("energie") || text.includes("co₂") || text.includes("co2")) {
    dimensions.add("klima");
  }
  if (text.includes("bau") || text.includes("übergang") || text.includes("infrastruktur") || text.includes("brandschutz")) {
    dimensions.add("bauzeit");
  }

  return dimensions;
}

function optionNarrative(optionType?: string) {
  switch (optionType) {
    case "reform_strong":
      return "Struktureller Eingriff mit hoher Wirkung und klarer Priorisierung.";
    case "reform_moderate":
      return "Teilmodernisierung mit gestufter Umsetzung und reduzierten Risiken.";
    case "pilot":
      return "Zeitlich befristete Übergangslösung zur Stabilisierung des Betriebs.";
    case "custom":
      return "Flankierende Maßnahme zur Vorbereitung und Absicherung der Entscheidung.";
    default:
      return "Kontextabhängige Maßnahme im Rahmen der Entscheidungsarchitektur.";
  }
}

function buildOptionCards(
  options: PresentationOption[],
  claims: Dossier["analyze"]["claims"],
  optionStatementIds: Map<string, string[]>,
  optionTouchedTitles: Map<string, string[]>,
) {
  const claimById = new Map(claims.map((claim) => [claim.id, claim]));

  return options.map((option) => {
    const statementIds = option.touchesStatements?.length
      ? option.touchesStatements
      : optionStatementIds.get(option.id) ?? [];

    const touchTitles = optionTouchedTitles.get(option.id) ?? [];

    const dimensionCounts: Record<DimensionKey, number> = {
      haushalt: 0,
      paedagogik: 0,
      klima: 0,
      bauzeit: 0,
    };

    for (const statementId of statementIds) {
      const claim = claimById.get(statementId);
      if (!claim) continue;
      const dims = inferDimensionsFromClaim(claim);
      for (const dim of dims) dimensionCounts[dim] += 1;
    }

    const dimensions = DIMENSIONS.map((dim) => {
      const count = dimensionCounts[dim.key];
      const value = count > 0 ? Math.min(0.9, 0.25 + count * 0.2) : 0.2;
      return { key: dim.key, label: dim.label, value };
    });

    const chips = DIMENSIONS.filter((dim) => dimensionCounts[dim.key] > 0).map((dim) => dim.label);

    return {
      id: option.id,
      label: option.label,
      type: option.type,
      narrative: optionNarrative(option.type),
      touches: touchTitles,
      dimensions,
      chips,
    } satisfies OptionCard;
  });
}

function mergeClusters(defaultClusters: PresentationCluster[], derivedClusters: PresentationCluster[]) {
  if (defaultClusters.length) return defaultClusters;
  return derivedClusters;
}

export function DossierViewer({ dossier }: { dossier: Dossier }) {
  const { meta, analyze, voteConfig } = dossier;
  const { presentation, streams, contributions, voteOptions, majorityDemo } = getPresentation(dossier);

  const derivedStats = deriveStatementStats(analyze.claims);
  const statementStats = presentation.statementStats ?? derivedStats;
  const clusters = mergeClusters(
    presentation.clusters ?? [],
    presentation.statementStats?.clusters ?? [],
  );

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

  const statementTitleById = new Map(analyze.claims.map((claim) => [claim.id, claim.title ?? claim.id]));

  const optionStatementIds = new Map<string, string[]>();
  for (const claim of analyze.claims) {
    const options = claim.debateFrame?.options ?? [];
    for (const option of options) {
      const list = optionStatementIds.get(option.id) ?? [];
      list.push(claim.id);
      optionStatementIds.set(option.id, list);
    }
  }

  const optionTouchedTitles = new Map<string, string[]>();
  for (const [optionId, ids] of optionStatementIds.entries()) {
    optionTouchedTitles.set(
      optionId,
      ids.map((id) => statementTitleById.get(id) ?? id),
    );
  }

  for (const option of presentation.options ?? []) {
    if (option.touchesStatements?.length) {
      optionTouchedTitles.set(
        option.id,
        option.touchesStatements.map((id) => statementTitleById.get(id) ?? id),
      );
    }
  }

  const optionCatalog = presentation.options ?? [];
  const votingOptions: PresentationVoteOption[] = voteOptions.length
    ? voteOptions
    : presentation.vote?.options?.length
      ? presentation.vote.options
      : optionCatalog.map((option) => ({ id: option.id, label: option.label }));

  const majority = majorityDemo.length
    ? majorityDemo
    : presentation.vote?.majorityDemo ?? votingOptions.map((opt) => ({ id: opt.id, pct: 0 }));

  const matrixOptions = buildOptionCards(
    votingOptions.map((vote) => {
      const full = optionCatalog.find((item) => item.id === vote.id);
      return {
        id: vote.id,
        label: vote.label,
        type: full?.type,
        touchesStatements: full?.touchesStatements,
      } as PresentationOption;
    }),
    analyze.claims,
    optionStatementIds,
    optionTouchedTitles,
  );

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

  const claimNodes = analyze.claims.map((claim) => ({
    id: claim.id,
    label: claim.title ?? claim.id,
    cluster: inferClusterFromClaim(claim),
  }));
  const graphNodes = analyze.evidenceGraph?.nodes ?? [];
  const sourceNodes = graphNodes
    .filter((node) => node.type === "evidence")
    .map((node) => ({ id: node.id, label: node.label }));

  const graphEdges = analyze.evidenceGraph?.edges ?? [];

  const header = (
    <header className="space-y-4 border-b border-[rgb(var(--border))] pb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
        Dossier (Demonstrationsfall)
      </p>
      <h1 className="font-serif text-4xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-6xl">
        {meta.title}
      </h1>
      <p className="max-w-2xl text-lg text-[rgb(var(--muted))]">
        {analyze.sourceText ?? "Fragestellung des Dossiers."} Dieses Demonstrationsdossier zeigt die E150-Entscheidungsakte: strukturierte Statements, normierter Optionenraum, Evidenzverknüpfung und Zuständigkeitswege.
      </p>
      <p className="text-sm text-[rgb(var(--muted))]">
        Die Abstimmungsdarstellung ist in dieser Demo simuliert und dient der Veranschaulichung der Beteiligungsebene.
      </p>
      <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
        {metaChips.map((chip) => (
          <span key={`${chip.label}-${chip.value}`} className="vog-chip">
            {chip.label}: <span className="font-semibold text-[rgb(var(--fg))]">{chip.value}</span>
          </span>
        ))}
      </div>
    </header>
  );

  const mainLeft = (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={streams[0] ? `/streams/${streams[0].id}` : "/dossier/demo"}
          className="vog-card p-4 space-y-2 transition hover:shadow-soft"
        >
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Themenströme
          </div>
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
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">
            {statementStats.total ?? derivedStats.total}
          </div>
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
          {SECTION_TITLES.options}
        </div>
        <OptionMatrix options={matrixOptions} />
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Abstimmung & Mehrheitsdynamik
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <VotePanel dossierId={meta.id} options={votingOptions} />
          <MajorityTrend dossierId={meta.id} options={votingOptions} majorityDemo={majority} />
        </div>
      </section>
    </>
  );

  const fullWidth = (
    <section className="space-y-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Evidenz-Topologie
      </div>
      <EvidenceField claims={claimNodes} sources={sourceNodes} edges={graphEdges} />
    </section>
  );

  const afterLeft = (
    <>
      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.clusters}
        </div>
        {clusters.length ? (
          <div className="flex flex-wrap gap-2 text-[11px] text-[rgb(var(--muted))]">
            {clusters.map((cluster) => (
              <span key={cluster.label} className="vog-chip">
                {cluster.label} ({cluster.count})
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[rgb(var(--muted))]">Keine Cluster hinterlegt.</p>
        )}
        {analyze.knots.length ? (
          <div className="space-y-2 text-sm text-[rgb(var(--fg))]">
            {analyze.knots.map((knot) => (
              <div key={knot.id} className="vog-card p-4">
                <p className="text-sm font-semibold">{knot.label}</p>
                <p className="text-sm text-[rgb(var(--muted))]">{knot.description}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.statements}
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
                  <p className="text-base font-semibold text-[rgb(var(--fg))]">{claim.title ?? "Statement"}</p>
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
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.title ?? "Statement"}</p>
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

  const sidebar = (
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
          Das Dossier folgt dem E150-Schema: strukturierte Statements, normierter Optionenraum, Evidenzverknüpfung und Zuständigkeitswege. Die Visualisierung dient der Transparenz von Konfliktlinien und Mehrheitsdynamiken.
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
    </>
  );

  const afterSidebar = (
    <>
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
    <DossierLayout
      header={header}
      mainLeft={mainLeft}
      sidebar={sidebar}
      fullWidth={fullWidth}
      afterLeft={afterLeft}
      afterSidebar={afterSidebar}
    />
  );
}

export default DossierViewer;

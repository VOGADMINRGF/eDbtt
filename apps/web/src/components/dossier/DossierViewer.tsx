import type { Dossier } from "@features/dossier";
import DossierPageShell from "./DossierPageShell";
import GraphMindmap from "./GraphMindmap";
import {
  SECTION_TITLES,
  STATUS_LABELS,
  STANCE_LABELS,
  VOTE_POLICY_LABELS,
  OPTION_TYPE_LABELS,
  JURISDICTION_LABELS,
} from "./labels";

type PresentationOption = {
  id: string;
  label: string;
  type?: string;
  touchesStatements?: string[];
};

type PresentationCluster = { label: string; count: number };

type PresentationPayload = {
  topic?: { id?: string; label?: string; municipality?: string };
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

  for (const note of notes) {
    if (note.kind !== "presentation" || !note.text) continue;
    try {
      const parsed = JSON.parse(note.text) as PresentationPayload;
      if (parsed.topic) result.topic = parsed.topic;
      if (parsed.inputs) result.inputs = parsed.inputs;
      if (parsed.statementStats) result.statementStats = parsed.statementStats;
      if (parsed.clusters) result.clusters = parsed.clusters;
      if (Array.isArray(parsed.options)) options.push(...parsed.options);
    } catch {
      continue;
    }
  }

  if (options.length) result.options = options;
  return result;
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
  const presentation = parsePresentationNotes(analyze.notes ?? []);
  const statementTitleById = new Map(analyze.claims.map((claim) => [claim.id, claim.title ?? claim.id]));

  const derivedStats = deriveStatementStats(analyze.claims);
  const statementStats = presentation.statementStats ?? derivedStats;
  const clusters = presentation.clusters ?? presentation.statementStats?.clusters ?? [];

  const inputs = presentation.inputs ?? {};
  const streams = getInputValue(inputs, ["streams"]) ?? "-";
  const contributions = getInputValue(inputs, ["beiträge", "beitraege", "contributions"]) ?? "-";
  const zeitfenster = getInputValue(inputs, ["zeitfenster", "updatedWindow"]) ?? "-";

  const sources = dossier.sourceSet.length ? dossier.sourceSet : analyze.runReceipt?.sourceSet ?? [];

  const optionTouches = buildOptionTouches(analyze.claims);
  const optionPool = new Map<string, PresentationOption>();
  const optionTouchedById = new Map<string, string[]>();

  for (const option of presentation.options ?? []) {
    optionPool.set(option.id, option);
    if (option.touchesStatements?.length) {
      const titles = option.touchesStatements
        .map((id) => statementTitleById.get(id) ?? id)
        .filter((item) => Boolean(item));
      optionTouchedById.set(option.id, titles as string[]);
    }
  }

  for (const claim of analyze.claims) {
    const options = claim.debateFrame?.options ?? [];
    for (const option of options) {
      if (!optionPool.has(option.id)) {
        optionPool.set(option.id, { id: option.id, label: option.label, type: option.type });
      }
    }
  }

  for (const [optionId, titles] of optionTouches.entries()) {
    if (!optionTouchedById.has(optionId)) {
      optionTouchedById.set(optionId, titles);
    }
  }

  const groupedOptions = Array.from(optionPool.values()).reduce<Record<string, PresentationOption[]>>(
    (acc, option) => {
      const key = groupOption(option);
      if (!acc[key]) acc[key] = [];
      acc[key].push(option);
      return acc;
    },
    {},
  );

  const coreClaims = analyze.claims.filter((claim) => claim.importance === 5);
  const secondaryClaims = analyze.claims.filter((claim) => claim.importance !== 5);

  const metaChips = [
    { label: "Thema", value: presentation.topic?.label ?? "-" },
    { label: "Status", value: STATUS_LABELS[meta.status] ?? meta.status },
    { label: "Geltungsbereich", value: JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction },
    { label: "Region", value: meta.region ?? "-" },
    { label: "Zeitfenster", value: String(zeitfenster) },
    { label: "Stand", value: formatDate(meta.updatedAt ?? meta.createdAt) },
  ];

  const left = (
    <>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="vog-card p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Streams</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{streams as string}</div>
        </div>
        <div className="vog-card p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beiträge</div>
          <div className="text-2xl font-semibold text-[rgb(var(--fg))]">{contributions as string}</div>
        </div>
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

      <section className="space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.options}
        </div>
        {OPTION_GROUP_ORDER.filter((key) => groupedOptions[key]?.length).map((groupKey) => (
          <div key={groupKey} className="space-y-3">
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{OPTION_GROUP_LABELS[groupKey]}</h3>
            <div className="grid gap-3">
              {groupedOptions[groupKey].map((option) => (
                <div key={option.id} className="vog-card p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="vog-chip">{option.label}</span>
                    <span className="vog-chip">
                      {OPTION_TYPE_LABELS[option.type ?? "custom"] ?? "Maßnahme"}
                    </span>
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
          {SECTION_TITLES.evidence}
        </div>
        <div className="vog-card p-5">
          <GraphMindmap nodes={analyze.evidenceGraph?.nodes} edges={analyze.evidenceGraph?.edges} summary={analyze.evidenceGraph?.summary} />
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
          Zuständigkeit: {JURISDICTION_LABELS[meta.jurisdiction] ?? meta.jurisdiction}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Region: {meta.region ?? "-"}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Zeitfenster: {zeitfenster as string}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Letztes Update: {formatDate(meta.updatedAt ?? meta.createdAt)}</div>
        {voteConfig ? (
          <>
            <div className="text-sm text-[rgb(var(--fg))]">
              Abstimmungsmodus: {VOTE_POLICY_LABELS[voteConfig.policy] ?? voteConfig.policy}
            </div>
            <div className="text-sm text-[rgb(var(--fg))]">
              Mindestoptionen: {voteConfig.minOptions}
            </div>
          </>
        ) : null}
      </section>

      <section className="vog-card p-5 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {SECTION_TITLES.methodology}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">Analysemodus: {analyze.mode}</div>
        <div className="text-sm text-[rgb(var(--fg))]">Sprache: {analyze.language.toUpperCase()}</div>
        {analyze.runReceipt ? (
          <>
            <div className="text-sm text-[rgb(var(--fg))]">Pipeline: {analyze.runReceipt.pipelineVersion}</div>
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
        <div className="text-sm text-[rgb(var(--fg))]">
          Quellen: {analyze.evidenceGraph?.summary.evidenceCount ?? sources.length}
        </div>
        <div className="text-sm text-[rgb(var(--fg))]">
          Kanten: {analyze.evidenceGraph?.edges.length ?? 0}
        </div>
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
      lead={analyze.sourceText ?? undefined}
      note="Demonstrationsdossier zur Darstellung der E150-Entscheidungsakte."
      metaChips={metaChips}
      left={left}
      right={right}
    />
  );
}

export default DossierViewer;

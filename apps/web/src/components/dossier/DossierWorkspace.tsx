"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Dossier } from "@features/dossier";
import type { DossierPublicUpdateContext } from "@features/dossier/updateReadModel";
import { usePrivacyGate } from "@/components/privacy/PrivacyGateProvider";
import DossierConnections, {
  type DossierFocusTarget,
} from "./DossierConnections";
import {
  buildDossierWorkspaceModel,
  type DossierWorkspaceClaim,
  type DossierWorkspaceCount,
  type DossierWorkspaceModel,
  type DossierWorkspaceQuestion,
  type DossierWorkspaceSource,
} from "./workspaceModel";

const MODES = [
  { id: "overview", label: "Überblick" },
  { id: "positions", label: "Positionen" },
  { id: "sources", label: "Quellen" },
  { id: "questions", label: "Offene Fragen" },
  { id: "participation", label: "Beteiligung" },
] as const;

type WorkspaceMode = (typeof MODES)[number]["id"];
type SourceFilter = "all" | "unreviewed" | "contradicting" | "unlinked";
type SemanticTone =
  | "positive"
  | "warning"
  | "danger"
  | "info"
  | "question"
  | "participation"
  | "neutral";

const SOURCE_FILTERS: Array<{ id: SourceFilter; label: string }> = [
  { id: "all", label: "Alle" },
  { id: "unreviewed", label: "Ungeprüft" },
  { id: "contradicting", label: "Widersprechend" },
  { id: "unlinked", label: "Ohne direkten Aussagebezug" },
];

const SEMANTIC_TONE_CLASSES: Record<SemanticTone, string> = {
  positive:
    "border-emerald-300/80 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/30",
  warning:
    "border-amber-300/80 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/30",
  danger: "border-red-300/80 bg-red-50/70 dark:border-red-700 dark:bg-red-950/30",
  info: "border-blue-300/80 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/30",
  question:
    "border-violet-300/80 bg-violet-50/70 dark:border-violet-700 dark:bg-violet-950/30",
  participation:
    "border-teal-300/80 bg-teal-50/70 dark:border-teal-700 dark:bg-teal-950/30",
  neutral:
    "border-slate-300/80 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/40",
};

const SEMANTIC_BAR_CLASSES: Record<SemanticTone, string> = {
  positive: "bg-emerald-600 dark:bg-emerald-400",
  warning: "bg-amber-600 dark:bg-amber-400",
  danger: "bg-red-600 dark:bg-red-400",
  info: "bg-blue-600 dark:bg-blue-400",
  question: "bg-violet-600 dark:bg-violet-400",
  participation: "bg-teal-600 dark:bg-teal-400",
  neutral: "bg-slate-500 dark:bg-slate-400",
};

const SEMANTIC_MARKERS: Record<SemanticTone, string> = {
  positive: "✓",
  warning: "!",
  danger: "×",
  info: "i",
  question: "?",
  participation: "→",
  neutral: "–",
};

function dossierFocusId(target: DossierFocusTarget) {
  return `dossier-focus-${target.type}-${encodeURIComponent(target.id)}`;
}

type Props = {
  dossier: Dossier;
  updateContext?: DossierPublicUpdateContext | null;
  sourceStatusLabel?: string | null;
  demo?: boolean;
};

function safeInternalHref(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized?.startsWith("/") && !normalized.startsWith("//") ? normalized : null;
}

function sourceMatchesFilter(source: DossierWorkspaceSource, filter: SourceFilter) {
  if (filter === "unreviewed") return source.reviewState === "unreviewed";
  if (filter === "contradicting") return source.hasContradiction;
  if (filter === "unlinked") return source.claimLinks.length === 0;
  return true;
}

function sourceSemanticTone(source: DossierWorkspaceSource): SemanticTone {
  if (source.hasContradiction) return "danger";
  if (source.reviewState === "unreviewed") return "warning";
  if (source.reviewState === "reviewed") return "positive";
  if (source.claimLinks.length > 0) return "info";
  return "neutral";
}

function questionSemanticTone(
  question: DossierWorkspaceQuestion,
): SemanticTone {
  if (question.status === "closed") return "positive";
  if (question.status === "answered") return "info";
  if (question.status === "in_review") return "warning";
  if (question.status === "open") return "question";
  return "neutral";
}

function EvidenceBadge({ claim }: { claim: DossierWorkspaceClaim }) {
  const tone =
    claim.evidenceTone === "positive"
      ? "border-emerald-300/70 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
      : claim.evidenceTone === "danger"
        ? "border-red-300/70 bg-red-500/10 text-red-950 dark:text-red-200"
      : claim.evidenceTone === "warning"
        ? "border-amber-300/70 bg-amber-500/10 text-amber-950 dark:text-amber-200"
        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
  return (
    <span
      data-semantic-tone={claim.evidenceTone}
      className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${tone}`}
    >
      <span aria-hidden="true" className="me-1">
        {SEMANTIC_MARKERS[claim.evidenceTone]}
      </span>
      {claim.evidenceLabel}
    </span>
  );
}

function ClaimCard({
  claim,
  onNavigate,
}: {
  claim: DossierWorkspaceClaim;
  onNavigate: (mode: WorkspaceMode, target: DossierFocusTarget) => void;
}) {
  const firstSourceId = claim.sourceLinks[0]?.sourceId;
  const firstQuestionId = claim.questionIds[0];
  const firstOptionId = claim.optionIds[0];
  const firstOpposingClaimId = claim.opposingClaimIds[0];
  const firstPerspectiveId = claim.missingPerspectiveIds[0];
  return (
    <article
      id={dossierFocusId({ type: "claim", id: claim.id })}
      tabIndex={-1}
      className="scroll-mt-36 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="max-w-2xl text-sm font-semibold leading-6 text-[rgb(var(--fg))]">
          {claim.title}
        </h3>
        <EvidenceBadge claim={claim} />
      </div>
      {claim.text !== claim.title ? (
        <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{claim.text}</p>
      ) : null}
      {claim.provenance || claim.uncertainty ? (
        <details className="mt-3 text-xs text-[rgb(var(--muted))]">
          <summary className="cursor-pointer font-semibold text-[rgb(var(--fg))]">
            Herkunft und Einordnung
          </summary>
          <div className="mt-2 space-y-1 leading-5">
            <p>Quelle: {claim.provenance ?? "Keine verknüpfte Quelle ausgewiesen."}</p>
            <p>Einordnung: {claim.uncertainty ?? "Keine zusätzliche Einordnung hinterlegt."}</p>
          </div>
        </details>
      ) : null}
      {firstSourceId ||
      firstQuestionId ||
      firstOptionId ||
      firstOpposingClaimId ||
      firstPerspectiveId ? (
        <nav
          aria-label={`Verbindungen zu ${claim.title}`}
          className="mt-3 flex flex-wrap gap-2"
        >
          {firstSourceId ? (
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
              onClick={() => onNavigate("sources", { type: "source", id: firstSourceId })}
            >
              {claim.sourceLinks.length} Quelle{claim.sourceLinks.length === 1 ? "" : "n"}
            </button>
          ) : null}
          {firstOpposingClaimId ? (
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
              onClick={() =>
                onNavigate("positions", { type: "claim", id: firstOpposingClaimId })
              }
            >
              {claim.opposingClaimIds.length} Gegenposition
              {claim.opposingClaimIds.length === 1 ? "" : "en"}
            </button>
          ) : null}
          {firstQuestionId ? (
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
              onClick={() =>
                onNavigate("questions", { type: "question", id: firstQuestionId })
              }
            >
              {claim.questionIds.length} offene Frage{claim.questionIds.length === 1 ? "" : "n"}
            </button>
          ) : null}
          {firstOptionId ? (
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
              onClick={() => onNavigate("overview", { type: "option", id: firstOptionId })}
            >
              {claim.optionIds.length} Option{claim.optionIds.length === 1 ? "" : "en"}
            </button>
          ) : null}
          {firstPerspectiveId ? (
            <button
              type="button"
              className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:border-[rgb(var(--grad-from))]"
              onClick={() =>
                onNavigate("overview", { type: "perspective", id: firstPerspectiveId })
              }
            >
              {claim.missingPerspectiveIds.length} fehlende Perspektive
              {claim.missingPerspectiveIds.length === 1 ? "" : "n"}
            </button>
          ) : null}
        </nav>
      ) : (
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Noch keine fachlichen Verbindungen zu Quelle, Frage oder Option hinterlegt.
        </p>
      )}
    </article>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm leading-6 text-[rgb(var(--muted))]">
      {children}
    </p>
  );
}

function PanelHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[rgb(var(--border))] pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function MetricHeading({
  tone,
  children,
}: {
  tone: SemanticTone;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-semibold text-[rgb(var(--fg))]">
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]"
      >
        {SEMANTIC_MARKERS[tone]}
      </span>
      {children}
    </h3>
  );
}

function CountBars({
  items,
  onSelect,
}: {
  items: DossierWorkspaceCount[];
  onSelect: (item: DossierWorkspaceCount) => void;
}) {
  const maximum = Math.max(1, ...items.map((item) => item.count));
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const tone = item.tone ?? "neutral";
        const content = (
          <>
            <span className="flex items-center justify-between gap-3 text-xs">
              <span>{item.label}</span>
              <strong>{item.count}</strong>
            </span>
            <span
              role="img"
              aria-label={`${item.label}: ${item.count}`}
              className="mt-1 block h-2 overflow-hidden rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))]"
            >
              <span
                className={`block h-full rounded-full ${SEMANTIC_BAR_CLASSES[tone]}`}
                style={{ width: `${(item.count / maximum) * 100}%` }}
              />
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.targetId ? (
              <button
                type="button"
                className="w-full rounded-xl p-1 text-start text-[rgb(var(--fg))] transition-colors duration-150 hover:bg-[rgb(var(--card))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none"
                onClick={() => onSelect(item)}
              >
                {content}
              </button>
            ) : (
              <div className="p-1 text-[rgb(var(--fg))]">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function DossierMetrics({
  model,
  onNavigate,
}: {
  model: DossierWorkspaceModel;
  onNavigate: (mode: WorkspaceMode, target: DossierFocusTarget) => void;
}) {
  return (
    <aside aria-label="Kompakte Dossier-Übersichten" className="space-y-4">
      <section
        data-semantic-tone="info"
        className={`rounded-3xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.info}`}
      >
        <MetricHeading tone="info">Beleglage der Aussagen</MetricHeading>
        {model.metrics.evidence.available ? (
          <div className="mt-3">
            <CountBars
              items={model.metrics.evidence.items}
              onSelect={(item) =>
                item.targetId
                  ? onNavigate("overview", { type: "claim", id: item.targetId })
                  : undefined
              }
            />
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              Grundlage: {model.metrics.evidence.totalClaims} Kernaussagen und ihre real
              verknüpften Befunde.
            </p>
          </div>
        ) : (
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Nicht verfügbar: Es liegen keine auswertbaren Quellenbeziehungen vor.
          </p>
        )}
      </section>

      <section
        data-semantic-tone="question"
        className={`rounded-3xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.question}`}
      >
        <MetricHeading tone="question">Perspektiven</MetricHeading>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Fehlend dokumentiert</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.perspectives.missingCount}
            </dd>
          </div>
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Aussagen zugeordnet</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.perspectives.linkedMissingCount}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
          Eine Abdeckungsquote ist nicht verfügbar. Auch 0 dokumentierte Lücken belegt keine
          vollständige Abdeckung.
        </p>
        {model.perspectives[0] ? (
          <button
            type="button"
            className="mt-3 text-sm font-semibold text-[rgb(var(--fg))] underline underline-offset-4"
            onClick={() =>
              onNavigate("overview", { type: "perspective", id: model.perspectives[0].id })
            }
          >
            Fehlende Perspektiven im Zusammenhang
          </button>
        ) : null}
      </section>

      <section
        data-semantic-tone="question"
        className={`rounded-3xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.question}`}
      >
        <MetricHeading tone="question">Status offener Fragen</MetricHeading>
        {model.metrics.questions.length ? (
          <div className="mt-3">
            <CountBars
              items={model.metrics.questions}
              onSelect={(item) =>
                item.targetId
                  ? onNavigate("questions", { type: "question", id: item.targetId })
                  : undefined
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">Keine Fragen dokumentiert.</p>
        )}
      </section>

      <section
        data-semantic-tone="info"
        className={`rounded-3xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.info}`}
      >
        <MetricHeading tone="info">Quellenstatus und -arten</MetricHeading>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
          {model.sourceTrustLabel}
        </p>
        {model.metrics.sourceTypes.length ? (
          <div className="mt-3">
            <CountBars
              items={model.metrics.sourceTypes}
              onSelect={(item) =>
                item.targetId
                  ? onNavigate("sources", { type: "source", id: item.targetId })
                  : undefined
              }
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Nicht verfügbar: keine Quellen hinterlegt.
          </p>
        )}
      </section>

      <section
        data-semantic-tone="participation"
        className={`rounded-3xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.participation}`}
      >
        <MetricHeading tone="participation">
          Optionen und Abhängigkeiten
        </MetricHeading>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Optionen</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.decisions.optionCount}
            </dd>
          </div>
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Mit Aussagen verknüpft</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.decisions.linkedOptionCount}
            </dd>
          </div>
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Von Fragen betroffen</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.decisions.questionedOptionCount}
            </dd>
          </div>
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Zielkonflikte</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.decisions.conflictCount}
            </dd>
          </div>
        </dl>
        {model.conflicts.length ? (
          <details className="mt-3 text-xs text-[rgb(var(--muted))]">
            <summary className="cursor-pointer font-semibold text-[rgb(var(--fg))]">
              Zielkonflikte lesen
            </summary>
            <ul className="mt-2 space-y-2">
              {model.conflicts.map((conflict) => <li key={conflict}>{conflict}</li>)}
            </ul>
          </details>
        ) : (
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Keine Zielkonflikte gesondert dokumentiert.
          </p>
        )}
      </section>
    </aside>
  );
}

function QuestionReviewAction({
  dossierId,
  question,
  demo,
}: {
  dossierId: string;
  question: DossierWorkspaceQuestion;
  demo: boolean;
}) {
  const privacyGate = usePrivacyGate();
  const [state, setState] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const label =
    question.status === "answered" ? "Antwortprüfung anfragen" : "Prüfung anfragen";

  async function requestReview() {
    if (demo || state === "pending" || state === "success") return;
    if (!privacyGate.ensureActiveProcessingAllowed("dossier-question-review")) return;
    setState("pending");
    setMessage(null);
    try {
      const response = await fetch("/api/dossier/request-clarification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dossierId,
          questionText: question.text,
          context: "Prüfanfrage aus dem öffentlichen Dossier-Arbeitsraum",
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean };
      if (response.ok && payload.ok) {
        setState("success");
        setMessage("Die Frage wurde an die bestehende redaktionelle Prüfung übergeben.");
      } else {
        setState("error");
        setMessage(
          response.status === 401
            ? "Für die Prüfanfrage ist eine Anmeldung erforderlich."
            : "Die Prüfanfrage ist derzeit nicht verfügbar.",
        );
      }
    } catch {
      setState("error");
      setMessage("Die Prüfanfrage ist derzeit nicht verfügbar.");
    }
  }

  return (
    <div className="mt-4 border-t border-[rgb(var(--border))] pt-4">
      <button
        type="button"
        className="btn-secondary min-h-11 px-4 py-2 text-sm"
        disabled={demo || state === "pending" || state === "success"}
        onClick={() => void requestReview()}
      >
        {demo
          ? "Prüfanfrage hier nicht verfügbar"
          : state === "pending"
            ? "Übergabe läuft…"
            : state === "success"
              ? "Prüfung angefragt"
              : label}
      </button>
      <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]" role="status">
        {demo
          ? "In der Demonstration können keine Prüfaufträge gesendet werden."
          : message ??
            "Die Anfrage wird an die bestehende redaktionelle Prüfung übergeben und nachvollziehbar protokolliert."}
      </p>
    </div>
  );
}

export function DossierWorkspace({
  dossier,
  updateContext = null,
  sourceStatusLabel = null,
  demo = false,
}: Props) {
  const model = useMemo(
    () => buildDossierWorkspaceModel(dossier, sourceStatusLabel),
    [dossier, sourceStatusLabel],
  );
  const [mode, setMode] = useState<WorkspaceMode>("overview");
  const [focusTarget, setFocusTarget] = useState<DossierFocusTarget | null>(null);
  const [selectedRelationshipClaimId, setSelectedRelationshipClaimId] = useState<
    string | null
  >(null);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const anlassraumHref = safeInternalHref(updateContext?.relatedContext.anlassraumHref);
  const participationHref =
    anlassraumHref ?? safeInternalHref(updateContext?.relatedContext.swipesHref);
  const participationLabel = anlassraumHref
    ? "Zum Anlassraum"
    : "Zur Beteiligung";
  const participationCandidates = dossier.analyze.participationCandidates ?? [];
  const sourceFilterCounts = useMemo(
    () =>
      Object.fromEntries(
        SOURCE_FILTERS.map((filter) => [
          filter.id,
          model.sources.filter((source) => sourceMatchesFilter(source, filter.id)).length,
        ]),
      ) as Record<SourceFilter, number>,
    [model.sources],
  );
  const visibleSourceGroups = useMemo(
    () =>
      model.sourceGroups
        .map((group) => ({
          ...group,
          sources: group.sources.filter((source) =>
            sourceMatchesFilter(source, sourceFilter),
          ),
        }))
        .filter((group) => group.sources.length > 0),
    [model.sourceGroups, sourceFilter],
  );

  function selectMode(nextMode: WorkspaceMode, moveFocus = false) {
    setFocusTarget(null);
    setMode(nextMode);
    if (moveFocus) {
      const nextIndex = MODES.findIndex((item) => item.id === nextMode);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  function navigateTo(nextMode: WorkspaceMode, target: DossierFocusTarget) {
    if (target.type === "source") {
      setSourceFilter("all");
    }
    setFocusTarget(target);
    setMode(nextMode);
  }

  useEffect(() => {
    if (!focusTarget) return;
    const element = document.getElementById(dossierFocusId(focusTarget));
    if (!element) return;
    element.focus({ preventScroll: true });
    const reduceMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    element.scrollIntoView?.({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [focusTarget, mode]);

  useEffect(() => {
    const activeIndex = MODES.findIndex((item) => item.id === mode);
    tabRefs.current[activeIndex]?.scrollIntoView?.({
      behavior: "auto",
      block: "nearest",
      inline: "center",
    });
  }, [mode]);

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % MODES.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + MODES.length) % MODES.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = MODES.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextMode = MODES[nextIndex];
    setFocusTarget(null);
    setMode(nextMode.id);
    tabRefs.current[nextIndex]?.focus();
  }

  const overviewNextMode: WorkspaceMode =
    model.sources.length > 0
      ? "sources"
      : model.questions.length > 0
        ? "questions"
        : participationHref
          ? "participation"
          : "positions";
  const overviewNextLabel =
    overviewNextMode === "sources"
      ? "Quellen prüfen"
      : overviewNextMode === "questions"
        ? "Offene Fragen prüfen"
        : overviewNextMode === "participation"
          ? "Beteiligung ansehen"
          : "Positionen prüfen";

  return (
    <section
      data-dossier-workspace="true"
      className="mx-auto w-full max-w-[1560px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 xl:px-10"
      lang={model.language}
      dir={model.dir}
      aria-label="Dossier-Arbeitsraum"
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          [data-dossier-workspace="true"] #dossier-workspace-panel > div {
            animation: dossier-workspace-panel-in 150ms ease-out;
          }

          [data-dossier-workspace="true"] details[open] > :not(summary) {
            animation: dossier-workspace-detail-in 150ms ease-out;
          }
        }

        @keyframes dossier-workspace-panel-in {
          from { opacity: 0.82; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes dossier-workspace-detail-in {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
      `}</style>
      <header className="rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-[0_22px_60px_rgba(2,6,23,0.07)] sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--fg))]">
            {model.statusLabel}
          </span>
          {demo ? (
            <span className="rounded-full border border-amber-300/70 bg-amber-500/10 px-3 py-1 text-amber-950 dark:text-amber-200">
              Demonstrationsdaten
            </span>
          ) : null}
          <span className="text-[rgb(var(--muted))]">Stand: {model.updatedAtLabel}</span>
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Debattenstand
        </p>
        <h1 className="mt-2 max-w-5xl text-3xl font-bold leading-tight tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
          {model.title}
        </h1>
        <p className="mt-4 max-w-5xl text-lg font-semibold leading-8 text-[rgb(var(--fg))]">
          {model.coreQuestion}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
          {model.summary}
        </p>
        <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-2xl bg-[rgb(var(--bg))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Kernaussagen</dt>
            <dd className="mt-1 font-semibold text-[rgb(var(--fg))]">{model.claims.length}</dd>
          </div>
          <div className="rounded-2xl bg-[rgb(var(--bg))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Quellenlage</dt>
            <dd className="mt-1 font-semibold text-[rgb(var(--fg))]">{model.sourceTrustLabel}</dd>
          </div>
          <div className="rounded-2xl bg-[rgb(var(--bg))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Offene Fragen</dt>
            <dd className="mt-1 font-semibold text-[rgb(var(--fg))]">{model.questions.length}</dd>
          </div>
        </dl>
      </header>

      <div
        data-sticky-workspace-navigation="true"
        className="sticky top-16 z-30 -mx-2 mt-5 overflow-x-auto overscroll-x-contain rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/95 p-1.5 shadow-[0_10px_30px_rgba(2,6,23,0.10)] backdrop-blur-xl transition-[background-color,box-shadow,border-color] duration-150 motion-reduce:transition-none sm:mx-0"
      >
        <div
          role="tablist"
          aria-label="Dossier-Bereiche"
          className="inline-flex min-w-max gap-1 sm:min-w-full"
        >
          {MODES.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={`dossier-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={mode === item.id}
              aria-controls="dossier-workspace-panel"
              tabIndex={mode === item.id ? 0 : -1}
              onClick={() => selectMode(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`min-h-10 shrink-0 whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none ${
                mode === item.id
                  ? "bg-[rgb(var(--fg))] text-[rgb(var(--bg))] shadow-sm"
                  : "text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))] hover:text-[rgb(var(--fg))]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        id="dossier-workspace-panel"
        role="tabpanel"
        aria-labelledby={`dossier-tab-${mode}`}
        tabIndex={0}
        className="mt-5 scroll-mt-36 rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 transition-[opacity,background-color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none sm:p-7"
      >
        {mode === "overview" ? (
          <div className="space-y-6">
            <PanelHeader
              title="Debattenstand auf einen Blick"
              description="Zuerst das Wesentliche: Kernaussagen, ihre realen Beziehungen und kompakte Prüfübersichten. Vertiefungen bleiben in den weiteren Bereichen erreichbar."
              action={
                <button
                  type="button"
                  className="btn-primary min-h-11 px-4 py-2 text-sm"
                  onClick={() => selectMode(overviewNextMode, true)}
                >
                  {overviewNextLabel}
                </button>
              }
            />
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] xl:items-start">
              <div className="min-w-0 space-y-6">
                <DossierConnections
                  model={model}
                  focusTarget={focusTarget}
                  selectedClaimId={selectedRelationshipClaimId}
                  onSelectClaim={setSelectedRelationshipClaimId}
                  onNavigate={navigateTo}
                  focusId={dossierFocusId}
                />
                <section aria-labelledby="workspace-claims-heading">
                  <h3 id="workspace-claims-heading" className="text-lg font-semibold text-[rgb(var(--fg))]">
                    Zentrale Aussagen
                  </h3>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    Verbindungen öffnen direkt die zugehörige Quelle, Frage, Position oder Option.
                  </p>
                  {model.overviewClaims.length ? (
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {model.overviewClaims.map((claim) => (
                        <ClaimCard
                          key={claim.id}
                          claim={claim}
                          onNavigate={navigateTo}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <EmptyState>Für diesen Dossierstand sind noch keine Kernaussagen hinterlegt.</EmptyState>
                    </div>
                  )}
                  {model.claims.length > model.overviewClaims.length ? (
                    <details className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                        Alle {model.claims.length} Aussagen anzeigen
                      </summary>
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {model.claims.slice(model.overviewClaims.length).map((claim) => (
                          <ClaimCard
                            key={claim.id}
                            claim={claim}
                            onNavigate={navigateTo}
                          />
                        ))}
                      </div>
                    </details>
                  ) : null}
                </section>
              </div>
              <div className="space-y-4 xl:sticky xl:top-6">
                <DossierMetrics model={model} onNavigate={navigateTo} />
                {updateContext ? (
                  <details className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                    <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                      Update-Kontext
                    </summary>
                    <div className="mt-3 space-y-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      <p>{updateContext.checkedStandLabel}: {updateContext.checkedStandHint}</p>
                      <p>Öffentlich eingebundene Updates: {updateContext.publishedItems.length}</p>
                      <p>Noch in Prüfung: {updateContext.reviewItems.length}</p>
                    </div>
                  </details>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {mode === "positions" ? (
          <div className="space-y-6">
            <PanelHeader
              title="Positionen und Gegenpositionen"
              description="Aussagen bleiben nach ihrer dokumentierten Haltung getrennt. Wo keine Haltung ausgewiesen ist, wird sie nicht geraten."
              action={
                <button type="button" className="btn-primary min-h-11 px-4 py-2 text-sm" onClick={() => selectMode("sources", true)}>
                  Quellen prüfen
                </button>
              }
            />
            {([
              ["pro", "Dafür"],
              ["contra", "Dagegen"],
              ["neutral", "Nicht zugeordnet oder einordnend"],
            ] as const).map(([key, label]) => (
              <section key={key} aria-labelledby={`positions-${key}`}>
                <h3 id={`positions-${key}`} className="text-base font-semibold text-[rgb(var(--fg))]">
                  {label} ({model.positions[key].length})
                </h3>
                {model.positions[key].length ? (
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {model.positions[key].map((claim) => (
                      <ClaimCard
                        key={claim.id}
                        claim={claim}
                        onNavigate={navigateTo}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mt-3">
                    <EmptyState>Für diese Position liegen keine unterscheidbar zugeordneten Aussagen vor.</EmptyState>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : null}

        {mode === "sources" ? (
          <div className="space-y-6">
            <PanelHeader
              title="Quellen und Prüfkontext"
              description={model.sourceTrustLabel}
              action={
                <button type="button" className="btn-primary min-h-11 px-4 py-2 text-sm" onClick={() => selectMode("questions", true)}>
                  Offene Fragen prüfen
                </button>
              }
            />
            <div
              role="group"
              aria-label="Quellen filtern"
              className="flex max-w-full gap-2 overflow-x-auto pb-1"
            >
              {SOURCE_FILTERS.map((filter) => {
                const count = sourceFilterCounts[filter.id];
                const active = sourceFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={active}
                    disabled={filter.id !== "all" && count === 0}
                    onClick={() => setSourceFilter(filter.id)}
                    className={`min-h-10 shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-[background-color,color,border-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? "border-blue-700 bg-blue-700 text-white dark:border-blue-300 dark:bg-blue-300 dark:text-slate-950"
                        : "border-blue-300 bg-blue-50 text-blue-950 hover:border-blue-600 dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-100"
                    }`}
                  >
                    {filter.label} ({count})
                  </button>
                );
              })}
            </div>
            {model.sourceGroups.length ? (
              <div className="space-y-5">
                {visibleSourceGroups.map((group) => (
                  <section key={group.key} aria-labelledby={`source-group-${group.key}`}>
                    <h3 id={`source-group-${group.key}`} className="text-base font-semibold text-[rgb(var(--fg))]">
                      {group.label} ({group.sources.length})
                    </h3>
                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                      {group.sources.map((source) => (
                        <article
                          key={source.id}
                          id={dossierFocusId({ type: "source", id: source.id })}
                          tabIndex={-1}
                          lang={source.language}
                          dir={source.dir}
                          data-semantic-tone={sourceSemanticTone(source)}
                          className={`scroll-mt-36 rounded-2xl border border-s-4 p-4 transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none ${SEMANTIC_TONE_CLASSES[sourceSemanticTone(source)]}`}
                        >
                          <h4 className="flex items-start gap-2 text-sm font-semibold leading-6 text-[rgb(var(--fg))]">
                            <span aria-hidden="true">
                              {SEMANTIC_MARKERS[sourceSemanticTone(source)]}
                            </span>
                            <span>{source.title}</span>
                          </h4>
                          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                            {source.publisher ?? "Herausgeber nicht ausgewiesen"} · {source.typeLabel}
                          </p>
                          <p className="mt-2 text-xs font-semibold text-[rgb(var(--fg))]">
                            Quellenstatus:{" "}
                            {source.evidenceStatus ??
                              "nicht verfügbar – kein expliziter Prüfstatus hinterlegt"}
                          </p>
                          {source.href ? (
                            <a
                              href={source.href}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-[rgb(var(--fg))] underline decoration-[rgb(var(--border))] underline-offset-4"
                            >
                              Quelle öffnen
                            </a>
                          ) : (
                            <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                              Kein öffentlicher Quellenlink hinterlegt.
                            </p>
                          )}
                          {source.details.length ? (
                            <details className="mt-3 text-xs text-[rgb(var(--muted))]">
                              <summary className="cursor-pointer rounded-md font-semibold text-[rgb(var(--fg))] transition-colors duration-150 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-reduce:transition-none dark:hover:text-blue-300">
                                Details und Einschränkungen
                              </summary>
                              <ul className="mt-2 space-y-1">
                                {source.details.map((detail) => <li key={detail}>{detail}</li>)}
                              </ul>
                            </details>
                          ) : null}
                          <div className="mt-3 border-t border-current/15 pt-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                              Aussagebezug
                            </p>
                            {source.claimLinks.length ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {source.claimLinks.map((link) => (
                                  <button
                                    key={`${link.claimId}-${link.relation}`}
                                    type="button"
                                    className="rounded-full border border-blue-300 bg-blue-50 px-2.5 py-1 text-start text-xs font-semibold text-blue-950 transition-colors duration-150 hover:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 motion-reduce:transition-none dark:border-blue-700 dark:bg-blue-950/30 dark:text-blue-100"
                                    onClick={() =>
                                      navigateTo("positions", {
                                        type: "claim",
                                        id: link.claimId,
                                      })
                                    }
                                  >
                                    {link.relationLabel}: {link.claimTitle}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                                Kein direkter Aussagebezug dokumentiert.
                              </p>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
                {visibleSourceGroups.length === 0 ? (
                  <EmptyState>
                    Für diesen Filter liegen keine Quellen mit dem geforderten realen Status vor.
                  </EmptyState>
                ) : null}
              </div>
            ) : (
              <EmptyState>
                In diesem Dossierstand sind noch keine öffentlichen Quellen hinterlegt. Es wird kein Belegstatus vorgetäuscht.
              </EmptyState>
            )}
          </div>
        ) : null}

        {mode === "questions" ? (
          <div className="space-y-6">
            <PanelHeader
              title="Fragen prüfen"
              description="Jede Frage bündelt ihren dokumentierten Ursprung, Antwortstand, Quellenbezüge und genau einen Übergang in die bestehende redaktionelle Prüfung."
              action={
                <button type="button" className="btn-primary min-h-11 px-4 py-2 text-sm" onClick={() => selectMode("participation", true)}>
                  Beteiligung prüfen
                </button>
              }
            />
            {model.questions.length ? (
              <div className="space-y-3">
                {model.questions.map((question) => {
                  const supportingSources = question.sourceLinks.filter(
                    (link) => link.relation === "supports",
                  );
                  const conflictingSources = question.sourceLinks.filter(
                    (link) => link.relation !== "supports",
                  );
                  return (
                    <article
                      key={question.id}
                      id={dossierFocusId({ type: "question", id: question.id })}
                      tabIndex={-1}
                      data-semantic-tone="question"
                      className={`scroll-mt-36 rounded-2xl border border-s-4 p-4 transition-[border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] motion-reduce:transition-none sm:p-5 ${SEMANTIC_TONE_CLASSES.question}`}
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          data-semantic-tone={questionSemanticTone(question)}
                          className={`rounded-full border px-2 py-1 font-semibold text-[rgb(var(--fg))] ${SEMANTIC_TONE_CLASSES[questionSemanticTone(question)]}`}
                        >
                          <span aria-hidden="true" className="me-1">
                            {SEMANTIC_MARKERS[questionSemanticTone(question)]}
                          </span>
                          {question.statusLabel}
                        </span>
                        <span className="text-[rgb(var(--muted))]">
                          Zuständig: {question.responsibility ?? "Noch nicht zugeordnet"}
                        </span>
                        <span className="text-[rgb(var(--muted))]">
                          Letztes Update: {question.lastUpdate ?? "nicht verfügbar"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold leading-7 text-[rgb(var(--fg))]">
                        {question.text}
                      </h3>

                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        <section className={`rounded-xl border border-s-4 p-3 ${SEMANTIC_TONE_CLASSES.info}`}>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                            Ursprung und betroffene Aussagen
                          </h4>
                          {question.origin ? (
                            <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">
                              {question.origin}
                            </p>
                          ) : null}
                          {question.claimIds.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {question.claimIds.map((claimId) => {
                                const claim = model.claims.find((item) => item.id === claimId);
                                return claim ? (
                                  <button
                                    key={claim.id}
                                    type="button"
                                    className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-start text-xs font-semibold text-[rgb(var(--fg))]"
                                    onClick={() =>
                                      navigateTo("positions", { type: "claim", id: claim.id })
                                    }
                                  >
                                    {claim.title}
                                  </button>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                              Keine Aussage als Ursprung verknüpft.
                            </p>
                          )}
                        </section>

                        <section className={`rounded-xl border border-s-4 p-3 ${SEMANTIC_TONE_CLASSES[questionSemanticTone(question)]}`}>
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                            Antwortstand
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">
                            {question.answer ?? "Noch kein Antworttext dokumentiert."}
                          </p>
                          {question.answeredBy ? (
                            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                              Dokumentiert von: {question.answeredBy}
                            </p>
                          ) : null}
                          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                            {question.answerReviewLabel}
                          </p>
                          {question.answerCandidates.length ? (
                            <details className="mt-2 text-xs text-[rgb(var(--muted))]">
                              <summary className="cursor-pointer font-semibold text-[rgb(var(--fg))]">
                                Antwortkandidaten ({question.answerCandidates.length})
                              </summary>
                              <ul className="mt-2 space-y-2">
                                {question.answerCandidates.map((candidate) => (
                                  <li key={candidate}>{candidate}</li>
                                ))}
                              </ul>
                            </details>
                          ) : null}
                        </section>

                        <section
                          className={`rounded-xl border border-s-4 p-3 ${
                            SEMANTIC_TONE_CLASSES[
                              supportingSources.length ? "positive" : "neutral"
                            ]
                          }`}
                        >
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                            Stützende Quellen
                          </h4>
                          {supportingSources.length ? (
                            <div className="mt-2 space-y-2">
                              {supportingSources.map((link) => {
                                const source = model.sources.find(
                                  (item) => item.id === link.sourceId,
                                );
                                return source ? (
                                  <button
                                    key={`${source.id}-${link.relation}`}
                                    type="button"
                                    className="block w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-start text-sm text-[rgb(var(--fg))]"
                                    onClick={() =>
                                      navigateTo("sources", { type: "source", id: source.id })
                                    }
                                  >
                                    {source.title}
                                  </button>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                              Keine stützende Quelle direkt zugeordnet.
                            </p>
                          )}
                        </section>

                        <section
                          className={`rounded-xl border border-s-4 p-3 ${
                            SEMANTIC_TONE_CLASSES[
                              conflictingSources.length ? "danger" : "neutral"
                            ]
                          }`}
                        >
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                            Widersprechende oder ungeklärte Quellen
                          </h4>
                          {conflictingSources.length ? (
                            <div className="mt-2 space-y-2">
                              {conflictingSources.map((link) => {
                                const source = model.sources.find(
                                  (item) => item.id === link.sourceId,
                                );
                                return source ? (
                                  <button
                                    key={`${source.id}-${link.relation}`}
                                    type="button"
                                    className="block w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-start text-sm text-[rgb(var(--fg))]"
                                    onClick={() =>
                                      navigateTo("sources", { type: "source", id: source.id })
                                    }
                                  >
                                    <span className="font-semibold">{source.title}</span>
                                    <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                                      {link.relationLabel}
                                    </span>
                                  </button>
                                ) : null;
                              })}
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                              Keine widersprechende oder ungeklärte Quelle direkt zugeordnet.
                            </p>
                          )}
                        </section>
                      </div>

                      <section className={`mt-3 rounded-xl border border-s-4 p-3 ${SEMANTIC_TONE_CLASSES.participation}`}>
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                          Betroffene Entscheidungsoptionen
                        </h4>
                        {question.optionIds.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {question.optionIds.map((optionId) => {
                              const option = model.options.find((item) => item.id === optionId);
                              return option ? (
                                <button
                                  key={option.id}
                                  type="button"
                                  className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--fg))]"
                                  onClick={() =>
                                    navigateTo("overview", { type: "option", id: option.id })
                                  }
                                >
                                  {option.label}
                                </button>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                            Keine Entscheidungsoption direkt betroffen.
                          </p>
                        )}
                      </section>

                      <QuestionReviewAction
                        dossierId={dossier.meta.id}
                        question={question}
                        demo={demo}
                      />
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyState>Für diesen Dossierstand sind keine offenen Fragen dokumentiert.</EmptyState>
            )}
          </div>
        ) : null}

        {mode === "participation" ? (
          <div className="space-y-6">
            <PanelHeader
              title="Beteiligung"
              description="Das Dossier selbst sammelt und prüft den Debattenstand. Beteiligung läuft nur über einen bereits verknüpften, realen Pfad."
              action={
                participationHref ? (
                  <Link href={participationHref} className="btn-primary inline-flex min-h-11 items-center px-4 py-2 text-sm">
                    {participationLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="btn-primary min-h-11 px-4 py-2 text-sm"
                    onClick={() =>
                      selectMode(model.questions.length ? "questions" : "overview", true)
                    }
                  >
                    {model.questions.length ? "Offene Fragen prüfen" : "Zum Überblick"}
                  </button>
                )
              }
            />
            {participationHref ? (
              <div
                data-semantic-tone="participation"
                className={`rounded-2xl border border-s-4 p-5 ${SEMANTIC_TONE_CLASSES.participation}`}
              >
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                  <span aria-hidden="true" className="me-2">
                    {SEMANTIC_MARKERS.participation}
                  </span>
                  Beteiligung ist verknüpft
                </h3>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {updateContext?.relatedContext.anlassraumLabel ??
                    updateContext?.relatedContext.swipesLabel ??
                    "Ein bestehender Beteiligungspfad ist mit diesem Dossier verbunden."}
                </p>
              </div>
            ) : (
              <div
                data-semantic-tone="neutral"
                className={`rounded-2xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.neutral}`}
              >
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                  <span aria-hidden="true" className="me-2">
                    {SEMANTIC_MARKERS.neutral}
                  </span>
                  Kein realer Beteiligungspfad verknüpft
                </h3>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  Es wird weder automatisch ein Anlassraum noch eine Abstimmung erzeugt.
                </p>
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <section
                data-semantic-tone="participation"
                className={`rounded-2xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.participation}`}
              >
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                  <span aria-hidden="true" className="me-2">
                    {SEMANTIC_MARKERS.participation}
                  </span>
                  Dokumentierte betroffene Gruppen
                </h3>
                {participationCandidates.length ? (
                  <ul className="mt-3 space-y-3 text-sm leading-6 text-[rgb(var(--fg))]">
                    {participationCandidates.map((candidate, index) => (
                      <li key={candidate.id ?? index}>
                        <span className="font-semibold">{candidate.text}</span>
                        {candidate.rationale ? (
                          <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                            Beteiligungshinweis: {candidate.rationale}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    Nicht verfügbar: Es sind keine betroffenen Gruppen dokumentiert.
                  </p>
                )}
              </section>

              <section
                data-semantic-tone="question"
                className={`rounded-2xl border border-s-4 p-4 ${SEMANTIC_TONE_CLASSES.question}`}
              >
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">
                  <span aria-hidden="true" className="me-2">
                    {SEMANTIC_MARKERS.question}
                  </span>
                  Voraussetzungen und Blocker
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[rgb(var(--fg))]">
                  <li>
                    Beteiligungspfad:{" "}
                    {participationHref ? "real verknüpft" : "nicht verknüpft"}
                  </li>
                  <li>Dokumentierte offene Fragen: {model.questions.length}</li>
                  <li>
                    Dokumentierte fehlende Perspektiven: {model.perspectives.length}
                  </li>
                  <li>
                    Freigabe- oder Bereitschaftsstatus: nicht verfügbar
                  </li>
                </ul>
                <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
                  Zulässiger nächster Schritt:{" "}
                  {participationHref
                    ? "den bestehenden Beteiligungspfad öffnen"
                    : model.questions.length
                      ? "die dokumentierten offenen Fragen prüfen"
                      : "den Debattenstand prüfen"}. Keine automatische Übergabe.
                </p>
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default DossierWorkspace;

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
} from "./workspaceModel";

const MODES = [
  { id: "overview", label: "Überblick" },
  { id: "positions", label: "Positionen" },
  { id: "sources", label: "Quellen" },
  { id: "questions", label: "Offene Fragen" },
  { id: "participation", label: "Beteiligung" },
] as const;

type WorkspaceMode = (typeof MODES)[number]["id"];

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

function EvidenceBadge({ claim }: { claim: DossierWorkspaceClaim }) {
  const tone =
    claim.evidenceTone === "positive"
      ? "border-emerald-300/70 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
      : claim.evidenceTone === "warning"
        ? "border-amber-300/70 bg-amber-500/10 text-amber-950 dark:text-amber-200"
        : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${tone}`}>
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
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
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
                className="block h-full rounded-full bg-[rgb(var(--fg))]"
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
                className="w-full rounded-xl p-1 text-start text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
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
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Beleglage der Aussagen</h3>
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

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Perspektiven</h3>
        <p className="mt-2 text-2xl font-bold text-[rgb(var(--fg))]">
          {model.metrics.perspectives.missingCount}
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">als fehlend dokumentiert</p>
        <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
          Gesamtabdeckung: nicht verfügbar. Auch 0 dokumentierte Lücken belegt keine vollständige
          Abdeckung.
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

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Status offener Fragen</h3>
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

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Quellenarten</h3>
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

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Optionen und Zielkonflikte</h3>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-[rgb(var(--card))] p-3">
            <dt className="text-xs text-[rgb(var(--muted))]">Optionen</dt>
            <dd className="mt-1 text-xl font-bold text-[rgb(var(--fg))]">
              {model.metrics.decisions.optionCount}
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const anlassraumHref = safeInternalHref(updateContext?.relatedContext.anlassraumHref);
  const participationHref =
    anlassraumHref ?? safeInternalHref(updateContext?.relatedContext.swipesHref);
  const participationLabel = anlassraumHref
    ? "Zum Anlassraum"
    : "Zur Beteiligung";

  function selectMode(nextMode: WorkspaceMode, moveFocus = false) {
    setFocusTarget(null);
    setMode(nextMode);
    if (moveFocus) {
      const nextIndex = MODES.findIndex((item) => item.id === nextMode);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  function navigateTo(nextMode: WorkspaceMode, target: DossierFocusTarget) {
    setFocusTarget(target);
    setMode(nextMode);
  }

  useEffect(() => {
    if (!focusTarget) return;
    const element = document.getElementById(dossierFocusId(focusTarget));
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [focusTarget, mode]);

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
      className="mx-auto w-full max-w-[1560px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 xl:px-10"
      lang={model.language}
      dir={model.dir}
      aria-label="Dossier-Arbeitsraum"
    >
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

      <div className="mt-5 overflow-x-auto pb-1">
        <div
          role="tablist"
          aria-label="Dossier-Bereiche"
          className="inline-flex min-w-full gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1 sm:min-w-0"
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
              className={`min-h-11 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] ${
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
        className="mt-5 rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] sm:p-7"
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
            {model.sourceGroups.length ? (
              <div className="space-y-5">
                {model.sourceGroups.map((group) => (
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
                          className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
                        >
                          <h4 className="text-sm font-semibold leading-6 text-[rgb(var(--fg))]">{source.title}</h4>
                          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                            {source.publisher ?? "Herausgeber nicht ausgewiesen"} · {source.typeLabel}
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
                              <summary className="cursor-pointer font-semibold text-[rgb(var(--fg))]">
                                Details und Einschränkungen
                              </summary>
                              <ul className="mt-2 space-y-1">
                                {source.details.map((detail) => <li key={detail}>{detail}</li>)}
                              </ul>
                            </details>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
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
                      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 font-semibold text-[rgb(var(--fg))]">
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
                        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
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

                        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
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

                        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
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

                        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
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

                      <section className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
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
                  <button type="button" className="btn-primary min-h-11 px-4 py-2 text-sm" onClick={() => selectMode("overview", true)}>
                    Zum Überblick
                  </button>
                )
              }
            />
            {participationHref ? (
              <div className="rounded-2xl border border-emerald-300/60 bg-emerald-500/10 p-5">
                <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
                  Beteiligung ist verknüpft
                </h3>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {updateContext?.relatedContext.anlassraumLabel ??
                    updateContext?.relatedContext.swipesLabel ??
                    "Ein bestehender Beteiligungspfad ist mit diesem Dossier verbunden."}
                </p>
              </div>
            ) : (
              <EmptyState>
                Für diesen Dossierstand ist noch kein öffentlicher Beteiligungspfad verknüpft. Es wird weder automatisch ein Anlassraum noch eine Abstimmung erzeugt.
              </EmptyState>
            )}
            {(dossier.analyze.participationCandidates ?? []).length ? (
              <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                  Dokumentierte Beteiligungshinweise ({(dossier.analyze.participationCandidates ?? []).length})
                </summary>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {(dossier.analyze.participationCandidates ?? []).map((candidate, index) => (
                    <li key={candidate.id ?? index}>{candidate.text}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default DossierWorkspace;

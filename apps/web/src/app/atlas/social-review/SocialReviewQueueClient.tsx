"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type {
  SocialReviewQueueDecision,
  SocialReviewQueueItem,
  SocialReviewQueueReadModel,
} from "@features/anlassraum/socialReviewQueueReadModel";

type SocialReviewQueueClientProps = {
  queue: SocialReviewQueueReadModel;
  sourceState?: "live" | "fallback";
};

type DecisionFilter = "all" | SocialReviewQueueDecision;

type PersistedDecisionMeta = {
  decision: SocialReviewQueueDecision;
  note: string | null;
  updatedAt: string | null;
  history: SocialReviewQueueItem["decisionHistory"];
};

function baseStatusLabel(value: SocialReviewQueueItem["baseStatus"]) {
  if (value === "qualified_context") return "Qualified Context";
  if (value === "review_required") return "Review Required";
  return "Candidate";
}

function decisionLabel(value: SocialReviewQueueDecision) {
  if (value === "approved_for_social") return "Freigegeben";
  if (value === "held_back") return "Zurückgestellt";
  if (value === "deferred") return "Später";
  if (value === "internal_only") return "Intern lassen";
  if (value === "marked_for_rework") return "Überarbeiten";
  return "Offen";
}

function contextLabel(value: SocialReviewQueueItem["contextKind"]) {
  if (value === "anlass") return "Anlass";
  if (value === "runde") return "Runde";
  if (value === "ergebnis") return "Ergebnis";
  if (value === "dossier") return "Dossier";
  return "Companion";
}

function formatDate(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function normalizeNote(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 500) : null;
}

const DECISIONS: SocialReviewQueueDecision[] = [
  "approved_for_social",
  "held_back",
  "deferred",
  "internal_only",
  "marked_for_rework",
];

export default function SocialReviewQueueClient({
  queue,
  sourceState = "live",
}: SocialReviewQueueClientProps) {
  const [decisions, setDecisions] = useState<Record<string, SocialReviewQueueDecision>>(() =>
    Object.fromEntries(queue.items.map((item) => [item.id, item.persistedDecision])),
  );
  const [noteDraftById, setNoteDraftById] = useState<Record<string, string>>(() =>
    Object.fromEntries(queue.items.map((item) => [item.id, item.persistedDecisionNote ?? ""])),
  );
  const [persistedMetaById, setPersistedMetaById] = useState<Record<string, PersistedDecisionMeta>>(
    () =>
      Object.fromEntries(
        queue.items.map((item) => [
          item.id,
          {
            decision: item.persistedDecision,
            note: item.persistedDecisionNote,
            updatedAt: item.persistedDecisionUpdatedAt,
            history: item.decisionHistory,
          },
        ]),
      ),
  );
  const [savingById, setSavingById] = useState<Record<string, boolean>>({});
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("all");
  const [factcheckOnly, setFactcheckOnly] = useState(false);
  const [contextHintOnly, setContextHintOnly] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveInfo, setSaveInfo] = useState<string | null>(null);

  const decisionCounts = useMemo(() => {
    const base: Record<SocialReviewQueueDecision, number> = {
      pending: queue.items.length,
      approved_for_social: 0,
      held_back: 0,
      deferred: 0,
      internal_only: 0,
      marked_for_rework: 0,
    };
    for (const item of queue.items) {
      const decision = decisions[item.id] ?? "pending";
      base[decision] += 1;
      if (decision !== "pending") base.pending -= 1;
    }
    return base;
  }, [decisions, queue.items]);

  const filteredItems = useMemo(() => {
    return queue.items.filter((item) => {
      const decision = decisions[item.id] ?? item.persistedDecision ?? "pending";
      if (decisionFilter !== "all" && decision !== decisionFilter) return false;
      if (factcheckOnly && item.factcheckStatus !== "factcheck_suggested") return false;
      if (contextHintOnly && !item.existingContextHint) return false;
      return true;
    });
  }, [contextHintOnly, decisionFilter, decisions, factcheckOnly, queue.items]);

  function resolvePersistedMeta(item: SocialReviewQueueItem): PersistedDecisionMeta {
    return (
      persistedMetaById[item.id] ?? {
        decision: item.persistedDecision,
        note: item.persistedDecisionNote,
        updatedAt: item.persistedDecisionUpdatedAt,
        history: item.decisionHistory,
      }
    );
  }

  async function persistDecision(item: SocialReviewQueueItem, nextDecision: SocialReviewQueueDecision) {
    const previousDecision = decisions[item.id] ?? item.persistedDecision ?? "pending";
    const previousMeta = resolvePersistedMeta(item);
    const note = normalizeNote(noteDraftById[item.id] ?? previousMeta.note ?? "");

    setSaveError(null);
    setSaveInfo(null);
    setDecisions((prev) => ({ ...prev, [item.id]: nextDecision }));
    setSavingById((prev) => ({ ...prev, [item.id]: true }));

    try {
      const res = await fetch("/api/admin/atlas/social-review-decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entryId: item.entryId,
          decision: nextDecision,
          note,
        }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        decision?: {
          decision?: SocialReviewQueueDecision;
          note?: string | null;
          updatedAt?: string;
        };
        history?: SocialReviewQueueItem["decisionHistory"];
      };

      if (!res.ok || body.ok !== true) {
        throw new Error(body.error || "review_decision_save_failed");
      }

      const resolvedDecision = body.decision?.decision ?? nextDecision;
      const resolvedNote =
        body.decision?.note === undefined ? note : normalizeNote(body.decision.note);
      const resolvedUpdatedAt = body.decision?.updatedAt ?? new Date().toISOString();

      setDecisions((prev) => ({ ...prev, [item.id]: resolvedDecision }));
      setPersistedMetaById((prev) => ({
        ...prev,
        [item.id]: {
          decision: resolvedDecision,
          note: resolvedNote,
          updatedAt: resolvedUpdatedAt,
          history: Array.isArray(body.history) ? body.history : previousMeta.history,
        },
      }));
      setNoteDraftById((prev) => ({ ...prev, [item.id]: resolvedNote ?? "" }));
      setSaveInfo("Review-Entscheidung gespeichert.");
    } catch (error) {
      setDecisions((prev) => ({ ...prev, [item.id]: previousDecision }));
      setPersistedMetaById((prev) => ({ ...prev, [item.id]: previousMeta }));
      setSaveError(
        error instanceof Error
          ? error.message
          : "Review-Entscheidung konnte nicht gespeichert werden.",
      );
    } finally {
      setSavingById((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-6 px-4 py-6 md:px-8 md:py-10">
      <header className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgb(var(--grad-from))]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[rgb(var(--grad-to))]/10 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            SOCIAL REVIEW QUEUE
          </p>
          <h1
            className="text-3xl font-semibold leading-tight md:text-4xl"
            style={{
              backgroundImage: `linear-gradient(120deg,
                rgba(var(--fg),0.98) 0%,
                rgba(var(--grad-to),0.82) 92%)`,
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Kuratierte Freigabe für Social-Kandidaten
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Reviewbare Kandidatenfläche ohne Auto-Posting. Share-ready bleibt Kontextsignal,
            kein Wahrheits- oder Prioritätsprivileg.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]">
              Kein Auto-Posting
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]">
              Review-first
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]">
              Non-epistemisch
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/atlas/weekly"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              Wochenatlas
            </Link>
            <Link
              href="/runden"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              /runden
            </Link>
          </div>
        </div>
      </header>

      {sourceState === "fallback" ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Queue-Daten sind gerade nicht vollständig verfügbar. Die Oberfläche zeigt einen degradierten
          Stand und speichert keine Review-Entscheidungen serverseitig.
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Kandidaten" value={queue.totals.candidates} />
        <MetricCard label="Review Required" value={queue.totals.reviewRequired} />
        <MetricCard label="Qualified Context" value={queue.totals.qualifiedContext} />
        <MetricCard label="Factcheck-Hinweise" value={queue.totals.factcheckSuggested} />
      </section>

      <section className="rounded-2xl border bg-[rgb(var(--card))] p-4">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Aktueller Arbeitsstand</h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <StatusPill label="Offen" value={decisionCounts.pending} />
          <StatusPill label="Freigegeben" value={decisionCounts.approved_for_social} />
          <StatusPill label="Zurückgestellt" value={decisionCounts.held_back} />
          <StatusPill label="Später" value={decisionCounts.deferred} />
          <StatusPill label="Intern" value={decisionCounts.internal_only} />
          <StatusPill label="Überarbeiten" value={decisionCounts.marked_for_rework} />
        </div>
      </section>

      <section className="rounded-2xl border bg-[rgb(var(--card))] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] space-y-1 text-xs text-[rgb(var(--muted))]">
            <span className="block uppercase tracking-wide">Statusfilter</span>
            <select
              value={decisionFilter}
              onChange={(event) => setDecisionFilter(event.target.value as DecisionFilter)}
              className="w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1.5 text-sm text-[rgb(var(--fg))]"
            >
              <option value="all">Alle</option>
              <option value="pending">Offen</option>
              <option value="approved_for_social">Freigegeben</option>
              <option value="held_back">Zurückgestellt</option>
              <option value="deferred">Später</option>
              <option value="internal_only">Intern</option>
              <option value="marked_for_rework">Überarbeiten</option>
            </select>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <input
              type="checkbox"
              checked={factcheckOnly}
              onChange={(event) => setFactcheckOnly(event.target.checked)}
            />
            Nur Factcheck-Hinweise
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
            <input
              type="checkbox"
              checked={contextHintOnly}
              onChange={(event) => setContextHintOnly(event.target.checked)}
            />
            Nur mit Kontext-Hinweis
          </label>
          <span className="text-xs text-[rgb(var(--muted))]">
            Sichtbar: {filteredItems.length} von {queue.items.length}
          </span>
        </div>
      </section>

      <section className="space-y-4">
        {saveError ? (
          <article className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {saveError}
          </article>
        ) : null}
        {saveInfo ? (
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            {saveInfo}
          </article>
        ) : null}

        {filteredItems.length === 0 ? (
          <article className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
            Keine Queue-Einträge für den aktuellen Filter.
          </article>
        ) : (
          filteredItems.map((item) => {
            const decision = decisions[item.id] ?? "pending";
            const persistedMeta = resolvePersistedMeta(item);
            return (
              <article key={item.id} className="rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
                    <p className="text-sm text-[rgb(var(--muted))]">{item.summary}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-[rgb(var(--muted))]">
                      <Tag>{contextLabel(item.contextKind)}</Tag>
                      <Tag>{baseStatusLabel(item.baseStatus)}</Tag>
                      {item.factcheckStatus === "factcheck_suggested" ? (
                        <Tag>Factcheck vorgeschlagen</Tag>
                      ) : null}
                      {item.socialQualification ? <Tag>{item.socialQualification}</Tag> : null}
                    </div>
                  </div>
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">
                    {decisionLabel(decision)}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
                  <ReadField label="Canonical Target" value={item.canonicalTarget} isLink />
                  <ReadField label="QR Target" value={item.qrTarget} isLink />
                  <ReadField label="Share Prompt" value={item.sharePrompt} />
                  <ReadField label="Zuletzt aktualisiert" value={formatDate(item.updatedAt)} />
                </div>

                <p className="mt-3 text-xs text-[rgb(var(--muted))]">{item.shareSummary}</p>
                {item.existingContextHint ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Kontext-Hinweis: {item.existingContextHint}
                  </p>
                ) : null}
                {persistedMeta.updatedAt ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Persistiert: {formatDate(persistedMeta.updatedAt)}
                  </p>
                ) : null}
                {persistedMeta.note ? (
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">Notiz: {persistedMeta.note}</p>
                ) : null}

                <div className="mt-3 space-y-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <label className="block text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                    Entscheidungsnotiz
                  </label>
                  <textarea
                    value={noteDraftById[item.id] ?? ""}
                    onChange={(event) =>
                      setNoteDraftById((prev) => ({
                        ...prev,
                        [item.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1.5 text-xs text-[rgb(var(--fg))]"
                    placeholder="Kurze Begründung für die Entscheidung (optional)"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (decision === "pending") return;
                        void persistDecision(item, decision);
                      }}
                      disabled={savingById[item.id] === true || decision === "pending"}
                      className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Notiz speichern
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {DECISIONS.map((nextDecision) => (
                    <button
                      key={nextDecision}
                      type="button"
                      onClick={() => {
                        void persistDecision(item, nextDecision);
                      }}
                      disabled={savingById[item.id] === true}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                        decision === nextDecision
                          ? "border-[rgb(var(--grad-from))]/60 bg-[rgb(var(--bg))] text-[rgb(var(--fg))]"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {savingById[item.id] === true ? "Speichert …" : decisionLabel(nextDecision)}
                    </button>
                  ))}
                </div>

                {persistedMeta.history.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                      Letzte Entscheidungen
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                      {persistedMeta.history.map((entry, index) => (
                        <li key={`${item.id}-history-${index}`}>
                          {decisionLabel(entry.decision)} · {formatDate(entry.updatedAt)}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </section>

      <section className="rounded-2xl border bg-[rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Guardrails</h2>
        <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
          <li>Kein Auto-Posting und keine Plattform-Anbindung in dieser Queue.</li>
          <li>Social-Candidate bleibt Reviewsignal, kein Wahrheits- oder Prioritätsprivileg.</li>
          <li>Factcheck-/Kontext-Hinweise bleiben sichtbar, aber non-blocking.</li>
          <li>Queue dient nur Freigabe/Qualifizierung, nicht als Publish-Automat.</li>
        </ul>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border bg-[rgb(var(--card))] p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))] md:text-3xl">{value}</p>
    </article>
  );
}

function StatusPill({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))]">
      {label}: {value}
    </span>
  );
}

function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5">
      {children}
    </span>
  );
}

function ReadField({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2.5">
      <p className="text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      {isLink ? (
        <a
          href={value}
          className="mt-1 block break-all text-xs font-semibold text-[rgb(var(--grad-from))] hover:text-[rgb(var(--grad-to))]"
        >
          {value}
        </a>
      ) : (
        <p className="mt-1 text-xs text-[rgb(var(--fg))]">{value}</p>
      )}
    </div>
  );
}

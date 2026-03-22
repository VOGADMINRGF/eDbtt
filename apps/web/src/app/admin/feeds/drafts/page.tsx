"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FeedReviewState, VoteDraftSummary, VoteDraftStatus } from "@features/feeds/types";
import { preferredPathFromDraftState, type SignalToAnlassraumPath } from "@features/feeds/signalDecisioning";
import {
  buildFeedDraftListSearchParams,
  buildFeedDraftUrlSearchParams,
  readFeedDraftFiltersFromSearch,
} from "@/features/feedDraftsListFilters";
import { buildCreateFastPathHref } from "@/features/create/intents";

type RegionOption = { value: string; label: string };
type QueueSort = "newest" | "oldest" | "review_recent" | "review_stale" | "priority_high";
type QueueLinkFilter = "all" | "linked" | "unlinked";
type QueueWeakFilter = "all" | "flagged" | "clear";
type BulkAction = "ignore" | "mark_as_weak_signal" | "attach_to_anlassraum" | "create_anlassraum_candidate";
type LegacyBackfillMode = "attach" | "create_candidate";

type LegacyDraftSummary = {
  id: string;
  title: string;
  status: VoteDraftStatus;
  regionCode: string | null;
  anlassraumId: string | null;
  feedReviewState: FeedReviewState;
  weakSignalFlagged: boolean;
  weakSignalReason: string | null;
  reviewNote: string | null;
  lastReviewAction: string | null;
  lastReviewActionBy: string | null;
  lastReviewActionAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  queueMeta: {
    priorityScore: number;
    priorityBucket: "high" | "medium" | "low";
    pendingHours: number;
    needsAnlassraumBackfill: boolean;
    reasons: string[];
  };
};

type LegacyBackfillOutcome = {
  draftId: string;
  mode: LegacyBackfillMode;
  remediationKind: "attached_existing_anlassraum" | "created_candidate_anlassraum";
  result: {
    anlassraumId: string | null;
    feedReviewState: FeedReviewState;
    createdAnlassraum: boolean;
    draftStatus: VoteDraftStatus;
    reviewNote: string | null;
    lastReviewAction: string | null;
    lastReviewActionBy: string | null;
    lastReviewActionAt: string | null;
  };
};

const STATUS_FILTERS: { label: string; value: VoteDraftStatus | "all" }[] = [
  { label: "Alle", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Review", value: "review" },
  { label: "Veröffentlicht", value: "published" },
  { label: "Verworfen", value: "discarded" },
];

const REVIEW_STATE_FILTERS: { label: string; value: FeedReviewState | "all" }[] = [
  { label: "Alle Queue-States", value: "all" },
  { label: "Queued", value: "queued" },
  { label: "Ignored", value: "ignored" },
  { label: "Attached", value: "attached" },
  { label: "Candidate Created", value: "candidate_created" },
  { label: "Weak Signal", value: "weak_signal" },
];

const SORT_OPTIONS: { label: string; value: QueueSort }[] = [
  { label: "Neueste zuerst", value: "newest" },
  { label: "Älteste zuerst", value: "oldest" },
  { label: "Zuletzt reviewed", value: "review_recent" },
  { label: "Lange nicht reviewed", value: "review_stale" },
  { label: "Queue-Priorität", value: "priority_high" },
];

const REGION_FILTERS: RegionOption[] = [
  { value: "all", label: "Alle Regionen" },
  { value: "global", label: "Global / offen" },
  { value: "EU", label: "EU / Europa" },
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Österreich" },
  { value: "CH", label: "Schweiz" },
];

const LINK_FILTERS: { label: string; value: QueueLinkFilter }[] = [
  { label: "Alle Link-States", value: "all" },
  { label: "Mit Anlassraum", value: "linked" },
  { label: "Ohne Anlassraum", value: "unlinked" },
];

const WEAK_SIGNAL_FILTERS: { label: string; value: QueueWeakFilter }[] = [
  { label: "Alle Signal-Flags", value: "all" },
  { label: "Weak Signal", value: "flagged" },
  { label: "Kein Weak Signal", value: "clear" },
];

const BULK_ACTIONS: { label: string; value: BulkAction }[] = [
  { label: "1) ignore (Signal verwerfen)", value: "ignore" },
  { label: "2) attach_to_existing_anlassraum", value: "attach_to_anlassraum" },
  { label: "3) create_anlassraum_candidate", value: "create_anlassraum_candidate" },
  { label: "Weak Signal markieren", value: "mark_as_weak_signal" },
];

export default function AdminFeedDraftsPage() {
  const [statusFilter, setStatusFilter] = useState<VoteDraftStatus | "all">("all");
  const [reviewStateFilter, setReviewStateFilter] = useState<FeedReviewState | "all">("all");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [linkFilter, setLinkFilter] = useState<QueueLinkFilter>("all");
  const [weakSignalFilter, setWeakSignalFilter] = useState<QueueWeakFilter>("all");
  const [anlassraumIdFilter, setAnlassraumIdFilter] = useState("");
  const [sort, setSort] = useState<QueueSort>("priority_high");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<VoteDraftSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [urlHydrated, setUrlHydrated] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>("ignore");
  const [bulkAnlassraumId, setBulkAnlassraumId] = useState("");
  const [bulkWeakSignalReason, setBulkWeakSignalReason] = useState("");
  const [bulkReviewNote, setBulkReviewNote] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNotice, setBulkNotice] = useState<string | null>(null);

  const [legacyItems, setLegacyItems] = useState<LegacyDraftSummary[]>([]);
  const [legacyLoading, setLegacyLoading] = useState(false);
  const [legacyError, setLegacyError] = useState<string | null>(null);
  const [legacyAttachByDraft, setLegacyAttachByDraft] = useState<Record<string, string>>({});
  const [legacyNoteByDraft, setLegacyNoteByDraft] = useState<Record<string, string>>({});
  const [legacyBusyDraftId, setLegacyBusyDraftId] = useState<string | null>(null);
  const [legacyOutcomeByDraft, setLegacyOutcomeByDraft] = useState<Record<string, LegacyBackfillOutcome>>({});

  useEffect(() => {
    const hydrated = readFeedDraftFiltersFromSearch(window.location.search);
    setStatusFilter(hydrated.statusFilter);
    setReviewStateFilter(hydrated.reviewStateFilter);
    setSort(hydrated.sort);
    setQuery(hydrated.query);
    setLinkFilter(hydrated.linkFilter);
    setWeakSignalFilter(hydrated.weakSignalFilter);
    setAnlassraumIdFilter(hydrated.anlassraumIdFilter);
    setUrlHydrated(true);
  }, []);

  useEffect(() => {
    if (!urlHydrated) return;

    const qs = buildFeedDraftUrlSearchParams({
      statusFilter,
      reviewStateFilter,
      sort,
      query,
      linkFilter,
      weakSignalFilter,
      anlassraumIdFilter,
    });

    const nextSearch = qs.toString();
    const currentSearch = window.location.search.startsWith("?")
      ? window.location.search.slice(1)
      : window.location.search;
    if (nextSearch === currentSearch) return;

    const hash = window.location.hash || "";
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [
    urlHydrated,
    statusFilter,
    reviewStateFilter,
    sort,
    query,
    linkFilter,
    weakSignalFilter,
    anlassraumIdFilter,
  ]);

  useEffect(() => {
    let ignored = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = buildFeedDraftListSearchParams({
          statusFilter,
          regionFilter,
          reviewStateFilter,
          linkFilter,
          weakSignalFilter,
          anlassraumIdFilter,
          sort,
          query,
        });

        const res = await fetch(`/api/admin/feeds/drafts?${qs.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const data = await res.json();
        if (!ignored) {
          const loaded = (data.items ?? []) as VoteDraftSummary[];
          setItems(loaded);
          setSelectedIds((prev) => prev.filter((id) => loaded.some((item) => item.id === id)));
        }
      } catch (err: any) {
        if (!ignored) {
          setItems([]);
          setSelectedIds([]);
          setError(err?.message ?? "Unbekannter Fehler beim Laden der Drafts");
        }
      } finally {
        if (!ignored) setLoading(false);
      }
    }
    load();
    return () => {
      ignored = true;
    };
  }, [
    statusFilter,
    reviewStateFilter,
    regionFilter,
    linkFilter,
    weakSignalFilter,
    anlassraumIdFilter,
    sort,
    query,
    reloadToken,
  ]);

  useEffect(() => {
    let ignored = false;
    async function loadLegacy() {
      setLegacyLoading(true);
      setLegacyError(null);
      try {
        const qs = new URLSearchParams();
        qs.set("limit", "100");
        if (statusFilter !== "all") qs.set("status", statusFilter);
        if (reviewStateFilter !== "all") qs.set("reviewState", reviewStateFilter);
        const res = await fetch(`/api/admin/feeds/drafts/legacy?${qs.toString()}`, { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          items?: LegacyDraftSummary[];
          error?: string;
        };
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error || res.statusText);
        }
        if (!ignored) {
          const items = Array.isArray(body.items) ? body.items : [];
          setLegacyItems(items);
          setLegacyAttachByDraft((prev) => {
            const next = { ...prev };
            for (const item of items) {
              if (!(item.id in next)) next[item.id] = "";
            }
            return next;
          });
        }
      } catch (err: any) {
        if (!ignored) {
          setLegacyItems([]);
          setLegacyError(err?.message ?? "legacy_backfill_list_failed");
        }
      } finally {
        if (!ignored) setLegacyLoading(false);
      }
    }
    loadLegacy();
    return () => {
      ignored = true;
    };
  }, [statusFilter, reviewStateFilter, reloadToken]);

  const allVisibleSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );
  const normalizedAnlassraumIdFilter = anlassraumIdFilter.trim();
  const queueSummary = useMemo(
    () => ({
      total: items.length,
      unlinked: items.filter((item) => !item.anlassraumId).length,
      weak: items.filter((item) => item.weakSignal?.flagged).length,
      highPriority: items.filter((item) => item.queueMeta?.priorityBucket === "high").length,
    }),
    [items],
  );

  async function runBulkAction() {
    if (!selectedIds.length) {
      setBulkNotice("Bitte mindestens einen Draft auswählen.");
      return;
    }

    if (bulkAction === "attach_to_anlassraum" && !bulkAnlassraumId.trim()) {
      setBulkNotice("Für 'An Anlassraum anhängen' ist eine Anlassraum-ID erforderlich.");
      return;
    }

    setBulkBusy(true);
    setBulkNotice(null);
    try {
      const payload: Record<string, unknown> = {
        draftIds: selectedIds,
        action: bulkAction,
        reviewNote: bulkReviewNote.trim() || undefined,
      };

      if (bulkAction === "attach_to_anlassraum") {
        payload.anlassraumId = bulkAnlassraumId.trim();
      }
      if (bulkAction === "mark_as_weak_signal" && bulkWeakSignalReason.trim()) {
        payload.weakSignalReason = bulkWeakSignalReason.trim();
      }

      const res = await fetch("/api/admin/feeds/drafts/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || res.statusText);
      }

      const successCount = Number(body?.successCount ?? 0);
      const failureCount = Number(body?.failureCount ?? 0);
      setBulkNotice(`Bulk abgeschlossen: ${successCount} erfolgreich, ${failureCount} fehlgeschlagen.`);
      setSelectedIds([]);
      setReloadToken((prev) => prev + 1);
    } catch (err: any) {
      setBulkNotice(err?.message ?? "Bulk-Review fehlgeschlagen.");
    } finally {
      setBulkBusy(false);
    }
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((entry) => entry !== id) : [...prev, id]));
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !items.some((entry) => entry.id === id)));
      return;
    }
    setSelectedIds((prev) => {
      const merged = new Set(prev);
      for (const item of items) merged.add(item.id);
      return Array.from(merged);
    });
  }

  async function runLegacyBackfill(draftId: string, mode: LegacyBackfillMode) {
    const attachId = String(legacyAttachByDraft[draftId] ?? "").trim();
    if (mode === "attach" && !attachId) {
      setLegacyError("Für Attach ist eine Anlassraum-ID erforderlich.");
      return;
    }

    setLegacyBusyDraftId(draftId);
    setLegacyError(null);
    try {
      const payload: Record<string, unknown> = {
        mode,
      };
      if (mode === "attach") payload.anlassraumId = attachId;

      const note = String(legacyNoteByDraft[draftId] ?? "").trim();
      if (note) payload.reviewNote = note;

      const res = await fetch(`/api/admin/feeds/drafts/${draftId}/backfill`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        draftId?: string;
        mode?: LegacyBackfillMode;
        remediationKind?: LegacyBackfillOutcome["remediationKind"];
        result?: LegacyBackfillOutcome["result"];
        error?: string;
      };
      if (!res.ok || !body?.ok || !body.result || !body.mode || !body.remediationKind || !body.draftId) {
        throw new Error(body?.error || res.statusText);
      }

      const outcome: LegacyBackfillOutcome = {
        draftId: body.draftId,
        mode: body.mode,
        remediationKind: body.remediationKind,
        result: body.result,
      };
      setLegacyOutcomeByDraft((prev) => ({ ...prev, [draftId]: outcome }));
      setReloadToken((prev) => prev + 1);
    } catch (err: any) {
      setLegacyError(err?.message ?? "legacy_backfill_failed");
    } finally {
      setLegacyBusyDraftId(null);
    }
  }

  return (
    <div className="flex min-h-[80vh] w-full flex-col gap-5 py-4">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Feed-Pipeline
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Signal-Drafts: Anlassraum-first Queue</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Operativer Kernpfad: Signal -&gt; Anlassraum -&gt; Dossier -&gt; Output. Feeds liefern Hinweise, keine direkte
          Publikationslogik. Primärquellen bleiben die fachliche Basis.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/feeds" className="text-sm font-semibold text-sky-700 hover:underline">
            Zur Feed Control Plane
          </Link>
          <Link href="/admin/feeds/anlassraum" className="text-sm font-semibold text-sky-700 hover:underline">
            Zu Anlassräumen
          </Link>
          <Link href="/admin/anlassraeume" className="text-sm font-semibold text-sky-700 hover:underline">
            Zu Anlassraum Operations
          </Link>
          <Link
            href={buildCreateFastPathHref({
              source: "feed_drafts_queue",
              reason: "manual_fast_path_via_create",
            })}
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            4) manual_fast_path_via_create
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-sky-300/60 bg-sky-50/80 px-4 py-3 text-xs text-sky-950 dark:border-sky-400/45 dark:bg-sky-500/14 dark:text-sky-100">
        Entscheidungs-Pfade: <strong>ignore</strong>, <strong>attach_to_existing_anlassraum</strong>,{" "}
        <strong>create_anlassraum_candidate</strong>, <strong>manual_fast_path_via_create</strong>. Kein Auto-Publish,
        keine automatische Feed-Übernahme.
      </section>

      <section className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm lg:grid-cols-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))] lg:col-span-6">
          Kandidatenfilter
        </p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VoteDraftStatus | "all")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={reviewStateFilter}
          onChange={(e) => setReviewStateFilter(e.target.value as FeedReviewState | "all")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {REVIEW_STATE_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {REGION_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value as QueueLinkFilter)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {LINK_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={weakSignalFilter}
          onChange={(e) => setWeakSignalFilter(e.target.value as QueueWeakFilter)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {WEAK_SIGNAL_FILTERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as QueueSort)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche in Titel, Summary, Primärquelle"
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] lg:col-span-2"
        />
        <input
          value={anlassraumIdFilter}
          onChange={(e) => setAnlassraumIdFilter(e.target.value)}
          placeholder="Anlassraum-ID (optional)"
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] lg:col-span-2"
        />
      </section>

      {normalizedAnlassraumIdFilter ? (
        <p className="text-xs text-[rgb(var(--muted))]">
          Anlassraum-Filter aktiv: <span className="font-mono text-[rgb(var(--fg))]">{normalizedAnlassraumIdFilter}</span>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <header className="grid gap-3 border-b border-[rgb(var(--border))] px-4 py-4 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Kandidatenliste</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Fokus auf nächste sichere Aktion pro Draft: Kontext prüfen, Anlassraum zuordnen oder Review sauber
              abschließen.
            </p>
          </div>
          <SummaryChip label="Aktuelle Treffer" value={queueSummary.total} />
          <SummaryChip label="Ohne Anlassraum" value={queueSummary.unlinked} />
          <SummaryChip label="Weak Signal" value={queueSummary.weak} />
          <SummaryChip label="Hohe Priorität" value={queueSummary.highPriority} />
        </header>

        {error && (
          <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))]">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Alle auswählen" />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Kandidat</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Queue-Kontext</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Anlassraum & Hinweise</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Nächster Schritt</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Primärquelle / Signalspur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Lädt Drafts …
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Keine Drafts für die aktuellen Filter. Prüfe, ob Filter zu eng sind, oder öffne die
                    <span>{" "}</span>
                    <Link href="/admin/feeds" className="font-semibold text-sky-700 hover:underline">
                      Feed Control Plane
                    </Link>
                    <span>{" "}bzw. starte einen manuellen Anlassraum-Einstieg via{" "}</span>
                    <Link
                      href={buildCreateFastPathHref({
                        source: "feed_drafts_empty_state",
                        reason: "no_results_after_filter",
                      })}
                      className="font-semibold text-sky-700 hover:underline"
                    >
                      /create
                    </Link>
                    .
                  </td>
                </tr>
              )}
              {!loading &&
                items.map((draft) => {
                  const decisionPath = preferredPathFromDraftState({
                    anlassraumId: draft.anlassraumId,
                    weakSignalFlagged: draft.weakSignal?.flagged,
                    feedReviewState: draft.feedReviewState ?? null,
                  });
                  const nextStep = deriveOperationalNextStep(draft, decisionPath);
                  const manualCreateHref = buildCreateFastPathHref({
                    draftId: draft.id,
                    anlassraumId: draft.anlassraumId ?? null,
                    source: "feed_drafts_queue",
                    signalTitle: draft.title,
                    sourceUrl: draft.sourceUrl ?? null,
                    region: draft.regionCode ?? null,
                    reviewState: draft.feedReviewState ?? "queued",
                    reason: decisionPath,
                  });
                  return (
                    <tr key={draft.id} className={draft.queueMeta?.priorityBucket === "high" ? "bg-amber-50/40" : ""}>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(draft.id)}
                          onChange={() => toggleRow(draft.id)}
                          aria-label={`Draft ${draft.title} auswählen`}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link href={`/admin/feeds/drafts/${draft.id}`} className="font-semibold text-[rgb(var(--fg))] hover:underline">
                          {draft.title}
                        </Link>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {formatDate(draft.createdAt)} · ID {draft.id.slice(-6)}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Region: {draft.regionName ?? "–"} ({draft.regionCode ?? "—"})
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={draft.status} />
                          <ReviewStateBadge state={draft.feedReviewState ?? "queued"} />
                          <PriorityBadge bucket={draft.queueMeta?.priorityBucket ?? "low"} />
                          <DecisionPathBadge path={decisionPath} />
                        </div>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          pending: {draft.queueMeta?.pendingHours ?? 0}h · weak: {draft.weakSignal?.flagged ? "ja" : "nein"}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          Gründe: {(draft.queueMeta?.reasons ?? []).join(", ") || "—"}
                        </p>
                        {draft.lastReviewActionAt && (
                          <p className="text-xs text-[rgb(var(--muted))]">
                            letzte Aktion: {draft.lastReviewAction ?? "action"} · {formatDate(draft.lastReviewActionAt)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        {draft.anlassraumId ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-emerald-700">linked</p>
                            <Link href={`/admin/feeds/anlassraum/${draft.anlassraumId}`} className="font-semibold text-sky-700 hover:underline">
                              Anlassraum öffnen ({draft.anlassraumId.slice(-8)})
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-amber-700">unlinked</p>
                            <Link href="/admin/feeds/anlassraum" className="font-semibold text-sky-700 hover:underline">
                              Anlassraum-Kontext prüfen
                            </Link>
                            <Link
                              href={manualCreateHref}
                              className="font-semibold text-sky-700 hover:underline"
                            >
                              Manuell via /create fortsetzen
                            </Link>
                          </div>
                        )}
                        {draft.weakSignal?.flagged && (
                          <p className="mt-2 rounded bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                            Weak Signal: {draft.weakSignal.reason ?? "markiert"}
                          </p>
                        )}
                        {draft.reviewNote && (
                          <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                            Notiz: {String(draft.reviewNote).slice(0, 100)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        <p className="font-semibold text-[rgb(var(--fg))]">{nextStep.title}</p>
                        <p className="text-[rgb(var(--muted))]">{nextStep.detail}</p>
                        <Link href={`/admin/feeds/drafts/${draft.id}`} className="mt-1 inline-flex font-semibold text-sky-700 hover:underline">
                          Draft im Detail prüfen
                        </Link>
                        {!draft.anlassraumId ? (
                          <Link
                            href={manualCreateHref}
                            className="mt-1 inline-flex font-semibold text-sky-700 hover:underline"
                          >
                            4) manual_fast_path_via_create
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-[rgb(var(--muted))]">
                        <p className="font-semibold text-[rgb(var(--fg))]">Primärquelle</p>
                        {draft.sourceUrl ? (
                          <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-sky-600 hover:underline">
                            {extractDomain(draft.sourceUrl)}
                          </a>
                        ) : (
                          <span>offen</span>
                        )}
                        <p>Signalspur: Feed-Kandidat</p>
                        <p>Analyse: {draft.analyzeCompletedAt ? formatDate(draft.analyzeCompletedAt) : "offen"}</p>
                        <p>Pipeline: {draft.pipeline ?? "—"}</p>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
          Bulk Review (sekundär) · {selectedIds.length} ausgewählt
        </summary>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Sammelaktion für mehrere Signale. Kein Auto-Publish und kein Auto-Approval.
        </p>
        <section className="mt-3 grid gap-3 lg:grid-cols-6">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as BulkAction)}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          >
            {BULK_ACTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            value={bulkAnlassraumId}
            onChange={(e) => setBulkAnlassraumId(e.target.value)}
            placeholder="Anlassraum-ID (nur für Attach)"
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          />
          <input
            value={bulkWeakSignalReason}
            onChange={(e) => setBulkWeakSignalReason(e.target.value)}
            placeholder="Weak-Signal Grund (optional)"
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          />
          <input
            value={bulkReviewNote}
            onChange={(e) => setBulkReviewNote(e.target.value)}
            placeholder="Review-Notiz (optional)"
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] lg:col-span-2"
          />
          <button
            disabled={bulkBusy || selectedIds.length === 0}
            onClick={runBulkAction}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkBusy ? "läuft…" : "Bulk anwenden"}
          </button>
          {bulkNotice && <p className="text-xs text-[rgb(var(--muted))] lg:col-span-6">{bulkNotice}</p>}
        </section>
      </details>

      <details className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 shadow-sm">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
          Legacy Backfill (Maintenance-Ausnahme)
        </summary>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          Explizite Einzel-Remediation für Drafts ohne `anlassraumId` (kein Auto-Backfill, keine stille Migration).
        </p>
        {legacyError && (
          <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">{legacyError}</p>
        )}
        <div className="mt-3 overflow-auto rounded-xl border border-[rgb(var(--border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
            <thead className="bg-[rgb(var(--bg))]">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Draft</th>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Queue/Triage</th>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Audit</th>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {legacyLoading && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-[rgb(var(--muted))]">
                    Lade Legacy-Drafts …
                  </td>
                </tr>
              )}
              {!legacyLoading && legacyItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-[rgb(var(--muted))]">
                    Keine unlinked Legacy-Drafts im aktuellen Filter.
                  </td>
                </tr>
              )}
              {!legacyLoading &&
                legacyItems.map((item) => {
                  const outcome = legacyOutcomeByDraft[item.id];
                  return (
                    <tr key={item.id}>
                      <td className="px-2 py-2 align-top">
                        <Link href={`/admin/feeds/drafts/${item.id}`} className="font-semibold text-[rgb(var(--fg))] hover:underline">
                          {item.title}
                        </Link>
                        <p className="text-[11px] text-[rgb(var(--muted))]">ID {item.id.slice(-8)} · status {item.status}</p>
                        <p className="text-[11px] text-amber-700">anlassraumId fehlt</p>
                      </td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">
                        <p>queue: {item.feedReviewState}</p>
                        <p>prio: {item.queueMeta?.priorityBucket} ({item.queueMeta?.priorityScore})</p>
                        <p>pending: {item.queueMeta?.pendingHours}h</p>
                        <p>reasons: {(item.queueMeta?.reasons ?? []).join(", ") || "—"}</p>
                        <p>weak: {item.weakSignalFlagged ? item.weakSignalReason ?? "flagged" : "clear"}</p>
                      </td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">
                        <p>lastAction: {item.lastReviewAction ?? "—"}</p>
                        <p>lastBy: {item.lastReviewActionBy ?? "—"}</p>
                        <p>lastAt: {formatDate(item.lastReviewActionAt)}</p>
                        <p>note: {item.reviewNote ?? "—"}</p>
                        {outcome && (
                          <p className="mt-1 rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[11px] text-emerald-800">
                            remediation: {outcome.remediationKind} · anlassraum {outcome.result.anlassraumId ?? "—"}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2 align-top">
                        <div className="flex min-w-[260px] flex-col gap-1">
                          <input
                            value={legacyAttachByDraft[item.id] ?? ""}
                            onChange={(e) =>
                              setLegacyAttachByDraft((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Anlassraum-ID für Attach"
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
                          />
                          <input
                            value={legacyNoteByDraft[item.id] ?? ""}
                            onChange={(e) =>
                              setLegacyNoteByDraft((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Remediation-Notiz (optional)"
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={legacyBusyDraftId !== null}
                              onClick={() => runLegacyBackfill(item.id, "attach")}
                              className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {legacyBusyDraftId === item.id ? "..." : "Attach"}
                            </button>
                            <button
                              type="button"
                              disabled={legacyBusyDraftId !== null}
                              onClick={() => runLegacyBackfill(item.id, "create_candidate")}
                              className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {legacyBusyDraftId === item.id ? "..." : "Create Candidate"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function StatusBadge({ status }: { status: VoteDraftStatus }) {
  const colors: Record<VoteDraftStatus, string> = {
    draft: "border border-slate-300/70 bg-slate-100 text-slate-900 dark:border-slate-500/55 dark:bg-slate-500/22 dark:text-slate-100",
    review: "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
    published:
      "border border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-500/24 dark:text-emerald-100",
    discarded: "border border-rose-300/80 bg-rose-100 text-rose-950 dark:border-rose-400/55 dark:bg-rose-500/22 dark:text-rose-100",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>
      {status}
    </span>
  );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-lg font-semibold text-[rgb(var(--fg))]">{value}</p>
    </article>
  );
}

function ReviewStateBadge({ state }: { state: FeedReviewState }) {
  const colors: Record<FeedReviewState, string> = {
    queued: "border border-slate-300/70 bg-slate-100 text-slate-900 dark:border-slate-500/55 dark:bg-slate-500/22 dark:text-slate-100",
    ignored: "border border-zinc-300/70 bg-zinc-200 text-zinc-900 dark:border-zinc-500/55 dark:bg-zinc-500/24 dark:text-zinc-100",
    attached:
      "border border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-500/24 dark:text-emerald-100",
    candidate_created:
      "border border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-400/55 dark:bg-sky-500/24 dark:text-sky-100",
    weak_signal:
      "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
  };

  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${colors[state]}`}>{state}</span>;
}

function PriorityBadge({ bucket }: { bucket: "high" | "medium" | "low" }) {
  const colors: Record<"high" | "medium" | "low", string> = {
    high: "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
    medium: "border border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-400/55 dark:bg-sky-500/24 dark:text-sky-100",
    low: "border border-slate-300/70 bg-slate-100 text-slate-900 dark:border-slate-500/55 dark:bg-slate-500/22 dark:text-slate-100",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${colors[bucket]}`}>
      prio {bucket}
    </span>
  );
}

function DecisionPathBadge({ path }: { path: SignalToAnlassraumPath }) {
  const colors: Record<SignalToAnlassraumPath, string> = {
    ignore: "border border-zinc-300/70 bg-zinc-200 text-zinc-900 dark:border-zinc-500/55 dark:bg-zinc-500/24 dark:text-zinc-100",
    attach_to_existing_anlassraum:
      "border border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-500/24 dark:text-emerald-100",
    create_anlassraum_candidate:
      "border border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-400/55 dark:bg-sky-500/24 dark:text-sky-100",
    manual_fast_path_via_create:
      "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${colors[path]}`}>{path}</span>;
}

function deriveOperationalNextStep(
  draft: VoteDraftSummary,
  decisionPath: SignalToAnlassraumPath,
): { title: string; detail: string } {
  if (decisionPath === "manual_fast_path_via_create") {
    return {
      title: "Weak Signal validieren",
      detail: "Unsicheren Kontext manuell über /create prüfen und begründen.",
    };
  }

  if (decisionPath === "attach_to_existing_anlassraum") {
    return {
      title: "An bestehenden Anlassraum anhängen",
      detail: "Zuordnung steht im Vordergrund, neue Kandidatenanlage vermeiden.",
    };
  }

  if (decisionPath === "create_anlassraum_candidate" || !draft.anlassraumId) {
    return {
      title: "Anlassraum-Kandidat anlegen",
      detail: "Signal ist unlinked und braucht einen neuen Anlassraum-Kandidaten als Basis.",
    };
  }

  if (draft.status === "review" || draft.feedReviewState === "queued") {
    return {
      title: "Review abschließen",
      detail: "Entscheidung prüfen und Status konsistent fortführen.",
    };
  }

  return {
    title: "Kandidat verifizieren",
    detail: "Kontext, Analyse und Verlauf im Detailscreen prüfen.",
  };
}

function formatDate(value?: string | null) {
  if (!value) return "–";
  try {
    return new Date(value).toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function extractDomain(url?: string | null) {
  if (!url) return "–";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

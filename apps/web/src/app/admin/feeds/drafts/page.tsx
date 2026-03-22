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
import { useLocale } from "@/context/LocaleContext";
import {
  formatBooleanLabel,
  formatBulkActionLabel,
  formatDecisionPathLabel,
  formatFeedReviewStateLabel,
  formatLinkFilterLabel,
  formatPriorityBucketLabel,
  formatQueueSortLabel,
  formatWeakSignalFilterLabel,
  formatVoteDraftStatusLabel,
  getOperatorSystemTexts,
  resolveOperatorLocale,
  type OperatorLocale,
} from "@/features/i18n/operatorSystemTexts";

type RegionOption = { value: string };
type QueueSort = "newest" | "oldest" | "review_recent" | "review_stale" | "priority_high";
type QueueLinkFilter = "all" | "linked" | "unlinked";
type QueueWeakFilter = "all" | "flagged" | "clear";
type BulkAction = "ignore" | "mark_as_weak_signal" | "attach_to_anlassraum" | "create_anlassraum_candidate";
type LegacyBackfillMode = "attach" | "create_candidate";
type FeedDraftTexts = ReturnType<typeof getOperatorSystemTexts>["feedDrafts"];

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

const STATUS_FILTERS: Array<VoteDraftStatus | "all"> = ["all", "draft", "review", "published", "discarded"];
const REVIEW_STATE_FILTERS: Array<FeedReviewState | "all"> = [
  "all",
  "queued",
  "ignored",
  "attached",
  "candidate_created",
  "weak_signal",
];
const SORT_OPTIONS: QueueSort[] = ["newest", "oldest", "review_recent", "review_stale", "priority_high"];
const REGION_FILTERS: RegionOption[] = [
  { value: "all" },
  { value: "global" },
  { value: "EU" },
  { value: "DE" },
  { value: "AT" },
  { value: "CH" },
];
const LINK_FILTERS: QueueLinkFilter[] = ["all", "linked", "unlinked"];
const WEAK_SIGNAL_FILTERS: QueueWeakFilter[] = ["all", "flagged", "clear"];
const BULK_ACTIONS: BulkAction[] = [
  "ignore",
  "attach_to_anlassraum",
  "create_anlassraum_candidate",
  "mark_as_weak_signal",
];

export default function AdminFeedDraftsPage() {
  const { locale } = useLocale();
  const operatorLocale = resolveOperatorLocale(locale);
  const text = getOperatorSystemTexts(operatorLocale).feedDrafts;

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
          setError(err?.message ?? text.unknownLoadError);
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
      setBulkNotice(text.selectAtLeastOne);
      return;
    }

    if (bulkAction === "attach_to_anlassraum" && !bulkAnlassraumId.trim()) {
      setBulkNotice(text.attachNeedsAnlassraumId);
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
      setBulkNotice(`${text.bulkDonePrefix} ${successCount} ${text.bulkDoneMiddle} ${failureCount} ${text.bulkDoneSuffix}`);
      setSelectedIds([]);
      setReloadToken((prev) => prev + 1);
    } catch (err: any) {
      setBulkNotice(err?.message ?? text.bulkFailedFallback);
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
      setLegacyError(text.legacyAttachNeedsAnlassraumId);
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
      setLegacyError(err?.message ?? text.legacyBackfillFailed);
    } finally {
      setLegacyBusyDraftId(null);
    }
  }

  return (
    <div className="flex min-h-[80vh] w-full flex-col gap-5 py-4">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {text.headerKicker}
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{text.headerTitle}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {text.headerLead}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/feeds" className="text-sm font-semibold text-sky-700 hover:underline">
            {text.linkToFeedControl}
          </Link>
          <Link href="/admin/feeds/anlassraum" className="text-sm font-semibold text-sky-700 hover:underline">
            {text.linkToAnlassraumList}
          </Link>
          <Link href="/admin/anlassraeume" className="text-sm font-semibold text-sky-700 hover:underline">
            {text.linkToAnlassraumOps}
          </Link>
          <Link
            href={buildCreateFastPathHref({
              source: "feed_drafts_queue",
              reason: "manual_fast_path_via_create",
            })}
            className="text-sm font-semibold text-sky-700 hover:underline"
          >
            {text.linkToCreateFastPath}
          </Link>
        </div>
      </header>

      <section className="rounded-xl border border-sky-300/60 bg-sky-50/80 px-4 py-3 text-xs text-sky-950 dark:border-sky-400/45 dark:bg-sky-500/14 dark:text-sky-100">
        {text.decisioningLeadPrefix}: <strong>{formatDecisionPathLabel("ignore", operatorLocale)}</strong>,{" "}
        <strong>{formatDecisionPathLabel("attach_to_existing_anlassraum", operatorLocale)}</strong>,{" "}
        <strong>{formatDecisionPathLabel("create_anlassraum_candidate", operatorLocale)}</strong>,{" "}
        <strong>{formatDecisionPathLabel("manual_fast_path_via_create", operatorLocale)}</strong>. {text.decisioningLeadSuffix}
      </section>

      <section className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm lg:grid-cols-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))] lg:col-span-6">
          {text.candidateFilters}
        </p>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VoteDraftStatus | "all")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {STATUS_FILTERS.map((opt) => (
            <option key={opt} value={opt}>
              {formatVoteDraftStatusLabel(opt, operatorLocale)}
            </option>
          ))}
        </select>
        <select
          value={reviewStateFilter}
          onChange={(e) => setReviewStateFilter(e.target.value as FeedReviewState | "all")}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {REVIEW_STATE_FILTERS.map((opt) => (
            <option key={opt} value={opt}>
              {formatFeedReviewStateLabel(opt, operatorLocale)}
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
              {formatRegionFilterLabel(opt.value, text)}
            </option>
          ))}
        </select>
        <select
          value={linkFilter}
          onChange={(e) => setLinkFilter(e.target.value as QueueLinkFilter)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {LINK_FILTERS.map((opt) => (
            <option key={opt} value={opt}>
              {formatLinkFilterLabel(opt, operatorLocale)}
            </option>
          ))}
        </select>
        <select
          value={weakSignalFilter}
          onChange={(e) => setWeakSignalFilter(e.target.value as QueueWeakFilter)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {WEAK_SIGNAL_FILTERS.map((opt) => (
            <option key={opt} value={opt}>
              {formatWeakSignalFilterLabel(opt, operatorLocale)}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as QueueSort)}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {formatQueueSortLabel(opt, operatorLocale)}
            </option>
          ))}
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={text.searchPlaceholder}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] lg:col-span-2"
        />
        <input
          value={anlassraumIdFilter}
          onChange={(e) => setAnlassraumIdFilter(e.target.value)}
          placeholder={text.anlassraumFilterPlaceholder}
          className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] lg:col-span-2"
        />
      </section>

      {normalizedAnlassraumIdFilter ? (
        <p className="text-xs text-[rgb(var(--muted))]">
          {text.anlassraumFilterActive}:{" "}
          <span className="font-mono text-[rgb(var(--fg))]">{normalizedAnlassraumIdFilter}</span>
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm">
        <header className="grid gap-3 border-b border-[rgb(var(--border))] px-4 py-4 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{text.candidatesTitle}</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              {text.candidatesLead}
            </p>
          </div>
          <SummaryChip label={text.summaryHits} value={queueSummary.total} />
          <SummaryChip label={text.summaryUnlinked} value={queueSummary.unlinked} />
          <SummaryChip label={text.summaryWeak} value={queueSummary.weak} />
          <SummaryChip label={text.summaryHighPriority} value={queueSummary.highPriority} />
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
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{text.tableCandidate}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{text.tableQueueContext}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{text.tableAnlassraumHints}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{text.tableNextStep}</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">{text.tablePrimarySource}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    {text.loadingDrafts}
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    {text.emptyDraftsPrefix}
                    <span>{" "}</span>
                    <Link href="/admin/feeds" className="font-semibold text-sky-700 hover:underline">
                      {text.emptyDraftsMiddle}
                    </Link>
                    <span>{" "}{text.emptyDraftsSuffix}{" "}</span>
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
                  const nextStep = deriveOperationalNextStep(draft, decisionPath, text);
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
                          aria-label={`Draft ${draft.title}`}
                        />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Link href={`/admin/feeds/drafts/${draft.id}`} className="font-semibold text-[rgb(var(--fg))] hover:underline">
                          {draft.title}
                        </Link>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {formatDate(draft.createdAt, operatorLocale)} · {text.idLabel} {draft.id.slice(-6)}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          {text.regionLabel}: {draft.regionName ?? text.noValue} ({draft.regionCode ?? text.noValue})
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={draft.status} locale={operatorLocale} />
                          <ReviewStateBadge state={draft.feedReviewState ?? "queued"} locale={operatorLocale} />
                          <PriorityBadge bucket={draft.queueMeta?.priorityBucket ?? "low"} locale={operatorLocale} />
                          <DecisionPathBadge path={decisionPath} locale={operatorLocale} />
                        </div>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {text.pendingLabel}: {draft.queueMeta?.pendingHours ?? 0}h · {text.weakLabel}:{" "}
                          {formatBooleanLabel(Boolean(draft.weakSignal?.flagged), operatorLocale)}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">
                          {text.reasonsLabel}: {(draft.queueMeta?.reasons ?? []).join(", ") || text.noValue}
                        </p>
                        {draft.lastReviewActionAt && (
                          <p className="text-xs text-[rgb(var(--muted))]">
                            {text.lastActionLabel}: {draft.lastReviewAction ?? text.unknownActionFallback} ·{" "}
                            {formatDate(draft.lastReviewActionAt, operatorLocale)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        {draft.anlassraumId ? (
                          <div className="space-y-1">
                            <p className="font-semibold text-emerald-700">{text.linkedLabel}</p>
                            <Link href={`/admin/feeds/anlassraum/${draft.anlassraumId}`} className="font-semibold text-sky-700 hover:underline">
                              {text.openAnlassraum} ({draft.anlassraumId.slice(-8)})
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="font-semibold text-amber-700">{text.unlinkedLabel}</p>
                            <Link href="/admin/feeds/anlassraum" className="font-semibold text-sky-700 hover:underline">
                              {text.checkAnlassraumContext}
                            </Link>
                            <Link
                              href={manualCreateHref}
                              className="font-semibold text-sky-700 hover:underline"
                            >
                              {text.manualCreateLink}
                            </Link>
                          </div>
                        )}
                        {draft.weakSignal?.flagged && (
                          <p className="mt-2 rounded bg-amber-100 px-2 py-1 font-semibold text-amber-800">
                            {text.weakSignalLabel}: {draft.weakSignal.reason ?? text.weakLabel}
                          </p>
                        )}
                        {draft.reviewNote && (
                          <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">
                            {text.noteLabel}: {String(draft.reviewNote).slice(0, 100)}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-xs">
                        <p className="font-semibold text-[rgb(var(--fg))]">{nextStep.title}</p>
                        <p className="text-[rgb(var(--muted))]">{nextStep.detail}</p>
                        <Link href={`/admin/feeds/drafts/${draft.id}`} className="mt-1 inline-flex font-semibold text-sky-700 hover:underline">
                          {text.draftDetailLink}
                        </Link>
                        {!draft.anlassraumId ? (
                          <Link
                            href={manualCreateHref}
                            className="mt-1 inline-flex font-semibold text-sky-700 hover:underline"
                          >
                            {text.manualCreateLink}
                          </Link>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-[rgb(var(--muted))]">
                        <p className="font-semibold text-[rgb(var(--fg))]">{text.primarySourceLabel}</p>
                        {draft.sourceUrl ? (
                          <a href={draft.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-sky-600 hover:underline">
                            {extractDomain(draft.sourceUrl)}
                          </a>
                        ) : (
                          <span>{text.sourceOpenLabel}</span>
                        )}
                        <p>{text.signalTrailLabel}: {text.signalTrailCandidate}</p>
                        <p>
                          {text.analysisLabel}:{" "}
                          {draft.analyzeCompletedAt ? formatDate(draft.analyzeCompletedAt, operatorLocale) : text.sourceOpenLabel}
                        </p>
                        <p>{text.pipelineLabel}: {draft.pipeline ?? text.noValue}</p>
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
          {text.bulkSummaryPrefix} · {selectedIds.length} {text.selectedSuffix}
        </summary>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          {text.bulkLead}
        </p>
        <section className="mt-3 grid gap-3 lg:grid-cols-6">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as BulkAction)}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          >
            {BULK_ACTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {formatBulkActionLabel(opt, operatorLocale)}
              </option>
            ))}
          </select>
          <input
            value={bulkAnlassraumId}
            onChange={(e) => setBulkAnlassraumId(e.target.value)}
            placeholder={text.bulkAnlassraumPlaceholder}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          />
          <input
            value={bulkWeakSignalReason}
            onChange={(e) => setBulkWeakSignalReason(e.target.value)}
            placeholder={text.bulkWeakReasonPlaceholder}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
          />
          <input
            value={bulkReviewNote}
            onChange={(e) => setBulkReviewNote(e.target.value)}
            placeholder={text.bulkReviewNotePlaceholder}
            className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] lg:col-span-2"
          />
          <button
            disabled={bulkBusy || selectedIds.length === 0}
            onClick={runBulkAction}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkBusy ? text.applying : text.applyBulk}
          </button>
          {bulkNotice && <p className="text-xs text-[rgb(var(--muted))] lg:col-span-6">{bulkNotice}</p>}
        </section>
      </details>

      <details className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-[rgb(var(--muted))]">
          {text.legacySummary}
        </summary>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          {text.legacyLead}
        </p>
        {legacyError && (
          <p className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">{legacyError}</p>
        )}
        <div className="mt-3 overflow-auto rounded-xl border border-[rgb(var(--border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
            <thead className="bg-[rgb(var(--bg))]">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">{text.legacyColDraft}</th>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">{text.legacyColQueue}</th>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">{text.legacyColAudit}</th>
                <th className="px-2 py-2 text-left font-semibold text-[rgb(var(--muted))]">{text.legacyColRemediation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {legacyLoading && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-[rgb(var(--muted))]">
                    {text.loadingLegacy}
                  </td>
                </tr>
              )}
              {!legacyLoading && legacyItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 py-3 text-[rgb(var(--muted))]">
                    {text.emptyLegacy}
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
                        <p className="text-[11px] text-[rgb(var(--muted))]">
                          {text.idLabel} {item.id.slice(-8)} · status {formatVoteDraftStatusLabel(item.status, operatorLocale)}
                        </p>
                        <p className="text-[11px] text-amber-700">{text.missingAnlassraumId}</p>
                      </td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">
                        <p>{text.queueLabel}: {formatFeedReviewStateLabel(item.feedReviewState, operatorLocale)}</p>
                        <p>
                          {text.priorityLabel}: {formatPriorityBucketLabel(item.queueMeta?.priorityBucket ?? "low", operatorLocale)} (
                          {item.queueMeta?.priorityScore})
                        </p>
                        <p>{text.openSinceLabel}: {item.queueMeta?.pendingHours}h</p>
                        <p>{text.hintsLabel}: {(item.queueMeta?.reasons ?? []).join(", ") || text.noValue}</p>
                        <p>
                          {text.weakSignalLongLabel}:{" "}
                          {item.weakSignalFlagged ? item.weakSignalReason ?? text.weakLabel : text.noFlagLabel}
                        </p>
                      </td>
                      <td className="px-2 py-2 align-top text-[rgb(var(--muted))]">
                        <p>{text.lastActionLabel}: {item.lastReviewAction ?? text.noValue}</p>
                        <p>{text.executedByLabel}: {item.lastReviewActionBy ?? text.noValue}</p>
                        <p>{text.timestampLabel}: {formatDate(item.lastReviewActionAt, operatorLocale)}</p>
                        <p>{text.noteLabel}: {item.reviewNote ?? text.noValue}</p>
                        {outcome && (
                          <p className="mt-1 rounded border border-emerald-200 bg-emerald-50 px-1 py-0.5 text-[11px] text-emerald-800">
                            {text.remediationLabel}: {outcome.remediationKind} · Anlassraum{" "}
                            {outcome.result.anlassraumId ?? text.noValue}
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
                            placeholder={text.remediationAnlassraumPlaceholder}
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
                            placeholder={text.remediationNotePlaceholder}
                            className="rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              disabled={legacyBusyDraftId !== null}
                              onClick={() => runLegacyBackfill(item.id, "attach")}
                              className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {legacyBusyDraftId === item.id ? "..." : text.remediationAttach}
                            </button>
                            <button
                              type="button"
                              disabled={legacyBusyDraftId !== null}
                              onClick={() => runLegacyBackfill(item.id, "create_candidate")}
                              className="rounded border border-[rgb(var(--border))] px-2 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {legacyBusyDraftId === item.id ? "..." : text.remediationCreateCandidate}
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

function StatusBadge({ status, locale }: { status: VoteDraftStatus; locale: OperatorLocale }) {
  const colors: Record<VoteDraftStatus, string> = {
    draft: "border border-slate-300/70 bg-slate-100 text-slate-900 dark:border-slate-500/55 dark:bg-slate-500/22 dark:text-slate-100",
    review: "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
    published:
      "border border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-500/24 dark:text-emerald-100",
    discarded: "border border-rose-300/80 bg-rose-100 text-rose-950 dark:border-rose-400/55 dark:bg-rose-500/22 dark:text-rose-100",
  };
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>
      {formatVoteDraftStatusLabel(status, locale)}
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

function ReviewStateBadge({ state, locale }: { state: FeedReviewState; locale: OperatorLocale }) {
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

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${colors[state]}`}>
      {formatFeedReviewStateLabel(state, locale)}
    </span>
  );
}

function PriorityBadge({ bucket, locale }: { bucket: "high" | "medium" | "low"; locale: OperatorLocale }) {
  const colors: Record<"high" | "medium" | "low", string> = {
    high: "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
    medium: "border border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-400/55 dark:bg-sky-500/24 dark:text-sky-100",
    low: "border border-slate-300/70 bg-slate-100 text-slate-900 dark:border-slate-500/55 dark:bg-slate-500/22 dark:text-slate-100",
  };

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide ${colors[bucket]}`}>
      {formatPriorityBucketLabel(bucket, locale)}
    </span>
  );
}

function DecisionPathBadge({ path, locale }: { path: SignalToAnlassraumPath; locale: OperatorLocale }) {
  const colors: Record<SignalToAnlassraumPath, string> = {
    ignore: "border border-zinc-300/70 bg-zinc-200 text-zinc-900 dark:border-zinc-500/55 dark:bg-zinc-500/24 dark:text-zinc-100",
    attach_to_existing_anlassraum:
      "border border-emerald-300/80 bg-emerald-100 text-emerald-950 dark:border-emerald-400/55 dark:bg-emerald-500/24 dark:text-emerald-100",
    create_anlassraum_candidate:
      "border border-sky-300/80 bg-sky-100 text-sky-950 dark:border-sky-400/55 dark:bg-sky-500/24 dark:text-sky-100",
    manual_fast_path_via_create:
      "border border-amber-300/80 bg-amber-100 text-amber-950 dark:border-amber-400/55 dark:bg-amber-500/22 dark:text-amber-100",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${colors[path]}`}>
      {formatDecisionPathLabel(path, locale)}
    </span>
  );
}

function deriveOperationalNextStep(
  draft: VoteDraftSummary,
  decisionPath: SignalToAnlassraumPath,
  text: FeedDraftTexts,
): { title: string; detail: string } {
  if (decisionPath === "manual_fast_path_via_create") {
    return {
      title: text.nextStepWeakTitle,
      detail: text.nextStepWeakDetail,
    };
  }

  if (decisionPath === "attach_to_existing_anlassraum") {
    return {
      title: text.nextStepAttachTitle,
      detail: text.nextStepAttachDetail,
    };
  }

  if (decisionPath === "create_anlassraum_candidate" || !draft.anlassraumId) {
    return {
      title: text.nextStepCandidateTitle,
      detail: text.nextStepCandidateDetail,
    };
  }

  if (draft.status === "review" || draft.feedReviewState === "queued") {
    return {
      title: text.nextStepReviewTitle,
      detail: text.nextStepReviewDetail,
    };
  }

  return {
    title: text.nextStepVerifyTitle,
    detail: text.nextStepVerifyDetail,
  };
}

function formatDate(value: string | null | undefined, locale: OperatorLocale) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(locale === "en" ? "en-US" : "de-DE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function extractDomain(url?: string | null) {
  if (!url) return "—";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatRegionFilterLabel(value: RegionOption["value"], text: FeedDraftTexts): string {
  if (value === "all") return text.regionAll;
  if (value === "global") return text.regionGlobal;
  if (value === "EU") return text.regionEu;
  if (value === "DE") return text.regionGermany;
  if (value === "AT") return text.regionAustria;
  if (value === "CH") return text.regionSwitzerland;
  return value;
}

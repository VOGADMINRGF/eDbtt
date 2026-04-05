"use client";

import { useEffect, useState } from "react";
import type { CreatePrepareAttachDraftQueueItem } from "@/features/create/attachDraftReviewQueue";
import type { CreatePrepareAttachDraftHistoryEvent } from "@/features/create/attachDraftHistory";
import type {
  CreatePrepareAttachDraftReviewDecision,
  CreatePrepareAttachDraftReviewState,
} from "@/features/create/prepareAttachDraft";
import {
  CreateAttachDraftReviewList,
  applyCreateAttachDraftLocalDecision,
} from "@/features/create/reviewQueueUi";

type ReviewStateFilter = CreatePrepareAttachDraftReviewState | "all";

const FILTER_OPTIONS: Array<{ value: ReviewStateFilter; label: string }> = [
  { value: "all", label: "Alle" },
  { value: "pending", label: "Pending" },
  { value: "accepted_for_apply", label: "Accepted for apply" },
  { value: "rejected", label: "Rejected" },
  { value: "parked", label: "Parked" },
];

export default function AdminCreateAttachDraftsPage() {
  const [items, setItems] = useState<CreatePrepareAttachDraftQueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewStateFilter>("pending");
  const [query, setQuery] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [reviewNoteByDraft, setReviewNoteByDraft] = useState<Record<string, string>>({});
  const [applyNoteByDraft, setApplyNoteByDraft] = useState<Record<string, string>>({});
  const [decisionBusyDraftId, setDecisionBusyDraftId] = useState<string | null>(null);
  const [applyBusyDraftId, setApplyBusyDraftId] = useState<string | null>(null);
  const [historyLoadingDraftId, setHistoryLoadingDraftId] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [historyHasMoreByDraft, setHistoryHasMoreByDraft] = useState<Record<string, boolean>>({});
  const [historyCursorByDraft, setHistoryCursorByDraft] = useState<Record<string, string | null>>({});
  const [historyErrorByDraft, setHistoryErrorByDraft] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = String(params.get("q") || params.get("draftId") || "").trim();
    const initialReviewState = String(params.get("reviewState") || "").trim().toLowerCase();

    if (initialQuery) setQuery(initialQuery);
    if (isReviewStateFilter(initialReviewState)) {
      setFilter(initialReviewState);
    }
  }, []);

  useEffect(() => {
    let ignored = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (filter !== "all") qs.set("reviewState", filter);
        if (query.trim()) qs.set("q", query.trim());

        const res = await fetch(`/api/admin/create/attach-drafts?${qs.toString()}`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error || res.statusText);
        }
        if (ignored) return;
        const loaded = Array.isArray(body.items) ? (body.items as CreatePrepareAttachDraftQueueItem[]) : [];
        setItems(loaded);
        setHistoryHasMoreByDraft((prev) => {
          const next = { ...prev };
          for (const item of loaded) {
            next[item.draftId] = !!item.historyHasMore;
          }
          return next;
        });
        setHistoryCursorByDraft((prev) => {
          const next = { ...prev };
          for (const item of loaded) {
            next[item.draftId] = item.historyNextCursor ?? null;
          }
          return next;
        });
        setHistoryErrorByDraft((prev) => {
          const next = { ...prev };
          for (const item of loaded) {
            if (!(item.draftId in next)) next[item.draftId] = null;
          }
          return next;
        });
        setReviewNoteByDraft((prev) => {
          const next = { ...prev };
          for (const item of loaded) {
            if (!(item.draftId in next)) next[item.draftId] = item.reviewNote || "";
          }
          return next;
        });
        setApplyNoteByDraft((prev) => {
          const next = { ...prev };
          for (const item of loaded) {
            if (!(item.draftId in next)) next[item.draftId] = item.applyNote || "";
          }
          return next;
        });
      } catch (loadError: unknown) {
        if (ignored) return;
        setItems([]);
        setError(loadError instanceof Error ? loadError.message : "create_attach_review_queue_failed");
      } finally {
        if (!ignored) setLoading(false);
      }
    }

    void load();
    return () => {
      ignored = true;
    };
  }, [filter, query, reloadToken]);

  async function handleReviewDecision(
    draftId: string,
    decision: CreatePrepareAttachDraftReviewDecision,
  ) {
    setDecisionBusyDraftId(draftId);
    setDecisionError(null);
    setApplyError(null);
    try {
      const res = await fetch(`/api/admin/create/attach-drafts/${encodeURIComponent(draftId)}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          reviewNote: reviewNoteByDraft[draftId]?.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok || !body.item) {
        throw new Error(body?.error || res.statusText);
      }
      setItems((prev) =>
        applyCreateAttachDraftLocalDecision({
          items: prev,
          updated: body.item as CreatePrepareAttachDraftQueueItem,
        }),
      );
    } catch (decisionErr: unknown) {
      setDecisionError(decisionErr instanceof Error ? decisionErr.message : "attach_draft_review_failed");
    } finally {
      setDecisionBusyDraftId(null);
    }
  }

  async function handleApply(draftId: string) {
    setApplyBusyDraftId(draftId);
    setApplyError(null);
    setDecisionError(null);
    try {
      const res = await fetch(`/api/admin/create/attach-drafts/${encodeURIComponent(draftId)}/apply`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          applyNote: applyNoteByDraft[draftId]?.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok || !body.item) {
        throw new Error(body?.error || res.statusText);
      }
      setItems((prev) =>
        applyCreateAttachDraftLocalDecision({
          items: prev,
          updated: body.item as CreatePrepareAttachDraftQueueItem,
        }),
      );
    } catch (applyErr: unknown) {
      setApplyError(applyErr instanceof Error ? applyErr.message : "attach_draft_apply_failed");
    } finally {
      setApplyBusyDraftId(null);
    }
  }

  async function handleLoadMoreHistory(draftId: string) {
    if (historyLoadingDraftId) return;
    const cursor = historyCursorByDraft[draftId] ?? null;
    if (!cursor && !historyHasMoreByDraft[draftId]) return;
    setHistoryLoadingDraftId(draftId);
    setHistoryErrorByDraft((prev) => ({ ...prev, [draftId]: null }));
    try {
      const qs = new URLSearchParams();
      qs.set("type", "all");
      qs.set("limit", "20");
      if (cursor) qs.set("cursor", cursor);
      const res = await fetch(
        `/api/admin/create/attach-drafts/${encodeURIComponent(draftId)}/history?${qs.toString()}`,
        { cache: "no-store" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || res.statusText);
      }
      const events = Array.isArray(body.events) ? (body.events as CreatePrepareAttachDraftHistoryEvent[]) : [];
      const reviewEvents = events.filter(
        (event): event is Extract<CreatePrepareAttachDraftHistoryEvent, { eventType: "review" }> =>
          event?.eventType === "review",
      );
      const applyEvents = events.filter(
        (event): event is Extract<CreatePrepareAttachDraftHistoryEvent, { eventType: "apply" }> =>
          event?.eventType === "apply",
      );

      setItems((prev) =>
        prev.map((item) => {
          if (item.draftId !== draftId) return item;
          return {
            ...item,
            reviewEvents: mergeHistoryEvents(item.reviewEvents ?? [], reviewEvents),
            applyEvents: mergeHistoryEvents(item.applyEvents ?? [], applyEvents),
            historyHasMore: !!body.hasMore,
            historyNextCursor: body.nextCursor ?? null,
          };
        }),
      );
      setHistoryHasMoreByDraft((prev) => ({ ...prev, [draftId]: !!body.hasMore }));
      setHistoryCursorByDraft((prev) => ({ ...prev, [draftId]: body.nextCursor ?? null }));
    } catch (historyErr: unknown) {
      setHistoryErrorByDraft((prev) => ({
        ...prev,
        [draftId]: historyErr instanceof Error ? historyErr.message : "attach_draft_history_failed",
      }));
    } finally {
      setHistoryLoadingDraftId(null);
    }
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Create Prepare-Attach Review Queue</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Manuelle Review-Queue für prepare-attach Drafts. Apply bleibt explizit, additiv und guardrail-gesichert.
        </p>
      </header>

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Review-Filter
            <select
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={filter}
              onChange={(event) => setFilter(event.target.value as ReviewStateFilter)}
            >
              {FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Suche
            <input
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Summary / Target / Label"
            />
          </label>

          <button
            type="button"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            onClick={() => setReloadToken((prev) => prev + 1)}
          >
            Neu laden
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[rgb(var(--muted))]">Queue wird geladen ...</p>
      ) : error ? (
        <p className="rounded-md border border-rose-300/60 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      ) : (
        <CreateAttachDraftReviewList
          items={items}
          decisionBusyDraftId={decisionBusyDraftId}
          applyBusyDraftId={applyBusyDraftId}
          historyLoadingDraftId={historyLoadingDraftId}
          historyHasMoreByDraft={historyHasMoreByDraft}
          historyErrorByDraft={historyErrorByDraft}
          reviewNoteByDraft={reviewNoteByDraft}
          applyNoteByDraft={applyNoteByDraft}
          decisionError={decisionError}
          applyError={applyError}
          onReviewNoteChange={(draftId, value) =>
            setReviewNoteByDraft((prev) => ({ ...prev, [draftId]: value }))
          }
          onApplyNoteChange={(draftId, value) =>
            setApplyNoteByDraft((prev) => ({ ...prev, [draftId]: value }))
          }
          onReviewDecision={(draftId, decision) => void handleReviewDecision(draftId, decision)}
          onApply={(draftId) => void handleApply(draftId)}
          onLoadMoreHistory={(draftId) => void handleLoadMoreHistory(draftId)}
        />
      )}
    </section>
  );
}

function isReviewStateFilter(value: string): value is ReviewStateFilter {
  return FILTER_OPTIONS.some((option) => option.value === value);
}

function mergeHistoryEvents<T extends { eventId: string; createdAt: string }>(current: T[], next: T[]) {
  const map = new Map<string, T>();
  for (const event of [...current, ...next]) {
    map.set(event.eventId, event);
  }
  return Array.from(map.values()).sort((left, right) => {
    const byCreated = String(right.createdAt || "").localeCompare(String(left.createdAt || ""));
    if (byCreated !== 0) return byCreated;
    return String(right.eventId || "").localeCompare(String(left.eventId || ""));
  });
}

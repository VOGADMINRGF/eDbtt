"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";

type RelationshipState = "connected" | "incoming_pending" | "outgoing_pending" | "none";

type ThreadContext = {
  targetUserId: string;
  targetShareId?: string | null;
  targetProfileHref?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  tagline?: string | null;
  bio?: string | null;
  locationLabel?: string | null;
  topics?: string[];
  relationshipState: RelationshipState;
  canMessage: boolean;
  cannotMessageReason?: string | null;
  cannotMessageReasonLabel?: string | null;
  incomingRequestId?: string | null;
  outgoingRequestId?: string | null;
};

type ThreadMessage = {
  id: string;
  fromLabel: string;
  fromSelf: boolean;
  text: string;
  kind?: string | null;
  createdAt?: string | null;
};

type Props = {
  shareId: string;
};

function relationshipLabel(state: RelationshipState) {
  if (state === "connected") return "Verbunden";
  if (state === "incoming_pending") return "Eingehende Anfrage";
  if (state === "outgoing_pending") return "Anfrage gesendet";
  return "Keine Verbindung";
}

function formatDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function messageKindLabel(kind?: string | null) {
  const normalized = String(kind ?? "").toLowerCase();
  if (normalized === "founder_welcome") return "Founder";
  if (normalized === "referral_signup") return "Referral";
  if (normalized === "system_onboarding") return "Onboarding";
  return "Direkt";
}

export default function ProfileSocialActions({ shareId }: Props) {
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [context, setContext] = useState<ThreadContext | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const keepComposerInView = useCallback(() => {
    window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 60);
  }, []);

  const keepThreadEndInView = useCallback((behavior: ScrollBehavior = "smooth") => {
    window.setTimeout(() => {
      threadEndRef.current?.scrollIntoView({ behavior, block: "end" });
    }, 24);
  }, []);

  const loadContext = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAuthRequired(false);
    try {
      const params = new URLSearchParams({ shareId, limit: "10" });
      const res = await fetch(`/api/account/social-thread?${params.toString()}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAuthRequired(true);
        setContext(null);
        setThread([]);
        return;
      }
      if (!res.ok || !body?.ok || !body?.context) {
        throw new Error(body?.error || "social_context_failed");
      }
      setContext(body.context as ThreadContext);
      setThread(Array.isArray(body.thread) ? body.thread : []);
    } catch (err: any) {
      setError(err?.message || "Kontaktkontext nicht verfügbar.");
      setContext(null);
      setThread([]);
    } finally {
      setLoading(false);
    }
  }, [shareId]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const submitAction = useCallback(
    async (payload: { action: "request.accept" | "request.reject" | "match.request"; requestId?: string | null; targetUserId?: string | null }) => {
      setActionPending(true);
      setActionMsg(null);
      try {
        const res = await fetch("/api/account/social-actions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error || "social_action_failed");
        }
        setActionMsg(typeof body?.message === "string" ? body.message : "Aktion gespeichert.");
        await loadContext();
      } catch (err: any) {
        setActionMsg(err?.message || "Aktion fehlgeschlagen.");
      } finally {
        setActionPending(false);
      }
    },
    [loadContext],
  );

  const sendDirectMessage = useCallback(async () => {
    if (!context?.canMessage || !context.targetUserId) return;
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    setActionMsg(null);
    try {
      const res = await fetch("/api/account/social-thread", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetUserId: context.targetUserId, text }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.cannotMessageReasonLabel || body?.error || "message_send_failed");
      }
      setDraft("");
      setActionMsg(typeof body?.info === "string" ? body.info : "Nachricht gesendet.");
      await loadContext();
      keepThreadEndInView("smooth");
      window.setTimeout(() => {
        composerRef.current?.focus();
      }, 36);
    } catch (err: any) {
      setActionMsg(err?.message || "Nachricht konnte nicht gesendet werden.");
    } finally {
      setSending(false);
    }
  }, [context, draft, keepThreadEndInView, loadContext]);

  const handleComposerKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
      event.preventDefault();
      if (sending || draft.trim().length === 0) return;
      void sendDirectMessage();
    },
    [draft, sendDirectMessage, sending],
  );

  useEffect(() => {
    keepThreadEndInView("auto");
  }, [keepThreadEndInView, thread.length]);

  const relationshipState = context?.relationshipState ?? "none";
  const canMessage = Boolean(context?.canMessage);
  const cannotMessageLabel = context?.cannotMessageReasonLabel || "Direktnachricht aktuell nicht möglich.";

  const relationshipBadgeClass = useMemo(() => {
    if (relationshipState === "connected") {
      return "border-emerald-300/60 bg-emerald-100/90 text-emerald-900 dark:border-emerald-400/45 dark:bg-emerald-500/16 dark:text-emerald-100";
    }
    if (relationshipState === "incoming_pending") {
      return "border-sky-300/60 bg-sky-100/90 text-sky-900 dark:border-sky-400/45 dark:bg-sky-500/16 dark:text-sky-100";
    }
    if (relationshipState === "outgoing_pending") {
      return "border-indigo-300/60 bg-indigo-100/90 text-indigo-900 dark:border-indigo-400/45 dark:bg-indigo-500/16 dark:text-indigo-100";
    }
    return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
  }, [relationshipState]);

  return (
    <section className="rounded-3xl bg-[rgb(var(--card))] p-6 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-sm ring-1 ring-[rgb(var(--border))]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Kontakt & Direktnachricht (v1)</h2>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${relationshipBadgeClass}`}>
          {relationshipLabel(relationshipState)}
        </span>
      </div>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        DM-v1 ist bewusst klein: Verlauf lesen und kurze Nachricht senden, sobald eine bestätigte Verbindung besteht.
      </p>

      {authRequired ? (
        <div className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-3 text-sm text-[rgb(var(--muted))]">
          Melde dich an, um Verbindungen zu verwalten und Nachrichten zu senden.
          <Link href={`/login?next=${encodeURIComponent(`/profile/${shareId}`)}`} className="ml-2 font-semibold text-[rgb(var(--fg))] underline">
            Zum Login
          </Link>
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-2xl border border-rose-300/55 bg-rose-100/85 px-3 py-2 text-xs text-rose-900 dark:border-rose-500/35 dark:bg-rose-500/14 dark:text-rose-100">
          {error}
        </div>
      ) : null}

      {actionMsg ? (
        <p className="mt-2 text-xs text-[rgb(var(--muted))]" role="status" aria-live="polite">
          {actionMsg}
        </p>
      ) : null}

      {!authRequired && context ? (
        <div className="mt-3 space-y-3">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="flex items-start gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/85 via-cyan-500/80 to-emerald-500/80 text-xs font-semibold text-white ring-1 ring-sky-300/40">
                {context.avatarUrl ? (
                  <img src={context.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  context.displayName
                    .split(" ")
                    .map((part) => part.slice(0, 1))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[rgb(var(--fg))]">{context.displayName}</p>
                {context.tagline ? <p className="text-xs text-[rgb(var(--muted))]">{context.tagline}</p> : null}
                {context.locationLabel ? <p className="text-[11px] text-[rgb(var(--muted))]">{context.locationLabel}</p> : null}
              </div>
            </div>
            {Array.isArray(context.topics) && context.topics.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {context.topics.slice(0, 4).map((topic) => (
                  <span key={`${context.targetUserId}-${topic}`} className="inline-flex items-center rounded-full border border-sky-300/60 bg-sky-100 px-2 py-0.5 text-[10px] text-sky-800 dark:border-sky-400/40 dark:bg-sky-500/14 dark:text-sky-100">
                    {topic}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
            {canMessage ? "Du kannst dieser Person jetzt direkt schreiben." : cannotMessageLabel}
          </div>

          {relationshipState === "incoming_pending" && context.incomingRequestId ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={actionPending}
                onClick={() =>
                  void submitAction({
                    action: "request.accept",
                    requestId: context.incomingRequestId,
                    targetUserId: context.targetUserId,
                  })
                }
                className="inline-flex items-center justify-center rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-500/85 to-cyan-500/85 px-4 py-2 text-xs font-semibold text-white disabled:opacity-70"
              >
                {actionPending ? "Speichert …" : "Anfrage annehmen"}
              </button>
              <button
                type="button"
                disabled={actionPending}
                onClick={() =>
                  void submitAction({
                    action: "request.reject",
                    requestId: context.incomingRequestId,
                    targetUserId: context.targetUserId,
                  })
                }
                className="inline-flex items-center justify-center rounded-full border border-rose-300/65 bg-rose-500/12 px-4 py-2 text-xs font-semibold text-rose-800 dark:border-rose-400/40 dark:text-rose-100 disabled:opacity-70"
              >
                {actionPending ? "Speichert …" : "Ablehnen"}
              </button>
            </div>
          ) : null}

          {relationshipState === "none" ? (
            <button
              type="button"
              disabled={actionPending}
              onClick={() =>
                void submitAction({
                  action: "match.request",
                  targetUserId: context.targetUserId,
                })
              }
              className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-500/85 to-cyan-500/85 px-4 py-2 text-xs font-semibold text-white disabled:opacity-70"
            >
              {actionPending ? "Sendet …" : "Verbindung anfragen"}
            </button>
          ) : null}

          <Link
            href="/account#inbox"
            className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
          >
            Zur Inbox wechseln
          </Link>

          {canMessage ? (
            <div className="space-y-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Nachricht senden</p>
              <textarea
                ref={composerRef}
                rows={3}
                value={draft}
                onFocus={keepComposerInView}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Kurze Nachricht schreiben …"
                className="w-full resize-none rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              />
              <button
                type="button"
                disabled={sending || draft.trim().length === 0}
                onClick={() => void sendDirectMessage()}
                className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-500/85 to-cyan-500/85 px-4 py-2 text-xs font-semibold text-white disabled:opacity-70"
              >
                {sending ? "Sendet …" : "Nachricht senden"}
              </button>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Verlauf</p>
            {loading ? (
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Lade Nachrichten …</p>
            ) : thread.length > 0 ? (
              <div className="mt-2 space-y-2.5">
                {thread.map((entry) => (
                  <div key={entry.id} className={`flex ${entry.fromSelf ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[84%] rounded-2xl border px-3 py-2 text-xs ${
                        entry.fromSelf
                          ? "border-sky-300/65 bg-sky-100/85 text-sky-900 dark:border-sky-400/45 dark:bg-sky-500/16 dark:text-sky-100"
                          : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                      }`}
                    >
                      {!entry.fromSelf ? <p className="font-semibold">{entry.fromLabel}</p> : null}
                      {!entry.fromSelf && entry.kind && String(entry.kind).toLowerCase() !== "direct" ? (
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                          {messageKindLabel(entry.kind)}
                        </p>
                      ) : null}
                      <p className={`whitespace-pre-wrap ${entry.fromSelf ? "" : "mt-0.5"}`}>{entry.text}</p>
                      <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={threadEndRef} className="h-0.5 w-full" aria-hidden />
              </div>
            ) : (
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Noch keine Nachrichten in diesem Verlauf.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DraftDetailResponse = {
  ok: true;
  draft: any;
  candidate: any;
  analyzeResult: any;
};

export default function AdminDraftDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<DraftDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [attachAnlassraumId, setAttachAnlassraumId] = useState("");
  const [weakSignalReason, setWeakSignalReason] = useState("");

  useEffect(() => {
    let abort = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/feeds/drafts/${params.id}`, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const json = (await res.json()) as DraftDetailResponse;
        if (!abort) setData(json);
      } catch (err: any) {
        if (!abort) setError(err?.message ?? "Fehler beim Laden des Drafts");
      } finally {
        if (!abort) setLoading(false);
      }
    }
    load();
    return () => {
      abort = true;
    };
  }, [params.id]);

  async function mutateStatus(nextStatus: "draft" | "review" | "discarded") {
    if (!data) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/feeds/drafts/${params.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || res.statusText);
      }
      const response = await res.json();
      setData({
        ...data,
        draft: { ...data.draft, status: response.draft.status, reviewNote: response.draft.reviewNote },
      });
    } catch (err: any) {
      alert(err?.message ?? "Status konnte nicht geändert werden.");
    } finally {
      setActionLoading(false);
    }
  }

  async function runReviewAction(
    action: "ignore" | "attach_to_anlassraum" | "create_anlassraum_candidate" | "mark_as_weak_signal",
  ) {
    if (!data) return;
    setActionLoading(true);
    try {
      const payload: Record<string, unknown> = {
        action,
      };
      if (action === "attach_to_anlassraum") {
        if (!attachAnlassraumId.trim()) {
          throw new Error("Bitte Anlassraum-ID für Attach eintragen.");
        }
        payload.anlassraumId = attachAnlassraumId.trim();
      }
      if (action === "mark_as_weak_signal" && weakSignalReason.trim()) {
        payload.weakSignalReason = weakSignalReason.trim();
      }

      const res = await fetch(`/api/admin/feeds/drafts/${params.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || res.statusText);
      }

      const nextDraft = body?.draft ?? {};
      setData({
        ...data,
        draft: {
          ...data.draft,
          status: nextDraft.status ?? data.draft.status,
          anlassraumId: nextDraft.anlassraumId ?? data.draft.anlassraumId,
          reviewNote: nextDraft.reviewNote ?? data.draft.reviewNote,
          feedReviewState: nextDraft.feedReviewState ?? data.draft.feedReviewState,
          weakSignal: nextDraft.weakSignal ?? data.draft.weakSignal ?? null,
        },
      });
      if (nextDraft.anlassraumId) {
        setAttachAnlassraumId(nextDraft.anlassraumId);
      }
    } catch (err: any) {
      alert(err?.message ?? "Review-Aktion fehlgeschlagen.");
    } finally {
      setActionLoading(false);
    }
  }

  async function publishDraft() {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/feeds/drafts/${params.id}/publish`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || res.statusText);
      }
      await res.json();
      setData(
        (prev) =>
          prev && {
            ...prev,
            draft: { ...prev.draft, status: "published", publishedAt: new Date().toISOString() },
          },
      );
      alert("Draft veröffentlicht.");
      router.refresh();
    } catch (err: any) {
      alert(err?.message ?? "Publish fehlgeschlagen.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-[rgb(var(--muted))]">
        Lädt Draft <span className="font-mono">{params.id}</span> …
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-rose-600">
        {error ?? "Draft nicht gefunden."}
      </div>
    );
  }

  const { draft, candidate, analyzeResult } = data;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Draft Detail
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{draft.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--muted))]">
          <StatusBadge status={draft.status} />
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs">
            review: {draft.feedReviewState ?? "queued"}
          </span>
          <span className="text-[rgb(var(--muted))]">·</span>
          <span>{draft.regionName ?? "Global/Offen"}</span>
          {draft.anlassraumId && (
            <>
              <span className="text-[rgb(var(--muted))]">·</span>
              <a href={`/admin/feeds/anlassraum/${draft.anlassraumId}`} className="text-sky-600 hover:underline">
                Anlassraum
              </a>
            </>
          )}
          {draft.sourceUrl && (
            <>
              <span className="text-[rgb(var(--muted))]">·</span>
              <a href={draft.sourceUrl} target="_blank" className="text-sky-600 hover:underline" rel="noreferrer">
                Quelle öffnen
              </a>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <section className="flex-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Original – Feed</h2>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Locale {candidate.sourceLocale ?? "unbekannt"} · Region {candidate.regionCode ?? "Global"}
          </p>
          <div className="mt-4 space-y-3 text-sm text-[rgb(var(--muted))]">
            <div>
              <p className="font-semibold text-[rgb(var(--fg))]">Titel</p>
              <p>{candidate.sourceTitle ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold text-[rgb(var(--fg))]">Zusammenfassung</p>
              <p>{candidate.sourceSummary ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold text-[rgb(var(--fg))]">Inhalt</p>
              <p className="whitespace-pre-line">{candidate.sourceContent ?? "—"}</p>
            </div>
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Draft</h2>
          <p className="text-xs text-[rgb(var(--muted))]">
            Claims aus der Analyse (Top 3), Summary und Meta-Daten.
          </p>
          <div className="space-y-3 text-sm text-[rgb(var(--muted))]">
            <div>
              <p className="font-semibold text-[rgb(var(--fg))]">Summary</p>
              <p>{draft.summary ?? "—"}</p>
            </div>
            <div>
              <p className="font-semibold text-[rgb(var(--fg))]">Claims</p>
              <ul className="mt-2 space-y-2">
                {draft.claims?.map((claim: any) => (
                  <li key={claim.id} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2">
                    <p className="font-medium text-[rgb(var(--fg))]">{claim.title ?? claim.text}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{claim.text}</p>
                    <p className="text-[11px] text-[rgb(var(--muted))]">
                      Zuständigkeit: {claim.responsibility ?? "n/a"} · Topic {claim.topic ?? "—"}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-3">
            <button
              className="btn border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm"
              disabled={actionLoading}
              onClick={() => mutateStatus("review")}
            >
              Zur Review markieren
            </button>
            <button
              className="btn border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700"
              disabled={actionLoading}
              onClick={() => runReviewAction("ignore")}
            >
              Ignore
            </button>
            <button
              className="btn bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm"
              disabled={actionLoading || draft.status === "published"}
              onClick={publishDraft}
            >
              Veröffentlichen
            </button>
          </div>

          <div className="mt-4 grid gap-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Feed Review Queue</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                disabled={actionLoading}
                onClick={() => runReviewAction("create_anlassraum_candidate")}
              >
                Candidate Create
              </button>
              <button
                className="btn border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                disabled={actionLoading}
                onClick={() => runReviewAction("attach_to_anlassraum")}
              >
                Source Attach
              </button>
              <button
                className="btn border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
                disabled={actionLoading}
                onClick={() => runReviewAction("mark_as_weak_signal")}
              >
                Weak Signal
              </button>
            </div>
            <label className="text-xs text-[rgb(var(--muted))]">
              Anlassraum-ID für Attach
              <input
                value={attachAnlassraumId}
                onChange={(e) => setAttachAnlassraumId(e.target.value)}
                placeholder="652ab... (ObjectId)"
                className="mt-1 w-full rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs text-[rgb(var(--muted))]">
              Weak-Signal Begründung (optional)
              <input
                value={weakSignalReason}
                onChange={(e) => setWeakSignalReason(e.target.value)}
                placeholder="z. B. nur Einzelquelle ohne Gegenperspektive"
                className="mt-1 w-full rounded border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
              />
            </label>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm space-y-4">
        <header>
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Analyse – Claims & Notizen</h2>
          <p className="text-xs text-[rgb(var(--muted))]">
            Vollständiges Analyse-Resultat zur Nachvollziehbarkeit der automatischen Drafts.
          </p>
        </header>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-xs uppercase text-[rgb(var(--muted))]">Alle Claims</h3>
            <ul className="space-y-2 text-sm text-[rgb(var(--muted))]">
              {analyzeResult.claims.map((claim: any) => (
                <li key={claim.id} className="rounded border border-[rgb(var(--border))] p-2">
                  <p className="font-semibold text-[rgb(var(--fg))]">{claim.title ?? claim.text}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{claim.text}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4 text-sm text-[rgb(var(--muted))]">
            <div>
              <h3 className="text-xs uppercase text-[rgb(var(--muted))]">Notes</h3>
              <ul className="space-y-2">
                {analyzeResult.notes.map((note: any) => (
                  <li key={note.id} className="rounded border border-[rgb(var(--border))] p-2">
                    <p className="text-xs font-semibold uppercase text-[rgb(var(--muted))]">{note.kind}</p>
                    <p>{note.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase text-[rgb(var(--muted))]">Fragen</h3>
              <ul className="space-y-2">
                {analyzeResult.questions.map((question: any) => (
                  <li key={question.id} className="rounded border border-[rgb(var(--border))] p-2">
                    <p className="font-semibold text-[rgb(var(--fg))]">{question.dimension ?? "Frage"}</p>
                    <p>{question.text}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs uppercase text-[rgb(var(--muted))]">Knoten</h3>
              <ul className="space-y-2">
                {analyzeResult.knots.map((knot: any) => (
                  <li key={knot.id} className="rounded border border-[rgb(var(--border))] p-2">
                    <p className="font-semibold text-[rgb(var(--fg))]">{knot.label}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">{knot.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
    review: "bg-amber-100 text-amber-800",
    published: "bg-emerald-100 text-emerald-800",
    discarded: "bg-rose-100 text-rose-800",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status] ?? "bg-[rgb(var(--bg))]"}`}>
      {status}
    </span>
  );
}

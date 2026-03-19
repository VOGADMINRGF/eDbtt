"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AnlassraumDetailResponse = {
  ok: boolean;
  item?: Record<string, any>;
  sources?: any[];
  structure?: any;
  outputs?: any[];
  publishGate?: {
    ok: boolean;
    reasons: string[];
    sourceCount: number;
    requiredSourceCount?: number;
    evidence?: Record<string, unknown>;
  };
  error?: string;
};

const ACTIONS = [
  { id: "curate", label: "Curate" },
  { id: "review", label: "Review" },
  { id: "approve", label: "Approve" },
  { id: "activate", label: "Activate" },
  { id: "archive", label: "Archive" },
] as const;

export default function AdminAnlassraumDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnlassraumDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<string | null>(null);

  useEffect(() => {
    let ignored = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/feeds/anlassraum/${params.id}`, { cache: "no-store" });
        const body = (await res.json().catch(() => ({}))) as AnlassraumDetailResponse;
        if (!res.ok || !body?.ok) throw new Error(body?.error ?? res.statusText);
        if (!ignored) setData(body);
      } catch (err: any) {
        if (!ignored) {
          setData(null);
          setError(err?.message ?? "anlassraum_detail_load_failed");
        }
      } finally {
        if (!ignored) setLoading(false);
      }
    }
    load();
    return () => {
      ignored = true;
    };
  }, [params.id]);

  if (loading) {
    return <main className="p-6 text-sm text-[rgb(var(--muted))]">Lade Anlassraum …</main>;
  }

  if (error || !data?.item) {
    return <main className="p-6 text-sm text-rose-700">{error ?? "Nicht gefunden"}</main>;
  }

  const { item, sources = [], structure, outputs = [] } = data;
  const publishGate = data.publishGate ?? { ok: false, reasons: ["missing_gate"], sourceCount: 0 };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Admin · Anlassraum
        </p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{item.title}</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          {item.status} · {item.sourceMode} · score {item.relevanceScore}
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Publish gate: {publishGate.ok ? "ok" : "blocked"} · sources {publishGate.sourceCount}
          {typeof publishGate.requiredSourceCount === "number" ? ` / required ${publishGate.requiredSourceCount}` : ""}
        </p>
        {!publishGate.ok && publishGate.reasons.length > 0 && (
          <p className="text-xs text-rose-700">{publishGate.reasons.join(", ")}</p>
        )}
        {publishGate.evidence && (
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-2 text-[11px] text-[rgb(var(--muted))]">
            {JSON.stringify(publishGate.evidence, null, 2)}
          </pre>
        )}
        <p className="flex gap-3 text-sm">
          <Link href="/admin/feeds/anlassraum" className="text-sky-700 hover:underline">
            Zur Übersicht
          </Link>
          <Link href="/admin/feeds/drafts" className="text-sky-700 hover:underline">
            Zu Feed-Drafts
          </Link>
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={Boolean(transitioning)}
              onClick={() => runTransition(action.id)}
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--bg))] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {transitioning === action.id ? "..." : action.label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Meta</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Output Seeds</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(outputs, null, 2)}
          </pre>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Sources</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(sources, null, 2)}
          </pre>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Structure</h2>
          <pre className="mt-2 overflow-auto rounded bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
            {JSON.stringify(structure ?? {}, null, 2)}
          </pre>
        </div>
      </section>
    </main>
  );

  async function runTransition(action: (typeof ACTIONS)[number]["id"]) {
    setTransitioning(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/feeds/anlassraum/${params.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json().catch(() => ({} as any));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error ?? res.statusText);
      }
      setData((prev) => {
        if (!prev?.item) return prev;
        return {
          ...prev,
          item: {
            ...prev.item,
            ...body.item,
          },
          publishGate: body.publishGate ?? prev.publishGate,
        };
      });
    } catch (err: any) {
      setError(err?.message ?? "transition_failed");
    } finally {
      setTransitioning(null);
    }
  }
}

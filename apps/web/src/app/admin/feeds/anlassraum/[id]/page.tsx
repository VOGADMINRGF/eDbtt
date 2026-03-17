"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type AnlassraumDetailResponse = {
  ok: boolean;
  item?: any;
  sources?: any[];
  structure?: any;
  outputs?: any[];
  error?: string;
};

export default function AdminAnlassraumDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AnlassraumDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <p className="flex gap-3 text-sm">
          <Link href="/admin/feeds/anlassraum" className="text-sky-700 hover:underline">
            Zur Übersicht
          </Link>
          <Link href="/admin/feeds/drafts" className="text-sky-700 hover:underline">
            Zu Feed-Drafts
          </Link>
        </p>
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
}

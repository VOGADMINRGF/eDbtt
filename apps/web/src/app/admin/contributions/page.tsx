"use client";

import { useEffect, useState } from "react";
import LocalizedContentDisplay from "@/components/i18n/LocalizedContentDisplay";
import { useLocale } from "@/context/LocaleContext";
import {
  formatContentTranslationStatusLabel,
  resolveContentTranslationStatus,
  type LocalizedContentRecord,
} from "@/features/i18n/contentTranslations";

type Contribution = {
  id: string;
  type: string;
  status: "proposed" | "approved" | "rejected";
  topicId?: string | null;
  candidateId?: string | null;
  title?: string | null;
  body?: string | null;
  titleContent?: LocalizedContentRecord | null;
  bodyContent?: LocalizedContentRecord | null;
  url?: string | null;
  authorName?: string | null;
  createdAt?: string;
};

type ApiResponse = {
  ok: boolean;
  items?: Contribution[];
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminContributionsPage() {
  const { locale } = useLocale();
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/community/contributions?status=proposed", { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok || !body.ok) throw new Error(body?.error || res.statusText);
      setItems(body.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Contributions konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/community/contributions/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) throw new Error(body?.error || res.statusText);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      setError(err?.message ?? "Update fehlgeschlagen.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Contributions</p>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Beitraege Review</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Vorschlaege freigeben oder ablehnen.</p>
        </div>
        <button
          onClick={load}
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
          disabled={loading}
        >
          Aktualisieren
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700" aria-live="polite">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        {loading && <p className="text-sm text-[rgb(var(--muted))]">Lädt …</p>}
        {!loading && items.length === 0 && (
          <p className="text-sm text-[rgb(var(--muted))]">Keine offenen Beitraege.</p>
        )}
        <div className="space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="rounded-full bg-[rgb(var(--card))] px-2 py-1">{item.type}</span>
                {item.topicId && <span>Topic: {item.topicId}</span>}
                {item.candidateId && <span>Kandidat: {item.candidateId}</span>}
                <span>Status: {item.status}</span>
                <span>Erstellt: {formatDate(item.createdAt ?? null)}</span>
              </div>
              <LocalizedContentDisplay
                className="mt-2"
                preferredLocale={locale}
                content={item.titleContent ?? null}
                fallbackText={item.title ?? null}
                emptyFallback="Beitrag"
                textClassName="font-semibold text-[rgb(var(--fg))]"
                metaClassName="mt-0.5 text-[10px] text-[rgb(var(--muted))]"
                originalTextClassName="mt-0.5 text-[rgb(var(--fg))]"
                missingClassName="mt-0.5 text-[10px] text-[rgb(var(--muted))]"
              />
              <LocalizedContentDisplay
                className="mt-1"
                preferredLocale={locale}
                content={item.bodyContent ?? null}
                fallbackText={item.body ?? null}
                textClassName="text-[rgb(var(--muted))]"
                metaClassName="mt-0.5 text-[10px] text-[rgb(var(--muted))]"
                originalTextClassName="mt-0.5 text-[rgb(var(--muted))]"
                missingClassName="mt-0.5 text-[10px] text-[rgb(var(--muted))]"
              />
              {item.url && (
                <a className="mt-2 inline-block text-xs text-sky-600 underline" href={item.url} target="_blank" rel="noreferrer">
                  Quelle öffnen
                </a>
              )}
              <p className="mt-1 text-[10px] text-[rgb(var(--muted))]">
                {formatContentTranslationStatusLabel(
                  resolveContentTranslationStatus(item.bodyContent ?? item.titleContent ?? null),
                  locale,
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  className="rounded-full border border-emerald-200 px-3 py-1 text-emerald-700 disabled:opacity-60"
                  onClick={() => updateStatus(item.id, "approved")}
                  disabled={busyId === item.id}
                >
                  Freigeben
                </button>
                <button
                  className="rounded-full border border-rose-200 px-3 py-1 text-rose-700 disabled:opacity-60"
                  onClick={() => updateStatus(item.id, "rejected")}
                  disabled={busyId === item.id}
                >
                  Ablehnen
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

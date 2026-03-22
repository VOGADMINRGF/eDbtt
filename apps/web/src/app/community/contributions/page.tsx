"use client";

import { useEffect, useState } from "react";
import LocalizedContentDisplay from "@/components/i18n/LocalizedContentDisplay";
import { useLocale } from "@/context/LocaleContext";
import type { LocalizedContentRecord } from "@/features/i18n/contentTranslations";

type ContributionType = "source" | "option" | "question" | "impact" | "view";

type Contribution = {
  id: string;
  type: ContributionType;
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

const TYPE_OPTIONS: Array<{ value: ContributionType; label: string }> = [
  { value: "source", label: "Quelle" },
  { value: "option", label: "Option" },
  { value: "question", label: "Offene Frage" },
  { value: "impact", label: "Folge / Impact" },
  { value: "view", label: "Ansicht" },
];

export default function CommunityContributionsPage() {
  const { locale } = useLocale();
  const [type, setType] = useState<ContributionType>("source");
  const [topicId, setTopicId] = useState("");
  const [candidateId, setCandidateId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadList() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (topicId.trim()) params.set("topicId", topicId.trim());
      if (candidateId.trim()) params.set("candidateId", candidateId.trim());
      const res = await fetch(`/api/community/contributions?${params.toString()}`, { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as ApiResponse;
      if (!res.ok || !body.ok) throw new Error(body?.error || res.statusText);
      setItems(body.items ?? []);
    } catch (err: any) {
      setError(err?.message ?? "Beiträge konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload = {
        type,
        topicId: topicId.trim() || undefined,
        candidateId: candidateId.trim() || undefined,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        url: url.trim() || undefined,
        authorName: authorName.trim() || undefined,
      };
      const res = await fetch("/api/community/contributions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const bodyRes = await res.json().catch(() => ({}));
      if (!res.ok || !bodyRes.ok) {
        throw new Error(bodyRes?.error?.message || "Beitrag konnte nicht gespeichert werden.");
      }
      setFeedback("Danke! Dein Beitrag wurde eingereicht und wird moderiert.");
      setTitle("");
      setBody("");
      setUrl("");
      await loadList();
    } catch (err: any) {
      setFeedback(err?.message ?? "Beitrag konnte nicht gespeichert werden.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Community · Beiträge</p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Strukturierte Beiträge einreichen</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Quellen, Optionen, Fragen oder Folgen vorschlagen. Beiträge werden vor Freigabe moderiert.
        </p>
      </header>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-sm text-[rgb(var(--muted))]">
            Beitragstyp
            <select
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value as ContributionType)}
            >
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[rgb(var(--muted))]">
            Thema (topicId)
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              placeholder="optional, z.B. energie"
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))]">
            Kandidat (candidateId)
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
              value={candidateId}
              onChange={(e) => setCandidateId(e.target.value)}
              placeholder="optional, z.B. statement_candidate_id"
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))]">
            Titel / Kurzfassung
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Kurzbeschreibung"
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))] md:col-span-2">
            Inhalt
            <textarea
              className="mt-1 min-h-[120px] w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Beschreibe deine Quelle, Option oder Frage."
            />
          </label>
          {type === "source" && (
            <label className="text-sm text-[rgb(var(--muted))] md:col-span-2">
              Quelle (URL)
              <input
                className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
          )}
          <label className="text-sm text-[rgb(var(--muted))]">
            Name (optional)
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Dein Name oder Organisation"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Sendet …" : "Beitrag einreichen"}
            </button>
          </div>
        </form>
        {feedback && (
          <p className="mt-3 text-sm text-[rgb(var(--muted))]" aria-live="polite">
            {feedback}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Freigegebene Beiträge</h2>
          <button
            className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))]"
            onClick={loadList}
            disabled={loading}
          >
            Aktualisieren
          </button>
        </div>
        {loading && <p className="mt-3 text-sm text-[rgb(var(--muted))]">Lädt …</p>}
        {error && (
          <p className="mt-3 text-sm text-rose-600" aria-live="polite">
            {error}
          </p>
        )}
        {!loading && !error && items.length === 0 && (
          <p className="mt-3 text-sm text-[rgb(var(--muted))]">Noch keine freigegebenen Beiträge.</p>
        )}
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="rounded-full bg-[rgb(var(--card))] px-2 py-1">{item.type}</span>
                {item.topicId && <span>Topic: {item.topicId}</span>}
                {item.candidateId && <span>Kandidat: {item.candidateId}</span>}
                {item.authorName && <span>von {item.authorName}</span>}
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
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

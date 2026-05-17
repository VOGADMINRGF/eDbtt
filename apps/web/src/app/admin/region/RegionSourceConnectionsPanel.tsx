"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  REGION_SOURCE_CONNECTION_TYPES,
  regionSourceConnectionCategoryLabel,
  regionSourceConnectionTypeLabel,
  type RegionSourceConnection,
  type RegionSourceConnectionType,
  type RegionSourceTestResult,
} from "@features/region/sourceConnections";

type FormState = {
  sourceType: RegionSourceConnectionType;
  label: string;
  url: string;
  notes: string;
  sampleTitle: string;
  sampleSummary: string;
  sampleTopics: string;
};

const INITIAL_FORM: FormState = {
  sourceType: "manual_source",
  label: "",
  url: "",
  notes: "",
  sampleTitle: "",
  sampleSummary: "",
  sampleTopics: "",
};

function topicsFromInput(input: string) {
  return input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function RegionSourceConnectionsPanel(props: {
  regionId: string;
  connections: RegionSourceConnection[];
  results: RegionSourceTestResult[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const payload = {
      regionId: props.regionId,
      sourceType: form.sourceType,
      label: form.label,
      url: form.url.trim() || null,
      notes: form.notes.trim() || null,
      enabled: true,
      sampleItems:
        form.sampleTitle.trim() && form.sampleSummary.trim()
          ? [
              {
                title: form.sampleTitle.trim(),
                summary: form.sampleSummary.trim(),
                url: form.url.trim() || null,
                detectedTopics: topicsFromInput(form.sampleTopics),
              },
            ]
          : [],
    };

    const res = await fetch("/api/admin/region/source-connections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "Konfiguration konnte nicht gespeichert werden.");
      return;
    }

    setMessage("Quelle gespeichert.");
    setForm(INITIAL_FORM);
    startTransition(() => router.refresh());
  }

  async function runDryRun(connectionId: string) {
    setError(null);
    setMessage(null);
    const res = await fetch(`/api/admin/region/source-connections/${encodeURIComponent(connectionId)}/test`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      setError(body?.error ?? "Dry Run konnte nicht ausgeführt werden.");
      return;
    }
    setMessage("Dry Run gespeichert.");
    startTransition(() => router.refresh());
  }

  return (
    <section
      id="source-results"
      data-testid="admin-region-source-connections"
      className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"
    >
      <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Source Connection Registry
        </p>
        <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
          Quellen konfigurieren und testweise auswerten
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Keine allgemeine Live-Suche, kein unkontrolliertes Scraping. `official_feed` und
          `municipal_news` funktionieren nur mit expliziter URL. Produktive Quellen gelten erst
          als verbunden, wenn mindestens ein reviewpflichtiger Snapshot-Eintrag vorliegt.
        </p>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Quellentyp</span>
            <select
              value={form.sourceType}
              onChange={(event) =>
                setForm((current) => ({ ...current, sourceType: event.target.value as RegionSourceConnectionType }))
              }
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
            >
              {REGION_SOURCE_CONNECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {regionSourceConnectionTypeLabel(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Label</span>
            <input
              value={form.label}
              onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))}
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="z. B. Bezirksamt Reinickendorf News"
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Explizite URL</span>
            <input
              value={form.url}
              onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
              className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </label>
          <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
            <span>Notiz</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              className="min-h-[84px] rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
              placeholder="Warum diese Quelle relevant ist."
            />
          </label>
          <div className="grid gap-3 rounded-2xl border border-[rgb(var(--border))] p-3">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">Dry Run Testeintrag</p>
            <p className="text-xs text-[rgb(var(--muted))]">
              Dieser Eintrag bleibt reviewpflichtig und kann zugleich als expliziter Quellen-Snapshot
              für die regionale Startlage dienen.
            </p>
            <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
              <span>Titel</span>
              <input
                value={form.sampleTitle}
                onChange={(event) => setForm((current) => ({ ...current, sampleTitle: event.target.value }))}
                className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Optionale Beispielüberschrift"
              />
            </label>
            <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
              <span>Zusammenfassung</span>
              <textarea
                value={form.sampleSummary}
                onChange={(event) => setForm((current) => ({ ...current, sampleSummary: event.target.value }))}
                className="min-h-[84px] rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Optionale Beispielzusammenfassung"
              />
            </label>
            <label className="grid gap-1 text-sm text-[rgb(var(--fg))]">
              <span>Themen, komma-getrennt</span>
              <input
                value={form.sampleTopics}
                onChange={(event) => setForm((current) => ({ ...current, sampleTopics: event.target.value }))}
                className="rounded-2xl border border-[rgb(var(--border))] bg-transparent px-3 py-2 text-sm"
                placeholder="Schule, Verkehr"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              Quelle speichern
            </button>
            {message ? <span className="text-sm text-emerald-700">{message}</span> : null}
            {error ? <span className="text-sm text-rose-700">{error}</span> : null}
          </div>
        </form>
      </article>

      <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Quellen und Dry Runs
        </p>
        <div className="mt-4 space-y-3">
          {props.connections.length > 0 ? (
            props.connections.map((connection) => (
              <div key={connection.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{connection.label}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {regionSourceConnectionTypeLabel(connection.sourceType)} ·{" "}
                      {regionSourceConnectionCategoryLabel(connection.sourceType)} ·{" "}
                      {connection.enabled ? "aktiv" : "deaktiviert"}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => void runDryRun(connection.id)}
                    className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                  >
                    Dry Run testen
                  </button>
                </div>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {connection.url || "Keine externe URL hinterlegt."}
                </p>
                {connection.notes ? (
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">{connection.notes}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine Quellen konfiguriert.</p>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">Reviewpflichtige Source Results</p>
          {props.results.length > 0 ? (
            props.results.map((result) => (
              <div key={result.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{result.title}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                  {regionSourceConnectionTypeLabel(result.sourceType)} · {result.visibilityLabel} · Confidence{" "}
                  {result.confidence.toFixed(2)}
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{result.summary}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine Dry-Run-Ergebnisse vorhanden.</p>
          )}
        </div>
      </article>
    </section>
  );
}

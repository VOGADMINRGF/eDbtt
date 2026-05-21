"use client";

import { useEffect, useMemo, useState } from "react";

type DirectoryEntry = {
  _id: string;
  actorKey: string;
  level: string;
  locale: string;
  regionCode?: string;
  displayName: string;
  description?: string;
  contactUrl?: string;
  updatedAt?: string;
};

type ResponsibilityPath = {
  _id: string;
  statementId: string;
  locale: string;
  nodes: Array<{
    level: string;
    actorKey: string;
    displayName: string;
    relevance?: number;
  }>;
  updatedAt?: string;
};

const LEVEL_LABELS: Record<string, string> = {
  municipality: "Gemeinde",
  district: "Kreis",
  state: "Land",
  federal: "Bund",
  eu: "EU",
  ngo: "NGO",
  private: "Privat",
  unknown: "Unbekannt",
};

const levelOptions = Object.entries(LEVEL_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function ResponsibilityAdminPage() {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [paths, setPaths] = useState<ResponsibilityPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    actorKey: "",
    level: "municipality",
    locale: "de",
    displayName: "",
    description: "",
    contactUrl: "",
  });
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setLoadError(null);
    try {
      const [dirRes, pathRes] = await Promise.all([
        fetch("/api/admin/responsibility/directory"),
        fetch("/api/admin/responsibility/paths"),
      ]);
      const dirJson = await dirRes.json().catch(() => ({}));
      const pathJson = await pathRes.json().catch(() => ({}));

      if (!dirRes.ok || !dirJson?.ok) {
        throw new Error(
          typeof dirJson?.error === "string" && dirJson.error.length > 0
            ? dirJson.error
            : "Directory konnte nicht geladen werden.",
        );
      }

      if (!pathRes.ok || !pathJson?.ok) {
        throw new Error(
          typeof pathJson?.error === "string" && pathJson.error.length > 0
            ? pathJson.error
            : "Responsibility-Pfade konnten nicht geladen werden.",
        );
      }

      setEntries(dirJson.entries ?? []);
      setPaths(pathJson.paths ?? []);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Verantwortungsverzeichnis konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const groupedEntries = useMemo(() => {
    return entries.reduce<Record<string, DirectoryEntry[]>>((acc, entry) => {
      acc[entry.level] = acc[entry.level] ? [...acc[entry.level], entry] : [entry];
      return acc;
    }, {});
  }, [entries]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("Speichere …");
    try {
      const res = await fetch("/api/admin/responsibility/directory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          actorKey: form.actorKey,
          level: form.level,
          locale: form.locale,
          displayName: form.displayName || form.actorKey,
          description: form.description || undefined,
          contactUrl: form.contactUrl || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.ok) {
        throw new Error(body?.error ?? res.statusText);
      }
      setForm({
        actorKey: "",
        level: form.level,
        locale: form.locale,
        displayName: "",
        description: "",
        contactUrl: "",
      });
      setStatus("Gespeichert.");
      refresh();
    } catch (err: any) {
      setStatus(err?.message ?? "Fehler beim Speichern");
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Admin · Responsibility Navigator
        </p>
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Responsibility Directory</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Pflege die zentrale Directory-Liste und Responsibility-Pfade für Statements.
        </p>
        <p className="mt-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
          Betreiber-Modus aktiv: globale Zuständigkeiten und Pfade, keine organisationslokale Sicht.
        </p>
      </header>

      {loadError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {loadError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Eintrag hinzufügen / bearbeiten</h2>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="text-sm text-[rgb(var(--muted))]">
            Actor Key
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={form.actorKey}
              onChange={(e) => setForm((prev) => ({ ...prev, actorKey: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))]">
            Anzeigename
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={form.displayName}
              onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="z.B. Stadtrat Köln"
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))]">
            Level
            <select
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={form.level}
              onChange={(e) => setForm((prev) => ({ ...prev, level: e.target.value }))}
            >
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-[rgb(var(--muted))]">
            Locale
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={form.locale}
              onChange={(e) => setForm((prev) => ({ ...prev, locale: e.target.value }))}
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))] md:col-span-2">
            Beschreibung
            <textarea
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            />
          </label>
          <label className="text-sm text-[rgb(var(--muted))] md:col-span-2">
            Kontakt / URL
            <input
              className="mt-1 w-full rounded-lg border border-[rgb(var(--border))] px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              value={form.contactUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, contactUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              Speichern / Aktualisieren
            </button>
            <button
              type="button"
              onClick={refresh}
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm text-[rgb(var(--muted))]"
            >
              Neu laden
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm text-[rgb(var(--muted))] disabled:opacity-60"
              title="Import und Export sind in diesem Slice noch nicht freigegeben."
            >
              Import / Export noch nicht freigegeben
            </button>
            <span className="text-xs text-[rgb(var(--muted))]">
              CSV-/Batch-Import folgt erst mit eigenem Review- und Audit-Pfad.
            </span>
            {status && <span className="text-sm text-[rgb(var(--muted))]">{status}</span>}
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Directory-Einträge</h2>
        {loading ? (
          <p className="text-sm text-[rgb(var(--muted))]">Lade …</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Noch keine Einträge angelegt.</p>
        ) : (
          Object.entries(groupedEntries).map(([level, list]) => (
            <div key={level} className="mt-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--muted))]">
                {LEVEL_LABELS[level] ?? level} ({list.length})
              </h3>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {list.map((entry) => (
                  <article
                    key={entry._id}
                    className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm"
                  >
                    <div className="font-semibold text-[rgb(var(--fg))]">{entry.displayName}</div>
                    <div className="text-[12px] text-[rgb(var(--muted))]">{entry.actorKey}</div>
                    {entry.description && (
                      <p className="mt-1 text-[13px] text-[rgb(var(--muted))]">{entry.description}</p>
                    )}
                    {entry.contactUrl && (
                      <a
                        href={entry.contactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-xs text-sky-600 underline"
                      >
                        Ressource öffnen
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Responsibility Paths</h2>
        {paths.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Noch keine Pfade hinterlegt.</p>
        ) : (
          <div className="space-y-3">
            {paths.map((path) => (
              <article key={path._id} className="rounded-xl border border-[rgb(var(--border))] p-3">
                <div className="text-sm font-semibold text-[rgb(var(--fg))]">
                  Statement {path.statementId} ({path.locale})
                </div>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
                  {path.nodes.map((node, idx) => (
                    <li key={`${path._id}-${idx}`}>
                      <span className="font-semibold">
                        {node.displayName} ({LEVEL_LABELS[node.level] ?? node.level})
                      </span>
                      {typeof node.relevance === "number" && (
                        <span className="text-xs text-[rgb(var(--muted))]">
                          {" "}
                          · Relevanz {(node.relevance * 100).toFixed(0)}%
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

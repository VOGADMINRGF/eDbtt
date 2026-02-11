"use client";

import { useEffect, useState } from "react";

type PilotSettings = {
  check_level: number;
  daily_budget: number;
  per_topic_budget: number;
  auto_run_enabled: boolean;
  max_items_per_feed: number;
};

const DEFAULT_SETTINGS: PilotSettings = {
  check_level: 1,
  daily_budget: 10,
  per_topic_budget: 3,
  auto_run_enabled: false,
  max_items_per_feed: 12,
};

export default function AdminPilotPage() {
  const [settings, setSettings] = useState<PilotSettings>(DEFAULT_SETTINGS);
  const [meta, setMeta] = useState<{ updatedAt?: string | null; updatedBy?: string | null }>({});
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<any>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/pilot/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.ok) return;
        setSettings(data.settings ?? DEFAULT_SETTINGS);
        setMeta({
          updatedAt: data.meta?.updatedAt ?? null,
          updatedBy: data.meta?.updatedBy ?? null,
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pilot/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setSettings(data.settings ?? settings);
      setMeta({
        updatedAt: data.meta?.updatedAt ?? null,
        updatedBy: data.meta?.updatedBy ?? null,
      });
      setMessage("Pilot-Settings gespeichert.");
    } catch (err: any) {
      setMessage(err?.message ?? "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  async function runPilot() {
    setRunning(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/pilot/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      setLastRun(data);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setMessage(`Pilot gestartet: ${data.runId}`);
    } catch (err: any) {
      setMessage(err?.message ?? "Pilot-Run fehlgeschlagen.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Pilot Control</h1>
        <p className="text-sm text-slate-600">
          Minimaler Pilot-Backbone: Feeds → Kandidaten → Faktencheck → Graph/Dossier.
        </p>
        {meta.updatedAt ? (
          <p className="text-xs text-slate-500">
            Zuletzt aktualisiert: {new Date(meta.updatedAt).toLocaleString("de-DE")}
          </p>
        ) : null}
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Pilot-Settings</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Check-Level (0-2)
            <input
              type="number"
              min={0}
              max={2}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              value={settings.check_level}
              onChange={(e) =>
                setSettings({ ...settings, check_level: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Daily Budget (Units/EUR)
            <input
              type="number"
              min={0}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              value={settings.daily_budget}
              onChange={(e) =>
                setSettings({ ...settings, daily_budget: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Per-Topic Budget (Units/EUR)
            <input
              type="number"
              min={0}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              value={settings.per_topic_budget}
              onChange={(e) =>
                setSettings({ ...settings, per_topic_budget: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Max Items/Feed
            <input
              type="number"
              min={1}
              max={50}
              className="rounded border border-slate-300 px-3 py-2 text-sm"
              value={settings.max_items_per_feed}
              onChange={(e) =>
                setSettings({ ...settings, max_items_per_feed: Number(e.target.value) || 1 })
              }
            />
          </label>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={settings.auto_run_enabled}
            onChange={(e) => setSettings({ ...settings, auto_run_enabled: e.target.checked })}
          />
          Auto-Run aktiviert
        </label>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Speichern..." : "Settings speichern"}
          </button>
          <button
            type="button"
            onClick={runPilot}
            disabled={running}
            className="rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
          >
            {running ? "Pilot läuft..." : "Pilot jetzt starten"}
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
      </section>

      {lastRun ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <div className="font-semibold text-slate-800">Letzter Run</div>
          <pre className="mt-3 overflow-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(lastRun, null, 2)}
          </pre>
        </section>
      ) : null}
    </main>
  );
}

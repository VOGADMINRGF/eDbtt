"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

type PilotSettings = {
  checkLevel: 0 | 1 | 2;
  dailyBudget: number;
  perTopicBudget: number;
  autoRunEnabled: boolean;
  maxItemsPerFeed: number;
  updatedAt?: string | null;
  updatedByUserId?: string | null;
};

type ActionResult = { ok: boolean; data?: any; error?: string };

function toNumberOrZero(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function AdminPilotPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PilotSettings | null>(null);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);

  const updatedHint = useMemo(() => {
    if (!settings?.updatedAt) return null;
    const iso = settings.updatedAt;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("de-DE");
  }, [settings?.updatedAt]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/pilot/settings", { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/login?next=/admin/pilot");
          return;
        }
        if (res.status === 403) {
          const body = await res.json().catch(() => ({}));
          if (body?.error === "two_factor_setup_required") {
            router.replace("/auth/2fa-setup?next=/admin/pilot");
            return;
          }
          if (body?.error === "two_factor_required") {
            router.replace("/login?next=/admin/pilot");
            return;
          }
          throw new Error("forbidden");
        }
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean; settings?: PilotSettings };
        if (!res.ok || body?.ok === false || !body?.settings) throw new Error("load_failed");
        if (active) setSettings(body.settings);
      } catch (err: any) {
        if (active) setError(err?.message || "load_failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [router]);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        checkLevel: settings.checkLevel,
        dailyBudget: settings.dailyBudget,
        perTopicBudget: settings.perTopicBudget,
        autoRunEnabled: settings.autoRunEnabled,
        maxItemsPerFeed: settings.maxItemsPerFeed,
      };
      const res = await fetch("/api/admin/pilot/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; settings?: PilotSettings; error?: string };
      if (!res.ok || body?.ok === false || !body?.settings) {
        throw new Error(body?.error || "save_failed");
      }
      setSettings(body.settings);
    } catch (err: any) {
      setError(err?.message || "save_failed");
    } finally {
      setSaving(false);
    }
  }

  async function runFeedsPull() {
    setLastAction(null);
    setError(null);
    try {
      const res = await fetch("/api/feeds/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxItemsPerFeed: settings?.maxItemsPerFeed }),
      });
      const data = await res.json().catch(() => ({}));
      setLastAction({ ok: res.ok, data, error: res.ok ? undefined : data?.error || `HTTP ${res.status}` });
    } catch (err: any) {
      setLastAction({ ok: false, error: err?.message || "pull_failed" });
    }
  }

  async function runAnalyzePending() {
    setLastAction(null);
    setError(null);
    try {
      const res = await fetch("/api/feeds/analyze-pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 10 }),
      });
      const data = await res.json().catch(() => ({}));
      setLastAction({ ok: res.ok, data, error: res.ok ? undefined : data?.error || `HTTP ${res.status}` });
    } catch (err: any) {
      setLastAction({ ok: false, error: err?.message || "analyze_failed" });
    }
  }

  async function runPilot() {
    setLastAction(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/pilot/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analyzeLimit: 10 }),
      });
      const data = await res.json().catch(() => ({}));
      setLastAction({ ok: res.ok, data, error: res.ok ? undefined : data?.error || `HTTP ${res.status}` });
    } catch (err: any) {
      setLastAction({ ok: false, error: err?.message || "pilot_run_failed" });
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl bg-[rgb(var(--card))] p-5 shadow ring-1 ring-[rgb(var(--border))]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Pilot</p>
        <h1 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">Pilot Control Plane</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Settings fuer Feeds, Kandidaten und Faktencheck. Ziel: Kostenkontrolle und reproduzierbare Runs.
        </p>
      </header>

      {error && <AdminErrorPanel error={error} />}

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Settings</h2>
          <div className="text-xs text-[rgb(var(--muted))]">
            {updatedHint ? `Zuletzt aktualisiert: ${updatedHint}` : "Noch keine Aktualisierung protokolliert."}
          </div>
        </div>

        {loading && <p className="mt-3 text-sm text-[rgb(var(--muted))]">Lade Settings ...</p>}

        {!loading && settings && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor="checkLevel">
                Faktencheck-Level
              </label>
              <select
                id="checkLevel"
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                value={settings.checkLevel}
                onChange={(e) => setSettings({ ...settings, checkLevel: Number(e.target.value) as 0 | 1 | 2 })}
              >
                <option value={0}>0 - Regeln/Heuristiken (ohne SERP)</option>
                <option value={1}>1 - Günstige Analyse (ohne SERP)</option>
                <option value={2}>2 - Analyse + SERP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor="maxItemsPerFeed">
                Max Items pro Feed
              </label>
              <input
                id="maxItemsPerFeed"
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                inputMode="numeric"
                value={settings.maxItemsPerFeed}
                onChange={(e) => setSettings({ ...settings, maxItemsPerFeed: toNumberOrZero(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor="dailyBudget">
                Daily Budget (Units)
              </label>
              <input
                id="dailyBudget"
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                inputMode="numeric"
                value={settings.dailyBudget}
                onChange={(e) => setSettings({ ...settings, dailyBudget: toNumberOrZero(e.target.value) })}
              />
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">MVP: Budget wird gespeichert, Enforcement folgt.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor="perTopicBudget">
                Per-Topic Budget (Units)
              </label>
              <input
                id="perTopicBudget"
                className="mt-1 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm"
                inputMode="numeric"
                value={settings.perTopicBudget}
                onChange={(e) => setSettings({ ...settings, perTopicBudget: toNumberOrZero(e.target.value) })}
              />
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">MVP: Budget wird gespeichert, Enforcement folgt.</p>
            </div>

            <div className="md:col-span-2">
              <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <input
                  type="checkbox"
                  checked={settings.autoRunEnabled}
                  onChange={(e) => setSettings({ ...settings, autoRunEnabled: e.target.checked })}
                />
                Auto-Run aktiv (MVP: gespeichert, Job-Pipeline folgt)
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:col-span-2">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {saving ? "Speichere ..." : "Settings speichern"}
              </button>

              <Link href="/admin/feeds/drafts" className="text-sm font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
                Zu Drafts
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Quick Actions</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">Manuelle Runs fuer Feeds und Analyze-Pending (MVP).</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runPilot}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Run pilot
          </button>
          <button
            type="button"
            onClick={runFeedsPull}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:border-sky-200 hover:text-[rgb(var(--fg))]"
          >
            Feeds pull
          </button>
          <button
            type="button"
            onClick={runAnalyzePending}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:border-sky-200 hover:text-[rgb(var(--fg))]"
          >
            Analyze pending
          </button>
        </div>

        {lastAction && (
          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Letztes Ergebnis</p>
            <pre className="mt-2 max-h-60 overflow-auto text-xs text-[rgb(var(--fg))]">
              {JSON.stringify(lastAction.ok ? lastAction.data : { error: lastAction.error, data: lastAction.data }, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
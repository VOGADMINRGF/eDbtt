"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Campaign, CampaignKind, CampaignStatus } from "@core/campaigns";

type CampaignStats = {
  totalSessions: number;
  uniqueUsers: number;
  lastJoinedAt: string | null;
};

type CampaignRow = Campaign & { stats?: CampaignStats };

type FormState = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  status: CampaignStatus;
  kind: CampaignKind;
  startsAt: string;
  endsAt: string;
  goal: string;
  tags: string;
};

const STATUS_OPTIONS: { value: CampaignStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

const KIND_OPTIONS: { value: CampaignKind; label: string }[] = [
  { value: "community", label: "Community" },
  { value: "policy", label: "Policy" },
  { value: "event", label: "Event" },
  { value: "custom", label: "Custom" },
];

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.valueOf())) return "—";
  return dt.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function toDateInput(value?: string | Date | null) {
  if (!value) return "";
  const dt = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dt.valueOf())) return "";
  return dt.toISOString().slice(0, 10);
}

export default function CampaignsAdminPage() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CampaignStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    title: "",
    slug: "",
    description: "",
    status: "draft",
    kind: "custom",
    startsAt: "",
    endsAt: "",
    goal: "",
    tags: "",
  });

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns/list", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || res.statusText);
      setCampaigns(Array.isArray(body?.items) ? body.items : []);
    } catch (err: any) {
      setError(err?.message ?? "Konnte Kampagnen nicht laden.");
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return campaigns
      .filter((entry) => (filter === "all" ? true : entry.status === filter))
      .filter((entry) => {
        if (!term) return true;
        return (
          entry.title?.toLowerCase().includes(term) ||
          entry.slug?.toLowerCase().includes(term) ||
          entry.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          entry.description?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        const tsA = Date.parse(String(a.updatedAt ?? a.createdAt ?? "")) || 0;
        const tsB = Date.parse(String(b.updatedAt ?? b.createdAt ?? "")) || 0;
        return tsB - tsA;
      });
  }, [campaigns, filter, searchTerm]);

  const openForm = (campaign?: CampaignRow) => {
    setFormState({
      id: campaign?.id,
      title: campaign?.title ?? "",
      slug: campaign?.slug ?? "",
      description: campaign?.description ?? "",
      status: (campaign?.status ?? "draft") as CampaignStatus,
      kind: (campaign?.kind ?? "custom") as CampaignKind,
      startsAt: toDateInput(campaign?.startsAt ?? null),
      endsAt: toDateInput(campaign?.endsAt ?? null),
      goal: campaign?.goal ?? "",
      tags: campaign?.tags?.join(", ") ?? "",
    });
    setFormOpen(true);
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: formState.id,
          slug: formState.slug?.trim() || undefined,
          title: formState.title,
          description: formState.description,
          status: formState.status,
          kind: formState.kind,
          startsAt: formState.startsAt ? new Date(formState.startsAt).toISOString() : null,
          endsAt: formState.endsAt ? new Date(formState.endsAt).toISOString() : null,
          goal: formState.goal,
          tags: formState.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || res.statusText);
      setFormOpen(false);
      await loadCampaigns();
    } catch (err: any) {
      setError(err?.message ?? "Speichern fehlgeschlagen.");
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · Campaigns</p>
          <h1 className="text-2xl font-bold text-slate-900">Campaign Control</h1>
          <p className="text-sm text-slate-600">Kampagnen planen, Sessions zählen und Status pflegen.</p>
        </div>
        <button
          onClick={() => openForm()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Neue Kampagne
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm">
          {["all", ...STATUS_OPTIONS.map((entry) => entry.value)].map((value) => (
            <button
              key={value}
              onClick={() => setFilter(value as CampaignStatus | "all")}
              className={`rounded-full px-3 py-1 font-semibold transition ${
                filter === value ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {value === "all" ? "Alle" : STATUS_OPTIONS.find((entry) => entry.value === value)?.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(ev) => setSearchTerm(ev.target.value)}
          placeholder="Titel, Slug oder Tag suchen…"
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Kampagne</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">Zeitraum</th>
              <th className="px-4 py-3 text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Lädt Kampagnen …
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Keine Kampagnen gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{campaign.title}</div>
                    <div className="text-xs text-slate-500">
                      {campaign.slug} · {campaign.kind ?? "custom"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {campaign.status ?? "draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>{campaign.stats?.totalSessions ?? 0} Sessions</div>
                    <div>{campaign.stats?.uniqueUsers ?? 0} unique</div>
                    <div className="text-[11px] text-slate-500">
                      zuletzt {formatDate(campaign.stats?.lastJoinedAt)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">
                    <div>
                      {formatDate(campaign.startsAt ?? null)} – {formatDate(campaign.endsAt ?? null)}
                    </div>
                    <div className="text-[11px] text-slate-500">{campaign.goal ?? "Kein Ziel gesetzt"}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openForm(campaign)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300"
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Kampagne speichern</h2>
              <p className="text-sm text-slate-600">Status, Zeitraum und Ziel definieren.</p>
            </div>
            <button
              onClick={() => setFormOpen(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Schließen
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Titel
              <input
                required
                value={formState.title}
                onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Slug
              <input
                value={formState.slug}
                onChange={(e) => setFormState((prev) => ({ ...prev, slug: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
              Beschreibung
              <textarea
                value={formState.description}
                onChange={(e) => setFormState((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[110px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Status
              <select
                value={formState.status}
                onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value as CampaignStatus }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                {STATUS_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Typ
              <select
                value={formState.kind}
                onChange={(e) => setFormState((prev) => ({ ...prev, kind: e.target.value as CampaignKind }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              >
                {KIND_OPTIONS.map((entry) => (
                  <option key={entry.value} value={entry.value}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Startdatum
              <input
                type="date"
                value={formState.startsAt}
                onChange={(e) => setFormState((prev) => ({ ...prev, startsAt: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              Enddatum
              <input
                type="date"
                value={formState.endsAt}
                onChange={(e) => setFormState((prev) => ({ ...prev, endsAt: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
              Ziel
              <input
                value={formState.goal}
                onChange={(e) => setFormState((prev) => ({ ...prev, goal: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600 md:col-span-2">
              Tags (kommagetrennt)
              <input
                value={formState.tags}
                onChange={(e) => setFormState((prev) => ({ ...prev, tags: e.target.value }))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-slate-300"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
              >
                Speichern
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

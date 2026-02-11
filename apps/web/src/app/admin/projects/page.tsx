"use client";

import { useEffect, useState } from "react";

type AdminProject = {
  id: string;
  title: string;
  summary?: string | null;
  status: "draft" | "active" | "archived";
  minOptions: number;
  createdAt: string;
  updatedAt: string;
};

type ProposedOption = {
  optionId: string;
  label: string;
  projectId: string;
  projectTitle: string;
  topicId: string;
  topicTitle: string;
  createdAt: string;
};

function parseTopics(raw: string) {
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim()).filter(Boolean);
      if (!parts.length) return null;
      const [title, ...options] = parts;
      return { title, options };
    })
    .filter(Boolean) as Array<{ title: string; options: string[] }>;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [proposed, setProposed] = useState<ProposedOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "archived">("draft");
  const [topicsRaw, setTopicsRaw] = useState("");

  async function loadData() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/media-projects", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Load failed");
      setProjects(data.projects ?? []);
      setProposed(data.proposedOptions ?? []);
    } catch (err: any) {
      setMessage(err?.message ?? "Fehler beim Laden.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createProject(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    const parsedTopics = parseTopics(topicsRaw);
    const invalidTopics = parsedTopics.filter((topic) => topic.options.length < 5);
    if (parsedTopics.length < 5 || parsedTopics.length > 10) {
      setMessage("Bitte 5-10 Themen anlegen.");
      return;
    }
    if (invalidTopics.length) {
      setMessage("Jedes Thema benoetigt mindestens 5 Optionen.");
      return;
    }

    try {
      const res = await fetch("/api/admin/media-projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          status,
          topics: parsedTopics,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Projekt konnte nicht erstellt werden.");

      setTitle("");
      setSummary("");
      setTopicsRaw("");
      setStatus("draft");
      await loadData();
      setMessage("Projekt wurde angelegt.");
    } catch (err: any) {
      setMessage(err?.message ?? "Projekt konnte nicht erstellt werden.");
    }
  }

  async function updateOption(optionId: string, status: "approved" | "rejected") {
    setMessage(null);
    try {
      const res = await fetch("/api/admin/media-projects/options", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Update fehlgeschlagen.");
      await loadData();
    } catch (err: any) {
      setMessage(err?.message ?? "Update fehlgeschlagen.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Media Projects</h1>
        <p className="text-sm text-slate-600">
          Projekte mit Themen + Optionen fuer Medienpartner. Mindestens 5 Optionen pro Thema.
        </p>
      </header>

      {message ? (
        <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Projekt anlegen</h2>
        <form className="mt-4 grid gap-4" onSubmit={createProject}>
          <label className="text-sm text-slate-700">
            Titel
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="text-sm text-slate-700">
            Summary
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              rows={3}
            />
          </label>
          <label className="text-sm text-slate-700">
            Status
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "active" | "archived")}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Themen + Optionen (eine Zeile pro Thema)
            <textarea
              value={topicsRaw}
              onChange={(e) => setTopicsRaw(e.target.value)}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono"
              rows={6}
              placeholder="Thema | Option A | Option B | Option C | Option D | Option E"
              required
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Projekt erstellen
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Bestehende Projekte</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {loading && projects.length === 0 ? <div>Laedt...</div> : null}
          {projects.length === 0 && !loading ? <div>Keine Projekte.</div> : null}
          {projects.map((project) => (
            <div key={project.id} className="rounded border border-slate-100 px-3 py-2">
              <div className="font-semibold text-slate-800">{project.title}</div>
              <div className="text-xs text-slate-500">{project.status}</div>
              {project.summary ? <div className="text-xs text-slate-600">{project.summary}</div> : null}
              <a
                href={`/projects/${project.id}`}
                className="mt-2 inline-block text-xs font-semibold text-slate-700 underline"
              >
                Public View
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Vorgeschlagene Optionen</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {proposed.length === 0 ? <div>Keine offenen Vorschlaege.</div> : null}
          {proposed.map((option) => (
            <div
              key={option.optionId}
              className="flex flex-col gap-2 rounded border border-slate-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="font-semibold text-slate-800">{option.label}</div>
                <div className="text-xs text-slate-500">
                  {option.projectTitle} · {option.topicTitle}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateOption(option.optionId, "approved")}
                  className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => updateOption(option.optionId, "rejected")}
                  className="rounded border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

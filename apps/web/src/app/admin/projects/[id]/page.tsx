"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ProjectOption = {
  id: string;
  label: string;
  status: "approved" | "proposed";
  votes: number;
};

type ProjectTopic = {
  id: string;
  title: string;
  description: string | null;
  options: ProjectOption[];
  totalVotes: number;
};

type ProjectDetail = {
  id: string;
  title: string;
  description: string | null;
  regionCode: string | null;
  status: "planned" | "active" | "completed" | "archived";
  topics: ProjectTopic[];
};

export default function AdminProjectDetailPage() {
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setProject(body?.project ?? null);
    } catch (err: any) {
      setError(err?.message ?? "Projekt konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const approveOption = async (topicId: string, optionId: string) => {
    if (!projectId) return;
    setBusy(`${topicId}:${optionId}`);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/options`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId, optionId, status: "approved" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      await loadProject();
    } catch (err: any) {
      setError(err?.message ?? "Option konnte nicht freigegeben werden.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      {loading && <p className="text-sm text-slate-500">Projekt wird geladen...</p>}
      {!loading && !project && <p className="text-sm text-slate-500">Projekt nicht gefunden.</p>}

      {project && (
        <>
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · Projekt</p>
            <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
            {project.description && <p className="text-sm text-slate-600">{project.description}</p>}
          </header>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <section className="space-y-4">
            {project.topics.map((topic) => (
              <div key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{topic.title}</h2>
                    {topic.description && <p className="text-sm text-slate-500">{topic.description}</p>}
                  </div>
                  <span className="text-xs text-slate-500">{topic.totalVotes} Stimmen</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {topic.options.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-800">
                        <span>{opt.label}</span>
                        {opt.status === "proposed" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                            vorgeschlagen
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{opt.votes} Stimmen</span>
                        {opt.status === "proposed" && (
                          <button
                            type="button"
                            onClick={() => approveOption(topic.id, opt.id)}
                            disabled={busy === `${topic.id}:${opt.id}`}
                            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {busy === `${topic.id}:${opt.id}` ? "..." : "Freigeben"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

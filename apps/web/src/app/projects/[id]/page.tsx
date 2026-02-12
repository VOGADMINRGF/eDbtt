"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, string>>({});
  const [busyVote, setBusyVote] = useState<string | null>(null);
  const [busyProposal, setBusyProposal] = useState<string | null>(null);

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

  const statusLabel = useMemo(() => {
    if (!project) return "Unbekannt";
    const map: Record<ProjectDetail["status"], string> = {
      planned: "Geplant",
      active: "Aktiv",
      completed: "Abgeschlossen",
      archived: "Archiviert",
    };
    return map[project.status] ?? project.status;
  }, [project]);

  const handleVote = async (topicId: string, optionId: string) => {
    if (!projectId) return;
    setBusyVote(`${topicId}:${optionId}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId, optionId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setMessage(body?.alreadyVoted ? "Deine Stimme wurde bereits erfasst." : "Danke, Stimme erfasst.");
      await loadProject();
    } catch (err: any) {
      setError(err?.message ?? "Vote konnte nicht gespeichert werden.");
    } finally {
      setBusyVote(null);
    }
  };

  const handleProposal = async (topicId: string) => {
    const label = proposalDrafts[topicId]?.trim();
    if (!label || !projectId) return;
    setBusyProposal(topicId);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/options`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId, label }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setProposalDrafts((prev) => ({ ...prev, [topicId]: "" }));
      setMessage("Option vorgeschlagen. Freigabe durch das Projektteam folgt.");
      await loadProject();
    } catch (err: any) {
      setError(err?.message ?? "Vorschlag konnte nicht gespeichert werden.");
    } finally {
      setBusyProposal(null);
    }
  };

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      {loading && <p className="text-sm text-slate-500">Projekt wird geladen...</p>}
      {!loading && !project && <p className="text-sm text-slate-500">Projekt nicht gefunden.</p>}

      {project && (
        <>
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projekt</p>
            <h1 className="text-3xl font-bold text-slate-900">{project.title}</h1>
            {project.description && <p className="text-sm text-slate-600">{project.description}</p>}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">{statusLabel}</span>
              {project.regionCode && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                  Region: {project.regionCode}
                </span>
              )}
            </div>
          </header>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
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
                        {opt.status === "approved" && (
                          <button
                            type="button"
                            onClick={() => handleVote(topic.id, opt.id)}
                            disabled={busyVote === `${topic.id}:${opt.id}`}
                            className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {busyVote === `${topic.id}:${opt.id}` ? "..." : "Stimme abgeben"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-xs font-semibold text-slate-600">Option vorschlagen</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={proposalDrafts[topic.id] ?? ""}
                      onChange={(e) => setProposalDrafts((prev) => ({ ...prev, [topic.id]: e.target.value }))}
                      placeholder="Neue Option"
                      className="flex-1 rounded border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleProposal(topic.id)}
                      disabled={busyProposal === topic.id}
                      className="rounded-full border border-slate-900 px-3 py-2 text-xs font-semibold text-slate-900 disabled:opacity-60"
                    >
                      {busyProposal === topic.id ? "Senden..." : "Vorschlagen"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </main>
  );
}

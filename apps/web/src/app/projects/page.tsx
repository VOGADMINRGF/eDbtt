"use client";

import { useEffect, useState } from "react";

type ProjectSummary = {
  id: string;
  title: string;
  summary?: string | null;
  status: "draft" | "active" | "archived";
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/media-projects", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (!data?.ok) {
          setError(data?.error || "Laden fehlgeschlagen.");
          return;
        }
        setProjects(data.projects ?? []);
      })
      .catch(() => {
        if (active) setError("Laden fehlgeschlagen.");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Media-Ready Projekte</h1>
        <p className="text-sm text-slate-600">
          Waehlbare Themenpakete mit festen Optionen und Community-Vorschlaegen.
        </p>
      </header>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4">
        {projects.length === 0 && !error ? (
          <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Aktuell keine Projekte.
          </div>
        ) : null}
        {projects.map((project) => (
          <a
            key={project.id}
            href={`/projects/${project.id}`}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-slate-300"
          >
            <div className="text-lg font-semibold text-slate-900">{project.title}</div>
            {project.summary ? (
              <p className="mt-1 text-sm text-slate-600">{project.summary}</p>
            ) : null}
          </a>
        ))}
      </section>
    </main>
  );
}

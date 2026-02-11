"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Project = {
  id: string;
  title: string;
  summary?: string | null;
  status: "draft" | "active" | "archived";
};

type Option = {
  id: string;
  label: string;
  votes: number;
};

type Topic = {
  id: string;
  title: string;
  options: Option[];
};

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId =
    typeof params?.projectId === "string"
      ? params.projectId
      : Array.isArray(params?.projectId)
        ? params.projectId[0]
        : "";

  const [project, setProject] = useState<Project | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let active = true;
    setLoading(true);
    fetch(`/api/media-projects/${projectId}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ res, data })))
      .then(({ res, data }) => {
        if (!active) return;
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Laden fehlgeschlagen.");
        setProject(data.project ?? null);
        setTopics(data.topics ?? []);
      })
      .catch((err: any) => {
        if (!active) return;
        setMessage(err?.message ?? "Laden fehlgeschlagen.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  async function vote(optionId: string) {
    setMessage(null);
    try {
      const res = await fetch(`/api/media-projects/${projectId}/vote`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Vote fehlgeschlagen.");
      const updated = data.option as Option | undefined;
      if (updated) {
        setTopics((prev) =>
          prev.map((topic) => ({
            ...topic,
            options: topic.options.map((opt) =>
              opt.id === updated.id ? { ...opt, votes: updated.votes } : opt,
            ),
          })),
        );
      }
    } catch (err: any) {
      setMessage(err?.message ?? "Vote fehlgeschlagen.");
    }
  }

  async function proposeOption(topicId: string, label: string, reset: () => void) {
    setMessage(null);
    if (!label.trim()) return;
    try {
      const res = await fetch(`/api/media-projects/${projectId}/topics/${topicId}/options`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Vorschlag fehlgeschlagen.");
      setMessage("Vorschlag eingereicht (wartet auf Freigabe).");
      reset();
    } catch (err: any) {
      setMessage(err?.message ?? "Vorschlag fehlgeschlagen.");
    }
  }

  if (!projectId) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-10 text-sm text-slate-600">
        Projekt-ID fehlt.
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10">
      {loading ? <div className="text-sm text-slate-600">Laedt...</div> : null}
      {message ? (
        <div className="rounded border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      ) : null}

      {project ? (
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">{project.title}</h1>
          {project.summary ? <p className="text-sm text-slate-600">{project.summary}</p> : null}
        </header>
      ) : null}

      <section className="space-y-6">
        {topics.map((topic) => (
          <div key={topic.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{topic.title}</h2>
            <div className="mt-4 grid gap-2">
              {topic.options.map((option) => (
                <div
                  key={option.id}
                  className="flex flex-col gap-2 rounded border border-slate-100 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-medium text-slate-800">{option.label}</div>
                    <div className="text-xs text-slate-500">{option.votes} Stimmen</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => vote(option.id)}
                    className="rounded bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Abstimmen
                  </button>
                </div>
              ))}
            </div>

            <ProposeOptionForm
              onSubmit={(label, reset) => proposeOption(topic.id, label, reset)}
            />
          </div>
        ))}
      </section>
    </main>
  );
}

function ProposeOptionForm({
  onSubmit,
}: {
  onSubmit: (label: string, reset: () => void) => void;
}) {
  const [label, setLabel] = useState("");

  return (
    <form
      className="mt-4 flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(label, () => setLabel(""));
      }}
    >
      <label className="text-xs font-semibold text-slate-600">
        Option vorschlagen (wird moderiert)
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Neue Option"
        />
        <button
          type="submit"
          className="rounded border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Vorschlagen
        </button>
      </div>
    </form>
  );
}

// features/event/components/ProjectForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import type { Project, ProjectOption, ProjectStatus, ProjectTopic } from "../types/ProjectType";
import { safeRandomId } from "@core/utils/random";

const MIN_TOPICS = 5;
const MAX_TOPICS = 10;
const MIN_OPTIONS = 5;

function createOption(label = ""): ProjectOption {
  return {
    id: safeRandomId(),
    label,
    status: "approved",
    createdAt: new Date().toISOString(),
  };
}

function createTopic(): ProjectTopic {
  return {
    id: safeRandomId(),
    title: "",
    description: "",
    options: Array.from({ length: MIN_OPTIONS }, () => createOption()),
  };
}

type ProjectFormProps = { creatorId: string };

export default function ProjectForm({ creatorId }: ProjectFormProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [status, setStatus] = React.useState<ProjectStatus>("planned");
  const [topics, setTopics] = React.useState<ProjectTopic[]>(() =>
    Array.from({ length: MIN_TOPICS }, () => createTopic()),
  );

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [createdId, setCreatedId] = React.useState<string | null>(null);

  const nameId = React.useId();
  const descriptionId = React.useId();
  const startId = React.useId();
  const endId = React.useId();
  const regionId = React.useId();
  const statusId = React.useId();

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setRegion("");
    setStatus("planned");
    setTopics(Array.from({ length: MIN_TOPICS }, () => createTopic()));
  };

  const updateTopic = (topicId: string, patch: Partial<ProjectTopic>) => {
    setTopics((prev) => prev.map((topic) => (topic.id === topicId ? { ...topic, ...patch } : topic)));
  };

  const updateOption = (topicId: string, optionId: string, label: string) => {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              options: topic.options.map((opt) => (opt.id === optionId ? { ...opt, label } : opt)),
            },
      ),
    );
  };

  const addTopic = () => {
    setTopics((prev) => (prev.length >= MAX_TOPICS ? prev : [...prev, createTopic()]));
  };

  const removeTopic = (topicId: string) => {
    setTopics((prev) => (prev.length <= MIN_TOPICS ? prev : prev.filter((topic) => topic.id !== topicId)));
  };

  const addOption = (topicId: string) => {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId ? topic : { ...topic, options: [...topic.options, createOption()] },
      ),
    );
  };

  const removeOption = (topicId: string, optionId: string) => {
    setTopics((prev) =>
      prev.map((topic) => {
        if (topic.id !== topicId) return topic;
        if (topic.options.length <= MIN_OPTIONS) return topic;
        return {
          ...topic,
          options: topic.options.filter((opt) => opt.id !== optionId),
        };
      }),
    );
  };

  const normalizeTopics = () => {
    const normalized = topics.map((topic) => ({
      ...topic,
      title: topic.title.trim(),
      description: topic.description?.trim() || "",
      options: topic.options
        .map((opt) => ({ ...opt, label: opt.label.trim() }))
        .filter((opt) => opt.label.length > 0),
    }));

    if (normalized.length < MIN_TOPICS || normalized.length > MAX_TOPICS) {
      return { error: `Bitte lege ${MIN_TOPICS} bis ${MAX_TOPICS} Themen an.` } as const;
    }

    for (const topic of normalized) {
      if (!topic.title) return { error: "Jedes Thema braucht einen Titel." } as const;
      if (topic.options.length < MIN_OPTIONS) {
        return { error: `Jedes Thema braucht mindestens ${MIN_OPTIONS} Optionen.` } as const;
      }
    }

    return { topics: normalized } as const;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setCreatedId(null);
    setSaving(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setSaving(false);
      setError("Bitte gib einen Projektnamen an.");
      return;
    }

    const normalized = normalizeTopics();
    if ("error" in normalized) {
      setSaving(false);
      setError(normalized.error);
      return;
    }

    const newProject: Project = {
      id: safeRandomId(), // Server kann die ID ignorieren und selbst setzen, wenn gewuenscht
      name: trimmedName,
      description: description.trim(),
      startDate,
      endDate: endDate || undefined,
      region: region || undefined,
      organizerIds: [creatorId],
      status,
      topics: normalized.topics,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProject),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Projekt konnte nicht gespeichert werden.");
      }

      const projectId = data?.project?.id ?? null;
      setCreatedId(projectId);
      setSuccess("Projekt wurde gespeichert.");
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Unbekannter Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-3xl space-y-8 px-4 py-8"
      aria-label="Projekt oder Event anlegen"
    >
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-coral">Projekt/Event erstellen</h2>
        <p className="text-sm text-[rgb(var(--muted))]">
          Lege 5 bis 10 Themen an. Pro Thema werden mindestens 5 feste Optionen benötigt.
        </p>
      </header>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
          {createdId ? (
            <span className="ml-2">
              <Link href={`/projects/${createdId}`} className="font-semibold underline">
                Projekt öffnen
              </Link>
            </span>
          ) : null}
        </div>
      )}

      <section className="grid gap-4">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor={nameId}>
            Projektname
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            id={nameId}
            className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor={descriptionId}>
            Beschreibung
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            id={descriptionId}
            className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
            rows={4}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor={startId}>
              Startdatum
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              id={startId}
              className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor={endId}>
              Enddatum (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              id={endId}
              className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor={regionId}>
            Region (optional)
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            id={regionId}
            className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[rgb(var(--muted))]" htmlFor={statusId}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            id={statusId}
            className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
          >
            <option value="planned">Geplant</option>
            <option value="active">Aktiv</option>
            <option value="completed">Abgeschlossen</option>
            <option value="archived">Archiviert</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Themenpaket</h3>
            <p className="text-xs text-[rgb(var(--muted))]">{topics.length} von {MIN_TOPICS} bis {MAX_TOPICS} Themen</p>
          </div>
          <button
            type="button"
            onClick={addTopic}
            disabled={topics.length >= MAX_TOPICS}
            className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--border))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Thema hinzufuegen
          </button>
        </div>

        {topics.map((topic, index) => (
          <div key={topic.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[rgb(var(--fg))]">Thema {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeTopic(topic.id)}
                disabled={topics.length <= MIN_TOPICS}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Entfernen
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">Titel</label>
                <input
                  type="text"
                  value={topic.title}
                  onChange={(e) => updateTopic(topic.id, { title: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-[rgb(var(--muted))]">Beschreibung (optional)</label>
                <textarea
                  value={topic.description ?? ""}
                  onChange={(e) => updateTopic(topic.id, { description: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm text-[rgb(var(--fg))]"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[rgb(var(--muted))]">Optionen</span>
                  <button
                    type="button"
                    onClick={() => addOption(topic.id)}
                    className="text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                  >
                    Option hinzufuegen
                  </button>
                </div>

                {topic.options.map((opt, optIndex) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <span className="text-xs text-[rgb(var(--muted))]">{optIndex + 1}</span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => updateOption(topic.id, opt.id, e.target.value)}
                      className="flex-1 rounded border px-3 py-2 text-sm text-[rgb(var(--fg))]"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(topic.id, opt.id)}
                      disabled={topic.options.length <= MIN_OPTIONS}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-[rgb(var(--muted))]">Mindestens {MIN_OPTIONS} Optionen pro Thema.</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <p className="text-xs text-[rgb(var(--muted))]">
        Organisator:innen werden später automatisch aus dem Account-Kontext übernommen.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-coral px-6 py-3 font-semibold text-white shadow hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-coral/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Speichere..." : "Projekt speichern"}
      </button>
    </form>
  );
}

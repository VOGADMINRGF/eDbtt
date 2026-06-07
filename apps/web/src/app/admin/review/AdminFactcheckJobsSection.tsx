"use client";

import Link from "next/link";
import type { FactcheckJobDoc } from "@features/factcheck/db";
import { factcheckStatusLabel } from "@features/factcheck/workflow";
import FactcheckJobActions from "./FactcheckJobActions";

type Props = {
  factcheckJobs: FactcheckJobDoc[];
};

export default function AdminFactcheckJobsSection({ factcheckJobs }: Props) {
  return (
    <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Factcheck-Jobs
          </p>
          <p className="mt-1 max-w-3xl text-sm text-[rgb(var(--muted))]">
            Kontrollierte Quellenprüfungs- und Faktencheck-Läufe. Kein Auto-Publish, kein
            Graph-Merge, kein Dossier- oder Anlassraum-Start.
          </p>
        </div>
        <div className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
          Noch nicht veröffentlicht
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {factcheckJobs.length === 0 ? (
          <p className="text-sm text-[rgb(var(--muted))]">Keine Factcheck-Jobs im aktuellen Zustand.</p>
        ) : (
          factcheckJobs.map((job) => (
            <article
              key={job.jobId}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
            >
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                  {factcheckStatusLabel(job.status)}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                  {job.requestedAction ?? "factcheck"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                  {job.truthStatus ?? "factcheck_requested"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                  {job.sourceSupport ?? "open"}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">{job.inputText}</p>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {job.sourceStatus ?? "Quellenprüfung angefragt"} · Status{" "}
                {job.verificationLabel ?? "analysiert"} ·{" "}
                {job.result?.summary ?? "Review-first Arbeitsstand"}
              </p>
              {job.providerMatrix ? (
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  ProviderMatrix: {job.providerMatrix.requestedAction} · Providers{" "}
                  {job.providerMatrix.usedProviders.join(" · ") || "keine"}
                </p>
              ) : null}
              {job.result?.openQuestions?.length ? (
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Offene Fragen: {job.result.openQuestions.join(" · ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Link
                  href={`/factcheck/${encodeURIComponent(job.jobId)}`}
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]"
                >
                  Ergebnis ansehen
                </Link>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-[rgb(var(--muted))]">
                  Gate {job.gate?.userConfirmed ? "bestätigt" : "offen"}
                </span>
              </div>
              <FactcheckJobActions jobId={job.jobId} status={job.status} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}

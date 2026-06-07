"use client";

import type { FactcheckJobDoc } from "@features/factcheck/db";
import { factcheckStatusLabel } from "@features/factcheck/workflow";

type Props = {
  jobs: FactcheckJobDoc[];
};

function statusLabel(job: FactcheckJobDoc) {
  switch (job.status) {
    case "queued":
      return "Quellenprüfung angefragt";
    case "running":
      return "Quellenprüfung läuft";
    case "completed":
      return "Ergebnis liegt vor";
    case "needs_manual_review":
      return "Manuelle Prüfung erforderlich";
    case "failed":
      return factcheckStatusLabel(job.status);
    case "cancelled":
      return "Abgebrochen";
    case "sealed":
      return "Siegel erteilt";
    default:
      return factcheckStatusLabel(job.status);
  }
}

export default function AccountFactcheckJobSection({ jobs }: Props) {
  if (jobs.length === 0) return null;

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">
          Quellenprüfung & Faktencheck
        </h2>
        <p className="text-xs text-[rgb(var(--muted))]">
          Diese Jobs bleiben Arbeitsstände. Nichts davon ist automatisch veröffentlicht,
          zusammengeführt oder als Graph-Wahrheit übernommen.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {jobs.map((job) => (
          <article
            key={job.jobId}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
          >
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {statusLabel(job)}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                {job.requestedAction ?? "factcheck"}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
                Noch nicht veröffentlicht
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-[rgb(var(--fg))]">{job.inputText}</p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              {job.sourceStatus ?? "Quellenprüfung angefragt"} · {job.truthStatus ?? "factcheck_requested"} ·{" "}
              {job.sourceSupport ?? "open"} · {job.verificationLabel ?? "analysiert"}
            </p>
            {job.result?.summary ? (
              <p className="mt-2 text-sm text-[rgb(var(--fg))]">{job.result.summary}</p>
            ) : null}
            {job.result?.openQuestions?.length ? (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                Offene Fragen: {job.result.openQuestions.join(" · ")}
              </p>
            ) : null}
            {job.result?.limitations?.length ? (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                Guardrails: {job.result.limitations.join(" · ")}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

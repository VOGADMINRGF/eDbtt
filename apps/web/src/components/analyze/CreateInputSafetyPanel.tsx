"use client";

import type { CreateInputSafetyResult } from "@/features/create/safety/createInputSafety";

type CreateInputSafetyPanelProps = {
  safety: CreateInputSafetyResult;
};

function resolveDecisionLabel(decision: CreateInputSafetyResult["decision"]): string {
  if (decision === "allow") return "Freigabe";
  if (decision === "revise_required") return "Überarbeitung nötig";
  if (decision === "factcheck_required") return "Faktencheck nötig";
  if (decision === "graph_review_required") return "Graph-Review nötig";
  if (decision === "moderation_required") return "Moderation nötig";
  return "Blockiert";
}

export default function CreateInputSafetyPanel({ safety }: CreateInputSafetyPanelProps) {
  const omitted = safety.findings.filter((finding) =>
    finding.kind === "email" ||
    finding.kind === "phone" ||
    finding.kind === "street_address" ||
    finding.kind === "postal_code" ||
    finding.kind === "doxxing" ||
    finding.kind === "insult" ||
    finding.kind === "threat" ||
    finding.kind === "self_justice",
  );

  return (
    <section className="rounded-2xl border border-amber-300/50 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800 dark:text-amber-200">
        Safety & Qualität
      </p>
      <p className="mt-1 font-semibold">
        Wir löschen dein Anliegen nicht. Wir trennen es: Anliegen, private Daten, Beleidigungen, Drohungen und prüfpflichtige Behauptungen.
      </p>
      <p className="mt-1 text-xs">
        Status: {resolveDecisionLabel(safety.decision)} · noAutoPublish=true · noSilentMerge=true
      </p>

      <div className="mt-3 space-y-2">
        <div className="rounded-lg border border-amber-300/55 bg-white/80 px-3 py-2 dark:border-amber-300/35 dark:bg-[rgb(var(--card))]">
          <p className="text-xs font-semibold uppercase tracking-wide">So haben wir es verstanden</p>
          <p className="mt-1 text-sm">{safety.safeRewrite}</p>
        </div>

        {omitted.length > 0 ? (
          <div className="rounded-lg border border-amber-300/55 bg-white/80 px-3 py-2 dark:border-amber-300/35 dark:bg-[rgb(var(--card))]">
            <p className="text-xs font-semibold uppercase tracking-wide">Nicht übernommen</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {omitted.slice(0, 6).map((finding) => (
                <li key={finding.id}>{finding.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {safety.factCheckCandidates.length > 0 ? (
          <div className="rounded-lg border border-amber-300/55 bg-white/80 px-3 py-2 dark:border-amber-300/35 dark:bg-[rgb(var(--card))]">
            <p className="text-xs font-semibold uppercase tracking-wide">Prüfpflichtige Behauptungen</p>
            <ul className="mt-1 list-disc pl-4 text-sm">
              {safety.factCheckCandidates.slice(0, 5).map((candidate, idx) => (
                <li key={`${candidate}-${idx}`}>{candidate}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-lg border border-amber-300/55 bg-white/80 px-3 py-2 dark:border-amber-300/35 dark:bg-[rgb(var(--card))]">
          <p className="text-xs font-semibold uppercase tracking-wide">Nächste Schritte</p>
          <ul className="mt-1 list-disc pl-4 text-sm">
            {safety.nextActions.slice(0, 4).map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

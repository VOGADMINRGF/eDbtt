import type { TruthGuardrails } from "@features/dossier";

const FRAMING_LABELS: Record<TruthGuardrails["framingStatus"], string> = {
  initial: "Erstframing",
  contested: "Umstritten",
  relativized: "Relativiert",
};

const FRAMING_TONE: Record<TruthGuardrails["framingStatus"], string> = {
  initial: "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]",
  contested: "border-amber-500/45 bg-amber-500/12 text-[rgb(var(--fg))]",
  relativized: "border-rose-500/45 bg-rose-500/12 text-[rgb(var(--fg))]",
};

const INTERVENTION_LABELS: Record<TruthGuardrails["factcheckIntervention"]["status"], string> = {
  none: "Keine",
  queued: "Vorgemerkt",
  in_review: "In Prüfung",
  intervened: "Intervention aktiv",
  resolved: "Abgeschlossen",
};

export function TruthGuardrailsPanel({ guardrails }: { guardrails: TruthGuardrails }) {
  const divergence = guardrails.sourceDivergence;
  const interventionActive =
    guardrails.framingStatus !== "initial" || guardrails.factcheckIntervention.status !== "none";

  return (
    <section className="vog-card p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Truth Guardrails
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${FRAMING_TONE[guardrails.framingStatus]}`}
        >
          {FRAMING_LABELS[guardrails.framingStatus]}
        </span>
      </div>
      <p className="text-[11px] text-[rgb(var(--muted))]">
        {guardrails.summary ??
          "Journalistische Einstiege bleiben Anlass. Gegenquellen und Factcheck können das Framing relativieren."}
      </p>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Stützt</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{divergence.supports}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Widerspricht</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{divergence.contradicts}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Unklar</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">{divergence.unclear}</p>
        </div>
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="uppercase tracking-wide text-[rgb(var(--muted))]">Divergenz</p>
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            {Math.round(divergence.score * 100)}%
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))]">
        Factcheck-Intervention:{" "}
        <span className="font-semibold text-[rgb(var(--fg))]">
          {INTERVENTION_LABELS[guardrails.factcheckIntervention.status]}
        </span>
        {guardrails.factcheckIntervention.summary ? (
          <p className="mt-1">{guardrails.factcheckIntervention.summary}</p>
        ) : null}
      </div>

      {interventionActive ? (
        <div className="rounded-xl border border-amber-500/45 bg-amber-500/10 px-3 py-2 text-[11px] text-[rgb(var(--fg))]">
          Gegenquellen/Faktenprüfung priorisiert. Das ursprüngliche Framing wird nicht als
          exklusive Wahrheit geführt.
        </div>
      ) : null}
    </section>
  );
}

export default TruthGuardrailsPanel;

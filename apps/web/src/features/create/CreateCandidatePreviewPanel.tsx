import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";

type CreateCandidatePreviewPanelProps = {
  model: CreateCandidatePreviewReadModel;
};

function provenanceLabel(value: string) {
  if (value === "runtime_source_reference") return "Quellenkontext vorhanden";
  if (value === "input_reference_only") return "Input-Referenz vorhanden";
  return "Keine externe Quelle behauptet";
}

function derivedByLabel(value: string) {
  if (value === "planner_plus_analyze") return "Planner + Analyze";
  if (value === "create_analyze") return "Analyze";
  return "Planner / Follow-up";
}

function graphTargetLabel(value: string) {
  if (value === "participation_space_candidate") return "Beteiligungsraum-Kandidat";
  return "Dossier-Kandidat";
}

function targetCarrierLabel(value: string) {
  if (value === "participation_space_runtime_record") return "Participation Runtime";
  if (value === "dossier_runtime_record") return "Dossier Runtime";
  return "Create-Handoff-Review-Queue";
}

export default function CreateCandidatePreviewPanel({
  model,
}: CreateCandidatePreviewPanelProps) {
  if (!model.hasPreview) return null;

  return (
    <section
      className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-5 text-sm text-[rgb(var(--fg))]"
      data-create-candidate-preview="true"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Candidate Preview
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{model.title}</h2>
          <p className="mt-2 leading-6 text-[rgb(var(--muted))]">{model.summary}</p>
        </div>
        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
          <p className="font-semibold">Nur Vorschau</p>
          <p className="mt-1">
            Review erforderlich, nicht veröffentlicht, kein automatischer Write.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Persistenz
          </p>
          <p className="mt-2 leading-6 text-[rgb(var(--muted))]">
            Dieser Schritt bleibt `preview_only`. Persistente Claims und Fragen hängen weiter am
            `dossier_runtime_record`, Umfragen am `participation_space_runtime_record`.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Runtime Truth
          </p>
          <p className="mt-2 leading-6 text-[rgb(var(--muted))]">
            Provider: {model.provider ?? "missing_runtime_truth"} · Modell: {model.model ?? "missing_runtime_truth"}
          </p>
          <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
            Nur wirklich vorhandene Laufdetails werden gezeigt. Fehlende Modellwahrheit wird nicht erfunden.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Zielzustand
          </p>
          <p className="mt-2 leading-6 text-[rgb(var(--muted))]">
            Graph-/Handoff-Zustand: {model.graphTargetState}. Veröffentlichung bleibt blockiert.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {model.sections.map((section) => (
          <div
            key={section.kind}
            className="rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
            data-create-candidate-section={section.kind}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">{section.label}</h3>
              <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-0.5 text-[11px] font-semibold text-[rgb(var(--muted))]">
                {section.items.length}
              </span>
            </div>

            {section.items.length === 0 ? (
              <p className="mt-3 leading-6 text-[rgb(var(--muted))]">{section.emptyLabel}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {section.items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
                    data-create-candidate-item={item.kind}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                        Review erforderlich
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        {graphTargetLabel(item.graphTarget)}
                      </span>
                    </div>
                    <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                    <p className="mt-2 leading-6 text-[rgb(var(--muted))]">{item.summary}</p>
                    <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
                      <p>Input: {item.inputOrigin} · Ref: {item.inputRef}</p>
                      <p>Ableitung: {derivedByLabel(item.derivedBy)}</p>
                      <p>Quellenstatus: {provenanceLabel(item.sourceProvenance)}</p>
                      <p>Publish: {item.publishState}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--fg))]">{model.reviewHandoff.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {model.reviewHandoff.summary}
            </p>
          </div>
          <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            {model.reviewHandoff.persistenceTruth}
          </span>
        </div>

        {model.reviewHandoff.hasPreparedHandoff ? (
          <div className="mt-4 space-y-3">
            {model.reviewHandoff.items.map((item) => (
              <article
                key={`${item.candidateType}-${item.candidateId}`}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
                data-create-candidate-handoff={item.candidateType}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {item.targetCarrier}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {item.targetState}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{item.text}</p>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
                  <p>Candidate: {item.candidateType} · Ref: {item.inputRef}</p>
                  <p>Zielruntime: {targetCarrierLabel(item.targetRuntimeCarrier)}</p>
                  <p>Review: {item.reviewState} · Publish: {item.publishState}</p>
                  <p>Graph: {item.graphTargetState}</p>
                </div>
                {item.missingRuntimeTruth.length > 0 ? (
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                    missing_runtime_truth: {item.missingRuntimeTruth.join(", ")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            Noch kein belastbarer Review-Handoff vorbereitet.
          </p>
        )}
      </div>
    </section>
  );
}

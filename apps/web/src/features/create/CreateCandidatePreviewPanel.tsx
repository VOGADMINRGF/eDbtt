import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import DossierWorkspaceDecisionPanel from "@/features/create/DossierWorkspaceDecisionPanel";
import OutputSocialWorkbenchPanel from "@/features/create/OutputSocialWorkbenchPanel";
import ParticipationActivationReviewPanel from "@/features/create/ParticipationActivationReviewPanel";
import PollQuestionOptionsReviewPanel from "@/features/create/PollQuestionOptionsReviewPanel";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromCreateCandidatePreview,
} from "@/features/create/V3DownstreamKiTransparency";
import SourceFactcheckFeedEnrichmentPanel from "@/features/create/SourceFactcheckFeedEnrichmentPanel";
import V3RuntimeWorkflowSurface, {
  buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview,
} from "@/features/create/V3RuntimeWorkflowSurface";
import V3VoxyCocreationDialog from "@/features/create/V3VoxyCocreationDialogPanel";
import VoxyRenderAdapterNoopPanel from "@/features/create/VoxyRenderAdapterNoopPanel";
import VoxyRenderCostCreditPolicyPanel from "@/features/create/VoxyRenderCostCreditPolicyPanel";
import VoxyRenderAssetProviderRegistryPanel from "@/features/create/VoxyRenderAssetProviderRegistryPanel";
import VoxyRenderQueueContractPanel from "@/features/create/VoxyRenderQueueContractPanel";
import VoxyRenderRequestDraftPanel from "@/features/create/VoxyRenderRequestDraftPanel";
import VoxyBriefingScriptCandidatePanel from "@/features/create/VoxyBriefingScriptCandidatePanel";
import VoxyRenderPreflightReadinessPanel from "@/features/create/VoxyRenderPreflightReadinessPanel";
import VoxyRenderProviderHandoffPanel from "@/features/create/VoxyRenderProviderHandoffPanel";
import VoxyRenderReviewDecisionGatePanel from "@/features/create/VoxyRenderReviewDecisionGatePanel";
import {
  buildVoxyRenderDecisionPersistencePanelModel,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  buildVoxyRenderCostCreditPolicyPanelModel,
  buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderQueuePanelModel,
  buildVoxyRenderQueuePreviewFromCreateCandidatePreview,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderRequestDraftFromCreateCandidatePreview,
  buildVoxyRenderRequestDraftPanelModel,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  buildDossierWorkspaceDecisionFromCreateCandidatePreview,
} from "@/features/create/dossierWorkspaceDecisionContract";
import {
  buildOutputSocialWorkbenchFromCreateCandidatePreview,
} from "@/features/create/outputSocialWorkbenchContract";
import {
  buildParticipationActivationReviewFromCreateCandidatePreview,
} from "@/features/create/participationActivationReviewContract";
import {
  buildPollQuestionOptionsReviewFromCreateCandidatePreview,
} from "@/features/create/pollQuestionOptionsReviewContract";
import {
  buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import {
  buildVoxyBriefingScriptCandidateFromCreateCandidatePreview,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyRenderAdapterNoopFromCreateCandidatePreview,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromCreateCandidatePreview,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromCreateCandidatePreview,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview,
} from "@/features/create/voxyRenderReviewDecisionGateContract";

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

function enrichmentSourceTypeLabel(value: string) {
  if (value === "feed_candidate") return "Feed-Hinweis";
  if (value === "material_candidate") return "Material-Hinweis";
  if (value === "evidence_candidate") return "Evidenzhinweis";
  if (value === "source_candidate") return "Quellenhinweis";
  return "missing_source_truth";
}

export default function CreateCandidatePreviewPanel({
  model,
}: CreateCandidatePreviewPanelProps) {
  if (!model.hasPreview) return null;
  const workflowModel = buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview(model);
  const downstreamTransparencyModel =
    buildV3DownstreamKiTransparencyFromCreateCandidatePreview(model);
  const sourceFactcheckFeedModel =
    buildSourceFactcheckFeedEnrichmentFromCreateCandidatePreview(model);
  const dossierWorkspaceDecisionModel =
    buildDossierWorkspaceDecisionFromCreateCandidatePreview(model);
  const participationActivationReviewModel =
    buildParticipationActivationReviewFromCreateCandidatePreview(model);
  const pollQuestionOptionsReviewModel =
    buildPollQuestionOptionsReviewFromCreateCandidatePreview(model);
  const outputSocialWorkbenchModel =
    buildOutputSocialWorkbenchFromCreateCandidatePreview(model);
  const voxyBriefingScriptCandidateModel =
    buildVoxyBriefingScriptCandidateFromCreateCandidatePreview(model);
  const voxyRenderProviderHandoffModel =
    buildVoxyRenderProviderHandoffFromCreateCandidatePreview(model);
  const voxyRenderPreflightReadinessModel =
    buildVoxyRenderPreflightReadinessFromCreateCandidatePreview(model);
  const voxyRenderAssetProviderRegistryModel =
    buildVoxyRenderAssetProviderRegistryFromCreateCandidatePreview(model);
  const voxyRenderAdapterNoopModel =
    buildVoxyRenderAdapterNoopFromCreateCandidatePreview(model);
  const voxyRenderReviewDecisionGateModel =
    buildVoxyRenderReviewDecisionGateFromCreateCandidatePreview(model);
  const voxyRenderDecisionPersistenceModel =
    buildVoxyRenderDecisionPersistencePanelModel({
      gate: voxyRenderReviewDecisionGateModel,
    });
  const voxyRenderRequestDraftModel = buildVoxyRenderRequestDraftPanelModel({
    draft: buildVoxyRenderRequestDraftFromCreateCandidatePreview(model),
  });
  const voxyRenderQueueContractModel = buildVoxyRenderQueuePanelModel({
    preview: buildVoxyRenderQueuePreviewFromCreateCandidatePreview(model),
  });
  const voxyRenderCostCreditPolicyModel = buildVoxyRenderCostCreditPolicyPanelModel({
    preview: buildVoxyRenderCostCreditPolicyPreviewFromCreateCandidatePreview(model),
  });

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

      <div className="mt-5">
        <V3RuntimeWorkflowSurface
          model={workflowModel}
          dataTestId="create-candidate-workflow-surface"
        />
      </div>

      <V3DownstreamKiTransparency
        model={downstreamTransparencyModel}
        dataTestId="create-candidate-downstream-ki-transparency"
      />

      <V3VoxyCocreationDialog
        model={model.voxyCocreationDialog}
        dataTestId="create-candidate-voxy-cocreation"
      />

      <SourceFactcheckFeedEnrichmentPanel
        model={sourceFactcheckFeedModel}
        dataTestId="create-candidate-source-factcheck-feed-enrichment"
      />

      <DossierWorkspaceDecisionPanel
        model={dossierWorkspaceDecisionModel}
        title="Dossier-Entscheidungslogik"
        dataTestId="create-candidate-dossier-workspace-decision"
      />

      <ParticipationActivationReviewPanel
        model={participationActivationReviewModel}
        title="Beteiligungsraum vorbereiten"
        dataTestId="create-candidate-participation-activation-review"
      />

      <PollQuestionOptionsReviewPanel
        model={pollQuestionOptionsReviewModel}
        title="Poll/Frage vorbereiten"
        dataTestId="create-candidate-poll-question-options-review"
      />

      <OutputSocialWorkbenchPanel
        model={outputSocialWorkbenchModel}
        title="Ausgabe vorbereiten"
        dataTestId="create-candidate-output-social-workbench"
      />

      <VoxyBriefingScriptCandidatePanel
        model={voxyBriefingScriptCandidateModel}
        title="Voxy-Briefing vorbereiten"
        dataTestId="create-candidate-voxy-briefing-script"
      />

      <VoxyRenderReviewDecisionGatePanel
        model={voxyRenderReviewDecisionGateModel}
        persistenceModel={voxyRenderDecisionPersistenceModel}
        title="Render-Entscheidung"
        dataTestId="create-candidate-voxy-render-decision"
      />

      <VoxyRenderRequestDraftPanel
        model={voxyRenderRequestDraftModel}
        dataTestId="create-candidate-voxy-render-request-draft"
      />

      <VoxyRenderQueueContractPanel
        model={voxyRenderQueueContractModel}
        dataTestId="create-candidate-voxy-render-queue-contract"
      />

      <VoxyRenderCostCreditPolicyPanel
        model={voxyRenderCostCreditPolicyModel}
        dataTestId="create-candidate-voxy-render-cost-credit-policy"
      />

      <VoxyRenderProviderHandoffPanel
        model={voxyRenderProviderHandoffModel}
        title="Voxy-Render/Provider-Handoff vorbereiten"
        dataTestId="create-candidate-voxy-render-provider-handoff"
      />

      <VoxyRenderPreflightReadinessPanel
        model={voxyRenderPreflightReadinessModel}
        title="Voxy-Render-Preflight vorbereiten"
        dataTestId="create-candidate-voxy-render-preflight"
      />

      <VoxyRenderAssetProviderRegistryPanel
        model={voxyRenderAssetProviderRegistryModel}
        title="Voxy Asset- & Provider-Registry"
        dataTestId="create-candidate-voxy-render-registry"
      />

      <VoxyRenderAdapterNoopPanel
        model={voxyRenderAdapterNoopModel}
        title="Render-Adapter vorbereiten"
        dataTestId="create-candidate-voxy-render-adapter"
      />

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

      <div className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
              {model.feedEnrichmentSuggestions.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {model.feedEnrichmentSuggestions.summary}
            </p>
          </div>
          <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            no_auto_deepsearch
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Angereicherte Kandidaten
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {model.feedEnrichmentSuggestions.enrichedCandidateTypes.join(", ")}
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Geplant
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {model.feedEnrichmentSuggestions.plannedCandidateTypes.join(", ")} bleiben ohne
              passende Runtime-Struktur nur `planned_handoff`.
            </p>
          </div>
        </div>

        {model.feedEnrichmentSuggestions.hasSuggestions ? (
          <div className="mt-4 space-y-3">
            {model.feedEnrichmentSuggestions.items.map((item) => (
              <article
                key={item.suggestionId}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
                data-create-feed-enrichment-suggestion={item.candidateType}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {enrichmentSourceTypeLabel(item.sourceType)}
                  </span>
                  <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    {item.confidenceState}
                  </span>
                </div>
                <p className="mt-2 font-semibold text-[rgb(var(--fg))]">{item.candidateText}</p>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
                  <p>Candidate: {item.candidateType}</p>
                  <p>Origin: {item.sourceOrigin}</p>
                  <p>Quelle: {item.sourceTitle ?? "missing_source_truth"}</p>
                  <p>Ref: {item.sourceRef ?? "missing_runtime_truth"}</p>
                  <p>Factcheck: {item.factcheckState}</p>
                  <p>DeepSearch: {item.deepsearchState}</p>
                </div>
                {item.sourceUrl ? (
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                    URL: {item.sourceUrl}
                  </p>
                ) : null}
                {item.missingRuntimeTruth.length > 0 ? (
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                    missing_runtime_truth: {item.missingRuntimeTruth.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                    provenance preserved · review_required · not_published
                  </p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            Noch keine belastbaren Feed-, Quellen- oder Materialhinweise vorbereitet.
          </p>
        )}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[rgb(var(--fg))]">
              {model.claimToDossierPipeline.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              {model.claimToDossierPipeline.summary}
            </p>
          </div>
          <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            review-first
          </span>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Review-Record
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {model.claimToDossierPipeline.reviewRecordTruth}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {model.claimToDossierPipeline.reviewRecordId ?? "Kein persistierter Review-Record"}
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Target Record
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {model.claimToDossierPipeline.dossierRuntimeHandoff?.persistenceState ??
                "missing_dossier_runtime_truth"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
              {model.claimToDossierPipeline.dossierRuntimeHandoff?.dossierRuntimeId ??
                "Ein echtes `dossier_runtime_record` entsteht erst nach separater Review-Freigabe."}
            </p>
          </div>
        </div>

        {model.claimToDossierPipeline.dossierRuntimeHandoff ? (
          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Dossier-Runtime-Handoff
            </p>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
              <p>
                Zustand: {model.claimToDossierPipeline.dossierRuntimeHandoff.dossierRuntimeState}
              </p>
              <p>
                Runtime-Status: {model.claimToDossierPipeline.dossierRuntimeHandoff.runtimeStatus ?? "missing_runtime_truth"}
              </p>
              <p>
                Publish: {model.claimToDossierPipeline.dossierRuntimeHandoff.publishState}
              </p>
              <p>
                Graph: {model.claimToDossierPipeline.dossierRuntimeHandoff.graphTargetState}
              </p>
              <p>
                Kandidaten: {model.claimToDossierPipeline.dossierRuntimeHandoff.sourceCandidateIds.length}
              </p>
              <p>
                Feed-Hinweise: {model.claimToDossierPipeline.dossierRuntimeHandoff.feedEnrichmentPayloads.length}
              </p>
            </div>
            {model.claimToDossierPipeline.dossierRuntimeHandoff.missingRuntimeTruth.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                missing_runtime_truth:{" "}
                {model.claimToDossierPipeline.dossierRuntimeHandoff.missingRuntimeTruth.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff ? (
          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Graph- / Anlassraum-Handoff
            </p>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
              <p>
                Graph-Ziel: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.graphTargetState}
              </p>
              <p>
                Anlassraum-Ziel: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.anlassraumTargetState}
              </p>
              <p>
                Beteiligungs-Ziel: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.participationTargetState}
              </p>
              <p>
                Branch-Workspace: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.branchWorkspaceTargetState}
              </p>
              <p>
                target_graph_id: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.targetGraphId ?? "nicht vorhanden"}
              </p>
              <p>
                target_anlassraum_id: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.targetAnlassraumId ?? "nicht vorhanden"}
              </p>
              <p>
                target_participation_space_id: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.targetParticipationSpaceId ?? "nicht vorhanden"}
              </p>
              <p>
                target_branch_workspace_id: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.targetBranchWorkspaceId ?? "nicht vorhanden"}
              </p>
            </div>
            {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.topicSeed ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                topic_seed: {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.topicSeed.topicLabel} ·{" "}
                {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.topicSeed.jurisdiction}
              </p>
            ) : null}
            {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.graphMatches.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                graph_matches:{" "}
                {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.graphMatches
                  .map((match) => `${match.kind}:${match.label}`)
                  .join(", ")}
              </p>
            ) : null}
            {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.feedEnrichmentRefs.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                feed_enrichment_refs:{" "}
                {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.feedEnrichmentRefs.join(", ")}
              </p>
            ) : null}
            {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.missingRuntimeTruth.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                missing_runtime_truth:{" "}
                {model.claimToDossierPipeline.dossierGraphAnlassraumHandoff.missingRuntimeTruth.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {model.claimToDossierPipeline.dossierDraftPreview ? (
          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Dossier-Draft-Vorschau
            </p>
            <p className="mt-2 font-semibold text-[rgb(var(--fg))]">
              {model.claimToDossierPipeline.dossierDraftPreview.title}
            </p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
              {model.claimToDossierPipeline.dossierDraftPreview.summary}
            </p>
            <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
              <p>
                Sichtbarkeit: {model.claimToDossierPipeline.dossierDraftPreview.visibility}
              </p>
              <p>Persistent Write: nein</p>
            </div>
            {model.claimToDossierPipeline.dossierDraftPreview.openQuestions.length > 0 ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                Offene Fragen:{" "}
                {model.claimToDossierPipeline.dossierDraftPreview.openQuestions.join(", ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {model.claimToDossierPipeline.hasPreparedPipeline ? (
          <div className="mt-4 space-y-3">
            {model.claimToDossierPipeline.items.map((item) => (
              <article
                key={`${item.candidateType}-${item.sourceCandidateId}-pipeline`}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3"
                data-create-claim-pipeline={item.candidateType}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {targetCarrierLabel(item.targetCarrier)}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    {item.targetState}
                  </span>
                  <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                    {item.persistenceState}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs leading-5 text-[rgb(var(--muted))] md:grid-cols-2">
                  <p>Candidate: {item.candidateType} · Ref: {item.inputRef}</p>
                  <p>Zieltyp: {item.targetRecordType}</p>
                  <p>
                    Dossier-Ziel: {item.dossierTargetState ?? "nicht aktiv"}
                  </p>
                  <p>
                    Beteiligungs-Ziel: {item.participationTargetState ?? "nicht aktiv"}
                  </p>
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
            Noch keine belastbare Claim-to-Dossier-Pipeline vorbereitet.
          </p>
        )}
      </div>
    </section>
  );
}

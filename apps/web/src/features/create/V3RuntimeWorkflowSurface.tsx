import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type {
  DossierSocialOutputDraftKind,
} from "@/features/create/dossierSocialOutputDraftContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import {
  preparationStatusLabel as sharedPreparationStatusLabel,
  reviewQueueStateLabel as sharedReviewQueueStateLabel,
  REVIEW_SURFACE_GUARDRAILS,
} from "@/features/review/reviewSurfaceStatusLabels";

export const V3_RUNTIME_WORKFLOW_STAGE_STATUSES = [
  "operational_basic",
  "preview_only",
  "readmodel_only",
  "blocked_by_provider",
  "blocked_by_secret",
  "blocked_by_runtime_truth",
  "missing_runtime_truth",
] as const;

export type V3RuntimeWorkflowStageStatus =
  (typeof V3_RUNTIME_WORKFLOW_STAGE_STATUSES)[number];

export type V3RuntimeWorkflowStageId =
  | "create_handoff"
  | "unified_review_queue"
  | "dossier_workspace"
  | "participation_candidates"
  | "output_drafts"
  | "voxy_briefing";

export type V3RuntimeWorkflowStage = {
  id: V3RuntimeWorkflowStageId;
  label: string;
  status: V3RuntimeWorkflowStageStatus;
  summary: string;
  details: string[];
  guardrails: string[];
};

export type V3RuntimeWorkflowSurfaceModel = {
  title: string;
  summary: string;
  nextStepLabel: string;
  stages: V3RuntimeWorkflowStage[];
};

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function stageStatusLabel(value: V3RuntimeWorkflowStageStatus): string {
  if (value === "operational_basic") return "Bestehende Fläche aktiv";
  if (value === "preview_only") return "Nur Vorschau";
  if (value === "readmodel_only") return "Nur Readmodel";
  if (value === "blocked_by_provider") return "Anbieter fehlt";
  if (value === "blocked_by_secret") return "Zugangsdaten fehlen";
  if (value === "blocked_by_runtime_truth") return "Runtime blockiert";
  return "Runtime-Wahrheit fehlt";
}

function stageStatusDataValue(value: V3RuntimeWorkflowStageStatus): string {
  if (value === "missing_runtime_truth") return "runtime_gap";
  return value;
}

function socialDraftKindLabel(value: DossierSocialOutputDraftKind): string {
  if (value === "website_update_draft") return "Website-Entwurf";
  if (value === "linkedin_draft") return "LinkedIn-Entwurf";
  if (value === "newsletter_draft") return "Newsletter-Entwurf";
  if (value === "short_video_script_draft") return "Kurzvideo-Skript";
  if (value === "carousel_draft") return "Carousel-Entwurf";
  return "Pressenotiz";
}

function buildStage(
  stage: Omit<V3RuntimeWorkflowStage, "details" | "guardrails"> & {
    details?: readonly string[];
    guardrails?: readonly string[];
  },
): V3RuntimeWorkflowStage {
  return {
    ...stage,
    details: unique(stage.details ?? []),
    guardrails: unique(stage.guardrails ?? []),
  };
}

function findCreateHandoffItem(context: V3ReviewQueueWiringContext) {
  const items = context.primaryUnifiedItem
    ? [context.primaryUnifiedItem, ...context.unifiedItems]
    : context.unifiedItems;
  return items.find((item) => item.source === "create_handoff") ?? null;
}

function resolveVoxyStageStatus(
  context: V3ReviewQueueWiringContext,
): V3RuntimeWorkflowStageStatus {
  if (!context.voxyBriefing) return "readmodel_only";
  if (context.voxyRenderJob?.status === "blocked_by_provider") {
    return "blocked_by_provider";
  }
  if (context.voxyRenderJob?.status === "blocked_by_secret") {
    return "blocked_by_secret";
  }
  if (
    context.voxyRenderJob?.status === "blocked_by_runtime_truth" ||
    context.voxyPublishDraft?.status === "blocked_by_runtime_truth"
  ) {
    return "blocked_by_runtime_truth";
  }
  return "preview_only";
}

export function buildV3RuntimeWorkflowSurfaceFromReviewContext(
  context: V3ReviewQueueWiringContext,
): V3RuntimeWorkflowSurfaceModel {
  const createHandoff = findCreateHandoffItem(context);
  const reviewItems = context.primaryUnifiedItem
    ? [context.primaryUnifiedItem, ...context.unifiedItems]
    : context.unifiedItems;
  const uniqueReviewItems = reviewItems.filter(
    (item, index) => reviewItems.findIndex((candidate) => candidate.id === item.id) === index,
  );

  const stages = [
    buildStage({
      id: "create_handoff",
      label: "Create / Handoff",
      status: createHandoff ? "operational_basic" : "readmodel_only",
      summary: createHandoff
        ? "Der bestehende Create-Handoff ist im Arbeitsfluss sichtbar und bleibt review-first."
        : "Im aktuellen Kontext ist kein belastbarer Create-Handoff sichtbar.",
      details: createHandoff
        ? [
            sharedReviewQueueStateLabel(createHandoff.queueState),
            sharedPreparationStatusLabel(createHandoff.preparationStatus),
            createHandoff.title,
          ]
        : ["Keine neue Intake- oder Handoff-Welt erzeugt."],
      guardrails: [
        "Keine automatische Veröffentlichung.",
        "Review bleibt erforderlich.",
      ],
    }),
    buildStage({
      id: "unified_review_queue",
      label: "Unified Review Queue",
      status: uniqueReviewItems.length > 0 ? "operational_basic" : "readmodel_only",
      summary:
        uniqueReviewItems.length > 0
          ? "Bestehende Review-Items tragen denselben V3-Kontext auf derselben Queue."
          : "Noch keine belastbaren V3-Review-Items im aktuellen Kontext sichtbar.",
      details:
        uniqueReviewItems.length > 0
          ? [
              `${uniqueReviewItems.length} Review-Items`,
              ...unique(uniqueReviewItems.map((item) => sharedReviewQueueStateLabel(item.queueState))).slice(
                0,
                3,
              ),
            ]
          : ["Keine zweite Queue und keine Queue-Parallelwelt."],
      guardrails: [
        REVIEW_SURFACE_GUARDRAILS.reviewReadyNotApproved,
        REVIEW_SURFACE_GUARDRAILS.publishReadyNotPublished,
      ],
    }),
    buildStage({
      id: "dossier_workspace",
      label: "Dossier Workspace",
      status: context.dossierWorkspaceSurface ? "operational_basic" : "readmodel_only",
      summary: context.dossierWorkspaceSurface
        ? "Der bestehende Dossier-Workspace trägt Claims, Fragen und Review-Kontext."
        : "Ein Dossier-Workspace ist im aktuellen Kontext noch nicht sichtbar.",
      details: context.dossierWorkspaceSurface
        ? [
            sharedPreparationStatusLabel(context.dossierWorkspaceSurface.preparationStatus),
            `${context.dossierWorkspaceSurface.sections.claims.length} Claims`,
            `${context.dossierWorkspaceSurface.sections.openQuestions.length} offene Fragen`,
          ]
        : ["Dossier-Finalisierung wird nicht behauptet."],
      guardrails: [
        "Keine automatische Dossier-Finalisierung.",
        "Keine automatische Sichtbarkeit.",
      ],
    }),
    buildStage({
      id: "participation_candidates",
      label: "Anlassraum / Beteiligung",
      status:
        context.participationCandidates.length > 0
          ? "preview_only"
          : "readmodel_only",
      summary:
        context.participationCandidates.length > 0
          ? "Beteiligungs- und Anlassraum-Kandidaten sind sichtbar, aber nicht öffentlich aktiviert."
          : "Participation-Kandidaten sind in diesem Kontext noch nicht sichtbar.",
      details:
        context.participationCandidates.length > 0
          ? [
              `${context.participationCandidates.length} Kandidaten`,
              ...context.participationCandidates.slice(0, 2).map((candidate) => candidate.title),
            ]
          : ["Keine automatische Aktivierung oder Vote-Erzeugung."],
      guardrails: [
        "Keine öffentliche Aktivierung ohne Review.",
        "Keine automatische Vote-Erzeugung.",
      ],
    }),
    buildStage({
      id: "output_drafts",
      label: "Output Drafts",
      status:
        context.socialOutputDrafts.length > 0
          ? "operational_basic"
          : "readmodel_only",
      summary:
        context.socialOutputDrafts.length > 0
          ? "Output-Drafts laufen als bestehende reviewpflichtige Entwürfe auf derselben Arbeitskette."
          : "Noch keine sichtbaren Output-Drafts im aktuellen Kontext.",
      details:
        context.socialOutputDrafts.length > 0
          ? [
              `${context.socialOutputDrafts.length} Output-Drafts`,
              ...unique(
                context.socialOutputDrafts
                  .slice(0, 3)
                  .map((draft) => socialDraftKindLabel(draft.kind)),
              ),
            ]
          : ["Output-Drafts werden nicht als veröffentlicht behauptet."],
      guardrails: [
        "Kein Auto-Publish",
        "Kein automatisches Social Posting",
      ],
    }),
    buildStage({
      id: "voxy_briefing",
      label: "Voxy Briefing",
      status: resolveVoxyStageStatus(context),
      summary: context.voxyBriefing
        ? "Voxy bleibt ein reviewpflichtiger Briefing- und Skriptkandidat, nicht Render- oder Publish-Automation."
        : "Ein Voxy-Briefing ist im aktuellen Kontext noch nicht sichtbar.",
      details: context.voxyBriefing
        ? [
            context.voxyBriefing.title,
            sharedReviewQueueStateLabel(context.voxyReviewState?.scriptReview.status),
            sharedReviewQueueStateLabel(context.voxyReviewState?.publishReview.status),
          ]
        : ["Kein echter Render- oder Publish-Provider wird behauptet."],
      guardrails: [
        "Kein echter Voxy-Render",
        "Kein Voxy-Publish ohne Review und Provider",
      ],
    }),
  ];

  return {
    title: "V3-Arbeitsfluss über bestehende Flächen",
    summary:
      "Dieselbe review-first Wahrheit wird über Create-Handoff, Review, Dossier, Participation, Output und Voxy sichtbar gemacht.",
    nextStepLabel:
      context.socialOutputDrafts.length > 0
        ? "Review abschließen und danach Dossier-, Participation- oder Output-Kandidaten bewusst weiterführen."
        : "Review abschließen und danach Dossier- oder Participation-Kandidaten bewusst weiterführen.",
    stages,
  };
}

export function buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
): V3RuntimeWorkflowSurfaceModel {
  const handoffPersisted =
    model.claimToDossierPipeline.reviewRecordTruth === "persisted_review_record";
  const dossierRuntime = model.claimToDossierPipeline.dossierRuntimeHandoff;
  const graphHandoff = model.claimToDossierPipeline.dossierGraphAnlassraumHandoff;
  const pollItems = model.claimToDossierPipeline.items.filter(
    (item) => item.candidateType === "poll",
  );
  const hasParticipationCandidate =
    pollItems.length > 0 ||
    graphHandoff?.participationTargetState === "participation_candidate" ||
    graphHandoff?.anlassraumTargetState === "planned_handoff";

  const stages = [
    buildStage({
      id: "create_handoff",
      label: "Create / Handoff",
      status: handoffPersisted
        ? "operational_basic"
        : model.reviewHandoff.hasPreparedHandoff
          ? "preview_only"
          : "readmodel_only",
      summary: handoffPersisted
        ? "Der Create-Handoff ist bereits als bestehender Review-Record sichtbar."
        : model.reviewHandoff.hasPreparedHandoff
          ? "Der Handoff ist vorbereitet, bleibt hier aber bewusst Vorschau statt stiller Persistenz."
          : "Noch kein belastbarer Handoff aus dem aktuellen Entwurf vorbereitet.",
      details: model.reviewHandoff.hasPreparedHandoff
        ? [
            `${model.reviewHandoff.items.length} Kandidaten`,
            handoffPersisted
              ? "Persistierter Review-Record vorhanden"
              : "Persistenz wird nicht still behauptet",
          ]
        : ["Zuerst Entwurf und Kandidatenstruktur vervollständigen."],
      guardrails: [
        "Keine automatische Handoff-Persistenz",
        "Keine automatische Veröffentlichung",
      ],
    }),
    buildStage({
      id: "unified_review_queue",
      label: "Unified Review Queue",
      status: handoffPersisted
        ? "operational_basic"
        : model.reviewHandoff.hasPreparedHandoff
          ? "preview_only"
          : "readmodel_only",
      summary: handoffPersisted
        ? "Der bestehende Review-Queue-Pfad ist als persistierter Handoff angebunden."
        : model.reviewHandoff.hasPreparedHandoff
          ? "Die Queue-Zielstruktur ist sichtbar, aber noch nicht als echte Runtime-Wahrheit bestätigt."
          : "Ohne Handoff bleibt die Queue hier nur als Zielbild sichtbar.",
      details: [
        handoffPersisted ? "Persistierter Review-Record" : "Review-first Queue-Ziel",
        `${model.reviewHandoff.items.length} Review-Handoff-Elemente`,
      ],
      guardrails: [
        "review_ready ist nicht approved",
        "Keine zweite Queue",
      ],
    }),
    buildStage({
      id: "dossier_workspace",
      label: "Dossier Workspace",
      status:
        dossierRuntime?.persistenceState === "persisted_dossier_runtime_record"
          ? "operational_basic"
          : dossierRuntime
            ? "missing_runtime_truth"
            : "readmodel_only",
      summary:
        dossierRuntime?.persistenceState === "persisted_dossier_runtime_record"
          ? "Ein bestehender Dossier-Runtime-Draft ist bereits an denselben Arbeitsfluss angeschlossen."
          : dossierRuntime
            ? "Der Dossier-Pfad ist sichtbar, aber ein echter Runtime-Record fehlt noch oder bleibt getrennt reviewpflichtig."
            : "Ohne Dossier-Handoff bleibt dieser Schritt nur als Lesart sichtbar.",
      details: dossierRuntime
        ? [
            sharedPreparationStatusLabel(dossierRuntime.dossierRuntimeState),
            dossierRuntime.dossierRuntimeId ?? "Noch keine echte Dossier-Runtime-ID",
          ]
        : ["Keine neue Dossier-Parallelwelt im Frontend."],
      guardrails: [
        "Keine automatische Dossier-Erstellung",
        "Keine automatische Sichtbarkeit",
      ],
    }),
    buildStage({
      id: "participation_candidates",
      label: "Anlassraum / Beteiligung",
      status: hasParticipationCandidate ? "preview_only" : "readmodel_only",
      summary: hasParticipationCandidate
        ? "Anlassraum- oder Beteiligungskandidaten sind vorbereitet, aber weiterhin nur review-first."
        : "Noch keine belastbaren Participation-Kandidaten im aktuellen Entwurf sichtbar.",
      details: hasParticipationCandidate
        ? [
            `${pollItems.length} Poll-Kandidaten`,
            graphHandoff?.anlassraumTargetState === "planned_handoff"
              ? "Anlassraum-Handoff geplant"
              : "Anlassraum noch nicht aktiv",
            graphHandoff?.participationTargetState === "participation_candidate"
              ? "Beteiligungsraum-Kandidat sichtbar"
              : "Beteiligungsraum noch nicht aktiv",
          ]
        : ["Keine automatische Aktivierung oder öffentliche Teilnahmefläche."],
      guardrails: [
        "Keine öffentliche Aktivierung ohne Review",
        "Keine automatische Vote-Erzeugung",
      ],
    }),
    buildStage({
      id: "output_drafts",
      label: "Output Drafts",
      status: "readmodel_only",
      summary:
        "Output-Drafts entstehen erst auf bestehenden Dossier-/Output-Flächen und werden hier nicht vorgetäuscht.",
      details: [
        "Website-, Newsletter-, Social- und Pressedrafts folgen erst nach Dossier-Kontext",
      ],
      guardrails: [
        "Kein Auto-Publish",
        "Keine Fake-Output-Drafts in /create",
      ],
    }),
    buildStage({
      id: "voxy_briefing",
      label: "Voxy Briefing",
      status: "readmodel_only",
      summary:
        "Voxy wird erst mit echtem Dossier-/Output-Kontext als Briefing-Kandidat sichtbar und bleibt review-first.",
      details: ["Kein Render, kein Provider, kein Publish in diesem Schritt."],
      guardrails: [
        "Kein echter Voxy-Render",
        "Kein Voxy-Publish ohne Review und Provider",
      ],
    }),
  ];

  return {
    title: "V3-Arbeitsfluss ab hier",
    summary:
      "Der Entwurf bleibt review-first: erst Handoff, dann Review, danach Dossier-, Participation- oder Output-Folgen auf bestehenden Flächen.",
    nextStepLabel: handoffPersisted
      ? "Bestehenden Review- oder Dossier-Pfad gezielt weiterführen."
      : model.reviewHandoff.hasPreparedHandoff
        ? "Handoff bewusst speichern oder zur Prüfung übergeben, bevor Downstream-Schritte belastbar werden."
        : "Zuerst Kandidaten und Review-Handoff sauber vorbereiten.",
    stages,
  };
}

export default function V3RuntimeWorkflowSurface(props: {
  model: V3RuntimeWorkflowSurfaceModel;
  dataTestId?: string;
}) {
  return (
    <section
      data-testid={props.dataTestId}
      className="rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-5 text-sm text-[rgb(var(--fg))]"
    >
      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Runtime Surface Map
        </p>
        <h2 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{props.model.title}</h2>
        <p className="mt-2 leading-6 text-[rgb(var(--muted))]">{props.model.summary}</p>
      </div>

      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {props.model.stages.map((stage) => (
          <article
            key={stage.id}
            data-v3-runtime-workflow-stage={stage.id}
            data-v3-runtime-workflow-status={stageStatusDataValue(stage.status)}
            className="rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))]">
                {stage.label}
              </span>
              <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                {stageStatusLabel(stage.status)}
              </span>
            </div>
            <p className="mt-3 leading-6 text-[rgb(var(--muted))]">{stage.summary}</p>
            {stage.details.length > 0 ? (
              <div className="mt-3 space-y-1 text-xs leading-5 text-[rgb(var(--muted))]">
                {stage.details.map((detail) => (
                  <p key={`${stage.id}-${detail}`}>{detail}</p>
                ))}
              </div>
            ) : null}
            {stage.guardrails.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {stage.guardrails.map((guardrail) => (
                  <span
                    key={`${stage.id}-${guardrail}`}
                    className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[11px] text-[rgb(var(--muted))]"
                  >
                    {guardrail}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Nächster sinnvoller Schritt
        </p>
        <p className="mt-2 leading-6 text-[rgb(var(--muted))]">{props.model.nextStepLabel}</p>
      </div>
    </section>
  );
}

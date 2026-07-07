import type { CreateBranchHandoffTarget } from "@/features/create/branchHandoffTargets";
import type { CreateCandidatePreviewReadModel } from "@/features/create/createCandidatePreview";
import type {
  CreateBranchLedgerItem,
  CreateContributionLedgerDraftSaveStatus,
} from "@features/create/createContributionLedger";
import {
  buildV3ReviewContextSummaryModel,
} from "@/features/create/V3ReviewContextSummary";
import {
  buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview,
  buildV3RuntimeWorkflowSurfaceFromReviewContext,
  type V3RuntimeWorkflowStageStatus,
} from "@/features/create/V3RuntimeWorkflowSurface";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { StartDraftContext } from "@/features/start/startDraftContext";
import type { V3AccountResumeWorkflowModel } from "@/features/create/V3AccountResumeWorkflow";

export const V3_DOWNSTREAM_KI_TRANSPARENCY_STEP_STATUSES = [
  "not_started",
  "prepared",
  "in_review",
  "blocked",
  "failed",
  "done",
] as const;

export type V3DownstreamKiTransparencyStepStatus =
  (typeof V3_DOWNSTREAM_KI_TRANSPARENCY_STEP_STATUSES)[number];

export type V3DownstreamKiTransparencyStepId =
  | "intake_received"
  | "language_bridge"
  | "topic_classification"
  | "format_recommendation"
  | "evidence_pack"
  | "claim_question_expansion"
  | "dossier_candidate"
  | "participation_candidate"
  | "output_draft"
  | "voxy_briefing"
  | "review_gate"
  | "provider_cost_gate";

export type V3DownstreamKiTransparencyAudience = "user" | "admin" | "reviewer";

export type V3DownstreamKiTransparencyStep = {
  id: V3DownstreamKiTransparencyStepId;
  label: string;
  description: string;
  status: V3DownstreamKiTransparencyStepStatus;
  audience: V3DownstreamKiTransparencyAudience;
  reviewRequired: boolean;
  requiredRole: string | null;
  blocker: string | null;
  evidenceHint: string | null;
  languageHint: string | null;
  costHint: string | null;
  nextStep: string | null;
  publicSafeLabel: string;
  internalReason: string | null;
};

export type V3DownstreamKiTransparencyModel = {
  title: string;
  summary: string;
  nextStepLabel: string;
  guardrails: string[];
  steps: V3DownstreamKiTransparencyStep[];
  operationalTruthLabel: string;
};

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function statusLabel(value: V3DownstreamKiTransparencyStepStatus): string {
  if (value === "done") return "sichtbar";
  if (value === "in_review") return "in Prüfung";
  if (value === "prepared") return "vorbereitet";
  if (value === "blocked") return "blockiert";
  if (value === "failed") return "fehlgeschlagen";
  return "noch nicht aktiv";
}

function mapWorkflowStageStatus(
  value: V3RuntimeWorkflowStageStatus,
): V3DownstreamKiTransparencyStepStatus {
  if (value === "operational_basic") return "done";
  if (value === "preview_only") return "prepared";
  if (value === "readmodel_only") return "not_started";
  return "blocked";
}

function containsKeyword(values: readonly string[], keywords: readonly string[]): boolean {
  const haystack = values.join(" ").toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

function buildStep(
  step: Omit<V3DownstreamKiTransparencyStep, "requiredRole" | "blocker" | "evidenceHint" | "languageHint" | "costHint" | "nextStep" | "internalReason"> & {
    requiredRole?: string | null;
    blocker?: string | null;
    evidenceHint?: string | null;
    languageHint?: string | null;
    costHint?: string | null;
    nextStep?: string | null;
    internalReason?: string | null;
  },
): V3DownstreamKiTransparencyStep {
  return {
    ...step,
    requiredRole: step.requiredRole ?? null,
    blocker: step.blocker ?? null,
    evidenceHint: step.evidenceHint ?? null,
    languageHint: step.languageHint ?? null,
    costHint: step.costHint ?? null,
    nextStep: step.nextStep ?? null,
    internalReason: step.internalReason ?? null,
  };
}

function buildBaseGuardrails(extra: readonly string[] = []) {
  return unique([
    "Keine Veröffentlichung ohne Review",
    "Keine öffentliche Aktivierung ohne bewusste Freigabe",
    "Kein Auto-Publish, kein Social Posting, kein Voxy-Render",
    ...extra,
  ]);
}

function findWorkflowStep(
  model: V3AccountResumeWorkflowModel,
  label: string,
) {
  return model.steps.find((step) => step.label === label) ?? null;
}

function buildAccountTransparencyModel(params: {
  workflow: V3AccountResumeWorkflowModel;
  operationalTruthLabel: string;
}): V3DownstreamKiTransparencyModel {
  const contributionStep = findWorkflowStep(params.workflow, "Beitrag erhalten");
  const classifiedStep = findWorkflowStep(params.workflow, "Beitrag klassifiziert");
  const topicStep = findWorkflowStep(params.workflow, "Thema / Anschluss erkannt");
  const formatStep = findWorkflowStep(params.workflow, "Formatvorschlag vorhanden");
  const reviewStep = findWorkflowStep(params.workflow, "Review oder Rückfrage");
  const dossierStep = findWorkflowStep(params.workflow, "Dossier-Kandidat");
  const participationStep = findWorkflowStep(params.workflow, "Anlassraum / Beteiligung");
  const outputStep = findWorkflowStep(params.workflow, "Output / Social");
  const voxyStep = findWorkflowStep(params.workflow, "Voxy-Briefing");
  const evidencePrepared = containsKeyword(
    [params.workflow.nextStepLabel, reviewStep?.summary ?? "", ...params.workflow.guardrails],
    ["quelle", "quellen", "prüf", "beleg"],
  );

  return {
    title: "KI-, Review- und Enrichment-Transparenz",
    summary:
      "Der Account zeigt nur vorhandene Draft- und Ledger-Wahrheit. Downstream-Runtime wird hier nicht erfunden.",
    nextStepLabel: params.workflow.nextStepLabel,
    guardrails: buildBaseGuardrails([
      "Der Account zeigt keine Admin-Queue-Details als Nutzerwahrheit",
    ]),
    operationalTruthLabel: params.operationalTruthLabel,
    steps: [
      buildStep({
        id: "intake_received",
        label: "Beitrag aufgenommen",
        description: contributionStep?.summary ?? "Der Beitrag liegt als Entwurf vor.",
        status: "done",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Der Beitrag ist als Arbeitsstand vorhanden.",
        nextStep: params.workflow.nextStepLabel,
      }),
      buildStep({
        id: "language_bridge",
        label: "Sprache und Übersetzung",
        description:
          "Eine Sprach- oder Übersetzungsprüfung wird im Account erst sichtbar, wenn ein belastbarer Review- oder Dossierkontext existiert.",
        status: "not_started",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Noch keine belastbare Sprach- oder Übersetzungsprüfung sichtbar.",
        languageHint: "Sprachbrücken werden erst nach bewusstem Handoff serverseitig sichtbar.",
        internalReason: "missing_runtime_truth",
      }),
      buildStep({
        id: "topic_classification",
        label: "Thema und Einordnung",
        description: unique([classifiedStep?.summary ?? "", topicStep?.summary ?? ""])
          .join(" ")
          .trim(),
        status:
          topicStep?.status === "operational_basic" || classifiedStep?.status === "operational_basic"
            ? "done"
            : "prepared",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Die inhaltliche Einordnung ist als Arbeitsstand sichtbar.",
      }),
      buildStep({
        id: "format_recommendation",
        label: "Formatvorschlag",
        description:
          formatStep?.summary ??
          "Ein nächster Arbeitsmodus wird erst nach bewusstem Handoff belastbar.",
        status: formatStep ? mapWorkflowStageStatus(formatStep.status) : "not_started",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Ein nächster Arbeitsmodus ist vorbereitet, aber noch nicht automatisch gestartet.",
      }),
      buildStep({
        id: "evidence_pack",
        label: "Quellen- und Evidence-Pack",
        description: evidencePrepared
          ? reviewStep?.summary ??
            "Quellen- und Prüfhinweise sind vorbereitet, aber noch nicht als belastbare Runtime ausgeführt."
          : "Im Account ist noch kein belastbares Quellen- oder Evidence-Pack verknüpft.",
        status: evidencePrepared ? "prepared" : "blocked",
        audience: "user",
        reviewRequired: evidencePrepared,
        blocker: evidencePrepared
          ? "Quellenlage muss noch bewusst geprüft werden."
          : "Nutzergebundene Quellenwahrheit fehlt im Account noch.",
        publicSafeLabel: evidencePrepared
          ? "Quellen- oder Prüfhinweise sind vorbereitet."
          : "Noch kein belastbares Quellen- oder Evidence-Pack sichtbar.",
        evidenceHint: evidencePrepared
          ? "Die Prüfung bleibt review-first und startet nicht automatisch."
          : "Der Account zeigt hier bewusst keine erfundene Prüf- oder Quellenruntime.",
        internalReason: evidencePrepared ? "review_first_source_gate" : "missing_runtime_truth",
      }),
      buildStep({
        id: "claim_question_expansion",
        label: "Claims, Gegenpositionen und Fragen",
        description:
          classifiedStep?.summary ??
          "Claim-, Gegenpositions- und Fragenableitung wird erst nach weiterem Handoff belastbar.",
        status: classifiedStep ? mapWorkflowStageStatus(classifiedStep.status) : "not_started",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Ableitungen aus dem Beitrag sind nur als Arbeitsstand sichtbar.",
      }),
      buildStep({
        id: "dossier_candidate",
        label: "Dossier-Kandidat",
        description:
          dossierStep?.summary ?? "Noch kein belastbarer Dossier-Kandidat im Account sichtbar.",
        status: dossierStep ? mapWorkflowStageStatus(dossierStep.status) : "not_started",
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Ein Dossier-Kandidat bleibt bis nach Review nur vorbereitet.",
      }),
      buildStep({
        id: "participation_candidate",
        label: "Anlassraum oder Beteiligungsformat",
        description:
          participationStep?.summary ??
          "Noch kein Beteiligungsformat im Account sichtbar.",
        status: participationStep ? mapWorkflowStageStatus(participationStep.status) : "not_started",
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Beteiligungsformate bleiben bis zur Freigabe nur vorbereitet.",
      }),
      buildStep({
        id: "output_draft",
        label: "Social- und Output-Drafts",
        description:
          outputStep?.summary ??
          "Output- oder Social-Entwürfe sind im Account noch nicht belastbar sichtbar.",
        status: outputStep ? mapWorkflowStageStatus(outputStep.status) : "not_started",
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Output- und Social-Entwürfe bleiben bis nach Review nur Folgepfade.",
      }),
      buildStep({
        id: "voxy_briefing",
        label: "Voxy-Briefing und Skriptkandidat",
        description:
          voxyStep?.summary ??
          "Ein Voxy-Briefing wird erst mit echter Dossier- oder Output-Wahrheit sichtbar.",
        status: voxyStep ? mapWorkflowStageStatus(voxyStep.status) : "not_started",
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Voxy bleibt hier ein späterer reviewpflichtiger Kandidat.",
      }),
      buildStep({
        id: "review_gate",
        label: "Review und menschliche Prüfung",
        description:
          reviewStep?.summary ?? "Noch keine belastbare Review-Verknüpfung sichtbar.",
        status:
          reviewStep && reviewStep.status !== "readmodel_only"
            ? reviewStep.status === "operational_basic"
              ? "prepared"
              : mapWorkflowStageStatus(reviewStep.status)
            : "not_started",
        audience: "user",
        reviewRequired: true,
        requiredRole: "Redaktion oder zuständige Prüfung",
        publicSafeLabel: "Menschliche Prüfung bleibt erforderlich.",
        nextStep: params.workflow.nextStepLabel,
      }),
      buildStep({
        id: "provider_cost_gate",
        label: "Betrieb, Kosten und Freigaben",
        description:
          "Der Account zeigt noch keine nutzergebundene Review-, Dossier- oder Participation-Runtime als belastbare Wahrheit.",
        status: "blocked",
        audience: "user",
        reviewRequired: true,
        blocker: "Nutzergebundene Downstream-Runtime im Account fehlt noch.",
        publicSafeLabel: "Kosten-, Provider- und Runtime-Freigaben sind hier noch nicht belastbar sichtbar.",
        costHint:
          "Keine neue Abbuchung, kein KI-Run und keine verborgene Provider-Ausführung werden aus dem Account ausgelöst.",
        internalReason: "missing_runtime_truth",
      }),
    ],
  };
}

export function buildV3DownstreamKiTransparencyFromStartDraft(
  draft: StartDraftContext,
  workflow: V3AccountResumeWorkflowModel,
): V3DownstreamKiTransparencyModel {
  const operationalTruthLabel =
    draft.origin === "start_relevance_review"
      ? "Lokaler oder browsergestützter Review-Entwurf"
      : "Lokaler oder browsergestützter Draft-Kontext";
  return buildAccountTransparencyModel({
    workflow,
    operationalTruthLabel,
  });
}

export function buildV3DownstreamKiTransparencyFromLedgerBranch(params: {
  branch: CreateBranchLedgerItem;
  draftSaveStatus: CreateContributionLedgerDraftSaveStatus;
  handoff: CreateBranchHandoffTarget;
  workflow: V3AccountResumeWorkflowModel;
}): V3DownstreamKiTransparencyModel {
  const persistedLabel =
    params.draftSaveStatus === "server_saved"
      ? "Servergesicherter Ledger- und Branch-Arbeitsstand"
      : "Draft- oder Ledger-Arbeitsstand ohne gesicherte Downstream-Runtime";
  return buildAccountTransparencyModel({
    workflow: params.workflow,
    operationalTruthLabel: persistedLabel,
  });
}

function collectReviewItems(context: V3ReviewQueueWiringContext) {
  const items = context.primaryUnifiedItem
    ? [context.primaryUnifiedItem, ...context.unifiedItems]
    : context.unifiedItems;
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function buildV3DownstreamKiTransparencyFromReviewContext(
  context: V3ReviewQueueWiringContext,
  audience: "admin" | "workspace" = "admin",
): V3DownstreamKiTransparencyModel {
  const summary = buildV3ReviewContextSummaryModel(context, audience === "admin" ? "admin" : "workspace");
  const workflow = buildV3RuntimeWorkflowSurfaceFromReviewContext(context);
  const stages = new Map(workflow.stages.map((stage) => [stage.id, stage]));
  const items = collectReviewItems(context);
  const providerBlocker =
    summary.blockerLabels.find((label) =>
      containsKeyword([label], ["anbieter", "zugangsdaten", "laufzeit"]),
    ) ?? null;
  const evidenceBlocker =
    summary.blockerLabels.find((label) =>
      containsKeyword([label], ["quelle", "kontext", "sprach", "veraltet", "umstritten"]),
    ) ?? null;
  const reviewRoleLabel = summary.reviewerRoleLabels.join(", ");
  const reviewState = items.some((item) => item.queueState === "in_review")
    ? "in_review"
    : items.length > 0
      ? "prepared"
      : "not_started";
  const hasCostReview = items.some((item) => item.requiredReviewType === "cost_provider_review");
  const dossierStage = stages.get("dossier_workspace");
  const participationStage = stages.get("participation_candidates");
  const outputStage = stages.get("output_drafts");
  const voxyStage = stages.get("voxy_briefing");

  return {
    title: "KI-, Review- und Enrichment-Transparenz",
    summary:
      "Die bestehende Review-Queue, der Dossier-Workspace und nachgelagerte Drafts werden als ehrlicher Handoff-Layer sichtbar gemacht.",
    nextStepLabel: summary.nextStepLabel,
    guardrails: buildBaseGuardrails([
      audience === "admin"
        ? "Review-Ready ist nicht Approved und Publish-Ready ist nicht Published"
        : "Vorschläge und Drafts bleiben bis zur Prüfung unveröffentlicht",
    ]),
    operationalTruthLabel:
      audience === "admin"
        ? "Bestehender V3-Review- und Runtime-Kontext"
        : "Bestehender Workspace- und Review-Kontext",
    steps: [
      buildStep({
        id: "intake_received",
        label: "Beitrag aufgenommen",
        description:
          items[0]?.summary ??
          "Ein bestehender Create- oder Review-Handoff ist im Kontext sichtbar.",
        status: items.length > 0 ? "done" : "not_started",
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: false,
        publicSafeLabel: "Der Beitrag liegt als bestehender Review- oder Workspace-Kontext vor.",
      }),
      buildStep({
        id: "language_bridge",
        label: "Sprache und Übersetzung",
        description: summary.languageLine,
        status: context.languageBridge
          ? summary.blockerLabels.some((label) => label.includes("Sprach"))
            ? "prepared"
            : "done"
          : "not_started",
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: Boolean(context.languageBridge),
        requiredRole: context.languageBridge ? "Sprachprüfung" : null,
        publicSafeLabel: context.languageBridge
          ? "Die Sprachbrücke ist sichtbar und bleibt prüfbar."
          : "Noch keine belastbare Sprachbrücke im Kontext sichtbar.",
        languageHint: context.languageBridge
          ? summary.languageLine
          : "Ohne bestehende Sprachbrücke wird keine Übersetzungsruntime behauptet.",
      }),
      buildStep({
        id: "topic_classification",
        label: "Thema und Einordnung",
        description:
          items[0]?.title
            ? `Der aktuelle Arbeitskontext läuft über ${items[0].title}.`
            : "Noch kein belastbarer Themenkontext sichtbar.",
        status: items.length > 0 ? "done" : "not_started",
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: false,
        publicSafeLabel: "Die inhaltliche Einordnung ist im bestehenden Arbeitsfluss sichtbar.",
      }),
      buildStep({
        id: "format_recommendation",
        label: "Formatvorschlag",
        description:
          stages.get("create_handoff")?.summary ??
          "Noch kein belastbarer Handoff für einen nächsten Arbeitsmodus sichtbar.",
        status: mapWorkflowStageStatus(stages.get("create_handoff")?.status ?? "readmodel_only"),
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: false,
        publicSafeLabel: "Der nächste Arbeitsmodus bleibt ein review-first Handoff.",
      }),
      buildStep({
        id: "evidence_pack",
        label: "Quellen- und Evidence-Pack",
        description: summary.evidenceLine,
        status: !context.sourcePack ? "blocked" : evidenceBlocker ? "prepared" : "done",
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: Boolean(context.sourcePack),
        requiredRole: context.sourcePack ? "Quellenprüfung" : null,
        blocker: !context.sourcePack
          ? "Noch kein belastbares Quellenpaket sichtbar."
          : evidenceBlocker,
        evidenceHint: summary.evidenceLine,
        publicSafeLabel: context.sourcePack
          ? "Quellenlage und Evidenz bleiben prüfbar und review-first."
          : "Ohne Quellenpaket wird keine Evidence-Runtime behauptet.",
      }),
      buildStep({
        id: "claim_question_expansion",
        label: "Claims, Gegenpositionen und Fragen",
        description:
          dossierStage?.status === "operational_basic"
            ? dossierStage.summary
            : "Claim-, Gegenpositions- und Fragenpfade bleiben bis zum Dossier- oder Review-Kontext vorbereitet.",
        status:
          dossierStage?.status === "operational_basic"
            ? "done"
            : items.length > 0
              ? "prepared"
              : "not_started",
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: items.length > 0,
        publicSafeLabel: "Inhaltliche Ableitungen bleiben bis zur Prüfung Arbeitsentwürfe.",
      }),
      buildStep({
        id: "dossier_candidate",
        label: "Dossier-Kandidat",
        description:
          dossierStage?.summary ?? "Ein Dossier-Kandidat ist im aktuellen Kontext noch nicht sichtbar.",
        status: mapWorkflowStageStatus(dossierStage?.status ?? "readmodel_only"),
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: true,
        publicSafeLabel: "Ein Dossier-Kandidat bleibt bis nach Review ein vorbereiteter Arbeitsstand.",
      }),
      buildStep({
        id: "participation_candidate",
        label: "Anlassraum oder Beteiligungsformat",
        description:
          participationStage?.summary ??
          "Beteiligungs- oder Anlassraumkandidaten sind noch nicht belastbar sichtbar.",
        status: mapWorkflowStageStatus(participationStage?.status ?? "readmodel_only"),
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: Boolean(context.participationCandidates.length),
        publicSafeLabel: "Beteiligungskandidaten bleiben bis zur Freigabe nur vorbereitet.",
      }),
      buildStep({
        id: "output_draft",
        label: "Social- und Output-Drafts",
        description:
          outputStage?.summary ?? "Noch keine belastbaren Output- oder Social-Drafts sichtbar.",
        status: mapWorkflowStageStatus(outputStage?.status ?? "readmodel_only"),
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: Boolean(context.socialOutputDrafts.length),
        publicSafeLabel: "Output-Drafts bleiben reviewpflichtige Entwürfe und keine Veröffentlichung.",
      }),
      buildStep({
        id: "voxy_briefing",
        label: "Voxy-Briefing und Skriptkandidat",
        description:
          voxyStage?.summary ?? "Noch kein belastbarer Voxy-Kontext sichtbar.",
        status:
          providerBlocker && voxyStage?.status !== "readmodel_only"
            ? "blocked"
            : mapWorkflowStageStatus(voxyStage?.status ?? "readmodel_only"),
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: Boolean(context.voxyBriefing),
        requiredRole: context.voxyBriefing ? "Voxy-Skriptprüfung" : null,
        blocker: providerBlocker && voxyStage?.status !== "readmodel_only" ? providerBlocker : null,
        publicSafeLabel: "Voxy bleibt ein reviewpflichtiger Briefing- oder Skriptkandidat.",
      }),
      buildStep({
        id: "review_gate",
        label: "Review und menschliche Prüfung",
        description:
          `Rollen: ${reviewRoleLabel}. Status: ${summary.statusLabels.join(" · ")}`,
        status: reviewState,
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: items.length > 0,
        requiredRole: reviewRoleLabel || null,
        publicSafeLabel: "Menschliche Prüfung bleibt auf diesem Pfad verpflichtend.",
        nextStep: summary.nextStepLabel,
      }),
      buildStep({
        id: "provider_cost_gate",
        label: "Betrieb, Kosten und Freigaben",
        description:
          providerBlocker
            ? `Technische oder betriebliche Blocker: ${summary.blockerLabels.join(" · ")}`
            : hasCostReview
              ? "Kosten- oder Anbieterprüfung ist als bestehender Review-Schritt markiert."
              : "Kosten-, Provider- und Entitlement-Prüfung werden nur gezeigt, wenn der bestehende Kontext sie wirklich trägt.",
        status: providerBlocker ? "blocked" : hasCostReview ? "prepared" : "not_started",
        audience: audience === "admin" ? "admin" : "reviewer",
        reviewRequired: providerBlocker !== null || hasCostReview,
        requiredRole: hasCostReview ? "Kosten-/Anbieterprüfung" : null,
        blocker: providerBlocker,
        publicSafeLabel:
          "Technische, Provider- oder Kostenfreigaben bleiben sichtbare Prüfgrenzen und starten nichts automatisch.",
        costHint:
          "Es wird keine neue Abrechnung gebaut und keine verborgene Provider-Ausführung ausgelöst.",
        internalReason: providerBlocker ? "runtime_or_provider_blocker" : hasCostReview ? "cost_provider_review" : null,
      }),
    ],
  };
}

export function buildV3DownstreamKiTransparencyFromCreateCandidatePreview(
  model: CreateCandidatePreviewReadModel,
): V3DownstreamKiTransparencyModel {
  const workflow = buildV3RuntimeWorkflowSurfaceFromCreateCandidatePreview(model);
  const stages = new Map(workflow.stages.map((stage) => [stage.id, stage]));
  const claimCount = model.sections
    .filter((section) => section.kind === "claim" || section.kind === "counter_position" || section.kind === "question")
    .reduce((total, section) => total + section.items.length, 0);
  const hasParticipationPreview = model.reviewHandoff.items.some((item) => item.candidateType === "poll");
  const hasEvidenceHints =
    model.feedEnrichmentSuggestions.hasSuggestions ||
    model.reviewHandoff.items.some((item) => item.evidenceRefs.length > 0) ||
    Boolean(model.provider);
  const runtimeTruthMissing =
    model.providerRuntimeTruth === "missing_runtime_truth" ||
    model.reviewHandoff.items.some((item) => item.missingRuntimeTruth.length > 0) ||
    Boolean(model.claimToDossierPipeline.dossierRuntimeHandoff?.missingRuntimeTruth.length) ||
    Boolean(model.claimToDossierPipeline.dossierGraphAnlassraumHandoff?.feedEnrichmentRefs.length === 0);

  return {
    title: "KI-, Review- und Enrichment-Transparenz",
    summary:
      "Der Create-Folgepfad zeigt nur vorbereitete Downstream-Schritte. Keine spätere Runtime wird als bereits aktiv behauptet.",
    nextStepLabel: "Entwurf prüfen, bewusst weiterführen oder Review-Handoff vorbereiten.",
    guardrails: buildBaseGuardrails([
      "Kein Auto-Dossier, kein Auto-Anlassraum, kein Auto-DeepSearch",
    ]),
    operationalTruthLabel:
      model.providerRuntimeTruth === "present"
        ? "Create-Preview mit belastbarer Analyze- oder Planner-Spur"
        : "Create-Preview ohne belastbare Downstream-Runtime",
    steps: [
      buildStep({
        id: "intake_received",
        label: "Beitrag aufgenommen",
        description: model.summary,
        status: "done",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Der Beitrag ist im Create-Folgepfad aufgenommen.",
      }),
      buildStep({
        id: "language_bridge",
        label: "Sprache und Übersetzung",
        description:
          "Der aktuelle Create-Preview zeigt noch keine belastbare Sprachbrücke oder Übersetzungsprüfung.",
        status: "not_started",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Noch keine belastbare Sprach- oder Übersetzungsprüfung sichtbar.",
        languageHint: "Sprachprüfung bleibt ein späterer review-first Schritt.",
        internalReason: "missing_runtime_truth",
      }),
      buildStep({
        id: "topic_classification",
        label: "Thema und Einordnung",
        description: model.title,
        status: "done",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Die inhaltliche Einordnung ist als Preview sichtbar.",
      }),
      buildStep({
        id: "format_recommendation",
        label: "Formatvorschlag",
        description:
          stages.get("create_handoff")?.summary ??
          "Ein nächster Handoff ist vorbereitet, startet aber nicht automatisch.",
        status: "prepared",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Ein nächster Arbeitsmodus ist vorbereitet, aber noch nicht gestartet.",
      }),
      buildStep({
        id: "evidence_pack",
        label: "Quellen- und Evidence-Pack",
        description: hasEvidenceHints
          ? model.feedEnrichmentSuggestions.summary
          : "Noch kein belastbares Quellen- oder Evidence-Pack im Preview sichtbar.",
        status: hasEvidenceHints ? "prepared" : "blocked",
        audience: "user",
        reviewRequired: hasEvidenceHints,
        blocker: hasEvidenceHints ? "Quellen- und Evidence-Prüfung bleibt offen." : "Belastbare Quellenwahrheit fehlt noch.",
        evidenceHint: hasEvidenceHints
          ? "Vorhandene Hinweise bleiben Review-Hinweise und keine verifizierten Quellen."
          : "Ohne Quellenwahrheit wird keine Evidence-Runtime behauptet.",
        publicSafeLabel: hasEvidenceHints
          ? "Quellen- oder Evidence-Hinweise sind vorbereitet."
          : "Noch kein belastbares Quellen- oder Evidence-Pack sichtbar.",
        internalReason: hasEvidenceHints ? "review_first_source_gate" : "missing_runtime_truth",
      }),
      buildStep({
        id: "claim_question_expansion",
        label: "Claims, Gegenpositionen und Fragen",
        description:
          claimCount > 0
            ? `${claimCount} Claim-, Gegenpositions- oder Fragenkandidaten sind als Review-Entwurf vorbereitet.`
            : "Noch keine belastbaren Ableitungen aus dem Beitrag sichtbar.",
        status: claimCount > 0 ? "prepared" : "not_started",
        audience: "user",
        reviewRequired: false,
        publicSafeLabel: "Inhaltliche Ableitungen bleiben bis zur Prüfung Arbeitsentwürfe.",
      }),
      buildStep({
        id: "dossier_candidate",
        label: "Dossier-Kandidat",
        description:
          model.claimToDossierPipeline.summary,
        status:
          model.claimToDossierPipeline.hasPreparedPipeline
            ? "prepared"
            : mapWorkflowStageStatus(stages.get("dossier_workspace")?.status ?? "readmodel_only"),
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Ein Dossier-Kandidat bleibt bis zum Review nur vorbereitet.",
      }),
      buildStep({
        id: "participation_candidate",
        label: "Anlassraum oder Beteiligungsformat",
        description: hasParticipationPreview
          ? "Ein Beteiligungsformat ist im Review-Handoff vorbereitet, aber noch nicht aktiviert."
          : stages.get("participation_candidates")?.summary ??
            "Noch kein Beteiligungsformat im aktuellen Preview sichtbar.",
        status: hasParticipationPreview ? "prepared" : mapWorkflowStageStatus(stages.get("participation_candidates")?.status ?? "readmodel_only"),
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Beteiligungsformate bleiben bis zur Freigabe nur vorbereitet.",
      }),
      buildStep({
        id: "output_draft",
        label: "Social- und Output-Drafts",
        description:
          "Social-, Output- oder Studiodrafts entstehen erst nach Review und weiterem Dossierkontext.",
        status: "not_started",
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Output- und Social-Drafts sind hier noch nicht aktiv.",
      }),
      buildStep({
        id: "voxy_briefing",
        label: "Voxy-Briefing und Skriptkandidat",
        description:
          "Voxy bleibt nachgelagert und wird im Create-Preview noch nicht als aktive Runtime geführt.",
        status: "not_started",
        audience: "user",
        reviewRequired: true,
        publicSafeLabel: "Voxy bleibt hier ein späterer reviewpflichtiger Kandidat.",
      }),
      buildStep({
        id: "review_gate",
        label: "Review und menschliche Prüfung",
        description: model.reviewHandoff.summary,
        status: model.reviewHandoff.hasPreparedHandoff ? "prepared" : "not_started",
        audience: "user",
        reviewRequired: true,
        requiredRole: "Redaktion oder zuständige Prüfung",
        publicSafeLabel: "Menschliche Prüfung bleibt erforderlich.",
        nextStep: "Review-Handoff prüfen oder den Entwurf weiterbearbeiten.",
      }),
      buildStep({
        id: "provider_cost_gate",
        label: "Betrieb, Kosten und Freigaben",
        description:
          model.providerRuntimeTruth === "present"
            ? "Analyze- oder Planner-Herkunft ist sichtbar, aber spätere Kosten-, Limit- oder Entitlement-Prüfungen bleiben offen."
            : "Belastbare Provider- oder Downstream-Runtime fehlt noch.",
        status: runtimeTruthMissing ? "blocked" : "prepared",
        audience: "user",
        reviewRequired: true,
        blocker: runtimeTruthMissing ? "Belastbare Downstream-Runtime oder Kostenfreigabe fehlt noch." : null,
        publicSafeLabel:
          "Provider-, Kosten- und Freigabefragen bleiben sichtbare Guardrails und starten nichts automatisch.",
        costHint:
          "Keine neue Abrechnung, keine Debit-Logik und kein DeepSearch-Autostart werden aus diesem Preview erzeugt.",
        internalReason: runtimeTruthMissing ? "missing_runtime_truth" : "needs_cost_preflight",
      }),
    ],
  };
}

export default function V3DownstreamKiTransparency(props: {
  model: V3DownstreamKiTransparencyModel;
  title?: string;
  dataTestId?: string;
}) {
  const title = props.title ?? props.model.title;

  return (
    <section
      data-testid={props.dataTestId}
      className="mt-4 rounded-[1.5rem] border border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_94%,rgb(var(--bg))_6%)] px-4 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Downstream-Transparenz
          </p>
          <h3 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{props.model.summary}</p>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Belastbare Wahrheit</p>
          <p className="mt-1">{props.model.operationalTruthLabel}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--muted))]">
          Nächster Schritt: {props.model.nextStepLabel}
        </span>
        {props.model.guardrails.map((guardrail) => (
          <span
            key={`${title}-${guardrail}`}
            className="rounded-full border border-[rgb(var(--border))] px-2.5 py-1 text-[rgb(var(--muted))]"
          >
            {guardrail}
          </span>
        ))}
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {props.model.steps.map((step) => (
          <article
            key={step.id}
            data-v3-downstream-step={step.id}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[rgb(var(--fg))]">{step.label}</span>
              <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">
                {statusLabel(step.status)}
              </span>
              {step.reviewRequired ? (
                <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                  Review erforderlich
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{step.publicSafeLabel}</p>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{step.description}</p>
            {step.requiredRole ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                Rolle: {step.requiredRole}
              </p>
            ) : null}
            {step.blocker ? (
              <p className="mt-2 text-xs leading-5 text-amber-800">Blocker: {step.blocker}</p>
            ) : null}
            {step.evidenceHint ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                Quellenlage: {step.evidenceHint}
              </p>
            ) : null}
            {step.languageHint ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                Sprache: {step.languageHint}
              </p>
            ) : null}
            {step.costHint ? (
              <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                Betrieb: {step.costHint}
              </p>
            ) : null}
            {step.nextStep ? (
              <p className="mt-2 text-xs font-medium leading-5 text-[rgb(var(--fg))]">
                Nächster Schritt: {step.nextStep}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

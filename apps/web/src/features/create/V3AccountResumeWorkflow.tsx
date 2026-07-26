import type { CreateBranchHandoffTarget } from "@/features/create/branchHandoffTargets";
import type {
  CreateBranchLedgerItem,
  CreateContributionLedgerDraftSaveStatus,
} from "@features/create/createContributionLedger";
import type { StartDraftContext } from "@/features/start/startDraftContext";
import type { V3RuntimeWorkflowStageStatus } from "@/features/create/V3RuntimeWorkflowSurface";

export type V3AccountResumeWorkflowStepId =
  | "contribution_received"
  | "contribution_classified"
  | "topic_linkage"
  | "format_recommendation"
  | "review_or_clarification"
  | "dossier_candidate"
  | "participation_candidate"
  | "output_candidate"
  | "voxy_candidate";

export type V3AccountResumeWorkflowStep = {
  id: V3AccountResumeWorkflowStepId;
  label: string;
  status: V3RuntimeWorkflowStageStatus;
  summary: string;
};

export type V3AccountResumeWorkflowModel = {
  title: string;
  summary: string;
  currentStatusLabel: string;
  nextStepLabel: string;
  steps: V3AccountResumeWorkflowStep[];
  guardrails: string[];
};

function userStatusLabel(value: V3RuntimeWorkflowStageStatus): string {
  if (value === "operational_basic") return "sichtbar";
  if (value === "preview_only") return "vorbereitet";
  if (value === "readmodel_only") return "später möglich";
  if (value === "blocked_by_provider") return "technisch offen";
  if (value === "blocked_by_secret") return "technisch gesperrt";
  if (value === "blocked_by_runtime_truth") return "technisch blockiert";
  return "noch nicht belastbar";
}

function buildStep(
  id: V3AccountResumeWorkflowStepId,
  label: string,
  status: V3RuntimeWorkflowStageStatus,
  summary: string,
): V3AccountResumeWorkflowStep {
  return { id, label, status, summary };
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function relevanceLabel(value: string | null | undefined): string {
  if (value === "public_relevant") return "Öffentliche Relevanz erkannt";
  if (value === "needs_reframe") return "Öffentliche Relevanz noch offen";
  if (value === "personal_only") return "Öffentlicher Bezug noch unklar";
  if (value === "spam_suspected") return "Überarbeitung erforderlich";
  if (value === "abusive_or_empty") return "Kein tragfähiger Entwurf";
  return "Einordnung als Entwurf";
}

function currentStatusForStartDraft(draft: StartDraftContext): string {
  if (draft.preview?.relevance === "spam_suspected" || draft.preview?.relevance === "abusive_or_empty") {
    return "Überarbeitung erforderlich";
  }
  if (draft.origin === "start_relevance_review") return "Rückfrage oder Review erforderlich";
  if (draft.targetHint === "rounds") return "Beteiligungsentwurf vorbereitet";
  if (draft.targetHint === "themes") return "Themenanschluss vorbereitet";
  if (draft.origin === "start_create_light") return "Beitrag klassifiziert";
  return "Entwurf aufgenommen";
}

function nextStepForStartDraft(draft: StartDraftContext): string {
  if (
    draft.preview?.relevance === "needs_reframe" ||
    draft.preview?.relevance === "personal_only" ||
    (draft.preview?.openQuestions?.length ?? 0) > 0
  ) {
    return "Rückfrage beantworten";
  }
  if (draft.targetHint === "rounds") return "Beteiligungsformat prüfen";
  if (draft.targetHint === "themes") return "Themenanschluss prüfen";
  if (draft.origin === "start_create_light") return "Entwurf analysieren";
  return "Entwurf weiterbearbeiten";
}

export function buildV3AccountResumeWorkflowFromStartDraft(
  draft: StartDraftContext,
): V3AccountResumeWorkflowModel {
  const possibleTopics = draft.preview?.possibleTopics ?? [];
  const openQuestions = draft.preview?.openQuestions ?? [];
  const suggestedNextSteps = draft.preview?.suggestedNextSteps ?? [];
  const reviewStatus: V3RuntimeWorkflowStageStatus =
    draft.origin === "start_relevance_review"
      ? "operational_basic"
      : openQuestions.length > 0
        ? "preview_only"
        : draft.preview?.relevance === "spam_suspected" || draft.preview?.relevance === "abusive_or_empty"
          ? "blocked_by_runtime_truth"
          : "readmodel_only";

  return {
    title: "Was wurde aus deinem Beitrag?",
    summary:
      "Der Arbeitsstand bleibt im Account sichtbar, ohne daraus Veröffentlichung, Freigabe oder eine aktive Runtime zu behaupten.",
    currentStatusLabel: currentStatusForStartDraft(draft),
    nextStepLabel: nextStepForStartDraft(draft),
    steps: [
      buildStep(
        "contribution_received",
        "Beitrag erhalten",
        "operational_basic",
        "Dein Text liegt als Entwurf vor und bleibt weiter bearbeitbar.",
      ),
      buildStep(
        "contribution_classified",
        "Beitrag klassifiziert",
        draft.preview ? "operational_basic" : "preview_only",
        draft.preview
          ? relevanceLabel(draft.preview.relevance)
          : "Die Einordnung wird erst mit der nächsten bewussten Analyse belastbar.",
      ),
      buildStep(
        "topic_linkage",
        "Thema / Anschluss erkannt",
        possibleTopics.length > 0 ? "preview_only" : "readmodel_only",
        possibleTopics.length > 0
          ? `Mögliche Anschlüsse: ${possibleTopics.slice(0, 2).join(" · ")}`
          : "Ein Themenanschluss wird erst nach weiterem Handoff oder Review sichtbar.",
      ),
      buildStep(
        "format_recommendation",
        "Formatvorschlag vorhanden",
        draft.targetHint ? "preview_only" : "readmodel_only",
        draft.targetHint === "rounds"
          ? "Der Entwurf kann in einen manuellen Anlassraum- oder Beteiligungspfad weitergeführt werden."
          : draft.targetHint === "themes"
            ? "Der Entwurf kann an bestehende Themen angeschlossen werden."
            : suggestedNextSteps.length > 0
              ? suggestedNextSteps[0]!
              : "Ein nächster Arbeitsmodus ist vorbereitet, aber noch nicht automatisch gestartet.",
      ),
      buildStep(
        "review_or_clarification",
        "Review oder Rückfrage",
        reviewStatus,
        draft.origin === "start_relevance_review"
          ? "Es fehlt noch eine Rückfrage zur öffentlichen Einordnung oder eine redaktionelle Sichtung."
          : openQuestions.length > 0
            ? `Offene Rückfragen: ${openQuestions.slice(0, 2).join(" · ")}`
            : "Noch keine Review-Vormerkung oder Rückfrage sichtbar.",
      ),
      buildStep(
        "dossier_candidate",
        "Dossier-Kandidat",
        draft.origin === "start_create_light" ? "preview_only" : "readmodel_only",
        draft.origin === "start_create_light"
          ? "Ein Dossier-Kandidat kann erst nach bewusstem Review- oder Create-Handoff belastbar werden."
          : "Noch kein belastbarer Dossier-Kandidat sichtbar.",
      ),
      buildStep(
        "participation_candidate",
        "Anlassraum / Beteiligung",
        draft.targetHint === "rounds" ? "preview_only" : "readmodel_only",
        draft.targetHint === "rounds"
          ? "Der Beteiligungspfad ist vorbereitet, aber noch nicht öffentlich aktiviert."
          : "Ein Beteiligungsformat ist für diesen Entwurf noch nicht vorbereitet.",
      ),
      buildStep(
        "output_candidate",
        "Output / Social",
        "readmodel_only",
        "Output-, Social- oder Briefing-Entwürfe entstehen erst nach Review und weiterem Dossier-Kontext.",
      ),
      buildStep(
        "voxy_candidate",
        "Voxy-Briefing",
        "readmodel_only",
        "Ein Voxy-Briefing ist hier noch nicht belastbar vorbereitet.",
      ),
    ],
    guardrails: [
      "Noch nicht veröffentlicht",
      "Review bleibt erforderlich",
      "Keine automatische Aktivierung",
    ],
  };
}

function currentStatusForLedgerBranch(
  branch: CreateBranchLedgerItem,
  draftSaveStatus: CreateContributionLedgerDraftSaveStatus,
): string {
  if (draftSaveStatus === "server_failed" || branch.status === "server_failed") {
    return "Serverspeicherung offen";
  }
  if (branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered") {
    return "Rückfrage nötig";
  }
  if (branch.reviewPreparationDraft || branch.needsReview) {
    return "Review erforderlich";
  }
  if (
    branch.qrParticipationDraft ||
    branch.swipeDraft ||
    branch.status === "qr_draft_prepared" ||
    branch.status === "swipe_draft_prepared"
  ) {
    return "Beteiligungsformat vorbereitet";
  }
  if (branch.targetReference?.type === "dossier") {
    return "Dossier-Anschluss erkannt";
  }
  if (branch.existingMatchDecision || (branch.localIssueCandidates?.length ?? 0) > 0) {
    return "Themenanschluss erkannt";
  }
  return "Beitrag klassifiziert";
}

function nextStepForLedgerBranch(
  branch: CreateBranchLedgerItem,
  handoff: CreateBranchHandoffTarget,
): string {
  if (branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered") {
    return "Rückfrage beantworten";
  }
  if ((branch.reviewPreparationDraft?.sourceNeeds.length ?? 0) > 0) {
    return "Quellenprüfung offen";
  }
  if ((branch.reviewPreparationDraft?.openQuestions.length ?? 0) > 0) {
    return "Rückfrage beantworten";
  }
  if (branch.reviewPreparationDraft || branch.needsReview) {
    return "Redaktionelle Prüfung offen";
  }
  if (
    branch.qrParticipationDraft ||
    branch.swipeDraft ||
    branch.status === "qr_draft_prepared" ||
    branch.status === "swipe_draft_prepared" ||
    handoff.handoffTargetType === "qr_participation" ||
    handoff.handoffTargetType === "swipe_review"
  ) {
    return "Beteiligungsformat prüfen";
  }
  if (branch.targetReference?.type === "dossier") {
    return "Dossier vorbereiten";
  }
  if (handoff.handoffTargetType === "factcheck_review") {
    return "Quellenprüfung offen";
  }
  return handoff.nextWorkspaceLabel;
}

function topicLinkageSummary(branch: CreateBranchLedgerItem): string {
  if (branch.targetReference) {
    return `Möglicher Anschluss an ${branch.targetReference.title}.`;
  }
  if (branch.existingMatchDecision) {
    return `Möglicher Anschluss an ${branch.existingMatchDecision.targetTitle}.`;
  }
  const signals = unique([
    ...(branch.localIssueCandidates ?? []),
    ...(branch.placeCandidates ?? []),
  ]);
  if (signals.length > 0) {
    return `Erkannte Signale: ${signals.slice(0, 3).join(" · ")}`;
  }
  return "Ein eigener Themenast wurde erkannt, aber ohne belastbaren Anschluss an bestehende Runtime.";
}

function formatRecommendationSummary(
  branch: CreateBranchLedgerItem,
  handoff: CreateBranchHandoffTarget,
): string {
  if (handoff.handoffTargetType === "place_clarification") {
    return "Vor dem nächsten Format fehlt noch eine Orts- oder Zuständigkeitsklärung.";
  }
  if (handoff.handoffTargetType === "factcheck_review") {
    return "Prüf- und Quellenpfad ist vorbereitet, startet aber nicht automatisch.";
  }
  if (handoff.handoffTargetType === "qr_participation") {
    return "Ein Beteiligungsentwurf mit Frage und Guardrails ist vorbereitet.";
  }
  if (handoff.handoffTargetType === "swipe_review") {
    return "Ein Swipe-Entwurf ist vorbereitet, bleibt aber noch nicht öffentlich.";
  }
  if (branch.selectedAction === "attach_existing") {
    return "Ein Anschluss an ein bestehendes Thema ist als Entwurf vorgemerkt.";
  }
  return "Der Beitrag bleibt als Entwurf gesichert, ohne zusätzlichen Format-Handoff.";
}

export function buildV3AccountResumeWorkflowFromLedgerBranch(params: {
  branch: CreateBranchLedgerItem;
  draftSaveStatus: CreateContributionLedgerDraftSaveStatus;
  handoff: CreateBranchHandoffTarget;
}): V3AccountResumeWorkflowModel {
  const { branch, draftSaveStatus, handoff } = params;
  const claimCandidatesLength = branch.claimCandidates?.length ?? 0;
  const reviewStatus: V3RuntimeWorkflowStageStatus =
    branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered"
      ? "operational_basic"
      : branch.reviewPreparationDraft || branch.needsReview
        ? "operational_basic"
        : "readmodel_only";
  const dossierStatus: V3RuntimeWorkflowStageStatus =
    branch.targetReference?.type === "dossier"
      ? "operational_basic"
      : branch.reviewPreparationDraft || branch.handoffTargetType === "factcheck_review"
        ? "preview_only"
        : "readmodel_only";
  const participationStatus: V3RuntimeWorkflowStageStatus =
    branch.qrParticipationDraft || branch.swipeDraft
      ? "operational_basic"
      : handoff.handoffTargetType === "qr_participation" || handoff.handoffTargetType === "swipe_review"
        ? "preview_only"
        : "readmodel_only";
  const outputStatus: V3RuntimeWorkflowStageStatus =
    branch.targetReference?.type === "dossier" || branch.reviewPreparationDraft
      ? "preview_only"
      : "readmodel_only";

  return {
    title: "Was wurde aus deinem Beitrag?",
    summary:
      "Der Account zeigt den vorhandenen Arbeitsstand aus Entwurf, Review-Vorbereitung und möglichen Folgeformaten, ohne Veröffentlichung oder Freigabe vorzutäuschen.",
    currentStatusLabel: currentStatusForLedgerBranch(branch, draftSaveStatus),
    nextStepLabel: nextStepForLedgerBranch(branch, handoff),
    steps: [
      buildStep(
        "contribution_received",
        "Beitrag erhalten",
        "operational_basic",
        draftSaveStatus === "server_saved"
          ? "Dein Beitrag wurde dauerhaft als Arbeitsstand gesichert."
          : draftSaveStatus === "server_failed"
            ? "Dein Beitrag ist als Entwurf vorhanden, aber die Serverspeicherung bleibt offen."
            : "Dein Beitrag liegt derzeit nur als lokaler oder vorläufiger Entwurf vor.",
      ),
      buildStep(
        "contribution_classified",
        "Beitrag klassifiziert",
        "operational_basic",
        claimCandidatesLength > 0
          ? `${claimCandidatesLength} Claim-, Frage- oder Positionssignale wurden erkannt.`
          : "Der Beitrag wurde als eigener Themenast eingeordnet.",
      ),
      buildStep(
        "topic_linkage",
        "Thema / Anschluss erkannt",
        branch.targetReference ||
        branch.existingMatchDecision ||
        (branch.localIssueCandidates?.length ?? 0) > 0 ||
        (branch.placeCandidates?.length ?? 0) > 0
          ? "operational_basic"
          : "preview_only",
        topicLinkageSummary(branch),
      ),
      buildStep(
        "format_recommendation",
        "Formatvorschlag vorhanden",
        handoff.handoffTargetType === "ledger_detail" ? "readmodel_only" : "operational_basic",
        formatRecommendationSummary(branch, handoff),
      ),
      buildStep(
        "review_or_clarification",
        "Review oder Rückfrage",
        reviewStatus,
        branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered"
          ? branch.placeClarificationQuestion ?? "Es fehlt noch eine Rückfrage zu Ort oder Zuständigkeit."
          : branch.reviewPreparationDraft?.openQuestions.length
            ? `Offene Rückfragen: ${branch.reviewPreparationDraft.openQuestions.slice(0, 2).join(" · ")}`
            : branch.reviewPreparationDraft?.sourceNeeds.length
              ? `Offene Prüfpfade: ${branch.reviewPreparationDraft.sourceNeeds.slice(0, 2).join(" · ")}`
              : "Noch keine zusätzliche Review-Vormerkung sichtbar.",
      ),
      buildStep(
        "dossier_candidate",
        "Dossier-Kandidat",
        dossierStatus,
        branch.targetReference?.type === "dossier"
          ? `Ein Anschluss an das Dossier ${branch.targetReference.title} ist bereits sichtbar.`
          : branch.reviewPreparationDraft || handoff.handoffTargetType === "factcheck_review"
            ? "Daraus könnte nach Prüfung ein Dossier-Kandidat entstehen."
            : "Noch kein belastbarer Dossier-Kandidat sichtbar.",
      ),
      buildStep(
        "participation_candidate",
        "Anlassraum / Beteiligung",
        participationStatus,
        branch.qrParticipationDraft
          ? "Ein QR-Beteiligungsentwurf ist vorbereitet, aber noch nicht geteilt oder veröffentlicht."
          : branch.swipeDraft
            ? "Ein Swipe-Entwurf ist vorbereitet, bleibt aber noch nicht öffentlich oder gezählt."
            : handoff.handoffTargetType === "qr_participation" || handoff.handoffTargetType === "swipe_review"
              ? "Ein Beteiligungsformat ist vorbereitet, aber noch nicht aktiv."
              : "Noch kein Beteiligungsformat sichtbar.",
      ),
      buildStep(
        "output_candidate",
        "Output / Social",
        outputStatus,
        branch.targetReference?.type === "dossier" || branch.reviewPreparationDraft
          ? "Output-, Social- oder Briefing-Entwürfe bleiben bis nach Review nur vorbereitete Folgepfade."
          : "Noch keine belastbaren Output- oder Social-Entwürfe sichtbar.",
      ),
      buildStep(
        "voxy_candidate",
        "Voxy-Briefing",
        "readmodel_only",
        "Ein Voxy-Briefing wird im Account erst sichtbar, wenn dafür echte Dossier- oder Output-Wahrheit vorliegt.",
      ),
    ],
    guardrails: unique([
      "Noch nicht veröffentlicht",
      branch.qrParticipationDraft ? "Noch kein QR-Link erzeugt" : "",
      branch.swipeDraft ? "Noch nicht gezählt" : "",
      branch.reviewPreparationDraft || branch.needsReview ? "Review bleibt erforderlich" : "Keine automatische Freigabe",
    ]),
  };
}

export default function V3AccountResumeWorkflow(props: {
  model: V3AccountResumeWorkflowModel;
  dataTestId?: string;
}) {
  return (
    <section
      data-testid={props.dataTestId}
      className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--bg))_8%)] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
        {props.model.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{props.model.summary}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Aktueller Status: {props.model.currentStatusLabel}
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Nächster Schritt: {props.model.nextStepLabel}
        </span>
      </div>

      <div className="mt-4 grid gap-2 xl:grid-cols-2">
        {props.model.steps.map((step) => (
          <article
            key={step.id}
            data-v3-account-workflow-step={step.id}
            data-v3-account-workflow-status={userStatusLabel(step.status)}
            className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-3 py-3 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[rgb(var(--fg))]">{step.label}</span>
              <span className="rounded-full border border-slate-300/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                {userStatusLabel(step.status)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{step.summary}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {props.model.guardrails.map((guardrail) => (
          <span
            key={`${props.model.currentStatusLabel}-${guardrail}`}
            className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[11px] text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]"
          >
            {guardrail}
          </span>
        ))}
      </div>
    </section>
  );
}

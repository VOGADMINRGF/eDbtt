import {
  buildPersistedCreateHandoffSummary,
  listPersistedCreateHandoffRecords,
  type PersistedCreateHandoffRecord,
} from "@/features/create/persistedHandoffReviewQueue";
import {
  buildDossierWorkspaceV3ReviewContext,
  buildPersistedCreateHandoffV3ReviewContext,
} from "@/features/create/unifiedReviewQueueWiring";
import {
  getAnlassraumRuntimeRecord,
} from "@/features/create/anlassraumRuntimeServer";
import {
  getDossierPublicationRecord,
} from "@/features/create/dossierPublishWorkflowServer";
import {
  getDossierRuntimeRecord,
} from "@/features/create/dossierRuntimeServer";
import {
  getParticipationSpacePublishRecord,
  getParticipationSpaceRuntimeRecord,
} from "@/features/create/participationSpaceRuntimeServer";
import type { AnlassraumRuntimeRecord } from "@/features/create/anlassraumRuntime";
import type { DossierPublicationRecord } from "@/features/create/dossierPublishWorkflow";
import type { DossierRuntimeRecord } from "@/features/create/dossierRuntime";
import type {
  ParticipationSpacePublishRecord,
} from "@/features/create/participationSpacePublishWorkflow";
import type {
  ParticipationSpaceRuntimeRecord,
} from "@/features/create/participationSpaceRuntime";
import {
  getDossierStudioWorkspaceRepo,
  type DossierStudioWorkspace,
} from "@features/dossier/server/studioPersistence";
import type { AccountPersistedHandoffCorrelationRef } from "./contributionHandoffCorrelationTypes";
import type {
  AccountUserScopedRuntimeLinkage,
  AccountUserScopedRuntimeLinkageSlice,
  AccountUserScopedRuntimeLinkageStatus,
  AccountUserScopedRuntimeSurfaceRef,
  AccountUserScopedRuntimeSurfaceState,
  AccountUserScopedRuntimeTruthLevel,
} from "./userScopedRuntimeLinkageTypes";

type LinkedWorkspace = {
  workspace: DossierStudioWorkspace;
  linkageMode: "workspace_source_draft" | "workspace_owner_scope";
};

type BuildLinkageInput = {
  handoff: PersistedCreateHandoffRecord;
  linkedWorkspace: LinkedWorkspace | null;
  dossierRuntimeRecord: DossierRuntimeRecord | null;
  dossierPublicationRecord: DossierPublicationRecord | null;
  anlassraumRuntimeRecord: AnlassraumRuntimeRecord | null;
  participationRuntimeRecord: ParticipationSpaceRuntimeRecord | null;
  participationPublishRecord: ParticipationSpacePublishRecord | null;
};

function timestampForSort(value: string | null | undefined) {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function selectedActionLabel(value: PersistedCreateHandoffRecord["selectedAction"]) {
  switch (value) {
    case "append_to_dossier":
      return "Dossier-Ergänzung";
    case "create_dossier":
      return "Dossier-Aufbau";
    case "prepare_anlassraum":
      return "Anlassraum-Kandidat";
    case "prepare_participation_space":
      return "Beteiligungsraum-Kandidat";
    case "prepare_vote":
      return "Abstimmungs-Kandidat";
    case "request_factcheck":
      return "Factcheck-Kandidat";
    case "request_review":
      return "Review-Handoff";
    case "submit_draft":
    default:
      return "Arbeitsstand";
  }
}

function reviewStateLabel(value: PersistedCreateHandoffRecord["reviewState"]) {
  switch (value) {
    case "ready_for_confirmation":
      return "Bereit für bewusste Bestätigung";
    case "manual_review_required":
      return "Manuelle Prüfung erforderlich";
    case "graph_review_required":
      return "Graph-Review erforderlich";
    case "factcheck_candidate":
      return "Factcheck-Kandidat";
    case "clarification_required":
    default:
      return "Klärung oder Review offen";
  }
}

function workspaceStatusLabel(value: DossierStudioWorkspace["status"]) {
  switch (value) {
    case "needs_review":
      return "Reviewpflichtiger Workspace";
    case "locked":
      return "Gesperrter Review-Workspace";
    case "archived":
      return "Archivierter Workspace";
    case "draft":
    default:
      return "Workspace-Entwurf";
  }
}

function dossierRuntimeStatusLabel(value: DossierRuntimeRecord["status"]) {
  switch (value) {
    case "created":
      return "Dossier-Runtime erstellt";
    case "approved_for_creation":
      return "Dossier-Erstellung freigegeben";
    case "queued_for_review":
      return "Dossier-Runtime in Review";
    case "blocked":
      return "Dossier-Runtime blockiert";
    case "rejected":
      return "Dossier-Runtime zurückgewiesen";
    case "archived":
      return "Dossier-Runtime archiviert";
    case "draft":
    default:
      return "Dossier-Runtime-Entwurf";
  }
}

function dossierPublicationStatusLabel(value: DossierPublicationRecord["status"]) {
  switch (value) {
    case "published":
      return "Dossier öffentlich sichtbar";
    case "approved_for_publication":
      return "Dossier zur Publikation freigegeben";
    case "ready_for_publication_review":
      return "Dossier bereit für Publikationsreview";
    case "review_only":
      return "Dossier bleibt im Review";
    case "blocked":
      return "Publikationspfad blockiert";
    case "archived":
      return "Publikationspfad archiviert";
    case "draft_internal":
    default:
      return "Publikationsentwurf intern";
  }
}

function anlassraumRuntimeStatusLabel(value: AnlassraumRuntimeRecord["status"]) {
  switch (value) {
    case "created":
      return "Anlassraum-Runtime erstellt";
    case "approved_for_creation":
      return "Anlassraum-Erstellung freigegeben";
    case "queued_for_review":
      return "Anlassraum-Runtime in Review";
    case "blocked":
      return "Anlassraum-Runtime blockiert";
    case "rejected":
      return "Anlassraum-Runtime zurückgewiesen";
    case "archived":
      return "Anlassraum-Runtime archiviert";
    case "draft":
    default:
      return "Anlassraum-Runtime-Entwurf";
  }
}

function participationRuntimeStatusLabel(value: ParticipationSpaceRuntimeRecord["status"]) {
  switch (value) {
    case "created":
      return "Beteiligungsraum-Runtime erstellt";
    case "approved_for_creation":
      return "Beteiligungsraum-Erstellung freigegeben";
    case "queued_for_review":
      return "Beteiligungsraum-Runtime in Review";
    case "blocked":
      return "Beteiligungsraum-Runtime blockiert";
    case "rejected":
      return "Beteiligungsraum-Runtime zurückgewiesen";
    case "archived":
      return "Beteiligungsraum-Runtime archiviert";
    case "draft":
    default:
      return "Beteiligungsraum-Runtime-Entwurf";
  }
}

function participationPublishStatusLabel(value: ParticipationSpacePublishRecord["status"]) {
  switch (value) {
    case "published":
      return "Beteiligungsraum öffentlich sichtbar";
    case "approved_for_publication":
      return "Beteiligungsraum zur Publikation freigegeben";
    case "activated":
      return "Beteiligungsraum intern aktiviert";
    case "approved_for_activation":
      return "Beteiligungsraum zur Aktivierung freigegeben";
    case "blocked":
      return "Beteiligungsraum-Publizierung blockiert";
    case "archived":
      return "Beteiligungsraum-Publizierung archiviert";
    case "draft":
    default:
      return "Beteiligungsraum-Publizierung als Entwurf";
  }
}

function buildSurface(
  input: AccountUserScopedRuntimeSurfaceState,
): AccountUserScopedRuntimeSurfaceState {
  return input;
}

function buildContributionRef(handoff: PersistedCreateHandoffRecord) {
  return {
    handoffId: handoff.id,
    title: `${handoff.topicSeed.topicLabel} · ${selectedActionLabel(handoff.selectedAction)}`,
    summary: buildPersistedCreateHandoffSummary(handoff),
    href: handoff.resumeHref,
    selectedAction: handoff.selectedAction,
    reviewState: handoff.reviewState,
    createdAt: handoff.createdAt,
    updatedAt: handoff.updatedAt,
  } as const;
}

function buildPersistedHandoffRef(
  handoff: PersistedCreateHandoffRecord,
): AccountPersistedHandoffCorrelationRef {
  return {
    handoffId: handoff.id,
    createHandoffId: handoff.id,
    title: `${handoff.topicSeed.topicLabel} · ${selectedActionLabel(handoff.selectedAction)}`,
    summary: buildPersistedCreateHandoffSummary(handoff),
    href: handoff.resumeHref,
    sourceText: handoff.sourceText,
    reviewState: handoff.reviewState,
    selectedAction: handoff.selectedAction,
    createdByUserId: handoff.createdByUserId,
    createdAt: handoff.createdAt,
    updatedAt: handoff.updatedAt,
    dossierId: handoff.dossierId ?? null,
    sharedIds: [handoff.id],
  };
}

function buildReviewRef(handoff: PersistedCreateHandoffRecord): AccountUserScopedRuntimeSurfaceRef {
  return {
    title: "Persistierter Review-Handoff",
    href: handoff.resumeHref,
    stateLabel: reviewStateLabel(handoff.reviewState),
    summary:
      "Der Account kann diesen Beitrag als bestehenden Create-/Review-Handoff verfolgen, ohne Admin-Queue-Details zu leaken.",
    linkageMode: "source_handoff_id",
  };
}

function buildWorkspaceRef(linkedWorkspace: LinkedWorkspace, handoff: PersistedCreateHandoffRecord) {
  const workspaceHref =
    linkedWorkspace.linkageMode === "workspace_source_draft" &&
    linkedWorkspace.workspace.createdBy === handoff.createdByUserId
      ? `/dossier/${encodeURIComponent(linkedWorkspace.workspace.dossierId)}/studio`
      : null;
  return {
    title: linkedWorkspace.workspace.title,
    href: workspaceHref,
    stateLabel: workspaceStatusLabel(linkedWorkspace.workspace.status),
    summary:
      linkedWorkspace.linkageMode === "workspace_source_draft"
        ? "Der Dossier-Workspace ist direkt über `sourceDraftId` mit diesem Create-Handoff verbunden."
        : "Der Dossier-Workspace ist nur über Dossier-ID und denselben Owner-Scope anschließbar.",
    linkageMode: linkedWorkspace.linkageMode,
  } satisfies AccountUserScopedRuntimeSurfaceRef;
}

function buildDossierRuntimeRef(
  runtimeRecord: DossierRuntimeRecord,
  publicationRecord: DossierPublicationRecord | null,
  workspaceHref: string | null,
) {
  return {
    title: runtimeRecord.title,
    href: workspaceHref,
    stateLabel: publicationRecord
      ? dossierPublicationStatusLabel(publicationRecord.status)
      : dossierRuntimeStatusLabel(runtimeRecord.status),
    summary: publicationRecord
      ? "Der Dossier-Pfad ist über Runtime- und Publikations-Readmodel sichtbar, ohne Veröffentlichung mit Review zu verwechseln."
      : "Der Dossier-Pfad ist als bestehende Runtime sichtbar und bleibt review-first.",
    linkageMode: "source_handoff_id",
  } satisfies AccountUserScopedRuntimeSurfaceRef;
}

function buildAnlassraumRef(runtimeRecord: AnlassraumRuntimeRecord) {
  return {
    title: runtimeRecord.title,
    href: null,
    stateLabel: anlassraumRuntimeStatusLabel(runtimeRecord.status),
    summary:
      "Der Anlassraum-Pfad ist als bestehende Runtime sichtbar, aber nicht automatisch aktiviert oder veröffentlicht.",
    linkageMode: "source_handoff_id",
  } satisfies AccountUserScopedRuntimeSurfaceRef;
}

function buildParticipationRef(
  runtimeRecord: ParticipationSpaceRuntimeRecord,
  publishRecord: ParticipationSpacePublishRecord | null,
) {
  return {
    title: runtimeRecord.title,
    href: null,
    stateLabel: publishRecord
      ? participationPublishStatusLabel(publishRecord.status)
      : participationRuntimeStatusLabel(runtimeRecord.status),
    summary: publishRecord
      ? "Der Beteiligungsraum ist bis Aktivierung oder Publikation nur als vorhandener Review-/Publish-Pfad sichtbar."
      : "Der Beteiligungsraum ist als bestehende Runtime sichtbar und bleibt review-first.",
    linkageMode: "source_handoff_id",
  } satisfies AccountUserScopedRuntimeSurfaceRef;
}

function buildOutputRef(input: {
  title: string;
  count: number;
  href: string | null;
  linkageMode: "workspace_source_draft" | "workspace_owner_scope";
}): AccountUserScopedRuntimeSurfaceRef {
  return {
    title: input.title,
    href: input.href,
    stateLabel:
      input.count === 1 ? "1 Output-Entwurf sichtbar" : `${input.count} Output-Entwürfe sichtbar`,
    summary:
      "Output- und Social-Drafts bleiben reviewpflichtige Entwürfe und sind keine Veröffentlichung.",
    linkageMode: input.linkageMode,
  };
}

function buildVoxyRef(input: {
  title: string;
  href: string | null;
  blockedByProvider: boolean;
  blockedByRuntimeTruth: boolean;
  linkageMode: "workspace_source_draft" | "workspace_owner_scope";
}): AccountUserScopedRuntimeSurfaceRef {
  return {
    title: input.title,
    href: input.href,
    stateLabel: input.blockedByProvider
      ? "Voxy-Kandidat durch Provider-/Secret-Gate blockiert"
      : input.blockedByRuntimeTruth
        ? "Voxy-Kandidat ohne belastbare Runtime-Wahrheit"
        : "Voxy-Briefing sichtbar",
    summary:
      "Voxy bleibt ein reviewpflichtiger Briefing- oder Skriptkandidat. Rendern und Publish werden hier bewusst nicht ausgelöst.",
    linkageMode: input.linkageMode,
  };
}

function runtimeTruthLevelFor(input: BuildLinkageInput): AccountUserScopedRuntimeTruthLevel {
  const createdRuntime =
    input.dossierRuntimeRecord?.status === "created" ||
    input.anlassraumRuntimeRecord?.status === "created" ||
    input.participationRuntimeRecord?.status === "created" ||
    input.dossierPublicationRecord !== null ||
    input.participationPublishRecord !== null;
  if (createdRuntime) return "runtime_confirmed";
  if (input.linkedWorkspace) {
    const workspaceContext = buildDossierWorkspaceV3ReviewContext({
      workspace: input.linkedWorkspace.workspace,
      sourceRecord: input.handoff,
    });
    if (workspaceContext.socialOutputDrafts.length > 0 || workspaceContext.voxyBriefing) {
      return "output_readmodel";
    }
    return "dossier_readmodel";
  }
  if (input.participationRuntimeRecord || input.anlassraumRuntimeRecord) {
    return "participation_readmodel";
  }
  return "review_readmodel";
}

function linkageStatusFor(input: {
  linkedWorkspace: LinkedWorkspace | null;
  dossierRuntimeRecord: DossierRuntimeRecord | null;
  dossierPublicationRecord: DossierPublicationRecord | null;
  anlassraumRuntimeRecord: AnlassraumRuntimeRecord | null;
  participationRuntimeRecord: ParticipationSpaceRuntimeRecord | null;
  participationPublishRecord: ParticipationSpacePublishRecord | null;
  providerBlocked: boolean;
  runtimeTruthBlocked: boolean;
}): AccountUserScopedRuntimeLinkageStatus {
  if (input.providerBlocked) return "blocked_by_provider";
  if (input.runtimeTruthBlocked) return "blocked_by_runtime_truth";
  if (input.dossierPublicationRecord || input.participationPublishRecord) return "linked";
  if (
    input.dossierRuntimeRecord?.status === "created" ||
    input.anlassraumRuntimeRecord?.status === "created" ||
    input.participationRuntimeRecord?.status === "created"
  ) {
    return "linked";
  }
  if (
    input.linkedWorkspace?.workspace.status === "needs_review" ||
    input.linkedWorkspace?.workspace.status === "locked" ||
    input.dossierRuntimeRecord?.status === "queued_for_review" ||
    input.anlassraumRuntimeRecord?.status === "queued_for_review" ||
    input.participationRuntimeRecord?.status === "queued_for_review"
  ) {
    return "blocked_by_review";
  }
  if (
    input.linkedWorkspace ||
    input.dossierRuntimeRecord ||
    input.anlassraumRuntimeRecord ||
    input.participationRuntimeRecord
  ) {
    return "partially_linked";
  }
  return "partially_linked";
}

function nextStepFor(input: {
  status: AccountUserScopedRuntimeLinkageStatus;
  handoff: PersistedCreateHandoffRecord;
  linkedWorkspace: LinkedWorkspace | null;
  hasOutputDrafts: boolean;
  hasVoxy: boolean;
}) {
  if (input.status === "blocked_by_provider") {
    return "Review abschließen; Voxy bleibt bis zu bewusstem Provider-/Secret-Freigabeschritt blockiert.";
  }
  if (input.status === "blocked_by_runtime_truth") {
    return "Review- und Runtime-Lücke klären, bevor weitere Folgeflächen belastbar sichtbar werden.";
  }
  if (input.linkedWorkspace?.workspace.status === "needs_review") {
    return "Dossier-Workspace prüfen; reviewpflichtig ist nicht veröffentlicht.";
  }
  if (input.linkedWorkspace?.workspace.status === "locked") {
    return "Gesperrten Review-Workspace erst bewusst freigeben oder weiterqualifizieren.";
  }
  if (input.hasOutputDrafts) {
    return "Output-Entwürfe bewusst prüfen; Veröffentlichung bleibt ein separater menschlicher Schritt.";
  }
  if (input.hasVoxy) {
    return "Voxy-Briefing nur als Review-Kandidat behandeln; Rendern bleibt deaktiviert.";
  }
  if (input.handoff.selectedAction === "create_dossier") {
    return "Dossier-Folgepfad bewusst weiterführen oder Review abschließen.";
  }
  if (input.handoff.selectedAction === "prepare_anlassraum") {
    return "Anlassraum-Folgepfad bewusst weiterführen; keine Aktivierung ohne Review.";
  }
  if (
    input.handoff.selectedAction === "prepare_participation_space" ||
    input.handoff.selectedAction === "prepare_vote"
  ) {
    return "Beteiligungsformat bewusst weiterführen; keine Aktivierung oder Publikation ohne Review.";
  }
  return "Create-Handoff bewusst weiterführen; spätere Dossier-, Beteiligungs- oder Output-Schritte bleiben getrennt.";
}

function userVisibleStatusFor(input: {
  status: AccountUserScopedRuntimeLinkageStatus;
  runtimeTruthLevel: AccountUserScopedRuntimeTruthLevel;
  linkedWorkspace: LinkedWorkspace | null;
  hasOutputDrafts: boolean;
  hasVoxy: boolean;
}) {
  if (input.status === "linked" && input.runtimeTruthLevel === "runtime_confirmed") {
    return "Weiterführender Arbeitsstand ist als echte Folge-Runtime sichtbar.";
  }
  if (input.status === "blocked_by_provider") {
    return "Weiterführender Arbeitsstand ist sichtbar, aber Voxy-/Provider-Schritte bleiben blockiert.";
  }
  if (input.status === "blocked_by_review") {
    return "Weiterführender Arbeitsstand ist sichtbar, bleibt aber bis nach Review gesperrt.";
  }
  if (input.linkedWorkspace) {
    return "Review- oder Dossier-Arbeitsstand ist mit diesem Beitrag verbunden.";
  }
  if (input.hasOutputDrafts || input.hasVoxy) {
    return "Output- oder Voxy-Kandidaten sind sichtbar, aber noch nicht runtime-bestätigt.";
  }
  return "Persistierter Review-Handoff ist sichtbar; direkte Folge-Runtime bleibt noch offen.";
}

function linkageGapsFor(input: BuildLinkageInput) {
  const gaps: string[] = [];
  if (
    input.linkedWorkspace?.linkageMode === "workspace_owner_scope" &&
    input.handoff.selectedAction === "create_dossier"
  ) {
    gaps.push("Dossier-Workspace ist nur über Dossier-ID und Owner-Scope verknüpft.");
  }
  if (input.handoff.selectedAction === "create_dossier" && !input.linkedWorkspace) {
    gaps.push("Noch kein direkt verknüpfter Dossier-Workspace sichtbar.");
  }
  if (
    input.handoff.selectedAction === "prepare_anlassraum" &&
    !input.anlassraumRuntimeRecord
  ) {
    gaps.push("Noch keine direkte Anlassraum-Runtime sichtbar.");
  }
  if (
    (input.handoff.selectedAction === "prepare_participation_space" ||
      input.handoff.selectedAction === "prepare_vote") &&
    !input.participationRuntimeRecord
  ) {
    gaps.push("Noch keine direkte Beteiligungsraum-Runtime sichtbar.");
  }
  if (input.linkedWorkspace) {
    const workspaceContext = buildDossierWorkspaceV3ReviewContext({
      workspace: input.linkedWorkspace.workspace,
      sourceRecord: input.handoff,
    });
    if (workspaceContext.socialOutputDrafts.length === 0) {
      gaps.push("Noch keine Output-/Social-Drafts im verknüpften Workspace sichtbar.");
    }
    if (!workspaceContext.voxyBriefing) {
      gaps.push("Noch kein Voxy-Briefing im verknüpften Workspace sichtbar.");
    }
  }
  return gaps;
}

function sortByUpdatedAt<T extends { updatedAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) => timestampForSort(right.updatedAt) - timestampForSort(left.updatedAt),
  );
}

function findLinkedWorkspaceForHandoff(params: {
  handoff: PersistedCreateHandoffRecord;
  workspaces: DossierStudioWorkspace[];
}) {
  const bySourceDraft = sortByUpdatedAt(
    params.workspaces.filter((workspace) => workspace.provenance.sourceDraftId === params.handoff.id),
  )[0];
  if (bySourceDraft) {
    return {
      workspace: bySourceDraft,
      linkageMode: "workspace_source_draft",
    } satisfies LinkedWorkspace;
  }

  if (!params.handoff.dossierId) return null;
  const byOwnerAndDossier = sortByUpdatedAt(
    params.workspaces.filter(
      (workspace) =>
        workspace.dossierId === params.handoff.dossierId &&
        workspace.createdBy === params.handoff.createdByUserId,
    ),
  )[0];
  if (!byOwnerAndDossier) return null;
  return {
    workspace: byOwnerAndDossier,
    linkageMode: "workspace_owner_scope",
  } satisfies LinkedWorkspace;
}

export function buildAccountUserScopedRuntimeLinkage(
  input: BuildLinkageInput,
): AccountUserScopedRuntimeLinkage {
  const linkedWorkspaceRef = input.linkedWorkspace
    ? buildWorkspaceRef(input.linkedWorkspace, input.handoff)
    : null;
  const v3ReviewContext = input.linkedWorkspace
    ? buildDossierWorkspaceV3ReviewContext({
        workspace: input.linkedWorkspace.workspace,
        sourceRecord: input.handoff,
      })
    : buildPersistedCreateHandoffV3ReviewContext(input.handoff);
  const workspaceHref = linkedWorkspaceRef?.href ?? null;
  const dossierRef =
    input.dossierRuntimeRecord && input.handoff.selectedAction === "create_dossier"
      ? buildDossierRuntimeRef(
          input.dossierRuntimeRecord,
          input.dossierPublicationRecord,
          workspaceHref,
        )
      : linkedWorkspaceRef;
  const anlassraumRef =
    input.anlassraumRuntimeRecord && input.handoff.selectedAction === "prepare_anlassraum"
      ? buildAnlassraumRef(input.anlassraumRuntimeRecord)
      : null;
  const participationRef =
    input.participationRuntimeRecord &&
    (input.handoff.selectedAction === "prepare_participation_space" ||
      input.handoff.selectedAction === "prepare_vote")
      ? buildParticipationRef(
          input.participationRuntimeRecord,
          input.participationPublishRecord,
        )
      : null;
  const outputCount = v3ReviewContext.socialOutputDrafts.length;
  const voxyBlockedByProvider =
    v3ReviewContext.voxyRenderJob?.status === "blocked_by_provider" ||
    v3ReviewContext.voxyRenderJob?.status === "blocked_by_secret";
  const voxyBlockedByRuntimeTruth =
    v3ReviewContext.voxyRenderJob?.status === "blocked_by_runtime_truth";
  const outputRef =
    outputCount > 0
      ? buildOutputRef({
          title:
            outputCount === 1
              ? v3ReviewContext.socialOutputDrafts[0]?.title ?? "Output-Entwurf"
              : "Output- und Social-Drafts",
          count: outputCount,
          href: workspaceHref,
          linkageMode: input.linkedWorkspace?.linkageMode ?? "workspace_source_draft",
        })
      : null;
  const voxyRef = v3ReviewContext.voxyBriefing
    ? buildVoxyRef({
        title: v3ReviewContext.voxyBriefing.title,
        href: workspaceHref,
        blockedByProvider: voxyBlockedByProvider,
        blockedByRuntimeTruth: voxyBlockedByRuntimeTruth,
        linkageMode: input.linkedWorkspace?.linkageMode ?? "workspace_source_draft",
      })
    : null;
  const runtimeTruthLevel = runtimeTruthLevelFor(input);
  const status = linkageStatusFor({
    linkedWorkspace: input.linkedWorkspace,
    dossierRuntimeRecord: input.dossierRuntimeRecord,
    dossierPublicationRecord: input.dossierPublicationRecord,
    anlassraumRuntimeRecord: input.anlassraumRuntimeRecord,
    participationRuntimeRecord: input.participationRuntimeRecord,
    participationPublishRecord: input.participationPublishRecord,
    providerBlocked: voxyBlockedByProvider,
    runtimeTruthBlocked: voxyBlockedByRuntimeTruth,
  });
  const linkageGaps = linkageGapsFor(input);
  const surfaces: AccountUserScopedRuntimeSurfaceState[] = [
    buildSurface({
      kind: "review",
      label: "Review",
      status: "linked",
      stateLabel: reviewStateLabel(input.handoff.reviewState),
      summary:
        "Der Account kann diesen Beitrag als bestehenden Review-Handoff nachverfolgen, ohne Admin-Queue-Details offenzulegen.",
      href: input.handoff.resumeHref,
    }),
    buildSurface({
      kind: "dossier",
      label: "Dossier",
      status: dossierRef
        ? input.linkedWorkspace?.linkageMode === "workspace_owner_scope"
          ? "candidate"
          : "linked"
        : "missing",
      stateLabel: dossierRef?.stateLabel ?? "Noch kein verknüpfter Dossier-Arbeitsstand",
      summary:
        dossierRef?.summary ??
        "Der Account hat hier noch keinen direkt verknüpften Dossier-Arbeitsstand.",
      href: dossierRef?.href ?? null,
    }),
    buildSurface({
      kind: "participation",
      label: "Beteiligung",
      status: anlassraumRef || participationRef
        ? (input.anlassraumRuntimeRecord?.status === "blocked" ||
            input.participationRuntimeRecord?.status === "blocked")
          ? "blocked"
          : "linked"
        : v3ReviewContext.participationCandidates.length > 0
          ? "candidate"
          : "missing",
      stateLabel:
        anlassraumRef?.stateLabel ??
        participationRef?.stateLabel ??
        (v3ReviewContext.participationCandidates.length > 0
          ? `${v3ReviewContext.participationCandidates.length} Beteiligungskandidaten vorbereitet`
          : "Noch kein verknüpfter Beteiligungs-Arbeitsstand"),
      summary:
        anlassraumRef?.summary ??
        participationRef?.summary ??
        (v3ReviewContext.participationCandidates.length > 0
          ? "Beteiligungs- oder Anlassraumkandidaten sind vorbereitet, aber noch nicht als Runtime bestätigt."
          : "Der Account hat hier noch keinen direkt verknüpften Beteiligungs-Arbeitsstand."),
      href: null,
    }),
    buildSurface({
      kind: "output",
      label: "Output",
      status: outputRef ? "linked" : "missing",
      stateLabel: outputRef?.stateLabel ?? "Noch keine Output-Entwürfe sichtbar",
      summary:
        outputRef?.summary ??
        "Output- und Social-Drafts sind noch nicht mit diesem Account-Arbeitsstand verbunden.",
      href: outputRef?.href ?? null,
    }),
    buildSurface({
      kind: "voxy",
      label: "Voxy",
      status: voxyRef
        ? voxyBlockedByProvider || voxyBlockedByRuntimeTruth
          ? "blocked"
          : "candidate"
        : "missing",
      stateLabel: voxyRef?.stateLabel ?? "Noch kein Voxy-Briefing sichtbar",
      summary:
        voxyRef?.summary ??
        "Voxy bleibt hier bis zu einem verknüpften Workspace oder Briefing-Kandidaten unsichtbar.",
      href: voxyRef?.href ?? null,
    }),
  ];

  return {
    contributionRef: buildContributionRef(input.handoff),
    persistedHandoffRef: buildPersistedHandoffRef(input.handoff),
    reviewQueueRef: buildReviewRef(input.handoff),
    dossierWorkspaceRef: dossierRef,
    participationRef: anlassraumRef ?? participationRef,
    outputDraftRef: outputRef,
    voxyBriefingRef: voxyRef,
    surfaces,
    linkageStatus: status,
    userVisibleStatus: userVisibleStatusFor({
      status,
      runtimeTruthLevel,
      linkedWorkspace: input.linkedWorkspace,
      hasOutputDrafts: outputCount > 0,
      hasVoxy: Boolean(v3ReviewContext.voxyBriefing),
    }),
    adminReason: unique(linkageGaps)[0] ?? null,
    nextStep: nextStepFor({
      status,
      handoff: input.handoff,
      linkedWorkspace: input.linkedWorkspace,
      hasOutputDrafts: outputCount > 0,
      hasVoxy: Boolean(v3ReviewContext.voxyBriefing),
    }),
    reviewRequired: true,
    publicActivationAllowed: false,
    publishActionEnabled: false,
    runtimeTruthLevel,
    linkageGaps: unique(linkageGaps),
    v3ReviewContext,
  };
}

export async function loadAccountUserScopedRuntimeLinkage(
  userId: string,
  limit = 8,
): Promise<AccountUserScopedRuntimeLinkageSlice["userScopedRuntimeLinkages"]> {
  const handoffs = (await listPersistedCreateHandoffRecords())
    .filter((record) => record.createdByUserId === userId)
    .sort((left, right) => timestampForSort(right.updatedAt) - timestampForSort(left.updatedAt))
    .slice(0, limit);

  if (handoffs.length === 0) return [];

  const workspaces = (await getDossierStudioWorkspaceRepo().listDossierStudioWorkspaces()).filter(
    (workspace) =>
      workspace.createdBy === userId ||
      handoffs.some((handoff) => workspace.provenance.sourceDraftId === handoff.id),
  );

  return Promise.all(
    handoffs.map(async (handoff) => {
      const linkedWorkspace = findLinkedWorkspaceForHandoff({
        handoff,
        workspaces,
      });
      const [
        dossierRuntimeRecord,
        dossierPublicationRecord,
        anlassraumRuntimeRecord,
        participationRuntimeRecord,
        participationPublishRecord,
      ] = await Promise.all([
        getDossierRuntimeRecord(handoff.id).catch(() => null),
        getDossierPublicationRecord(handoff.id).catch(() => null),
        getAnlassraumRuntimeRecord(handoff.id).catch(() => null),
        getParticipationSpaceRuntimeRecord(handoff.id).catch(() => null),
        getParticipationSpacePublishRecord(handoff.id).catch(() => null),
      ]);

      return buildAccountUserScopedRuntimeLinkage({
        handoff,
        linkedWorkspace,
        dossierRuntimeRecord,
        dossierPublicationRecord,
        anlassraumRuntimeRecord,
        participationRuntimeRecord,
        participationPublishRecord,
      });
    }),
  );
}

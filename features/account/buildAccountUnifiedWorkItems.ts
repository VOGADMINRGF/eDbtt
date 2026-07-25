import type {
  CreateBranchLedgerItem,
  CreateContributionLedgerEntry,
} from "@features/create/createContributionLedger";
import { dedupeCreateContributionLedgerEntries } from "@features/create/createContributionLedger";
import type { AccountUserScopedRuntimeLinkage } from "./userScopedRuntimeLinkageTypes";
import {
  buildAccountContributionHandoffCorrelation,
} from "./buildContributionHandoffCorrelations";
import type {
  AccountContributionHandoffCorrelation,
  AccountContributionSourceRef,
} from "./contributionHandoffCorrelationTypes";
import {
  buildLedgerBranchAnchorId,
  resolveBranchHandoffTarget,
} from "@/features/create/branchHandoffTargets";
import {
  buildManualAnlassraumContinueCreateHref,
  buildManualAnlassraumPrefill,
  buildManualAnlassraumStartDraft,
  getManualAnlassraumSignalTitle,
  type ManualAnlassraumServerDraftSnapshot,
} from "@/features/surfaces/runden/manualAnlassraumSetup";
import {
  clearStartDraftContext,
  getStartDraftGuardrailSummary,
  getStartDraftSurfaceLabel,
  getStartDraftStatusLabel,
  type StartDraftContext,
} from "@/features/start/startDraftContext";
import {
  resolveDraftNextActionsForResumeItem,
  type DraftNextActionOption,
} from "@/features/start/draftNextActionGate";
import {
  buildV3AccountResumeWorkflowFromLedgerBranch,
  buildV3AccountResumeWorkflowFromStartDraft,
  type V3AccountResumeWorkflowModel,
} from "@/features/create/V3AccountResumeWorkflow";
import {
  buildV3DownstreamKiTransparencyFromLedgerBranch,
  buildV3DownstreamKiTransparencyFromStartDraft,
  type V3DownstreamKiTransparencyModel,
} from "@/features/create/V3DownstreamKiTransparency";
import type { V3VoxyCocreationDialogModel } from "@/features/create/voxyCocreationDialogContract";
import { buildVoxyCocreationDialog } from "@/features/create/voxyCocreationDialogContract";
import {
  LANDING_EDITORIAL_REVIEW_STORAGE_KEY,
  LANDING_START_CREATE_LIGHT_STORAGE_KEY,
} from "@/features/start/landingCreateLight";
import {
  draftSsotTextsMatch,
  getAccountDraftSsotPolicy,
  type AccountDraftSsotPolicy,
  type AccountDraftSsotSource,
} from "./draftSsotPolicy";

export type ResumeWorkbenchItemType = "Beitrag" | "Thema" | "Runde" | "Redaktion";

export type ResumeWorkbenchItem = {
  id: string;
  title: string;
  excerpt: string;
  type: ResumeWorkbenchItemType;
  status: string;
  nextStep: string;
  href: string;
  isLocalOnly: boolean;
  guardrails: string[];
  discardable: boolean;
  nextActions: DraftNextActionOption[];
  nextActionStatusLabel?: string | null;
  workflow: V3AccountResumeWorkflowModel;
  downstreamTransparency: V3DownstreamKiTransparencyModel;
  voxyCocreationDialog: V3VoxyCocreationDialogModel | null;
  correlationRef: AccountContributionSourceRef | null;
  ssotSource: Extract<
    AccountDraftSsotSource,
    | "local_start_draft"
    | "manual_anlassraum_server_draft"
    | "create_contribution_ledger"
  >;
  sortTimestamp: number;
};

export type AccountUnifiedWorkItem =
  | {
      kind: "resume_item";
      id: string;
      sortTimestamp: number;
      item: ResumeWorkbenchItem;
      correlation: AccountContributionHandoffCorrelation | null;
      ssotPolicy: AccountDraftSsotPolicy;
    }
  | {
      kind: "runtime_linkage";
      id: string;
      sortTimestamp: number;
      linkage: AccountUserScopedRuntimeLinkage;
      ssotPolicy: AccountDraftSsotPolicy;
    };

function canUseBrowserSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function removeSessionItem(key: string) {
  if (!canUseBrowserSessionStorage()) return;
  window.sessionStorage.removeItem(key);
}

function timestampForSort(value: string | null | undefined) {
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(
    new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)),
  );
}

function normalizeHistoricalLedgerBranchArrays(
  branch: CreateBranchLedgerItem & {
    evidenceCandidates?: readonly unknown[] | null;
    questionCandidates?: readonly unknown[] | null;
    perspectiveCandidates?: readonly unknown[] | null;
  },
) {
  return {
    claimCandidates: Array.isArray(branch.claimCandidates) ? branch.claimCandidates : [],
    placeCandidates: Array.isArray(branch.placeCandidates) ? branch.placeCandidates : [],
    localIssueCandidates: Array.isArray(branch.localIssueCandidates) ? branch.localIssueCandidates : [],
    evidenceCandidates: Array.isArray(branch.evidenceCandidates) ? branch.evidenceCandidates : [],
    questionCandidates: Array.isArray(branch.questionCandidates) ? branch.questionCandidates : [],
    perspectiveCandidates: Array.isArray(branch.perspectiveCandidates) ? branch.perspectiveCandidates : [],
  };
}

export function clearAccountLocalStartDraftArtifacts() {
  clearStartDraftContext();
  removeSessionItem(LANDING_START_CREATE_LIGHT_STORAGE_KEY);
  removeSessionItem(LANDING_EDITORIAL_REVIEW_STORAGE_KEY);
}

export function resolveAccountResumeHrefFromStartDraft(draft: StartDraftContext): string {
  if (
    draft.origin === "start_relevance_review" ||
    draft.preview?.relevance === "needs_reframe" ||
    draft.preview?.relevance === "personal_only"
  ) {
    return "/start?review=editorial";
  }
  switch (draft.targetHint) {
    case "themes":
      return "/themen?startDraft=1";
    case "rounds":
      return "/runden/new?startDraft=1&from=account";
    case "create":
      return "/create?startDraft=1";
    default:
      return "/start";
  }
}

function resolveLocalDraftType(draft: StartDraftContext): ResumeWorkbenchItemType {
  if (
    draft.origin === "start_relevance_review" ||
    draft.preview?.relevance === "needs_reframe" ||
    draft.preview?.relevance === "personal_only"
  ) {
    return "Redaktion";
  }
  switch (draft.targetHint) {
    case "themes":
      return "Thema";
    case "rounds":
      return "Runde";
    default:
      return "Beitrag";
  }
}

function buildLocalDraftResumeItem(
  draft: StartDraftContext,
  canDeepResearch: boolean,
): ResumeWorkbenchItem {
  const nextActionSummary = resolveDraftNextActionsForResumeItem({
    category: resolveLocalDraftType(draft),
    isAuthenticated: true,
    canDeepResearch,
    draft,
  });
  const workflow = buildV3AccountResumeWorkflowFromStartDraft(draft);
  const voxyCocreationDialog = buildVoxyCocreationDialog({
    contributionRef: {
      id: `local-${draft.id}`,
      title:
        draft.campaign?.title ??
        draft.preview?.possibleTopics?.[0] ??
        getStartDraftSurfaceLabel(draft.targetHint ?? "start"),
      href: resolveAccountResumeHrefFromStartDraft(draft),
    },
    sourceLanguage: "de",
    readingLanguage: "de",
    uiLocale: "de",
    originalText: draft.text,
    summaryText:
      draft.preview?.possibleTopics?.[0] ??
      draft.preview?.openQuestions?.[0] ??
      null,
    sourcePresent: false,
    openQuestions: draft.preview?.openQuestions ?? [],
    uncertaintyNotes:
      draft.origin === "start_create_light"
        ? ["source_needed", "review_first_only"]
        : ["review_first_only"],
    claimCount: draft.text ? 1 : 0,
    scopeHint: draft.campaign?.regionLabel ?? null,
    voxyBriefingState: "not_connected",
    surface: "account",
    maxCards: 4,
  });
  return {
    id: `local-${draft.id}`,
    title:
      draft.campaign?.title ??
      draft.preview?.possibleTopics?.[0] ??
      getStartDraftSurfaceLabel(draft.targetHint ?? "start"),
    excerpt: draft.text,
    type: resolveLocalDraftType(draft),
    status:
      draft.origin === "start_relevance_review"
        ? "Zur manuellen Prüfung vorgemerkt"
        : draft.origin === "start_create_light"
          ? "Analyse-Entwurf"
          : getStartDraftStatusLabel(draft),
    nextStep:
      draft.origin === "start_relevance_review"
        ? "Redaktionellen Prüfpfad fortsetzen"
        : draft.origin === "start_create_light"
          ? "Quellenlage klären"
          : getStartDraftSurfaceLabel(draft.targetHint ?? "start"),
    href: resolveAccountResumeHrefFromStartDraft(draft),
    isLocalOnly: true,
    guardrails: getStartDraftGuardrailSummary(
      draft,
      draft.targetHint === "themes"
        ? "themes"
        : draft.targetHint === "rounds"
          ? "rounds"
          : "create",
    ),
    discardable: true,
    nextActions: nextActionSummary.actions,
    nextActionStatusLabel: nextActionSummary.statusLabel,
    workflow,
    downstreamTransparency: buildV3DownstreamKiTransparencyFromStartDraft(draft, workflow),
    voxyCocreationDialog,
    correlationRef: {
      id: `local-${draft.id}`,
      kind: "local_start_draft",
      title:
        draft.campaign?.title ??
        draft.preview?.possibleTopics?.[0] ??
        getStartDraftSurfaceLabel(draft.targetHint ?? "start"),
      summary: draft.text,
      href: resolveAccountResumeHrefFromStartDraft(draft),
      sourceText: draft.text,
      createdAt: draft.createdAt ?? null,
      updatedAt: draft.updatedAt ?? draft.createdAt ?? null,
      userId: null,
      localDraftId: draft.id,
      startDraftId: draft.id,
      selectedActionHint: draft.targetHint ?? "create",
    },
    ssotSource: "local_start_draft",
    sortTimestamp: timestampForSort(draft.updatedAt ?? draft.createdAt),
  };
}

function buildManualAnlassraumServerDraftActions(
  roundsHref: string,
  continueCreateHref: string,
): DraftNextActionOption[] {
  return [
    {
      kind: "prepare_round",
      label: "Runde weiter vorbereiten",
      description: "Den serverseitigen Anlassraum-Entwurf in `/runden/new` weiterbearbeiten.",
      href: roundsHref,
      status: "draft",
      statusLabel: "Serverseitiger Entwurf",
      loginRequired: false,
      costGateRequired: false,
      confirmationRequired: false,
    },
    {
      kind: "run_light_analysis",
      label: "In /create weiterarbeiten",
      description: "Den Anlassraum bewusst nach `/create` übergeben, ohne Auto-Start oder Auto-Publish.",
      href: continueCreateHref,
      status: "analysis_draft",
      statusLabel: "Review-first Übergabe",
      loginRequired: false,
      costGateRequired: false,
      confirmationRequired: false,
    },
  ];
}

function buildManualAnlassraumServerDraftResumeItem(
  draft: ManualAnlassraumServerDraftSnapshot,
): ResumeWorkbenchItem {
  const syntheticStartDraft =
    buildManualAnlassraumStartDraft(draft.setup, {
      id: draft.draftId,
      createdAt: draft.updatedAt ?? undefined,
      handoffCount: 0,
    }) ?? null;
  const roundsHref = `/runden/new?draftId=${encodeURIComponent(draft.draftId)}&from=account`;
  const continueCreateHref = buildManualAnlassraumContinueCreateHref({
    setup: draft.setup,
    draftId: draft.draftId,
    returnTo: "/account",
  });
  const workflow = syntheticStartDraft
    ? buildV3AccountResumeWorkflowFromStartDraft(syntheticStartDraft)
    : buildV3AccountResumeWorkflowFromStartDraft({
        id: draft.draftId,
        text: buildManualAnlassraumPrefill(draft.setup),
        normalizedText: buildManualAnlassraumPrefill(draft.setup),
        origin: "round_handoff",
        intent: "round_suggestion",
        createdAt: draft.updatedAt ?? new Date().toISOString(),
        updatedAt: draft.updatedAt ?? new Date().toISOString(),
        targetHint: "rounds",
        preview: {
          contributionType: "Anlassraum-Entwurf",
          possibleTopics: [getManualAnlassraumSignalTitle(draft.setup)],
          openQuestions: draft.setup.votingQuestion ? [draft.setup.votingQuestion] : [],
          suggestedNextSteps: ["Runde weiterbearbeiten", "In /create weiter ausarbeiten"],
          relevance: "internal_review",
        },
        handoffCount: 0,
        noAutoPublish: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoDeepSearch: true,
        noAutoGraphWrite: true,
      });
  const downstreamTransparency =
    syntheticStartDraft
      ? buildV3DownstreamKiTransparencyFromStartDraft(syntheticStartDraft, workflow)
      : buildV3DownstreamKiTransparencyFromStartDraft(
          {
            id: draft.draftId,
            text: buildManualAnlassraumPrefill(draft.setup),
            normalizedText: buildManualAnlassraumPrefill(draft.setup),
            origin: "round_handoff",
            intent: "round_suggestion",
            createdAt: draft.updatedAt ?? new Date().toISOString(),
            updatedAt: draft.updatedAt ?? new Date().toISOString(),
            targetHint: "rounds",
            preview: {
              contributionType: "Anlassraum-Entwurf",
              possibleTopics: [getManualAnlassraumSignalTitle(draft.setup)],
              openQuestions: draft.setup.votingQuestion ? [draft.setup.votingQuestion] : [],
              suggestedNextSteps: ["Runde weiterbearbeiten", "In /create weiter ausarbeiten"],
              relevance: "internal_review",
            },
            handoffCount: 0,
            noAutoPublish: true,
            noAutoDossier: true,
            noAutoAnlassraum: true,
            noAutoDeepSearch: true,
            noAutoGraphWrite: true,
          },
          workflow,
        );
  const voxyCocreationDialog = buildVoxyCocreationDialog({
    contributionRef: {
      id: `manual-anlassraum-${draft.draftId}`,
      title: getManualAnlassraumSignalTitle(draft.setup),
      href: roundsHref,
    },
    sourceLanguage: "de",
    readingLanguage: "de",
    uiLocale: "de",
    originalText:
      draft.setup.description ||
      draft.setup.votingQuestion ||
      getManualAnlassraumSignalTitle(draft.setup),
    summaryText: draft.setup.votingQuestion ?? null,
    sourcePresent: false,
    openQuestions: draft.setup.votingQuestion ? [draft.setup.votingQuestion] : [],
    uncertaintyNotes: ["review_first_only", "source_needed"],
    claimCount: 1,
    voxyBriefingState: "not_connected",
    surface: "account",
    maxCards: 4,
  });

  return {
    id: `manual-anlassraum-${draft.draftId}`,
    title: getManualAnlassraumSignalTitle(draft.setup),
    excerpt:
      draft.setup.description ||
      draft.setup.votingQuestion ||
      "Serverseitig gespeicherter Anlassraum-Entwurf aus `/runden/new`.",
    type: "Runde",
    status: "Serverseitig gespeichert",
    nextStep: "Anlassraum weiterbearbeiten oder bewusst nach /create übergeben",
    href: roundsHref,
    isLocalOnly: false,
    guardrails: [
      "Serverseitig gespeichert",
      "Review-first",
      "Kein Auto-Publish",
      "Kein Auto-Dossier",
      "Kein Auto-Anlassraum",
    ],
    discardable: false,
    nextActions: buildManualAnlassraumServerDraftActions(roundsHref, continueCreateHref),
    nextActionStatusLabel:
      "Dieser Arbeitsstand lebt serverseitig im authentifizierten Draft-Pfad und bleibt bewusst review-first.",
    workflow,
    downstreamTransparency,
    voxyCocreationDialog,
    correlationRef: null,
    ssotSource: "manual_anlassraum_server_draft",
    sortTimestamp: timestampForSort(draft.updatedAt),
  };
}

function resolveBranchResumeType(branch: CreateBranchLedgerItem): ResumeWorkbenchItemType {
  if (
    branch.status === "review_draft_prepared" ||
    branch.existingMatchDecision?.userDecision === "request_review"
  ) {
    return "Redaktion";
  }
  if (
    branch.qrParticipationDraft ||
    branch.swipeDraft ||
    branch.status === "qr_draft_prepared" ||
    branch.status === "swipe_draft_prepared"
  ) {
    return "Runde";
  }
  if (branch.needsPlaceClarification || branch.existingMatchDecision) return "Thema";
  return "Beitrag";
}

function resolveBranchResumeStatus(branch: CreateBranchLedgerItem): string {
  if (branch.needsPlaceClarification && branch.placeClarificationStatus !== "answered") {
    return "Ort noch offen";
  }
  if (branch.status === "review_draft_prepared") return "Prüfung offen";
  if (branch.selectedAction === "review_or_sources" || branch.needsReview) {
    return "Prüfung empfohlen";
  }
  if (branch.qrParticipationDraft) return "Entwurf";
  if (branch.swipeDraft) return "Entwurf";
  if (branch.existingMatchDecision?.userDecision === "request_review") {
    return "Zur manuellen Prüfung vorgemerkt";
  }
  return "Entwurf";
}

function buildResumeItemFromBranch(
  entry: CreateContributionLedgerEntry,
  branch: CreateBranchLedgerItem,
  canDeepResearch: boolean,
): ResumeWorkbenchItem {
  const branchArrays = normalizeHistoricalLedgerBranchArrays(branch);
  const handoff = resolveBranchHandoffTarget({
    packageId: entry.packageId,
    ledgerId: entry.ledgerId,
    branch,
    accountAnchorId: buildLedgerBranchAnchorId(entry.packageId, branch.branchId),
    allowPlaceClarificationRoute: true,
  });
  const href =
    handoff.handoffTargetUrl ??
    `/account#${encodeURIComponent(buildLedgerBranchAnchorId(entry.packageId, branch.branchId))}`;

  const guardrails = ["Noch nicht veröffentlicht"];
  if (branch.selectedAction === "review_or_sources" || branch.needsReview) {
    guardrails.unshift("Analyse-Entwurf");
    guardrails.push("Keine Quellenprüfung gestartet");
  }
  if (resolveBranchResumeType(branch) === "Runde") {
    guardrails.push("Noch nicht gezählt");
  }
  if (resolveBranchResumeType(branch) === "Thema") {
    guardrails.push("Noch nicht zusammengeführt");
  }
  if (resolveBranchResumeType(branch) === "Redaktion") {
    guardrails.push("Keine automatische Prüfung");
  }

  const workflow = buildV3AccountResumeWorkflowFromLedgerBranch({
    branch,
    draftSaveStatus: entry.draftSaveStatus,
    handoff,
  });
  const voxyCocreationDialog = buildVoxyCocreationDialog({
    contributionRef: {
      id: `${entry.packageId}-${branch.branchId}`,
      title: branch.title,
      href,
    },
    sourceLanguage: entry.locale ?? "de",
    readingLanguage: "de",
    uiLocale: "de",
    originalText: branch.summary,
    summaryText: branch.title,
    sourcePresent: false,
    openQuestions:
      branch.existingMatchDecision?.targetTitle
        ? [`Wie passt dein Beitrag zu ${branch.existingMatchDecision.targetTitle}?`]
        : [],
    uncertaintyNotes: uniqueStrings([
      branch.needsReview ? "review_first_only" : null,
      branch.needsPlaceClarification ? "scope_open" : null,
      branch.placeClarificationStatus !== "answered" ? "context_missing" : null,
    ]),
    missingPerspectiveCount: branchArrays.localIssueCandidates.length,
    counterPositionCount: branchArrays.claimCandidates.length > 1 ? 1 : 0,
    claimCount: branchArrays.claimCandidates.length,
    scopeHint:
      branch.targetReference?.type === "dossier"
        ? "lokal"
        : branch.targetReference?.type === "anlassraum"
          ? "lokal"
          : null,
    voxyBriefingState: "not_connected",
    surface: "account",
    maxCards: 4,
  });
  return {
    id: `${entry.packageId}-${branch.branchId}`,
    title: branch.title,
    excerpt: branch.summary,
    type: resolveBranchResumeType(branch),
    status: resolveBranchResumeStatus(branch),
    nextStep:
      branch.selectedAction === "review_or_sources" || branch.needsReview
        ? "Quellenlage klären"
        : handoff.nextWorkspaceLabel,
    href,
    isLocalOnly: entry.draftSaveStatus !== "server_saved",
    guardrails,
    discardable: false,
    nextActions: resolveDraftNextActionsForResumeItem({
      category: resolveBranchResumeType(branch),
      isAuthenticated: true,
      canDeepResearch,
      draft: null,
    }).actions,
    nextActionStatusLabel: null,
    workflow,
    voxyCocreationDialog,
    downstreamTransparency: buildV3DownstreamKiTransparencyFromLedgerBranch({
      branch,
      draftSaveStatus: entry.draftSaveStatus,
      handoff,
      workflow,
    }),
    correlationRef: {
      id: `${entry.packageId}-${branch.branchId}`,
      kind: "ledger_branch",
      title: branch.title,
      summary: branch.summary,
      href,
      sourceText: entry.sourceText,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      userId: entry.userId ?? null,
      ledgerId: entry.ledgerId,
      packageId: entry.packageId,
      branchId: branch.branchId,
      ledgerBranchId: `${entry.packageId}:${branch.branchId}`,
      contributionId: entry.ledgerId,
      dossierId: branch.targetReference?.type === "dossier" ? branch.targetReference.id : null,
      selectedActionHint: branch.selectedAction,
    },
    ssotSource: "create_contribution_ledger",
    sortTimestamp: timestampForSort(entry.updatedAt),
  };
}

function isDuplicateManualAnlassraumLocalDraft(params: {
  startDraft: StartDraftContext;
  manualDrafts: readonly ManualAnlassraumServerDraftSnapshot[];
}) {
  if (
    params.startDraft.targetHint !== "rounds" &&
    params.startDraft.origin !== "round_handoff"
  ) {
    return false;
  }

  return params.manualDrafts.some((draft) =>
    draftSsotTextsMatch(
      params.startDraft.text,
      buildManualAnlassraumPrefill(draft.setup),
    ),
  );
}

export function buildAccountResumeWorkbenchItems(params: {
  entries: CreateContributionLedgerEntry[];
  startDraft?: StartDraftContext | null;
  manualAnlassraumServerDrafts?: ManualAnlassraumServerDraftSnapshot[];
  canDeepResearch?: boolean;
}): ResumeWorkbenchItem[] {
  const items: ResumeWorkbenchItem[] = [];
  const manualDrafts = params.manualAnlassraumServerDrafts ?? [];

  if (
    params.startDraft &&
    !isDuplicateManualAnlassraumLocalDraft({
      startDraft: params.startDraft,
      manualDrafts,
    })
  ) {
    items.push(buildLocalDraftResumeItem(params.startDraft, params.canDeepResearch === true));
  }

  for (const draft of manualDrafts) {
    items.push(buildManualAnlassraumServerDraftResumeItem(draft));
  }

  const entries = dedupeCreateContributionLedgerEntries(params.entries);
  for (const entry of entries) {
    for (const branch of entry.branches) {
      items.push(buildResumeItemFromBranch(entry, branch, params.canDeepResearch === true));
    }
  }

  return items.sort((left, right) => right.sortTimestamp - left.sortTimestamp);
}

export function buildAccountUnifiedWorkItems(params: {
  entries: CreateContributionLedgerEntry[];
  startDraft?: StartDraftContext | null;
  manualAnlassraumServerDrafts?: ManualAnlassraumServerDraftSnapshot[];
  canDeepResearch?: boolean;
  runtimeLinkages?: AccountUserScopedRuntimeLinkage[];
}) {
  const runtimeLinkages = params.runtimeLinkages ?? [];
  const resumeItems = buildAccountResumeWorkbenchItems(params);
  const unified: AccountUnifiedWorkItem[] = [];
  const correlatedHandoffIds = new Set<string>();

  for (const item of resumeItems) {
    const correlation =
      item.correlationRef
        ? buildAccountContributionHandoffCorrelation({
            contributionRef: item.correlationRef,
            runtimeLinkages,
          })
        : null;
    if (correlation?.persistedHandoffRef?.handoffId) {
      correlatedHandoffIds.add(correlation.persistedHandoffRef.handoffId);
    }
    unified.push({
      kind: "resume_item",
      id: item.id,
      sortTimestamp: item.sortTimestamp,
      item,
      correlation,
      ssotPolicy: getAccountDraftSsotPolicy(item.ssotSource),
    });
  }

  for (const linkage of runtimeLinkages) {
    if (correlatedHandoffIds.has(linkage.persistedHandoffRef.handoffId)) continue;
    unified.push({
      kind: "runtime_linkage",
      id: `runtime-linkage-${linkage.persistedHandoffRef.handoffId}`,
      sortTimestamp: timestampForSort(linkage.contributionRef.updatedAt),
      linkage,
      ssotPolicy: getAccountDraftSsotPolicy("user_scoped_runtime_linkage"),
    });
  }

  return unified.sort((left, right) => right.sortTimestamp - left.sortTimestamp);
}

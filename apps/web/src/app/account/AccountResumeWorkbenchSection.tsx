"use client";

import * as React from "react";
import Link from "next/link";
import { FiCompass, FiEdit2, FiMapPin } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { CreateBranchLedgerItem, CreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import { dedupeCreateContributionLedgerEntries } from "@features/create/createContributionLedger";
import type { AccountUserScopedRuntimeLinkage } from "@features/account/userScopedRuntimeLinkageTypes";
import {
  buildLedgerBranchAnchorId,
  resolveBranchHandoffTarget,
} from "@/features/create/branchHandoffTargets";
import {
  clearStartDraftContext,
  getStartDraftGuardrailSummary,
  getStartDraftSurfaceLabel,
  getStartDraftStatusLabel,
  readStartDraftContext,
  type StartDraftContext,
} from "@/features/start/startDraftContext";
import {
  resolveDraftNextActionsForResumeItem,
  type DraftNextActionOption,
} from "@/features/start/draftNextActionGate";
import V3AccountResumeWorkflow, {
  buildV3AccountResumeWorkflowFromLedgerBranch,
  buildV3AccountResumeWorkflowFromStartDraft,
  type V3AccountResumeWorkflowModel,
} from "@/features/create/V3AccountResumeWorkflow";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromLedgerBranch,
  buildV3DownstreamKiTransparencyFromReviewContext,
  buildV3DownstreamKiTransparencyFromStartDraft,
  type V3DownstreamKiTransparencyModel,
} from "@/features/create/V3DownstreamKiTransparency";
import V3ReviewContextSummary from "@/features/create/V3ReviewContextSummary";
import V3RuntimeWorkflowSurface, {
  buildV3RuntimeWorkflowSurfaceFromReviewContext,
} from "@/features/create/V3RuntimeWorkflowSurface";
import {
  LANDING_EDITORIAL_REVIEW_STORAGE_KEY,
  LANDING_START_CREATE_LIGHT_STORAGE_KEY,
} from "@/features/start/landingCreateLight";

type ResumeWorkbenchItemType = "Beitrag" | "Thema" | "Runde" | "Redaktion";

type ResumeWorkbenchItem = {
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
};

type AccountResumeWorkbenchSectionProps = {
  entries: CreateContributionLedgerEntry[];
  initialStartDraft?: StartDraftContext | null;
  canDeepResearch?: boolean;
  runtimeLinkages?: AccountUserScopedRuntimeLinkage[];
};

function sectionHeading(props: { id: string; title: string; description: string; icon: IconType }) {
  const Icon = props.icon;
  return (
    <div className="flex flex-col gap-1">
      <h2 id={props.id} className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[rgb(var(--fg))]">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-300/30">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>{props.title}</span>
      </h2>
      <p className="text-xs text-[rgb(var(--muted))]">{props.description}</p>
    </div>
  );
}

function canUseBrowserSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function removeSessionItem(key: string) {
  if (!canUseBrowserSessionStorage()) return;
  window.sessionStorage.removeItem(key);
}

function linkageStatusLabel(value: AccountUserScopedRuntimeLinkage["linkageStatus"]) {
  if (value === "linked") return "Verknüpft";
  if (value === "partially_linked") return "Teilweise verknüpft";
  if (value === "blocked_by_runtime_truth") return "Runtime-Wahrheit fehlt";
  if (value === "blocked_by_review") return "Durch Review blockiert";
  if (value === "blocked_by_provider") return "Durch Provider-Gate blockiert";
  if (value === "not_available") return "Noch nicht verfügbar";
  return "Noch nicht verknüpft";
}

function runtimeTruthLevelLabel(value: AccountUserScopedRuntimeLinkage["runtimeTruthLevel"]) {
  if (value === "runtime_confirmed") return "Weitergeführte Runtime";
  if (value === "output_readmodel") return "Output-/Voxy-Readmodel";
  if (value === "participation_readmodel") return "Participation-Readmodel";
  if (value === "dossier_readmodel") return "Dossier-Readmodel";
  if (value === "review_readmodel") return "Persistierter Review-Handoff";
  if (value === "ledger") return "Server-Ledger";
  return "Lokaler Draft";
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
    downstreamTransparency: buildV3DownstreamKiTransparencyFromLedgerBranch({
      branch,
      draftSaveStatus: entry.draftSaveStatus,
      handoff,
      workflow,
    }),
  };
}

export function buildAccountResumeWorkbenchItems(params: {
  entries: CreateContributionLedgerEntry[];
  startDraft?: StartDraftContext | null;
  canDeepResearch?: boolean;
}): ResumeWorkbenchItem[] {
  const items: ResumeWorkbenchItem[] = [];
  if (params.startDraft) {
    items.push(buildLocalDraftResumeItem(params.startDraft, params.canDeepResearch === true));
  }

  const entries = dedupeCreateContributionLedgerEntries(params.entries);
  for (const entry of entries) {
    for (const branch of entry.branches) {
      items.push(buildResumeItemFromBranch(entry, branch, params.canDeepResearch === true));
    }
  }

  return items;
}

function ResumeWorkbenchCard(props: {
  item: ResumeWorkbenchItem;
  onDiscard?: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {props.item.type}
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {props.item.status}
        </span>
        {props.item.isLocalOnly ? (
          <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
            Lokaler Entwurf
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{props.item.title}</p>
        <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{props.item.excerpt}</p>
        <p className="text-xs font-medium text-[rgb(var(--fg))]">Nächster Schritt: {props.item.nextStep}</p>
        {props.item.nextActionStatusLabel ? (
          <p className="text-xs text-[rgb(var(--muted))]">{props.item.nextActionStatusLabel}</p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.item.guardrails.map((line) => (
          <span
            key={`${props.item.id}-${line}`}
            className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]"
          >
            {line}
          </span>
        ))}
      </div>
      {props.item.nextActions.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Sinnvolle nächste Schritte
          </p>
          <div className="flex flex-wrap gap-2">
            {props.item.nextActions.slice(0, 3).map((action) => (
              <Link
                key={`${props.item.id}-${action.kind}`}
                href={action.href}
                className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
                title={action.description}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <V3AccountResumeWorkflow
        model={props.item.workflow}
        dataTestId={`account-resume-workflow-${props.item.id}`}
      />
      <V3DownstreamKiTransparency
        model={props.item.downstreamTransparency}
        dataTestId={`account-resume-downstream-ki-${props.item.id}`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={props.item.href} className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold">
          Weiterarbeiten
        </Link>
        {props.item.discardable && props.onDiscard ? (
          <button
            type="button"
            className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
            onClick={props.onDiscard}
          >
            Verwerfen
          </button>
        ) : null}
      </div>
    </article>
  );
}

function RuntimeLinkageCard(props: {
  linkage: AccountUserScopedRuntimeLinkage;
}) {
  const downstreamModel = buildV3DownstreamKiTransparencyFromReviewContext(
    props.linkage.v3ReviewContext,
    "workspace",
  );
  const runtimeWorkflowModel = buildV3RuntimeWorkflowSurfaceFromReviewContext(
    props.linkage.v3ReviewContext,
  );

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Verbundener Arbeitsstand
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {linkageStatusLabel(props.linkage.linkageStatus)}
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {runtimeTruthLevelLabel(props.linkage.runtimeTruthLevel)}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">
          {props.linkage.contributionRef.title}
        </p>
        <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
          {props.linkage.contributionRef.summary}
        </p>
        <p className="text-xs font-medium text-[rgb(var(--fg))]">
          Status: {props.linkage.userVisibleStatus}
        </p>
        <p className="text-xs font-medium text-[rgb(var(--fg))]">
          Nächster Schritt: {props.linkage.nextStep}
        </p>
        {props.linkage.adminReason ? (
          <p className="text-xs text-[rgb(var(--muted))]">
            Warum noch nicht vollständig sichtbar: {props.linkage.adminReason}
          </p>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Verbundene Arbeitsstände
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {props.linkage.surfaces.map((surface) => (
            <div
              key={`${props.linkage.contributionRef.handoffId}-${surface.kind}`}
              className="rounded-2xl border border-slate-200/80 px-3 py-3 text-xs dark:border-[rgb(var(--border))]"
            >
              <p className="font-semibold text-[rgb(var(--fg))]">{surface.label}</p>
              <p className="mt-1 text-[rgb(var(--fg))]">{surface.stateLabel}</p>
              <p className="mt-1 text-[rgb(var(--muted))]">{surface.summary}</p>
            </div>
          ))}
        </div>
      </div>
      {props.linkage.linkageGaps.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.linkage.linkageGaps.slice(0, 4).map((line) => (
            <span
              key={`${props.linkage.contributionRef.handoffId}-${line}`}
              className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]"
            >
              {line}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3">
        <V3ReviewContextSummary
          context={props.linkage.v3ReviewContext}
          audience="workspace"
          title="V3-Review-Kontext"
          dataTestId={`account-runtime-linkage-context-${props.linkage.contributionRef.handoffId}`}
        />
      </div>
      <div className="mt-3">
        <V3RuntimeWorkflowSurface
          model={runtimeWorkflowModel}
          dataTestId={`account-runtime-linkage-workflow-${props.linkage.contributionRef.handoffId}`}
        />
      </div>
      <V3DownstreamKiTransparency
        model={downstreamModel}
        title="Downstream-KI-Transparenz"
        dataTestId={`account-runtime-linkage-downstream-${props.linkage.contributionRef.handoffId}`}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={props.linkage.contributionRef.href}
          className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
        >
          Im Create-Kontext öffnen
        </Link>
        {props.linkage.dossierWorkspaceRef?.href ? (
          <Link
            href={props.linkage.dossierWorkspaceRef.href}
            className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
          >
            Dossier-Studio öffnen
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export default function AccountResumeWorkbenchSection(
  props: AccountResumeWorkbenchSectionProps,
) {
  const [startDraft, setStartDraft] = React.useState<StartDraftContext | null>(
    props.initialStartDraft ?? null,
  );

  React.useEffect(() => {
    if (props.initialStartDraft !== undefined) return;
    setStartDraft(readStartDraftContext());
  }, [props.initialStartDraft]);

  const items = React.useMemo(
    () =>
      buildAccountResumeWorkbenchItems({
        entries: props.entries,
        startDraft,
        canDeepResearch: props.canDeepResearch,
      }),
    [props.canDeepResearch, props.entries, startDraft],
  );
  const runtimeLinkages = props.runtimeLinkages ?? [];
  const hasAnyWorkState = items.length > 0 || runtimeLinkages.length > 0;

  return (
    <section
      className="rounded-[28px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] px-4 py-4 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
      data-testid="account-resume-workbench"
    >
      {sectionHeading({
        id: "account-resume-workbench",
        title: "Meine Arbeitsstände",
        description:
          "Hier findest du lokale, servergesicherte und verknüpfte Review-/Runtime-Arbeitsstände wieder. Nichts davon ist automatisch veröffentlicht, aktiviert oder freigegeben.",
        icon: FiCompass,
      })}
      {hasAnyWorkState ? (
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {items.map((item) => (
            <ResumeWorkbenchCard
              key={item.id}
              item={item}
              onDiscard={
                item.discardable
                  ? () => {
                      clearAccountLocalStartDraftArtifacts();
                      setStartDraft(null);
                    }
                  : undefined
              }
            />
          ))}
          {runtimeLinkages.map((linkage) => (
            <RuntimeLinkageCard
              key={`runtime-linkage-${linkage.contributionRef.handoffId}`}
              linkage={linkage}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300/70 px-4 py-4 text-sm text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Noch keine offenen Arbeitsstände.</p>
          <p className="mt-2">
            Starte einen neuen Beitrag oder schau dir bestehende Themen an, wenn du direkt weiterarbeiten willst.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/start" className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold">
              Neuen Beitrag starten
            </Link>
            <Link href="/themen" className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold">
              Themen ansehen
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

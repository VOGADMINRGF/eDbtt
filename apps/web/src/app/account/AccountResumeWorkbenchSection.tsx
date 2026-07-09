"use client";

import * as React from "react";
import Link from "next/link";
import { FiCompass } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import type { AccountUserScopedRuntimeLinkage } from "@features/account/userScopedRuntimeLinkageTypes";
import type {
  AccountContributionHandoffCorrelation,
} from "@features/account/contributionHandoffCorrelationTypes";
import type { ManualAnlassraumServerDraftSnapshot } from "@/features/surfaces/runden/manualAnlassraumSetup";
import type { StartDraftContext } from "@/features/start/startDraftContext";
import {
  buildAccountResumeWorkbenchItems,
  buildAccountUnifiedWorkItems,
  clearAccountLocalStartDraftArtifacts,
  resolveAccountResumeHrefFromStartDraft,
  type AccountUnifiedWorkItem,
  type ResumeWorkbenchItem,
} from "@features/account/buildAccountUnifiedWorkItems";
import V3AccountResumeWorkflow from "@/features/create/V3AccountResumeWorkflow";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromReviewContext,
} from "@/features/create/V3DownstreamKiTransparency";
import OutputSocialWorkbenchPanel from "@/features/create/OutputSocialWorkbenchPanel";
import ParticipationActivationReviewPanel from "@/features/create/ParticipationActivationReviewPanel";
import PollQuestionOptionsReviewPanel from "@/features/create/PollQuestionOptionsReviewPanel";
import V3ReviewContextSummary from "@/features/create/V3ReviewContextSummary";
import SourceFactcheckFeedEnrichmentPanel from "@/features/create/SourceFactcheckFeedEnrichmentPanel";
import V3RuntimeWorkflowSurface, {
  buildV3RuntimeWorkflowSurfaceFromReviewContext,
} from "@/features/create/V3RuntimeWorkflowSurface";
import V3VoxyCocreationDialog from "@/features/create/V3VoxyCocreationDialogPanel";
import VoxyRenderAdapterNoopPanel from "@/features/create/VoxyRenderAdapterNoopPanel";
import VoxyRenderAssetProviderRegistryPanel from "@/features/create/VoxyRenderAssetProviderRegistryPanel";
import VoxyRenderRequestDraftPanel from "@/features/create/VoxyRenderRequestDraftPanel";
import VoxyBriefingScriptCandidatePanel from "@/features/create/VoxyBriefingScriptCandidatePanel";
import VoxyRenderPreflightReadinessPanel from "@/features/create/VoxyRenderPreflightReadinessPanel";
import VoxyRenderProviderHandoffPanel from "@/features/create/VoxyRenderProviderHandoffPanel";
import VoxyRenderReviewDecisionGatePanel from "@/features/create/VoxyRenderReviewDecisionGatePanel";
import {
  buildVoxyRenderDecisionPersistencePanelModel,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
  buildVoxyRenderRequestDraftPanelModel,
} from "@/features/create/voxyRenderRequestDraftContract";
import DossierWorkspaceDecisionPanel from "@/features/create/DossierWorkspaceDecisionPanel";
import {
  buildDossierWorkspaceDecisionFromReviewContext,
  buildDossierWorkspaceDecisionFromVoxyDialog,
} from "@/features/create/dossierWorkspaceDecisionContract";
import {
  buildOutputSocialWorkbenchFromReviewContext,
  buildOutputSocialWorkbenchFromVoxyDialog,
} from "@/features/create/outputSocialWorkbenchContract";
import {
  buildParticipationActivationReviewFromReviewContext,
  buildParticipationActivationReviewFromVoxyDialog,
} from "@/features/create/participationActivationReviewContract";
import {
  buildPollQuestionOptionsReviewFromReviewContext,
  buildPollQuestionOptionsReviewFromVoxyDialog,
} from "@/features/create/pollQuestionOptionsReviewContract";
import { buildVoxyCocreationDialogFromReviewContext } from "@/features/create/voxyCocreationDialogContract";
import {
  buildSourceFactcheckFeedEnrichmentFromReviewContext,
  buildSourceFactcheckFeedEnrichmentFromVoxyDialog,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import { readStartDraftContext } from "@/features/start/startDraftContext";

type AccountResumeWorkbenchSectionProps = {
  entries: CreateContributionLedgerEntry[];
  initialStartDraft?: StartDraftContext | null;
  manualAnlassraumServerDrafts?: ManualAnlassraumServerDraftSnapshot[];
  canDeepResearch?: boolean;
  runtimeLinkages?: AccountUserScopedRuntimeLinkage[];
};

function sectionHeading(props: { id: string; title: string; description: string; icon: IconType }) {
  const Icon = props.icon;
  return (
    <div className="flex flex-col gap-1">
      <h2
        id={props.id}
        className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[rgb(var(--fg))]"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-300/30">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>{props.title}</span>
      </h2>
      <p className="text-xs text-[rgb(var(--muted))]">{props.description}</p>
    </div>
  );
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

function correlationStrengthLabel(
  value: AccountContributionHandoffCorrelation["correlationStrength"],
) {
  if (value === "exact") return "Exakt verbunden";
  if (value === "strong") return "Stark verbunden";
  if (value === "partial") return "Teilweise verbunden";
  if (value === "suggested") return "Mögliche Verbindung";
  if (value === "blocked") return "Blockiert";
  return "Nicht verbunden";
}

function correlationBasisLabel(
  value: AccountContributionHandoffCorrelation["correlationBasis"],
) {
  if (value === "shared_id") return "Gemeinsame Kennung";
  if (value === "source_handoff_id") return "Explizite Handoff-Referenz";
  if (value === "source_draft_id") return "Explizite Draft-Referenz";
  if (value === "ledger_branch_id") return "Gemeinsame Branch-ID";
  if (value === "provenance") return "Bestehende Provenance";
  if (value === "created_by_and_dossier_id") return "Dossier und Nutzerkontext";
  if (value === "existing_review_context") return "Bestehender Review-Kontext";
  if (value === "existing_runtime_readmodel") return "Bestehendes Runtime-Readmodel";
  if (value === "text_similarity_suggestion") return "Nur Textähnlichkeit";
  return "Keine belastbare Basis";
}

function SsotPolicyPanel(props: {
  label: string;
  summary: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 px-3 py-3 text-xs dark:border-[rgb(var(--border))]">
      <p className="font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
        Aktuelle SSOT-Lesewahrheit
      </p>
      <p className="mt-2 font-medium text-[rgb(var(--fg))]">{props.label}</p>
      <p className="mt-1 leading-5 text-[rgb(var(--muted))]">{props.summary}</p>
    </div>
  );
}

function ResumeWorkbenchCard(props: {
  item: ResumeWorkbenchItem;
  correlation: AccountContributionHandoffCorrelation | null;
  ssotLabel: string;
  ssotSummary: string;
  onDiscard?: () => void;
}) {
  const dossierWorkspaceDecisionModel = buildDossierWorkspaceDecisionFromVoxyDialog(
    props.item.voxyCocreationDialog,
    {
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      surface: "account",
      nextStep: props.item.nextStep,
    },
  );
  const participationActivationReviewModel =
    buildParticipationActivationReviewFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const pollQuestionOptionsReviewModel =
    buildPollQuestionOptionsReviewFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const outputSocialWorkbenchModel =
    buildOutputSocialWorkbenchFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyBriefingScriptCandidateModel =
    buildVoxyBriefingScriptCandidateFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderProviderHandoffModel =
    buildVoxyRenderProviderHandoffFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderPreflightReadinessModel =
    buildVoxyRenderPreflightReadinessFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderAssetProviderRegistryModel =
    buildVoxyRenderAssetProviderRegistryFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderAdapterNoopModel =
    buildVoxyRenderAdapterNoopFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderReviewDecisionGateModel =
    buildVoxyRenderReviewDecisionGateFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderDecisionPersistenceModel =
    buildVoxyRenderDecisionPersistencePanelModel({
      gate: voxyRenderReviewDecisionGateModel,
    });
  const voxyRenderRequestDraftModel = buildVoxyRenderRequestDraftPanelModel({
    draft: buildVoxyRenderRequestDraftFromVoxyDialog(props.item.voxyCocreationDialog, {
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      nextStep: props.item.nextStep,
    }),
  });

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
        <p className="text-xs font-medium text-[rgb(var(--fg))]">
          Nächster Schritt: {props.item.nextStep}
        </p>
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
      <V3VoxyCocreationDialog
        model={props.item.voxyCocreationDialog}
        dataTestId={`account-resume-voxy-cocreation-${props.item.id}`}
      />
      <SourceFactcheckFeedEnrichmentPanel
        model={buildSourceFactcheckFeedEnrichmentFromVoxyDialog(
          props.item.voxyCocreationDialog,
          {
            surface: "account",
            nextStep: props.item.nextStep,
            userVisibleReason:
              "Im Account bleibt dieser Block ein vorbereiteter Arbeitsstand und startet keine Recherche.",
            reviewerVisibleReason:
              "Lokale, servergesicherte oder resume-fähige Beiträge zeigen nur vorbereiteten Quellen- und Faktencheckbedarf.",
            runtimeTruthMissing: true,
          },
        )}
        dataTestId={`account-resume-source-factcheck-feed-${props.item.id}`}
      />
      <DossierWorkspaceDecisionPanel
        model={dossierWorkspaceDecisionModel}
        title="Dossier-Entscheidungslogik"
        dataTestId={`account-resume-dossier-decision-${props.item.id}`}
      />
      <ParticipationActivationReviewPanel
        model={participationActivationReviewModel}
        title="Beteiligungsraum vorbereiten"
        dataTestId={`account-resume-participation-activation-${props.item.id}`}
      />
      <PollQuestionOptionsReviewPanel
        model={pollQuestionOptionsReviewModel}
        title="Poll/Frage vorbereiten"
        dataTestId={`account-resume-poll-question-options-${props.item.id}`}
      />
      <OutputSocialWorkbenchPanel
        model={outputSocialWorkbenchModel}
        title="Ausgabe vorbereiten"
        dataTestId={`account-resume-output-social-workbench-${props.item.id}`}
      />
      <VoxyBriefingScriptCandidatePanel
        model={voxyBriefingScriptCandidateModel}
        title="Voxy-Briefing vorbereiten"
        dataTestId={`account-resume-voxy-briefing-script-${props.item.id}`}
      />
      <VoxyRenderReviewDecisionGatePanel
        model={voxyRenderReviewDecisionGateModel}
        persistenceModel={voxyRenderDecisionPersistenceModel}
        title="Render-Entscheidung"
        dataTestId={`account-resume-voxy-render-decision-${props.item.id}`}
      />
      <VoxyRenderRequestDraftPanel
        model={voxyRenderRequestDraftModel}
        dataTestId={`account-resume-voxy-render-request-draft-${props.item.id}`}
      />
      <VoxyRenderProviderHandoffPanel
        model={voxyRenderProviderHandoffModel}
        title="Voxy-Render/Provider-Handoff vorbereiten"
        dataTestId={`account-resume-voxy-render-provider-handoff-${props.item.id}`}
      />
      <VoxyRenderPreflightReadinessPanel
        model={voxyRenderPreflightReadinessModel}
        title="Voxy-Render-Preflight vorbereiten"
        dataTestId={`account-resume-voxy-render-preflight-${props.item.id}`}
      />
      <VoxyRenderAssetProviderRegistryPanel
        model={voxyRenderAssetProviderRegistryModel}
        title="Voxy Asset- & Provider-Registry"
        dataTestId={`account-resume-voxy-render-registry-${props.item.id}`}
      />
      <VoxyRenderAdapterNoopPanel
        model={voxyRenderAdapterNoopModel}
        title="Render-Adapter vorbereiten"
        dataTestId={`account-resume-voxy-render-adapter-${props.item.id}`}
      />
      <SsotPolicyPanel label={props.ssotLabel} summary={props.ssotSummary} />
      {props.correlation ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 px-3 py-3 text-xs dark:border-[rgb(var(--border))]">
          <p className="font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Verknüpfung zum Arbeitsstand
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
              {correlationStrengthLabel(props.correlation.correlationStrength)}
            </span>
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
              {correlationBasisLabel(props.correlation.correlationBasis)}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-[rgb(var(--fg))]">Handoff: {props.correlation.userVisibleLabel}</p>
            <p className="text-[rgb(var(--fg))]">
              Review: {props.correlation.reviewQueueRef?.stateLabel ?? "Noch kein persisted Review-Handoff"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              Dossier: {props.correlation.dossierWorkspaceRef?.stateLabel ?? "Noch kein direkt verknüpfter Dossier-Arbeitsstand"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              Beteiligung: {props.correlation.participationRef?.stateLabel ?? "Noch kein direkt verknüpfter Beteiligungs-Arbeitsstand"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              Output/Voxy: {props.correlation.outputDraftRef?.stateLabel ?? props.correlation.voxyBriefingRef?.stateLabel ?? "Noch kein verknüpfter Output- oder Voxy-Arbeitsstand"}
            </p>
            {props.correlation.adminReason ? (
              <p className="text-[rgb(var(--muted))]">
                {props.correlation.correlationStrength === "exact" ||
                props.correlation.correlationStrength === "strong" ||
                props.correlation.correlationStrength === "partial"
                  ? "Warum diese Verbindung belastbar ist: "
                  : "Warum sie noch nicht belastbar ist: "}
                {props.correlation.adminReason}
              </p>
            ) : null}
            <p className="font-medium text-[rgb(var(--fg))]">
              Nächster Schritt: {props.correlation.nextStep}
            </p>
          </div>
          {props.correlation.persistedHandoffRef ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={props.correlation.persistedHandoffRef.href}
                className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
              >
                Persisted Handoff öffnen
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={props.item.href}
          className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
        >
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
  ssotLabel: string;
  ssotSummary: string;
}) {
  const downstreamModel = buildV3DownstreamKiTransparencyFromReviewContext(
    props.linkage.v3ReviewContext,
    "workspace",
  );
  const runtimeWorkflowModel = buildV3RuntimeWorkflowSurfaceFromReviewContext(
    props.linkage.v3ReviewContext,
  );
  const voxyCocreationDialog = buildVoxyCocreationDialogFromReviewContext(
    props.linkage.v3ReviewContext,
    {
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      surface: "account",
      maxCards: 4,
    },
  );
  const sourceFactcheckFeedModel = buildSourceFactcheckFeedEnrichmentFromReviewContext(
    props.linkage.v3ReviewContext,
    {
      audience: "workspace",
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
    },
  );
  const dossierWorkspaceDecisionModel = buildDossierWorkspaceDecisionFromReviewContext(
    props.linkage.v3ReviewContext,
    {
      audience: "workspace",
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      dossierRef: props.linkage.dossierWorkspaceRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.dossierWorkspaceRef.title,
            href: props.linkage.dossierWorkspaceRef.href,
          }
        : null,
    },
  );
  const participationActivationReviewModel =
    buildParticipationActivationReviewFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
      },
    );
  const pollQuestionOptionsReviewModel =
    buildPollQuestionOptionsReviewFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
      },
    );
  const outputSocialWorkbenchModel =
    buildOutputSocialWorkbenchFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
      },
    );
  const voxyBriefingScriptCandidateModel =
    buildVoxyBriefingScriptCandidateFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        participationRef: props.linkage.participationRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.participationRef.title,
              href: props.linkage.participationRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderProviderHandoffModel =
    buildVoxyRenderProviderHandoffFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderPreflightReadinessModel =
    buildVoxyRenderPreflightReadinessFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        participationRef: props.linkage.participationRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.participationRef.title,
              href: props.linkage.participationRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderAssetProviderRegistryModel =
    buildVoxyRenderAssetProviderRegistryFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderAdapterNoopModel =
    buildVoxyRenderAdapterNoopFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderReviewDecisionGateModel =
    buildVoxyRenderReviewDecisionGateFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderDecisionPersistenceModel =
    buildVoxyRenderDecisionPersistencePanelModel({
      gate: voxyRenderReviewDecisionGateModel,
    });
  const voxyRenderRequestDraftModel = buildVoxyRenderRequestDraftPanelModel({
    draft: buildVoxyRenderRequestDraftFromReviewContext(props.linkage.v3ReviewContext, {
      audience: "workspace",
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      dossierRef: props.linkage.dossierWorkspaceRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.dossierWorkspaceRef.title,
            href: props.linkage.dossierWorkspaceRef.href,
          }
        : null,
      outputRef: props.linkage.outputDraftRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.outputDraftRef.title,
            href: props.linkage.outputDraftRef.href,
          }
        : props.linkage.voxyBriefingRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.voxyBriefingRef.title,
              href: props.linkage.voxyBriefingRef.href,
            }
          : null,
    }),
  });

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
      <V3VoxyCocreationDialog
        model={voxyCocreationDialog}
        dataTestId={`account-runtime-linkage-voxy-${props.linkage.contributionRef.handoffId}`}
      />
      <SourceFactcheckFeedEnrichmentPanel
        model={sourceFactcheckFeedModel}
        dataTestId={`account-runtime-linkage-source-factcheck-feed-${props.linkage.contributionRef.handoffId}`}
      />
      <DossierWorkspaceDecisionPanel
        model={dossierWorkspaceDecisionModel}
        title="Dossier-Entscheidungslogik"
        dataTestId={`account-runtime-linkage-dossier-decision-${props.linkage.contributionRef.handoffId}`}
      />
      <ParticipationActivationReviewPanel
        model={participationActivationReviewModel}
        title="Beteiligungsraum vorbereiten"
        dataTestId={`account-runtime-linkage-participation-activation-${props.linkage.contributionRef.handoffId}`}
      />
      <PollQuestionOptionsReviewPanel
        model={pollQuestionOptionsReviewModel}
        title="Poll/Frage vorbereiten"
        dataTestId={`account-runtime-linkage-poll-question-options-${props.linkage.contributionRef.handoffId}`}
      />
      <OutputSocialWorkbenchPanel
        model={outputSocialWorkbenchModel}
        title="Ausgabe vorbereiten"
        dataTestId={`account-runtime-linkage-output-social-workbench-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyBriefingScriptCandidatePanel
        model={voxyBriefingScriptCandidateModel}
        title="Voxy-Briefing im Account"
        dataTestId={`account-runtime-linkage-voxy-briefing-script-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderReviewDecisionGatePanel
        model={voxyRenderReviewDecisionGateModel}
        persistenceModel={voxyRenderDecisionPersistenceModel}
        title="Render-Entscheidung im Account"
        dataTestId={`account-runtime-linkage-voxy-render-decision-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderRequestDraftPanel
        model={voxyRenderRequestDraftModel}
        dataTestId={`account-runtime-linkage-voxy-render-request-draft-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderProviderHandoffPanel
        model={voxyRenderProviderHandoffModel}
        title="Voxy-Render/Provider-Handoff im Account"
        dataTestId={`account-runtime-linkage-voxy-render-provider-handoff-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderPreflightReadinessPanel
        model={voxyRenderPreflightReadinessModel}
        title="Voxy-Render-Preflight im Account"
        dataTestId={`account-runtime-linkage-voxy-render-preflight-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderAssetProviderRegistryPanel
        model={voxyRenderAssetProviderRegistryModel}
        title="Voxy Asset- & Provider-Registry im Account"
        dataTestId={`account-runtime-linkage-voxy-render-registry-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderAdapterNoopPanel
        model={voxyRenderAdapterNoopModel}
        title="Render-Adapter im Account"
        dataTestId={`account-runtime-linkage-voxy-render-adapter-${props.linkage.contributionRef.handoffId}`}
      />
      <SsotPolicyPanel label={props.ssotLabel} summary={props.ssotSummary} />
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

function renderUnifiedWorkItem(
  workItem: AccountUnifiedWorkItem,
  onDiscardStartDraft: () => void,
) {
  if (workItem.kind === "runtime_linkage") {
    return (
      <RuntimeLinkageCard
        key={workItem.id}
        linkage={workItem.linkage}
        ssotLabel={workItem.ssotPolicy.label}
        ssotSummary={workItem.ssotPolicy.summary}
      />
    );
  }

  return (
    <ResumeWorkbenchCard
      key={workItem.id}
      item={workItem.item}
      correlation={workItem.correlation}
      ssotLabel={workItem.ssotPolicy.label}
      ssotSummary={workItem.ssotPolicy.summary}
      onDiscard={workItem.item.discardable ? onDiscardStartDraft : undefined}
    />
  );
}

export {
  buildAccountResumeWorkbenchItems,
  clearAccountLocalStartDraftArtifacts,
  resolveAccountResumeHrefFromStartDraft,
};

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

  const unifiedItems = React.useMemo(
    () =>
      buildAccountUnifiedWorkItems({
        entries: props.entries,
        startDraft,
        manualAnlassraumServerDrafts: props.manualAnlassraumServerDrafts ?? [],
        canDeepResearch: props.canDeepResearch,
        runtimeLinkages: props.runtimeLinkages ?? [],
      }),
    [
      props.canDeepResearch,
      props.entries,
      props.initialStartDraft,
      props.manualAnlassraumServerDrafts,
      props.runtimeLinkages,
      startDraft,
    ],
  );
  const hasAnyWorkState = unifiedItems.length > 0;

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
          {unifiedItems.map((workItem) =>
            renderUnifiedWorkItem(workItem, () => {
              clearAccountLocalStartDraftArtifacts();
              setStartDraft(null);
            }),
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300/70 px-4 py-4 text-sm text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Noch keine offenen Arbeitsstände.</p>
          <p className="mt-2">
            Starte einen neuen Beitrag oder schau dir bestehende Themen an, wenn du direkt
            weiterarbeiten willst.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/start"
              className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
            >
              Neuen Beitrag starten
            </Link>
            <Link
              href="/themen"
              className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
            >
              Themen ansehen
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

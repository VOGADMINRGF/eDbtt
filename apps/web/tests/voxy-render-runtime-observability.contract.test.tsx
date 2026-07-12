import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderRuntimeObservabilityPanel from "@/features/create/VoxyRenderRuntimeObservabilityPanel";
import {
  buildVoxyRenderRuntimeObservabilityCommandFromReadmodels,
  buildVoxyRenderRuntimeObservabilityPanelModel,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";

function buildSchedulingPolicy(overrides?: Record<string, unknown>) {
  return {
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: null,
    createdAt: "2026-07-12T12:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    schedulingPolicyStatus: "scheduler_runtime_needed",
    scheduleCandidate: {
      scheduleCandidateId: null,
      status: "candidate_only",
      suggestedWindow: null,
      timezone: null,
      platform: "LinkedIn",
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: "Scheduling bleibt Kandidat.",
      userVisibleReason: "Noch kein echter Termin.",
    },
    publishWindow: {
      publishWindowId: null,
      status: "policy_needed",
      earliestPublishAt: null,
      latestPublishAt: null,
      timezonePolicyNeeded: true,
      platformTimingPolicyNeeded: true,
      reviewerVisibleReason: "Publish-Window-Policy fehlt.",
      userVisibleReason: "Noch kein belastbares Zeitfenster.",
    },
    calendarHint: {
      calendarHintId: null,
      status: "policy_needed",
      calendarEventCreated: false,
      calendarWriteAllowed: false,
      reminderCreated: false,
      reviewerVisibleReason: "Kalender-Policy fehlt.",
      userVisibleReason: "Noch kein Kalenderhinweis.",
    },
    schedulingSemantics: {
      scheduleCandidate: true,
      scheduled: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      postedAtAvailable: false,
      distributionTimeFinal: false,
      uploadReady: false,
      published: false,
      socialPosted: false,
    },
    executionFlags: {
      schedulingAllowed: false,
      schedulerJobAllowed: false,
      calendarWriteAllowed: false,
      reminderAllowed: false,
      publishAllowed: false,
      uploadAllowed: false,
      storageWriteAllowed: false,
      socialPostAllowed: false,
      autoPublishAllowed: false,
      createsMediaFile: false,
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    topBlockers: ["Scheduler-Runtime fehlt."],
    nextStep: "define_scheduler_runtime",
    userVisibleSummary: "Scheduling bleibt Noop.",
    reviewerVisibleSummary: "Scheduling bleibt audit-only.",
    uploadTargetPolicyStatusHint: "access_policy_needed",
    mediaStorageTruthStatusHint: "media_storage_truth_only",
    approvalStatusHint: "approval_required",
    publishReadinessGuardStatusHint: "approval_required",
    socialDistributionHandoffStatusHint: "blocked_by_scheduling_guard",
    previewReviewFlowStatusHint: "no_preview_available",
    ...overrides,
  } as any;
}

function buildMediaStorageTruth(overrides?: Record<string, unknown>) {
  return {
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    mediaStorageTruthStatus: "media_storage_truth_only",
    mediaSemantics: {
      mediaCandidate: true,
      mediaFileAvailable: true,
      previewFileAvailable: false,
      thumbnailAvailable: false,
      subtitleFileAvailable: false,
      sourceCaptionFileAvailable: false,
      storageWriteAllowed: false,
      uploadAllowed: false,
      published: false,
      socialPosted: false,
      scheduled: false,
    },
    ...overrides,
  } as any;
}

describe("voxy render runtime observability contract", () => {
  it("blocks when scheduling policy is missing", () => {
    const command = buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
      latestSchedulingPolicyRecord: null,
      latestUploadTargetPolicyRecord: {
        uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
        uploadTargetPolicyStatus: "access_policy_needed",
      } as any,
    });

    expect(command).toMatchObject({
      runtimeObservabilityStatus: "blocked_by_missing_scheduling_policy",
      nextStep: "blocked",
      schedulingPolicyId: null,
    });
  });

  it("keeps script-only flows out of runtime observability", () => {
    const command = buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
      latestSchedulingPolicyRecord: buildSchedulingPolicy({
        schedulingPolicyStatus: "keep_as_script_only",
      }),
    });

    expect(command).toMatchObject({
      runtimeObservabilityStatus: "keep_as_script_only",
      runtimeTraceCandidate: {
        status: "not_applicable",
        traceId: null,
      },
      semantics: {
        runtimeEnabled: false,
        auditEventsEmitted: false,
        metricsEmitted: false,
        alertsEmitted: false,
      },
    });
  });

  it("keeps missing media files separate from observability planning", () => {
    const command = buildVoxyRenderRuntimeObservabilityCommandFromReadmodels({
      latestSchedulingPolicyRecord: buildSchedulingPolicy({
        schedulingPolicyStatus: "blocked_by_missing_media_file",
      }),
      latestMediaStorageTruthRecord: buildMediaStorageTruth({
        mediaStorageTruthStatus: "blocked_by_missing_preview_file",
        mediaSemantics: {
          mediaCandidate: true,
          mediaFileAvailable: false,
          previewFileAvailable: false,
          thumbnailAvailable: false,
          subtitleFileAvailable: false,
          sourceCaptionFileAvailable: false,
          storageWriteAllowed: false,
          uploadAllowed: false,
          published: false,
          socialPosted: false,
          scheduled: false,
        },
      }),
    });

    expect(command).toMatchObject({
      runtimeObservabilityStatus: "blocked_by_missing_media_file",
      runtimeTraceCandidate: {
        status: "blocked",
        traceId: null,
      },
      semantics: {
        runtimeTraceAvailable: false,
        renderExecuted: false,
        uploadExecuted: false,
      },
      executionFlags: {
        monitoringProviderCallAllowed: false,
        runtimeExecutionAllowed: false,
        renderAllowed: false,
      },
    });
  });

  it("renders an honest runtime observability panel without fake runtime claims", () => {
    const model = buildVoxyRenderRuntimeObservabilityPanelModel({
      latestSchedulingPolicyRecord: buildSchedulingPolicy(),
      latestMediaStorageTruthRecord: buildMediaStorageTruth(),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderRuntimeObservabilityPanel
        model={model}
        dataTestId="voxy-render-runtime-observability"
      />,
    );

    expect(html).toContain("Runtime Observability");
    expect(html).toContain("Noch keine Runtime");
    expect(html).toContain("Keine Events emittiert");
    expect(html).toContain("Keine Metrics gesendet");
    expect(html).toContain("Keine Alerts ausgelöst");
    expect(html).toContain("Kein Monitoring Provider");
    expect(html).toContain("Keine Ausführung");
    expect(html).toContain("Noch keine Runtime Trace.");
    expect(html).not.toContain("Monitoring aktivieren");
    expect(html).not.toContain("Event emittieren");
    expect(html).not.toContain("Alert senden");
    expect(html).not.toContain("Runtime starten");
  });
});

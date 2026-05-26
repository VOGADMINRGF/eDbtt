import type { MasterPost } from "./masterPost";
import type {
  SocialDistributionChannel,
  SocialDistributionDraft,
  SocialDistributionPlan,
  SocialScheduleMode,
} from "./socialDistribution";
import { buildSocialDistributionDraft } from "./socialDistribution";

export type ExportValidationResult = {
  reviewRequired: boolean;
  errors: string[];
};

export type QrPrintPreview = {
  title: string;
  cta: string;
  dossierBacklink: string;
  qrTarget: string;
  reviewStatus: string;
  sourceStatus: string;
  caveats: string[];
};

export type SocialDistributionExportPayload = {
  dossierId: string;
  packageId: string;
  backlinkTarget: string;
  channels: SocialDistributionChannel[];
  scheduleMode: SocialScheduleMode;
  reviewRequired: boolean;
  queue: SocialDistributionDraft["queue"];
  text: string;
  generatedAt: string;
};

function validateCoreTargets(post: MasterPost): ExportValidationResult {
  const errors: string[] = [];
  if (!post.cta.trim()) errors.push("cta_missing");
  if (!post.backlinkTarget.trim()) errors.push("backlink_missing");
  if (!post.qrTarget.trim()) errors.push("qr_target_missing");
  return {
    reviewRequired: errors.length > 0 || post.reviewStatus !== "approved",
    errors,
  };
}

export function buildCopyText(post: MasterPost): string {
  return [
    post.title,
    "",
    post.hook,
    post.overallPicture,
    "",
    `Quellenlage: ${post.sourceSituation}`,
    `Offene Fragen: ${post.openQuestions.join(" | ")}`,
    `Optionen: ${post.options.join(" | ")}`,
    "",
    `Beteiligungsfrage: ${post.participationQuestion}`,
    `CTA: ${post.cta}`,
    `Dossier: ${post.backlinkTarget}`,
    `QR: ${post.qrTarget}`,
  ].join("\n");
}

export function buildDistributionPlan(input: {
  plan: SocialDistributionPlan;
  selectedChannels: SocialDistributionChannel[];
  scheduleMode: SocialScheduleMode;
  reviewRequired: boolean;
}): SocialDistributionDraft {
  return buildSocialDistributionDraft({
    plan: input.plan,
    selectedChannels: input.selectedChannels,
    scheduleMode: input.scheduleMode,
    reviewRequired: input.reviewRequired,
    status: input.reviewRequired ? "review_requested" : "draft_created",
  });
}

export function buildDraftRecord(input: {
  plan: SocialDistributionPlan;
  selectedChannels: SocialDistributionChannel[];
  reviewRequired: boolean;
}): SocialDistributionDraft {
  return buildSocialDistributionDraft({
    plan: input.plan,
    selectedChannels: input.selectedChannels,
    scheduleMode: "manual",
    reviewRequired: input.reviewRequired,
    status: "draft_created",
  });
}

export function buildQrPrintPreview(post: MasterPost): QrPrintPreview {
  const validation = validateCoreTargets(post);
  return {
    title: post.title,
    cta: post.cta,
    dossierBacklink: post.backlinkTarget,
    qrTarget: post.qrTarget,
    reviewStatus: validation.reviewRequired ? "review_required" : "ok",
    sourceStatus: post.sourceState.status,
    caveats: validation.errors.length > 0 ? validation.errors : post.reviewGuardrails.map((entry) => entry.message),
  };
}

export function validateDistributionExport(post: MasterPost): ExportValidationResult {
  return validateCoreTargets(post);
}

export function buildSocialDistributionExportPayload(input: {
  post: MasterPost;
  draft: SocialDistributionDraft;
}): SocialDistributionExportPayload {
  return {
    dossierId: input.draft.dossierId,
    packageId: input.draft.packageId,
    backlinkTarget: input.post.backlinkTarget,
    channels: [...input.draft.selectedChannels],
    scheduleMode: input.draft.scheduleMode,
    reviewRequired: input.draft.reviewRequired,
    queue: [...input.draft.queue],
    text: buildCopyText(input.post),
    generatedAt: new Date().toISOString(),
  };
}

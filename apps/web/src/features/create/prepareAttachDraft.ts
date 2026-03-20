import type { CreateAnalyzeMatchItem, CreateAnalyzeMatchType } from "@/features/create/analyzeContract";
import type { CreateCtaHandoff } from "@/features/create/ctaHandoff";

export type CreatePrepareAttachCtaId = "perspektive_anhaengen" | "zustimmen" | "anders_sehen";
export type CreatePrepareAttachTargetType = "claim" | "anlassraum" | "dossier" | "perspective";

export type CreatePrepareAttachTargetOption = {
  key: string;
  attachTargetType: CreatePrepareAttachTargetType;
  attachTargetId: string;
  attachTargetRef: string | null;
  title: string;
  matchType: CreateAnalyzeMatchType;
  reasons: string[];
};

export type CreatePrepareAttachDraft = {
  draftId: string;
  sourceRunId: string;
  ctaId: CreatePrepareAttachCtaId;
  attachTargetType: CreatePrepareAttachTargetType;
  attachTargetId: string | null;
  attachTargetRef?: string | null;
  sourceSummary: string;
  selectedReason?: string | null;
  requiresReview: true;
  noAutoPublish: true;
  noSilentMerge: true;
  createdAt: string;
};

function toAttachTargetType(
  value: CreateAnalyzeMatchItem["matchEntityType"],
): CreatePrepareAttachTargetType | null {
  if (value === "claim") return "claim";
  if (value === "anlassraum") return "anlassraum";
  if (value === "dossier") return "dossier";
  if (value === "perspective") return "perspective";
  return null;
}

function normalizeAttachCtaId(value: CreateCtaHandoff["ctaId"]): CreatePrepareAttachCtaId | null {
  if (value === "perspektive_anhaengen") return "perspektive_anhaengen";
  if (value === "zustimmen") return "zustimmen";
  if (value === "anders_sehen") return "anders_sehen";
  return null;
}

export function canCreatePrepareAttachDraftFromHandoff(handoff: CreateCtaHandoff): boolean {
  return (
    handoff.actionType === "prepare_attach" &&
    normalizeAttachCtaId(handoff.ctaId) !== null
  );
}

export function derivePrepareAttachTargetOptions(matches: CreateAnalyzeMatchItem[]): CreatePrepareAttachTargetOption[] {
  const deduped = new Map<string, CreatePrepareAttachTargetOption>();
  for (const match of matches) {
    const attachTargetType = toAttachTargetType(match.matchEntityType);
    const attachTargetId = String(match.entityId || "").trim();
    if (!attachTargetType || !attachTargetId) continue;
    const key = `${attachTargetType}:${attachTargetId}`;
    if (deduped.has(key)) continue;
    deduped.set(key, {
      key,
      attachTargetType,
      attachTargetId,
      attachTargetRef: match.targetRef ?? null,
      title: match.label || `${attachTargetType}:${attachTargetId}`,
      matchType: match.matchType,
      reasons: Array.isArray(match.reasons) ? match.reasons.slice(0, 4) : [],
    });
  }
  return Array.from(deduped.values());
}

export function resolveInitialPrepareAttachTargetKey(params: {
  options: CreatePrepareAttachTargetOption[];
  handoff: CreateCtaHandoff;
}): string | null {
  if (params.options.length === 0) return null;
  if (params.options.length === 1) return params.options[0].key;

  if (params.handoff.entityType && params.handoff.entityId) {
    const candidateKey = `${params.handoff.entityType}:${params.handoff.entityId}`;
    const found = params.options.find((entry) => entry.key === candidateKey);
    if (found) return found.key;
  }
  return null;
}

export function buildCreatePrepareAttachDraftInput(params: {
  sourceRunId: string;
  sourceSummary: string;
  handoff: CreateCtaHandoff;
  selectedTarget: CreatePrepareAttachTargetOption;
  selectedReason?: string | null;
}): Omit<CreatePrepareAttachDraft, "draftId" | "createdAt"> {
  const ctaId = normalizeAttachCtaId(params.handoff.ctaId);
  if (!ctaId) {
    throw new Error("invalid_prepare_attach_cta");
  }
  return {
    sourceRunId: params.sourceRunId,
    ctaId,
    attachTargetType: params.selectedTarget.attachTargetType,
    attachTargetId: params.selectedTarget.attachTargetId,
    attachTargetRef: params.selectedTarget.attachTargetRef,
    sourceSummary: params.sourceSummary.trim(),
    selectedReason: params.selectedReason?.trim() || null,
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
  };
}

import "server-only";

import {
  buildHonestMetadataCapabilities,
  getAiTransparencyLabelKey,
  type AiTransparencyRecord,
  type AiTransparencyResponsibleRole,
} from "@features/ai/aiTransparencyContract";
import {
  CONTENT_RELEASE_AI_CLASSIFICATIONS,
  contentReleaseArtifactIdForRecord,
  contentReleaseAuditActionForAction,
  contentReleaseAuditEventIdFor,
  contentReleaseReviewItemIdForSource,
  getContentReleaseTargetRecord,
  listContentReleaseAuditEvents,
  updateContentReleaseTargetFromSourceResult,
  type ContentReleaseAction,
  type ContentReleaseAiClassification,
  type ContentReleaseSourceKind,
  type ContentReleaseTargetRecord,
  type ContentReleaseTargetType,
} from "@features/contentReleaseWorkbench";
import {
  getReviewQueueOperationRecord,
  listReviewQueueOperationAuditEvents,
} from "@features/reviewQueueOperations";
import { resolveContentReleaseAiTransparencyGate } from "@/features/ai/aiTransparencyReleaseGuard";

export type ServerAuthoritativeAiTransparencyBlocker =
  | "classification_required"
  | "classification_unknown"
  | "content_release_target_missing"
  | "source_target_binding_mismatch"
  | "prepared_audit_event_missing"
  | "human_review_event_missing"
  | "human_review_state_not_ready"
  | "actor_missing"
  | "responsible_role_missing"
  | "approval_audit_event_missing"
  | "approval_audit_binding_mismatch"
  | string;

export type ExecuteServerAuthoritativeContentReleaseInput = {
  sourceKind: ContentReleaseSourceKind;
  sourceId: string;
  targetType: ContentReleaseTargetType;
  action: Exclude<ContentReleaseAction, "prepare_target">;
  classification?: ContentReleaseAiClassification | null;
  actor: {
    userId: string;
    responsibleRole: AiTransparencyResponsibleRole | null;
  };
  note?: string | null;
  now?: () => string;
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function isPublicAction(action: ContentReleaseAction) {
  return action === "make_visible" || action === "prepare_publication";
}

export function resolveServerAiTransparencyResponsibleRole(input: {
  role: string | null | undefined;
  isAdmin: boolean;
}): AiTransparencyResponsibleRole | null {
  if (input.isAdmin) return "admin";
  if (
    input.role === "reviewer" ||
    input.role === "editor" ||
    input.role === "editorial_actor" ||
    input.role === "institutional_actor" ||
    input.role === "legal_safety_reviewer"
  ) {
    return input.role;
  }
  return null;
}

function recordMatchesRequest(
  record: ContentReleaseTargetRecord,
  input: ExecuteServerAuthoritativeContentReleaseInput,
) {
  return (
    record.sourceKind === input.sourceKind &&
    record.sourceResultId === input.sourceId &&
    record.targetType === input.targetType
  );
}

export function validateContentReleaseAiTransparencyBinding(input: {
  record: AiTransparencyRecord;
  target: ContentReleaseTargetRecord;
  actorUserId: string;
  actorRole: AiTransparencyResponsibleRole;
  reviewAuditRef: string;
  approvalAuditRef: string;
}) {
  const binding = input.record.integrityBinding;
  const artifactId = contentReleaseArtifactIdForRecord(input.target);
  const blockers: ServerAuthoritativeAiTransparencyBlocker[] = [];
  if (
    !binding ||
    binding.sourceKind !== input.target.sourceKind ||
    binding.sourceId !== input.target.sourceResultId ||
    binding.targetKind !== input.target.targetType ||
    binding.targetId !== input.target.targetId ||
    binding.contentReleaseRecordId !== input.target.id ||
    binding.artifactId !== artifactId ||
    input.record.artifactId !== artifactId
  ) {
    blockers.push("source_target_binding_mismatch");
  }
  if (
    !binding ||
    binding.actorUserId !== input.actorUserId ||
    binding.actorRole !== input.actorRole ||
    binding.reviewAuditRef !== input.reviewAuditRef ||
    binding.approvalAuditRef !== input.approvalAuditRef ||
    input.record.humanReview.auditRef !== input.reviewAuditRef ||
    input.record.editorialApproval.auditRef !== input.approvalAuditRef ||
    input.record.editorialApproval.responsibleRole !== input.actorRole
  ) {
    blockers.push("approval_audit_binding_mismatch");
  }
  return unique(blockers);
}

export async function executeServerAuthoritativeContentReleaseAction(
  input: ExecuteServerAuthoritativeContentReleaseInput,
) {
  if (!isPublicAction(input.action)) {
    const target = await updateContentReleaseTargetFromSourceResult({
      sourceKind: input.sourceKind,
      sourceResultId: input.sourceId,
      targetType: input.targetType,
      action: input.action,
      requestedBy: input.actor.userId,
      actorRole: input.actor.responsibleRole,
      note: input.note ?? null,
    });
    return {
      allowed: true as const,
      blockers: [] as ServerAuthoritativeAiTransparencyBlocker[],
      target,
      aiTransparency: target.aiTransparency ?? null,
    };
  }

  const blockers: ServerAuthoritativeAiTransparencyBlocker[] = [];
  const classification = input.classification ?? null;
  if (!classification) blockers.push("classification_required");
  if (
    classification &&
    !CONTENT_RELEASE_AI_CLASSIFICATIONS.includes(classification)
  ) {
    blockers.push("classification_unknown");
  }

  const actorUserId = String(input.actor.userId ?? "").trim();
  if (!actorUserId) blockers.push("actor_missing");
  if (!input.actor.responsibleRole) blockers.push("responsible_role_missing");

  const target = await getContentReleaseTargetRecord(
    input.sourceKind,
    input.sourceId,
    input.targetType,
  );
  if (!target) blockers.push("content_release_target_missing");
  if (target && !recordMatchesRequest(target, input)) {
    blockers.push("source_target_binding_mismatch");
  }

  if (
    blockers.length > 0 ||
    !target ||
    !classification ||
    !input.actor.responsibleRole
  ) {
    return {
      allowed: false as const,
      blockers: unique(blockers),
      target,
      aiTransparency: null,
    };
  }

  const reviewItemId = contentReleaseReviewItemIdForSource(
    target.sourceKind,
    target.sourceResultId,
  );
  const [contentReleaseAuditEvents, reviewOperation, reviewAuditEvents] =
    await Promise.all([
      listContentReleaseAuditEvents(target.id),
      getReviewQueueOperationRecord(reviewItemId),
      listReviewQueueOperationAuditEvents(reviewItemId),
    ]);
  const preparedAuditEvent = contentReleaseAuditEvents.find(
    (event) =>
      event.action === "prepared" &&
      event.recordId === target.id &&
      event.sourceKind === target.sourceKind &&
      event.sourceResultId === target.sourceResultId &&
      event.targetType === target.targetType,
  );
  if (!preparedAuditEvent) blockers.push("prepared_audit_event_missing");

  const reviewAuditEvent = reviewAuditEvents.find(
    (event) =>
      event.itemId === reviewItemId &&
      event.action === "mark_ready" &&
      event.nextOperationalStatus === "ready",
  );
  if (!reviewAuditEvent) blockers.push("human_review_event_missing");
  if (reviewOperation?.operationalStatus !== "ready") {
    blockers.push("human_review_state_not_ready");
  }
  if (blockers.length > 0 || !preparedAuditEvent || !reviewAuditEvent) {
    return {
      allowed: false as const,
      blockers: unique(blockers),
      target,
      aiTransparency: null,
    };
  }

  const occurredAt = input.now?.() ?? new Date().toISOString();
  const auditAction = contentReleaseAuditActionForAction(input.action);
  const approvalAuditRef = contentReleaseAuditEventIdFor(
    target.id,
    auditAction,
    occurredAt,
  );
  const artifactId = contentReleaseArtifactIdForRecord(target);
  const visibleLabelKey = getAiTransparencyLabelKey({
    status: classification,
    contentKind: "text",
    humanReviewed: true,
  });
  const aiTransparency: AiTransparencyRecord = {
    artifactId,
    contentKind: "text",
    createdAt: target.createdAt,
    modifiedAt: target.updatedAt,
    status: classification,
    humanReview: {
      completed: true,
      completedAt: reviewAuditEvent.at,
      auditRef: reviewAuditEvent.id,
    },
    editorialApproval: {
      approved: true,
      approvedAt: occurredAt,
      auditRef: approvalAuditRef,
      responsibleRole: input.actor.responsibleRole,
    },
    intendedPublic: true,
    publicInterest: true,
    visibleLabelKey,
    labelAccessible: true,
    originalContentRef: `${target.sourceKind}:${target.sourceResultId}`,
    derivativeContentRef: `${target.targetType}:${target.targetId}`,
    deepfakeDisclosureApplied: false,
    provenance: {
      traceRefs: [preparedAuditEvent.id, reviewAuditEvent.id, reviewItemId],
      inputOrigin:
        classification === "human_only"
          ? "human_input"
          : classification === "ai_assisted"
            ? "mixed"
            : "ai_derivation",
      providerMetadataPresent: false,
      capabilities: buildHonestMetadataCapabilities({
        safeTraceVerificationRef: preparedAuditEvent.id,
      }),
    },
    integrityBinding: {
      sourceKind: target.sourceKind,
      sourceId: target.sourceResultId,
      targetKind: target.targetType,
      targetId: target.targetId,
      contentReleaseRecordId: target.id,
      artifactId,
      actorUserId,
      actorRole: input.actor.responsibleRole,
      reviewAuditRef: reviewAuditEvent.id,
      approvalAuditRef,
    },
  };
  blockers.push(
    ...validateContentReleaseAiTransparencyBinding({
      record: aiTransparency,
      target,
      actorUserId,
      actorRole: input.actor.responsibleRole,
      reviewAuditRef: reviewAuditEvent.id,
      approvalAuditRef,
    }),
  );
  const transparencyGate = resolveContentReleaseAiTransparencyGate({
    action: input.action,
    record: aiTransparency,
  });
  if (!transparencyGate.allowed) blockers.push(...transparencyGate.gate.blockers);
  if (blockers.length > 0) {
    return {
      allowed: false as const,
      blockers: unique(blockers),
      target,
      aiTransparency,
    };
  }

  const updated = await updateContentReleaseTargetFromSourceResult({
    sourceKind: target.sourceKind,
    sourceResultId: target.sourceResultId,
    targetType: target.targetType,
    action: input.action,
    requestedBy: actorUserId,
    actorRole: input.actor.responsibleRole,
    occurredAt,
    note: `KI-Transparenzklassifizierung serverseitig gebunden: ${classification}`,
    aiTransparency,
  });
  const persistedAuditEvent = (await listContentReleaseAuditEvents(updated.id)).find(
    (event) => event.id === approvalAuditRef,
  );
  if (
    !persistedAuditEvent ||
    persistedAuditEvent.recordId !== updated.id ||
    persistedAuditEvent.sourceKind !== updated.sourceKind ||
    persistedAuditEvent.sourceResultId !== updated.sourceResultId ||
    persistedAuditEvent.targetType !== updated.targetType ||
    persistedAuditEvent.targetId !== updated.targetId ||
    persistedAuditEvent.artifactId !== artifactId ||
    persistedAuditEvent.byUserId !== actorUserId ||
    persistedAuditEvent.actorRole !== input.actor.responsibleRole ||
    persistedAuditEvent.aiTransparencyStatus !== classification
  ) {
    throw new Error("ai_transparency_approval_audit_persistence_failed");
  }

  return {
    allowed: true as const,
    blockers: [] as ServerAuthoritativeAiTransparencyBlocker[],
    target: updated,
    aiTransparency,
  };
}

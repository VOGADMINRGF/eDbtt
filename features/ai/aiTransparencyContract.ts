export const AI_TRANSPARENCY_STATUSES = [
  "human_only",
  "ai_assisted",
  "ai_generated_unreviewed",
  "ai_generated_reviewed",
  "ai_manipulated_media",
  "deepfake_disclosure_required",
] as const;

export const AI_TRANSPARENCY_CONTENT_KINDS = [
  "text",
  "image",
  "audio",
  "video",
] as const;

export const AI_TRANSPARENCY_LABEL_KEYS = [
  "ai_assisted",
  "ai_assisted_editorially_reviewed",
  "ai_generated_editorially_reviewed",
  "ai_generated_unreviewed",
  "ai_generated_or_edited_image",
  "ai_generated_or_edited_audio",
  "ai_generated_or_edited_video",
  "deepfake_image_disclosure",
  "deepfake_audio_disclosure",
  "deepfake_video_disclosure",
] as const;

export const AI_METADATA_STANDARDS = [
  "safe_trace",
  "c2pa",
  "iptc",
  "xmp",
] as const;

export const AI_TRANSPARENCY_PUBLICATION_ACTIONS = [
  "public_display",
  "export",
  "share",
  "published_manual",
  "distribution",
] as const;

export type AiTransparencyStatus = (typeof AI_TRANSPARENCY_STATUSES)[number];
export type AiTransparencyContentKind =
  (typeof AI_TRANSPARENCY_CONTENT_KINDS)[number];
export type AiTransparencyLabelKey =
  (typeof AI_TRANSPARENCY_LABEL_KEYS)[number];
export type AiMetadataStandard = (typeof AI_METADATA_STANDARDS)[number];
export type AiTransparencyPublicationAction =
  (typeof AI_TRANSPARENCY_PUBLICATION_ACTIONS)[number];
export type AiTransparencyLocale = "de" | "en";

export type AiTransparencyResponsibleRole =
  | "reviewer"
  | "editor"
  | "editorial_actor"
  | "institutional_actor"
  | "admin"
  | "legal_safety_reviewer";

export type AiMetadataCapability = {
  standard: AiMetadataStandard;
  capability: "supported" | "unsupported" | "unverified";
  preservation:
    | "preserved"
    | "not_present"
    | "unsupported"
    | "unverified"
    | "lost";
  verificationRef: string | null;
};

export type AiMachineReadableProvenance = {
  traceRefs: string[];
  inputOrigin: "human_input" | "ai_derivation" | "mixed" | "unknown";
  providerMetadataPresent: boolean;
  capabilities: AiMetadataCapability[];
};

export type AiTransparencyReviewTruth = {
  completed: boolean;
  completedAt: string | null;
  auditRef: string | null;
};

export type AiTransparencyEditorialTruth = {
  approved: boolean;
  approvedAt: string | null;
  auditRef: string | null;
  responsibleRole: AiTransparencyResponsibleRole | null;
};

export type AiTransparencyIntegrityBinding = {
  sourceKind: string;
  sourceId: string;
  targetKind: string;
  targetId: string;
  contentReleaseRecordId: string;
  artifactId: string;
  actorUserId: string;
  actorRole: AiTransparencyResponsibleRole;
  reviewAuditRef: string;
  approvalAuditRef: string;
};

export type AiTransparencyRecord = {
  artifactId: string;
  contentKind: AiTransparencyContentKind;
  createdAt: string;
  modifiedAt: string | null;
  status: AiTransparencyStatus;
  humanReview: AiTransparencyReviewTruth;
  editorialApproval: AiTransparencyEditorialTruth;
  intendedPublic: boolean;
  publicInterest: boolean;
  visibleLabelKey: AiTransparencyLabelKey | null;
  labelAccessible: boolean;
  originalContentRef: string | null;
  derivativeContentRef: string | null;
  deepfakeDisclosureApplied: boolean;
  provenance: AiMachineReadableProvenance;
  integrityBinding?: AiTransparencyIntegrityBinding | null;
};

export type AiTransparencyPublicView = {
  status: AiTransparencyStatus;
  contentKind: AiTransparencyContentKind;
  visibleLabelKey: AiTransparencyLabelKey | null;
  humanReviewed: boolean;
  editoriallyApproved: boolean;
  publishable: boolean;
  machineReadableProvenance: {
    safeTrace: "supported" | "unsupported" | "unverified";
    c2pa: "supported" | "unsupported" | "unverified";
    iptc: "supported" | "unsupported" | "unverified";
    xmp: "supported" | "unsupported" | "unverified";
  };
};

export type AiTransparencyBlocker =
  | "record_missing"
  | "record_invalid"
  | "not_intended_for_publication"
  | "existing_review_guard_blocked"
  | "existing_visibility_guard_blocked"
  | "existing_export_guard_blocked"
  | "existing_distribution_guard_blocked"
  | "ai_generated_unreviewed"
  | "human_review_missing"
  | "editorial_approval_missing"
  | "responsible_role_missing"
  | "visible_label_missing"
  | "visible_label_mismatch"
  | "accessible_label_missing"
  | "safe_trace_missing"
  | "metadata_capability_truth_missing"
  | "original_reference_missing"
  | "derivative_reference_missing"
  | "deepfake_disclosure_missing"
  | "provider_metadata_lost"
  | "provider_metadata_not_preserved"
  | "integrity_binding_missing"
  | "integrity_binding_mismatch";

export type AiTransparencyPublicationGate = {
  allowed: boolean;
  action: AiTransparencyPublicationAction;
  blockers: AiTransparencyBlocker[];
  autoPublish: false;
  existingGuardsPreserved: true;
  requiresHumanDecision: true;
};

export type AiTransparencyAuditFinding = {
  artifactId: string;
  contentKind: AiTransparencyContentKind;
  createdAt: string;
  publishedAt: string | null;
  predatesArticle50Application: boolean;
  currentStatus: AiTransparencyStatus;
  publicVisibility: "public" | "internal" | "unknown";
  risk: "standard" | "priority_review" | "deepfake_priority";
  recommendedActions: string[];
  readOnly: true;
  automaticRelabelAllowed: false;
  automaticVisibilityChangeAllowed: false;
};

const LABELS: Record<
  AiTransparencyLabelKey,
  Record<AiTransparencyLocale, string>
> = {
  ai_assisted: {
    de: "Mit KI unterstützt",
    en: "AI-assisted",
  },
  ai_assisted_editorially_reviewed: {
    de: "Mit KI unterstützt · redaktionell geprüft",
    en: "AI-assisted · editorially reviewed",
  },
  ai_generated_editorially_reviewed: {
    de: "KI-generiert · redaktionell geprüft",
    en: "AI-generated · editorially reviewed",
  },
  ai_generated_unreviewed: {
    de: "KI-generierter Inhalt · nicht redaktionell geprüft",
    en: "AI-generated content · not editorially reviewed",
  },
  ai_generated_or_edited_image: {
    de: "KI-generiertes oder KI-bearbeitetes Bild",
    en: "AI-generated or AI-edited image",
  },
  ai_generated_or_edited_audio: {
    de: "KI-generiertes oder KI-bearbeitetes Audio",
    en: "AI-generated or AI-edited audio",
  },
  ai_generated_or_edited_video: {
    de: "KI-generiertes oder KI-bearbeitetes Video",
    en: "AI-generated or AI-edited video",
  },
  deepfake_image_disclosure: {
    de: "Deepfake-Hinweis · KI-generiertes oder KI-bearbeitetes Bild",
    en: "Deepfake disclosure · AI-generated or AI-edited image",
  },
  deepfake_audio_disclosure: {
    de: "Deepfake-Hinweis · KI-generiertes oder KI-bearbeitetes Audio",
    en: "Deepfake disclosure · AI-generated or AI-edited audio",
  },
  deepfake_video_disclosure: {
    de: "Deepfake-Hinweis · KI-generiertes oder KI-bearbeitetes Video",
    en: "Deepfake disclosure · AI-generated or AI-edited video",
  },
};

const ARTICLE_50_APPLICATION_AT = Date.parse("2026-08-02T00:00:00.000Z");

function isNonEmpty(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoTimestamp(value: string | null): boolean {
  return value === null || (isNonEmpty(value) && Number.isFinite(Date.parse(value)));
}

function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

function mediaLabelKey(
  contentKind: Exclude<AiTransparencyContentKind, "text">,
  deepfake: boolean,
): AiTransparencyLabelKey {
  if (deepfake) {
    if (contentKind === "image") return "deepfake_image_disclosure";
    if (contentKind === "audio") return "deepfake_audio_disclosure";
    return "deepfake_video_disclosure";
  }
  if (contentKind === "image") return "ai_generated_or_edited_image";
  if (contentKind === "audio") return "ai_generated_or_edited_audio";
  return "ai_generated_or_edited_video";
}

export function getAiTransparencyLabelKey(input: {
  status: AiTransparencyStatus;
  contentKind: AiTransparencyContentKind;
  humanReviewed?: boolean;
}): AiTransparencyLabelKey | null {
  if (input.status === "human_only") return null;
  if (input.status === "ai_assisted") {
    return input.humanReviewed
      ? "ai_assisted_editorially_reviewed"
      : "ai_assisted";
  }
  if (input.status === "ai_generated_unreviewed") {
    return "ai_generated_unreviewed";
  }
  if (input.status === "ai_generated_reviewed") {
    return input.contentKind === "text"
      ? "ai_generated_editorially_reviewed"
      : mediaLabelKey(input.contentKind, false);
  }
  if (input.contentKind === "text") return null;
  return mediaLabelKey(
    input.contentKind,
    input.status === "deepfake_disclosure_required",
  );
}

export function getAiTransparencyLabel(
  key: AiTransparencyLabelKey,
  locale: AiTransparencyLocale,
): string {
  return LABELS[key][locale];
}

export function validateAiTransparencyRecord(
  record: AiTransparencyRecord | null | undefined,
): string[] {
  if (!record) return ["record_missing"];
  const issues: string[] = [];
  if (!isNonEmpty(record.artifactId)) issues.push("artifact_id_missing");
  if (!AI_TRANSPARENCY_CONTENT_KINDS.includes(record.contentKind)) {
    issues.push("content_kind_unknown");
  }
  if (!AI_TRANSPARENCY_STATUSES.includes(record.status)) {
    issues.push("status_unknown");
  }
  if (!isIsoTimestamp(record.createdAt)) issues.push("created_at_invalid");
  if (!isIsoTimestamp(record.modifiedAt)) issues.push("modified_at_invalid");
  if (!isIsoTimestamp(record.humanReview.completedAt)) {
    issues.push("human_review_timestamp_invalid");
  }
  if (!isIsoTimestamp(record.editorialApproval.approvedAt)) {
    issues.push("editorial_approval_timestamp_invalid");
  }
  if (
    record.humanReview.completed &&
    (!record.humanReview.completedAt || !isNonEmpty(record.humanReview.auditRef))
  ) {
    issues.push("human_review_truth_incomplete");
  }
  if (
    record.editorialApproval.approved &&
    (!record.editorialApproval.approvedAt ||
      !isNonEmpty(record.editorialApproval.auditRef) ||
      !record.editorialApproval.responsibleRole)
  ) {
    issues.push("editorial_approval_truth_incomplete");
  }
  if (record.integrityBinding) {
    const binding = record.integrityBinding;
    if (
      !isNonEmpty(binding.sourceKind) ||
      !isNonEmpty(binding.sourceId) ||
      !isNonEmpty(binding.targetKind) ||
      !isNonEmpty(binding.targetId) ||
      !isNonEmpty(binding.contentReleaseRecordId) ||
      !isNonEmpty(binding.artifactId) ||
      !isNonEmpty(binding.actorUserId) ||
      !isNonEmpty(binding.reviewAuditRef) ||
      !isNonEmpty(binding.approvalAuditRef)
    ) {
      issues.push("integrity_binding_incomplete");
    }
    if (
      binding.artifactId !== record.artifactId ||
      binding.reviewAuditRef !== record.humanReview.auditRef ||
      binding.approvalAuditRef !== record.editorialApproval.auditRef ||
      binding.actorRole !== record.editorialApproval.responsibleRole
    ) {
      issues.push("integrity_binding_mismatch");
    }
  }
  if (
    (record.status === "ai_manipulated_media" ||
      record.status === "deepfake_disclosure_required") &&
    record.contentKind === "text"
  ) {
    issues.push("media_status_requires_media_kind");
  }
  if (
    (record.status === "ai_manipulated_media" ||
      record.status === "deepfake_disclosure_required") &&
    !record.modifiedAt
  ) {
    issues.push("media_modification_timestamp_missing");
  }
  const representedStandards = unique(
    record.provenance.capabilities.map((entry) => entry.standard),
  );
  if (
    representedStandards.length !== AI_METADATA_STANDARDS.length ||
    AI_METADATA_STANDARDS.some(
      (standard) => !representedStandards.includes(standard),
    )
  ) {
    issues.push("metadata_capability_truth_incomplete");
  }
  for (const capability of record.provenance.capabilities) {
    if (
      capability.capability === "supported" &&
      !isNonEmpty(capability.verificationRef)
    ) {
      issues.push(`metadata_support_unverified:${capability.standard}`);
    }
  }
  return unique(issues);
}

export function buildHonestMetadataCapabilities(input?: {
  safeTraceVerificationRef?: string | null;
}): AiMetadataCapability[] {
  const safeTraceRef = input?.safeTraceVerificationRef?.trim() || null;
  return [
    {
      standard: "safe_trace",
      capability: safeTraceRef ? "supported" : "unverified",
      preservation: safeTraceRef ? "preserved" : "unverified",
      verificationRef: safeTraceRef,
    },
    ...(["c2pa", "iptc", "xmp"] as const).map((standard) => ({
      standard,
      capability: "unsupported" as const,
      preservation: "unsupported" as const,
      verificationRef: null,
    })),
  ];
}

function capabilityState(
  record: AiTransparencyRecord,
  standard: AiMetadataStandard,
): "supported" | "unsupported" | "unverified" {
  return (
    record.provenance.capabilities.find((entry) => entry.standard === standard)
      ?.capability ?? "unverified"
  );
}

export function toAiTransparencyPublicView(
  record: AiTransparencyRecord,
): AiTransparencyPublicView {
  return {
    status: record.status,
    contentKind: record.contentKind,
    visibleLabelKey: record.visibleLabelKey,
    humanReviewed: record.humanReview.completed,
    editoriallyApproved: record.editorialApproval.approved,
    publishable: false,
    machineReadableProvenance: {
      safeTrace: capabilityState(record, "safe_trace"),
      c2pa: capabilityState(record, "c2pa"),
      iptc: capabilityState(record, "iptc"),
      xmp: capabilityState(record, "xmp"),
    },
  };
}

function requiredExistingGuards(
  action: AiTransparencyPublicationAction,
): Array<keyof ResolveAiTransparencyPublicationGateInput["existingGuards"]> {
  if (action === "public_display") return ["review", "visibility"];
  if (action === "export" || action === "share") {
    return ["review", "visibility", "export"];
  }
  return ["review", "visibility", "export", "distribution"];
}

export type ResolveAiTransparencyPublicationGateInput = {
  record: AiTransparencyRecord | null | undefined;
  action: AiTransparencyPublicationAction;
  existingGuards: {
    review: boolean;
    visibility: boolean;
    export: boolean;
    distribution: boolean;
  };
};

export function resolveAiTransparencyPublicationGate(
  input: ResolveAiTransparencyPublicationGateInput,
): AiTransparencyPublicationGate {
  const blockers: AiTransparencyBlocker[] = [];
  const record = input.record;
  if (!record) {
    blockers.push("record_missing");
  } else if (validateAiTransparencyRecord(record).length > 0) {
    blockers.push("record_invalid");
  }

  for (const guard of requiredExistingGuards(input.action)) {
    if (input.existingGuards[guard]) continue;
    if (guard === "review") blockers.push("existing_review_guard_blocked");
    if (guard === "visibility") blockers.push("existing_visibility_guard_blocked");
    if (guard === "export") blockers.push("existing_export_guard_blocked");
    if (guard === "distribution") blockers.push("existing_distribution_guard_blocked");
  }

  if (record) {
    if (!record.intendedPublic) blockers.push("not_intended_for_publication");
    if (record.intendedPublic && !record.integrityBinding) {
      blockers.push("integrity_binding_missing");
    }
    if (
      record.integrityBinding &&
      (record.integrityBinding.artifactId !== record.artifactId ||
        record.integrityBinding.reviewAuditRef !== record.humanReview.auditRef ||
        record.integrityBinding.approvalAuditRef !==
          record.editorialApproval.auditRef ||
        record.integrityBinding.actorRole !==
          record.editorialApproval.responsibleRole)
    ) {
      blockers.push("integrity_binding_mismatch");
    }
    const expectedLabel = getAiTransparencyLabelKey({
      status: record.status,
      contentKind: record.contentKind,
      humanReviewed: record.humanReview.completed,
    });

    if (record.status === "human_only") {
      if (record.visibleLabelKey !== null) blockers.push("visible_label_mismatch");
    } else {
      if (record.status === "ai_generated_unreviewed") {
        blockers.push("ai_generated_unreviewed");
      }
      if (!record.humanReview.completed) blockers.push("human_review_missing");
      if (!record.editorialApproval.approved) {
        blockers.push("editorial_approval_missing");
      }
      if (!record.editorialApproval.responsibleRole) {
        blockers.push("responsible_role_missing");
      }
      if (!record.visibleLabelKey) blockers.push("visible_label_missing");
      if (record.visibleLabelKey && record.visibleLabelKey !== expectedLabel) {
        blockers.push("visible_label_mismatch");
      }
      if (!record.labelAccessible) blockers.push("accessible_label_missing");
      const safeTraceCapability = record.provenance.capabilities.find(
        (entry) => entry.standard === "safe_trace",
      );
      if (
        record.provenance.traceRefs.length === 0 ||
        safeTraceCapability?.capability !== "supported" ||
        !isNonEmpty(safeTraceCapability.verificationRef)
      ) {
        blockers.push("safe_trace_missing");
      }
      if (
        AI_METADATA_STANDARDS.some(
          (standard) =>
            !record.provenance.capabilities.some(
              (entry) => entry.standard === standard,
            ),
        )
      ) {
        blockers.push("metadata_capability_truth_missing");
      }
    }

    if (
      record.status === "ai_manipulated_media" ||
      record.status === "deepfake_disclosure_required"
    ) {
      if (!isNonEmpty(record.originalContentRef)) {
        blockers.push("original_reference_missing");
      }
      if (!isNonEmpty(record.derivativeContentRef)) {
        blockers.push("derivative_reference_missing");
      }
    }
    if (
      record.status === "deepfake_disclosure_required" &&
      !record.deepfakeDisclosureApplied
    ) {
      blockers.push("deepfake_disclosure_missing");
    }
    if (
      record.provenance.providerMetadataPresent &&
      record.provenance.capabilities.some((entry) => entry.preservation === "lost")
    ) {
      blockers.push("provider_metadata_lost");
    }
    if (
      record.provenance.providerMetadataPresent &&
      !record.provenance.capabilities.some(
        (entry) => entry.preservation === "preserved",
      )
    ) {
      blockers.push("provider_metadata_not_preserved");
    }
  }

  return {
    allowed: blockers.length === 0,
    action: input.action,
    blockers: unique(blockers),
    autoPublish: false,
    existingGuardsPreserved: true,
    requiresHumanDecision: true,
  };
}

export function buildAiTransparencyAuditFinding(input: {
  record: AiTransparencyRecord;
  publishedAt?: string | null;
  publicVisibility: AiTransparencyAuditFinding["publicVisibility"];
}): AiTransparencyAuditFinding {
  const publishedAt = input.publishedAt ?? null;
  const comparisonTimestamp = Date.parse(publishedAt ?? input.record.createdAt);
  const predatesArticle50Application =
    Number.isFinite(comparisonTimestamp) &&
    comparisonTimestamp < ARTICLE_50_APPLICATION_AT;
  const isDeepfake = input.record.status === "deepfake_disclosure_required";
  const isPriority =
    isDeepfake ||
    (input.publicVisibility === "public" &&
      input.record.status !== "human_only");
  const recommendedActions = [
    "Menschliche Klassifizierung und Herkunftsnachweis prüfen.",
    "Sichtbares Label, Review und redaktionelle Verantwortung abgleichen.",
    "Metadatenfähigkeit und Original-/Derivative-Referenzen verifizieren.",
  ];
  if (predatesArticle50Application) {
    recommendedActions.push(
      "Altinhalt einzeln priorisieren; keine automatische rückwirkende Kennzeichnung.",
    );
  }

  return {
    artifactId: input.record.artifactId,
    contentKind: input.record.contentKind,
    createdAt: input.record.createdAt,
    publishedAt,
    predatesArticle50Application,
    currentStatus: input.record.status,
    publicVisibility: input.publicVisibility,
    risk: isDeepfake
      ? "deepfake_priority"
      : isPriority
        ? "priority_review"
        : "standard",
    recommendedActions,
    readOnly: true,
    automaticRelabelAllowed: false,
    automaticVisibilityChangeAllowed: false,
  };
}

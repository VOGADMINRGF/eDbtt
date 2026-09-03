import { describe, expect, it } from "vitest";
import {
  AI_TRANSPARENCY_STATUSES,
  buildAiTransparencyAuditFinding,
  buildHonestMetadataCapabilities,
  getAiTransparencyLabel,
  getAiTransparencyLabelKey,
  resolveAiTransparencyPublicationGate,
  validateAiTransparencyRecord,
  type AiTransparencyRecord,
  type AiTransparencyStatus,
} from "@features/ai/aiTransparencyContract";

const CREATED_AT = "2026-08-03T08:00:00.000Z";

function buildRecord(
  overrides: Partial<AiTransparencyRecord> = {},
): AiTransparencyRecord {
  const status = overrides.status ?? "ai_generated_reviewed";
  const contentKind = overrides.contentKind ?? "text";
  const humanReview = overrides.humanReview ?? {
    completed: true,
    completedAt: "2026-08-03T09:00:00.000Z",
    auditRef: "review:123",
  };
  const editorialApproval = overrides.editorialApproval ?? {
    approved: true,
    approvedAt: "2026-08-03T09:15:00.000Z",
    auditRef: "approval:123",
    responsibleRole: "editorial_actor" as const,
  };
  const artifactId = overrides.artifactId ?? "artifact:123";
  return {
    artifactId,
    contentKind,
    createdAt: CREATED_AT,
    modifiedAt: null,
    status,
    humanReview,
    editorialApproval,
    intendedPublic: true,
    publicInterest: true,
    visibleLabelKey:
      overrides.visibleLabelKey === undefined
        ? getAiTransparencyLabelKey({
            status,
            contentKind,
            humanReviewed: humanReview.completed,
          })
        : overrides.visibleLabelKey,
    labelAccessible: true,
    originalContentRef: null,
    derivativeContentRef: "artifact:123:output",
    deepfakeDisclosureApplied: false,
    provenance: {
      traceRefs: ["safe-trace:123"],
      inputOrigin: "ai_derivation",
      providerMetadataPresent: false,
      capabilities: buildHonestMetadataCapabilities({
        safeTraceVerificationRef: "safe-trace:123",
      }),
    },
    integrityBinding:
      overrides.integrityBinding === undefined &&
      humanReview.auditRef &&
      editorialApproval.auditRef &&
      editorialApproval.responsibleRole
        ? {
            sourceKind: "create_handoff",
            sourceId: "source:123",
            targetKind: "dossier",
            targetId: "target:123",
            contentReleaseRecordId: "content-release:123",
            artifactId,
            actorUserId: "editor:123",
            actorRole: editorialApproval.responsibleRole,
            reviewAuditRef: humanReview.auditRef,
            approvalAuditRef: editorialApproval.auditRef,
          }
        : (overrides.integrityBinding ?? null),
    ...overrides,
  };
}

const OPEN_EXISTING_GUARDS = {
  review: true,
  visibility: true,
  export: true,
  distribution: true,
};

describe("AI transparency contract", () => {
  it("keeps the complete six-state status vocabulary", () => {
    expect(AI_TRANSPARENCY_STATUSES).toEqual([
      "human_only",
      "ai_assisted",
      "ai_generated_unreviewed",
      "ai_generated_reviewed",
      "ai_manipulated_media",
      "deepfake_disclosure_required",
    ]);
  });

  it("distinguishes all binding text labels in DE and EN", () => {
    expect(getAiTransparencyLabel("ai_assisted", "de")).toBe("Mit KI unterstützt");
    expect(getAiTransparencyLabel("ai_assisted_editorially_reviewed", "de")).toBe(
      "Mit KI unterstützt · redaktionell geprüft",
    );
    expect(getAiTransparencyLabel("ai_generated_editorially_reviewed", "de")).toBe(
      "KI-generiert · redaktionell geprüft",
    );
    expect(getAiTransparencyLabel("ai_generated_unreviewed", "de")).toBe(
      "KI-generierter Inhalt · nicht redaktionell geprüft",
    );
    expect(getAiTransparencyLabel("ai_assisted", "en")).toBe("AI-assisted");
    expect(getAiTransparencyLabel("ai_generated_unreviewed", "en")).toBe(
      "AI-generated content · not editorially reviewed",
    );
  });

  it("never labels human-only content as AI-generated", () => {
    expect(
      getAiTransparencyLabelKey({
        status: "human_only",
        contentKind: "text",
        humanReviewed: true,
      }),
    ).toBeNull();

    const gate = resolveAiTransparencyPublicationGate({
      record: buildRecord({
        status: "human_only",
        visibleLabelKey: null,
        provenance: {
          traceRefs: [],
          inputOrigin: "human_input",
          providerMetadataPresent: false,
          capabilities: buildHonestMetadataCapabilities(),
        },
      }),
      action: "public_display",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(gate.allowed).toBe(true);
  });

  it("blocks unreviewed AI-generated public information fail-closed", () => {
    const gate = resolveAiTransparencyPublicationGate({
      record: buildRecord({
        status: "ai_generated_unreviewed",
        humanReview: { completed: false, completedAt: null, auditRef: null },
        editorialApproval: {
          approved: false,
          approvedAt: null,
          auditRef: null,
          responsibleRole: null,
        },
        visibleLabelKey: "ai_generated_unreviewed",
      }),
      action: "published_manual",
      existingGuards: OPEN_EXISTING_GUARDS,
    });

    expect(gate.allowed).toBe(false);
    expect(gate.autoPublish).toBe(false);
    expect(gate.blockers).toEqual(
      expect.arrayContaining([
        "ai_generated_unreviewed",
        "human_review_missing",
        "editorial_approval_missing",
        "responsible_role_missing",
      ]),
    );
  });

  it("keeps reviewed AI-assisted content visibly labelled and preserves existing gates", () => {
    const record = buildRecord({
      status: "ai_assisted",
      visibleLabelKey: "ai_assisted_editorially_reviewed",
    });
    const allowed = resolveAiTransparencyPublicationGate({
      record,
      action: "distribution",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(allowed.allowed).toBe(true);

    const blocked = resolveAiTransparencyPublicationGate({
      record,
      action: "distribution",
      existingGuards: { ...OPEN_EXISTING_GUARDS, distribution: false },
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockers).toContain("existing_distribution_guard_blocked");
  });

  it("blocks deepfake-relevant media until original, derivative, and disclosure are present", () => {
    const record = buildRecord({
      status: "deepfake_disclosure_required",
      contentKind: "video",
      visibleLabelKey: "deepfake_video_disclosure",
      modifiedAt: "2026-08-03T08:30:00.000Z",
      originalContentRef: null,
      derivativeContentRef: null,
      deepfakeDisclosureApplied: false,
    });
    const gate = resolveAiTransparencyPublicationGate({
      record,
      action: "public_display",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.blockers).toEqual(
      expect.arrayContaining([
        "original_reference_missing",
        "derivative_reference_missing",
        "deepfake_disclosure_missing",
      ]),
    );
  });

  it("does not invent C2PA, IPTC, or XMP support and blocks known metadata loss", () => {
    const capabilities = buildHonestMetadataCapabilities({
      safeTraceVerificationRef: "safe-trace:123",
    });
    expect(capabilities.find((entry) => entry.standard === "c2pa")?.capability).toBe(
      "unsupported",
    );
    expect(capabilities.find((entry) => entry.standard === "iptc")?.capability).toBe(
      "unsupported",
    );
    expect(capabilities.find((entry) => entry.standard === "xmp")?.capability).toBe(
      "unsupported",
    );

    const gate = resolveAiTransparencyPublicationGate({
      record: buildRecord({
        provenance: {
          traceRefs: ["safe-trace:123"],
          inputOrigin: "ai_derivation",
          providerMetadataPresent: true,
          capabilities: [
            ...capabilities,
            {
              standard: "xmp",
              capability: "supported",
              preservation: "lost",
              verificationRef: "pipeline-test:xmp-import",
            },
          ],
        },
      }),
      action: "export",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.blockers).toContain("provider_metadata_lost");
  });

  it("fails closed for unknown or contradictory record values", () => {
    const record = buildRecord({
      status: "unknown_status" as AiTransparencyStatus,
    });
    expect(validateAiTransparencyRecord(record)).toContain("status_unknown");
    expect(
      resolveAiTransparencyPublicationGate({
        record,
        action: "public_display",
        existingGuards: OPEN_EXISTING_GUARDS,
      }).blockers,
    ).toContain("record_invalid");
  });

  it("blocks publication when capability truth is incomplete", () => {
    const record = buildRecord({
      provenance: {
        traceRefs: ["safe-trace:123"],
        inputOrigin: "ai_derivation",
        providerMetadataPresent: false,
        capabilities: [
          {
            standard: "safe_trace",
            capability: "supported",
            preservation: "preserved",
            verificationRef: "safe-trace:123",
          },
        ],
      },
    });
    const gate = resolveAiTransparencyPublicationGate({
      record,
      action: "public_display",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(gate.allowed).toBe(false);
    expect(gate.blockers).toContain("record_invalid");
    expect(gate.blockers).toContain("metadata_capability_truth_missing");
  });

  it("fails closed when a public record has no or mismatched integrity binding", () => {
    const missing = resolveAiTransparencyPublicationGate({
      record: buildRecord({ integrityBinding: null }),
      action: "public_display",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(missing.allowed).toBe(false);
    expect(missing.blockers).toContain("integrity_binding_missing");

    const mismatched = buildRecord();
    mismatched.integrityBinding = {
      ...mismatched.integrityBinding!,
      sourceId: "other-source",
      artifactId: "other-artifact",
    };
    const blocked = resolveAiTransparencyPublicationGate({
      record: mismatched,
      action: "public_display",
      existingGuards: OPEN_EXISTING_GUARDS,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockers).toContain("record_invalid");
    expect(blocked.blockers).toContain("integrity_binding_mismatch");
  });

  it("builds a read-only pre-cutoff audit finding without automatic relabelling", () => {
    const finding = buildAiTransparencyAuditFinding({
      record: buildRecord({ createdAt: "2026-07-01T10:00:00.000Z" }),
      publishedAt: "2026-07-02T10:00:00.000Z",
      publicVisibility: "public",
    });
    expect(finding.predatesArticle50Application).toBe(true);
    expect(finding.risk).toBe("priority_review");
    expect(finding.readOnly).toBe(true);
    expect(finding.automaticRelabelAllowed).toBe(false);
    expect(finding.automaticVisibilityChangeAllowed).toBe(false);
  });
});

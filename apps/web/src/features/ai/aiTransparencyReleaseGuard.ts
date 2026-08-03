import { z } from "zod";
import {
  AI_METADATA_STANDARDS,
  AI_TRANSPARENCY_CONTENT_KINDS,
  AI_TRANSPARENCY_LABEL_KEYS,
  AI_TRANSPARENCY_STATUSES,
  resolveAiTransparencyPublicationGate,
  type AiTransparencyPublicationGate,
  type AiTransparencyRecord,
} from "@features/ai/aiTransparencyContract";

const AiTransparencyRecordSchema = z
  .object({
    artifactId: z.string().trim().min(1),
    contentKind: z.enum(AI_TRANSPARENCY_CONTENT_KINDS),
    createdAt: z.string().datetime({ offset: true }),
    modifiedAt: z.string().datetime({ offset: true }).nullable(),
    status: z.enum(AI_TRANSPARENCY_STATUSES),
    humanReview: z
      .object({
        completed: z.boolean(),
        completedAt: z.string().datetime({ offset: true }).nullable(),
        auditRef: z.string().trim().min(1).nullable(),
      })
      .strict(),
    editorialApproval: z
      .object({
        approved: z.boolean(),
        approvedAt: z.string().datetime({ offset: true }).nullable(),
        auditRef: z.string().trim().min(1).nullable(),
        responsibleRole: z
          .enum([
            "reviewer",
            "editor",
            "editorial_actor",
            "institutional_actor",
            "admin",
            "legal_safety_reviewer",
          ])
          .nullable(),
      })
      .strict(),
    intendedPublic: z.boolean(),
    publicInterest: z.boolean(),
    visibleLabelKey: z.enum(AI_TRANSPARENCY_LABEL_KEYS).nullable(),
    labelAccessible: z.boolean(),
    originalContentRef: z.string().trim().min(1).nullable(),
    derivativeContentRef: z.string().trim().min(1).nullable(),
    deepfakeDisclosureApplied: z.boolean(),
    provenance: z
      .object({
        traceRefs: z.array(z.string().trim().min(1)),
        inputOrigin: z.enum(["human_input", "ai_derivation", "mixed", "unknown"]),
        providerMetadataPresent: z.boolean(),
        capabilities: z.array(
          z
            .object({
              standard: z.enum(AI_METADATA_STANDARDS),
              capability: z.enum(["supported", "unsupported", "unverified"]),
              preservation: z.enum([
                "preserved",
                "not_present",
                "unsupported",
                "unverified",
                "lost",
              ]),
              verificationRef: z.string().trim().min(1).nullable(),
            })
            .strict(),
        ),
      })
      .strict(),
    integrityBinding: z
      .object({
        sourceKind: z.string().trim().min(1),
        sourceId: z.string().trim().min(1),
        targetKind: z.string().trim().min(1),
        targetId: z.string().trim().min(1),
        contentReleaseRecordId: z.string().trim().min(1),
        artifactId: z.string().trim().min(1),
        actorUserId: z.string().trim().min(1),
        actorRole: z.enum([
          "reviewer",
          "editor",
          "editorial_actor",
          "institutional_actor",
          "admin",
          "legal_safety_reviewer",
        ]),
        reviewAuditRef: z.string().trim().min(1),
        approvalAuditRef: z.string().trim().min(1),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .strict();

export type ContentReleaseAiTransparencyAction =
  | "prepare_target"
  | "make_visible"
  | "prepare_publication"
  | "retract_visibility"
  | "archive_target";

export type ContentReleaseAiTransparencyGate =
  | { required: false; allowed: true; gate: null }
  | { required: true; allowed: boolean; gate: AiTransparencyPublicationGate };

export function parseAiTransparencyRecord(
  value: unknown,
): AiTransparencyRecord | null {
  const parsed = AiTransparencyRecordSchema.safeParse(value);
  return parsed.success ? (parsed.data as AiTransparencyRecord) : null;
}

export function resolveContentReleaseAiTransparencyGate(input: {
  action: ContentReleaseAiTransparencyAction;
  record: unknown;
}): ContentReleaseAiTransparencyGate {
  if (
    input.action !== "make_visible" &&
    input.action !== "prepare_publication"
  ) {
    return { required: false, allowed: true, gate: null };
  }

  const record = parseAiTransparencyRecord(input.record);
  const gate = resolveAiTransparencyPublicationGate({
    record,
    action:
      input.action === "make_visible" ? "public_display" : "published_manual",
    existingGuards: {
      review: true,
      visibility: true,
      export: true,
      distribution: true,
    },
  });

  return {
    required: true,
    allowed: gate.allowed,
    gate,
  };
}

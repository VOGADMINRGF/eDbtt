import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  buildRouteBoundCompanionAnswer,
  resolveRouteBoundCompanionContext,
  runRouteBoundCompanionPresentationPass,
  type RouteBoundCompanionContextKind,
} from "@features/ai/e150/routeBoundCompanion";
import {
  toAiTransparencyPublicView,
  type AiTransparencyRecord,
} from "@features/ai/aiTransparencyContract";
import { buildAiProvenanceFromSafeTrace } from "@/features/ai/aiTransparencySafeTraceAdapter";
import { buildAgentSafeTraceStep } from "@/features/agenticRuntime/agentRunArtifactSafeTraceContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "global_chat_disabled",
      message:
        "Globaler Chat ist deaktiviert. Verwende routegebundene Companion-Anfragen mit Kontext.",
      supportedContexts: [
        "dossier",
        "factcheck",
        "guided_workspace",
        "journalist_companion",
      ] as RouteBoundCompanionContextKind[],
    },
    { status: 400 },
  );
}

const ChatContextSchema = z.object({
  kind: z.enum(["dossier", "factcheck", "guided_workspace", "journalist_companion"]),
  title: z.string().trim().min(1).max(180).optional(),
  analysisMode: z.enum(["analyze", "media", "guided"]).optional(),
  routePath: z.string().trim().min(1).max(200).optional(),
  parentStatus: z
    .object({
      status: z.string().trim().min(1).max(80).optional(),
      lane: z.enum(["standard", "sealed_factcheck"]).optional(),
      verificationMode: z.enum(["none", "precheck", "sealed"]).optional(),
      researchUsed: z.enum(["none", "lite", "search", "deep_search"]).optional(),
      sealEligible: z.boolean().optional(),
      sealGranted: z.boolean().optional(),
      verificationLabel: z.enum(["analysiert", "geprueft", "verifiziert"]).optional(),
      truthStatus: z
        .enum([
          "draft_analysis",
          "source_open",
          "source_grounded",
          "review_required",
          "factcheck_requested",
          "factcheck_passed",
          "sealed_verified",
        ])
        .optional(),
      sourceSupport: z.enum(["none", "open", "inferred", "partial", "sourced", "sealed"]).optional(),
      sourceStatus: z.string().trim().min(1).max(120).optional(),
      reviewRecommended: z.boolean().optional(),
    })
    .optional(),
});

const ChatRequestSchema = z.object({
  message: z.string().trim().min(2).max(2000),
  context: ChatContextSchema,
  presentationPass: z.boolean().optional(),
});

function resolvePresentationPassEnabled(params: {
  requested?: boolean;
  contextKind: RouteBoundCompanionContextKind;
}): boolean {
  if (typeof params.requested === "boolean") {
    return params.requested;
  }
  if (process.env.E150_PRESENTATION_PASS_DEFAULT !== "true") {
    return false;
  }
  return (
    params.contextKind === "dossier" ||
    params.contextKind === "guided_workspace" ||
    params.contextKind === "journalist_companion"
  );
}

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json", message: "Ungültiger JSON-Body." },
      { status: 400 },
    );
  }

  const parsed = ChatRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues?.[0];
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_input",
        message: issue?.message ?? "Ungültige Anfrage für den Companion-Dialog.",
      },
      { status: 400 },
    );
  }

  const payload = parsed.data;
  const resolved = resolveRouteBoundCompanionContext(payload.context);
  const answer = buildRouteBoundCompanionAnswer({
    context: payload.context,
    userMessage: payload.message,
    resolved,
  });
  const presentationPassResult = runRouteBoundCompanionPresentationPass({
    resolved,
    answer,
    enabled: resolvePresentationPassEnabled({
      requested: payload.presentationPass,
      contextKind: resolved.contextKind,
    }),
  });
  const presentedAnswer = presentationPassResult.answer;
  const createdAt = new Date().toISOString();
  const safeTrace = buildAgentSafeTraceStep({
    taskId: "AI-ACT-ARTICLE-50-TRANSPARENCY-01",
    stepId: `route-bound-companion:${resolved.contextKind}:response`,
    surface: "/api/chat",
    userSafeLabel: "Routegebundene Voxy-Antwort",
    status: "review_required",
    confidenceLabel: "review_required",
    requiredHumanAction: "review_before_publish",
    inputArtifacts: [
      {
        id: `companion:${resolved.contextKind}:input`,
        type: "human_input",
        label: "Nutzerfrage im routegebundenen Kontext",
        reviewState: "present",
      },
    ],
    outputArtifacts: [
      {
        id: `companion:${resolved.contextKind}:output`,
        type: "planner_followup",
        label: "Ungeprüfte Companion-Antwort",
        reviewState: "review_required",
      },
    ],
    evidenceRefs: [
      `companion-context:${resolved.contextKind}`,
      `journey-profile:${resolved.journeyProfile}`,
    ],
    reviewState: "review_required",
    publishState: "publish_blocked",
    primaryRole: "personal_voxy",
    supportingRoles: ["governance_compliance"],
  });
  const transparencyRecord = {
    artifactId: `route-bound-companion:${resolved.contextKind}:response`,
    contentKind: "text",
    createdAt,
    modifiedAt: null,
    status: "ai_generated_unreviewed",
    humanReview: {
      completed: false,
      completedAt: null,
      auditRef: null,
    },
    editorialApproval: {
      approved: false,
      approvedAt: null,
      auditRef: null,
      responsibleRole: null,
    },
    intendedPublic: false,
    publicInterest: true,
    visibleLabelKey: "ai_generated_unreviewed",
    labelAccessible: true,
    originalContentRef: null,
    derivativeContentRef: `companion:${resolved.contextKind}:presented-answer`,
    deepfakeDisclosureApplied: false,
    provenance: buildAiProvenanceFromSafeTrace(safeTrace),
  } satisfies AiTransparencyRecord;

  return NextResponse.json({
    ok: true,
    companion: {
      mode: "route_bound_companion",
      contextKind: resolved.contextKind,
      journeyProfile: resolved.journeyProfile,
      lane: resolved.lane,
      verificationMode: resolved.verificationMode,
      researchUsed: resolved.researchUsed,
      sealEligible: resolved.sealEligible,
      sealGranted: resolved.sealGranted,
      verificationLabel: resolved.verificationLabel,
      verificationLabelDisplay: resolved.verificationLabelDisplay,
      verificationHint: resolved.verificationHint,
      truthStatus: resolved.truthStatus,
      truthStatusLabel: resolved.truthStatusLabel,
      sourceSupport: resolved.sourceSupport,
      sourceSupportLabel: resolved.sourceSupportLabel,
      sourceStatus: resolved.sourceStatus,
      reviewRecommended: resolved.reviewRecommended,
      noTruthPromotion: resolved.noTruthPromotion,
      noAutoGraphPromotion: resolved.noAutoGraphPromotion,
      workflowLabel: resolved.workflowLabel,
      parentStatus: resolved.parentStatus,
      tonePassUsed: presentationPassResult.meta.applied,
      presentationPass: presentationPassResult.meta,
      text: presentedAnswer.text,
      followUps: presentedAnswer.followUps,
      disclaimers: presentedAnswer.disclaimers,
      aiTransparency: toAiTransparencyPublicView(transparencyRecord),
      rules: [
        "route_bound_profile_reuse",
        "no_silent_research_on_standard_lane",
        "no_implicit_verification",
        "no_seal_outside_sealed_factcheck",
        "presentation_pass_non_mutative",
      ] as const,
    },
  });
}

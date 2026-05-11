export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCol, ObjectId } from "@core/db/triMongo";
import { z } from "zod";
import { CREATE_MODE_VALUES, parseCreateMode, type CreateMode } from "@/features/create/intents";
import {
  evaluateCreateClaimSafety,
  type CreateClaimSafetyResult,
} from "@/features/create/safety/createClaimSafety";
import {
  evaluateCreateInputSafety,
  type CreateInputSafetyResult,
} from "@/features/create/safety/createInputSafety";

const DraftSaveSchema = z.object({
  draftId: z.string().optional(),
  text: z.string().optional(),
  textOriginal: z.string().optional(),
  textPrepared: z.string().optional(),
  locale: z.string().optional(),
  source: z.string().optional(),
  createMode: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const parsed = parseCreateMode(value);
      return parsed ?? value.toLowerCase().trim();
    },
    z.enum(CREATE_MODE_VALUES).optional(),
  ),
  anlassraumId: z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const normalized = value.trim().toLowerCase();
      return normalized || undefined;
    },
    z
      .string()
      .refine((value) => ObjectId.isValid(value), "invalid_anlassraum_id")
      .optional(),
  ),
  authorName: z.string().max(160).optional(),
  useCase: z.enum(["civic", "journalism", "agenda"]).optional(),
  sourceUrls: z.array(z.string().min(1)).optional(),
  uploadIds: z.array(z.string().min(1)).optional(),
  materialItems: z.array(z.record(z.string(), z.any())).optional(),
  analysis: z.unknown().optional(),
});

type ContributionDraftDoc = {
  _id?: ObjectId;
  authorId: string;
  text: string;
  locale?: string;
  source?: string;
  createMode?: CreateMode | null;
  anlassraumId?: string | null;
  authorName?: string | null;
  useCase?: "civic" | "journalism" | "agenda" | null;
  analysis?: unknown;
  status: "draft" | "finalized";
  createdAt: Date;
  updatedAt: Date;
  finalizedAt?: Date;
  proposalIds?: string[];
};

function hasPiiOrDoxxingFindings(safety: CreateInputSafetyResult): boolean {
  return safety.findings.some((finding) =>
    finding.kind === "email" ||
    finding.kind === "phone" ||
    finding.kind === "street_address" ||
    finding.kind === "postal_code" ||
    finding.kind === "doxxing",
  );
}

function withSafetyAnalysis(
  existing: unknown,
  safety: CreateInputSafetyResult,
  claimSafety: CreateClaimSafetyResult[],
): Record<string, unknown> {
  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    const existingRecord = existing as Record<string, unknown>;
    const existingSafety =
      existingRecord.safety && typeof existingRecord.safety === "object" && !Array.isArray(existingRecord.safety)
        ? (existingRecord.safety as Record<string, unknown>)
        : {};
    return {
      ...existingRecord,
      safety: {
        ...existingSafety,
        ...safety,
        claimSafety,
      },
    };
  }
  return {
    safety: {
      ...safety,
      claimSafety,
    },
  };
}

function withMaterialContext(
  existing: unknown,
  materialContext: {
    sourceUrls?: string[];
    uploadIds?: string[];
    materialItems?: Record<string, unknown>[];
  },
): unknown {
  const hasMaterialContext =
    (materialContext.sourceUrls?.length ?? 0) > 0 ||
    (materialContext.uploadIds?.length ?? 0) > 0 ||
    (materialContext.materialItems?.length ?? 0) > 0;
  if (!hasMaterialContext) return existing;

  const normalizedContext = {
    sourceUrls: materialContext.sourceUrls ?? [],
    uploadIds: materialContext.uploadIds ?? [],
    materialItems: materialContext.materialItems ?? [],
  };

  if (existing && typeof existing === "object" && !Array.isArray(existing)) {
    const existingRecord = existing as Record<string, unknown>;
    const existingInputContext =
      existingRecord.inputContext &&
      typeof existingRecord.inputContext === "object" &&
      !Array.isArray(existingRecord.inputContext)
        ? (existingRecord.inputContext as Record<string, unknown>)
        : {};
    return {
      ...existingRecord,
      inputContext: {
        ...existingInputContext,
        ...normalizedContext,
      },
    };
  }

  return {
    inputContext: normalizedContext,
  };
}

function buildClaimSafety(analysis: unknown, locale: string): CreateClaimSafetyResult[] {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) return [];
  const claims = Array.isArray((analysis as Record<string, unknown>).claims)
    ? ((analysis as Record<string, unknown>).claims as unknown[])
    : [];
  return claims
    .map((claim) => {
      const text = typeof (claim as any)?.text === "string" ? (claim as any).text : "";
      if (!text.trim()) return null;
      return evaluateCreateClaimSafety({
        claimId:
          typeof (claim as any)?.id === "string" || typeof (claim as any)?.id === "number"
            ? String((claim as any).id)
            : null,
        text,
        locale,
        sourceLanguage: locale,
        contentLanguage: locale,
      });
    })
    .filter((entry): entry is CreateClaimSafetyResult => Boolean(entry));
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  let body: z.infer<typeof DraftSaveSchema>;
  try {
    body = DraftSaveSchema.parse(await req.json());
  } catch (err: any) {
    const issue = err?.issues?.[0];
    const message =
      issue?.path?.[0] === "createMode"
        ? "invalid_create_mode"
        : issue?.path?.[0] === "anlassraumId"
          ? "invalid_anlassraum_id"
        : issue?.message ?? "invalid_body";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const Drafts = await getCol<ContributionDraftDoc>("contribution_drafts");
  const now = new Date();
  const normalizedText =
    body.textPrepared?.trim() || body.textOriginal?.trim() || body.text?.trim() || "";
  const normalizedCreateMode: CreateMode =
    body.createMode ?? (body.source === "statement_new" ? "manual" : "source");
  const normalizedAnlassraumId = body.anlassraumId
    ? new ObjectId(body.anlassraumId).toHexString()
    : null;

  if (!normalizedText) {
    return NextResponse.json({ ok: false, error: "empty_text" }, { status: 422 });
  }

  const safety = evaluateCreateInputSafety({
    text: normalizedText,
    locale: body.locale ?? "de",
    routeStage: "save",
    draftId: body.draftId ?? null,
  });

  if (safety.decision === "blocked") {
    return NextResponse.json(
      { ok: false, error: "create_input_blocked", safety },
      { status: 422 },
    );
  }

  const textToPersist = hasPiiOrDoxxingFindings(safety) ? safety.redactedText : normalizedText;
  const analysisWithMaterial = withMaterialContext(body.analysis, {
    sourceUrls: body.sourceUrls,
    uploadIds: body.uploadIds,
    materialItems: body.materialItems as Record<string, unknown>[] | undefined,
  });
  const claimSafety = buildClaimSafety(analysisWithMaterial, body.locale ?? "de");
  const analysisWithSafety = withSafetyAnalysis(analysisWithMaterial, safety, claimSafety);

  if (body.draftId) {
    let draftOid: ObjectId;
    try {
      draftOid = new ObjectId(body.draftId);
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_draft" }, { status: 400 });
    }

    const result = await Drafts.findOneAndUpdate(
      { _id: draftOid, authorId: userId },
      {
        $set: {
          text: textToPersist,
          locale: body.locale ?? null,
          source: body.source ?? null,
          createMode: normalizedCreateMode,
          anlassraumId: normalizedAnlassraumId,
          authorName: body.authorName ?? null,
          useCase: body.useCase ?? null,
          analysis: analysisWithSafety,
          status: "draft",
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );

    const updated = (result as any)?.value ?? result;
    if (!updated) {
      return NextResponse.json({ ok: false, error: "draft_not_found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      draftId: String(updated._id),
      createMode: updated.createMode ?? normalizedCreateMode,
      anlassraumId: updated.anlassraumId ?? normalizedAnlassraumId,
      updatedAt: updated.updatedAt?.toISOString() ?? now.toISOString(),
      safety,
    });
  }

  const doc: ContributionDraftDoc = {
    authorId: userId,
    text: textToPersist,
    locale: body.locale ?? undefined,
    source: body.source ?? undefined,
    createMode: normalizedCreateMode,
    anlassraumId: normalizedAnlassraumId,
    authorName: body.authorName ?? null,
    useCase: body.useCase ?? null,
    analysis: analysisWithSafety,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  const insert = await Drafts.insertOne(doc as ContributionDraftDoc);
  return NextResponse.json({
    ok: true,
    draftId: String(insert.insertedId),
    createMode: normalizedCreateMode,
    anlassraumId: normalizedAnlassraumId,
    updatedAt: now.toISOString(),
    safety,
  });
}

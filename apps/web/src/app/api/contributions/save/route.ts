export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCol, ObjectId } from "@core/db/triMongo";
import { z } from "zod";
import { CREATE_MODE_VALUES, parseCreateMode, type CreateMode } from "@/features/create/intents";

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
          text: normalizedText,
          locale: body.locale ?? null,
          source: body.source ?? null,
          createMode: normalizedCreateMode,
          anlassraumId: normalizedAnlassraumId,
          authorName: body.authorName ?? null,
          useCase: body.useCase ?? null,
          analysis: body.analysis ?? null,
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
    });
  }

  const doc: ContributionDraftDoc = {
    authorId: userId,
    text: normalizedText,
    locale: body.locale ?? undefined,
    source: body.source ?? undefined,
    createMode: normalizedCreateMode,
    anlassraumId: normalizedAnlassraumId,
    authorName: body.authorName ?? null,
    useCase: body.useCase ?? null,
    analysis: body.analysis ?? undefined,
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
  });
}

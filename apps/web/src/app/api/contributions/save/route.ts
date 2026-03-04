export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCol, ObjectId } from "@core/db/triMongo";
import { z } from "zod";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";

const DraftSaveSchema = z.object({
  draftId: z.string().optional(),
  text: z.string().optional(),
  textOriginal: z.string().optional(),
  textPrepared: z.string().optional(),
  locale: z.string().optional(),
  source: z.string().optional(),
  authorName: z.string().max(160).optional(),
  useCase: z.enum(["civic", "journalism", "agenda"]).optional(),
  analysis: z.unknown().optional(),
  attachments: z.array(z.any()).optional(),
  externalExtraction: z.boolean().optional(),
});

type ContributionDraftDoc = {
  _id?: ObjectId;
  authorId: string;
  text: string;
  locale?: string;
  source?: string;
  authorName?: string | null;
  useCase?: "civic" | "journalism" | "agenda" | null;
  analysis?: unknown;
  status: "draft" | "finalized";
  createdAt: Date;
  updatedAt: Date;
  finalizedAt?: Date;
  proposalIds?: string[];
};

type ApiSuccess<T> = { ok: true; data: T; code?: string };
type ApiError = { ok: false; error: string; code: string; details?: unknown };

function ok<T>(data: T, status = 200, code?: string) {
  return NextResponse.json({ ok: true, data, ...(code ? { code } : {}) } satisfies ApiSuccess<T>, { status });
}

function err(code: string, message: string, status = 500, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: message, code, ...(details ? { details } : {}) } satisfies ApiError,
    { status },
  );
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("u_id")?.value;
  if (!userId) {
    return err("NOT_AUTHENTICATED", "Speichern erfordert Anmeldung.", 401);
  }

  let body: z.infer<typeof DraftSaveSchema>;
  try {
    body = DraftSaveSchema.parse(await req.json());
  } catch (err: any) {
    const message = err?.issues?.[0]?.message ?? "invalid_body";
    return err("INVALID_BODY", message, 400, { issues: err?.issues });
  }

  const entitlements = await getCreateEntitlementsForRequest(req);
  if (!entitlements.canUseAttachments && Array.isArray(body.attachments) && body.attachments.length > 0) {
    return err("ATTACHMENTS_FORBIDDEN", "Dateianhaenge sind fuer dein Paket nicht freigeschaltet.", 403);
  }
  if (!entitlements.canUseExternalExtraction && body.externalExtraction) {
    return err("EXTERNAL_EXTRACTION_FORBIDDEN", "Externe Quellen sind fuer dein Paket nicht freigeschaltet.", 403);
  }

  const Drafts = await getCol<ContributionDraftDoc>("contribution_drafts");
  const now = new Date();
  const normalizedText =
    body.textPrepared?.trim() || body.textOriginal?.trim() || body.text?.trim() || "";

  if (!normalizedText) {
    return err("EMPTY_TEXT", "Bitte zuerst einen Text eingeben.", 422);
  }

  if (body.draftId) {
    let draftOid: ObjectId;
    try {
      draftOid = new ObjectId(body.draftId);
    } catch {
      return err("INVALID_DRAFT", "Draft-ID ist ungueltig.", 400);
    }

    const result = await Drafts.findOneAndUpdate(
      { _id: draftOid, authorId: userId },
      {
        $set: {
          text: normalizedText,
          locale: body.locale ?? null,
          source: body.source ?? null,
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
      return err("DRAFT_NOT_FOUND", "Entwurf nicht gefunden.", 404);
    }

    return ok({
      draftId: String(updated._id),
      updatedAt: updated.updatedAt?.toISOString() ?? now.toISOString(),
    });
  }

  const doc: ContributionDraftDoc = {
    authorId: userId,
    text: normalizedText,
    locale: body.locale ?? undefined,
    source: body.source ?? undefined,
    authorName: body.authorName ?? null,
    useCase: body.useCase ?? null,
    analysis: body.analysis ?? undefined,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };

  const insert = await Drafts.insertOne(doc as ContributionDraftDoc);
  return ok({ draftId: String(insert.insertedId), updatedAt: now.toISOString() });
}

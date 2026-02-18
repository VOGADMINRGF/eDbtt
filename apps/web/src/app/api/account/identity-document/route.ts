import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ObjectId } from "@core/db/triMongo";
import {
  deleteUserIdentityDocument,
  getUserIdentityDocument,
  upsertUserIdentityDocument,
} from "@core/db/pii/userIdentityDocuments";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const imageField = z
  .string()
  .trim()
  .min(1, "image_required")
  .max(1400000, "image_too_large")
  .refine((value) => value.startsWith("data:image/"), "invalid_image");

const payloadSchema = z.object({
  documentType: z.enum(["id_card", "passport"]),
  frontImage: imageField,
  backImage: imageField.optional().nullable(),
});

function toIso(value?: Date | string | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(req: NextRequest) {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const metaOnly = req.nextUrl.searchParams.get("meta") === "1";
  const doc = await getUserIdentityDocument(new ObjectId(userId));
  if (!doc) {
    return NextResponse.json({ ok: true, doc: null });
  }

  if (metaOnly) {
    return NextResponse.json({
      ok: true,
      doc: {
        documentType: doc.documentType,
        updatedAt: toIso(doc.updatedAt),
      },
    });
  }

  return NextResponse.json({
    ok: true,
    doc: {
      documentType: doc.documentType,
      frontImage: doc.frontImage,
      backImage: doc.backImage ?? null,
      updatedAt: toIso(doc.updatedAt),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "validation_error" },
      { status: 400 },
    );
  }

  const doc = await upsertUserIdentityDocument(new ObjectId(userId), {
    documentType: parsed.data.documentType,
    frontImage: parsed.data.frontImage,
    backImage: parsed.data.backImage ?? null,
  });

  return NextResponse.json({
    ok: true,
    doc: doc
      ? {
          documentType: doc.documentType,
          updatedAt: toIso(doc.updatedAt),
        }
      : null,
  });
}

export async function DELETE() {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  await deleteUserIdentityDocument(new ObjectId(userId));
  return NextResponse.json({ ok: true });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { ObjectId } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { readSession } from "@/utils/session";
import {
  GENERIC_SERVER_DRAFT_KIND,
  MANUAL_ANLASSRAUM_DRAFT_KIND,
  MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
  saveUserScopedServerDraft,
} from "@/server/serverDrafts";

const DEV_DISABLE_CSRF = process.env.DEV_DISABLE_CSRF === "1";

async function isCsrfValid(req: NextRequest): Promise<boolean> {
  if (DEV_DISABLE_CSRF) return true;
  const jar = await cookies();
  const c = jar.get("csrf-token")?.value ?? "";
  const h = req.headers.get("x-csrf-token") ?? (await headers()).get("x-csrf-token") ?? "";
  if (c && h && c === h) return true;
  try {
    const origin = req.nextUrl.origin;
    const referer = req.headers.get("referer") || "";
    const sameOrigin = referer.startsWith(origin);
    if (sameOrigin && c && !h) return true;
  } catch {}
  return false;
}

function csrfForbidden() {
  return NextResponse.json({ ok: false, error: "forbidden_csrf" }, { status: 403 });
}

const SaveDraftSchema = z.object({
  draftId: z.string().nullable().optional(),
  locale: z.string().min(2).max(10).optional(),
  source: z.string().optional(),
  text: z.string().min(1),
  textOriginal: z.string().optional(),
  textPrepared: z.string().optional(),
  evidenceInput: z.string().optional(),
  analysis: z.any().optional(),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isCsrfValid(req))) return csrfForbidden();

    const session = await readSession();
    const userId = session?.uid;
    if (!userId || !ObjectId.isValid(userId)) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = SaveDraftSchema.parse(await req.json().catch(() => ({})));
    const normalizedSource = typeof body.source === "string" ? body.source.trim() : undefined;
    const kind =
      normalizedSource === MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE
        ? MANUAL_ANLASSRAUM_DRAFT_KIND
        : GENERIC_SERVER_DRAFT_KIND;
    const idempotencyKey = stableHash({
      userId,
      kind,
      source: normalizedSource ?? null,
      locale: body.locale ?? null,
      text: body.text.trim(),
      textOriginal: body.textOriginal ?? null,
      textPrepared: body.textPrepared ?? null,
      evidenceInput: body.evidenceInput ?? null,
      analysis: body.analysis ?? null,
    });

    const saved = await saveUserScopedServerDraft({
      userId,
      route: "/api/drafts/save",
      kind,
      draftId: body.draftId ?? undefined,
      locale: body.locale ?? null,
      source: normalizedSource ?? null,
      text: body.text.trim(),
      textOriginal: body.textOriginal ?? null,
      textPrepared: body.textPrepared ?? null,
      evidenceInput: body.evidenceInput ?? null,
      analysis: body.analysis,
      idempotencyKey,
    });

    if (saved.ok === false) {
      if (saved.error === "draft_not_found") {
        return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
      }
      if (saved.error === "draft_finalized") {
        return NextResponse.json({ ok: false, error: "draft_finalized" }, { status: 409 });
      }
      if (saved.error === "idempotency_conflict") {
        return NextResponse.json({ ok: false, error: "idempotency_conflict" }, { status: 409 });
      }
      return NextResponse.json({ ok: false, error: "invalid_draft" }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      draftId: saved.draftId,
      updatedAt: saved.updatedAt.toISOString(),
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "invalid_input", issues: err.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "save_failed", message: err?.message ?? "save_failed" },
      { status: 500 },
    );
  }
}

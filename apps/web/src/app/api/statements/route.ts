const REQUIRE_LOGIN = process.env.REQUIRE_LOGIN === "1";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { coreCol } from "@core/triMongo";
import { readSession } from "src/utils/session";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function safeLang(v: unknown) {
  const ok = new Set([
    "de",
    "en",
    "fr",
    "it",
    "es",
    "pl",
    "uk",
    "ru",
    "tr",
    "hi",
    "zh",
    "ar",
  ]);
  const x = typeof v === "string" ? v.slice(0, 2).toLowerCase() : "de";
  return ok.has(x) ? x : "de";
}

type CursorPayload = { t: string | number | Date; id: string };
function enc(c: CursorPayload) {
  const t = c.t instanceof Date ? c.t.toISOString() : String(c.t);
  return Buffer.from(JSON.stringify({ t, id: c.id })).toString("base64url");
}
function dec(s: string): CursorPayload {
  const j = JSON.parse(Buffer.from(s, "base64url").toString("utf8"));
  if (!j?.t || !j?.id) throw new Error("bad cursor");
  return j as CursorPayload;
}

// GET: Cursor-Pagination, optional Filter (category, status, language)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limitParam = Number(url.searchParams.get("limit") ?? "20");
  const limit = clamp(Number.isFinite(limitParam) ? limitParam : 20, 1, 100);
  const cursor = url.searchParams.get("cursor");

  const category = url.searchParams.get("category")?.trim();
  const status = url.searchParams.get("status")?.trim();
  const language = url.searchParams.get("language")?.trim();

  let query: Record<string, any> = {};
  if (category) query.category = category;
  if (status) query.status = status;
  if (language) query.language = language;

  if (cursor) {
    try {
      const { t, id } = dec(cursor);
      const d = new Date(String(t));
      if (!Number.isNaN(d.getTime()) && ObjectId.isValid(String(id))) {
        const older = {
          $or: [
            { createdAt: { $lt: d } },
            { createdAt: d, _id: { $lt: new ObjectId(String(id)) } },
          ],
        };
        query = Object.keys(query).length ? { $and: [query, older] } : older;
      }
    } catch {
      /* ignore */
    }
  }

  const stmts = await coreCol("statements");
  const docs = await stmts
    .find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .toArray();

  const hasMore = docs.length > limit;
  if (hasMore) docs.pop();

  const data = docs.map((d: any) => ({
    id: String(d._id),
    title: d.title,
    text: d.text,
    category: d.category,
    language: d.language,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    factcheckStatus: d.factcheckStatus ?? null,
    stats: d.stats ?? {
      views: 0,
      votesAgree: 0,
      votesNeutral: 0,
      votesDisagree: 0,
      votesTotal: 0,
    },
    location: d.location ?? null,
  }));

  const last = docs.at(-1);
  const nextCursor =
    hasMore && last ? enc({ t: last.createdAt, id: String(last._id) }) : null;

  const res = NextResponse.json({ ok: true, data, nextCursor });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

// Factcheck-Job best effort einstellen (BullMQ)
async function tryEnqueueFactcheck(payload: any) {
  try {
    const { getFactcheckQueue } = await import("@core/queue/factcheckQueue");
    const q = getFactcheckQueue();
    await q.add("factcheck", payload, {
      jobId: `stmt:${payload.contributionId}`,
    });
  } catch (err) {
    console.warn("[factcheck enqueue skipped]", (err as any)?.message || err);
  }
}

// POST: anlegen (Login optional) + optional Factcheck
export async function POST(req: NextRequest) {
  const sess = readSession();
  if (REQUIRE_LOGIN && !sess) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const rawText = body?.text ?? body?.content ?? "";
  const text = String(rawText).trim().slice(0, 4000);
  if (!text)
    return NextResponse.json({ error: "text required" }, { status: 400 });

  const providedTitle = String(body?.title ?? "")
    .trim()
    .slice(0, 200);
  const autoTitle =
    (text.split(/\n+/).find(Boolean) || "").slice(0, 120) || "Beitrag";
  const title = providedTitle || autoTitle;

  const category = String(body?.category ?? "Allgemein")
    .trim()
    .slice(0, 80);
  const language = safeLang(body?.language);
  const scope = body?.scope ? String(body.scope).slice(0, 120) : undefined;
  const timeframe = body?.timeframe
    ? String(body.timeframe).slice(0, 120)
    : undefined;

  const now = new Date();
  const doc = {
    title,
    text,
    category,
    language,
    author: null,
    userId: (sess as any)?.uid ?? null,
    createdAt: now,
    updatedAt: now,
    factcheckStatus: "queued" as const,
    stats: {
      views: 0,
      votesAgree: 0,
      votesNeutral: 0,
      votesDisagree: 0,
      votesTotal: 0,
    },
    location:
      body?.location && Array.isArray(body.location?.coordinates)
        ? {
            type: "Point",
            coordinates: [
              Number(body.location.coordinates[0]),
              Number(body.location.coordinates[1]),
            ] as [number, number],
          }
        : undefined,
  };

  const stmts = await coreCol("statements");
  const ins = await stmts.insertOne(doc);
  const id = String(ins.insertedId);

  tryEnqueueFactcheck({
    contributionId: id,
    text,
    language,
    topic: category,
    scope,
    timeframe,
  }).catch(() => {});

  const resp = NextResponse.json({ ok: true, id }, { status: 201 });
  resp.headers.set("Location", `/api/statements/${id}`);
  return resp;
}

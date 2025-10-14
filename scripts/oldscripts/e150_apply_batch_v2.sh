#!/usr/bin/env bash
set -euo pipefail

# --- Ziel-App erkennen ---
if [ -d "apps/web/src" ]; then
  WEB_DIR="apps/web"
  SRC_BASE="$WEB_DIR/src"
elif [ -d "apps/web/app" ]; then
  WEB_DIR="apps/web"
  SRC_BASE="$WEB_DIR"         # Fallback (ohne /src)
else
  echo "❌ Konnte apps/web nicht finden. Abbruch."
  exit 1
fi

write() {
  local path="$1"; shift
  local content="$1"
  mkdir -p "$(dirname "$path")"
  printf "%s\n" "$content" > "$path"
  # CRLF raus, falls Terminal kopiert:
  sed -i '' -e $'s/\r$//' "$path" 2>/dev/null || true
  echo "✓ wrote $path"
}

# ---------- Helpers ----------
read -r -d '' R_GET_DB <<'TS'
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";
TS

# ---------- /api/admin/analytics/summary ----------
read -r -d '' CONTENT <<'TS'
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const [contribs, statements, reports, votes] = await Promise.all([
    db.collection("contributions").countDocuments().catch(()=>0),
    db.collection("statements").countDocuments().catch(()=>0),
    db.collection("reports").countDocuments().catch(()=>0),
    db.collection("votes").countDocuments().catch(()=>0),
  ]);
  return NextResponse.json({ totals: { contribs, statements, reports, votes } });
}
TS
write "$SRC_BASE/app/api/admin/analytics/summary/route.ts" "$CONTENT"

# ---------- /api/admin/errors/last24 ----------
read -r -d '' CONTENT <<'TS'
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const since = new Date(Date.now() - 24*60*60*1000);
  const arr = await db.collection("errors")
    .find({ ts: { $gte: since } })
    .sort({ ts: -1 })
    .limit(100)
    .toArray();
  return NextResponse.json(arr.map(({ _id, ...e }: any)=>({ id: String(_id), ...e })));
}
TS
write "$SRC_BASE/app/api/admin/errors/last24/route.ts" "$CONTENT"

# ---------- /api/admin/users/detail (list + single via ?id=) ----------
read -r -d '' CONTENT <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const u = await db.collection("users").findOne({ _id: id as any });
    if (!u) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const { _id, ...rest } = u as any;
    return NextResponse.json({ id: String(_id), ...rest });
  }
  const arr = await db.collection("users").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...u }: any)=>({ id: String(_id), ...u })));
}
TS
write "$SRC_BASE/app/api/admin/users/detail/route.ts" "$CONTENT"

# ---------- SystemMatrix /api/health/system-matrix ----------
read -r -d '' CONTENT <<'TS'
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const targets = [
  { name: "core",  label: "Core DB",  uri: process.env.CORE_MONGODB_URI,  db: process.env.CORE_DB_NAME },
  { name: "votes", label: "Votes DB", uri: process.env.VOTES_MONGODB_URI, db: process.env.VOTES_DB_NAME },
  { name: "pii",   label: "PII DB",   uri: process.env.PII_MONGODB_URI,   db: process.env.PII_DB_NAME },
];

async function ping(t:any) {
  if (!t.uri) return { name: t.name, label: t.label, ok: false, error: "missing_uri" };
  const client = new MongoClient(t.uri);
  const started = Date.now();
  try {
    await client.connect();
    await client.db(t.db).command({ ping: 1 });
    return { name: t.name, label: t.label, ok: true, ms: Date.now() - started };
  } catch (e:any) {
    return { name: t.name, label: t.label, ok: false, error: String(e) };
  } finally { await client.close().catch(()=>{}); }
}

export async function GET() {
  const res = await Promise.all(targets.map(ping));
  return NextResponse.json({ ok: res.every(r=>r.ok), targets: res, ts: new Date().toISOString() });
}
TS
write "$SRC_BASE/app/api/health/system-matrix/route.ts" "$CONTENT"

# ---------- Contributions: list/create ----------
read -r -d '' CONTENT <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("contributions").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...r }: any)=>({ id: String(_id), ...r })));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  if (!body?.text && !body?.title) return NextResponse.json({ error: "missing_payload" }, { status: 400 });
  const now = new Date();
  const doc = { title: body.title || body.text?.slice(0,80) || "Untitled", text: body.text || "", createdAt: now, updatedAt: now };
  const r = await db.collection("contributions").insertOne(doc);
  return NextResponse.json({ id: String(r.insertedId), ...doc }, { status: 201 });
}
TS
write "$SRC_BASE/app/api/contributions/route.ts" "$CONTENT"

# ---------- Contributions Analytics ----------
read -r -d '' CONTENT <<'TS'
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const contribs = await db.collection("contributions").countDocuments().catch(()=>0);
  const statements = await db.collection("statements").countDocuments().catch(()=>0);
  const reports = await db.collection("reports").countDocuments().catch(()=>0);
  const votes = await db.collection("votes").countDocuments().catch(()=>0);

  const daily = await db.collection("contributions").aggregate([
    { $group: { _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } }, c: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray().catch(()=>[]);

  return NextResponse.json({ totals: { contribs, statements, reports, votes }, daily });
}
TS
write "$SRC_BASE/app/api/contributions/analytics/summary/route.ts" "$CONTENT"

# ---------- Reports (list/create + [id]) ----------
read -r -d '' CONTENT <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("reports").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...r }: any)=>({ id: String(_id), ...r })));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  if (!body?.title || !body?.summary) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const now = new Date();
  const doc = { ...body, createdAt: now, updatedAt: now };
  const r = await db.collection("reports").insertOne(doc);
  return NextResponse.json({ id: String(r.insertedId), ...doc }, { status: 201 });
}
TS
write "$SRC_BASE/app/api/reports/route.ts" "$CONTENT"

read -r -d '' CONTENT <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const doc = await db.collection("reports").findOne({ _id: params.id as any });
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { _id, ...rest } = doc as any;
  return NextResponse.json({ id: String(_id), ...rest });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb();
  const patch = await req.json().catch(()=>({}));
  await db.collection("reports").updateOne({ _id: params.id as any }, { $set: { ...patch, updatedAt: new Date() } });
  const doc = await db.collection("reports").findOne({ _id: params.id as any });
  const { _id, ...rest } = doc as any;
  return NextResponse.json({ id: String(_id), ...rest });
}
TS
write "$SRC_BASE/app/api/reports/[id]/route.ts" "$CONTENT"

# ---------- Streams (public + admin) ----------
read -r -d '' CONTENT <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("streams").find().sort({ createdAt: -1 }).limit(100).toArray();
  return NextResponse.json(arr.map(({ _id, ...s }: any)=>({ id: String(_id), ...s })));
}
TS
write "$SRC_BASE/app/api/public/streams/route.ts" "$CONTENT"

read -r -d '' CONTENT <<'TS'
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("streams").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...s }: any)=>({ id: String(_id), ...s })));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  if (!body?.title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
  const now = new Date();
  const doc = { title: body.title, status: body.status || "planned", region: body.region || "DE", createdAt: now, updatedAt: now };
  const r = await db.collection("streams").insertOne(doc);
  return NextResponse.json({ id: String(r.insertedId), ...doc }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const db = await getDb();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  await db.collection("streams").deleteOne({ _id: id as any });
  return NextResponse.json({ ok: true });
}
TS
write "$SRC_BASE/app/api/admin/streams/route.ts" "$CONTENT"

# ---------- Admin Pages (Hub/System/Users/Errors Detail) ----------
read -r -d '' CONTENT <<'TS'
import "server-only";
import Link from "next/link";

async function getSummary() {
  const r = await fetch(

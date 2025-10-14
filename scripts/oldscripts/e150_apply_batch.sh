#!/usr/bin/env bash
set -euo pipefail

root="$(pwd)"

write() {
  local path="$1"; shift
  mkdir -p "$(dirname "$path")"
  cat > "$path" <<'TS'
$CONTENT$
TS
  sed -i '' -e $'s/\r$//' "$path" 2>/dev/null || true
  echo "✓ wrote $path"
}

# ---------- API: REPORTS ----------
CONTENT='
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("reports").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...r }: any) => ({ id: String(_id), ...r })));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.summary) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const now = new Date();
  const doc = { ...body, createdAt: now, updatedAt: now };
  const r = await db.collection("reports").insertOne(doc);
  return NextResponse.json({ id: String(r.insertedId), ...doc }, { status: 201 });
}
'
write "src/app/api/reports/route.ts" "$CONTENT"

CONTENT='
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
  const patch = await req.json().catch(()=> ({}));
  patch.updatedAt = new Date();
  await db.collection("reports").updateOne({ _id: params.id as any }, { $set: patch });
  const doc = await db.collection("reports").findOne({ _id: params.id as any });
  const { _id, ...rest } = doc as any;
  return NextResponse.json({ id: String(_id), ...rest });
}
'
write "src/app/api/reports/[id]/route.ts" "$CONTENT"

# ---------- Features: REPORT UI ----------
CONTENT='
"use client";
import Link from "next/link";

export function ReportCard({ r }: { r: any }) {
  return (
    <div className="border rounded p-4 bg-white/60">
      <div className="text-lg font-semibold">{r.title}</div>
      <div className="text-xs text-gray-500">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</div>
      <p className="mt-2 text-sm line-clamp-3">{r.summary}</p>
      <div className="mt-3">
        <Link href={`/reports/${r.id}`} className="underline text-sm">Öffnen</Link>
      </div>
    </div>
  );
}
'
write "src/features/report/components/ReportCard.tsx" "$CONTENT"

CONTENT='
import "server-only";
import { ReportCard } from "./ReportCard";

async function getReports() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/reports`, { cache: "no-store" });
  return res.ok ? res.json() : [];
}

export default async function ReportList() {
  const list = await getReports();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {list.map((r: any) => <ReportCard key={r.id} r={r} />)}
    </div>
  );
}
'
write "src/features/report/components/ReportList.tsx" "$CONTENT"

CONTENT='
import "server-only";
import ReportList from "@/features/report/components/ReportList";

export default async function ReportsPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportList />
    </div>
  );
}
'
write "src/app/reports/page.tsx" "$CONTENT"

CONTENT='
import "server-only";

async function getReport(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/reports/${id}`, { cache: "no-store" });
  return res.ok ? res.json() : null;
}

export default async function ReportDetailPage({ params }: { params: { id: string } }) {
  const r = await getReport(params.id);
  if (!r) return <div className="p-6">Report nicht gefunden.</div>;
  return (
    <article className="max-w-3xl mx-auto p-6 space-y-3">
      <h1 className="text-3xl font-bold">{r.title}</h1>
      <div className="text-xs text-gray-500">{new Date(r.updatedAt || r.createdAt).toLocaleString()}</div>
      <p className="text-base">{r.summary}</p>
      {r.body && <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: r.body }} />}
    </article>
  );
}
'
write "src/app/reports/[id]/page.tsx" "$CONTENT"

# ---------- API: STREAMS ----------
CONTENT='
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("streams").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...s }: any) => ({ id: String(_id), ...s })));
}

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  if (!body?.title) return NextResponse.json({ error: "missing_title" }, { status: 400 });
  const now = new Date();
  const doc = { title: body.title, region: body.region || "DE", status: body.status || "planned", createdAt: now, updatedAt: now };
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
'
write "src/app/api/admin/streams/route.ts" "$CONTENT"

CONTENT='
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export const runtime = "edge";

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("streams").find().sort({ createdAt: -1 }).limit(100).toArray();
  return NextResponse.json(arr.map(({ _id, ...s }: any) => ({ id: String(_id), ...s })));
}
'
write "src/app/api/public/streams/route.ts" "$CONTENT"

# ---------- Features: STREAM UI ----------
CONTENT='
"use client";
import Image from "next/image";

export type Stream = { id: string; title: string; status: "live"|"replay"|"planned" | string; region?: string; image?: string };

export default function StreamCard({ s }: { s: Stream }) {
  return (
    <div className="relative border rounded overflow-hidden bg-white/60">
      <div className="absolute top-2 left-2">
        <span className={
          "px-2 py-1 rounded text-xs font-semibold " +
          (s.status==="live" ? "bg-red-600 text-white" : s.status==="replay" ? "bg-gray-700 text-white" : "bg-indigo-600 text-white")
        }>{s.status}</span>
      </div>
      <div className="aspect-video bg-black/5">
        {s.image ? (
          <Image alt="" src={s.image} width={640} height={360} className="w-full h-full object-cover" />
        ) : null}
      </div>
      <div className="p-3">
        <div className="font-semibold">{s.title}</div>
        <div className="text-xs text-gray-500">{s.region || "—"}</div>
        <div className="mt-2 flex gap-2">
          <a className="px-3 py-1 rounded bg-black/80 text-white text-sm" href={`/streams/${s.id}`}>Zum Stream</a>
          <a className="px-3 py-1 rounded bg-gray-800/80 text-white text-sm" href={`/reports?stream=${s.id}`}>Zum Beitrag</a>
        </div>
      </div>
    </div>
  );
}
'
write "src/features/stream/components/StreamCard.tsx" "$CONTENT"

CONTENT='
import "server-only";
import StreamCard, { type Stream } from "./StreamCard";

async function getStreams(): Promise<Stream[]> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/public/streams`, { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function StreamList() {
  const list = await getStreams();
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {list.map((s) => <StreamCard key={s.id} s={s} />)}
    </div>
  );
}
'
write "src/features/stream/components/StreamList.tsx" "$CONTENT"

CONTENT='
"use client";
type Props = { onChange?: (f: { status?: string; region?: string; q?: string }) => void };
export default function StreamFilters({ onChange }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-2">
      <input placeholder="Suche…" className="border rounded px-3 py-2 flex-1" onChange={(e)=>onChange?.({ q: e.target.value })} />
      <select className="border rounded px-3 py-2" onChange={(e)=>onChange?.({ status: e.target.value })}>
        <option value="">Alle</option><option value="live">Live</option><option value="replay">Replay</option><option value="planned">Geplant</option>
      </select>
      <input placeholder="Region" className="border rounded px-3 py-2" onChange={(e)=>onChange?.({ region: e.target.value })} />
    </div>
  );
}
'
write "src/features/stream/components/StreamFilters.tsx" "$CONTENT"

CONTENT='
import "server-only";
import dynamic from "next/dynamic";

const StreamList = dynamic(()=>import("@/features/stream/components/StreamList"), { ssr: true });

export default async function StreamPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Stream</h1>
      <StreamList />
    </div>
  );
}
'
write "src/app/stream/page.tsx" "$CONTENT"

# ---------- Contribution UI + Analytics ----------
CONTENT='
"use client";
import { useState } from "react";

export default function ContributionForm() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/contributions", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ title, text }) });
    setMsg(r.ok ? "Gespeichert." : "Fehler.");
    if (r.ok) { setTitle(""); setText(""); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" placeholder="Titel" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <textarea className="w-full border rounded px-3 py-2 h-40" placeholder="Text" value={text} onChange={(e)=>setText(e.target.value)} />
      <button className="px-4 py-2 rounded bg-indigo-600 text-white">Beitrag speichern</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
'
write "src/features/contribution/components/ContributionForm.tsx" "$CONTENT"

CONTENT='
import "server-only";

async function getContribs() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/contributions`, { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function ContributionList() {
  const items = await getContribs();
  return (
    <div className="space-y-3">
      {items.map((c: any) => (
        <div key={c.id} className="border rounded p-3 bg-white/60">
          <div className="font-semibold">{c.title || c.text?.slice(0,80)}</div>
          <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
          <p className="text-sm mt-2">{c.text}</p>
        </div>
      ))}
    </div>
  );
}
'
write "src/features/contribution/components/ContributionList.tsx" "$CONTENT"

CONTENT='
import "server-only";
import ContributionForm from "@/features/contribution/components/ContributionForm";

export default async function NewContributionPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Neuer Beitrag</h1>
      <ContributionForm />
    </div>
  );
}
'
write "src/app/contributions/new/page.tsx" "$CONTENT"

CONTENT='
import "server-only";
import ContributionList from "@/features/contribution/components/ContributionList";

export default async function ContributionsPage() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Beiträge</h1>
      <ContributionList />
    </div>
  );
}
'
write "src/app/contributions/page.tsx" "$CONTENT"

CONTENT='
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const contribs = await db.collection("contributions").countDocuments();
  const statements = await db.collection("statements").countDocuments();
  const reports = await db.collection("reports").countDocuments();
  const votes = await db.collection("votes").countDocuments();

  const daily = await db.collection("contributions").aggregate([
    { $group: { _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } }, c: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();

  return NextResponse.json({ totals: { contribs, statements, reports, votes }, daily });
}
'
write "src/app/api/contributions/analytics/summary/route.ts" "$CONTENT"

# ---------- Fact-Check Queue (enqueue + status + worker) ----------
CONTENT='
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  if (!body?.text) return NextResponse.json({ error: "missing_text" }, { status: 400 });
  const job = { kind: "factcheck", payload: { text: body.text }, status: "queued", createdAt: new Date(), updatedAt: new Date() };
  const r = await db.collection("factcheck_jobs").insertOne(job);
  return NextResponse.json({ id: String(r.insertedId), status: "queued" }, { status: 202 });
}
'
write "src/app/api/factcheck/enqueue/route.ts" "$CONTENT"

CONTENT='
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET(req: NextRequest) {
  const db = await getDb();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const j = await db.collection("factcheck_jobs").findOne({ _id: id as any });
  if (!j) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const { _id, ...rest } = j as any;
  return NextResponse.json({ id: String(_id), ...rest });
}
'
write "src/app/api/factcheck/status/route.ts" "$CONTENT"

CONTENT='
import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.CORE_MONGODB_URI!;
const dbName = process.env.CORE_DB_NAME || "core_dev";

async function basicAnalyze(text: string) {
  const sentiment = /(gut|super|great|love)/i.test(text) ? "positive" : (/(korrupt|krise|schlecht|hate)/i.test(text) ? "negative" : "neutral");
  const summary = text.length > 200 ? text.slice(0,197)+"..." : text;
  return { verdict: sentiment, confidence: 0.66, summary };
}

async function loop() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  console.log("[factcheck-worker] started");
  while (true) {
    const job = await db.collection("factcheck_jobs").findOneAndUpdate(
      { status: "queued" },
      { $set: { status: "processing", updatedAt: new Date() } },
      { sort: { createdAt: 1 }, returnDocument: "after" as any }
    );
    if (!job.value) { await new Promise(r=>setTimeout(r, 1500)); continue; }
    try {
      const text = job.value.payload?.text || "";
      const res = await basicAnalyze(text);
      await db.collection("factcheck_jobs").updateOne(
        { _id: job.value._id },
        { $set: { status: "done", result: res, updatedAt: new Date() } }
      );
    } catch (e: any) {
      await db.collection("factcheck_jobs").updateOne(
        { _id: job.value._id },
        { $set: { status: "dead", error: String(e), updatedAt: new Date() } }
      );
    }
  }
}

loop().catch((e)=>{ console.error(e); process.exit(1); });
'
write "worker/factcheck/worker.ts" "$CONTENT"

# ---------- Graph: Sync to Arango ----------
CONTENT='
import { getDb } from "@core/db/triMongo";
import { aql } from "@/graph/arangoRepo";

/** Sync statements & reports to Arango (nodes + simple edges). */
export async function syncGraph() {
  const db = await getDb();
  const statements = await db.collection("statements").find().project({ _id:1, title:1, topicId:1 }).toArray();
  const reports = await db.collection("reports").find().project({ _id:1, title:1 }).toArray();

  // Ensure collections
  await aql("RETURN 1"); // ping
  // Upserts
  for (const s of statements) {
    await aql(`
      UPSERT { _key: @key } INSERT { _key: @key, kind: "statement", title: @title, topicId: @topicId }
      UPDATE { title: @title, topicId: @topicId } IN nodes
    `, { key: String(s._id), title: s.title, topicId: s.topicId || null });
  }
  for (const r of reports) {
    await aql(`
      UPSERT { _key: @key } INSERT { _key: @key, kind: "report", title: @title }
      UPDATE { title: @title } IN nodes
    `, { key: String(r._id), title: r.title });
  }
  // Example edges: report -> statement (if report.statementIds array exists)
  const agg = await db.collection("reports").find({ statementIds: { $exists: true, $ne: [] } }).toArray();
  for (const rr of agg) {
    for (const sid of (rr.statementIds || [])) {
      await aql(`
        UPSERT { _from: @from, _to: @to } INSERT { _from: @from, _to: @to, kind: "covers" }
        UPDATE {} IN edges
      `, { from: `nodes/${String(rr._id)}`, to: `nodes/${String(sid)}` });
    }
  }
  return { ok: true, nodes: statements.length + reports.length };
}
'
write "src/graph/syncStatementsToGraph.ts" "$CONTENT"

# ---------- Admin: Hub + Analytics + Errors (24h) ----------
CONTENT='
import "server-only";
import Link from "next/link";

async function getSummary() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/analytics/summary`, { cache: "no-store" });
  return r.ok ? r.json() : null;
}
async function getErrors() {
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/errors/last24`, { cache: "no-store" });
  return r.ok ? r.json() : { items: [] };
}

export default async function AdminHub() {
  const [sum, errs] = await Promise.all([getSummary(), getErrors()]);
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">System</div>
          <ul className="text-sm space-y-1">
            <li><Link className="underline" href="/admin/system">SystemMatrix</Link></li>
            <li><Link className="underline" href="/admin/users">Benutzer</Link></li>
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Analytics</div>
          {sum ? (
            <ul className="text-sm">
              <li>Contributions: {sum.totals.contribs}</li>
              <li>Statements: {sum.totals.statements}</li>
              <li>Reports: {sum.totals.reports}</li>
              <li>Votes: {sum.totals.votes}</li>
            </ul>
          ) : <div className="text-sm text-gray-500">Keine Daten.</div>}
        </div>
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Errors (24h)</div>
          <ul className="text-sm list-disc pl-5">
            {errs.items.slice(0,5).map((e:any)=>(
              <li key={e.id}><Link className="underline" href={`/admin/errors/${e.id}`}>{e.msg || e.name || "Error"}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
'
write "src/app/admin/page.tsx" "$CONTENT"

CONTENT='
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const since = new Date(Date.now() - 24*60*60*1000);
  const arr = await db.collection("errors").find({ ts: { $gte: since } }).sort({ ts: -1 }).limit(100).toArray();
  return NextResponse.json(arr.map(({ _id, ...e }: any) => ({ id: String(_id), ...e })));
}
'
write "src/app/api/admin/errors/last24/route.ts" "$CONTENT"

CONTENT='
import { NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function GET() {
  const db = await getDb();
  const contribs = await db.collection("contributions").countDocuments();
  const statements = await db.collection("statements").countDocuments();
  const reports = await db.collection("reports").countDocuments();
  const votes = await db.collection("votes").countDocuments();
  return NextResponse.json({ totals: { contribs, statements, reports, votes } });
}
'
write "src/app/api/admin/analytics/summary/route.ts" "$CONTENT"

# ---------- Admin: Orgs CRUD (minimal) ----------
CONTENT='
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";
import { can } from "@/config/accessControl";

function roleFrom(req: NextRequest) {
  const r = req.headers.get("x-role") || req.cookies.get("u_role")?.value || "user";
  return r as any;
}

export async function GET() {
  const db = await getDb();
  const arr = await db.collection("orgs").find().sort({ createdAt: -1 }).limit(200).toArray();
  return NextResponse.json(arr.map(({ _id, ...o }: any)=> ({ id: String(_id), ...o })));
}

export async function POST(req: NextRequest) {
  const role = roleFrom(req);
  if (!can(role as any, "org.create")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  if (!body?.name || !body?.slug) return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  const now = new Date();
  const doc = { name: body.name, slug: body.slug, createdAt: now, updatedAt: now };
  const r = await db.collection("orgs").insertOne(doc);
  return NextResponse.json({ id: String(r.insertedId), ...doc }, { status: 201 });
}
'
write "src/app/api/admin/orgs/route.ts" "$CONTENT"

# ---------- Profile: Location Save (für Onboarding-Seite) ----------
CONTENT='
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@core/db/triMongo";

export async function POST(req: NextRequest) {
  const db = await getDb();
  const body = await req.json().catch(()=>null);
  const uid = req.cookies.get("u_id")?.value || "anon";
  const doc = { userId: uid, coords: body?.coords || null, updatedAt: new Date() };
  await db.collection("profiles").updateOne({ userId: uid }, { $set: doc }, { upsert: true });
  return NextResponse.json({ ok: true });
}
'
write "src/app/api/profile/location/route.ts" "$CONTENT"

# ---------- Scripts: ensureIndexes + verifyEnv + seed demo ----------
CONTENT='
import "dotenv/config";
import { MongoClient } from "mongodb";

async function ensure() {
  const uri = process.env.CORE_MONGODB_URI!;
  const dbName = process.env.CORE_DB_NAME || "core_dev";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("orgs").createIndex({ slug: 1 }, { unique: true });
  await db.collection("reports").createIndex({ createdAt: -1 });
  await db.collection("statements").createIndex({ createdAt: -1 });
  await db.collection("statements").createIndex({ topicId: 1, createdAt: -1 });
  await db.collection("contributions").createIndex({ createdAt: -1, userId: 1 });
  await db.collection("votes").createIndex({ statementId: 1, createdAt: -1 });
  await db.collection("errors").createIndex({ ts: -1 });

  console.log("✓ indexes ensured");
  await client.close();
}

ensure().catch((e)=>{ console.error(e); process.exit(1); });
'
write "scripts/ensureIndexes.ts" "$CONTENT"

CONTENT='
const required = [
  "CORE_MONGODB_URI","CORE_DB_NAME",
  "VOTES_MONGODB_URI","VOTES_DB_NAME",
  "PII_MONGODB_URI","PII_DB_NAME",
  "JWT_SECRET","AUTH_SECRET"
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error("Missing ENV:", missing.join(", "));
  process.exit(1);
} else {
  console.log("✓ ENV ok");
}
'
write "scripts/verifyEnv.ts" "$CONTENT"

CONTENT='
import "dotenv/config";
import { MongoClient } from "mongodb";

async function run() {
  const client = new MongoClient(process.env.CORE_MONGODB_URI!);
  await client.connect();
  const db = client.db(process.env.CORE_DB_NAME || "core_dev");
  const now = new Date();

  await db.collection("reports").insertMany([
    { slug: "wasser-als-grundrecht", title: "Trinkwasser als Menschenrecht", summary: "Analyse zur Versorgung & Finanzierung.", createdAt: now, updatedAt: now },
    { slug: "pressefreiheit", title: "Pressefreiheit stärken", summary: "Indikatoren, Risiken, Maßnahmen.", createdAt: now, updatedAt: now }
  ], { ordered: false }).catch(()=>{});

  await db.collection("streams").insertMany([
    { title: "Bürgerdialog Berlin", status: "live", region: "DE-BE", createdAt: now, updatedAt: now },
    { title: "EU-Debatte Medienkompetenz", status: "planned", region: "EU", createdAt: now, updatedAt: now }
  ], { ordered: false }).catch(()=>{});

  console.log("✓ demo data seeded");
  await client.close();
}

run().catch((e)=>{ console.error(e); process.exit(1); });
'
write "scripts/seed.demo.data.ts" "$CONTENT"

# ---------- Utils: logger + formatError ----------
CONTENT='
export function log(level: "info"|"warn"|"error", msg: string, meta: Record<string, any> = {}) {
  const out = { ts: new Date().toISOString(), level, msg, ...meta };
  // stdout logging (can be piped to stack)
  console.log(JSON.stringify(out));
  return out;
}
'
write "src/utils/logger.ts" "$CONTENT"

CONTENT='
export class AppError extends Error {
  code: string; status: number; cause?: any;
  constructor(code: string, message: string, status = 400, cause?: any) {
    super(message); this.code = code; this.status = status; this.cause = cause;
  }
}
export function formatError(e: unknown) {
  const err = e as any;
  return { name: err?.name || "Error", msg: err?.message || String(e), stack: err?.stack };
}
'
write "src/core/errors/formatError.ts" "$CONTENT"

echo "-----"
echo "All E150 batch files written."
echo "Next steps:"
echo "1) pnpm tsx scripts/verifyEnv.ts"
echo "2) pnpm tsx scripts/ensureIndexes.ts"
echo "3) pnpm tsx scripts/seed.demo.data.ts"
echo "4) pnpm dev   # oder npm run dev"

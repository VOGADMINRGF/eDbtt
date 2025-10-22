#!/usr/bin/env bash
set -euo pipefail

WEB_ROOT="apps/web/src"

# --- A) Draft-Store: Dev-Fallback auf In-Memory, Prod weiter Mongo ---
STORE_FILE="$WEB_ROOT/server/draftStore.ts"
mkdir -p "$(dirname "$STORE_FILE")"
cat > "$STORE_FILE" <<'TS'
import { MongoClient, Collection } from "mongodb";

export type Draft = {
  id: string;
  kind: "contribution" | string;
  text: string;
  analysis?: any;
  createdAt: string;
  updatedAt: string;
  _id?: any;
};

type Store = {
  create(d: Omit<Draft, "id"|"createdAt"|"updatedAt">): Promise<Draft>;
  patch(id: string, patch: Partial<Draft>): Promise<{ ok: boolean; id: string; draft: Draft|null }>;
  get(id: string): Promise<Draft | null>;
};

function isoNow(){ return new Date().toISOString(); }
function rid(){ return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); }

/** --- Mongo-Implementierung --- */
async function mongoCol(): Promise<Collection<Draft>> {
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.MONGODB_DB!;
  const client = new MongoClient(uri);
  await client.connect();
  return client.db(dbName).collection<Draft>("drafts");
}
const mongoStore: Store = {
  async create(d) {
    const col = await mongoCol();
    const draft: Draft = { id: rid(), createdAt: isoNow(), updatedAt: isoNow(), ...d };
    await col.insertOne(draft);
    return draft;
  },
  async patch(id, patch) {
    const col = await mongoCol();
    const upd = { ...patch, updatedAt: isoNow() };
    await col.updateOne({ id }, { $set: upd });
    const draft = await col.findOne({ id });
    return { ok: !!draft, id, draft: draft ?? null };
    },
  async get(id) {
    const col = await mongoCol();
    return await col.findOne({ id });
  }
};

/** --- In-Memory-Implementierung (Dev-Fallback) --- */
const g = globalThis as any;
g.__VOG_DRAFTS__ ||= new Map<string, Draft>();
const mem: Map<string, Draft> = g.__VOG_DRAFTS__;

const memoryStore: Store = {
  async create(d) {
    const draft: Draft = { id: rid(), createdAt: isoNow(), updatedAt: isoNow(), ...d };
    mem.set(draft.id, draft);
    return draft;
  },
  async patch(id, patch) {
    const cur = mem.get(id) || null;
    if (!cur) return { ok: false, id, draft: null };
    const next = { ...cur, ...patch, updatedAt: isoNow() };
    mem.set(id, next);
    return { ok: true, id, draft: next };
  },
  async get(id) { return mem.get(id) || null; }
};

/** --- Factory: Prod (Mongo) wenn ENV da, sonst Dev (Memory) --- */
function pickStore(): Store {
  const hasMongo = !!process.env.MONGODB_URI && !!process.env.MONGODB_DB;
  return hasMongo ? mongoStore : memoryStore;
}

export async function createDraft(d: Omit<Draft, "id"|"createdAt"|"updatedAt">) {
  return pickStore().create(d);
}
export async function patchDraft(id: string, patch: Partial<Draft>) {
  return pickStore().patch(id, patch);
}
export async function getDraft(id: string) {
  return pickStore().get(id);
}
TS

# --- B) /api/drafts base route (create) – kleine robuste Handler ---
DRAFT_ROUTE="$WEB_ROOT/app/api/drafts/route.ts"
mkdir -p "$(dirname "$DRAFT_ROUTE")"
cat > "$DRAFT_ROUTE" <<'TS'
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createDraft } from "@/server/draftStore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const draft = await createDraft({
    kind: String(body?.kind ?? "contribution"),
    text: String(body?.text ?? ""),
    analysis: body?.analysis ?? {},
  });
  return NextResponse.json({ ok: true, id: draft.id, draft });
}
TS

# --- C) /api/drafts/[id] route – params awaiten & PATCH fix ---
DRAFT_ID_ROUTE="$WEB_ROOT/app/api/drafts/[id]/route.ts"
mkdir -p "$(dirname "$DRAFT_ID_ROUTE")"
cat > "$DRAFT_ID_ROUTE" <<'TS'
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { patchDraft, getDraft } from "@/server/draftStore";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const draft = await getDraft(id);
  return NextResponse.json({ ok: !!draft, draft });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;        // <- Next verlangt await
  const body = await req.json();
  const res = await patchDraft(id, body);
  return NextResponse.json(res);
}
TS

# --- D) Analyzer-Route: strikt GPT nutzen + sinnvollen Fallback liefern ---
AN_ROUTE="$WEB_ROOT/app/api/contributions/analyze/route.ts"
mkdir -p "$(dirname "$AN_ROUTE")"
cat > "$AN_ROUTE" <<'TS'
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { analyzeContribution as analyzeGPT } from "@/features/analyze/analyzeContribution";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const text = String(body?.text ?? "").trim();
  const maxClaims = Number(body?.maxClaims ?? 5);

  try {
    const res = await analyzeGPT(text);
    // Fallback: falls GPT leer liefert, gib mind. 1 Claim zurück (Input selbst)
    if (!res.claims || res.claims.length === 0) {
      res.claims = [{
        text: text.slice(0, 180),
        categoryMain: null,
        categorySubs: [],
        region: null,
        authority: null,
      }];
    }
    if (res.claims.length > maxClaims) res.claims = res.claims.slice(0, maxClaims);
    return NextResponse.json({ ...res, _meta: { mode: "gpt" } });
  } catch (e: any) {
    // Harmloser Fallback ohne den Prozess zu blockieren
    const fallback = {
      language: "de",
      mainTopic: null,
      subTopics: [],
      regionHint: null,
      claims: text ? [{
        text: text.slice(0, 180),
        categoryMain: null,
        categorySubs: [],
        region: null,
        authority: null,
      }] : [],
      _meta: { mode: "fallback", error: String(e?.message ?? e) },
    };
    return NextResponse.json(fallback, { status: 200 });
  }
}
TS

echo "✓ Hotfix geschrieben."
echo "Jetzt: pnpm --filter @vog/web dev"

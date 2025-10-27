#!/usr/bin/env bash
# scripts/setup_atomic_pipeline.sh
set -euo pipefail

ROOT="${ROOT:-$(pwd)}"
APP_WEB="$ROOT/apps/web"
API_ROUTE="$APP_WEB/src/app/api/contributions/analyze/route.ts"
FEATURES="$APP_WEB/src/features"
AI_DIR="$FEATURES/ai"
PROMPTS_DIR="$AI_DIR/prompts"
ROLES_DIR="$AI_DIR/roles"
PROVIDERS_DIR="$AI_DIR/providers"
ANALYZE_DIR="$FEATURES/analyze"
UI_DIR="$APP_WEB/src/ui"

echo "▶︎ Repo-Root: $ROOT"
test -f "$API_ROUTE" || { echo "❌ Nicht gefunden: $API_ROUTE"; exit 1; }

mkdir -p "$PROMPTS_DIR" "$ROLES_DIR" "$PROVIDERS_DIR" "$ANALYZE_DIR" "$UI_DIR" "scripts"

# 1) Shared Types & Schemas
cat > "$ROLES_DIR/shared_types.ts" <<'TS'
import { z } from "zod";

// —— Atomic Claim (Pflichtfelder) ——
export const AtomicClaimSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(6).max(300),
  sachverhalt: z.string().min(3).max(200),
  zeitraum: z.object({ from: z.string().min(4), to: z.string().min(4) }).optional().nullable(),
  ort: z.string().min(2).max(120),
  zuständigkeit: z.enum(["EU","Bund","Land","Kommune","Unklar"]),
  zuständigkeitsorgan: z.string().min(2).max(140).optional().nullable(),
  betroffene: z.array(z.string().min(2).max(80)).max(6).default([]),
  messgröße: z.string().min(1).max(80),
  unsicherheiten: z.array(z.string().min(2).max(160)).max(4).default([]),
  language: z.string().min(2).max(5).default("de"),
  readability: z.enum(["A2","B1","B2"]).default("B1"),
  canonical_id: z.string().min(4).max(64),
});
export type AtomicClaim = z.infer<typeof AtomicClaimSchema>;

// —— Evidence hypotheses ——
export const EvidenceHypothesisSchema = z.object({
  claim_canonical_id: z.string().optional().default(""),
  source_type: z.enum(["amtlich","presse","forschung"]),
  suchquery: z.string().min(4),
  erwartete_kennzahl: z.string().min(2).max(120),
  jahr: z.number().int().min(1900).max(2100).nullable(),
});
export type EvidenceHypothesis = z.infer<typeof EvidenceHypothesisSchema>;

// —— Perspectives ——
export const PerspectivesSchema = z.object({
  pro: z.array(z.string().min(6).max(160)).max(3).default([]),
  kontra: z.array(z.string().min(6).max(160)).max(3).default([]),
  alternative: z.string().min(10).max(220).default(""),
});
export type Perspectives = z.infer<typeof PerspectivesSchema>;

// —— Redaktions-Score ——
export const ScoreSchema = z.object({
  präzision: z.number().min(0).max(1),
  prüfbarkeit: z.number().min(0).max(1),
  relevanz: z.number().min(0).max(1),
  lesbarkeit: z.number().min(0).max(1),
  ausgewogenheit: z.number().min(0).max(1),
  begründung: z.object({
    präzision: z.string().min(4).max(140),
    prüfbarkeit: z.string().min(4).max(140),
    relevanz: z.string().min(4).max(140),
    lesbarkeit: z.string().min(4).max(140),
    ausgewogenheit: z.string().min(4).max(140),
  })
});
export type ScoreSet = z.infer<typeof ScoreSchema>;

// —— Quality Gates ——
export const QualityGateSchema = z.object({
  json_valid: z.boolean(),
  atomization_complete: z.boolean(),
  readability_b1_b2: z.boolean(),
  jurisdiction_present: z.boolean(),
  evidence_present: z.boolean(),
});
export type QualityGate = z.infer<typeof QualityGateSchema>;

export const OrchestrationResultSchema = z.object({
  claim: AtomicClaimSchema,
  evidence: z.array(EvidenceHypothesisSchema),
  perspectives: PerspectivesSchema,
  score: ScoreSchema,
  quality: QualityGateSchema,
});
export type OrchestrationResult = z.infer<typeof OrchestrationResultSchema>;

// —— Canonical ID util —— (NFKC+lower+strip diacritics → cheap hash)
export function canonicalIdFrom(text: string){
  const norm = text.normalize("NFKC").toLowerCase().replace(/\p{Diacritic}/gu, "");
  let h = 2166136261 >>> 0;
  for (let i=0;i<norm.length;i++){ h ^= norm.charCodeAt(i); h = (h + (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24))>>>0; }
  return h.toString(16);
}
TS

# 2) Prompts
cat > "$PROMPTS_DIR/atomicizer.ts" <<'TS'
export const ATOMICIZER_SYSTEM = `You are a rigorous editor. Task: rewrite ONE-sentence claim in B1/B2 German and fill ALL required slots. If a slot is impossible to infer, return a needs-info note (e.g., "needs-info: zeitraum"). Output strict JSON only.`;

export const ATOMICIZER_USER = ({input}:{input:string})=> `INPUT:
${input}

Return JSON exactly of shape:
{
  "text": string,
  "sachverhalt": string,
  "zeitraum": {"from": string, "to": string} | null,
  "ort": string,
  "zuständigkeit": "EU"|"Bund"|"Land"|"Kommune"|"Unklar",
  "zuständigkeitsorgan": string|null,
  "betroffene": string[],
  "messgröße": string,
  "unsicherheiten": string[]
}
If any required value is missing, set a single string field "needs_info" with the missing key name.`;
TS

cat > "$PROMPTS_DIR/evidence.ts" <<'TS'
export const EVIDENCE_SYSTEM = `You propose falsifiable evidence hypotheses. No browsing. Output only the search formulation and expected field.`;
export const EVIDENCE_USER = ({claim}:{claim:string})=> `For the claim: ${claim}
Return an array (max 4) of objects: {
  "source_type":"amtlich"|"presse"|"forschung",
  "suchquery": string,
  "erwartete_kennzahl": string,
  "jahr": number|null
}`;
TS

cat > "$PROMPTS_DIR/perspectives.ts" <<'TS'
export const PERSPECTIVES_SYSTEM = `Write neutral, source-agnostic pros/cons and one constructive alternative. No Ad-hominem.`;
export const PERSPECTIVES_USER = ({claim}:{claim:string})=> `For the claim: ${claim}
Give JSON: {
  "pro": string[<=3],
  "kontra": string[<=3],
  "alternative": string
}`;
TS

cat > "$PROMPTS_DIR/editor_rater.ts" <<'TS'
export const RATER_SYSTEM = `Rate the draft on 5 criteria (0–1) and give one short reason each. Output strict JSON.`;
export const RATER_USER = ({claim}:{claim:string})=> `Text: ${claim}
Return: {
  "präzision":number, "prüfbarkeit":number, "relevanz":number, "lesbarkeit":number, "ausgewogenheit":number,
  "begründung": {"präzision":string, "prüfbarkeit":string, "relevanz":string, "lesbarkeit":string, "ausgewogenheit":string}
}`;
TS

# 3) Provider shim (nutzt eure vorhandenen call* Provider, JSON-only)
cat > "$PROVIDERS_DIR/index.ts" <<'TS'
export type RunJsonArgs = { system?: string; user: string; model?: string; timeoutMs?: number };

export async function runLLMJson(args: RunJsonArgs): Promise<{ data: any; raw: any }>{
  const provider = (process.env.VOG_AI_PROVIDER || "openai").toLowerCase();
  const model = args.model || process.env.VOG_DEFAULT_MODEL || "gpt-4o-mini";
  const payload = { system: args.system, user: args.user, model, mode: "json", timeoutMs: args.timeoutMs ?? 2500 };

  try{
    if (provider === "openai"){
      const { callOpenAI } = await import("./openai");
      const res: any = await callOpenAI(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
    if (provider === "anthropic"){
      const { callAnthropic } = await import("./anthropic");
      const res: any = await callAnthropic(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
    if (provider === "mistral"){
      const { callMistral } = await import("./mistral");
      const res: any = await callMistral(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
    if (provider === "gemini"){
      const { callGemini } = await import("./gemini");
      const res: any = await callGemini(payload as any);
      const data = res?.json ?? res?.data ?? res;
      return { data, raw: res };
    }
  }catch(e:any){
    throw new Error("runLLMJson providererr: "+(e?.message||String(e)));
  }
  throw new Error("runLLMJson: Unknown provider "+provider);
}
TS

# 4) Rollen Implementierungen
cat > "$ROLES_DIR/atomicizer.ts" <<'TS'
import { z } from "zod";
import { ATOMICIZER_SYSTEM, ATOMICIZER_USER } from "../prompts/atomicizer";
import { AtomicClaimSchema, canonicalIdFrom, type AtomicClaim } from "./shared_types";
import { runLLMJson } from "../providers";

export async function atomicize(input: string, opts?:{timeoutMs?:number, model?:string}): Promise<{claim: AtomicClaim, missing?:string|null}> {
  const { data } = await runLLMJson({
    system: ATOMICIZER_SYSTEM,
    user: ATOMICIZER_USER({ input }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 2500,
  });

  const parsed = AtomicClaimSchema.merge(z.object({ needs_info: z.string().optional() })).safeParse({
    ...data,
    text: data?.text,
    canonical_id: canonicalIdFrom(data?.text||input),
  });
  if (!parsed.success) throw new Error("atomicizer:invalid_json:"+JSON.stringify(parsed.error.issues));
  const { needs_info, ...payload } = parsed.data as any;
  return { claim: payload as AtomicClaim, missing: needs_info ?? null };
}
TS

cat > "$ROLES_DIR/assigner.ts" <<'TS'
import { runLLMJson } from "../providers";
import { z } from "zod";

const AssignOut = z.object({
  zuständigkeit: z.enum(["EU","Bund","Land","Kommune","Unklar"]),
  zuständigkeitsorgan: z.string().nullable(),
  thema_key: z.string().min(2).max(60),
});
export type AssignOut = z.infer<typeof AssignOut>;

export async function assignJurisdiction(text: string, opts?:{timeoutMs?:number, model?:string}): Promise<AssignOut>{
  const { data } = await runLLMJson({
    system: "Classify the political level (EU/Bund/Land/Kommune/Unklar), the concrete organ (short), and map to a topic key from a 15-topic taxonomy. JSON only.",
    user: `Text: ${text}\nReturn {"zuständigkeit":"EU|Bund|Land|Kommune|Unklar","zuständigkeitsorgan":string|null,"thema_key":string}`,
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 2000,
  });
  return AssignOut.parse(data);
}
TS

cat > "$ROLES_DIR/evidence.ts" <<'TS'
import { runLLMJson } from "../providers";
import { EVIDENCE_SYSTEM, EVIDENCE_USER } from "../prompts/evidence";
import { EvidenceHypothesisSchema, type EvidenceHypothesis } from "./shared_types";

export async function makeEvidenceHypotheses(claimText: string, opts?:{timeoutMs?:number, model?:string}): Promise<EvidenceHypothesis[]>{
  const { data } = await runLLMJson({
    system: EVIDENCE_SYSTEM,
    user: EVIDENCE_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1800,
  });
  const arr = Array.isArray(data) ? data : [];
  return arr.map((x)=>EvidenceHypothesisSchema.parse(x));
}
TS

cat > "$ROLES_DIR/perspectives.ts" <<'TS'
import { runLLMJson } from "../providers";
import { PERSPECTIVES_SYSTEM, PERSPECTIVES_USER } from "../prompts/perspectives";
import { PerspectivesSchema, type Perspectives } from "./shared_types";

export async function buildPerspectives(claimText: string, opts?:{timeoutMs?:number, model?:string}): Promise<Perspectives>{
  const { data } = await runLLMJson({
    system: PERSPECTIVES_SYSTEM,
    user: PERSPECTIVES_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1800,
  });
  return PerspectivesSchema.parse(data);
}
TS

cat > "$ROLES_DIR/editor_rater.ts" <<'TS'
import { runLLMJson } from "../providers";
import { RATER_SYSTEM, RATER_USER } from "../prompts/editor_rater";
import { ScoreSchema, type ScoreSet } from "./shared_types";

export async function rateDraft(claimText: string, opts?:{timeoutMs?:number, model?:string}): Promise<ScoreSet>{
  const { data } = await runLLMJson({
    system: RATER_SYSTEM,
    user: RATER_USER({ claim: claimText }),
    model: opts?.model ?? "gpt-4o-mini",
    timeoutMs: opts?.timeoutMs ?? 1600,
  });
  return ScoreSchema.parse(data);
}
TS

# 5) Orchestrator
cat > "$AI_DIR/orchestrator_claims.ts" <<'TS'
import { atomicize } from "./roles/atomicizer";
import { assignJurisdiction } from "./roles/assigner";
import { makeEvidenceHypotheses } from "./roles/evidence";
import { buildPerspectives } from "./roles/perspectives";
import { rateDraft } from "./roles/editor_rater";
import { OrchestrationResultSchema, type OrchestrationResult } from "./roles/shared_types";

async function withTimeout<T>(p:Promise<T>, ms:number, label:string): Promise<T>{
  return await Promise.race([
    p,
    new Promise<T>((_,rej)=>setTimeout(()=>rej(new Error(`timeout:${label}`)), ms))
  ]);
}

export async function orchestrateClaim(input: string, budget={ extractor:1500, normalizer:2500, assigner:2000, editor:3000, evidence:1800, rater:1600 }): Promise<OrchestrationResult>{
  const { claim, missing } = await withTimeout(atomicize(input,{timeoutMs:budget.normalizer}), budget.normalizer, "atomicizer");

  const needs = missing || (claim.zuständigkeit === "Unklar" ? "zuständigkeit" : null) || (!claim.zeitraum ? "zeitraum" : null);

  const [assign, perspectives, evidence] = await Promise.all([
    withTimeout(assignJurisdiction(claim.text,{timeoutMs:budget.assigner}), budget.assigner, "assigner").catch(()=>null),
    withTimeout(buildPerspectives(claim.text,{timeoutMs:budget.editor}), budget.editor, "perspectives").catch(()=>null),
    withTimeout(makeEvidenceHypotheses(claim.text,{timeoutMs:budget.evidence}), budget.evidence, "evidence").catch(()=>[]),
  ]);

  if (assign){
    (claim as any).zuständigkeit = assign.zuständigkeit;
    (claim as any).zuständigkeitsorgan = assign.zuständigkeitsorgan;
    (claim as any).thema_key = assign.thema_key;
  }

  const score = await withTimeout(rateDraft(claim.text,{timeoutMs:budget.rater}), budget.rater, "rater").catch(()=>({
    präzision:0.5, prüfbarkeit:0.5, relevanz:0.5, lesbarkeit:0.5, ausgewogenheit:0.5,
    begründung:{präzision:"timeout",prüfbarkeit:"timeout",relevanz:"timeout",lesbarkeit:"timeout",ausgewogenheit:"timeout"}
  } as any));

  const quality = {
    json_valid: true,
    atomization_complete: !needs,
    readability_b1_b2: claim.readability === "B1" || claim.readability === "B2",
    jurisdiction_present: claim.zuständigkeit !== "Unklar",
    evidence_present: (evidence?.length ?? 0) > 0,
  };

  const result = { claim, evidence: evidence||[], perspectives: perspectives||{pro:[],kontra:[],alternative:""}, score, quality };
  return OrchestrationResultSchema.parse(result);
}
TS

# 6) Composer „News → Vote“
cat > "$ANALYZE_DIR/composeVote.ts" <<'TS'
import type { AtomicClaim } from "../ai/roles/shared_types";

export type VoteTemplate = {
  frage: string;
  auswirkung: string;
  ebene: "EU"|"Bund"|"Land"|"Kommune"|"Unklar";
  beleg_hint: string;
};

export function composeVote(c: AtomicClaim): VoteTemplate{
  const frage = `Sollte ${c.sachverhalt} (Ebene: ${c.zuständigkeit}) umgesetzt werden?`;
  const auswirkung = `Betroffene: ${(c.betroffene||[]).slice(0,3).join(", ") || "Bürger:innen"}. Messgröße: ${c.messgröße}.`;
  const beleg_hint = `Basierend auf vorgeschlagenen Belegen (prüfen) zur Kennzahl "${c.messgröße}".`;
  return { frage, auswirkung, ebene: c.zuständigkeit, beleg_hint };
}
TS

# 7) Inline Single-Shot Clarify (UI)
cat > "$UI_DIR/InlineClarify.tsx" <<'TSX'
"use client";
import { useState } from "react";

type MissingKey = "zeitraum"|"zuständigkeit"|"ort";
export function InlineClarify({ missing, onResolve }:{ missing:MissingKey|null, onResolve:(k:MissingKey,val:any)=>void }){
  const [val, setVal] = useState("");
  if(!missing) return null;
  const label = missing === "zeitraum" ? "Zeitraum wählen (z. B. 2020–2024)" : missing === "zuständigkeit" ? "Ebene wählen" : "Ort";
  return (
    <div className="rounded-xl border p-3 text-sm">
      <div className="mb-2 font-medium">Uns fehlt: {label}</div>
      {missing==="zuständigkeit" ? (
        <div className="flex gap-2">
          {(["EU","Bund","Land","Kommune","Unsicher"] as const).map(l=>(
            <button key={l} className="rounded-lg border px-2 py-1" onClick={()=>onResolve("zuständigkeit", l)}>{l}</button>
          ))}
        </div>
      ) : (
        <input className="w-full rounded-lg border px-2 py-1" placeholder={label} value={val} onChange={e=>setVal(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") onResolve(missing, val); }} />
      )}
      <button className="mt-2 text-xs underline" onClick={()=>onResolve(missing, "Sonstiges")}>Sonstiges</button>
    </div>
  );
}
TSX

# 8) API Route patch: orchestrated MODE (idempotent)
if ! grep -q 'orchestrateClaim' "$API_ROUTE"; then
  # Import hinzufügen
  tmpfile="$(mktemp)"
  echo "→ Patche $API_ROUTE (Import + MODE=orchestrated)"
  awk 'NR==1{print "import { orchestrateClaim } from \"@/features/ai/orchestrator_claims\";"} {print}' "$API_ROUTE" > "$tmpfile" && mv "$tmpfile" "$API_ROUTE"
fi

# Guarded Insert: orchestrated-Zweig direkt nach MODE-Zeile
if ! grep -q 'stage:"orchestrated"' "$API_ROUTE"; then
  sed -i.bak '/VOG_ANALYZE_MODE/ a \
  \ \ \ \ if (MODE === "orchestrated") {\n\
  \ \ \ \ \ \ const out = await orchestrateClaim(text);\n\
  \ \ \ \ \ \ return NextResponse.json({ ok:true, stage:"orchestrated", ...out }, { status:200, headers: { "cache-control":"no-store" } });\n\
  \ \ \ \ }\n' "$API_ROUTE"
fi

# 9) .env Defaults (idempotent)
ENV_LOCAL="$ROOT/.env.local"
touch "$ENV_LOCAL"
grep -q '^VOG_ANALYZE_MODE=' "$ENV_LOCAL" || echo 'VOG_ANALYZE_MODE=orchestrated' >> "$ENV_LOCAL"
grep -q '^VOG_AI_PROVIDER=' "$ENV_LOCAL" || echo 'VOG_AI_PROVIDER=openai' >> "$ENV_LOCAL"
grep -q '^VOG_DEFAULT_MODEL=' "$ENV_LOCAL" || echo 'VOG_DEFAULT_MODEL=gpt-4o-mini' >> "$ENV_LOCAL"

echo "▶︎ Dateien geschrieben & Route gepatcht."

# 10) TypeScript & Build (best effort)
if command -v pnpm >/dev/null 2>&1; then
  echo "▶︎ pnpm install (falls nötig)"; pnpm install --prefer-offline || true
  echo "▶︎ TypeScript Check (apps/web)"; pnpm --filter @app/web exec tsc -v >/dev/null 2>&1 || true
  pnpm --filter @app/web exec tsc --noEmit || true
  echo "▶︎ Dev-Build (apps/web)"; pnpm --filter @app/web run build || true
else
  echo "⚠️ pnpm nicht gefunden – bitte selbst installieren/prüfen."
fi

echo "✅ Fertig. API unterstützt jetzt MODE=orchestrated (Parallel + Timeouts)."

import { NextRequest, NextResponse } from "next/server";
import { getAiRuntimePolicy, getAiRuntimeProfile } from "@features/ai/aiRuntimePolicy";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";

// ——— Simple LRU mit TTL, um Tippen-Spitzen abzupuffern ————————————————
type ClarifyReason =
  | "MISSING_PROVIDER_KEY"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_ERROR"
  | "BAD_JSON";
type ClarifySource = "llm" | "heuristic";
type ClarifyResponsePayload = {
  ok: true;
  cached?: boolean;
  tookMs: number;
  hints: any;
  source: ClarifySource;
  degraded: boolean;
  reason: ClarifyReason | null;
  providerAttempted: boolean;
  providerSucceeded: boolean;
  meta: { routeClassification: ReturnType<typeof resolveAiRouteClassification> };
};
type LlmRefineResult =
  | { ok: true; hints: any }
  | { ok: false; reason: ClarifyReason; attempted: boolean };

type CacheRec = { value:ClarifyResponsePayload; exp:number };
const LRU = new Map<string,CacheRec>();
const MAX=200, TTL=5*60*1000;
function getK(k:string){ const r = LRU.get(k); if(!r) return null; if(Date.now()>r.exp){ LRU.delete(k); return null; } return r.value; }
function setK(k:string,v:ClarifyResponsePayload){ if(LRU.size>MAX){ const first = LRU.keys().next().value; if(first) LRU.delete(first); } LRU.set(k,{value:v,exp:Date.now()+TTL}); }

// ——— Heuristiken: schneller, deterministischer „First Guess“ ————————————
function heuristic(text:string){
  const t = text.toLowerCase();
  const hints:any = { level:"unsicher", region:null, timeframe:"unsicher", audience:"unsicher", stance:"unsicher", other:{} };

  // Ebene/Zuständigkeit
  if(/\beu(ropa)?\b/.test(t) || /kommission|parlament\s+der\s+eu/i.test(text)) hints.level="eu";
  else if(/\bbund(es)?\b/.test(t) || /bundesregierung|bundestag/i.test(text)) hints.level="bund";
  else if(/\bland\b|\blandes\b|bayern|nrw|baden[-\s]?württemberg|sachsen|berlin/i.test(text)) hints.level="land";
  else if(/\bkommune\b|\bstadt\b|\bbezirk\b|\bgemeinde\b|\brathaus\b/i.test(text)) hints.level="kommune";

  // Region
  const mCity = text.match(/\b(Berlin|Hamburg|München|Köln|Frankfurt|Stuttgart|Dresden|Leipzig|Düsseldorf|Bremen|Essen)\b/i);
  if(mCity) hints.region = mCity[0];

  // Zeitraum
  if(/letzte(n|r)?\s+12\s*mon/i.test(t)) hints.timeframe="letzte_12m";
  else if(/letzte(n|r)?\s+5\s*jahr/i.test(t)) hints.timeframe="letzte_5y";
  else if(/seit\s*1990/i.test(t)) hints.timeframe="seit_1990";
  else if(/aktuell|derzeit|momentan/i.test(t)) hints.timeframe="aktuell";

  // Audience
  if(/jugend|schüler|student/i.test(t)) hints.audience="jugend";
  else if(/unternehmen|wirtschaft|betrieb/i.test(t)) hints.audience="unternehmen";
  else if(/amt|behörde|verwaltung|staat/i.test(t)) hints.audience="staat";
  else if(/rentner|senior/i.test(t)) hints.audience="senioren";

  // Haltung (naiv)
  if(/\bgegen\b|lehne|ablehne|keine?\s+steigerung|kritisch/i.test(t)) hints.stance="contra";
  else if(/\bfür\b|unterstütze|befürworte/i.test(t)) hints.stance="pro";
  else if(/\bneutral\b|abwägen|beide seiten/i.test(t)) hints.stance="neutral";

  return hints;
}

// ——— Mini-LLM (OpenAI) mit kurzer Deadline ————————————
async function llmRefine(text:string): Promise<LlmRefineResult> {
  const policy = getAiRuntimePolicy();
  const profile = getAiRuntimeProfile("qualityClarify", policy);
  const key = process.env.OPENAI_API_KEY?.trim() ?? "";
  const model = policy.openai.fastModel;
  if(!policy.openai.apiKeyPresent || !key) {
    return { ok: false, reason: "MISSING_PROVIDER_KEY", attempted: false };
  }

  const sys = [
    "Analysiere sehr schnell und antworte NUR als kompaktes JSON.",
    `Schema: {"hints":{"level":"eu|bund|land|kommune|unsicher","region":string|null,"timeframe":"aktuell|letzte_12m|letzte_5y|seit_1990|unsicher","audience":"jugend|unternehmen|staat|senioren|unsicher","stance":"pro|contra|neutral|unsicher"}}`
  ].join("\n");
  const body:any = {
    model,
    input: `Text:\n"""${text.slice(0,2000)}"""\nNur JSON.`,
    instructions: sys,
    max_output_tokens: profile.maxOutputTokens ?? policy.qualityClarifyMaxOutputTokens,
    text:{format:{type:"json_object"}},
  };

  const ctrl = AbortSignal.timeout(profile.timeoutMs);
  try {
    const r = await fetch("https://api.openai.com/v1/responses",{
      method:"POST", headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},
      body: JSON.stringify(body), signal: ctrl
    });
    if(!r.ok) {
      return {
        ok: false,
        reason: r.status === 408 || r.status === 504 || r.status === 524 ? "PROVIDER_TIMEOUT" : "PROVIDER_ERROR",
        attempted: true,
      };
    }
    const j = await r.json().catch(()=> ({}));
    try{
      const parsed = JSON.parse(j?.text ?? j?.output_text ?? "{}");
      if (parsed?.hints && typeof parsed.hints === "object") {
        return { ok: true, hints: parsed.hints };
      }
      return { ok: false, reason: "BAD_JSON", attempted: true };
    }catch{
      return { ok: false, reason: "BAD_JSON", attempted: true };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    return {
      ok: false,
      reason: /timeout|abort/.test(message) ? "PROVIDER_TIMEOUT" : "PROVIDER_ERROR",
      attempted: true,
    };
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req:NextRequest){
  const routeClassification = resolveAiRouteClassification("/api/quality/clarify");
  const t0=Date.now();
  const b = await req.json().catch(()=> ({}));
  const text = String(b?.text ?? "").trim();
  if(!text) {
    return NextResponse.json(
      {
        ok: true,
        tookMs: 0,
        hints: {},
        source: "heuristic",
        degraded: false,
        reason: null,
        providerAttempted: false,
        providerSucceeded: false,
        meta: { routeClassification },
      },
      {status:200},
    );
  }

  const ck = "clarify:"+text.slice(0,512);
  const cached = getK(ck);
  if(cached) {
    return NextResponse.json(
      { ...cached, cached:true, tookMs: 0, meta: { routeClassification } },
      {status:200},
    );
  }

  const base = heuristic(text);
  const refined = await llmRefine(text);
  let payload: ClarifyResponsePayload;
  if (refined.ok) {
    payload = {
      ok: true,
      tookMs: Date.now() - t0,
      hints: { ...base, ...refined.hints },
      source: "llm",
      degraded: false,
      reason: null,
      providerAttempted: true,
      providerSucceeded: true,
      meta: { routeClassification },
    };
  } else {
    const failed = refined as Extract<LlmRefineResult, { ok: false }>;
    payload = {
      ok: true,
      tookMs: Date.now() - t0,
      hints: base,
      source: "heuristic",
      degraded: failed.reason !== null,
      reason: failed.reason,
      providerAttempted: failed.attempted,
      providerSucceeded: false,
      meta: { routeClassification },
    };
  }
  setK(ck, payload);
  return NextResponse.json(payload, {status:200});
}

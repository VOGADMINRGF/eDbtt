import { loadPrompt } from "@features/contribution/utils/loadPrompt";
import safeJsonParse from "@core/utils/jsonRepair"; // alternativ: relativ importieren
import { validateImpact, validateAlternatives, validateFactcheck, Alternative } from "@core/utils/validation/promptSchemas";
import { callOpenAI } from "./providers/openai";
import { callAnthropic } from "./providers/anthropic";
import { callMistral } from "./providers/mistral";
import { callGemini } from "./providers/gemini";
import { Health, ProviderId } from "./health";
import { logEvent } from "./telemetry";

type TaskId = "impact_only" | "alternatives_only" | "factcheck_en" | "factcheck_de";
type Vars = Record<string, any>;
type Metric = { ok: number; fail: number; jsonOk: number; p95ms: number[]; state: "closed"|"open"|"half"; openedAt?: number };
const METRICS: Record<string, Metric> = {};

export function healthScore(id: string) {
  const m = METRICS[id] ?? { ok:0, fail:0, jsonOk:0, p95ms:[], state:"closed" } as Metric;
  const total = m.ok + m.fail || 1;
  const succ = m.ok / total;
  const json = m.jsonOk / Math.max(1, m.ok);
  const p95 = m.p95ms.length ? m.p95ms.sort((a,b)=>a-b)[Math.floor(m.p95ms.length*0.95)-1] : 2000;
  return succ*0.5 + json*0.3 + (p95<1500?0.2:p95<4000?0.1:0);
}

export function beforeCall(id: string) {
  const m = METRICS[id] ?? (METRICS[id] = { ok:0, fail:0, jsonOk:0, p95ms:[], state:"closed" });
  if (m.state === "open") {
    // 15s cooldown dann half-open (1 Probe)
    if (!m.openedAt || Date.now() - m.openedAt < 15000) throw new Error(`cb-open:${id}`);
    m.state = "half";
  }
}

export function afterCall(id: string, ms: number, ok: boolean, jsonValid: boolean) {
  const m = METRICS[id] ?? (METRICS[id] = { ok:0, fail:0, jsonOk:0, p95ms:[], state:"closed" });
  (ok ? m.ok++ : m.fail++); if (jsonValid) m.jsonOk++;
  m.p95ms.push(ms); if (m.p95ms.length > 100) m.p95ms.shift();
  if (!ok) {
    if (m.state === "half" || m.fail > 3) { m.state = "open"; m.openedAt = Date.now(); }
  } else if (m.state !== "closed") {
    // erfolgreiche Probe → schließen
    m.state = "closed"; m.openedAt = undefined;
  }
}

export function sortProvidersByHealth(entries: [string, any][]) {
  return entries
    .filter(([id, p]) => p.enabled?.())
    .sort((a,b)=> healthScore(b[0]) - healthScore(a[0]));
}

export type OrchestratorResult =
  | { ok: true; provider: ProviderId; task: TaskId; parsed: any; rawText: string; raw?: any; retries: number; timeMs: number }
  | { ok: false; task: TaskId; error: string; lastText?: string; lastProvider?: ProviderId };

const DEFAULT_PROVIDER_ORDER: ProviderId[] =
  (process.env.AI_PROVIDER_ORDER?.split(",").map(s => s.trim().toLowerCase() as ProviderId) ?? ["openai", "anthropic", "mistral", "gemini"])
  .filter(Boolean);

const PROVIDER_TIMEOUTS: Record<ProviderId, number> = {
  openai: Number(process.env.OPENAI_TIMEOUT_MS ?? 18000),
  anthropic: Number(process.env.ANTHROPIC_TIMEOUT_MS ?? 22000),
  mistral: Number(process.env.MISTRAL_TIMEOUT_MS ?? 18000),
  gemini: Number(process.env.GEMINI_TIMEOUT_MS ?? 18000),
};

// Budget guard: hard wall for a single orchestrated task
const BUDGET_MS = Number(process.env.AI_BUDGET_MS_DEFAULT ?? 35000);

const EXTRA_GUARD = `
CRITICAL: Re-emit the result as valid RFC8259 JSON only.
- No markdown, no code fences, no comments.
- Fix any syntax issues from previous attempt.
`;

// tiny templating
function renderVars(tpl: string, vars: Vars) {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (_, key) => {
    const val = key.split(".").reduce((acc: any, k: string) => (acc ? acc[k] : undefined), vars);
    if (val === undefined || val === null) return "";
    return typeof val === "string" || typeof val === "number" ? String(val) : JSON.stringify(val);
  });
}

async function injectPartials(text: string) {
  const partialRe = /\{\{\s*>\s*(_shared_constraints\.md)\s*\}\}/g;
  const matches = [...text.matchAll(partialRe)];
  let out = text;
  if (matches.length) {
    const partial = await loadPrompt("_shared_constraints");
    out = out.replace(partialRe, partial);
  }
  return out;
}

async function buildPrompt(task: TaskId, vars: Vars) {
  const nameMap: Record<TaskId, string> = {
    impact_only: "impact_only",
    alternatives_only: "alternatives_only",
    factcheck_en: "factcheck_only",
    factcheck_de: "factcheck_only_de",
  };
  let tpl = await loadPrompt(nameMap[task]);   // Loader nutzt core/prompts + Registry
  tpl = await injectPartials(tpl);
  return renderVars(tpl, vars);
}

async function callProvider(provider: ProviderId, prompt: string) {
  const t0 = Date.now();
  const before = Health.get(provider).state;
  Health.markProbeStart(provider);

  try {
    if (provider === "openai") {
      const __openaiRes = await callOpenAI(prompt, { timeoutMs: PROVIDER_TIMEOUTS.openai, forceJsonMode: true });
const text = typeof __openaiRes === "string" ? __openaiRes : ( (__openaiRes as any)?.text ?? "" );
const raw  = typeof __openaiRes === "string" ? __openaiRes : ( (__openaiRes as any)?.raw  ?? __openaiRes );
return { ok: true as const, provider, text, raw, latency: Date.now() - t0, stateBefore: before };
    }
    if (provider === "anthropic") {
      const { text, raw } = await callAnthropic(prompt, { timeoutMs: PROVIDER_TIMEOUTS.anthropic });
      return { ok: true as const, provider, text, raw, latency: Date.now() - t0, stateBefore: before };
    }
    if (provider === "mistral") {
      const { text, raw } = await callMistral(prompt, { timeoutMs: PROVIDER_TIMEOUTS.mistral });
      return { ok: true as const, provider, text, raw, latency: Date.now() - t0, stateBefore: before };
    }
    if (provider === "gemini") {
      const { text, raw } = await callGemini(prompt, { timeoutMs: PROVIDER_TIMEOUTS.gemini });
      return { ok: true as const, provider, text, raw, latency: Date.now() - t0, stateBefore: before };
    }
    throw new Error(`Unknown provider ${provider}`);
  } catch (e: any) {
    return { ok: false as const, provider, error: e?.message || String(e), latency: Date.now() - t0, stateBefore: before };
  }
}

function validateByTask(task: TaskId, text: string) {
  switch (task) {
    case "impact_only": return validateImpact(text);
    case "alternatives_only": return validateAlternatives(text);
    case "factcheck_en":
    case "factcheck_de": return validateFactcheck(text);
    default: throw new Error(`Unknown task ${task}`);
  }
}

async function tryOnce(task: TaskId, provider: ProviderId, prompt: string) {
  const r = await callProvider(provider, prompt);
  if (!r.ok) {
    Health.recordFailure(provider, r.latency, r.error?.includes("timeout") ? "timeout" : "unknown", r.error);
    await logEvent({
      ts: Date.now(), task, provider, success: false, retries: 0, latencyMs: r.latency,
      error: r.error, circuitBefore: r.stateBefore, circuitAfter: Health.get(provider).state
    });
    throw Object.assign(new Error(r.error), { provider, rawText: undefined });
  }

  const parseTry = safeJsonParse<any>(r.text);
  const jsonOk = parseTry.ok;

  if (!jsonOk) {
    Health.recordFailure(provider, r.latency, "json", "JSON parse failed");
    await logEvent({
      ts: Date.now(), task, provider, success: false, retries: 0, latencyMs: r.latency,
      error: "JSON parse failed", circuitBefore: r.stateBefore, circuitAfter: Health.get(provider).state
    });
    throw Object.assign(new Error("JSON parse failed"), { provider, rawText: r.text });
  }

  // Zod validation (throws on error)
  const parsed = validateByTask(task, r.text);

  Health.recordSuccess(provider, r.latency, true);
  await logEvent({
    ts: Date.now(), task, provider, success: true, retries: 0, latencyMs: r.latency,
    jsonOk: true, circuitBefore: r.stateBefore, circuitAfter: Health.get(provider).state
  });

  return { provider, parsed, rawText: r.text, raw: r.raw, latency: r.latency };
}

export async function runOrchestratedTask(
  task: TaskId,
  vars: Vars,
  opts?: { origin?: string; providers?: ProviderId[] }
): Promise<OrchestratorResult> {
  const origin = opts?.origin;
  const tStart = Date.now();
  const budgetEnd = tStart + BUDGET_MS;

  const baseOrder = (opts?.providers?.length ? opts.providers : DEFAULT_PROVIDER_ORDER).filter(Boolean);
  const dynamicOrder = Health.bestOrder(baseOrder);

  const basePrompt = await buildPrompt(task, vars);
  const guardPrompt = `${basePrompt}\n\n${EXTRA_GUARD}`;

  // pick two best eligible for hedge
  const hedgeCandidates = dynamicOrder.filter((p) => Health.canAttempt(p)).slice(0, 2);
  const rest = dynamicOrder.filter((p) => !hedgeCandidates.includes(p));

  // Budget guard: don’t even start if no time
  if (Date.now() >= budgetEnd) {
    return { ok: false, task, error: "Budget exceeded before execution." };
  }

  // Round 1: parallel hedge (each with one guard retry)
  if (hedgeCandidates.length > 0) {
    try {
      const result = await Promise.any(hedgeCandidates.map(async (p) => {
        // first attempt
        try {
          return await tryOnce(task, p, basePrompt);
        } catch {
          // second chance with guard
          return await tryOnce(task, p, guardPrompt);
        }
      }));
      return { ok: true, task, provider: result.provider, parsed: result.parsed, rawText: result.rawText, raw: result.raw, retries: 0, timeMs: Date.now() - tStart };
    } catch {
      // continue to sequential phase
    }
  }

  // Round 2: sequential over remaining (including hedgeCandidates again, in score order)
  const seq = hedgeCandidates.concat(rest);
  let lastText: string | undefined;
  let lastProvider: ProviderId | undefined;

  for (const p of seq) {
    if (Date.now() + 2000 >= budgetEnd) break; // leave a small buffer
    // attempt once
    try {
      const out = await tryOnce(task, p, basePrompt);
      return { ok: true, task, provider: p, parsed: out.parsed, rawText: out.rawText, raw: out.raw, retries: 0, timeMs: Date.now() - tStart };
    } catch (e1: any) {
      lastText = e1?.rawText; lastProvider = p;
      // guard retry
      try {
        const out2 = await tryOnce(task, p, guardPrompt);
        return { ok: true, task, provider: p, parsed: out2.parsed, rawText: out2.rawText, raw: out2.raw, retries: 1, timeMs: Date.now() - tStart };
      } catch (e2: any) {
        lastText = e2?.rawText; lastProvider = p;
        continue;
      }
    }
  }

  return { ok: false, task, error: "All providers failed or returned invalid JSON.", lastText, lastProvider };
}

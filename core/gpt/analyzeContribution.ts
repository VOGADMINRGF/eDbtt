// core/gpt/analyzeContribution.ts

import { parseAnalysisOrThrow } from "./parseAnalysisResponse";
import { AnyAnalysis } from "./schemas";

import { loadPrompt } from "@features/contribution/utils/loadPrompt";
import { providers } from "@features/utils/ai/askers";
import { cacheGet, cacheSet } from "@features/contribution/utils/cacheAIResponses";
import { beforeCall, afterCall, sortProvidersByHealth } from "@features/ai/orchestrator";

const FEATURE_AI_ARBITER = (process.env.FEATURE_AI_ARBITER ?? "true").toLowerCase() === "true";
const MAX_PROVIDERS = Number(process.env.AI_MAX_PROVIDERS ?? 3);
const ENABLE_CACHE = (process.env.FEATURE_TRANSLATION_CACHE ?? "true").toLowerCase() === "true";
const TEMPLATE_VER = process.env.PROMPT_VERSION || "v1";

type Mode = "impact" | "alternatives" | "factcheck";
type Locale = "de" | "en";

export async function analyzeContribution(input: {
  mode: Mode;
  content: string;
  locale?: Locale;
}): Promise<AnyAnalysis> {
  const locale = input.locale ?? "de";

  // 1) Prompt-Key (ohne .md)
  const promptKey =
    input.mode === "impact" ? "impact_only" :
    input.mode === "alternatives" ? "alternatives_only" :
    locale === "de" ? "factcheck_only_de" : "factcheck_only";

  const prompt = await loadPrompt(promptKey);

  // 2) Provider-Auswahl (Health-basiert, capped via MAX_PROVIDERS)
  const active = sortProvidersByHealth(Object.entries(providers));
  const limited = active.slice(0, Math.max(1, Math.min(MAX_PROVIDERS, active.length)));

  // 3) Parallel anfragen (Cache davor, Circuit/Health drumherum)
  const tasks = limited.map(async ([name, p]) => {
    const cacheKey = `analyze:${input.mode}:${locale}:${name}:${hash(`${TEMPLATE_VER}|${promptKey}|${input.content}`)}`;

    if (ENABLE_CACHE) {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        try { return parseAnalysisOrThrow(String(cached)); } catch { /* ignore broken cache */ }
      }
    }

    beforeCall(name);
    const t0 = Date.now();

    try {
      const raw = await p.ask({ prompt, content: input.content, mode: input.mode, locale });
      const parsed = parseAnalysisOrThrow(raw);

      afterCall(name, Date.now() - t0, true, true);
      if (ENABLE_CACHE) await cacheSet(cacheKey, raw, 60 * 60); // 1h TTL
      return parsed;
    } catch (e: any) {
      const jsonValid = /schema|json/i.test(String(e?.message || ""));
      afterCall(name, Date.now() - t0, false, jsonValid);
      throw e;
    }
  });

  const settled = await Promise.allSettled(tasks);
  const ok: AnyAnalysis[] = settled
    .filter((r): r is PromiseFulfilledResult<AnyAnalysis> => r.status === "fulfilled")
    .map((r) => r.value);

  if (ok.length === 0) {
    const reasons = settled.map(r => r.status === "rejected"
      ? (r.reason?.message ?? String(r.reason))
      : "invalid").join(" | ");
    throw new Error(`No provider returned a valid, schema-conforming result: ${reasons}`);
  }

  if (!FEATURE_AI_ARBITER || ok.length === 1) {
    return ok[0];
  }
  return consensusMerge(ok);
}

/** --- Helpers --- */

function hash(s: string): string {
  let h = 0; for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

function consensusMerge(list: AnyAnalysis[]): AnyAnalysis {
  const type = list[0].type;
  if (!list.every(x => x.type === type)) return list[0];

  if (type === "factcheck") {
    const items = mergeByKey(list.flatMap((r: any) => r.items), (it: any) => it.claim);
    return { type: "factcheck", summary: "Consensus fact-check across providers.", items } as AnyAnalysis;
  }

  if (type === "impact") {
    const items = mergeByKey(list.flatMap((r: any) => r.items), (it: any) => it.claim, (arr: any[]) => {
      const base = arr[0];
      const magnitude = mean(arr.map(a => a.magnitude ?? 0.5));
      const confidence = clamp01(mean(arr.map(a => a.confidence ?? 0.6)));
      const sources = dedupeSources(arr.flatMap(a => a.sources ?? []));
      return { ...base, magnitude, confidence, sources };
    });
    const overall = clamp01(mean(items.map((i: any) => i.confidence ?? 0.6)));
    return { type: "impact", summary: "Consensus impact synthesis.", items, overallConfidence: overall } as AnyAnalysis;
  }

  if (type === "alternatives") {
    const options = mergeByKey(list.flatMap((r: any) => r.options), (o: any) => o.title, (arr: any[]) => {
      const base = arr[0];
      const feasibility = modeOf(arr.map(a => a.feasibility));
      const expectedImpact = modeOf(arr.map(a => a.expectedImpact));
      const confidence = clamp01(mean(arr.map(a => a.confidence ?? 0.6)));
      const sources = dedupeSources(arr.flatMap(a => a.sources ?? []));
      return { ...base, feasibility, expectedImpact, confidence, sources };
    });
    return { type: "alternatives", summary: "Consensus alternatives.", options } as AnyAnalysis;
  }

  return list[0];
}

function mergeByKey(arr: any[], key: (x: any) => string, project?: (arr: any[]) => any) {
  const map = new Map<string, any[]>();
  for (const it of arr) {
    const k = key(it).trim().toLowerCase();
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return Array.from(map.values()).map(group => project ? project(group) : majorityFactcheck(group));
}

function majorityFactcheck(arr: any[]) {
  const verdicts = arr.map(a => a.verdict);
  const majority = modeOf(verdicts);
  const confidence = clamp01(mean(arr.map(a => a.confidence ?? 0.6)));
  const sources = dedupeSources(arr.flatMap(a => a.sources ?? []));
  return { ...arr[0], verdict: majority, confidence, sources };
}

function mean(ns: number[]) { return ns.reduce((s, n) => s + n, 0) / Math.max(1, ns.length); }
function modeOf<T>(arr: T[]): T { return arr.sort((a: any, b: any) => arr.filter(v => v === a).length - arr.filter(v => v === b).length).pop() as T; }
function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }
function dedupeSources(sources: any[]) {
  const seen = new Set<string>(); const out: any[] = [];
  for (const s of sources) {
    const k = (s.url || s.title || JSON.stringify(s)).toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(s); }
  }
  return out;
}

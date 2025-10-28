import { z } from "zod";
import { callOpenAI } from "@features/ai/providers/openai";

// Atomare Aussage (minimales, stabiles Schema – Felder kannst du später erweitern)
export const AtomicClaimZ = z.object({
  text: z.string().min(6).max(500),
  sachverhalt: z.string().nullable().optional(),
  zeitraum: z.string().nullable().optional(),
  ort: z.string().nullable().optional(),
  ebene: z.enum(["EU","Bund","Land","Kommune","Global"]).nullable().optional(),
  betroffene: z.array(z.string()).default([]),
  messgroesse: z.string().nullable().optional(),
  unsicherheiten: z.array(z.string()).default([]),
});

export type AtomicClaim = z.infer<typeof AtomicClaimZ>;

export type AtomicizeOpts = {
  maxClaims?: number;       // Hard-Cap
  timeoutMs?: number;       // Budget
  providerModel?: string;   // optional override
  jsonGuard?: boolean;      // JSON-Erzwingung (default true)
};

// Sehr kompakter Prompt – bewusst ohne Markdown, reines JSON
function buildPrompt(text: string, maxClaims: number) {
  return `
Zerlege den folgenden Text in maximal ${maxClaims} atomare Aussagen.
Jede Aussage passt in 1 Satz. Antworte als RFC8259-JSON:
{"claims":[{"text":"...","sachverhalt":null,"zeitraum":null,"ort":null,"ebene":null,"betroffene":[],"messgroesse":null,"unsicherheiten":[]}, ...]}

Text:
${text}
`.trim();
}

// Heuristik, falls LLM ausfällt (Punkt/Semikolon/Aufzählungen)
function heuristicSplit(text: string, maxClaims: number): AtomicClaim[] {
  const parts = text
    .split(/(?:\n|[\.\!\?;]|•|- |\u2022|\u2219)/g)
    .map(s => s.trim())
    .filter(s => s.length >= 6)
    .slice(0, maxClaims);

  return parts.map(s => ({ text: s, sachverhalt: null, zeitraum: null, ort: null, ebene: null, betroffene: [], messgroesse: null, unsicherheiten: [] }));
}

export async function atomicize(text: string, opts: AtomicizeOpts = {}) {
  const maxClaims = Math.max(1, Math.min(20, opts.maxClaims ?? 8));
  const prompt = buildPrompt(text, maxClaims);

  try {
    const { text: out } = await callOpenAI(prompt, {
      forceJsonMode: opts.jsonGuard ?? true,
      timeoutMs: opts.timeoutMs ?? 15000,
      model: opts.providerModel,
      maxOutputTokens: 900,
      system: "Emit only strict JSON. No markdown."
    });
    const parsed = JSON.parse(out || "{}");
    const claims = Array.isArray(parsed?.claims) ? parsed.claims : [];
    const clean = z.array(AtomicClaimZ).parse(claims);
    return { ok: true as const, claims: clean, source: "llm" as const };
  } catch {
    // Fallback: deterministic split
    return { ok: true as const, claims: heuristicSplit(text, maxClaims), source: "heuristic" as const };
  }
}

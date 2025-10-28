// features/ai/orchestrator.ts
import { callOpenAI } from "./providers/openai";

type ClaimOut = { ok: true; text: string; json?: any } | { ok: false; error: string };

export async function orchestrateClaim(text: string): Promise<ClaimOut> {
  const prompt = [
    "Gib NUR JSON zurück mit {\"ok\":true, \"claim\":{ \"text\":string }}.",
    "Wenn keine belastbare Aussage erkennbar ist, gib {\"ok\":false,\"error\":\"no-claim\"}.",
    "",
    "Text:",
    text
  ].join("\n");

  const { text: out } = await callOpenAI(prompt, { forceJsonMode: true, maxOutputTokens: 500, timeoutMs: 20000 });
  try {
    const j = JSON.parse(out || "{}");
    if (j?.ok) return { ok: true, text: j?.claim?.text ?? "" , json: j };
    return { ok: false, error: j?.error ?? "invalid-json" };
  } catch (e:any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// einfache Batch-Variante
export async function orchestrateClaimsV2(texts: string[]) {
  const res = await Promise.all(texts.map(t => orchestrateClaim(t)));
  return res;
}

// legacy Platzhalter, falls irgendwo noch importiert
export async function orchestrateClaimsLegacy(texts: string[]) {
  return orchestrateClaimsV2(texts);
}

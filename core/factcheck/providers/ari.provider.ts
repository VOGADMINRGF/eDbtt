import type { ProviderOutput } from "../types";
import { FACTCHECK_MODE } from "../policy.factcheck";
import { getDomain } from "../trust";

export async function runARI(claim: string, language?: string): Promise<ProviderOutput> {
  if (FACTCHECK_MODE !== "live") {
    const trueHint = /\b(daten|studie|bericht|offiziell|statistik|gesetz)\b/i.test(claim);
    const falseHint = /\b(gerücht|hörensagen|angeblich|man sagt)\b/i.test(claim);
    const verdict = trueHint ? "true" : falseHint ? "false" : "disputed";
    const confidence = trueHint || falseHint ? 0.88 : 0.72;
    const urls = ["https://example.org/report/123", "https://example.net/data/456"];
    const sources = await Promise.all(urls.map(async url => ({ url, domain: await getDomain(url) })));
    return { provider: "ARI", verdict, confidence, sources, raw: { mock: true }, costTokens: 1200 };
  }
  const url = process.env.ARI_API_URL!;
  const key = process.env.ARI_API_KEY!;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ text: claim, language })
  });
  if (!res.ok) throw new Error(`ARI failed: ${res.status}`);
  const data = await res.json();
  const sources = await Promise.all((data.sources ?? []).map(async (u: string) => ({ url: u, domain: await getDomain(u) })));
  return {
    provider: "ARI",
    verdict: data.verdict,
    confidence: data.confidence,
    sources,
    raw: data,
    costTokens: data.tokens ?? 0
  };
}

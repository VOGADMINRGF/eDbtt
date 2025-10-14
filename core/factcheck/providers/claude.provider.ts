import type { ProviderOutput } from "../types";
import { FACTCHECK_MODE } from "../policy.factcheck";
import { getDomain } from "../trust";

export async function runClaude(claim: string, language?: string): Promise<ProviderOutput> {
  if (FACTCHECK_MODE !== "live") {
    const verdict: ProviderOutput["verdict"] = /%|\d/.test(claim) ? "true" : "disputed";
    const confidence = /%|\d/.test(claim) ? 0.83 : 0.78;
    const urls = ["https://data.example.com/official/789"];
    const sources = [{ url: urls[0], domain: await getDomain(urls[0]) }];
    return { provider: "CLAUDE", verdict, confidence, sources, raw: { mock: true }, costTokens: 900 };
  }
  throw new Error("Claude live provider not configured.");
}

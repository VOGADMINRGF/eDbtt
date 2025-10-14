import type { ProviderOutput } from "../types";
import { FACTCHECK_MODE } from "../policy.factcheck";
import { getDomain } from "../trust";

export async function runMistral(claim: string, language?: string): Promise<ProviderOutput> {
  if (FACTCHECK_MODE !== "live") {
    const verdict: ProviderOutput["verdict"] = /angeblich|man sagt/i.test(claim) ? "false" : "disputed";
    const confidence = /angeblich|man sagt/i.test(claim) ? 0.82 : 0.76;
    const url = "https://open.example.org/library/abc";
    const sources = [{ url, domain: await getDomain(url) }];
    return { provider: "MISTRAL", verdict, confidence, sources, raw: { mock: true }, costTokens: 650 };
  }
  throw new Error("Mistral live provider not configured.");
}

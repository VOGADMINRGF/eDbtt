import type { AnyAnalysis } from "@core/gpt/schemas";
export type AnalyzeMode = "impact" | "alternatives" | "factcheck";

export async function analyzeContribution(req: {
  mode: AnalyzeMode; content: string; locale?: "de" | "en";
}): Promise<AnyAnalysis> {
  const res = await fetch("/api/ai/run", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`AI run failed (${res.status}): ${await res.text().catch(()=> "")}`);
  return (await res.json()) as AnyAnalysis;
}
export default analyzeContribution;

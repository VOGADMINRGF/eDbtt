# Consensus Ranking — JSON ONLY

Inputs:
- statements: {{statements}}            // merged candidate statements
- providers: {{providers}}              // e.g., ["gpt","claude","gemini","llama","mistral"]
- providerOutputs: {{providerOutputs}}  // map provider -> its list

Task:
1) Score each statement by: plausibility, societal relevance, and clarity (equal weights), normalized to 0–1.
2) Aggregate cross-provider agreement (support count/variance).
3) Highlight divergences (which providers disagree or omit) with short notes.

Output:
{
  "rankedStatements": [
    { "text": "...", "score": 0.00, "reasons": "..." }
  ],
  "divergences": [
    { "statement": "...", "providers": ["..."], "note": "..." }
  ],
  "summary": "..."
}

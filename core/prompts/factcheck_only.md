Return **valid RFC8259 JSON only**, no markdown, no prose.

Inputs:
- claims: {{claims}}              // list of strings to verify
- links: {{links}}                // allowed sources (objects with url,type)
- media: {{media}}                // optional media list
- context: {{content}}            // raw text/context

Output schema (exact keys):
{
  "locale": "en",
  "checks": [
    {
      "claim": "...",
      "verdict": "true|partly_true|unproven|false|misleading",
      "confidence": 0.0,
      "rationale": "...",
      "evidence": [
        { "quote": "...", "source": { "url": "...", "type": "Quelle|Info|Medien" } }
      ],
      "suggestedCorrection": ""
    }
  ],
  "notes": []
}

Rules:
- Use sources only from {{links}}. Do not invent new URLs.
- If no solid evidence: verdict="unproven", evidence=[], concise rationale.
- confidence ∈ [0,1].
- Keep JSON strictly parsable (no NaN/Infinity, no trailing commas).

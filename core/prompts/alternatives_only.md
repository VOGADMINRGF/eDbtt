Return a **valid RFC8259 JSON array** of the form:
[
  {"text":"...","type":"community|redaktion|ki","impact":"...","votes":{"agree":0,"neutral":0,"disagree":0}},
  ...
]

Context:
Title: {{title}}
Statement: {{statement}}
Category: {{category}}
Locale: {{locale}}

Rules:
- Output 3–5 meaningful decision options (include status quo).
- `type` must be one of: "community" | "redaktion" | "ki".
- `impact` concise (1–2 sentences).
- `votes` must include exactly `agree`, `neutral`, `disagree` (integers, default 0).
- No external links.
- JSON only.

# Gemini Contribution Analysis — JSON ONLY

Gemini guidance:
- Return minimal, valid JSON. No code blocks. No comments.
- Prefer shorter strings where possible to reduce verbosity.
- Avoid hallucinated URLs; only use {{links}} for `links`.


Inputs: {{content}}, {{userContext}}, {{links}}, {{media}}, MAX={{MAX_STATEMENTS}}

Output schema: (same as GPT; identical keys and enums)
{
  "statements":[{ "text":"...", "tags":["..."] }],
  "alternatives":[{ "text":"...", "type":"community|redaktion|ki" }],
  "facts":["..."],
  "topics":["..."],
  "level":"kommunal|regional|national|eu|global",
  "context":"...",
  "suggestions":["..."],
  "links":[{ "url":"...", "type":"Quelle|Info|Medien" }],
  "media":[{ "filename":"...", "type":"...", "mimeType":"...", "previewUrl":"..." }],
  "translations":{ "de":"...", "en":"..." }
}

{{> _shared_constraints.md }}

# Claude Contribution Analysis — JSON ONLY

Behavior tweaks for Claude:
- Be ultra-strict: output JSON only, no markdown fencing.
- Keep responses compact; avoid florid language.
- If uncertain, leave arrays empty rather than speculating.


Inputs: {{content}}, {{userContext}}, {{links}}, {{media}}, MAX={{MAX_STATEMENTS}}

Required JSON (exact keys):
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

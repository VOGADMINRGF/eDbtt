#!/usr/bin/env bash
set -euo pipefail

: "${OPENAI_API_KEY:?OPENAI_API_KEY fehlt}"
MODEL="${OPENAI_MODEL:-gpt-5-2025-08-07}"

echo "▶ GPT-5 Smoke: model=$MODEL"

node - <<'NODE'
const t0 = Date.now();
const MODEL = process.env.OPENAI_MODEL || "gpt-5-2025-08-07";
const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

(async () => {
  const prompt =
`Gib NUR gültiges JSON zurück (RFC8259), keine Erklärungen.
Schema: {"ok":true, "echo":"string", "ts": "iso8601"}.
Antwort:`;

  // Responses API – KEIN response_format, KEIN temperature
  const res = await client.responses.create({
    model: MODEL,
    input: prompt,
    text: { format: { type: "json_object" } }
  });

  // robuste Textextraktion
  let text = "";
  if (typeof res.text === "string" && res.text.trim()) text = res.text;
  if (!text && typeof res.output_text === "string" && res.output_text.trim()) text = res.output_text;
  if (!text && Array.isArray(res.output)) {
    const msg = res.output.find(o => o?.type === "message") || res.output[0];
    const parts = Array.isArray(msg?.content)
      ? msg.content.map(c => (typeof c?.text === "string" ? c.text : "")).filter(Boolean)
      : [];
    if (parts.length) text = parts.join("\n");
  }

  if (!text) {
    console.error("FAIL: Keine Textausgabe gefunden.");
    process.exit(1);
  }

  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) {
    console.error("FAIL: JSON parse:", e.message, "\n--- RAW ---\n", text);
    process.exit(1);
  }

  if (parsed && parsed.ok === true && typeof parsed.echo === "string") {
    const ms = Date.now() - t0;
    const usage = res?.usage || {};
    console.log("OK: GPT-5 antwortet mit gültigem JSON.");
    console.log("echo:", parsed.echo, "ts:", parsed.ts, "timeMs:", ms);
    console.log("tokens:", usage.total_tokens, "reasoning:", usage?.output_tokens_details?.reasoning_tokens || 0);
    process.exit(0);
  } else {
    console.error("FAIL: JSON hat nicht das erwartete Schema.\n", parsed);
    process.exit(1);
  }
})().catch(e => {
  console.error("FAIL:", e?.message || e);
  process.exit(1);
});
NODE

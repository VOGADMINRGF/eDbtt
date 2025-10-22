#!/usr/bin/env bash
set -euo pipefail

ROOT="apps/web"
FILES=(
  "$ROOT/src/features/analyze/analyzeContribution.ts"
  "features/analyze/analyzeContribution.ts"
  "core/gpt/analyzeContribution.ts"
  "$ROOT/src/lib/contribution/analyzeContribution.ts"
)

echo "🛠  Starte Patch (Responses API + ARI Fallback)…"

node - <<'NODE'
const fs = require('fs');
const path = require('path');

const files = [
  "apps/web/src/features/analyze/analyzeContribution.ts",
  "features/analyze/analyzeContribution.ts",
  "core/gpt/analyzeContribution.ts",
  "apps/web/src/lib/contribution/analyzeContribution.ts",
].filter(f => fs.existsSync(f));

if (files.length === 0) {
  console.log("⚠️  Keine Ziel-Datei gefunden (analyzeContribution.ts). Pfade prüfen.");
  process.exit(0);
}

function replaceAll(txt, re, repl) {
  const before = txt;
  const after = txt.replace(re, repl);
  return {txt: after, changed: before !== after};
}

function ensureImport(txt, what, from) {
  const re = new RegExp(`import\\s*\\{[^}]*\\b${what}\\b[^}]*\\}\\s*from\\s*["']${from}["']\\s*;`);
  if (re.test(txt)) return {txt, changed:false};
  // nach der ersten import-Zeile einfügen
  const m = txt.match(/import .*?;\s*\n/);
  if (m) {
    const idx = m.index + m[0].length;
    const ins = `import { ${what} } from "${from}";\n`;
    return {txt: txt.slice(0, idx) + ins + txt.slice(idx), changed:true};
  }
  // sonst ganz oben
  return {txt: `import { ${what} } from "${from}";\n` + txt, changed:true};
}

/** Responses API Patches: type => input_text, json mode => json_object, json-Hinweis im Prompt */
function patchResponsesAPI(txt) {
  let changed = false;

  // 1) { type: "text", text: ... }  ->  { type: "input_text", text: ... }
  let r = replaceAll(txt, /\{\s*type:\s*["']text["']\s*,\s*text:/g, '{ type: "input_text", text:');
  txt = r.txt; changed ||= r.changed;

  // 2) text: { format: "json" }  ->  text: { format: { type: "json_object" } }
  r = replaceAll(txt, /text:\s*\{\s*format:\s*["']json["']\s*\}/g, 'text: { format: { type: "json_object" } }');
  txt = r.txt; changed ||= r.changed;

  // 3) "json"-Wort im User-Input sicherstellen
  // Ersetze ... text: <EXPR>  mit ... text: "format: json\n\n" + <EXPR>, wenn noch nicht vorhanden
  r = replaceAll(
    txt,
    /(content:\s*\[\s*\{\s*type:\s*"input_text"\s*,\s*text:\s*)(?!["']format:\s*json)/g,
    '$1"format: json\\n\\n" + '
  );
  txt = r.txt; changed ||= r.changed;

  return {txt, changed};
}

/** ARI-Fallback direkt in analyzeContribution einbauen */
function patchAriFallback(txt) {
  let changed = false;

  // Import einfügen
  let r = ensureImport(txt, 'queryAri', '@core/ari/ariClient');
  txt = r.txt; changed ||= r.changed;

  // Funktion finden
  const fnRe = /export\s+async\s+function\s+analyzeContribution\s*\(\s*text\s*:\s*string\s*\)\s*:\s*Promise<[^>]+>\s*\{/m;
  const m = txt.match(fnRe);
  if (!m) return {txt, changed};

  // Wir ersetzen den gesamten Funktionsblock bis zur schließenden Klammer auf gleicher Ebene.
  const start = m.index + m[0].length;
  // Klammer-Balancierung
  let i = start, depth = 1;
  while (i < txt.length && depth > 0) {
    const ch = txt[i++];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  if (depth !== 0) return {txt, changed};

  const end = i; // Position NACH der schließenden Klammer
  const head = txt.slice(0, m.index);
  const sig = txt.slice(m.index, start); // includes '{' already consumed in start
  const tail = txt.slice(end);

  const newBody = `
  // ===== ARI-Fallback-Version =====
  const model = process.env.OPENAI_MODEL || "gpt-5-pro";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");

  async function runGPT(): Promise<AnalyzeResult> {
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: \`Bearer \${apiKey}\` },
      body: JSON.stringify({
        model,
        reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || "medium" },
        input: [
          { role: "system", content: [{ type: "input_text", text: buildSystemPrompt() }] },
          { role: "user",   content: [{ type: "input_text", text: "format: json\\n\\n" + text.slice(0, 8000) }] },
        ],
        text: { format: { type: "json_object" } },
        max_output_tokens: 1500,
      }),
    });
    const full = await res.json();
    if (!res.ok) throw new Error(\`OpenAI \${res.status} – \${JSON.stringify(full)}\`);
    const content = String(full.output_text ?? "").trim();
    let parsed: any; try { parsed = JSON.parse(content); } catch { parsed = null; }
    let out = coerceToAnalyzeResult(parsed, text);
    (out as any)._meta = { mode: "gpt" };
    return out;
  }

  async function runARI(gptErr: unknown): Promise<AnalyzeResult> {
    const prompt = buildSystemPrompt()
      + "\\n\\nTEXT:\\n" + text.slice(0,8000)
      + "\\n\\nAntworte NUR mit JSON.";
    const raw: any = await queryAri({ query: prompt, sources: [], format: "json" });
    let parsed: any; try { parsed = typeof raw === "string" ? JSON.parse(raw) : raw; } catch { parsed = null; }
    let out = coerceToAnalyzeResult(parsed, text);
    (out as any)._meta = { mode: "ari", gptError: String((gptErr as any)?.message || gptErr) };
    return out;
  }

  try {
    return await runGPT();
  } catch (e1) {
    try {
      return await runARI(e1);
    } catch (e2) {
      const out = coerceToAnalyzeResult(null, text);
      (out as any)._meta = { mode: "fallback", gptError: String((e1 as any)?.message || e1), ariError: String((e2 as any)?.message || e2) };
      return out;
    }
  }
`; // end body

  const patched = head + sig + newBody + '}\n' + tail;
  if (patched !== txt) { txt = patched; changed = true; }

  return {txt, changed};
}

for (const f of files) {
  let txt = fs.readFileSync(f, 'utf8');
  let any = false;

  let r = patchResponsesAPI(txt); txt = r.txt; any ||= r.changed;
  r = patchAriFallback(txt);      txt = r.txt; any ||= r.changed;

  if (any) {
    fs.writeFileSync(f, txt, 'utf8');
    console.log("✅ Patched:", f);
  } else {
    console.log("ℹ️  Unverändert:", f);
  }
}

NODE

echo "✅ Done. Jetzt dev neu starten."
echo "   pnpm --filter @vog/web dev"

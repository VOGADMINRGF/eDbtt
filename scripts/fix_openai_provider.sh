#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
echo "🔧 Fix OpenAI provider (nullish mixing + json mode) – root: $ROOT"

node - <<'NODE'
const fs = require('fs');

function patchFile(file, transform) {
  if (!fs.existsSync(file)) { console.log("• skip (not found):", file); return; }
  let src = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const before = src;
  src = transform(src);
  if (src !== before) {
    fs.writeFileSync(file + '.bak', before); // backup
    fs.writeFileSync(file, src);
    console.log("✓ patched:", file);
  } else {
    console.log("• no changes:", file);
  }
}

/**
 * 1) features/ai/providers/openai.ts
 *    - behebt "Nullish coalescing operator(??) requires parens..."
 *    - optional: response_format → text.format
 */
patchFile('features/ai/providers/openai.ts', (s) => {
  // Responses-API: falls noch vorhanden → response_format in text.format überführen
  s = s.replace(/body\.response_format\s*=\s*{[^}]*}\s*;?/g,
                'body.text = { format: { type: "json_object" } };');

  // Temperatur bei Responses-Calls entfernen (harmlos, falls nicht vorhanden)
  s = s.replace(/,\s*temperature\s*:\s*0\b/g, '');

  // Problematische Zuweisung ersetzen:
  // const text: string = data.output_text ?? ( ... ) || "";
  // → robuste, gut geklammerte Variante ohne ??-Mix
  s = s.replace(
    /const\s+text\s*:\s*string\s*=\s*data\.output_text\s*\?\?[\s\S]*?\|\|\s*""\s*;/m,
`const text: string =
  (typeof data?.output_text === "string" && data.output_text)
    ? data.output_text
    : (
        (Array.isArray(data?.output) &&
         Array.isArray(data.output[0]?.content) &&
         // nimm "text" Feld aus erstem Content-Item, sonst leere Zeichenkette
         (data.output[0].content.find?.((c:any)=>c?.text)?.text ?? data.output[0].content[0]?.text)
        ) || ""
      );`
  );

  return s;
});

/**
 * 2) features/ai/providers.ts
 *    - response_format → text.format (optional, aber empfohlen)
 *    - Temperatur entfernen
 */
patchFile('features/ai/providers.ts', (s) => {
  s = s.replace(/response_format\s*:\s*{[^}]*}/g, 'text: { format: { type: "json_object" } }');
  s = s.replace(/,\s*temperature\s*:\s*0\b/g, '');
  return s;
});
NODE

echo "✅ Done. Backups wurden als .bak angelegt."
echo "👉 Starte den Dev-Server neu (oder warte auf HMR), z.B.:"
echo "   rm -rf apps/web/.next && pnpm --filter @vog/web dev"

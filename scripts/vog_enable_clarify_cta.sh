#!/usr/bin/env bash
set -euo pipefail

say(){ printf "\033[1;36m%s\033[0m\n" "$*"; }

ROOT="$(pwd)"
FILE="$ROOT/features/analyze/analyzeContribution.ts"

if [ ! -f "$FILE" ]; then
  echo "❌ Datei nicht gefunden: $FILE"
  exit 1
fi

say "🔧 Patche $FILE (GPT-Prompt + serverseitige CTA/Clarifying Fallbacks)…"

node - <<'NODE'
const fs = require('fs');
const path = require('path');
const file = path.resolve('features/analyze/analyzeContribution.ts');
let t = fs.readFileSync(file, 'utf8');

// 1) Utility: Inject oder ersetzen buildGptPrompt()
if(!/function\s+buildGptPrompt\s*\(/.test(t)){
  t = t.replace(
    /(\nexport\s+async\s+function\s+analyzeContribution\s*\()/,
`
// --- injected: robust prompt builder (claim-splitting + clarifying) ---
function buildGptPrompt(text: string, maxClaims: number, context: any){
  const ctx = JSON.stringify(context ?? {}, null, 2);
  return \`
Du bist ein politischer Textanalyst. Antworte NUR mit **RFC8259-konformem JSON** (keine Erklärungen, kein Markdown).

Ziel:
- Erkenne Thema & Teilthemen.
- Erzeuge präzise Claims. Allgemeine Aussagen (z. B. "gegen Preiserhöhungen") musst du in **präzisere Unteraussagen** aufteilen.
- Liefere **max \${Math.max(3, maxClaims||5)} Claims**.
- Erzeuge **clarifyingQuestions** (max 3) bei unklaren, zu breiten oder mehrdeutigen Aussagen.
- Wenn clarifyingQuestions existieren, liefere **cta** mit "title" und "buttons" (Label kurz, 3–6 Stück).
- Verwende deutsche Kategorien.

Mini-Taxonomie für Preise (nur wenn relevant):
- Energie (Strom, Gas, Fernwärme)
- Wohnen (Mieten, Nebenkosten)
- Lebensmittel
- ÖPNV/Verkehr
- Gebühren/Steuern

Schema (Schlüssel genau einhalten):
{
  "language": "de",
  "mainTopic": string|null,
  "subTopics": string[],
  "regionHint": string|null,
  "claims": [
    {
      "text": string,
      "categoryMain": string|null,
      "categorySubs": string[],
      "region": string|null,
      "authority": string|null,
      "canon": string, 
      "scoreHints": {
        "baseWeight": number,
        "reasons": string[]
      }
    }
  ],
  "clarifyingQuestions": string[],
  "cta": {
    "title": string,
    "buttons": [{ "label": string, "value": string }]
  },
  "news": [],
  "scoreHints": { "baseWeight": number, "reasons": string[] },
  "_meta": { "mode": "gpt" }
}

Kontext (optional, kann leer sein):
\${ctx}

Text:
\${text}

WICHTIG:
- Nur JSON, keine Kommentare, kein Markdown.
- Zahlen als Zahl, nicht als String.
- "canon" = slugifizierte Kurzform von "text".
- "scoreHints.baseWeight" in [1..2] je nach Spezifizität & Quellen.
  \`;
}
$1`
  );
}

// 2) Stelle sicher, dass callOpenAIJson mit buildGptPrompt() aufgerufen wird
t = t.replace(
  /callOpenAIJson\(\s*gptPrompt\(\s*text\s*,\s*[^)]*\)\s*\)/g,
  'callOpenAIJson(buildGptPrompt(text, Math.max(5, (maxClaims||3)+2), ctx))'
);

// Falls gptPrompt woanders genutzt wurde, ersetze konservativ:
t = t.replace(
  /callOpenAIJson\(\s*[^)]*\)/g,
  (m)=> m.includes('buildGptPrompt(') ? m : m.replace(/callOpenAIJson\(\s*([^)]*)\)/, 'callOpenAIJson(buildGptPrompt(text, Math.max(5, (maxClaims||3)+2), ctx))')
);

// 3) Nach dem GPT-Ergebnis: serverseitige Fallbacks für klarere Claims & CTA
// Wir hängen am Ende der Funktion analyzeContribution eine Normalisierung an.
// Suchen grob nach der Stelle, wo "result" zusammengesetzt/retourniert wird.
if(!/function\s+_normalizeClarifyingAndCta\s*\(/.test(t)){
  t = t.replace(
    /(\nexport\s+async\s+function\s+analyzeContribution\s*\([^\)]*\)\s*{)/,
`$1
  const ctx = (arguments[0]?.context ?? arguments[0]?.opts?.context ?? {});
`
  );

  // Hilfsfunktionen einschleusen
  t += `

/** slugify canon */
function _slug(s:string){return String(s||"").toLowerCase()
  .normalize("NFKD").replace(/[\\u0300-\\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}

/** heuristik: allgemeine preis-aussage? */
function _isGenericPriceStatement(s:string){
  if(!s) return false;
  const x = s.toLowerCase();
  return /(preis|preiserhöhungen|preise|teurer|teuerung)/.test(x) && x.length < 120;
}

/** fallback-splitting für allgemeine preis-aussage */
function _splitGenericPriceClaim(txt:string){
  const base = (k:string, subs:string[])=>({
    text: k,
    categoryMain: "Wirtschaft",
    categorySubs: subs,
    region: null,
    authority: "Ich",
    canon: _slug(k),
    scoreHints: { baseWeight: 1.2, reasons: ["präzisiert aus allgemeiner Aussage"] }
  });
  return [
    base("Ich bin gegen weitere Erhöhungen bei Energiepreisen.", ["Preispolitik","Energie"]),
    base("Ich bin gegen weitere Mieterhöhungen und höhere Nebenkosten.", ["Preispolitik","Wohnen"]),
    base("Ich bin gegen weitere Preiserhöhungen bei Lebensmitteln.", ["Preispolitik","Lebensmittel"]),
    base("Ich bin gegen teurere ÖPNV-Tickets.", ["Preispolitik","ÖPNV"]),
    base("Ich bin gegen höhere staatliche Gebühren/Steuern.", ["Preispolitik","Gebühren/Steuern"]),
  ];
}

/** serverseitige Normalisierung: clarifying + CTA erzwingen, wenn sinnvoll */
function _normalizeClarifyingAndCta(out:any){
  out = out || {};
  out.clarifyingQuestions = Array.isArray(out.clarifyingQuestions) ? out.clarifyingQuestions : [];

  // 1) Claim-Splitting, wenn nur 1 sehr allgemeiner Claim
  if(Array.isArray(out.claims) && out.claims.length === 1){
    const c = out.claims[0]?.text || "";
    if(_isGenericPriceStatement(c)){
      out.claims = _splitGenericPriceClaim(c).slice(0,5);
      // Klarfragen setzen
      out.clarifyingQuestions = [
        "Meinst du Energie, Wohnen, Lebensmittel, ÖPNV oder Gebühren/Steuern?",
        "Geht es um NRW, ganz Deutschland oder deine Kommune?",
        "Sind staatliche Abgaben oder Marktpreise gemeint?"
      ];
    }
  }

  // 2) CTA generieren, wenn es Klarfragen gibt und keine CTA vorhanden ist
  if(out.clarifyingQuestions.length && (!out.cta || !Array.isArray(out.cta?.buttons))){
    const buttons = [];
    const q = out.clarifyingQuestions[0] || "Bitte wähle aus:";
    // Buttons aus erster Frage ableiten
    ["Energie","Wohnen","Lebensmittel","ÖPNV","Gebühren/Steuern"].forEach(v=>{
      buttons.push({ label: v, value: "refine:"+v });
    });
    out.cta = {
      title: "Was genau meinst du?",
      buttons
    };
  }

  // 3) ScoreHints an der Wurzel, falls nicht vorhanden
  if(!out.scoreHints){
    out.scoreHints = { baseWeight: 1.3, reasons: ["Standardgewichtung – Fallback"] };
  }

  // 4) Meta markieren
  out._meta = Object.assign({}, out._meta || {}, { mode: out._meta?.mode || "gpt" });
  return out;
}
`;
}

// 4) Dort wo das Ergebnis zurückgegeben wird, vor return normalisieren.
// Fangen eine typische Rückgabe-Variable ab (z. B. result / analysis / out)
t = t.replace(
  /return\s+NextResponse\.json\(\s*([^)]+)\s*\);/g,
  (m,grp)=> {
    const varName = grp.trim();
    // Falls bereits normalisiert, nichts tun
    if (new RegExp(`_normalizeClarifyingAndCta\\(${varName}\\)`).test(t)) return m;
    return `return NextResponse.json(_normalizeClarifyingAndCta(${varName}));`
  }
);

// 5) Falls die Funktion nicht über NextResponse.json returned, versuchen wir generisch:
t = t.replace(
  /return\s+(\{[\s\S]*?\});\s*$/m,
  (m, obj) => {
    if (/_normalizeClarifyingAndCta\(/.test(m)) return m;
    return `return _normalizeClarifyingAndCta(${obj});`
  }
);

fs.writeFileSync(file, t, 'utf8');
console.log("✅ analyzeContribution.ts gepatcht.");
NODE

say "✅ Fertig. Starte den Dev-Server ggf. neu:"
echo "   pnpm --filter @vog/web dev"

#!/usr/bin/env bash
set -euo pipefail
say(){ printf "\033[1;36m%s\033[0m\n" "$*"; }

ROOT="$(pwd)"
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
ANFILE="$ROOT/features/analyze/analyzeContribution.ts"
ORCH="$ROOT/features/ai/orchestrator.ts"

[ -f "$ROUTE" ] || { echo "❌ fehlt: $ROUTE"; exit 1; }
[ -f "$ANFILE" ] || { echo "❌ fehlt: $ANFILE"; exit 1; }

say "1) API-Route patched: origin-path -> context.ui.route"
node - <<'NODE'
const fs = require('fs'), p=require('path');
const f = p.resolve('apps/web/src/app/api/contributions/analyze/route.ts');
let t = fs.readFileSync(f,'utf8');

if(!/x-origin-path/i.test(t)){
  t = t.replace(
    /(const\s+body\s*=\s*await\s+req\.json\(\)\.catch\(\(\)\s*=>\s*\(\{\}\)\);\s*[\r\n]+)/,
`$1  const originPath = req.headers.get('x-origin-path') || null;
  const ctxFromBody = (body?.context ?? {});
  const mergedContext = { ...ctxFromBody, ui: { ...(ctxFromBody.ui||{}), route: originPath } };
`
  );
  t = t.replace(
    /const\s*\{\s*text,\s*maxClaims,\s*model,\s*forceFallback,\s*context\s*\}\s*=\s*body\s*\?\?\s*\{\};/,
    `const { text, maxClaims, model, forceFallback } = body ?? {};
  const context = mergedContext;`
  );
}
fs.writeFileSync(f,t,'utf8'); console.log("✅ route.ts aktualisiert");
NODE

say "2) analyzeContribution.ts: nur-/contributions/new, Klarfragen/CTA, Alternativen ohne Fantasie, Orchestrator-Hooks"
node - <<'NODE'
const fs = require('fs'), p=require('path');
const f = p.resolve('features/analyze/analyzeContribution.ts');
let t = fs.readFileSync(f,'utf8');

// Import Orchestrator falls nicht vorhanden
if(!/from\s+"@?features\/ai\/orchestrator"/.test(t)){
  t = t.replace(/^(import[^\n]*\n)+/,(m)=>{
    return m + `import { runOrchestratedTask } from "@features/ai/orchestrator";\n`;
  });
}

// ctx greifbar machen am Anfang der Funktion
t = t.replace(
  /(export\s+async\s+function\s+analyzeContribution\s*\([^\)]*\)\s*\{\s*)/,
  `$1  const ctx = (arguments[1]?.context ?? arguments[0]?.context ?? {});\n`
);

// Gating + Helfer einfügen, falls nicht vorhanden
if(!/_isNewRoute\(/.test(t)){
  t += `

function _isNewRoute(ctx:any){
  const r = ctx?.ui?.route || "";
  return typeof r === "string" && r.startsWith("/contributions/new");
}
function _slug(s:string){return String(s||"").toLowerCase()
  .normalize("NFKD").replace(/[\\u0300-\\u036f]/g,"")
  .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");}
function _tok(s:string){return String(s||"").toLowerCase().split(/[^\\p{L}0-9]+/u).filter(w=>w.length>2);}
function _overlap(a:string,b:string){const A=new Set(_tok(a)),B=new Set(_tok(b)); let c=0; A.forEach(x=>{if(B.has(x))c++}); return c;}
function _containsAny(s:string, words:string[]){const S=String(s||"").toLowerCase(); return words.some(w=>S.includes(w));}

function _deriveDomainFromText(text:string){
  const s = String(text||"").toLowerCase();
  if(/preis/.test(s)) return "preise";
  if(/wind|windkraft/.test(s)) return "windkraft";
  return null;
}

// Alternativen nur, wenn aus Text/Context ableitbar:
function _alternativesFor(text:string, ctx:any, claims:any[]){
  const alts:any[] = [];
  const s = String(text||"").toLowerCase();

  // Preise -> nur themennahe Optionen (keine Fantasie)
  if(/preis|teuer/.test(s)){
    alts.push(
      { text:"Fokus auf Energiepreise statt pauschal", kind:"narrower", requires:["preis","energie"] },
      { text:"Fokus auf Mieten/Nebenkosten", kind:"narrower", requires:["miet","wohn"] },
      { text:"Fokus auf Lebensmittelpreise", kind:"narrower", requires:["lebensmittel","nahr"] },
      { text:"ÖPNV-Preise statt genereller Preise", kind:"narrower", requires:["öpnv","ticket","verkehr"] },
      { text:"Gebühren/Abgaben prüfen statt Marktpreise", kind:"policy", requires:["gebühr","abgabe","steuer"] }
    );
  }

  // Windkraft vs. Wald -> nur anbieten, wenn Text die Domäne streift
  if(/wind|windkraft|erneuerbar/.test(s)){
    const waldRef = /wald|rodung|forst/.test(s);
    alts.push(
      { text:"Windkraft-Ausbau nur ohne zusätzliche Waldrodungen", kind:"constraint", requires: waldRef?[]:["wind"] },
      { text:"Repowering bestehender Anlagen vor Neuflächen", kind:"policy", requires:["wind"] },
      { text:"Vorrang Konversions-/Gewerbeflächen statt Wald", kind:"siting", requires:["wind"] },
      { text:"Strengere Artenschutzauflagen an Hotspots", kind:"constraint", requires:["wind"] }
    );
  }

  // Filter: nur Alternativen behalten, die sich aus Text ableiten lassen
  return alts.filter(a=>{
    if(!a.requires || a.requires.length===0) return true;
    return a.requires.some(k=>s.includes(k));
  });
}

// CTA/Klarfragen-Normalisierung – NUR unter /contributions/new.
// Ersetzt KEINE Claims; fragt nach, wenn Aussage zu vage ist.
function _normalizeForNew(out:any, text:string, ctx:any){
  const allow = _isNewRoute(ctx);
  if(!allow) {
    // außerhalb: nichts forcieren
    if(out) { delete out.cta; out.clarifyingQuestions = []; }
    return out;
  }

  out = out || {};
  out.clarifyingQuestions = Array.isArray(out.clarifyingQuestions) ? out.clarifyingQuestions : [];

  // vage Preis-Aussage?
  const vaguePrice = /preis|preiserhöhungen|teuer/.test(String(text||"").toLowerCase()) &&
                     (Array.isArray(out.claims) ? out.claims.length <= 1 : true);

  if(vaguePrice){
    if(!out.clarifyingQuestions.length){
      out.clarifyingQuestions = [
        "Meinst du Energie, Wohnen, Lebensmittel, ÖPNV oder Gebühren/Steuern?",
        "Geht es um deine Kommune/NRW oder bundesweit?",
        "Sind staatliche Abgaben oder Marktpreise gemeint?"
      ];
    }
    if(!out.cta || !Array.isArray(out.cta?.buttons)){
      out.cta = {
        title: "Bitte präzisieren:",
        buttons: ["Energie","Wohnen","Lebensmittel","ÖPNV","Gebühren/Steuern"]
          .map(v=>({ label: v, value: "refine:"+v }))
      };
    }
  }

  // Alternativen nur wenn aus Text ableitbar:
  const alts = _alternativesFor(text, ctx, out.claims||[]);
  if(alts.length){
    out.alternatives = alts.map(a=>({ text:a.text, kind:a.kind }));
  }

  // Orchestrator (alternatives_only / factcheck_de) NUR hier anwerfen, wenn vorhanden
  out._meta = out._meta || {};
  out._meta.orchestrated = out._meta.orchestrated || {};
  out._meta.orchestrated.triggered = true;

  return out;
}
`;
}

// Ergebnis vor Rückgabe normalisieren (nur unter /contributions/new)
t = t.replace(
  /return\s+NextResponse\.json\(\s*([^)]+)\s*\);/g,
  (m,inside)=>`return NextResponse.json(_normalizeForNew(${inside}, text, ctx));`
);

// Wenn es einen nackten "return { ... }" am Ende gibt, ebenfalls normalisieren
t = t.replace(/return\s+(\{[\s\S]*?\});\s*$/m, (m,obj)=>`return _normalizeForNew(${obj}, text, ctx);`);

fs.writeFileSync(f,t,'utf8');
console.log("✅ analyzeContribution.ts aktualisiert");
NODE

say "Optional: Devtools-404 unterdrücken"
mkdir -p apps/web/public/.well-known/appspecific >/dev/null 2>&1 || true
echo '{}' > apps/web/public/.well-known/appspecific/com.chrome.devtools.json

say "Done. Starte den Web-Dev neu:"
echo "pnpm --filter @vog/web dev"

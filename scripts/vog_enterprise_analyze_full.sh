#!/usr/bin/env bash
set -euo pipefail
say(){ printf "\033[1;36m%s\033[0m\n" "$*"; }

ROOT="$(pwd)"
ROUTE="$ROOT/apps/web/src/app/api/contributions/analyze/route.ts"
OPENAI_PROV="$ROOT/features/ai/providers/openai.ts"

[ -f "$ROUTE" ] || { echo "❌ fehlt: $ROUTE"; exit 1; }

# 0) Devtools-404 entschärfen (harmlos, aber nervt im Log)
mkdir -p "$ROOT/apps/web/public/.well-known/appspecific" || true
echo '{}' > "$ROOT/apps/web/public/.well-known/appspecific/com.chrome.devtools.json"

# 1) OpenAI Provider auf Responses API harm­los trimmen (ohne response_format/temperature)
say "1) Patch: features/ai/providers/openai.ts → Responses API clean"
cat > "$OPENAI_PROV" <<'TS'
// features/ai/providers/openai.ts
import OpenAI from "openai";
export type OpenAIOptions = { timeoutMs?: number; forceJsonMode?: boolean; system?: string };

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function callOpenAI(prompt: string, opts: OpenAIOptions = {}): Promise<{ text: string; raw: any }> {
  const model = process.env.OPENAI_MODEL || "gpt-5.0-mini";
  const body: any = {
    model,
    input: prompt,
    // KEIN temperature / KEIN response_format!
    // JSON-Ausgabe via Responses API:
    text: opts.forceJsonMode ? { format: { type: "json_object" } } : undefined,
  };

  const res = await client.responses.create(body, { timeout: opts.timeoutMs ?? Number(process.env.OPENAI_TIMEOUT_MS ?? 18000) });
  const data: any = res;

  let text = "";
  if (typeof data.output_text === "string" && data.output_text) {
    text = data.output_text;
  } else if (Array.isArray(data.output)) {
    const parts = data.output
      .flatMap((it: any) => Array.isArray(it?.content) ? it.content : [])
      .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
      .filter(Boolean);
    if (parts.length) text = parts.join("\n");
  }
  return { text: text || "", raw: data };
}

export async function callOpenAIJson(prompt: string, maxOutputTokens = 1200) {
  // maxOutputTokens wird bei Responses ggf. ignoriert – ok.
  const { text, raw } = await callOpenAI(prompt, { forceJsonMode: true });
  return { text, raw };
}
TS

# 2) response_format → text.format in RUNTIME-Dateien (keine Skripte), temperature bei OpenAI entfernen
say "2) Ersetze response_format → text.format (runtime) & entferne temperature für OpenAI-Aufrufe"
node - <<'NODE'
const fs=require('fs'), path=require('path');
const roots=['features','apps/web/src'];
const rxRf=/"response_format"\s*:\s*{[^}]*}/g;
const rxTemp=/\btemperature\s*:\s*[^,}\n]+,?/g;

function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(/\.(t|j)sx?$/.test(e.name)){
      let t=fs.readFileSync(p,'utf8');
      const before=t;
      // nur laufzeit-relevant ersetzen
      t=t.replace(rxRf, '"text": { format: { type: "json_object" } }');
      // temperature für OpenAI-Kontexte tilgen (generisch ok)
      t=t.replace(rxTemp, '');
      if(t!==before){ fs.writeFileSync(p,t,'utf8'); console.log("  ~",p); }
    }
  }
}
roots.forEach(r=>walk(path.resolve(r)));
NODE

# 3) Route-Handler: Enterprise-Orchestrierung in /api/contributions/analyze
say "3) API-Route erweitert: Enterprise voll; /contributions/new wird auf Top-3 + CTA gekürzt"

node - <<'NODE'
const fs = require('fs'), p=require('path');
const f = p.resolve('apps/web/src/app/api/contributions/analyze/route.ts');
let t = fs.readFileSync(f,'utf8');

if(!/x-origin-path/i.test(t)){
  t = t.replace(
    /(const\s+body\s*=\s*await\s+req\.json\(\)\.catch\(\(\)\s*=>\s*\(\{\}\)\);\s*)/,
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

// Orchestrator-Import einfügen
if(!/from\s+"@?features\/ai\/orchestrator"/.test(t)){
  t = t.replace(/^(import[^\n]*\n)+/,(m)=> m + `import { runOrchestratedTask } from "@features/ai/orchestrator";\n`);
}

// Nach analyzeContribution()-Call Enterprise-Postprocessing einhängen
t = t.replace(
  /const\s+result\s*=\s*await\s+analyzeContribution\([^\)]*\);\s*return\s+NextResponse\.json\(result\);/m,
`const result = await analyzeContribution(String(text || ""), {
    maxClaims,
    model,
    forceFallback: !!forceFallback,
    context: context ?? {}
  });

// Enterprise-Logik: außerhalb von /contributions/new → volle Orchestrierung
const isPayroll = (context?.ui?.route || "").startsWith("/contributions/new");
let out = result;

function dedup(arr){
  const seen=new Set(); const out=[];
  for(const x of arr||[]){
    const k = JSON.stringify([x.url||x.link||x.id||x.text||x.title, x.jurisdiction||x.country||x.source]);
    if(!seen.has(k)){ seen.add(k); out.push(x); }
  }
  return out;
}

if(!isPayroll){
  const tasks = await Promise.allSettled([
    runOrchestratedTask("impact_only", { text, seed: result, context }, { origin: "api.enterprise" }),
    runOrchestratedTask("alternatives_only", { text, seed: result, context }, { origin: "api.enterprise" }),
    runOrchestratedTask("factcheck_de", { text, seed: result, context }, { origin: "api.enterprise" }),
  ]);

  const impact   = tasks[0]?.status==="fulfilled" && tasks[0].value?.ok ? tasks[0].value.parsed : null;
  const alts     = tasks[1]?.status==="fulfilled" && tasks[1].value?.ok ? tasks[1].value.parsed : null;
  const fact     = tasks[2]?.status==="fulfilled" && tasks[2].value?.ok ? tasks[2].value.parsed : null;

  out = { ...out };

  if (impact?.score || impact?.dimensions){
    out.impact = impact;
  }
  if (Array.isArray(alts?.alternatives)){
    out.alternatives = alts.alternatives.filter(a=>a && a.text).slice(0, 12);
  }
  if (fact){
    // Vereinheitlichte Felder für Enterprise
    const sources = dedup([...(fact.sources||[]), ...(out.sources||[])]);
    const legal   = (fact.legalMatrix||fact.legal||[]).map((r:any)=>({
      jurisdiction: r.jurisdiction||r.country||null,
      domain: r.domain||r.topic||null,
      status: r.status||r.position||null,
      lastUpdated: r.lastUpdated||r.updated_at||null,
      sources: r.sources||[],
    }));
    out.sources = sources;
    out.legal   = legal;
    if (!out.news?.length && Array.isArray(fact.news)) out.news = fact.news;
  }

  out._meta = { ...(out._meta||{}), enterprise: { enabled: true } };
}else{
  // Payroll-Modus: top-3 + CTA/Klarfragen
  const top3 = (arr:any[]) => Array.isArray(arr) ? arr.slice(0,3) : [];
  out = {
    ...out,
    claims: top3(out.claims||[]),
    news: top3(out.news||[]),
    _meta: { ...(out._meta||{}), ui: { mode: "payroll" } }
  };
  if(!out.cta){
    out.cta = {
      title: "Präzisieren oder Quellen anfügen?",
      buttons: [{label:"Bereich eingrenzen", value:"refine"}, {label:"Quelle hinzufügen", value:"add_source"}]
    };
  }
}

return NextResponse.json(out);`
);

fs.writeFileSync(f,t,'utf8');
console.log("✅ route.ts Enterprise-Postprocessing aktiv");
NODE

say "4) Build-Cache säubern (nur Web-App) – Empfehlung"
rm -rf "$ROOT/apps/web/.next" 2>/dev/null || true

say "✅ Fertig. Starte neu mit: pnpm --filter @vog/web dev"

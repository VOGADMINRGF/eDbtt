#!/usr/bin/env bash
set -euo pipefail

WEB="apps/web"
SRC="$WEB/src"
UI="$SRC/ui"
GUI="$UI/gamify"
PAGE="$SRC/app/contributions/new/page.tsx"

ts=$(date +%s)
mkdir -p "$GUI" "$(dirname "$PAGE")"

# ---------- XP Bar ----------
cat > "$GUI/XPBar.tsx" <<'TS'
"use client";
import React from "react";
export default function XPBar({xp=0, level=1}:{xp:number; level?:number}) {
  const pct = Math.max(0, Math.min(100, xp));
  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold">Level {level}</span>
        <span className="tabular-nums">{pct}% XP</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full transition-all duration-500"
             style={{width: pct+"%", background:
              "linear-gradient(90deg,#00e6a7,#4f46e5,#06b6d4)"}}/>
      </div>
    </div>
  );
}
TS

# ---------- Confetti (leichtgewichtig) ----------
cat > "$GUI/Confetti.tsx" <<'TS'
"use client";
import React from "react";
export default function Confetti({go}:{go:boolean}) {
  const [show,setShow]=React.useState(false);
  React.useEffect(()=>{ if(go){ setShow(true); const t=setTimeout(()=>setShow(false),1200); return ()=>clearTimeout(t);} },[go]);
  if(!show) return null;
  const bits = Array.from({length:18}, (_,i)=>i);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {bits.map(i=>(
        <span key={i}
          className="absolute text-2xl animate-[float_1.2s_ease-in-out_forwards]"
          style={{
            left: (5+Math.random()*90)+"%",
            top: "20%",
            transform: `translateY(-50%) rotate(${Math.random()*180}deg)`
          }}>
          {["🎉","✨","🎊","⭐️","💫"][i%5]}
        </span>
      ))}
      <style jsx>{`
        @keyframes float { from{ transform: translateY(-50%) scale(1); opacity:1;}
                           to  { transform: translateY(120%)  scale(0.9); opacity:0;} }
      `}</style>
    </div>
  );
}
TS

# ---------- Quest Card ----------
cat > "$GUI/QuestCard.tsx" <<'TS'
"use client";
import React from "react";
export default function QuestCard({title,subtitle,children,step}:{title:string;subtitle?:string;children:React.ReactNode;step:number}) {
  return (
    <div className="vog-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Quest {step}</div>
          <div className="font-semibold">{title}</div>
          {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
        </div>
        <div className="text-2xl">🎯</div>
      </div>
      {children}
    </div>
  );
}
TS

# ---------- ChoiceBadge ----------
cat > "$GUI/ChoiceBadge.tsx" <<'TS'
"use client";
import React from "react";
export default function ChoiceBadge({icon,label,active,onClick}:{icon:string;label:string;active?:boolean;onClick?:()=>void}) {
  return (
    <button type="button" onClick={onClick}
      className={"px-3 py-1 rounded-full border text-sm transition-all " +
        (active ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                : "bg-white hover:bg-slate-50 border-slate-300")}>
      <span className="mr-1">{icon}</span>{label}
    </button>
  );
}
TS

# ---------- GameHUD ----------
cat > "$GUI/GameHUD.tsx" <<'TS'
"use client";
import React from "react";
import XPBar from "./XPBar";
export default function GameHUD({xp,level,step}:{xp:number; level:number; step:number}) {
  return (
    <div className="vog-card p-3 flex items-center gap-4 sticky top-3 z-30">
      <div className="text-xl">🕹️</div>
      <div className="flex-1"><XPBar xp={xp} level={level}/></div>
      <div className="text-sm"><span className="text-slate-500">Step</span> <span className="font-semibold">{step}/4</span></div>
    </div>
  );
}
TS

# ---------- (optionale) Chat Bubble ----------
cat > "$UI/ChatBubble.tsx" <<'TS'
"use client";
import React from "react";
export default function ChatBubble({role="assistant",children}:{role?:"assistant"|"user";children:React.ReactNode}) {
  const isUser = role === "user";
  return (
    <div className={"flex mb-2 " + (isUser ? "justify-end" : "justify-start")}>
      <div className={(isUser?"bg-sky-600 text-white":"bg-slate-100 text-slate-800")+" rounded-2xl px-3 py-2 max-w-[680px] text-sm leading-relaxed"}>
        {children}
      </div>
    </div>
  );
}
TS

# ---------- ClarifyPanel (gamified: Emojis + Freitext bei Sonstiges, dezentes 'Überspringen') ----------
cat > "$UI/ClarifyPanel.tsx" <<'TS'
"use client";
import React from "react";
import ChoiceBadge from "./gamify/ChoiceBadge";

export type ClarifySuggestions = { level?: "EU"|"Bund"|"Land"|"Kommune"|null; regionGuess?: string|null; period?: "aktuell"|"12m"|"5y"|"seit1990"|null; };
export type ClarifyAnswers     = { level?: string|null; region?: string|null; period?: string|null; };

export default function ClarifyPanel({suggestions,value,onChange}:{suggestions:ClarifySuggestions|null; value:ClarifyAnswers; onChange:(v:ClarifyAnswers)=>void;}) {
  const set = (patch:Partial<ClarifyAnswers>) => onChange({...value,...patch});
  const [rOpen,setROpen]=React.useState(false), [pOpen,setPOpen]=React.useState(false);
  const lvl=value.level ?? suggestions?.level ?? null;
  const reg=value.region ?? suggestions?.regionGuess ?? "";
  const per=value.period ?? suggestions?.period ?? null;

  return (
    <div className="space-y-5">
      {/* Ebene */}
      <div>
        <div className="text-xs text-slate-500 mb-1">EBENE/ZUSTÄNDIGKEIT</div>
        <div className="flex flex-wrap gap-2">
          {[["EU","🇪🇺"],["Bund","🇩🇪"],["Land","🏴"],["Kommune","🏙️"]].map(([k,ic])=>(
            <ChoiceBadge key={k} icon={String(ic)} label={String(k)} active={lvl===k} onClick={()=>set({level:String(k)})}/>
          ))}
          <ChoiceBadge icon="✨" label="Sonstiges…" active={!!value.level && !["EU","Bund","Land","Kommune"].includes(value.level)} onClick={()=>set({level:value.level??"Sonstiges"})}/>
          <button className="text-xs underline decoration-dotted ml-2 text-slate-500" type="button" onClick={()=>set({level:null})}>Überspringen</button>
        </div>
        {value.level && !["EU","Bund","Land","Kommune"].includes(value.level) && (
          <input className="mt-2 w-full border rounded-xl px-3 py-2"
                 placeholder="Ebene präzisieren (z. B. Verband, Hochschulrat …)"
                 value={value.level} onChange={e=>set({level:e.target.value})}/>
        )}
      </div>

      {/* Region */}
      <div>
        <div className="text-xs text-slate-500 mb-1">ORT/REGION</div>
        <div className="flex flex-wrap gap-2">
          <ChoiceBadge icon="🗺️" label="Bundesweit" active={reg==="Bundesweit"} onClick={()=>set({region:"Bundesweit"})}/>
          {suggestions?.regionGuess && suggestions.regionGuess!=="Bundesweit" && (
            <ChoiceBadge icon="📍" label={suggestions.regionGuess!} active={reg===suggestions.regionGuess} onClick={()=>set({region:suggestions.regionGuess!})}/>
          )}
          <ChoiceBadge icon="✏️" label="Stadt/Region…" active={rOpen || (!!reg && reg!=="Bundesweit" && reg!==suggestions?.regionGuess)} onClick={()=>setROpen(v=>!v)}/>
          <button className="text-xs underline decoration-dotted ml-2 text-slate-500" type="button" onClick={()=>{set({region:null}); setROpen(false);}}>Überspringen</button>
        </div>
        {(rOpen || (!!reg && reg!=="Bundesweit" && reg!==suggestions?.regionGuess)) && (
          <input className="mt-2 w-full border rounded-xl px-3 py-2" placeholder="z. B. Berlin, München, Kreis XY …"
                 value={rOpen? (value.region??"") : reg} onChange={e=>set({region:e.target.value})}/>
        )}
      </div>

      {/* Zeitraum */}
      <div>
        <div className="text-xs text-slate-500 mb-1">ZEITRAUM</div>
        <div className="flex flex-wrap gap-2">
          {[
            ["aktuell","🕒 Aktuell"],["12m","📆 Letzte 12 Monate"],["5y","🗓️ Letzte 5 Jahre"],["seit1990","📜 Seit 1990"]
          ].map(([k,l])=>(
            <ChoiceBadge key={k} icon={l.split(" ")[0]} label={l.split(" ").slice(1).join(" ")} active={per===k} onClick={()=>set({period:String(k)})}/>
          ))}
          <ChoiceBadge icon="✏️" label="Sonstiges…" active={pOpen || (!!per && !["aktuell","12m","5y","seit1990"].includes(String(per)))} onClick={()=>setPOpen(v=>!v)}/>
          <button className="text-xs underline decoration-dotted ml-2 text-slate-500" type="button" onClick={()=>{set({period:null}); setPOpen(false);}}>Überspringen</button>
        </div>
        {(pOpen || (!!per && !["aktuell","12m","5y","seit1990"].includes(String(per)))) && (
          <input className="mt-2 w-full border rounded-xl px-3 py-2" placeholder="z. B. 2015–2018, nach 2020 …"
                 value={pOpen? (value.period??"") : String(per??"")} onChange={e=>set({period:e.target.value})}/>
        )}
      </div>
    </div>
  );
}
TS

# ---------- ClaimPanelsGate (no change if already present; harmless overwrite) ----------
cat > "$UI/ClaimPanelsGate.tsx" <<'TS'
"use client";
import React from "react";
export default function ClaimPanelsGate({show,children}:{show:boolean;children:React.ReactNode}) {
  if(!show) return null;
  return <>{children}</>;
}
TS

# ---------- Page.tsx (gamified flow) ----------
if [ -f "$PAGE" ]; then cp "$PAGE" "$PAGE.bak.$ts"; fi
cat > "$PAGE" <<'TS'
"use client";

import React from "react";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";

import ClaimPanelsGate from "@/ui/ClaimPanelsGate";
import InPlaceHUD from "@/ui/InPlaceHUD";
import ChatBubble from "@/ui/ChatBubble";
import ClarifyPanel, { ClarifyAnswers, ClarifySuggestions } from "@/ui/ClarifyPanel";

import GameHUD from "@/ui/gamify/GameHUD";
import QuestCard from "@/ui/gamify/QuestCard";
import Confetti from "@/ui/gamify/Confetti";

type Claim = { text: string; confidence?: number; meta?: any };

export default function ContributionNewPage() {
  // Steps: 1 draft → 2 clarify → 3 review → 4 panels
  type Step = "draft" | "clarify" | "review" | "panels";
  const [step, setStep] = React.useState<Step>("draft");

  // XP / Level (mini-gamification)
  const [xp, setXP] = React.useState<number>(0);
  const level = 1 + Math.floor(xp / 100);

  // Input / Results
  const [text, setText] = React.useState<string>(
    typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("text") ?? "") : ""
  );
  const [claims, setClaims] = React.useState<Claim[]>([]);
  const [activeClaimIdx, setActiveClaimIdx] = React.useState<number>(0);

  // UX / HUD
  const [analyzing, setAnalyzing] = React.useState<boolean>(false);
  const [hud, setHud] = React.useState<string[]>([]);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [celebrate, setCelebrate] = React.useState(false);

  // Clarify
  const [clarifySuggestions, setClarifySuggestions] = React.useState<ClarifySuggestions | null>(null);
  const [clarify, setClarify] = React.useState<ClarifyAnswers>({});

  const activeClaim = (claims && claims[activeClaimIdx]) ?? null;
  const canShowPanels = step === "panels" && !!activeClaim?.text && !analyzing;

  React.useEffect(() => {
    if (activeClaimIdx > claims.length - 1) setActiveClaimIdx(Math.max(0, claims.length - 1));
  }, [claims.length, activeClaimIdx]);

  function pushHud(line: string) { setHud((h) => [...h.slice(-6), line]); }

  async function fetchClarify(txt: string) {
    try{
      const r = await fetch("/api/quality/clarify", { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ text: txt }) });
      const j = await r.json().catch(()=>({}));
      const s: ClarifySuggestions = { level: j?.level ?? null, regionGuess: j?.region ?? j?.city ?? j?.state ?? null, period: j?.period ?? null };
      setClarifySuggestions(s);
    }catch{ setClarifySuggestions(null); }
  }

  async function runAnalysis() {
    const t0 = Date.now();
    setAnalyzing(true); setErrorMsg(null); setClaims([]); setActiveClaimIdx(0); setHud([]);
    try{
      pushHud("Vorprüfung: Text säubern & Parameter setzen …");
      const payload = { text: String(text || "").slice(0, 8000), maxClaims: 4 };
      pushHud("Analyse: Modelle orchestrieren & Claim(s) extrahieren …");
      const res = await fetch("/api/contributions/analyze?mode=multi&clarify=1", { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload) });
      const j = await res.json().catch(()=>({}));
      const apiClaims: Claim[] = Array.isArray(j?.claims) ? j.claims : [];
      const cleaned = apiClaims.map((c)=>({ text: String((c as any)?.text ?? "").trim(), confidence:(c as any)?.confidence, meta:(c as any)?.meta })).filter(c=>c.text.length>0);
      if(cleaned.length===0){ if(text.trim()){ cleaned.push({text:text.trim()}); pushHud("Hinweis: Kein strukturierter Claim gefunden – Fallback verwendet."); } else { pushHud("Hinweis: Kein Inhalt – bitte Text eingeben."); } }
      setClaims(cleaned); setActiveClaimIdx(0);
      const took = ((Date.now()-t0)/1000).toFixed(1);
      pushHud(`Fertig: ${cleaned.length} Claim(s) erkannt · ${took}s`);
      setXP(x=>Math.min(100, x+20));        // Reward
      setStep("clarify");
      fetchClarify(payload.text);
    }catch(e:any){ const msg=String(e?.message||e); setErrorMsg(msg); pushHud("Fehler: "+msg); }
    finally{ setAnalyzing(false); }
  }

  function clickClaim(i:number){
    setActiveClaimIdx(i);
    setXP(x=>Math.min(100, x+10));
  }

  function goNextFromClarify(){ setXP(x=>Math.min(100, x+10)); setStep("review"); }
  function goPanels(){ if(activeClaim?.text){ setStep("panels"); setXP(x=>Math.min(100, x+30)); setCelebrate(true); setTimeout(()=>setCelebrate(false), 1300);} }

  function goQuick(){
    const claimText=(activeClaim?.text || text || "").slice(0,500);
    const u=new URL("/statements/new", window.location.origin);
    if(claimText) u.searchParams.set("text", claimText);
    if(clarify.level)  u.searchParams.set("level",  String(clarify.level));
    if(clarify.region) u.searchParams.set("region", String(clarify.region));
    if(clarify.period) u.searchParams.set("period", String(clarify.period));
    window.location.href=u.toString();
  }

  // --- UI -------------------------------------------------------------------
  const stepIndex = step==="draft"?1 : step==="clarify"?2 : step==="review"?3 : 4;

  return (
    <div className="container-vog">
      <Confetti go={celebrate}/>
      <h1 className="vog-head mb-4">Beitrag erstellen &amp; analysieren</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <GameHUD xp={xp} level={level} step={stepIndex} />

          {/* Quest 1: Text */}
          <QuestCard step={1} title="Schreib deine These" subtitle="Kurz & klar – wir holen die Details.">
            <textarea className="w-full min-h-[160px] rounded-2xl border p-3"
                      placeholder="Schreibe deinen Beitrag/These…" value={text}
                      onChange={(e)=>setText(e.target.value)} />
            <InPlaceHUD log={hud} analyzing={analyzing}/>
            <div className="flex gap-2 items-center mt-2">
              <button className="vog-btn-pri" onClick={runAnalysis} disabled={!text || analyzing}>
                {analyzing? "Analysiere…" : "Analyse starten"}
              </button>
              <button className="vog-btn" onClick={goQuick} disabled={!text} title="Direkt mit dem ersten Claim weiter">
                Schnell-Flow
              </button>
            </div>
            {errorMsg && <div className="text-sm text-red-600 mt-1">{errorMsg}</div>}
          </QuestCard>

          {/* Quest 2: Klarifizieren */}
          {step!=="draft" && (
            <QuestCard step={2} title="Kläre ein paar Eckdaten"
                       subtitle="Nur falls es passt – du kannst jederzeit überspringen.">
              <ChatBubble role="assistant">
                Ich habe Vorschläge erkannt. Du kannst sie übernehmen, präzisieren oder überspringen.
              </ChatBubble>
              <ClarifyPanel suggestions={clarifySuggestions} value={clarify} onChange={setClarify}/>
              <div className="flex gap-2 pt-2">
                <button className="vog-btn-pri" onClick={goNextFromClarify}>Weiter</button>
                <button className="vog-btn" onClick={()=>{ setClarify({}); setClarifySuggestions(null); }}>Zurücksetzen</button>
              </div>
            </QuestCard>
          )}

          {/* Quest 3: Claim wählen */}
          {step!=="draft" && claims.length>0 && (
            <QuestCard step={3} title="Wähle den besten Claim" subtitle="Du kannst später wechseln.">
              <div className="flex flex-wrap gap-2">
                {claims.map((c,i)=>(
                  <button key={i}
                          className={"vog-chip " + (i===activeClaimIdx? "ring-2 ring-sky-400":"")}
                          onClick={()=>clickClaim(i)} title={c.text}>
                    Claim {i+1}
                  </button>
                ))}
              </div>
              {step==="review" && (
                <div className="pt-3">
                  <button className="vog-btn" onClick={goPanels} disabled={!activeClaim?.text}>
                    Weiter: Alternativen & Einwände anzeigen
                  </button>
                </div>
              )}
            </QuestCard>
          )}

          {/* Quest 4: Panels */}
          <ClaimPanelsGate show={canShowPanels}>
            {activeClaim?.text && (
              <QuestCard step={4} title="Deine Sicht im Kontext" subtitle="Erkunde Lager, Alternativen & Einwände.">
                <StanceSpectrum claimText={activeClaim.text}/>
                <div className="h-3"/>
                <ObjectionCollector/>
              </QuestCard>
            )}
          </ClaimPanelsGate>
        </div>

        {/* rechte Spalte – vorerst nur Hinweis; News/Essenz bewusst entfernt */}
        <div className="space-y-3">
          <div className="vog-card p-4 text-sm">
            <div className="font-semibold mb-1">Tip</div>
            Kurze, konkrete Sätze helfen der Analyse. Emojis sind erlaubt ✨
          </div>
        </div>
      </div>
    </div>
  );
}
TS

echo "✓ Gamify bundle installiert."
echo "   Backup von page.tsx: $PAGE.bak.$ts"

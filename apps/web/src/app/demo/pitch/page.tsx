"use client";
import React from "react";
import SmartClaimCard from "@/components/analyze/SmartClaimCard";
import ClarifyPanel from "@/components/analyze/ClarifyPanel";
import NewsFeedPanel from "@/components/analyze/NewsFeedPanel";
import StanceSpectrum from "@/components/analyze/StanceSpectrum";
import ObjectionCollector from "@/components/analyze/ObjectionCollector";
import CounterSynth from "@/components/analyze/CounterSynth";
import AutopilotDialog from "@/components/analyze/AutopilotDialog";

type Claim={ text:string; categoryMain?:string|null; categorySubs?:string[]|null; region?:string|null; authority?:string|null };
type Res={ language?:string; mainTopic?:string|null; subTopics?:string[]; regionHint?:string|null; claims?:Claim[]; followUps?:string[]; _meta?:{picked?:string|null} };

export default function PitchPage(){
  const [text,setText]=React.useState("Kostenloser Nahverkehr in Berlin und bessere Straßenbahn-Anbindung.");
  const [res,setRes]=React.useState<Res|null>(null);
  const [busy,setBusy]=React.useState(false);
  const [openAuto,setOpenAuto]=React.useState(false);
  async function analyze(clarify:boolean){
    setBusy(true);
    const r=await fetch(`/api/contributions/analyze?mode=multi${clarify?"&clarify=1":""}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({text, maxClaims:6})});
    const j=await r.json(); setRes(j); setBusy(false);
  }
  function useStatement(s:string){ const u=new URL("/statements/new", window.location.origin); u.searchParams.set("text", s); window.location.assign(u) }

  return (
    <div className="container-vog">
      <h1 className="vog-head mb-2">Pitch-Modus: eDebatte Journey</h1>
      <div className="text-sm text-slate-600 mb-4">Geführter Flow (Demo) – Narrative-Breaker, Einwände, Stances, Coins & Autopilot</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="vog-card p-4">
            <div className="vog-stepper mb-2"><span className="dot active"></span>Eingabe → <span className="dot"></span>Analyse → <span className="dot"></span>Auswahl → <span className="dot"></span>Feinschliff → <span className="dot"></span>Veröffentlichen</div>
            <textarea className="w-full min-h-[160px] rounded-2xl border p-3" value={text} onChange={e=>setText(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button className="vog-btn-pri" onClick={()=>analyze(false)} disabled={busy||!text}>Analyse starten</button>
              <button className="vog-btn" onClick={()=>analyze(true)} disabled={busy||!text}>+ Klärungsfragen</button>
              <button className="vog-btn-ghost ml-auto" onClick={()=>setOpenAuto(true)}>Abbrechen – eDebatte übernimmt</button>
            </div>
          </div>
          {res && (
            <div className="space-y-3">
              <div className="vog-card p-4"><div className="font-semibold">Ergebnis • Sprache: {res.language ?? "—"} • Hauptthema: {res.mainTopic ?? "—"} {res._meta?.picked?<>• Pipeline: {res._meta?.picked}</> : null}</div></div>
              {(res.claims||[]).map((c,i)=>(
                <div key={i} className="space-y-2">
                  <div className="text-xs text-slate-500">Aussage {i+1}</div>
                  <SmartClaimCard claim={c} onUse={useStatement}/>
                </div>
              ))}
              <ClarifyPanel questions={res.followUps}/>
              <StanceSpectrum claimText={text}/>
              <ObjectionCollector/>
              <CounterSynth text={text}/>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <NewsFeedPanel topic={res?.mainTopic||"ÖPNV"} region={res?.regionHint||"DE:BE"} keywords={res?.subTopics||[]} />
          <div className="vog-card p-4 text-sm">
            <div className="font-semibold mb-1">Nächste Schritte</div>
            <ol className="list-decimal ml-5 space-y-1">
              <li>Claim wählen (verifiziert/cluster/neu)</li>
              <li>Fehlende Lager im Spektrum füllen (Coins)</li>
              <li>Faktencheck &amp; Belege ergänzen</li>
              <li>Veröffentlichen</li>
            </ol>
          </div>
        </div>
      </div>
      <AutopilotDialog open={openAuto} onClose={()=>setOpenAuto(false)} text={text}/>
    </div>
  );
}
